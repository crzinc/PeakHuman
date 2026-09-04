"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, LogOut, Trash2, Download, User, Shield, Mail } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState<string>("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      if (!supabase) { setLoading(false); return }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      setEmail(user.email ?? "")
      const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single()
      if (profile) setDisplayName(profile.display_name ?? "")
      setLoading(false)
    })()
  }, [supabase, router])

  async function saveProfile() {
    if (!supabase) return
    setSaving(true); setMsg(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id)
    setMsg(error ? error.message : "Сохранено")
    setSaving(false)
  }

  async function handleExport() {
    if (!supabase) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: metrics }, { data: habits }, { data: logs }] = await Promise.all([
      supabase.from("daily_metrics").select("*").eq("user_id", user.id),
      supabase.from("habits").select("*").eq("user_id", user.id),
      supabase.from("habit_logs").select("*").eq("user_id", user.id),
    ])
    const blob = new Blob([JSON.stringify({ metrics, habits, logs, exported_at: new Date().toISOString() }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `peakhuman_backup_${new Date().toISOString().split("T")[0]}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  async function handleSignOut() {
    if (supabase) await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm("Удалить все твои данные? Это нельзя отменить.")) return
    if (!supabase) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("habit_logs").delete().eq("user_id", user.id)
    await supabase.from("daily_metrics").delete().eq("user_id", user.id)
    await supabase.from("habits").delete().eq("user_id", user.id)
    setMsg("Данные удалены")
  }

  if (loading) return <div className="min-h-screen bg-[#FCFCF9] flex items-center justify-center text-sm text-[#A8A29E]">Загрузка…</div>

  return (
    <div className="min-h-screen bg-[#FCFCF9] flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#FCFCF9]/80 border-b border-[#E7E5E4]">
        <div className="mx-auto max-w-[880px] px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm hover:text-[#0A0A0A]"><ArrowLeft className="h-4 w-4" /> Назад в дашборд</Link>
          <div className="flex items-center gap-2"><span className="h-7 w-7 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center text-[10px] font-bold">PH</span><span className="font-semibold text-sm">Настройки</span></div>
          <div className="w-[120px]" />
        </div>
      </header>

      <main className="mx-auto max-w-[880px] w-full px-6 py-8 flex-1 space-y-5">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-4 w-4" /> Профиль</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</label><Input value={email} disabled className="mt-1.5 opacity-60" /></div>
              <div><label className="text-sm font-medium">Имя</label><Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Как к тебе обращаться" className="mt-1.5" /></div>
            </div>
            {msg && <div className="text-sm bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl px-3 py-2">{msg}</div>}
            <Button onClick={saveProfile} disabled={saving}>{saving ? "Сохраняем…" : "Сохранить"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4" /> Данные и приватность</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[#57534E] leading-6">Все данные хранятся в Supabase с RLS — каждый видит только своё. Экспорт создаёт JSON бэкап. Экспорт CSV доступен в дашборде.</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleExport} className="gap-2"><Download className="h-4 w-4" /> Экспорт JSON</Button>
              <Button variant="outline" onClick={handleDelete} className="gap-2 text-red-600 border-red-200 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Удалить все данные</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E7E5E4]">
          <CardContent className="p-6 flex items-center justify-between">
            <div><div className="font-medium">Выйти из аккаунта</div><div className="text-sm text-[#737373]">Завершить сессию на этом устройстве</div></div>
            <Button variant="outline" onClick={handleSignOut} className="gap-2"><LogOut className="h-4 w-4" /> Выйти</Button>
          </CardContent>
        </Card>

        <div className="text-xs text-[#A8A29E] text-center py-4">PeakHuman · Supabase RLS · Vercel Edge · Сделано с дисциплиной</div>
      </main>
    </div>
  )
}
