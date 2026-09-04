"use client"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export type HabitRow = { id: string; user_id: string; title: string; created_at: string }
export type MetricRow = { user_id: string; date: string; energy: number; sleep_hours: number; focus: number; mood: number; peak_score: number; note: string | null }
export type LogRow = { habit_id: string; user_id: string; date: string }

export function useSupabaseData() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [habits, setHabits] = useState<HabitRow[]>([])
  const [metrics, setMetrics] = useState<MetricRow[]>([])
  const [logs, setLogs] = useState<LogRow[]>([])

  const supabase = createClient()

  const refresh = useCallback(async () => {
    if (!supabase) { setLoading(false); return }
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u ? { id: u.id, email: u.email ?? undefined } : null)
    if (!u) { setLoading(false); return }
    const [{ data: h }, { data: m }, { data: l }] = await Promise.all([
      supabase.from("habits").select("*").order("created_at"),
      supabase.from("daily_metrics").select("*").order("date"),
      supabase.from("habit_logs").select("*"),
    ])
    if (h) setHabits(h as HabitRow[])
    if (m) setMetrics(m as unknown as MetricRow[])
    if (l) setLogs(l as LogRow[])
    setLoading(false)
  }, [supabase])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refresh() }, [refresh])

  // realtime
  useEffect(() => {
    if (!supabase || !user) return
    const ch = supabase.channel("peakhuman")
      .on("postgres_changes", { event: "*", schema: "public", table: "habits" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "habit_logs" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_metrics" }, refresh)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [supabase, user, refresh])

  return { user, loading, habits, metrics, logs, refresh, supabase }
}
