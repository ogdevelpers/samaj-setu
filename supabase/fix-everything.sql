-- FIX EVERYTHING. One file that brings ANY earlier version of the database up to date.
-- Paste all of it into Supabase > SQL Editor > New query > Run. It is safe to run again and again.

-- ---------- 002_admin_setup ----------
create table if not exists public.settings (
  key text primary key,
  value text
);
alter table public.settings enable row level security;
drop policy if exists settings_read on public.settings;
drop policy if exists settings_write on public.settings;
create policy settings_read on public.settings for select to authenticated using (true);
create policy settings_write on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- true when at least one admin exists (callable before sign-in, reveals nothing else)
create or replace function public.has_admin() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where role = 'admin') $$;
grant execute on function public.has_admin() to anon, authenticated;

-- the first person to call this, while no admin exists, becomes the admin
create or replace function public.claim_first_admin() returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or exists (select 1 from public.profiles where role = 'admin') then return false; end if;
  perform set_config('app.bypass', '1', true);
  update public.profiles set role = 'admin' where id = auth.uid();
  return true;
end $$;
grant execute on function public.claim_first_admin() to authenticated;

-- ---------- 003_simple_registration ----------
-- Lets a family register even when no place (chapter) exists yet. The admin assigns the place when approving.
alter table public.households alter column chapter_id drop not null;
alter table public.households add column if not exists place_state text;
alter table public.households add column if not exists place_district text;
alter table public.households add column if not exists place_area text;

-- ---------- 004_profile_repair ----------
-- (they had no profile, so they could never become admin). Safe to run again.
create or replace function public.ensure_profile() returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  insert into public.profiles (id, email, full_name)
  select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', '') from auth.users u where u.id = auth.uid()
  on conflict (id) do nothing;
  return true;
end $$;
grant execute on function public.ensure_profile() to anon, authenticated;

create or replace function public.claim_first_admin() returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or exists (select 1 from public.profiles where role = 'admin') then return false; end if;
  perform public.ensure_profile();
  perform set_config('app.bypass', '1', true);
  update public.profiles set role = 'admin' where id = auth.uid();
  return found;
end $$;
grant execute on function public.claim_first_admin() to authenticated;

-- give a profile to every account that is missing one
insert into public.profiles (id, email, full_name)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', '') from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- ---------- 005_link_repair ----------
-- ("duplicate key ... households_head_user_id_key"). Safe to run again.
create or replace function public.link_household() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.bypass', '1', true);
  insert into public.profiles (id, email, full_name)
  select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', '') from auth.users u where u.id = new.head_user_id
  on conflict (id) do nothing;
  update public.profiles set household_id = new.id, chapter_id = coalesce(chapter_id, new.chapter_id)
    where id = new.head_user_id;
  return new;
end $$;

-- links the signed-in person to the family they already registered
create or replace function public.link_my_household() returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  perform public.ensure_profile();
  perform set_config('app.bypass', '1', true);
  update public.profiles p set household_id = h.id, chapter_id = coalesce(p.chapter_id, h.chapter_id)
    from public.households h where h.head_user_id = p.id and p.id = auth.uid() and p.household_id is null;
  return found;
end $$;
grant execute on function public.link_my_household() to authenticated;

-- repair every account that is already in this state
update public.profiles p set household_id = h.id, chapter_id = coalesce(p.chapter_id, h.chapter_id)
from public.households h where h.head_user_id = p.id and p.household_id is null;
