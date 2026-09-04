-- PeakHuman Production Migration — утро/вечер ритуалы + роадмап
-- Run in Supabase SQL Editor AFTER schema.sql

-- 1. Daily Rituals (AM/PM) — основной продакшн-механизм
create table if not exists public.daily_rituals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  -- утро 06:00-14:00
  morning_done boolean default false,
  morning_at timestamptz,
  morning_intention text,
  morning_top3 jsonb default '[]'::jsonb, -- ["задача1","задача2","задача3"]
  morning_energy int check (morning_energy is null or (morning_energy >=1 and morning_energy <=10)),
  -- вечер 16:00-23:59
  evening_done boolean default false,
  evening_at timestamptz,
  evening_reflection text,
  evening_gratitude text,
  evening_score int check (evening_score is null or (evening_score >=1 and evening_score <=10)),
  evening_lesson text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);
create index if not exists daily_rituals_user_date_idx on public.daily_rituals(user_id, date);
alter table public.daily_rituals enable row level security;
drop policy if exists "Users can manage own rituals" on public.daily_rituals;
create policy "Users can manage own rituals" on public.daily_rituals for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create or replace function public.touch_updated_at() returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists trg_daily_rituals_updated on public.daily_rituals;
create trigger trg_daily_rituals_updated before update on public.daily_rituals for each row execute procedure public.touch_updated_at();

-- 2. Roadmaps — личный роадмап на квартал/год
create table if not exists public.roadmaps (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  quarter text, -- "Q1 2026", "2026", "90 дней"
  status text default 'active' check (status in ('active','archived','done')),
  color text default '#0A0A0A',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists roadmaps_user_idx on public.roadmaps(user_id);
alter table public.roadmaps enable row level security;
drop policy if exists "Users can manage own roadmaps" on public.roadmaps;
create policy "Users can manage own roadmaps" on public.roadmaps for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop trigger if exists trg_roadmaps_updated on public.roadmaps;
create trigger trg_roadmaps_updated before update on public.roadmaps for each row execute procedure public.touch_updated_at();

-- 3. Milestones — этапы роадмапа
create table if not exists public.milestones (
  id uuid primary key default uuid_generate_v4(),
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  completed boolean default false,
  completed_at timestamptz,
  order_index int default 0,
  created_at timestamptz default now()
);
create index if not exists milestones_roadmap_idx on public.milestones(roadmap_id);
create index if not exists milestones_user_idx on public.milestones(user_id);
alter table public.milestones enable row level security;
drop policy if exists "Users can manage own milestones" on public.milestones;
create policy "Users can manage own milestones" on public.milestones for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
