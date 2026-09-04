"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#FCFCF9]/70 border-b border-[#E7E5E4]/60">
      <div className="mx-auto max-w-[1160px] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-[#0A0A0A] flex items-center justify-center">
            <span className="text-white text-[11px] font-bold tracking-widest">PH</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight">PeakHuman</span>
          <span className="hidden sm:inline text-xs text-[#A8A29E] border border-[#E7E5E4] rounded-full px-2 py-0.5 ml-1">beta</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-[#57534E]">
          <a href="#system" className="hover:text-[#0A0A0A] transition-colors">Система</a>
          <a href="#how" className="hover:text-[#0A0A0A] transition-colors">Как работает</a>
          <a href="#pricing" className="hover:text-[#0A0A0A] transition-colors">Доступ</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Войти</Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm">Начать — бесплатно</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
