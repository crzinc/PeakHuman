"use client"
import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") ?? "/dashboard"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      if (!supabase) {
        router.push(next)
        return
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else {
        router.push(next)
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка входа")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input type="email" placeholder="you@peakhuman.app" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Пароль</label>
        <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>}
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "Входим..." : "Войти"}
      </Button>
      <div className="text-center text-xs text-[#A8A29E]">Забыл пароль? Напиши — восстановим. Подтверждение почты выключено.</div>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFCF9]">
      <div className="mx-auto max-w-[1160px] w-full px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[#0A0A0A] flex items-center justify-center"><span className="text-white text-[11px] font-bold">PH</span></div>
          <span className="font-semibold">PeakHuman</span>
        </Link>
        <Link href="/signup" className="text-sm text-[#57534E] hover:text-[#0A0A0A]">Нет аккаунта? Регистрация</Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-[420px] p-2">
          <CardHeader>
            <CardTitle className="text-xl">Войти в PeakHuman</CardTitle>
            <CardDescription>Войди, чтобы продолжить свой streak.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-sm text-[#A8A29E]">Загрузка…</div>}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
