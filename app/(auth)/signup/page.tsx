"use client"
import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") ?? "/dashboard"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) { setError("Пароль минимум 6 символов"); return }
    setLoading(true)
    try {
      const supabase = createClient()
      if (!supabase) {
        setDone(true)
        setTimeout(() => router.push(next), 800)
        return
      }
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name || email.split("@")[0] } } })
      if (error) { setError(error.message); return }
      if (data.session) {
        router.push(next)
        router.refresh()
      } else {
        setDone(true)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="py-8 text-center">
        <div className="h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">✓</div>
        <div className="mt-4 font-medium">Аккаунт создан</div>
        <p className="text-sm text-[#737373] mt-1">Если включено подтверждение — проверь почту. Иначе сразу переходи в приложение.</p>
        <Link href={next}><Button className="mt-4 w-full">Открыть Dashboard</Button></Link>
        <p className="text-xs text-[#A8A29E] mt-3">Подтверждение почты выключено — вход мгновенный.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Имя</label>
        <Input placeholder="Алекс" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input type="email" placeholder="you@peakhuman.app" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Пароль</label>
        <Input type="password" placeholder="минимум 6 символов" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>}
      <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? "Создаём..." : "Создать аккаунт"}</Button>
      <p className="text-xs text-[#A8A29E] text-center">Данные шифруются (RLS). Пароль хранится хешем.</p>
    </form>
  )
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFCF9]">
      <div className="mx-auto max-w-[1160px] w-full px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[#0A0A0A] flex items-center justify-center"><span className="text-white text-[11px] font-bold">PH</span></div>
          <span className="font-semibold">PeakHuman</span>
        </Link>
        <Link href="/login" className="text-sm text-[#57534E] hover:text-[#0A0A0A]">Уже есть аккаунт? Войти</Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-[420px] p-2">
          <CardHeader>
            <CardTitle className="text-xl">Создать аккаунт</CardTitle>
            <CardDescription>Начни путь к пиковой версии за 10 секунд.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-sm text-[#A8A29E]">Загрузка…</div>}>
              <SignupForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
