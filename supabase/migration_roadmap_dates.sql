-- Ideal roadmap: deep custom dates for roadmaps and milestones
alter table public.roadmaps add column if not exists start_date date;
alter table public.roadmaps add column if not exists end_date date;
alter table public.roadmaps add column if not exists description text; -- ensure exists (already has)

alter table public.milestones add column if not exists start_date date;
alter table public.milestones add column if not exists description text; -- ensure
-- due_date already exists

-- Backfill quarter to dates for existing rows (approx)
update public.roadmaps set start_date = case quarter
  when 'Q1 2026' then '2026-01-01' when 'Q2 2026' then '2026-04-01' when 'Q3 2026' then '2026-07-01' when 'Q4 2026' then '2026-10-01' when '2026' then '2026-01-01' when '90 дней' then current_date else null end
where start_date is null and quarter is not null;

update public.roadmaps set end_date = case quarter
  when 'Q1 2026' then '2026-03-31' when 'Q2 2026' then '2026-06-30' when 'Q3 2026' then '2026-09-30' when 'Q4 2026' then '2026-12-31' when '2026' then '2026-12-31' when '90 дней' then current_date + interval '90 days' else null end
where end_date is null and quarter is not null;

-- Index for date filtering
create index if not exists roadmaps_dates_idx on public.roadmaps(start_date, end_date);
create index if not exists milestones_dates_idx on public.milestones(due_date, start_date);
