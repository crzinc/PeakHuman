# PeakHuman — Твоя пиковая версия

Минималистичная **OS для пиковой производительности**. Трекер привычек, энергии, сна и фокуса. 30 секунд в день → честрый **Peak Score** и графики без шума.

Стек: **Next.js 15 (App Router) + Tailwind 4 + Supabase (Auth/Postgres/RLS) + Vercel**

> Дизайн: монохром, много воздуха, большие типографичные заголовки, скругления 24px, мягкие тени. Вдохновение — Linear, Superhuman, Apple Health.

---

## ✨ Что внутри

- **Landing** — hero с живой превьюшкой дашборда, блоки System / How it works / Pricing
- **Auth** — Supabase Auth (email+password) + middleware (защита `/dashboard`, автологин, `auth/callback`), fallback demo
- **Dashboard** — гибрид Supabase + localStorage (realtime sync)
  - **Peak Score** (0–100) — энергия 30% + фокус 30% + сон 20% + привычки 20%
  - **Чекин 30 сек**: энергия 1–10, сон 0–12ч, фокус 1–10, настроение 1–5, заметка — `daily_metrics` upsert
  - **Привычки**: создание/удаление (`habits`), тоггл на сегодня (`habit_logs`), прогресс, шаблоны (Фокус/Тело/Разум/База) для онбординга
  - **Streak** — серия дней с чекином (90-дневный расчёт)
  - **График 7/30 дней** (Recharts): Peak + энергия×10 + фокус×10, переключение диапазона
  - **Календарь-heatmap 30 дней** — цвет по Peak, клик-подсказка с датой
  - **История** — лента до 30 дней с бейджами пик/норм/спад
  - **Умные инсайты**: корреляция сон→энергия/фокус, тренд недели, совет по привычкам
  - **Экспорт**: CSV (метрики+привычки) из дашборда
- **Settings** — профиль (`profiles.display_name`), экспорт JSON бэкапа, удаление всех данных, logout
- **Supabase** — `profiles`, `habits`, `habit_logs`, `daily_metrics`, индексы + RLS + триггер автосоздания профиля

---

## 🚀 Быстрый старт

```bash
# 1. клонируй и установи
npm install

# 2. env
cp .env.example .env.local
# заполни NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY
# без них приложение работает в демо-режиме (localStorage)

# 3. дев
npm run dev
# http://localhost:3000
```

### Supabase SQL

1. Создай проект на supabase.com
2. SQL Editor → вставь `supabase/schema.sql` из репозитория → Run
3. Auth → включи Email provider (по умолчанию включен)
4. Скопируй URL и anon key в `.env.local`

---

## 📁 Структура

```
app/
  page.tsx                    # landing
  layout.tsx / globals.css
  (auth)/login,signup         # auth (supabase)
  auth/callback/route.ts      # OAuth/email confirm
  dashboard/page.tsx          # гибрид Supabase+localStorage, heatmap, 7/30 chart
  settings/page.tsx           # профиль, экспорт, удаление
components/
  ui/button,card,input,badge,slider
  landing-header.tsx
lib/
  utils.ts                    # cn, calculatePeakScore, formatDate
  hooks/useSupabaseData.ts    # realtime hook
  supabase/client,server,middleware
supabase/schema.sql           # RLS + триггеры
middleware.ts                 # защита /dashboard, /settings
```

---

## ☁️ Деплой на Vercel

1. Залей на GitHub
2. Vercel → New Project → импорт репо
3. Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy — готово. Middleware работает на Edge.

> Совет: включи Vercel Analytics и Speed Insights — уже поддерживаются Next 15.

---

## 🧮 Формула Peak Score

```
energy:      (energy/10)*30
focus:       (focus/10)*30
sleep:       min(sleep/8,1)*20
habits:      (done/total)*20
Peak = round(sum)
```

---

## 🛠 Скрипты

```bash
npm run dev      # dev
npm run build    # prod build
npm run start    # prod start
npm run lint     # eslint
```

---

## 📝 Лицензия

MIT — делай что хочешь, становись лучше каждый день.

PeakHuman © 2026 — *Track. Optimize. Transcend.*
