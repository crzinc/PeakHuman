-- PeakHuman Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID
create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamp with time zone default now()
);

-- Habits
create table if not exists public.habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  icon text default 'Target',
  color text default '#0A0A0A',
  created_at timestamp with time zone default now()
);
create index if not exists habits_user_id_idx on public.habits(user_id);

-- Habit logs (per day)
create table if not exists public.habit_logs (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  completed boolean default true,
  created_at timestamp with time zone default now(),
  unique(habit_id, date)
);
create index if not exists habit_logs_user_date_idx on public.habit_logs(user_id, date);

-- Daily metrics
create table if not exists public.daily_metrics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  energy int check (energy >= 1 and energy <= 10),
  sleep_hours numeric(3,1) check (sleep_hours >= 0 and sleep_hours <= 24),
  focus int check (focus >= 1 and focus <= 10),
  mood int check (mood >= 1 and mood <= 5),
  peak_score int,
  note text,
  created_at timestamp with time zone default now(),
  unique(user_id, date)
);
create index if not exists daily_metrics_user_date_idx on public.daily_metrics(user_id, date);

-- RLS
alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.daily_metrics enable row level security;

drop policy if exists "Users can manage own profile" on public.profiles;
create policy "Users can manage own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can manage own habits" on public.habits;
create policy "Users can manage own habits" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own habit_logs" on public.habit_logs;
create policy "Users can manage own habit_logs" on public.habit_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own metrics" on public.daily_metrics;
create policy "Users can manage own metrics" on public.daily_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Trigger: auto-create profile on signup (учитывает display_name из metadata, когда подтверждение выключено)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  _display_name text;
begin
  _display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    split_part(new.email, '@', 1)
  );
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, _display_name);
  return new;
exception when unique_violation then
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
