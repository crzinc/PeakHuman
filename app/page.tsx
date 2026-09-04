"use client"
import Link from "next/link"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { LandingHeader } from "@/components/landing-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowUpRight, Zap, Moon, Target, TrendingUp, Check, Sparkles, Activity } from "lucide-react"

const Hero3D = dynamic(() => import("@/components/hero-3d").then(m => m.Hero3D), { ssr: false })

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }),
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

export default function Home() {
  return (
    <div className="flex-1 flex flex-col">
      <LandingHeader />

      {/* HERO */}
      <section className="mx-auto max-w-[1160px] w-full px-6 pt-12 md:pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[32px] bg-white border border-[#E7E5E4] overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#F5F5F3]/50 to-transparent pointer-events-none" />
          <div className="absolute -top-24 -right-24 h-[500px] w-[500px] bg-[#F5F5F3] rounded-full blur-3xl opacity-60" />
          {/* Three.js subtle layer */}
          <div className="absolute inset-0 opacity-[0.45] hidden md:block">
            <Hero3D />
          </div>

          <div className="relative grid md:grid-cols-2 gap-0">
            <motion.div variants={stagger} initial="hidden" animate="show" className="p-8 md:p-12 lg:p-14 flex flex-col">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 text-xs border border-[#E7E5E4] rounded-full px-3 py-1.5 w-fit bg-[#FCFCF9]">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[#57534E] font-medium">347 человек в пике сегодня</span>
              </motion.div>

              <motion.h1 variants={fadeUp} custom={1} className="mt-8 text-[42px] md:text-[56px] font-semibold tracking-[-0.04em] leading-[0.95] text-[#0A0A0A]">
                Твоя
                <br />
                <span className="font-light italic">пиковая</span>
                <br />
                версия.
              </motion.h1>

              <motion.p variants={fadeUp} custom={2} className="mt-6 text-[17px] leading-7 text-[#57534E] max-w-[420px]">
                Минималистичная OS для тела и разума. Привычки · Энергия · Сон · Фокус. Без шума. Только прогресс.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap gap-3">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link href="/dashboard">
                    <Button size="lg" className="gap-2 pr-4">
                      Открыть PeakHuman <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link href="#how">
                    <Button variant="outline" size="lg">
                      Как это работает
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div variants={fadeUp} custom={4} className="mt-10 flex items-center gap-6 text-xs text-[#A8A29E] border-t border-[#F5F5F3] pt-6">
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#0A0A0A]" /> Без подписки</span>
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#0A0A0A]" /> Данные — твои</span>
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#0A0A0A]" /> 30 сек в день</span>
              </motion.div>
            </motion.div>

            {/* Mock dashboard preview */}
            <motion.div
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#F5F5F3] p-6 md:p-8 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-[#E7E5E4]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-widest text-[#78716C] uppercase">Сегодня · 4 сентября</span>
                <motion.span animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2.2, repeat: Infinity }} className="text-xs bg-[#0A0A0A] text-white rounded-full px-2.5 py-1 font-medium">Peak Score 84</motion.span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Энергия", value: "8.4", sub: "/10" },
                  { label: "Сон", value: "7.5", sub: "ч" },
                  { label: "Фокус", value: "9.1", sub: "/10" },
                ].map((m, i) => (
                  <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.07 }} whileHover={{ y: -3 }} className="bg-white rounded-2xl border border-[#E7E5E4] p-4">
                    <div className="text-[11px] tracking-widest uppercase text-[#A8A29E] font-medium">{m.label}</div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-semibold tracking-tight">{m.value}</span>
                      <span className="text-xs text-[#A8A29E]">{m.sub}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div whileHover={{ scale: 1.01 }} className="bg-[#0A0A0A] rounded-2xl p-5 text-white relative overflow-hidden">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-2xl" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="text-xs tracking-widest uppercase opacity-60">Streak</div>
                    <div className="text-3xl font-light mt-1">12 <span className="text-sm opacity-60">дней</span></div>
                  </div>
                  <motion.div animate={{ rotate: [0, 12, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="h-14 w-14 rounded-full border border-white/20 flex items-center justify-center">
                    <Sparkles className="h-6 w-6" />
                  </motion.div>
                </div>
                <div className="mt-4 h-1.5 bg-white/15 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: "84%" }} transition={{ delay: 0.9, duration: 1, ease: [0.22, 1, 0.36, 1] }} className="h-full bg-white rounded-full" />
                </div>
              </motion.div>

              <div className="bg-white rounded-2xl border border-[#E7E5E4] p-4">
                <div className="text-sm font-medium">Привычки сегодня</div>
                <div className="mt-3 space-y-2.5">
                  {[
                    { name: "Медитация 10м", done: true },
                    { name: "Тренировка", done: true },
                    { name: "Чтение 30м", done: false },
                    { name: "Без сахара", done: true },
                  ].map((h, i) => (
                    <motion.div key={h.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.06 }} className="flex items-center gap-3 text-sm">
                      <motion.div whileTap={{ scale: 0.85 }} className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${h.done ? "bg-[#0A0A0A] border-[#0A0A0A] text-white" : "border-[#E7E5E4]"}`}>
                        {h.done && <Check className="h-3 w-3" />}
                      </motion.div>
                      <span className={h.done ? "text-[#0A0A0A]" : "text-[#57534E]"}>{h.name}</span>
                      <span className="ml-auto text-xs text-[#A8A29E]">{h.done ? "✓" : "—"}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-[#A8A29E]">
          <span>Работает на</span>
          <span className="inline-flex items-center gap-1.5 border border-[#E7E5E4] rounded-full px-3 py-1 bg-white">Next.js 16 <span className="h-1 w-1 bg-emerald-500 rounded-full" /></span>
          <span className="inline-flex items-center gap-1.5 border border-[#E7E5E4] rounded-full px-3 py-1 bg-white">Supabase <span className="h-1 w-1 bg-emerald-500 rounded-full" /></span>
          <span className="inline-flex items-center gap-1.5 border border-[#E7E5E4] rounded-full px-3 py-1 bg-white">Three.js <span className="h-1 w-1 bg-violet-500 rounded-full" /></span>
        </motion.div>
      </section>

      {/* SYSTEM */}
      <motion.section
        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.55 }}
        id="system" className="mx-auto max-w-[1160px] w-full px-6 py-12"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Система, а не цели.</h2>
          <p className="text-[#57534E] max-w-[420px] text-[15px] leading-6">4 метрики. Ежедневный ритуал 30 секунд. Алгоритм считает твой Peak Score — честный индикатор формы.</p>
        </div>

        <div className="mt-8 grid md:grid-cols-4 gap-4">
          {[
            { icon: Zap, title: "Энергия", desc: "1–10. Как чувствуется тело сегодня?", accent: "bg-amber-50 border-amber-200" },
            { icon: Moon, title: "Сон", desc: "Часы + качество. Фундамент всего.", accent: "bg-indigo-50 border-indigo-200" },
            { icon: Target, title: "Фокус", desc: "Глубина работы без отвлечений.", accent: "bg-emerald-50 border-emerald-200" },
            { icon: Activity, title: "Привычки", desc: "Строительные блоки идентичности.", accent: "bg-zinc-50 border-zinc-200" },
          ].map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} whileHover={{ y: -4, scale: 1.01 }}>
              <Card className="p-6 flex flex-col gap-4 hover:shadow-md transition-shadow h-full">
                <motion.div whileHover={{ rotate: 8, scale: 1.06 }} className={`h-10 w-10 rounded-full border flex items-center justify-center ${f.accent}`}>
                  <f.icon className="h-5 w-5 text-[#0A0A0A]" />
                </motion.div>
                <div>
                  <div className="font-semibold">{f.title}</div>
                  <div className="text-sm text-[#57534E] mt-1 leading-5">{f.desc}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* HOW */}
      <motion.section initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} id="how" className="mx-auto max-w-[1160px] w-full px-6 py-12">
        <div className="rounded-[28px] bg-[#0A0A0A] text-white p-8 md:p-10 flex flex-col gap-8 overflow-hidden relative">
          <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.06, 0.1, 0.06] }} transition={{ duration: 6, repeat: Infinity }} className="absolute -bottom-24 -right-24 h-[400px] w-[400px] bg-white/5 rounded-full blur-3xl" />
          <div className="relative grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="text-xs tracking-widest uppercase opacity-60">Как это работает</div>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight leading-tight">3 шага к пику.</h3>
              <p className="mt-3 text-sm opacity-60 leading-6">Никакой магии. Только консистентность, измеренная минимализмом.</p>
              <Link href="/dashboard" className="inline-flex mt-6">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="secondary" className="bg-white text-[#0A0A0A] hover:bg-[#F5F5F3] rounded-full">
                    Попробовать
                  </Button>
                </motion.div>
              </Link>
            </div>
            <div className="md:col-span-2 grid sm:grid-cols-3 gap-4">
              {[
                { n: "01", t: "Отметь день", d: "Энергия, сон, фокус, привычки. 30 секунд утром." },
                { n: "02", t: "Увидь паттерн", d: "Графики за 7/30 дней. Корреляции без догадок." },
                { n: "03", t: "Держи streak", d: "Не разрывай цепь. Мозг любит серии побед." },
              ].map((s, i) => (
                <motion.div key={s.n} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ y: -3 }} className="bg-white/[0.06] border border-white/10 rounded-2xl p-6 backdrop-blur">
                  <div className="text-xs font-mono opacity-40">{s.n}</div>
                  <div className="mt-3 font-medium">{s.t}</div>
                  <div className="mt-2 text-sm opacity-60 leading-5">{s.d}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative grid md:grid-cols-3 gap-4 text-sm">
            {[
              { title: "Приватно по умолчанию", desc: "Твои данные — только твои (RLS).", icon: "✓" },
              { title: "Peak Score — честно", desc: "Взвешенная формула, без накруток.", icon: TrendingUp },
              { title: "Начни за 10 секунд", desc: "Демо без регистрации.", icon: Sparkles },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.06 }} className="bg-white text-[#0A0A0A] rounded-2xl p-5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center shrink-0">
                  {typeof item.icon === "string" ? "✓" : <TrendingUp className="h-4 w-4" />}
                </div>
                <div><div className="font-medium">{item.title}</div><div className="text-xs text-[#57534E]">{item.desc}</div></div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* PRICING */}
      <motion.section initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} id="pricing" className="mx-auto max-w-[1160px] w-full px-6 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Просто. Честно.</h2>
          <p className="mt-3 text-[#57534E]">Бесплатно, пока ты строишь привычки. Потом — по желанию поддержишь проект.</p>
        </div>
        <div className="mt-8 grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          <motion.div whileHover={{ y: -4 }}><Card className="p-7 h-full">
            <div className="text-xs tracking-widest uppercase text-[#A8A29E] font-semibold">Peak Free</div>
            <div className="mt-3 flex items-baseline gap-2"><span className="text-4xl font-semibold tracking-tight">₽0</span><span className="text-sm text-[#57534E]">/ навсегда</span></div>
            <ul className="mt-6 space-y-2.5 text-sm">
              {["Неограниченные привычки", "Графики 7 и 30 дней", "Peak Score ежедневно", "Экспорт данных"].map((x) => (
                <li key={x} className="flex gap-2"><Check className="h-4 w-4 mt-0.5 text-emerald-600" /> {x}</li>
              ))}
            </ul>
            <Link href="/dashboard" className="mt-7 block"><motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}><Button className="w-full" size="lg">Начать бесплатно</Button></motion.div></Link>
          </Card></motion.div>
          <motion.div whileHover={{ y: -4 }}><Card className="p-7 bg-[#0A0A0A] text-white border-[#0A0A0A] h-full">
            <div className="text-xs tracking-widest uppercase opacity-60">Peak Pro — скоро</div>
            <div className="mt-3 flex items-baseline gap-2"><span className="text-4xl font-light tracking-tight">₽290</span><span className="text-sm opacity-60">/ месяц</span></div>
            <ul className="mt-6 space-y-2.5 text-sm opacity-80">
              {["AI-инсайты и корреляции", "Напоминания в Telegram", "Коуч-репорты еженедельно", "Приватные челленджи"].map((x) => (
                <li key={x} className="flex gap-2"><Check className="h-4 w-4 mt-0.5" /> {x}</li>
              ))}
            </ul>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}><Button variant="secondary" className="mt-7 w-full bg-white text-[#0A0A0A] hover:bg-[#F5F5F3]" size="lg">В лист ожидания</Button></motion.div>
          </Card></motion.div>
        </div>
      </motion.section>

      {/* FOOTER */}
      <footer className="mt-8 border-t border-[#E7E5E4] bg-white">
        <div className="mx-auto max-w-[1160px] px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ rotate: 10, scale: 1.08 }} className="h-7 w-7 rounded-full bg-[#0A0A0A] flex items-center justify-center"><span className="text-white text-[10px] font-bold">PH</span></motion.div>
            <span className="font-medium">PeakHuman © 2026</span>
            <span className="text-[#A8A29E] hidden sm:inline">Сделано с дисциплиной.</span>
          </div>
          <div className="flex items-center gap-6 text-[#57534E]">
            <a href="https://github.com" className="hover:text-[#0A0A0A]">GitHub</a>
            <a href="#" className="hover:text-[#0A0A0A]">Приватность</a>
            <Link href="/dashboard" className="hover:text-[#0A0A0A]">Открыть приложение →</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
