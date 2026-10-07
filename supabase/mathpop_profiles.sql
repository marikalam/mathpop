-- MathPop's players, saved in the family account (the same Supabase
-- project and the same sign-in as PitchPop). Each row is one player:
--   profile_key  the player's id in the app
--   name         the player's name
--   grade        the grade they play at: 'k', '1', '2', '3' or '4'
-- Row-level security limits each family account to its own players.
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to run again.

create table if not exists public.mathpop_profiles (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  profile_key text not null,
  name text not null,
  grade text not null default '2' check (grade in ('k', '1', '2', '3', '4')),
  created_at timestamptz not null default now(),
  unique (owner_id, profile_key)
);

alter table public.mathpop_profiles enable row level security;

drop policy if exists "Families read their own MathPop players" on public.mathpop_profiles;
create policy "Families read their own MathPop players" on public.mathpop_profiles
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists "Families add their own MathPop players" on public.mathpop_profiles;
create policy "Families add their own MathPop players" on public.mathpop_profiles
  for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "Families change their own MathPop players" on public.mathpop_profiles;
create policy "Families change their own MathPop players" on public.mathpop_profiles
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "Families remove their own MathPop players" on public.mathpop_profiles;
create policy "Families remove their own MathPop players" on public.mathpop_profiles
  for delete to authenticated using (owner_id = auth.uid());

grant select, insert, update, delete on public.mathpop_profiles to authenticated;

-- "Delete account" (in either app) also deletes the family's MathPop
-- players. Same function PitchPop already uses, now covering both apps.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  delete from public.pitchpop_profiles where owner_id = uid;
  delete from public.mathpop_profiles where owner_id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
