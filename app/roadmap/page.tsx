"use client"
import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRoadmaps } from "@/lib/hooks/useRoadmaps"
import { ArrowLeft, Map, Plus, Check, Trash2, Target, Calendar, TrendingUp } from "lucide-react"

export default function RoadmapPage() {
  const { roadmaps, milestones, loading, createRoadmap, addMilestone, toggleMilestone, deleteRoadmap } = useRoadmaps()
  const [title, setTitle] = useState("")
  const [quarter, setQuarter] = useState("Q1 2026")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [newMilestone, setNewMilestone] = useState<Record<string, string>>({})

  if (loading) return <div className="min-h-screen bg-[#FCFCF9] flex items-center justify-center text-sm text-[#A8A29E]">Загрузка роадмапа…</div>

  return (
    <div className="min-h-screen bg-[#FCFCF9] flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#FCFCF9]/80 border-b border-[#E7E5E4]">
        <div className="mx-auto max-w-[1160px] px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm hover:text-[#0A0A0A]"><ArrowLeft className="h-4 w-4" /> Дашборд</Link>
          <div className="flex items-center gap-2"><Map className="h-4 w-4" /><span className="font-semibold text-sm">Роадмап</span><Badge>production</Badge></div>
          <Link href="/" className="text-sm text-[#57534E] hover:text-[#0A0A0A]">Лендинг</Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1160px] w-full px-6 py-6 md:py-8 flex-1">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Твой роадмап</h1>
            <p className="text-sm text-[#57534E] mt-2 max-w-[520px]">Собери путь на квартал или год. Разбей на вехи, отмечай прогресс — динамика покажет, идёшь ли в пике.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#A8A29E] border border-[#E7E5E4] rounded-full px-3 py-1.5 bg-white">
            <TrendingUp className="h-3.5 w-3.5" /> {roadmaps.length} роадмапов · {milestones.filter(m => m.completed).length}/{milestones.length} вех
          </div>
        </div>

        <Card className="p-5 mb-6">
          <div className="text-sm font-semibold flex items-center gap-2"><Target className="h-4 w-4" /> Новый роадмап</div>
          <div className="mt-3 flex flex-col sm:flex-row gap-3">
            <Input placeholder="Напр. Выучить английский до B2" value={title} onChange={e => setTitle(e.target.value)} className="flex-1" />
            <select value={quarter} onChange={e => setQuarter(e.target.value)} className="h-11 rounded-full border border-[#E7E5E4] bg-white px-4 text-sm">
              <option>Q1 2026</option><option>Q2 2026</option><option>Q3 2026</option><option>Q4 2026</option><option>2026</option><option>90 дней</option>
            </select>
            <Button onClick={() => { createRoadmap(title, quarter); setTitle("") }} className="gap-2 shrink-0"><Plus className="h-4 w-4" /> Создать</Button>
          </div>
          {roadmaps.length === 0 && <div className="mt-4 text-sm text-[#737373] bg-[#F5F5F3] border border-dashed border-[#E7E5E4] rounded-2xl p-4">Пока пусто. Примеры: «Запустить продукт», «Форма к лету», «90 дней дисциплины». Создай первый — и добавь 3 вехи.</div>}
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          {roadmaps.map(rm => {
            const ms = milestones.filter(m => m.roadmap_id === rm.id)
            const done = ms.filter(m => m.completed).length
            const progress = ms.length ? Math.round((done / ms.length) * 100) : 0
            const isOpen = expanded === rm.id
            return (
              <motion.div key={rm.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}>
                <Card className="overflow-hidden h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-start justify-between gap-3">
                      <span className="flex-1 leading-tight">{rm.title}</span>
                      <Badge className="shrink-0">{rm.quarter}</Badge>
                    </CardTitle>
                    <div className="text-xs text-[#737373] flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {new Date(rm.created_at).toLocaleDateString("ru-RU")} · {ms.length} вех</div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5"><span className="text-[#57534E] font-medium">Прогресс</span><span className="font-mono">{progress}%</span></div>
                      <div className="h-2 bg-[#F5F5F3] rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.6 }} className="h-full bg-[#0A0A0A] rounded-full" /></div>
                      <div className="text-xs text-[#A8A29E] mt-1">{done}/{ms.length} готово</div>
                    </div>

                    <div className="space-y-2">
                      <AnimatePresence>
                        {ms.map(m => (
                          <motion.div key={m.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.97 }} className={`flex items-center gap-3 rounded-2xl border p-3 ${m.completed ? "bg-[#0A0A0A] text-white border-[#0A0A0A]" : "bg-white border-[#E7E5E4]"}`}>
                            <button onClick={() => toggleMilestone(m.id)} className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 ${m.completed ? "bg-white text-[#0A0A0A] border-white" : "border-[#E7E5E4] bg-[#F5F5F3]"}`}>{m.completed && <Check className="h-3.5 w-3.5" />}</button>
                            <span className="text-sm flex-1">{m.title}</span>
                            <span className="text-xs opacity-60">{m.completed ? "✓" : ""}</span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {ms.length === 0 && <div className="text-sm text-[#A8A29E] text-center py-3 border border-dashed border-[#E7E5E4] rounded-2xl">Нет вех — добавь первую</div>}
                    </div>

                    <div className="flex gap-2 mt-auto">
                      <Input placeholder="Новая веха…" value={newMilestone[rm.id] ?? ""} onChange={e => setNewMilestone(s => ({ ...s, [rm.id]: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") { addMilestone(rm.id, newMilestone[rm.id] ?? ""); setNewMilestone(s => ({ ...s, [rm.id]: "" })) } }} className="flex-1" />
                      <Button size="icon" className="rounded-full shrink-0" onClick={() => { addMilestone(rm.id, newMilestone[rm.id] ?? ""); setNewMilestone(s => ({ ...s, [rm.id]: "" })) }}><Plus className="h-4 w-4" /></Button>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setExpanded(isOpen ? null : rm.id)} className="flex-1">{isOpen ? "Свернуть" : "Детали"}</Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (confirm("Удалить роадмап и вехи?")) deleteRoadmap(rm.id) }} className="text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5 mr-1" />Удалить</Button>
                    </div>

                    {isOpen && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-xs text-[#737373] bg-[#F5F5F3] rounded-2xl p-3 border border-[#E7E5E4] overflow-hidden">
                        <div>Статус: {rm.status} · Цвет {rm.color}</div>
                        <div className="mt-1">Динамика: {progress < 30 ? "Старт — добавь вехи" : progress < 70 ? "В процессе — держи темп" : "Финиш близко — добей"}</div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {roadmaps.length > 0 && (
          <Card className="mt-6 p-5 bg-[#0A0A0A] text-white border-[#0A0A0A]">
            <div className="text-sm font-medium">Как использовать продакшн-роадмап</div>
            <p className="text-sm opacity-70 mt-1 leading-6">Утро: выбери 1 веху из роадмапа в топ-3. Вечер: отметь веху как done, если продвинулся. Динамика в дашборде покажет корреляцию «ритуалы → прогресс роадмапа».</p>
          </Card>
        )}
      </main>

      <footer className="border-t border-[#E7E5E4] bg-white"><div className="mx-auto max-w-[1160px] px-6 py-4 text-xs text-[#A8A29E] flex items-center justify-between"><span>Роадмапы хранятся с RLS · локальный fallback</span><Link href="/dashboard" className="hover:text-[#0A0A0A]">В дашборд →</Link></div></footer>
    </div>
  )
}
