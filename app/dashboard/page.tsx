"use client"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn, calculatePeakScore, getTodayKey } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useSupabaseData } from "@/lib/hooks/useSupabaseData"
import { Plus, Check, Flame, Trash2, LogOut, Sparkles, Moon, Zap, Target, TrendingUp, Calendar, Award, Settings, Download, LayoutGrid, Map } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import { RitualCards } from "@/components/ritual-cards"

type Habit = { id: string; title: string }
type DayEntry = { energy: number; sleep: number; focus: number; mood: number; note: string; peakScore: number; date: string }

const DEFAULT_TITLES = ["Медитация 10 мин", "Тренировка", "Чтение 30 мин", "Без сахара"]
const TEMPLATES = [
  { label: "Фокус", habits: ["Глубокая работа 2ч", "Без соцсетей до 12:00", "Чтение 30 мин"] },
  { label: "Тело", habits: ["Тренировка", "10k шагов", "Без сахара"] },
  { label: "Разум", habits: ["Медитация 10 мин", "Дневник", "Чтение 30 мин"] },
  { label: "База", habits: DEFAULT_TITLES },
]

const STORAGE = { habits: "peakhuman:habits", metrics: "peakhuman:metrics", logs: "peakhuman:logs" }
function load<T>(k: string, f: T): T { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f } catch { return f } }
function save(k: string, v: unknown) { localStorage.setItem(k, JSON.stringify(v)) }

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, loading: authLoading, habits: remoteHabits, metrics: remoteMetrics, logs: remoteLogs, refresh } = useSupabaseData()

  const isAuthed = !!user
  const todayKey = getTodayKey()
  const todayLabel = useMemo(() => new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" }), [])

  // local fallback
  const [localHabits, setLocalHabits] = useState<Habit[]>(() => DEFAULT_TITLES.map((t, i) => ({ id: String(i + 1), title: t })))
  const [localMetrics, setLocalMetrics] = useState<Record<string, DayEntry>>({})
  const [localLogs, setLocalLogs] = useState<Record<string, string[]>>({})
  const [mounted, setMounted] = useState(false)

  // form
  const [energy, setEnergy] = useState(7)
  const [sleep, setSleep] = useState(7.5)
  const [focus, setFocus] = useState(7)
  const [mood, setMood] = useState(3)
  const [note, setNote] = useState("")
  const [newHabit, setNewHabit] = useState("")
  const [tab, setTab] = useState<"today" | "history">("today")
  const [range, setRange] = useState<7 | 30>(7)
  const [saving, setSaving] = useState(false)

  // derive habits/metrics/logs depending on auth
  const habits: Habit[] = useMemo(() => {
    if (isAuthed) return remoteHabits.map(h => ({ id: h.id, title: h.title }))
    return localHabits
  }, [isAuthed, remoteHabits, localHabits])

  const metricsMap: Record<string, DayEntry> = useMemo(() => {
    if (isAuthed) {
      const m: Record<string, DayEntry> = {}
      remoteMetrics.forEach(r => { m[r.date] = { date: r.date, energy: r.energy, sleep: r.sleep_hours, focus: r.focus, mood: r.mood, note: r.note ?? "", peakScore: r.peak_score } })
      return m
    }
    return localMetrics
  }, [isAuthed, remoteMetrics, localMetrics])

  const logsMap: Record<string, string[]> = useMemo(() => {
    if (isAuthed) {
      const l: Record<string, string[]> = {}
      remoteLogs.forEach(r => { if (!l[r.date]) l[r.date] = []; l[r.date].push(r.habit_id) })
      return l
    }
    return localLogs
  }, [isAuthed, remoteLogs, localLogs])

  // local init
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalHabits(load(STORAGE.habits, DEFAULT_TITLES.map((t, i) => ({ id: String(i + 1), title: t }))))
    setLocalMetrics(load(STORAGE.metrics, {}))
    setLocalLogs(load(STORAGE.logs, {}))
    setMounted(true)
  }, [])
  useEffect(() => { if (mounted && !isAuthed) save(STORAGE.habits, localHabits) }, [localHabits, mounted, isAuthed])
  useEffect(() => { if (mounted && !isAuthed) save(STORAGE.metrics, localMetrics) }, [localMetrics, mounted, isAuthed])
  useEffect(() => { if (mounted && !isAuthed) save(STORAGE.logs, localLogs) }, [localLogs, mounted, isAuthed])

  // hydrate form from metricsMap
  useEffect(() => {
    const t = metricsMap[todayKey]
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (t) { setEnergy(t.energy); setSleep(t.sleep); setFocus(t.focus); setMood(t.mood); setNote(t.note) }
  }, [metricsMap, todayKey])

  // seed default habits once for new users (не пересоздавать после удаления)
  useEffect(() => {
    if (!isAuthed || authLoading || remoteHabits.length > 0 || !user) return
    const key = `peakhuman:seeded:${user.id}`
    if (localStorage.getItem(key)) return
    ;(async () => {
      if (!supabase) return
      for (const title of DEFAULT_TITLES) {
        await supabase.from("habits").insert({ user_id: user.id, title })
      }
      localStorage.setItem(key, "1")
      refresh()
    })()
  }, [isAuthed, authLoading, remoteHabits.length, supabase, user, refresh])

  const completedIds = logsMap[todayKey] ?? []
  const todayPeak = useMemo(() => calculatePeakScore({ energy, focus, sleepHours: sleep, habitsCompleted: completedIds.length, totalHabits: habits.length }), [energy, focus, sleep, completedIds.length, habits.length])
  const savedTodayPeak = metricsMap[todayKey]?.peakScore ?? todayPeak
  const hasSavedToday = !!metricsMap[todayKey]

  const streak = useMemo(() => {
    let s = 0
    const d = new Date()
    for (let i = 0; i < 90; i++) {
      const k = d.toISOString().split("T")[0]
      if (metricsMap[k]) s++
      else if (i !== 0) break
      d.setDate(d.getDate() - 1)
      if (i > 0 && !metricsMap[k]) break
    }
    if (!metricsMap[todayKey] && completedIds.length > 0) s = Math.max(s, 1)
    return s || (metricsMap[todayKey] ? 1 : 0)
  }, [metricsMap, todayKey, completedIds.length])

  const chartData = useMemo(() => {
    const arr: { label: string; peak: number; energy: number; focus: number }[] = []
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const k = d.toISOString().split("T")[0]
      const label = d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })
      const m = metricsMap[k]
      arr.push({
        label,
        peak: m?.peakScore ?? (k === todayKey ? todayPeak : 0),
        energy: (m?.energy ?? (k === todayKey ? energy : 0)) * 10,
        focus: (m?.focus ?? (k === todayKey ? focus : 0)) * 10,
      })
    }
    return arr
  }, [metricsMap, todayKey, todayPeak, energy, focus, range])

  // heatmap 30 days
  const heatmap = useMemo(() => {
    const out: { date: string; score: number | null }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const k = d.toISOString().split("T")[0]
      out.push({ date: k, score: metricsMap[k]?.peakScore ?? null })
    }
    return out
  }, [metricsMap])

  async function toggleHabit(id: string) {
    if (isAuthed && supabase && user) {
      const cur = logsMap[todayKey] ?? []
      const has = cur.includes(id)
      if (has) await supabase.from("habit_logs").delete().eq("habit_id", id).eq("date", todayKey)
      else await supabase.from("habit_logs").insert({ habit_id: id, user_id: user.id, date: todayKey })
      refresh()
    } else {
      setLocalLogs(prev => {
        const cur = prev[todayKey] ?? []
        const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]
        return { ...prev, [todayKey]: next }
      })
    }
  }

  async function addHabit() {
    const t = newHabit.trim()
    if (!t) return
    if (isAuthed && supabase && user) {
      await supabase.from("habits").insert({ user_id: user.id, title: t })
      refresh()
    } else {
      setLocalHabits(h => [...h, { id: Math.random().toString(36).slice(2, 8), title: t }])
    }
    setNewHabit("")
  }

  async function addTemplate(habitsToAdd: string[]) {
    if (isAuthed && supabase && user) {
      for (const title of habitsToAdd) await supabase.from("habits").insert({ user_id: user.id, title })
      refresh()
    } else {
      setLocalHabits(h => [...h, ...habitsToAdd.map(t => ({ id: Math.random().toString(36).slice(2, 8), title: t }))])
    }
  }

  async function removeHabit(id: string) {
    if (isAuthed && supabase && user) {
      const { error } = await supabase.from("habits").delete().eq("id", id).eq("user_id", user.id)
      if (error) {
        console.error("habit delete", error.message)
        alert("Не удалось удалить: " + error.message)
        return
      }
      await refresh()
    } else {
      setLocalHabits(h => h.filter(x => x.id !== id))
      setLocalLogs(prev => { const c = { ...prev }; for (const k of Object.keys(c)) c[k] = c[k].filter(v => v !== id); return c })
    }
  }

  async function saveMetrics() {
    setSaving(true)
    const peak = todayPeak
    if (isAuthed && supabase && user) {
      await supabase.from("daily_metrics").upsert({
        user_id: user.id, date: todayKey,
        energy, sleep_hours: sleep, focus, mood, peak_score: peak, note
      }, { onConflict: "user_id,date" })
      refresh()
    } else {
      const entry: DayEntry = { date: todayKey, energy, sleep, focus, mood, note, peakScore: peak }
      setLocalMetrics(m => ({ ...m, [todayKey]: entry }))
    }
    setSaving(false)
  }

  async function handleSignOut() {
    if (supabase) await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  function exportCSV() {
    const rows = Object.values(metricsMap).sort((a, b) => a.date.localeCompare(b.date))
    const header = "date,energy,sleep,focus,mood,peakScore,habitsDone,totalHabits,note"
    const csv = [header, ...rows.map(r => {
      const done = logsMap[r.date]?.length ?? 0
      const escNote = `"${(r.note ?? "").replace(/"/g, '""')}"`
      return `${r.date},${r.energy},${r.sleep},${r.focus},${r.mood},${r.peakScore},${done},${habits.length},${escNote}`
    })].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `peakhuman_${new Date().toISOString().split("T")[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const completion = habits.length ? Math.round((completedIds.length / habits.length) * 100) : 0

  // smart insight
  const insight = useMemo(() => {
    const last7 = Object.values(metricsMap).slice(-7)
    if (last7.length < 3) return "Отмечай дни — через 3 дня появятся корреляции."
    const avgSleep = last7.reduce((a, c) => a + c.sleep, 0) / last7.length
    const avgFocus = last7.reduce((a, c) => a + c.focus, 0) / last7.length
    const lowEnergyDays = last7.filter(d => d.energy < 5).length
    if (lowEnergyDays >= 2 && avgSleep < 6.5) return `Сон в среднем ${avgSleep.toFixed(1)}ч — энергия проседает. Попробуй +30 мин сна 3 дня подряд.`
    if (avgFocus >= 8 && avgSleep >= 7) return `Фокус ${avgFocus.toFixed(1)}/10 при сне ${avgSleep.toFixed(1)}ч — ты в потоке. Держи режим.`
    if (completion < 50) return "Привычки дают до +20 к Peak Score. Дожми хотя бы 1-2 сегодня."
    const trend = last7.length >= 2 ? last7[last7.length - 1].peakScore - last7[0].peakScore : 0
    if (trend > 8) return `Тренд +${trend} за неделю — прогресс явный. Закрепи streak.`
    if (trend < -8) return `Спад ${trend} за неделю — проверь сон и привычки вчера.`
    return "Стабильность — суперсила. Продолжай цепочку."
  }, [metricsMap, completion])

  if (!mounted || authLoading) return <div className="min-h-screen bg-[#FCFCF9] flex items-center justify-center text-sm text-[#A8A29E]">Загрузка PeakHuman…</div>

  return (
    <div className="min-h-screen bg-[#FCFCF9] flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#FCFCF9]/80 border-b border-[#E7E5E4]">
        <div className="mx-auto max-w-[1160px] px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#0A0A0A] flex items-center justify-center"><span className="text-white text-[11px] font-bold">PH</span></div>
            <span className="font-semibold tracking-tight">PeakHuman</span>
            <Badge className="hidden sm:inline-flex ml-1">{isAuthed ? "synced" : "demo"}</Badge>
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs border border-[#E7E5E4] rounded-full px-3 py-1.5 bg-white">
              <Calendar className="h-3.5 w-3.5 text-[#A8A29E]" />
              <span className="capitalize text-[#57534E] font-medium">{todayLabel}</span>
            </div>
            <motion.div whileHover={{ scale: 1.04 }} className="flex items-center gap-1.5 bg-[#0A0A0A] text-white rounded-full px-3 py-1.5 text-xs font-medium">
              <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.8, repeat: Infinity }}><Flame className="h-3.5 w-3.5 text-orange-400" /></motion.span> {streak} дней
            </motion.div>
            {isAuthed && <span className="hidden md:inline text-xs text-[#737373] max-w-[160px] truncate">{user?.email}</span>}
            <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="h-4 w-4 mr-1.5" />{isAuthed ? "Выйти" : "Войти"}</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1160px] w-full px-6 py-6 md:py-8 flex-1">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setTab("today")} className={cn("rounded-full px-4 py-2 text-sm font-medium border transition-colors", tab === "today" ? "bg-[#0A0A0A] text-white border-[#0A0A0A]" : "bg-white border-[#E7E5E4]")}>Сегодня</button>
          <button onClick={() => setTab("history")} className={cn("rounded-full px-4 py-2 text-sm font-medium border transition-colors", tab === "history" ? "bg-[#0A0A0A] text-white border-[#0A0A0A]" : "bg-white border-[#E7E5E4]")}>История</button>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5"><Download className="h-3.5 w-3.5" />CSV</Button>
            <Link href="/settings" className="hidden sm:inline-flex"><Button variant="outline" size="sm"><Settings className="h-3.5 w-3.5 mr-1.5" />Настройки</Button></Link>
          </div>
        </div>

        {tab === "today" ? (
          <>
            <div className="mb-5">
              <RitualCards />
              <div className="mt-4 flex items-center gap-2">
                <Link href="/roadmap" className="flex-1"><Card className="p-4 flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer"><div className="h-9 w-9 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center"><Map className="h-4 w-4" /></div><div className="flex-1"><div className="text-sm font-semibold">Роадмап</div><div className="text-xs text-[#737373]">Собери путь на квартал — вехи, прогресс, динамика</div></div><Badge>открыть</Badge></Card></Link>
              </div>
            </div>
            <div className="grid lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 space-y-5">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Card className="overflow-hidden">
                <div className="p-6 md:p-7">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs tracking-widest uppercase text-[#A8A29E] font-semibold">Peak Score</div>
                      <div className="flex items-baseline gap-3 mt-2">
                        <motion.span key={hasSavedToday ? savedTodayPeak : todayPeak} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300 }} className="text-5xl font-light tracking-tight">{hasSavedToday ? savedTodayPeak : todayPeak}</motion.span>
                        <span className="text-sm text-[#737373]">/ 100</span>
                      </div>
                      <div className="text-sm text-[#57534E] mt-1">{hasSavedToday ? "Сохранено" : "Предпросмотр — сохрани день"}</div>
                    </div>
                    <div className="h-14 w-14 rounded-full bg-[#F5F5F3] border border-[#E7E5E4] flex items-center justify-center"><Award className="h-6 w-6" /></div>
                  </div>
                  <div className="mt-6 h-2 bg-[#F5F5F3] rounded-full overflow-hidden"><div className="h-full bg-[#0A0A0A] rounded-full transition-all" style={{ width: `${hasSavedToday ? savedTodayPeak : todayPeak}%` }} /></div>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-[#FFFBEB] border border-amber-200 p-3"><div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-amber-700"><Zap className="h-3.5 w-3.5" />Энергия</div><div className="text-xl font-semibold mt-1">{energy}<span className="text-xs text-[#A8A29E]">/10</span></div></div>
                    <div className="rounded-2xl bg-[#EFF6FF] border border-indigo-200 p-3"><div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-indigo-700"><Moon className="h-3.5 w-3.5" />Сон</div><div className="text-xl font-semibold mt-1">{sleep}<span className="text-xs text-[#A8A29E]">ч</span></div></div>
                    <div className="rounded-2xl bg-[#ECFDF5] border border-emerald-200 p-3"><div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-emerald-700"><Target className="h-3.5 w-3.5" />Фокус</div><div className="text-xl font-semibold mt-1">{focus}<span className="text-xs text-[#A8A29E]">/10</span></div></div>
                  </div>
                </div>
                <div className="bg-[#F5F5F3] border-t border-[#E7E5E4] px-6 py-3 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[#57534E]"><TrendingUp className="h-3.5 w-3.5" />{completion}% привычек</span>
                  <span className="text-[#A8A29E]">{completedIds.length}/{habits.length}</span>
                </div>
              </Card>
              </motion.div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Привычки</span><span className="text-xs font-normal text-[#A8A29E] border rounded-full px-2 py-1 bg-[#F5F5F3]">{completedIds.length}/{habits.length}</span></CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2"><Input placeholder="Новая привычка…" value={newHabit} onChange={e => setNewHabit(e.target.value)} onKeyDown={e => e.key === "Enter" && addHabit()} /><Button onClick={addHabit} size="icon" className="rounded-full shrink-0"><Plus className="h-4 w-4" /></Button></div>

                  {habits.length === 0 ? (
                    <div className="py-2 space-y-3">
                      <div className="text-sm text-[#57534E] font-medium">Начни с шаблона:</div>
                      <div className="grid grid-cols-2 gap-2">
                        {TEMPLATES.map(t => (
                          <button key={t.label} onClick={() => addTemplate(t.habits)} className="text-left rounded-2xl border border-[#E7E5E4] bg-[#F5F5F3] p-3 hover:bg-white transition-colors">
                            <div className="text-sm font-medium">{t.label}</div>
                            <div className="text-xs text-[#737373] line-clamp-2">{t.habits.join(" · ")}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <AnimatePresence>
                        {habits.map(h => {
                          const done = completedIds.includes(h.id)
                          return (
                            <motion.div key={h.id} initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} whileHover={{ y: -1 }} className={cn("flex items-center gap-3 rounded-2xl border p-3", done ? "bg-[#0A0A0A] text-white border-[#0A0A0A]" : "bg-white border-[#E7E5E4]")}>
                              <motion.button whileTap={{ scale: 0.88 }} onClick={() => toggleHabit(h.id)} className={cn("h-7 w-7 rounded-full border flex items-center justify-center shrink-0", done ? "bg-white text-[#0A0A0A] border-white" : "border-[#E7E5E4] bg-[#F5F5F3]")}>{done && <Check className="h-4 w-4" />}</motion.button>
                              <span className="text-sm font-medium flex-1">{h.title}</span>
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeHabit(h.id)} className={cn("h-7 w-7 rounded-full flex items-center justify-center", done ? "hover:bg-white/10 text-white/70" : "hover:bg-[#F5F5F3] text-[#A8A29E]")}><Trash2 className="h-3.5 w-3.5" /></motion.button>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                  <div className="h-1.5 bg-[#F5F5F3] rounded-full overflow-hidden"><div className="h-full bg-[#0A0A0A] transition-all" style={{ width: `${completion}%` }} /></div>
                </CardContent>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between"><span className="text-sm font-semibold flex items-center gap-1.5"><LayoutGrid className="h-4 w-4" /> Календарь 30 дней</span><span className="text-xs text-[#A8A29E]">Peak по дням</span></div>
                <div className="mt-4 grid grid-cols-10 gap-1.5">
                  {heatmap.map(d => {
                    const s = d.score
                    const bg = s === null ? "bg-[#F5F5F3] border-[#E7E5E4]" : s >= 80 ? "bg-[#0A0A0A] border-[#0A0A0A]" : s >= 60 ? "bg-[#57534E] border-[#57534E]" : s >= 40 ? "bg-[#A8A29E] border-[#A8A29E]" : "bg-[#E7E5E4] border-[#E7E5E4]"
                    return <div key={d.date} title={`${d.date}: ${s ?? "—"}`} className={cn("h-7 rounded-lg border flex items-center justify-center text-[10px] font-medium", bg, s !== null && s >= 60 ? "text-white" : "text-[#57534E]")}>{new Date(d.date).getDate()}</div>
                  })}
                </div>
                <div className="mt-3 flex gap-1.5 text-[11px] text-[#A8A29E]"><span className="h-2.5 w-2.5 rounded bg-[#F5F5F3] border" /> нет · <span className="h-2.5 w-2.5 rounded bg-[#E7E5E4]" /> &lt;40 · <span className="h-2.5 w-2.5 rounded bg-[#A8A29E]" /> 40-60 · <span className="h-2.5 w-2.5 rounded bg-[#57534E]" /> 60-80 · <span className="h-2.5 w-2.5 rounded bg-[#0A0A0A]" /> 80+</div>
              </Card>
            </div>

            <div className="lg:col-span-7 space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Чекин</CardTitle>
                  <p className="text-sm text-[#737373]">30 секунд. Честно. Без оценок — только наблюдения.</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2"><div className="flex justify-between text-sm"><span className="font-medium flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" />Энергия</span><span className="font-mono text-[#57534E]">{energy}/10</span></div><input type="range" min={1} max={10} value={energy} onChange={e => setEnergy(Number(e.target.value))} className="w-full accent-[#0A0A0A]" /></div>
                    <div className="space-y-2"><div className="flex justify-between text-sm"><span className="font-medium flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-emerald-600" />Фокус</span><span className="font-mono text-[#57534E]">{focus}/10</span></div><input type="range" min={1} max={10} value={focus} onChange={e => setFocus(Number(e.target.value))} className="w-full accent-[#0A0A0A]" /></div>
                    <div className="space-y-2"><div className="flex justify-between text-sm"><span className="font-medium flex items-center gap-1.5"><Moon className="h-3.5 w-3.5 text-indigo-500" />Сон</span><span className="font-mono text-[#57534E]">{sleep} ч</span></div><input type="range" min={0} max={12} step={0.5} value={sleep} onChange={e => setSleep(Number(e.target.value))} className="w-full accent-[#0A0A0A]" /></div>
                    <div className="space-y-2"><div className="flex justify-between text-sm"><span className="font-medium">Настроение</span><span className="font-mono text-[#57534E]">{mood}/5</span></div><input type="range" min={1} max={5} value={mood} onChange={e => setMood(Number(e.target.value))} className="w-full accent-[#0A0A0A]" /></div>
                  </div>
                  <div><label className="text-sm font-medium">Заметка</label><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Что повлияло? Благодарность, инсайт…" rows={3} className="mt-1.5 w-full rounded-2xl border border-[#E7E5E4] bg-white px-4 py-3 text-sm placeholder:text-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#0A0A0A]" /></div>
                  <div className="flex gap-3">
                    <Button onClick={saveMetrics} size="lg" className="flex-1 gap-2" disabled={saving}>{saving ? "Сохраняем…" : hasSavedToday ? <><Check className="h-4 w-4" /> Обновить чекин</> : "Сохранить чекин"}</Button>
                    <div className="hidden sm:flex items-center text-xs text-[#A8A29E] border border-[#E7E5E4] rounded-full px-4 bg-[#F5F5F3]">Peak: <span className="ml-1 font-semibold text-[#0A0A0A]">{todayPeak}</span></div>
                  </div>
                  {hasSavedToday && <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">Сохранено {isAuthed ? "в облако" : "локально"} · {new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</div>}
                  {!isAuthed && <div className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">Демо-режим: <Link href="/login" className="underline font-medium">войди</Link> чтобы синхронизировать на всех устройствах.</div>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Динамика</span>
                    <div className="flex gap-1 border border-[#E7E5E4] rounded-full p-1 bg-[#F5F5F3]">
                      <button onClick={() => setRange(7)} className={cn("px-3 py-1 rounded-full text-xs font-medium", range === 7 ? "bg-[#0A0A0A] text-white" : "text-[#57534E]")}>7 дней</button>
                      <button onClick={() => setRange(30)} className={cn("px-3 py-1 rounded-full text-xs font-medium", range === 30 ? "bg-[#0A0A0A] text-white" : "text-[#57534E]")}>30 дней</button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#F5F5F3" /><XAxis dataKey="label" tick={{ fontSize: 10, fill: "#A8A29E" }} axisLine={false} tickLine={false} interval={range === 30 ? 4 : 0} /><YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#A8A29E" }} axisLine={false} tickLine={false} width={30} /><Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #E7E5E4" }} /><Line type="monotone" dataKey="peak" stroke="#0A0A0A" strokeWidth={2.5} dot={{ r: 2 }} name="Peak" /><Line type="monotone" dataKey="energy" stroke="#F59E0B" strokeWidth={1.2} dot={false} name="Энергия×10" /><Line type="monotone" dataKey="focus" stroke="#10B981" strokeWidth={1.2} dot={false} name="Фокус×10" /></LineChart></ResponsiveContainer></div>
                  <div className="mt-3 flex gap-3 text-xs"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#0A0A0A]" /> Peak</span><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Энергия</span><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Фокус</span></div>
                </CardContent>
              </Card>

              <Card className="bg-[#0A0A0A] text-white border-[#0A0A0A]">
                <CardContent className="p-5 flex gap-4 items-start"><div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center shrink-0"><Sparkles className="h-5 w-5" /></div><div><div className="font-medium">Инсайт</div><p className="text-sm opacity-70 mt-1 leading-6">{insight}</p></div></CardContent>
              </Card>
            </div>
          </div>
          </>
        ) : (
          <div className="grid md:grid-cols-12 gap-5">
            <div className="md:col-span-8 space-y-3">
              {Object.keys(metricsMap).length === 0 ? (
                <Card className="p-12 text-center"><div className="text-sm text-[#A8A29E]">Пока нет сохранённых дней. Сделай чекин.</div><Button onClick={() => setTab("today")} className="mt-4">К чекину</Button></Card>
              ) : (
                Object.entries(metricsMap).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30).map(([date, m]) => {
                  const done = logsMap[date]?.length ?? 0
                  return (
                    <Card key={date} className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-[#0A0A0A] text-white flex flex-col items-center justify-center leading-none"><span className="text-[11px] opacity-60">{new Date(date).toLocaleDateString("ru-RU", { month: "short" })}</span><span className="text-lg font-semibold -mt-1">{new Date(date).getDate()}</span></div>
                      <div className="flex-1 min-w-0"><div className="text-sm font-medium">{new Date(date).toLocaleDateString("ru-RU", { weekday: "long" })} · Peak {m.peakScore}</div><div className="text-xs text-[#737373] truncate">Э{m.energy} · С{m.sleep}ч · Ф{m.focus} · {done}/{habits.length} · {m.note || "без заметки"}</div></div>
                      <Badge className="shrink-0">{m.peakScore >= 80 ? "пик" : m.peakScore >= 60 ? "норм" : "спад"}</Badge>
                    </Card>
                  )
                })
              )}
            </div>
            <div className="md:col-span-4 space-y-5">
              <Card className="p-5"><div className="text-sm font-semibold">Сводка</div><div className="mt-3 space-y-2 text-sm"><div className="flex justify-between"><span className="text-[#737373]">Средний Peak</span><span className="font-mono font-medium">{Math.round(Object.values(metricsMap).slice(-7).reduce((a, c) => a + c.peakScore, 0) / Math.max(1, Math.min(7, Object.keys(metricsMap).length))) || 0}</span></div><div className="flex justify-between"><span className="text-[#737373]">Дней отмечено</span><span className="font-medium">{Object.keys(metricsMap).length}</span></div><div className="flex justify-between"><span className="text-[#737373]">Streak</span><span className="font-medium flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-orange-500" />{streak}</span></div><div className="flex justify-between"><span className="text-[#737373]">Привычек</span><span className="font-medium">{habits.length}</span></div></div><Button variant="outline" className="w-full mt-4" onClick={() => { if (confirm("Очистить всё?")) { localStorage.clear(); location.reload() } }}>Сбросить демо-данные</Button></Card>
              <Card className="p-5 bg-[#F5F5F3] border-dashed"><div className="text-sm font-medium">Корреляция</div><p className="text-sm text-[#57534E] mt-1 leading-6">{insight}</p></Card>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[#E7E5E4] bg-white"><div className="mx-auto max-w-[1160px] px-6 py-4 flex items-center justify-between text-xs text-[#A8A29E]"><span>{isAuthed ? "Синхронизировано с Supabase · RLS" : "Локально · войди для синхронизации"}</span><Link href="/" className="hover:text-[#0A0A0A]">На лендинг →</Link></div></footer>
    </div>
  )
}
