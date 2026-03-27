-- A Taverna - Split character data by RPG system
-- Goal: keep public.characters lean and move system-specific payload
-- to per-system tables.

create table if not exists public.character_savage_pathfinder (
  character_id uuid primary key references public.characters(id) on delete cascade,
  class_name text,
  race text,
  ancestry text,
  height text,
  weight text,
  edges integer check (edges is null or edges >= 0),
  conviction integer check (conviction is null or conviction >= 0),
  rank text,
  stats jsonb not null default '{}'::jsonb,
  attributes jsonb not null default '{}'::jsonb,
  modules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.character_generic (
  character_id uuid primary key references public.characters(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_character_savage_pathfinder_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_character_savage_pathfinder_updated_at on public.character_savage_pathfinder;
create trigger trg_character_savage_pathfinder_updated_at
before update on public.character_savage_pathfinder
for each row execute function public.set_character_savage_pathfinder_updated_at();

create or replace function public.set_character_generic_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_character_generic_updated_at on public.character_generic;
create trigger trg_character_generic_updated_at
before update on public.character_generic
for each row execute function public.set_character_generic_updated_at();

alter table public.character_savage_pathfinder enable row level security;
alter table public.character_generic enable row level security;

drop policy if exists "character_savage_pathfinder_select_own" on public.character_savage_pathfinder;
create policy "character_savage_pathfinder_select_own"
  on public.character_savage_pathfinder
  for select
  using (
    exists (
      select 1
      from public.characters c
      where c.id = character_id
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "character_savage_pathfinder_insert_own" on public.character_savage_pathfinder;
create policy "character_savage_pathfinder_insert_own"
  on public.character_savage_pathfinder
  for insert
  with check (
    exists (
      select 1
      from public.characters c
      where c.id = character_id
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "character_savage_pathfinder_update_own" on public.character_savage_pathfinder;
create policy "character_savage_pathfinder_update_own"
  on public.character_savage_pathfinder
  for update
  using (
    exists (
      select 1
      from public.characters c
      where c.id = character_id
        and c.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.characters c
      where c.id = character_id
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "character_savage_pathfinder_delete_own" on public.character_savage_pathfinder;
create policy "character_savage_pathfinder_delete_own"
  on public.character_savage_pathfinder
  for delete
  using (
    exists (
      select 1
      from public.characters c
      where c.id = character_id
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "character_generic_select_own" on public.character_generic;
create policy "character_generic_select_own"
  on public.character_generic
  for select
  using (
    exists (
      select 1
      from public.characters c
      where c.id = character_id
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "character_generic_insert_own" on public.character_generic;
create policy "character_generic_insert_own"
  on public.character_generic
  for insert
  with check (
    exists (
      select 1
      from public.characters c
      where c.id = character_id
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "character_generic_update_own" on public.character_generic;
create policy "character_generic_update_own"
  on public.character_generic
  for update
  using (
    exists (
      select 1
      from public.characters c
      where c.id = character_id
        and c.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.characters c
      where c.id = character_id
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "character_generic_delete_own" on public.character_generic;
create policy "character_generic_delete_own"
  on public.character_generic
  for delete
  using (
    exists (
      select 1
      from public.characters c
      where c.id = character_id
        and c.owner_id = auth.uid()
    )
  );

insert into public.character_savage_pathfinder (
  character_id,
  class_name,
  race,
  ancestry,
  height,
  weight,
  edges,
  conviction,
  rank,
  stats,
  attributes,
  modules
)
select
  c.id,
  c.class_name,
  c.race,
  c.ancestry,
  c.height,
  c.weight,
  c.edges,
  c.conviction,
  c.level,
  coalesce(c.stats, '{}'::jsonb),
  coalesce(c.attributes, '{}'::jsonb),
  coalesce(c.modules, '[]'::jsonb)
from public.characters c
where lower(c.system) = 'savage_pathfinder'
on conflict (character_id) do update
set
  class_name = excluded.class_name,
  race = excluded.race,
  ancestry = excluded.ancestry,
  height = excluded.height,
  weight = excluded.weight,
  edges = excluded.edges,
  conviction = excluded.conviction,
  rank = excluded.rank,
  stats = excluded.stats,
  attributes = excluded.attributes,
  modules = excluded.modules,
  updated_at = now();

insert into public.character_generic (character_id, payload)
select
  c.id,
  jsonb_strip_nulls(
    jsonb_build_object(
      'class_name', c.class_name,
      'race', c.race,
      'ancestry', c.ancestry,
      'height', c.height,
      'weight', c.weight,
      'edges', c.edges,
      'conviction', c.conviction,
      'level', c.level,
      'stats', coalesce(c.stats, '{}'::jsonb),
      'attributes', coalesce(c.attributes, '{}'::jsonb),
      'modules', coalesce(c.modules, '[]'::jsonb)
    )
  ) as payload
from public.characters c
where lower(c.system) <> 'savage_pathfinder'
on conflict (character_id) do update
set
  payload = excluded.payload,
  updated_at = now();

alter table public.characters
  drop column if exists class_name,
  drop column if exists race,
  drop column if exists ancestry,
  drop column if exists height,
  drop column if exists weight,
  drop column if exists edges,
  drop column if exists conviction,
  drop column if exists level,
  drop column if exists stats,
  drop column if exists attributes,
  drop column if exists modules;
