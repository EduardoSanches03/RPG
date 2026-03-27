-- A Taverna - Friend Requests
-- Apply after profiles migration.

create extension if not exists pgcrypto;

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friend_requests_no_self check (requester_id <> addressee_id),
  constraint friend_requests_status_valid check (
    status in ('pending', 'accepted', 'rejected', 'cancelled')
  ),
  constraint friend_requests_unique_pair unique (requester_id, addressee_id)
);

create index if not exists friend_requests_requester_idx
  on public.friend_requests (requester_id, status, created_at desc);

create index if not exists friend_requests_addressee_idx
  on public.friend_requests (addressee_id, status, created_at desc);

create or replace function public.set_friend_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_friend_requests_updated_at on public.friend_requests;
create trigger trg_friend_requests_updated_at
before update on public.friend_requests
for each row execute function public.set_friend_requests_updated_at();

alter table public.friend_requests enable row level security;

drop policy if exists "friend_requests_select_involved" on public.friend_requests;
create policy "friend_requests_select_involved"
  on public.friend_requests
  for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "friend_requests_insert_own" on public.friend_requests;
create policy "friend_requests_insert_own"
  on public.friend_requests
  for insert
  with check (auth.uid() = requester_id and status = 'pending');

drop policy if exists "friend_requests_update_involved" on public.friend_requests;
create policy "friend_requests_update_involved"
  on public.friend_requests
  for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id or auth.uid() = addressee_id);
