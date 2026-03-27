-- A Taverna - Public Profiles
-- Apply in Supabase SQL Editor or via Supabase CLI migrations.

create extension if not exists pg_trgm;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  bio text,
  avatar_url text,
  badge text default 'Aventureiro',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,30}$')
);

create index if not exists profiles_display_name_trgm_idx
  on public.profiles using gin (display_name gin_trgm_ops);

create index if not exists profiles_username_trgm_idx
  on public.profiles using gin (username gin_trgm_ops);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_profiles_updated_at();

create or replace function public.create_profile_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_name text;
  final_display_name text;
  final_username text;
begin
  meta_name := nullif(trim(new.raw_user_meta_data ->> 'name'), '');
  final_display_name := coalesce(meta_name, split_part(new.email, '@', 1), 'Aventureiro');
  final_username := lower(
    regexp_replace(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
        'user_' || replace(substr(new.id::text, 1, 8), '-', '')
      ),
      '[^a-z0-9_]',
      '',
      'g'
    )
  );

  if length(final_username) < 3 then
    final_username := 'user_' || replace(substr(new.id::text, 1, 8), '-', '');
  end if;

  insert into public.profiles (id, username, display_name)
  values (new.id, final_username, final_display_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.create_profile_for_user();

insert into public.profiles (id, username, display_name)
select
  u.id,
  lower('user_' || replace(substr(u.id::text, 1, 8), '-', '')) as username,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
    split_part(u.email, '@', 1),
    'Aventureiro'
  ) as display_name
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles
  for select
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
