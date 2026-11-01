-- Run this ONCE if you already ran schema.sql earlier. New installs already include it in schema.sql.
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
