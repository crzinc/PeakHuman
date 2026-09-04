"use client"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn, calculatePeakScore, getTodayKey } from "@/lib/utils"
import { X, Plus, Check, Flame, Trash2, LogOut, Sparkles, Moon, Zap, Target, TrendingUp, Calendar, Award } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

type Habit = { id: string; title: string }
type Metrics = { energy: number; sleep: number; focus: number; mood: number; note: string }
type DayEntry = Metrics & { peakScore: number; date: string }

const DEFAULT_HABITS: Habit[] = [
  { id: "1", title: "Медитация 10 мин" },
  { id: "2", title: "Тренировка" },
  { id: "3", title: "Чтение 30 мин" },
  { id: "4", title: "Без сахара" },
]

const STORAGE = {
  habits: "peakhuman:habits",
  metrics: "peakhuman:metrics",
  logs: "peakhuman:logs",
}

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}
function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export default function DashboardPage() {
  const todayKey = getTodayKey()
  const todayLabel = useMemo(() => new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" }), [])

  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS)
  const [newHabit, setNewHabit] = useState("")
  const [metricsMap, setMetricsMap] = useState<Record<string, DayEntry>>({})
  const [logsMap, setLogsMap] = useState<Record<string, string[]>>({})
  const [mounted, setMounted] = useState(false)

  // form state for today
  const [energy, setEnergy] = useState(7)
  const [sleep, setSleep] = useState(7.5)
  const [focus, setFocus] = useState(7)
  const [mood, setMood] = useState(3)
  const [note, setNote] = useState("")

  const [tab, setTab] = useState<"today" | "history">("today")

  useEffect(() => {
    setHabits(load(STORAGE.habits, DEFAULT_HABITS))
    setMetricsMap(load(STORAGE.metrics, {}))
    setLogsMap(load(STORAGE.logs, {}))
    setMounted(true)
  }, [])

  // hydrate today's metrics into form
  useEffect(() => {
    if (!mounted) return
    const today = metricsMap[todayKey]
    if (today) {
      setEnergy(today.energy)
      setSleep(today.sleep)
      setFocus(today.focus)
      setMood(today.mood)
      setNote(today.note)
    }
  }, [mounted, metricsMap, todayKey])

  // persist
  useEffect(() => { if (mounted) save(STORAGE.habits, habits) }, [habits, mounted])
  useEffect(() => { if (mounted) save(STORAGE.metrics, metricsMap) }, [metricsMap, mounted])
  useEffect(() => { if (mounted) save(STORAGE.logs, logsMap) }, [logsMap, mounted])

  const completedIds = logsMap[todayKey] ?? []
  const todayPeak = useMemo(() => calculatePeakScore({ energy, focus, sleepHours: sleep, habitsCompleted: completedIds.length, totalHabits: habits.length }), [energy, focus, sleep, completedIds.length, habits.length])
  const savedTodayPeak = metricsMap[todayKey]?.peakScore ?? todayPeak

  const streak = useMemo(() => {
    let s = 0
    const d = new Date()
    for (let i = 0; i < 90; i++) {
      const key = d.toISOString().split("T")[0]
      if (metricsMap[key]) s++
      else if (i === 0) { /* today may be unsaved but we count if form touched? no */ }
      else break
      d.setDate(d.getDate() - 1)
      if (i > 0 && !metricsMap[key]) break
    }
    // if today not yet saved but has completed habits, count it
    if (!metricsMap[todayKey] && completedIds.length > 0) s = Math.max(s, 1)
    return s || (metricsMap[todayKey] ? 1 : 0)
  }, [metricsMap, todayKey, completedIds.length])

  // chart data last 7 days
  const chartData = useMemo(() => {
    const arr: { date: string; label: string; peak: number; energy: number; focus: number; sleep: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split("T")[0]
      const label = d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })
      const m = metricsMap[key]
      arr.push({
        date: key,
        label,
        peak: m?.peakScore ?? (key === todayKey ? todayPeak : 0),
        energy: m?.energy ?? (key === todayKey ? energy : 0),
        focus: m?.focus ?? (key === todayKey ? focus : 0),
        sleep: m?.sleep ?? (key === todayKey ? sleep : 0),
      })
    }
    return arr
  }, [metricsMap, todayKey, todayPeak, energy, focus, sleep])

  function toggleHabit(id: string) {
    setLogsMap(prev => {
      const cur = prev[todayKey] ?? []
      const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]
      return { ...prev, [todayKey]: next }
    })
  }

  function addHabit() {
    const t = newHabit.trim()
    if (!t) return
    setHabits(h => [...h, { id: Math.random().toString(36).slice(2, 8), title: t }])
    setNewHabit("")
  }

  function removeHabit(id: string) {
    setHabits(h => h.filter(x => x.id !== id))
    setLogsMap(prev => {
      const copy = { ...prev }
      for (const k of Object.keys(copy)) copy[k] = copy[k].filter(v => v !== id)
      return copy
    })
  }

  function saveMetrics() {
    const entry: DayEntry = { date: todayKey, energy, sleep, focus, mood, note, peakScore: todayPeak }
    setMetricsMap(m => ({ ...m, [todayKey]: entry }))
  }

  const completion = habits.length ? Math.round((completedIds.length / habits.length) * 100) : 0
  const hasSavedToday = !!metricsMap[todayKey]

  if (!mounted) {
    return <div className="min-h-screen bg-[#FCFCF9] flex items-center justify-center text-sm text-[#A8A29E]">Загрузка PeakHuman…</div>
  }

  return (
    <div className="min-h-screen bg-[#FCFCF9] flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#FCFCF9]/80 border-b border-[#E7E5E4]">
        <div className="mx-auto max-w-[1160px] px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#0A0A0A] flex items-center justify-center"><span className="text-white text-[11px] font-bold">PH</span></div>
            <span className="font-semibold tracking-tight">PeakHuman</span>
            <Badge className="hidden sm:inline-flex ml-1">dashboard</Badge>
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs border border-[#E7E5E4] rounded-full px-3 py-1.5 bg-white">
              <Calendar className="h-3.5 w-3.5 text-[#A8A29E]" />
              <span className="capitalize text-[#57534E] font-medium">{todayLabel}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#0A0A0A] text-white rounded-full px-3 py-1.5 text-xs font-medium">
              <Flame className="h-3.5 w-3.5 text-orange-400" /> {streak} дней streak
            </div>
            <Link href="/" className="hidden sm:inline-flex"><Button variant="ghost" size="sm"><LogOut className="h-4 w-4 mr-1.5" />Выйти</Button></Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1160px] w-full px-6 py-6 md:py-8 flex-1">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setTab("today")} className={cn("rounded-full px-4 py-2 text-sm font-medium border transition-colors", tab === "today" ? "bg-[#0A0A0A] text-white border-[#0A0A0A]" : "bg-white border-[#E7E5E4] hover:bg-[#F5F5F3]")}>Сегодня</button>
          <button onClick={() => setTab("history")} className={cn("rounded-full px-4 py-2 text-sm font-medium border transition-colors", tab === "history" ? "bg-[#0A0A0A] text-white border-[#0A0A0A]" : "bg-white border-[#E7E5E4] hover:bg-[#F5F5F3]")}>История 7 дней</button>
          <span className="ml-auto hidden md:inline text-xs text-[#A8A29E]">Данные хранятся локально · Supabase sync когда настроен</span>
        </div>

        {tab === "today" ? (
          <div className="grid lg:grid-cols-12 gap-5">
            {/* Left */}
            <div className="lg:col-span-5 space-y-5">
              {/* Peak Score */}
              <Card className="overflow-hidden">
                <div className="p-6 md:p-7">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs tracking-widest uppercase text-[#A8A29E] font-semibold">Peak Score</div>
                      <div className="flex items-baseline gap-3 mt-2">
                        <span className="text-5xl font-light tracking-tight">{hasSavedToday ? savedTodayPeak : todayPeak}</span>
                        <span className="text-sm text-[#737373]">/ 100</span>
                      </div>
                      <div className="text-sm text-[#57534E] mt-1">{ hasSavedToday ? "Сохранено сегодня" : "Предпросмотр — нажми Сохранить"}</div>
                    </div>
                    <div className="h-14 w-14 rounded-full bg-[#F5F5F3] border border-[#E7E5E4] flex items-center justify-center">
                      <Award className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="h-2 bg-[#F5F5F3] rounded-full overflow-hidden">
                      <div className="h-full bg-[#0A0A0A] rounded-full transition-all" style={{ width: `${hasSavedToday ? savedTodayPeak : todayPeak}%` }} />
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-[#A8A29E]">
                      <span>0</span><span>50</span><span>100</span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-[#FFFBEB] border border-amber-200 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-amber-700"><Zap className="h-3.5 w-3.5" /> Энергия</div>
                      <div className="text-xl font-semibold mt-1">{energy}<span className="text-xs text-[#A8A29E]">/10</span></div>
                    </div>
                    <div className="rounded-2xl bg-[#EFF6FF] border border-indigo-200 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-indigo-700"><Moon className="h-3.5 w-3.5" /> Сон</div>
                      <div className="text-xl font-semibold mt-1">{sleep}<span className="text-xs text-[#A8A29E]"> ч</span></div>
                    </div>
                    <div className="rounded-2xl bg-[#ECFDF5] border border-emerald-200 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-emerald-700"><Target className="h-3.5 w-3.5" /> Фокус</div>
                      <div className="text-xl font-semibold mt-1">{focus}<span className="text-xs text-[#A8A29E]">/10</span></div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#F5F5F3] border-t border-[#E7E5E4] px-6 py-3 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[#57534E]"><TrendingUp className="h-3.5 w-3.5" /> Прогресс привычек {completion}%</span>
                  <span className="text-[#A8A29E]">{completedIds.length}/{habits.length} done</span>
                </div>
              </Card>

              {/* Habits */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Привычки</span>
                    <span className="text-xs font-normal text-[#A8A29E] border border-[#E7E5E4] rounded-full px-2 py-1 bg-[#F5F5F3]">{completedIds.length}/{habits.length}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input placeholder="Новая привычка, напр. Бег 5км" value={newHabit} onChange={(e) => setNewHabit(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHabit()} />
                    <Button onClick={addHabit} size="icon" className="shrink-0 rounded-full"><Plus className="h-4 w-4" /></Button>
                  </div>

                  <div className="space-y-2 pt-1">
                    {habits.map((h) => {
                      const done = completedIds.includes(h.id)
                      return (
                        <div key={h.id} className={cn("flex items-center gap-3 rounded-2xl border p-3 transition-colors", done ? "bg-[#0A0A0A] text-white border-[#0A0A0A]" : "bg-white border-[#E7E5E4] hover:border-[#D6D3D1]")}>
                          <button onClick={() => toggleHabit(h.id)} className={cn("h-7 w-7 rounded-full border flex items-center justify-center shrink-0 transition-colors", done ? "bg-white text-[#0A0A0A] border-white" : "border-[#E7E5E4] bg-[#F5F5F3]")}>
                            {done && <Check className="h-4 w-4" />}
                          </button>
                          <span className={cn("text-sm font-medium flex-1", done ? "text-white" : "text-[#0A0A0A]")}>{h.title}</span>
                          <button onClick={() => removeHabit(h.id)} className={cn("h-7 w-7 rounded-full flex items-center justify-center", done ? "hover:bg-white/10 text-white/70" : "hover:bg-[#F5F5F3] text-[#A8A29E]")}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )
                    })}
                    {habits.length === 0 && <div className="text-sm text-[#A8A29E] text-center py-6">Нет привычек — добавь первую</div>}
                  </div>

                  <div className="h-1.5 bg-[#F5F5F3] rounded-full overflow-hidden">
                    <div className="h-full bg-[#0A0A0A] transition-all" style={{ width: `${completion}%` }} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right */}
            <div className="lg:col-span-7 space-y-5">
              {/* Daily check-in */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Чекин сегодня</CardTitle>
                  <p className="text-sm text-[#737373]">Отметь, как ты. Это займёт 30 секунд и обновит Peak Score.</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm"><span className="font-medium flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" /> Энергия</span><span className="font-mono text-[#57534E]">{energy}/10</span></div>
                      <input type="range" min={1} max={10} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} className="w-full accent-[#0A0A0A]" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm"><span className="font-medium flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-emerald-600" /> Фокус</span><span className="font-mono text-[#57534E]">{focus}/10</span></div>
                      <input type="range" min={1} max={10} value={focus} onChange={(e) => setFocus(Number(e.target.value))} className="w-full accent-[#0A0A0A]" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm"><span className="font-medium flex items-center gap-1.5"><Moon className="h-3.5 w-3.5 text-indigo-500" /> Сон</span><span className="font-mono text-[#57534E]">{sleep} ч</span></div>
                      <input type="range" min={0} max={12} step={0.5} value={sleep} onChange={(e) => setSleep(Number(e.target.value))} className="w-full accent-[#0A0A0A]" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm"><span className="font-medium">Настроение</span><span className="font-mono text-[#57534E]">{mood}/5</span></div>
                      <input type="range" min={1} max={5} value={mood} onChange={(e) => setMood(Number(e.target.value))} className="w-full accent-[#0A0A0A]" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Заметка дня</label>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Что повлияло на состояние? Инсайт, благодарность..." rows={3} className="mt-1.5 w-full rounded-2xl border border-[#E7E5E4] bg-white px-4 py-3 text-sm placeholder:text-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#0A0A0A]" />
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={saveMetrics} size="lg" className="flex-1 gap-2">
                      {hasSavedToday ? <><Check className="h-4 w-4" /> Обновить чекин</> : "Сохранить чекин"}
                    </Button>
                    <div className="hidden sm:flex items-center text-xs text-[#A8A29E] border border-[#E7E5E4] rounded-full px-4 bg-[#F5F5F3]">
                      Peak Score: <span className="ml-1 font-semibold text-[#0A0A0A]">{todayPeak}</span>
                    </div>
                  </div>
                  {hasSavedToday && <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">Сохранено. Твой день уже в истории — смотри график ниже.</div>}
                </CardContent>
              </Card>

              {/* Chart */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between"><span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Динамика 7 дней</span><span className="text-xs font-normal text-[#A8A29E]">Peak · Энергия · Фокус</span></CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F3" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#A8A29E" }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#A8A29E" }} axisLine={false} tickLine={false} width={24} />
                        <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #E7E5E4" }} />
                        <Line type="monotone" dataKey="peak" stroke="#0A0A0A" strokeWidth={2.5} dot={{ r: 3 }} name="Peak" />
                        <Line type="monotone" dataKey="energy" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="Энергия" />
                        <Line type="monotone" dataKey="focus" stroke="#10B981" strokeWidth={1.5} dot={false} name="Фокус" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 flex gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#0A0A0A]" /> Peak</span>
                    <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Энергия</span>
                    <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Фокус</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0A0A0A] text-white border-[#0A0A0A]">
                <CardContent className="p-5 flex gap-4 items-start">
                  <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center shrink-0"><Sparkles className="h-5 w-5" /></div>
                  <div>
                    <div className="font-medium">Инсайт</div>
                    <p className="text-sm opacity-70 mt-1 leading-6">
                      {focus >= 8 && sleep >= 7 ? "Сон и фокус коррелируют — ты в потоке. Держи режим." : energy < 5 ? "Энергия просела. Проверь сон и привычки вчера." : completion < 50 ? "Дожми привычки — они дают +20 к Peak Score." : "Стабильность — суперсила. Продолжай цепочку."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-12 gap-5">
            <div className="md:col-span-8 space-y-3">
              {Object.keys(metricsMap).length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="text-sm text-[#A8A29E]">Пока нет сохранённых дней. Сделай чекин — и история появится.</div>
                  <Button onClick={() => setTab("today")} className="mt-4">К чекину</Button>
                </Card>
              ) : (
                Object.entries(metricsMap).sort((a,b)=> b[0].localeCompare(a[0])).slice(0,7).map(([date, m]) => {
                  const done = logsMap[date]?.length ?? 0
                  return (
                    <Card key={date} className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-[#0A0A0A] text-white flex flex-col items-center justify-center leading-none">
                        <span className="text-[11px] opacity-60">{new Date(date).toLocaleDateString("ru-RU", { month: "short" })}</span>
                        <span className="text-lg font-semibold -mt-1">{new Date(date).getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{new Date(date).toLocaleDateString("ru-RU", { weekday: "long" })} · Peak {m.peakScore}</div>
                        <div className="text-xs text-[#737373] truncate">Э{ m.energy } · С{ m.sleep }ч · Ф{ m.focus } · {done} привычек · {m.note || "без заметки"}</div>
                      </div>
                      <Badge className="shrink-0">{m.peakScore >= 80 ? "пик" : m.peakScore >= 60 ? "норм" : "спад"}</Badge>
                    </Card>
                  )
                })
              )}
            </div>
            <div className="md:col-span-4 space-y-5">
              <Card className="p-5">
                <div className="text-sm font-semibold">Сводка недели</div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[#737373]">Средний Peak</span><span className="font-mono font-medium">{Math.round(Object.values(metricsMap).slice(-7).reduce((a,c)=>a+c.peakScore,0) / Math.max(1, Math.min(7, Object.keys(metricsMap).length)) ) || 0}</span></div>
                  <div className="flex justify-between"><span className="text-[#737373]">Дней отмечено</span><span className="font-medium">{Object.keys(metricsMap).length}</span></div>
                  <div className="flex justify-between"><span className="text-[#737373]">Стрик</span><span className="font-medium flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-orange-500" />{streak}</span></div>
                </div>
                <Button variant="outline" className="w-full mt-4" onClick={() => { if(confirm("Очистить все данные?")) { localStorage.clear(); location.reload() }}}>Сбросить демо-данные</Button>
              </Card>
              <Card className="p-5 bg-[#F5F5F3] border-dashed">
                <div className="text-sm font-medium">Скоро</div>
                <p className="text-sm text-[#57534E] mt-1 leading-6">Экспорт CSV, напоминания, корреляции «сон → фокус», и шаринг прогресса.</p>
              </Card>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[#E7E5E4] bg-white">
        <div className="mx-auto max-w-[1160px] px-6 py-4 flex items-center justify-between text-xs text-[#A8A29E]">
          <span>PeakHuman — локально, быстро, приватно.</span>
          <Link href="/" className="hover:text-[#0A0A0A]">На лендинг →</Link>
        </div>
      </footer>
    </div>
  )
}
