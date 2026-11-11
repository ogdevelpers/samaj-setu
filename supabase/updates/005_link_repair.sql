-- Run ONCE on an existing database. Fixes a family that was registered but not linked to its account
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
