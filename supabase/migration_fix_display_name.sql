-- Fix trigger to respect display_name from user_metadata (для режима без подтверждения)
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

-- Поправить уже созданные профили без имени (опционально)
-- update public.profiles set display_name = split_part(email,'@',1) where display_name is null;
