"use client"
import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export type Roadmap = { id: string; user_id: string; title: string; description: string | null; quarter: string | null; status: string; color: string; created_at: string }
export type Milestone = { id: string; roadmap_id: string; user_id: string; title: string; description: string | null; due_date: string | null; completed: boolean; order_index: number }

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
    if (e1 && (e1.code === "PGRST205" || e1.message.includes("Could not find"))) {
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

  async function createRoadmap(title: string, quarter: string) {
    if (!title.trim()) return
    if (isSupabase && supabase && userId) {
      const { error } = await supabase.from("roadmaps").insert({ user_id: userId, title: title.trim(), quarter, status: "active" })
      if (error) console.error(error.message)
      await refresh()
    } else {
      setRoadmaps(r => [...r, { id: Math.random().toString(36).slice(2, 9), user_id: "local", title: title.trim(), description: null, quarter, status: "active", color: "#0A0A0A", created_at: new Date().toISOString() }])
    }
  }

  async function addMilestone(roadmapId: string, title: string) {
    if (!title.trim()) return
    if (isSupabase && supabase && userId) {
      const maxOrder = milestones.filter(m => m.roadmap_id === roadmapId).length
      const { error } = await supabase.from("milestones").insert({ roadmap_id: roadmapId, user_id: userId, title: title.trim(), order_index: maxOrder })
      if (error) console.error(error.message)
      await refresh()
    } else {
      setMilestones(m => [...m, { id: Math.random().toString(36).slice(2, 9), roadmap_id: roadmapId, user_id: "local", title: title.trim(), description: null, due_date: null, completed: false, order_index: m.filter(x => x.roadmap_id === roadmapId).length }])
    }
  }

  async function toggleMilestone(id: string) {
    const ms = milestones.find(m => m.id === id)
    if (!ms) return
    if (isSupabase && supabase) {
      await supabase.from("milestones").update({ completed: !ms.completed, completed_at: !ms.completed ? new Date().toISOString() : null }).eq("id", id)
      await refresh()
    } else {
      setMilestones(m => m.map(x => x.id === id ? { ...x, completed: !x.completed } : x))
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

  return { roadmaps, milestones, loading, isSupabase, createRoadmap, addMilestone, toggleMilestone, deleteRoadmap, refresh }
}
