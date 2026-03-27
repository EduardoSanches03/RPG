-- A Taverna - Campaigns, party members and sessions
-- Replaces the legacy aggregated rpg_data persistence with normalized tables.

create extension if not exists pgcrypto;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  system text not null,
  role text not null default 'mestre',
  locale text not null default 'pt-BR',
  time_zone text not null default 'America/Sao_Paulo',
  is_registered boolean not null default false,
  notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_role_valid check (role in ('mestre', 'jogador'))
);

create unique index if not exists campaigns_owner_active_idx
  on public.campaigns (owner_id)
  where is_active = true;

create index if not exists campaigns_owner_created_idx
  on public.campaigns (owner_id, created_at desc);

create table if not exists public.campaign_members (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (campaign_id, character_id)
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  title text not null,
  scheduled_at timestamptz not null,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sessions_owner_scheduled_idx
  on public.sessions (owner_id, scheduled_at desc);

create index if not exists sessions_campaign_idx
  on public.sessions (campaign_id, scheduled_at desc);

create or replace function public.set_campaigns_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_campaigns_updated_at on public.campaigns;
create trigger trg_campaigns_updated_at
before update on public.campaigns
for each row execute function public.set_campaigns_updated_at();

create or replace function public.set_sessions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_sessions_updated_at on public.sessions;
create trigger trg_sessions_updated_at
before update on public.sessions
for each row execute function public.set_sessions_updated_at();

alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.sessions enable row level security;

drop policy if exists "campaigns_select_own" on public.campaigns;
create policy "campaigns_select_own"
  on public.campaigns
  for select
  using (auth.uid() = owner_id);

drop policy if exists "campaigns_insert_own" on public.campaigns;
create policy "campaigns_insert_own"
  on public.campaigns
  for insert
  with check (auth.uid() = owner_id);

drop policy if exists "campaigns_update_own" on public.campaigns;
create policy "campaigns_update_own"
  on public.campaigns
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "campaigns_delete_own" on public.campaigns;
create policy "campaigns_delete_own"
  on public.campaigns
  for delete
  using (auth.uid() = owner_id);

drop policy if exists "campaign_members_select_own" on public.campaign_members;
create policy "campaign_members_select_own"
  on public.campaign_members
  for select
  using (
    exists (
      select 1
      from public.campaigns c
      where c.id = campaign_id
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "campaign_members_insert_own" on public.campaign_members;
create policy "campaign_members_insert_own"
  on public.campaign_members
  for insert
  with check (
    exists (
      select 1
      from public.campaigns c
      join public.characters ch on ch.id = character_id
      where c.id = campaign_id
        and c.owner_id = auth.uid()
        and ch.owner_id = auth.uid()
    )
  );

drop policy if exists "campaign_members_delete_own" on public.campaign_members;
create policy "campaign_members_delete_own"
  on public.campaign_members
  for delete
  using (
    exists (
      select 1
      from public.campaigns c
      where c.id = campaign_id
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "sessions_select_own" on public.sessions;
create policy "sessions_select_own"
  on public.sessions
  for select
  using (auth.uid() = owner_id);

drop policy if exists "sessions_insert_own" on public.sessions;
create policy "sessions_insert_own"
  on public.sessions
  for insert
  with check (auth.uid() = owner_id);

drop policy if exists "sessions_update_own" on public.sessions;
create policy "sessions_update_own"
  on public.sessions
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "sessions_delete_own" on public.sessions;
create policy "sessions_delete_own"
  on public.sessions
  for delete
  using (auth.uid() = owner_id);
