# PeakHuman — Полное описание (Production)

PeakHuman — **законченное production-приложение** для достижения пиковой версии себя. Минималистичная OS, которая соединяет тело, разум и цели в один ежедневный цикл: **утро → действие → вечер → динамика → роадмап**. Никакой лишней мишуры — только то, что ведёт к результату.

Стек: **Next.js 16.3 (App Router, Turbopack) + TypeScript + Tailwind 4 + Supabase (Postgres, Auth, RLS, Realtime) + Vercel Edge + Framer Motion + Three.js (@react-three/fiber/drei) + Recharts + lucide-react**

Деплой: `https://github.com/crzinc/PeakHuman` (ветка `main`, автодеплой Vercel), домен Vercel, env `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 1. Концепция и UX-принципы

- **Система, а не цели.** 4 метрики + 2 ритуала + привычки + роадмап = честный Peak Score.
- **30 секунд утром и вечером.** Всё остальное — автоматика.
- **Минимализм:** монохром `#0A0A0A`/`#FCFCF9`, скругления 24–32px, много воздуха, типографика Geist, мягкие тени.
- **Честность:** формула Peak открыта, данные — только твои (RLS), никакого скрытого скоринга.
- **Оффлайн-фолбэк:** если Supabase не настроен или таблицы ещё не созданы — всё работает на localStorage, после миграции синхронизируется.

---

## 2. Страницы и роуты

| Путь | Что | Доступ |
|------|-----|--------|
| `/` | Лендинг | public |
| `/login`, `/signup` | Auth (email/pass, без подтверждения) | public, редирект на `/dashboard` если уже залогинен |
| `/dashboard` | Главный экран — привычки, ритуалы, метрики, динамика | protected (middleware → `/login?next=`) |
| `/roadmap` | Роадмапы и вехи | protected |
| `/settings` | Профиль, экспорт, удаление, выход | protected |
| `/auth/callback` | Обмен code → session (email confirm) | public |

`middleware.ts` + `lib/supabase/middleware.ts` — проверка `auth.getUser()` на Edge, редиректы с `?next=`.

---

## 3. Лендинг (`app/page.tsx`)

- **Header** `components/landing-header.tsx` — `motion` вход, лого `hover 1.06`, `beta` бейдж, навигация Система/Как работает/Доступ, кнопки `Войти`/`Начать`.
- **Hero** — карточка `rounded-[32px]` с градиентом, `Hero3D` (`components/hero-3d.tsx`) на фоне: `Canvas` с `Torus` (1.15/0.33) + `Icosahedron` wireframe + 48 `Points`, `Float` + `useFrame` вращение, `ambient/directional` свет, `dpr [1,1.6]`, прозрачный. Текст с `stagger`/`fadeUp`, кнопки `whileHover 1.03`, превью дашборда справа (метрики, streak, привычки) с `motion` на Peak бейдже и прогресс-баре.
- **System** — 4 карточки: Энергия, Сон, Фокус, Привычки (`whileInView`, `hover y -4`).
- **How** — тёмный блок 3 шага + 3 фичи, `motion` scale на фоне.
- **Pricing** — Free ₽0 и Pro ₽290 (скоро), `whileHover`.
- **Footer**.

Анимации везде: `framer-motion` `spring 400/18` на кнопках (`components/ui/button.tsx` — `motion.button` `whileHover 1.02`/`whileTap 0.97`), карточках, списках.

---

## 4. Аутентификация

- **Supabase Auth** email/pass, **подтверждение выключено** — `signUp` сразу возвращает `session`, фронтенд (`app/(auth)/signup/page.tsx`) проверяет `data.session` → `router.push(next)` + `refresh`, иначе показывает «Проверь почту». Валидация `password >=6`, `display_name` из `name` или email.
- **Login** (`app/(auth)/login/page.tsx`) — `signInWithPassword` → `push(next)` + `refresh`, ошибки `Invalid login credentials` → красный алерт, `Suspense` для `useSearchParams`.
- **Триггер** `supabase/schema.sql:77` `handle_new_user()` — берёт `raw_user_meta_data->>'display_name'` или `split_part(email)`, `insert into profiles`, `exception unique_violation`.
- **Profiles** `profiles(id, email, display_name, created_at)` — RLS `auth.uid()=id`.
- **Logout** — `supabase.auth.signOut()` + `router.push` + `refresh` (dashboard и settings).

---

## 5. Дашборд (`app/dashboard/page.tsx`) — сердце

Хук `lib/hooks/useSupabaseData.ts` — `habits`, `daily_metrics`, `habit_logs` + realtime `channel("peakhuman")`, fallback localStorage `peakhuman:habits/metrics/logs`. `useRituals`/`useRoadmaps` аналогично.

### 5.1 Peak Score
`lib/utils.ts:15` `calculatePeakScore({energy, focus, sleepHours, habitsCompleted, totalHabits})` = `(energy/10)*30 + (focus/10)*30 + min(sleep/8,1)*20 + (done/total)*20`. Показывается `text-5xl`, `motion` spring при изменении, прогресс-бар `0-100%`, три мини-карточки энергия/сон/фокус.

### 5.2 Привычки
- `habits(id, user_id, title, created_at)` — `habit_logs(id, habit_id, user_id, date, completed)`
- Создание `Input` + `Button` (+ Enter), удаление `Trash2` (теперь `eq user_id` + `await refresh`, фикс `b438c00` — не пересоздаются после удаления), тоггл на сегодня `habit_logs insert/delete`, прогресс `done/total`, `AnimatePresence` список, `whileHover -1`.
- Пусто → шаблоны 4: Фокус/Тело/Разум/База (`addTemplate`), иначе `seed` один раз на юзера (`hasSeeded:${user.id}`).

### 5.3 Bio-чекин (30 сек)
Слайдеры `energy 1-10`, `sleep 0-12 step 0.5`, `focus 1-10`, `mood 1-5`, `note` textarea. `todayPeak` live, `Сохранить чекин` → `daily_metrics upsert (user_id,date)` + `refresh`, бейдж «Сохранено в облако/локально», демо-баннер если не залогинен.

### 5.4 Утренний/вечерний ритуалы (`components/ritual-cards.tsx`, `lib/hooks/useRituals.ts`)
Таблица `daily_rituals(user_id,date, morning_done, morning_at, morning_intention, morning_top3 jsonb, morning_energy, evening_done, evening_at, evening_reflection, evening_gratitude, evening_score, evening_lesson)` — RLS, `unique(user_id,date)`.

- **Утро** `Card` янтарный, иконка `Sunrise`, окно 05-15 (подсказка если вне), форма: намерение, топ-3 (1 обязат.), энергия. `submitMorning` → `upsert`.
- **Вечер** `Card` индиго/нейтральный, `Sunset`, окно с 15:00, форма: что получилось, благодарность, урок, оценка. Без утра — баннер «сначала утро».
- Сверху дашборда `RitualCards` + карточка-линк на `/roadmap`.

### 5.5 Динамика
- **Heatmap 30 дней** — сетка `grid-cols-10`, цвет по Peak: `null #F5F5F3`, `<40 #E7E5E4`, `40-60 #A8A29E`, `60-80 #57534E`, `80+ #0A0A0A`, tooltip `date: score`.
- **График** `Recharts` `LineChart` — `Peak` 0-100 + `energy×10` + `focus×10`, `CartesianGrid`, `XAxis` label `dd.mm`, `YAxis 0-100`, `Tooltip`, переключатель `7/30` дней.
- **История** вкладка — лента до 30 дней, `Badge` пик/норм/спад, `Э·С·Ф·done/total·note`.
- **Сводка** — средний Peak за 7, дней отмечено, streak (90-дневный расчёт по `metricsMap`), привычек.
- **Инсайт** — `useMemo` по последним 7: если `lowEnergy>=2 && avgSleep<6.5` → «+30 мин сна», если `avgFocus>=8 && avgSleep>=7` → «в потоке», если `completion<50` → «дожми привычки», тренд `+8/-8` → «прогресс/спад», иначе «стабильность».

### 5.6 Прочее
- **Streak** — `Flame` pulse, считается по `metricsMap` + `completedIds`.
- **Экспорт** — `CSV` (date,energy,sleep,focus,mood,peak,habitsDone,total,note) + `JSON` в settings.
- **Анимации** — `Flame` scale, Peak `spring`, habits `AnimatePresence`, кнопки `motion`.

---

## 6. Роадмап (`app/roadmap/page.tsx`, `lib/hooks/useRoadmaps.ts`)

Таблицы `roadmaps(id,user_id,title,description,quarter,status,color,created_at)` и `milestones(id,roadmap_id,user_id,title,due_date,completed,order_index)` — RLS, каскад.

- Создание: `Input` + `select` quarter (Q1-Q4/2026/90 дней) + `Создать`.
- Карточка роадмапа: `quarter Badge`, прогресс-бар `motion width`, `done/total`, список вех `AnimatePresence` (border, `Check` toggle), `Input` + `Plus` добавить веху, `Детали/Удалить`.
- Пусто → подсказка с примерами.
- Инфо-блок как связать с ритуалами.

Fallback localStorage `peakhuman:roadmaps/milestones` если таблицы не созданы (код `PGRST205` → local).

---

## 7. Настройки (`app/settings/page.tsx`)

- Профиль: `email` disabled, `display_name` edit → `profiles.update`, `Сохранено`.
- Данные: `Экспорт JSON` (metrics+habits+logs), `Удалить все` (habit_logs+metrics+habits), RLS.
- Выход: `signOut` + `refresh`.

---

## 8. База данных (Supabase)

**`supabase/schema.sql`** — база: `profiles`, `habits`, `habit_logs`, `daily_metrics`, индексы, RLS 4 политики, триггер `handle_new_user` с `display_name` из metadata.

**`supabase/migration_fix_display_name.sql`** — фикс триггера.

**`supabase/migration_production.sql`** — `daily_rituals`, `roadmaps`, `milestones`, `touch_updated_at` триггеры, RLS, индексы.

Запуск: SQL Editor → `schema.sql` → `migration_fix_display_name.sql` → `migration_production.sql`.

---

## 9. Дизайн-система

- `app/globals.css` — токены `--background #FCFCF9`, `--foreground #0A0A0A`, `--muted #F5F5F3`, `--border #E7E5E4`, скролл 6px, focus ring, selection.
- `components/ui/button.tsx` — `cva` + `motion.button`, `variant default/outline/ghost/secondary`, `size default/sm/lg/icon`.
- `card.tsx` — `rounded-[24px]` `shadow-[0_1px_2px]`, `CardHeader/Title/Description/Content`.
- `input.tsx` — `rounded-full h-11`, `badge.tsx`, `slider.tsx`.
- Шрифты `Geist`/`Geist_Mono` в `app/layout.tsx`.

---

## 10. Логика дня (production)

1. **07:30** — открыл `/dashboard`, `RitualCards` утро → намерение + топ-3 + энергия → сохранил, выбрал привычки, сделал bio-чекин.
2. **День** — делаешь дела, отмечаешь привычки `done`.
3. **21:00** — отметил привычки, прошёл вечерний ритуал (рефлексия, благодарность, урок, оценка) → `daily_rituals` закрыт, `daily_metrics` обновлён, `streak+1`, график/heatmap обновились, если веха из роадмапа была в топ-3 — отметил done → прогресс роадмапа +.
4. **Неделя** — вкладка История + график 30д + инсайты → корректируешь роадмап/привычки.

Просто, но полный цикл **утро → действие → вечер → динамика → роадмап**.

---

## 11. Запуск и деплой

```bash
npm install
cp .env.example .env.local # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev    # http://localhost:3000
npm run build  # Turbopack, 7 роутов
npm run lint   # eslint 0 errors
```

Vercel: импорт `crzinc/PeakHuman` `main`, env vars, автодеплой, Edge middleware.

Git: `main` — production, `origin/main`, последний `b438c00` фикс удаления привычек.

