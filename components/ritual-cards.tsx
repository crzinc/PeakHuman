"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sunrise, Sunset, Check, Sparkles, Target } from "lucide-react"
import { useRituals } from "@/lib/hooks/useRituals"
import { getTodayKey } from "@/lib/utils"

export function RitualCards() {
  const { rituals, upsert } = useRituals()
  const todayKey = getTodayKey()
  const ritual = rituals[todayKey]

  const morningDone = !!ritual?.morning_done
  const eveningDone = !!ritual?.evening_done

  const [showMorning, setShowMorning] = useState(false)
  const [showEvening, setShowEvening] = useState(false)

  // morning form
  const [intention, setIntention] = useState("")
  const [top1, setTop1] = useState("")
  const [top2, setTop2] = useState("")
  const [top3, setTop3] = useState("")
  const [mEnergy, setMEnergy] = useState(7)

  // evening form
  const [reflection, setReflection] = useState("")
  const [gratitude, setGratitude] = useState("")
  const [lesson, setLesson] = useState("")
  const [eScore, setEScore] = useState(7)

  const hour = new Date().getHours()
  const morningWindow = hour >= 5 && hour < 15
  const eveningWindow = hour >= 15

  async function submitMorning() {
    if (!intention.trim() || !top1.trim()) return
    await upsert(todayKey, {
      morning_done: true,
      morning_at: new Date().toISOString(),
      morning_intention: intention.trim(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      morning_top3: [top1.trim(), top2.trim(), top3.trim()].filter(Boolean) as any,
      morning_energy: mEnergy,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    setShowMorning(false)
  }

  async function submitEvening() {
    if (!reflection.trim()) return
    await upsert(todayKey, {
      evening_done: true,
      evening_at: new Date().toISOString(),
      evening_reflection: reflection.trim(),
      evening_gratitude: gratitude.trim(),
      evening_lesson: lesson.trim(),
      evening_score: eScore,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    setShowEvening(false)
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Morning */}
      <Card className={`overflow-hidden ${morningDone ? "border-emerald-200 bg-emerald-50/40" : "border-amber-200"}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className={`h-8 w-8 rounded-full flex items-center justify-center ${morningDone ? "bg-emerald-500 text-white" : "bg-amber-100 border border-amber-200"}`}>
              {morningDone ? <Check className="h-4 w-4" /> : <Sunrise className="h-4 w-4 text-amber-700" />}
            </span>
            Утро · план на день
            {morningDone && <span className="ml-auto text-xs bg-emerald-500 text-white rounded-full px-2 py-1">готово</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {morningDone ? (
            <div className="space-y-2 text-sm">
              <div><span className="text-[#A8A29E]">Намерение:</span> <span className="font-medium">{ritual.morning_intention}</span></div>
              <div className="flex flex-wrap gap-1.5">
                {(ritual.morning_top3 as string[]).map((t, i) => <span key={i} className="text-xs bg-white border border-[#E7E5E4] rounded-full px-2.5 py-1">{i + 1}. {t}</span>)}
              </div>
              <div className="text-xs text-[#737373]">Энергия утром: {ritual.morning_energy}/10 · {ritual.morning_at ? new Date(ritual.morning_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : ""}</div>
              <Button variant="outline" size="sm" onClick={() => setShowMorning(true)} className="w-full mt-2">Изменить</Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#57534E] leading-5">Задай намерение и выбери 3 главных дела. Утро формирует вечер.</p>
              {!morningWindow && <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">Окно утра 05:00–15:00, но можешь заполнить сейчас.</div>}
              <Button onClick={() => setShowMorning(true)} className="w-full gap-2"><Target className="h-4 w-4" /> Пройти утренний ритуал</Button>
            </>
          )}

          <AnimatePresence>
            {showMorning && !morningDone && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 pt-3 border-t border-[#E7E5E4] mt-3 overflow-hidden">
                <div><label className="text-sm font-medium">Намерение дня</label><Input value={intention} onChange={e => setIntention(e.target.value)} placeholder="Сегодня действую как…" className="mt-1.5" /></div>
                <div><label className="text-sm font-medium">Топ-3</label><div className="grid gap-2 mt-1.5"><Input value={top1} onChange={e => setTop1(e.target.value)} placeholder="1. Главное" /><Input value={top2} onChange={e => setTop2(e.target.value)} placeholder="2. Важно" /><Input value={top3} onChange={e => setTop3(e.target.value)} placeholder="3. Дополнительно" /></div></div>
                <div><label className="text-sm font-medium">Энергия утром {mEnergy}/10</label><input type="range" min={1} max={10} value={mEnergy} onChange={e => setMEnergy(Number(e.target.value))} className="w-full accent-[#0A0A0A] mt-1" /></div>
                <div className="flex gap-2"><Button variant="ghost" onClick={() => setShowMorning(false)} className="flex-1">Отмена</Button><Button onClick={submitMorning} className="flex-1">Сохранить утро</Button></div>
              </motion.div>
            )}
            {showMorning && morningDone && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 pt-3 border-t border-[#E7E5E4] mt-3 overflow-hidden">
                <Input value={ritual.morning_intention ?? ""} onChange={e => setIntention(e.target.value || ritual.morning_intention || "")} placeholder="Намерение" />
                <div className="flex gap-2"><Button variant="ghost" onClick={() => setShowMorning(false)} className="flex-1">Закрыть</Button></div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Evening */}
      <Card className={`overflow-hidden ${eveningDone ? "border-indigo-200 bg-indigo-50/30" : "border-[#E7E5E4]"}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className={`h-8 w-8 rounded-full flex items-center justify-center ${eveningDone ? "bg-indigo-500 text-white" : "bg-[#F5F5F3] border border-[#E7E5E4]"}`}>
              {eveningDone ? <Check className="h-4 w-4" /> : <Sunset className="h-4 w-4" />}
            </span>
            Вечер · рефлексия
            {eveningDone && <span className="ml-auto text-xs bg-indigo-500 text-white rounded-full px-2 py-1">готово</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {eveningDone ? (
            <div className="space-y-2 text-sm">
              <div><span className="text-[#A8A29E]">Итог:</span> <span className="font-medium line-clamp-2">{ritual.evening_reflection}</span></div>
              {ritual.evening_gratitude && <div><span className="text-[#A8A29E]">Благодарность:</span> {ritual.evening_gratitude}</div>}
              <div className="text-xs text-[#737373]">Оценка дня: {ritual.evening_score}/10 · {ritual.evening_at ? new Date(ritual.evening_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : ""}</div>
              <Button variant="outline" size="sm" onClick={() => setShowEvening(true)} className="w-full mt-2">Изменить</Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#57534E] leading-5">Отметь что получилось, за что благодарен и урок дня. Вечер закрывает цикл.</p>
              {!eveningWindow && <div className="text-xs text-[#737373] bg-[#F5F5F3] border border-[#E7E5E4] rounded-xl px-3 py-2">Окно вечера с 15:00, но можешь заполнить раньше.</div>}
              <Button onClick={() => setShowEvening(true)} variant={morningDone ? "default" : "outline"} className="w-full gap-2"><Sparkles className="h-4 w-4" /> Пройти вечерний ритуал</Button>
              {!morningDone && <div className="text-xs text-[#A8A29E] text-center">Сначала утро — затем вечер, так динамика честнее.</div>}
            </>
          )}

          <AnimatePresence>
            {showEvening && !eveningDone && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 pt-3 border-t border-[#E7E5E4] mt-3 overflow-hidden">
                <div><label className="text-sm font-medium">Что получилось сегодня</label><textarea value={reflection} onChange={e => setReflection(e.target.value)} placeholder="3 победы, что сделал из топ-3…" rows={2} className="mt-1.5 w-full rounded-2xl border border-[#E7E5E4] px-4 py-3 text-sm" /></div>
                <div><label className="text-sm font-medium">Благодарность</label><Input value={gratitude} onChange={e => setGratitude(e.target.value)} placeholder="За что благодарен" className="mt-1.5" /></div>
                <div><label className="text-sm font-medium">Урок</label><Input value={lesson} onChange={e => setLesson(e.target.value)} placeholder="Чему научился" className="mt-1.5" /></div>
                <div><label className="text-sm font-medium">Оценка дня {eScore}/10</label><input type="range" min={1} max={10} value={eScore} onChange={e => setEScore(Number(e.target.value))} className="w-full accent-[#0A0A0A] mt-1" /></div>
                <div className="flex gap-2"><Button variant="ghost" onClick={() => setShowEvening(false)} className="flex-1">Отмена</Button><Button onClick={submitEvening} className="flex-1">Сохранить вечер</Button></div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}
