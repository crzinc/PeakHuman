"use client"
import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRoadmaps } from "@/lib/hooks/useRoadmaps"
import { ArrowLeft, Map, Plus, Check, Trash2, Target, Calendar, TrendingUp, Edit3, GripVertical, X, Save, Clock } from "lucide-react"

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })
}

export default function RoadmapPage() {
  const { roadmaps, milestones, loading, createRoadmap, updateRoadmap, addMilestone, updateMilestone, toggleMilestone, deleteMilestone, deleteRoadmap, reorderMilestones } = useRoadmaps()
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [quarter, setQuarter] = useState("Q1 2026")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [color, setColor] = useState("#0A0A0A")
  const [customPeriod, setCustomPeriod] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingRoadmap, setEditingRoadmap] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editStart, setEditStart] = useState("")
  const [editEnd, setEditEnd] = useState("")
  const [newMilestone, setNewMilestone] = useState<Record<string, string>>({})
  const [newMilestoneDate, setNewMilestoneDate] = useState<Record<string, string>>({})
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null)
  const [editMTitle, setEditMTitle] = useState("")
  const [editMDesc, setEditMDesc] = useState("")
  const [editMDue, setEditMDue] = useState("")

  if (loading) return <div className="min-h-screen bg-[#FCFCF9] flex items-center justify-center text-sm text-[#A8A29E]">Загрузка роадмапа…</div>

  function handleCreate() {
    if (!title.trim()) return
    const q = customPeriod ? "custom" : quarter
    const s = customPeriod ? (startDate || null) : null
    const e = customPeriod ? (endDate || null) : null
    // if not custom, derive dates from quarter
    let sd = s, ed = e
    if (!customPeriod) {
      const map: Record<string, [string, string]> = {
        "Q1 2026": ["2026-01-01", "2026-03-31"],
        "Q2 2026": ["2026-04-01", "2026-06-30"],
        "Q3 2026": ["2026-07-01", "2026-09-30"],
        "Q4 2026": ["2026-10-01", "2026-12-31"],
        "2026": ["2026-01-01", "2026-12-31"],
        "90 дней": [new Date().toISOString().split("T")[0], new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0]],
      }
      if (map[quarter]) { sd = map[quarter][0]; ed = map[quarter][1] }
    }
    createRoadmap({ title, description: desc, quarter: q, start_date: sd, end_date: ed, color })
    setTitle(""); setDesc(""); setStartDate(""); setEndDate("")
  }

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
            <p className="text-sm text-[#57534E] mt-2 max-w-[520px]">Собери путь с точными датами. Роадмап — на квартал, вехи — с дедлайнами. Всё редактируется, двигается, отслеживается.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#A8A29E] border border-[#E7E5E4] rounded-full px-3 py-1.5 bg-white">
            <TrendingUp className="h-3.5 w-3.5" /> {roadmaps.length} роадмапов · {milestones.filter(m => m.completed).length}/{milestones.length} вех
          </div>
        </div>

        <Card className="p-6 mb-6">
          <div className="text-sm font-semibold flex items-center gap-2"><Target className="h-4 w-4" /> Новый роадмап — глубокая кастомизация</div>
          <div className="mt-4 grid gap-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input placeholder="Напр. Выучить английский до B2" value={title} onChange={e => setTitle(e.target.value)} />
              <div className="flex gap-2">
                <select value={quarter} onChange={e => setQuarter(e.target.value)} disabled={customPeriod} className="flex-1 h-11 rounded-full border border-[#E7E5E4] bg-white px-4 text-sm disabled:opacity-50">
                  <option>Q1 2026</option><option>Q2 2026</option><option>Q3 2026</option><option>Q4 2026</option><option>2026</option><option>90 дней</option>
                </select>
                <label className="flex items-center gap-1.5 text-xs border border-[#E7E5E4] rounded-full px-3 bg-[#F5F5F3] cursor-pointer">
                  <input type="checkbox" checked={customPeriod} onChange={e => setCustomPeriod(e.target.checked)} /> кастом
                </label>
              </div>
            </div>
            <Input placeholder="Описание (опционально) — зачем этот путь" value={desc} onChange={e => setDesc(e.target.value)} />
            {customPeriod && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="grid sm:grid-cols-3 gap-3 overflow-hidden">
                <div><label className="text-xs text-[#737373]">Старт</label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1" /></div>
                <div><label className="text-xs text-[#737373]">Финиш</label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1" /></div>
                <div><label className="text-xs text-[#737373]">Цвет</label><div className="flex gap-2 mt-1"><input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-11 w-11 rounded-full border border-[#E7E5E4] p-1" /><span className="text-xs text-[#A8A29E] self-center">{color}</span></div></div>
              </motion.div>
            )}
            <Button onClick={handleCreate} className="gap-2 w-fit"><Plus className="h-4 w-4" /> Создать роадмап</Button>
          </div>
          {roadmaps.length === 0 && <div className="mt-4 text-sm text-[#737373] bg-[#F5F5F3] border border-dashed border-[#E7E5E4] rounded-2xl p-4">Пока пусто. Примеры: «Запустить продукт», «Форма к лету», «90 дней дисциплины». Создай первый — и добавь 3 вехи с датами.</div>}
        </Card>

        <div className="space-y-4">
          {roadmaps.map(rm => {
            const ms = milestones.filter(m => m.roadmap_id === rm.id).sort((a, b) => a.order_index - b.order_index)
            const done = ms.filter(m => m.completed).length
            const progress = ms.length ? Math.round((done / ms.length) * 100) : 0
            const isOpen = expanded === rm.id
            const isEditing = editingRoadmap === rm.id
            return (
              <motion.div key={rm.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[24px] border border-[#E7E5E4] bg-white overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: rm.color, background: `${rm.color}12` }}><Map className="h-4 w-4" style={{ color: rm.color }} /></div>
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Название" />
                            <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Описание" />
                            <div className="grid grid-cols-2 gap-2">
                              <Input type="date" value={editStart} onChange={e => setEditStart(e.target.value)} />
                              <Input type="date" value={editEnd} onChange={e => setEditEnd(e.target.value)} />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => { updateRoadmap(rm.id, { title: editTitle, description: editDesc, start_date: editStart || null, end_date: editEnd || null }); setEditingRoadmap(null) }} className="gap-1"><Save className="h-3.5 w-3.5" /> Сохранить</Button>
                              <Button variant="ghost" size="sm" onClick={() => setEditingRoadmap(null)}><X className="h-3.5 w-3.5" /> Отмена</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="font-semibold leading-tight flex items-center gap-2">{rm.title} <Badge className="text-xs bg-white border-[#E7E5E4]">{rm.quarter}</Badge></div>
                            {rm.description && <div className="text-sm text-[#57534E] mt-1">{rm.description}</div>}
                            <div className="text-xs text-[#737373] flex flex-wrap items-center gap-3 mt-2">
                              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(rm.start_date)} → {formatDate(rm.end_date)}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {ms.length} вех</span>
                              <span className="hidden sm:inline">· {new Date(rm.created_at).toLocaleDateString("ru-RU")}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex gap-1">
                        {!isEditing && <Button variant="ghost" size="sm" onClick={() => { setEditingRoadmap(rm.id); setEditTitle(rm.title); setEditDesc(rm.description || ""); setEditStart(rm.start_date || ""); setEditEnd(rm.end_date || "") }}><Edit3 className="h-3.5 w-3.5" /></Button>}
                        <Button variant="ghost" size="sm" onClick={() => setExpanded(isOpen ? null : rm.id)}>{isOpen ? "Свернуть" : "Открыть"}</Button>
                      </div>
                      <Badge className={rm.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-zinc-50"}>{rm.status}</Badge>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1.5"><span className="text-[#57534E] font-medium">Прогресс</span><span className="font-mono">{progress}%</span></div>
                    <div className="h-2 bg-[#F5F5F3] rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full" style={{ background: rm.color }} /></div>
                    <div className="text-xs text-[#A8A29E] mt-1">{done}/{ms.length} готово · {progress < 30 ? "Старт" : progress < 70 ? "В процессе" : "Финиш близко"}</div>
                  </div>

                  {/* Timeline mini */}
                  {ms.length > 1 && (
                    <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-1">
                      {ms.map((m, i) => (
                        <div key={m.id} className="flex items-center gap-1 shrink-0">
                          <div className={`h-2.5 w-2.5 rounded-full border-2 ${m.completed ? "bg-emerald-500 border-emerald-500" : "bg-white border-[#E7E5E4]"}`} />
                          {i < ms.length - 1 && <div className={`h-[2px] w-8 ${m.completed ? "bg-emerald-500" : "bg-[#E7E5E4]"}`} />}
                        </div>
                      ))}
                      <span className="text-xs text-[#A8A29E] ml-2">{ms.filter(m => m.due_date).length} с датами</span>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-t border-[#E7E5E4] bg-[#FCFCF9] overflow-hidden">
                      <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">Вехи — глубокая кастомизация</span>
                          <span className="text-xs text-[#A8A29E]">перетаскивай · редактируй · ставь даты</span>
                        </div>

                        {ms.map((m, idx) => {
                          const isEditingM = editingMilestone === m.id
                          return (
                            <motion.div key={m.id} layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className={`flex gap-3 rounded-2xl border p-4 items-start ${m.completed ? "bg-[#0A0A0A] text-white border-[#0A0A0A]" : "bg-white border-[#E7E5E4]"}`}>
                              <button onClick={() => reorderMilestones(rm.id, idx, Math.max(0, idx - 1))} className="mt-1 text-[#A8A29E] hover:text-[#0A0A0A]"><GripVertical className="h-4 w-4" /></button>
                              <button onClick={() => toggleMilestone(m.id)} className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${m.completed ? "bg-white text-[#0A0A0A] border-white" : "border-[#E7E5E4] bg-[#F5F5F3]"}`}>{m.completed && <Check className="h-3.5 w-3.5" />}</button>
                              <div className="flex-1 min-w-0">
                                {isEditingM ? (
                                  <div className="space-y-2">
                                    <Input value={editMTitle} onChange={e => setEditMTitle(e.target.value)} placeholder="Название вехи" className={m.completed ? "bg-white text-black" : ""} />
                                    <Input value={editMDesc} onChange={e => setEditMDesc(e.target.value)} placeholder="Описание" className={m.completed ? "bg-white text-black" : ""} />
                                    <Input type="date" value={editMDue} onChange={e => setEditMDue(e.target.value)} className={m.completed ? "bg-white text-black" : ""} />
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={() => { updateMilestone(m.id, { title: editMTitle, description: editMDesc || null, due_date: editMDue || null }); setEditingMilestone(null) }}><Save className="h-3 w-3 mr-1" /> Сохранить</Button>
                                      <Button variant="ghost" size="sm" onClick={() => setEditingMilestone(null)}>Отмена</Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className={`text-sm font-medium ${m.completed ? "line-through opacity-70" : ""}`}>{m.title}</div>
                                    {m.description && <div className="text-xs opacity-70 mt-1">{m.description}</div>}
                                    <div className="text-xs flex items-center gap-2 mt-1.5 flex-wrap">
                                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 border ${m.completed ? "bg-white/10 border-white/20 text-white" : "bg-[#F5F5F3] border-[#E7E5E4] text-[#57534E]"}`}><Calendar className="h-3 w-3" /> {m.due_date ? formatDate(m.due_date) : "без даты"}</span>
                                      <span className="text-[#A8A29E]">#{idx + 1}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                              <div className="flex flex-col gap-1 shrink-0">
                                {!isEditingM && <Button variant="ghost" size="sm" onClick={() => { setEditingMilestone(m.id); setEditMTitle(m.title); setEditMDesc(m.description || ""); setEditMDue(m.due_date || "") }}><Edit3 className="h-3.5 w-3.5" /></Button>}
                                <Button variant="ghost" size="sm" onClick={() => deleteMilestone(m.id)} className="text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></Button>
                                <button onClick={() => reorderMilestones(rm.id, idx, Math.min(ms.length - 1, idx + 1))} className="text-[#A8A29E] hover:text-[#0A0A0A] flex justify-center"><GripVertical className="h-4 w-4 rotate-180" /></button>
                              </div>
                            </motion.div>
                          )
                        })}

                        {ms.length === 0 && <div className="text-sm text-[#A8A29E] text-center py-4 border border-dashed border-[#E7E5E4] rounded-2xl bg-white">Нет вех — добавь первую с датой</div>}

                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          <Input placeholder="Новая веха…" value={newMilestone[rm.id] ?? ""} onChange={e => setNewMilestone(s => ({ ...s, [rm.id]: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") { addMilestone(rm.id, newMilestone[rm.id] ?? "", newMilestoneDate[rm.id] || null); setNewMilestone(s => ({ ...s, [rm.id]: "" })); setNewMilestoneDate(s => ({ ...s, [rm.id]: "" })) } }} className="flex-1 bg-white" />
                          <Input type="date" value={newMilestoneDate[rm.id] ?? ""} onChange={e => setNewMilestoneDate(s => ({ ...s, [rm.id]: e.target.value }))} className="sm:w-[160px] bg-white" />
                          <Button onClick={() => { addMilestone(rm.id, newMilestone[rm.id] ?? "", newMilestoneDate[rm.id] || null); setNewMilestone(s => ({ ...s, [rm.id]: "" })); setNewMilestoneDate(s => ({ ...s, [rm.id]: "" })) }} className="shrink-0 gap-1"><Plus className="h-4 w-4" /> Добавить</Button>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-[#E7E5E4] mt-4">
                          <Button variant="outline" size="sm" onClick={() => updateRoadmap(rm.id, { status: rm.status === "active" ? "done" : "active" })}>{rm.status === "active" ? "Завершить" : "Вернуть в работу"}</Button>
                          <Button variant="ghost" size="sm" onClick={() => { if (confirm("Удалить роадмап и все вехи?")) deleteRoadmap(rm.id) }} className="text-red-600 hover:bg-red-50 ml-auto"><Trash2 className="h-3.5 w-3.5 mr-1" /> Удалить роадмап</Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {roadmaps.length > 0 && (
          <Card className="mt-6 p-5 bg-[#0A0A0A] text-white border-[#0A0A0A]">
            <div className="text-sm font-medium">Грамотная логика</div>
            <p className="text-sm opacity-70 mt-1 leading-6">Роадмап — период (старт/финиш) кастомизируется. Вехи — каждая с датой, описанием, порядком. Двигай вехи стрелками, редактируй inline, отмечай done — прогресс и таймлайн обновятся. Динамика в дашборде свяжет ритуалы и роадмап.</p>
          </Card>
        )}
      </main>

      <footer className="border-t border-[#E7E5E4] bg-white"><div className="mx-auto max-w-[1160px] px-6 py-4 text-xs text-[#A8A29E] flex items-center justify-between"><span>Роадмапы с датами · RLS · локальный fallback</span><Link href="/dashboard" className="hover:text-[#0A0A0A]">В дашборд →</Link></div></footer>
    </div>
  )
}
