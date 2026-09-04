import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date)
}

export function getTodayKey(): string {
  return new Date().toISOString().split("T")[0]
}

export function calculatePeakScore(metrics: { energy: number; focus: number; sleepHours: number; habitsCompleted: number; totalHabits: number }): number {
  const energyScore = (metrics.energy / 10) * 30
  const focusScore = (metrics.focus / 10) * 30
  const sleepScore = Math.min(metrics.sleepHours / 8, 1) * 20
  const habitScore = metrics.totalHabits > 0 ? (metrics.habitsCompleted / metrics.totalHabits) * 20 : 0
  return Math.round(energyScore + focusScore + sleepScore + habitScore)
}
