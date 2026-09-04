"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 10,
  step = 1,
  className,
}: {
  value: number[]
  onValueChange: (v: number[]) => void
  min?: number
  max?: number
  step?: number
  className?: string
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={(e) => onValueChange([Number(e.target.value)])}
      className={cn(
        "w-full h-2 bg-[#E7E5E4] rounded-full appearance-none cursor-pointer accent-[#0A0A0A]",
        className
      )}
    />
  )
}
