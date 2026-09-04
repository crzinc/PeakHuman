"use client"
import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export type RitualRow = {
  id: string
  user_id: string
  date: string
  morning_done: boolean
  morning_at: string | null
  morning_intention: string | null
  morning_top3: string[]
  morning_energy: number | null
  evening_done: boolean
  evening_at: string | null
  evening_reflection: string | null
  evening_gratitude: string | null
  evening_score: number | null
  evening_lesson: string | null
}

const LS_KEY = "peakhuman:rituals"

function loadLocal(): Record<string, RitualRow> {
  try { const v = localStorage.getItem(LS_KEY); return v ? JSON.parse(v) : {} } catch { return {} }
}
function saveLocal(m: Record<string, RitualRow>) { localStorage.setItem(LS_KEY, JSON.stringify(m)) }

export function useRituals() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [rituals, setRituals] = useState<Record<string, RitualRow>>({})
  const [loading, setLoading] = useState(true)
  const [isSupabase, setIsSupabase] = useState(false)

  const refresh = useCallback(async () => {
    if (!supabase) { setRituals(loadLocal()); setLoading(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setRituals(loadLocal()); setUserId(null); setLoading(false); return }
    setUserId(user.id)
    const { data, error } = await supabase.from("daily_rituals").select("*")
    if (error) {
      if (error.code === "PGRST205" || error.message.includes("Could not find")) {
        setIsSupabase(false)
        setRituals(loadLocal())
      } else {
        console.warn("rituals fetch", error.message)
        setRituals(loadLocal())
      }
      setLoading(false)
      return
    }
    setIsSupabase(true)
    const map: Record<string, RitualRow> = {}
    ;(data as RitualRow[])?.forEach(r => { map[r.date] = r })
    setRituals(map)
    setLoading(false)
  }, [supabase])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refresh() }, [refresh])

  useEffect(() => {
    if (!isSupabase || !userId || !supabase) return
    const ch = supabase.channel("rituals").on("postgres_changes", { event: "*", schema: "public", table: "daily_rituals" }, refresh).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [isSupabase, userId, supabase, refresh])

  useEffect(() => {
    if (!isSupabase) saveLocal(rituals)
  }, [rituals, isSupabase])

  async function upsert(date: string, patch: Partial<RitualRow>) {
    if (isSupabase && supabase && userId) {
      const existing = rituals[date]
      const payload: Record<string, unknown> = { user_id: userId, date, ...patch, updated_at: new Date().toISOString() }
      if (existing) {
        const { error } = await supabase.from("daily_rituals").update(payload).eq("user_id", userId).eq("date", date)
        if (error) console.error(error.message)
      } else {
        const { error } = await supabase.from("daily_rituals").insert(payload)
        if (error) console.error(error.message)
      }
      await refresh()
    } else {
      setRituals(prev => {
        const cur = prev[date] ?? { id: date, user_id: "local", date, morning_done: false, morning_at: null, morning_intention: null, morning_top3: [], morning_energy: null, evening_done: false, evening_at: null, evening_reflection: null, evening_gratitude: null, evening_score: null, evening_lesson: null } as RitualRow
        return { ...prev, [date]: { ...cur, ...patch } as RitualRow }
      })
    }
  }

  return { rituals, loading, isSupabase, upsert, refresh, userId }
}
