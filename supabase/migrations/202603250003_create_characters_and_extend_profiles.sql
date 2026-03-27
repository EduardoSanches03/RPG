-- A Taverna - Characters + User Profile Settings
-- Requires profiles migration applied first.

create extension if not exists pgcrypto;

alter table if exists public.profiles
  add column if not exists email_notifications boolean not null default true,
  add column if not exists obsidian_theme boolean not null default true,
  add column if not exists dice_sound boolean not null default false;

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  system text not null,
  player_name text,
  class_name text,
  race text,
  ancestry text,
  height text,
  weight text,
  edges integer check (edges is null or edges >= 0),
  conviction integer check (conviction is null or conviction >= 0),
  level text,
  stats jsonb not null default '{}'::jsonb,
  attributes jsonb not null default '{}'::jsonb,
  modules jsonb not null default '[]'::jsonb,
  avatar_url text,
  background text,
  is_npc boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists characters_owner_idx
  on public.characters (owner_id);

create index if not exists characters_owner_created_idx
  on public.characters (owner_id, created_at desc);

create index if not exists characters_system_idx
  on public.characters (system);

create or replace function public.set_characters_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_characters_updated_at on public.characters;
create trigger trg_characters_updated_at
before update on public.characters
for each row execute function public.set_characters_updated_at();

alter table public.characters enable row level security;

drop policy if exists "characters_select_own" on public.characters;
create policy "characters_select_own"
  on public.characters
  for select
  using (auth.uid() = owner_id);

drop policy if exists "characters_insert_own" on public.characters;
create policy "characters_insert_own"
  on public.characters
  for insert
  with check (auth.uid() = owner_id);

drop policy if exists "characters_update_own" on public.characters;
create policy "characters_update_own"
  on public.characters
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "characters_delete_own" on public.characters;
create policy "characters_delete_own"
  on public.characters
  for delete
  using (auth.uid() = owner_id);
