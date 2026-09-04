"use client"
import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export type Roadmap = {
  id: string
  user_id: string
  title: string
  description: string | null
  quarter: string | null
  start_date: string | null
  end_date: string | null
  status: string
  color: string
  created_at: string
}
export type Milestone = {
  id: string
  roadmap_id: string
  user_id: string
  title: string
  description: string | null
  start_date: string | null
  due_date: string | null
  completed: boolean
  order_index: number
}

const LS_RM = "peakhuman:roadmaps"
const LS_MS = "peakhuman:milestones"

function load<T>(k: string, f: T): T { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f } catch { return f } }
function save(k: string, v: unknown) { localStorage.setItem(k, JSON.stringify(v)) }

export function useRoadmaps() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [isSupabase, setIsSupabase] = useState(false)

  const refresh = useCallback(async () => {
    if (!supabase) { setRoadmaps(load(LS_RM, [])); setMilestones(load(LS_MS, [])); setLoading(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setRoadmaps(load(LS_RM, [])); setMilestones(load(LS_MS, [])); setUserId(null); setLoading(false); return }
    setUserId(user.id)
    const [{ data: rm, error: e1 }, { data: ms, error: e2 }] = await Promise.all([
      supabase.from("roadmaps").select("*").order("created_at"),
      supabase.from("milestones").select("*").order("order_index"),
    ])
    if (e1 && (e1.code === "PGRST205" || e1.message.includes("Could not find") || e1.code === "42703")) {
      setIsSupabase(false); setRoadmaps(load(LS_RM, [])); setMilestones(load(LS_MS, [])); setLoading(false); return
    }
    if (e1 || e2) { console.warn(e1?.message, e2?.message); setIsSupabase(false); setRoadmaps(load(LS_RM, [])); setMilestones(load(LS_MS, [])); setLoading(false); return }
    setIsSupabase(true)
    setRoadmaps((rm as Roadmap[]) ?? [])
    setMilestones((ms as Milestone[]) ?? [])
    setLoading(false)
  }, [supabase])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => { if (!isSupabase) { save(LS_RM, roadmaps); save(LS_MS, milestones) } }, [roadmaps, milestones, isSupabase])

  async function createRoadmap(params: { title: string; description?: string; quarter: string; start_date?: string | null; end_date?: string | null; color?: string }) {
    if (!params.title.trim()) return
    const payload: Record<string, unknown> = {
      title: params.title.trim(),
      description: params.description?.trim() || null,
      quarter: params.quarter,
      start_date: params.start_date || null,
      end_date: params.end_date || null,
      color: params.color || "#0A0A0A",
      status: "active",
    }
    // Ensure we have userId even if state not yet set
    let uid = userId
    if (!uid && supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      uid = user?.id ?? null
      if (uid) setUserId(uid)
    }
    if (isSupabase && supabase && uid) {
      const { error } = await supabase.from("roadmaps").insert({ user_id: uid, ...payload })
      if (error) {
        console.error("createRoadmap", error.message, error.code)
        const isMissingCol = error.code === "42703" || error.code === "PGRST204" || error.message.includes("Could not find")
        if (isMissingCol) {
          // fallback без новых колонок — миграция ещё не запущена
          const { error: e2 } = await supabase.from("roadmaps").insert({ user_id: uid, title: params.title.trim(), description: params.description?.trim() || null, quarter: params.quarter, color: params.color || "#0A0A0A", status: "active" })
          if (e2) {
            console.error("fallback createRoadmap", e2.message)
            alert("Не удалось создать роадмап: " + e2.message + "\nЗапусти supabase/migration_roadmap_dates.sql")
            return
          }
        } else {
          alert("Не удалось создать роадмап: " + error.message)
          return
        }
      }
      await refresh()
    } else if (supabase && uid) {
      // isSupabase false but we have user — try Supabase anyway (fallback mode before)
      const { error } = await supabase.from("roadmaps").insert({ user_id: uid, title: params.title.trim(), quarter: params.quarter, status: "active", description: params.description?.trim() || null })
      if (error) console.error(error.message)
      await refresh()
    } else {
      setRoadmaps(r => [...r, {
        id: Math.random().toString(36).slice(2, 9),
        user_id: "local",
        title: params.title.trim(),
        description: params.description?.trim() || null,
        quarter: params.quarter,
        start_date: params.start_date || null,
        end_date: params.end_date || null,
        status: "active",
        color: params.color || "#0A0A0A",
        created_at: new Date().toISOString(),
      }])
    }
  }

  async function updateRoadmap(id: string, patch: Partial<Omit<Roadmap, "id" | "user_id" | "created_at">>) {
    if (isSupabase && supabase) {
      const { error } = await supabase.from("roadmaps").update(patch).eq("id", id)
      if (error) console.error(error.message)
      await refresh()
    } else {
      setRoadmaps(r => r.map(x => x.id === id ? { ...x, ...patch } : x) as Roadmap[])
    }
  }

  async function addMilestone(roadmapId: string, title: string, due_date?: string | null) {
    if (!title.trim()) return
    if (isSupabase && supabase && userId) {
      const maxOrder = milestones.filter(m => m.roadmap_id === roadmapId).length
      const { error } = await supabase.from("milestones").insert({ roadmap_id: roadmapId, user_id: userId, title: title.trim(), due_date: due_date || null, order_index: maxOrder })
      if (error) console.error(error.message)
      await refresh()
    } else {
      setMilestones(m => [...m, { id: Math.random().toString(36).slice(2, 9), roadmap_id: roadmapId, user_id: "local", title: title.trim(), description: null, start_date: null, due_date: due_date || null, completed: false, order_index: m.filter(x => x.roadmap_id === roadmapId).length }])
    }
  }

  async function updateMilestone(id: string, patch: Partial<Omit<Milestone, "id" | "roadmap_id" | "user_id">>) {
    if (isSupabase && supabase) {
      const { error } = await supabase.from("milestones").update(patch).eq("id", id)
      if (error) console.error(error.message)
      await refresh()
    } else {
      setMilestones(m => m.map(x => x.id === id ? { ...x, ...patch } : x) as Milestone[])
    }
  }

  async function toggleMilestone(id: string) {
    const ms = milestones.find(m => m.id === id)
    if (!ms) return
    await updateMilestone(id, { completed: !ms.completed } as Partial<Milestone>)
  }

  async function deleteMilestone(id: string) {
    if (isSupabase && supabase) {
      await supabase.from("milestones").delete().eq("id", id)
      await refresh()
    } else {
      setMilestones(m => m.filter(x => x.id !== id))
    }
  }

  async function deleteRoadmap(id: string) {
    if (isSupabase && supabase) {
      await supabase.from("roadmaps").delete().eq("id", id)
      await refresh()
    } else {
      setRoadmaps(r => r.filter(x => x.id !== id)); setMilestones(m => m.filter(x => x.roadmap_id !== id))
    }
  }

  async function reorderMilestones(roadmapId: string, fromIndex: number, toIndex: number) {
    const list = milestones.filter(m => m.roadmap_id === roadmapId).sort((a, b) => a.order_index - b.order_index)
    const moved = list.splice(fromIndex, 1)[0]
    if (!moved) return
    list.splice(toIndex, 0, moved)
    const updated = list.map((m, i) => ({ ...m, order_index: i }))
    if (isSupabase && supabase) {
      for (const m of updated) await supabase.from("milestones").update({ order_index: m.order_index }).eq("id", m.id)
      await refresh()
    } else {
      setMilestones(prev => {
        const others = prev.filter(m => m.roadmap_id !== roadmapId)
        return [...others, ...updated]
      })
    }
  }

  return { roadmaps, milestones, loading, isSupabase, createRoadmap, updateRoadmap, addMilestone, updateMilestone, toggleMilestone, deleteMilestone, deleteRoadmap, reorderMilestones, refresh }
}
