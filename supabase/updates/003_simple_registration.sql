-- Run ONCE if you already ran an earlier schema. New installs already include this in schema.sql.
-- Lets a family register even when no place (chapter) exists yet. The admin assigns the place when approving.
alter table public.households alter column chapter_id drop not null;
alter table public.households add column if not exists place_state text;
alter table public.households add column if not exists place_district text;
alter table public.households add column if not exists place_area text;
