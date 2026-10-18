-- Everything MathPop needs in the family account's database, in one go:
-- the players table (mathpop_profiles.sql) and sticker syncing
-- (mathpop_stickers.sql). Until this has been run, MathPop's players and
-- stickers stay on the phone they were made on.
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste ->
-- Run. Safe to run again.

-- ---------- Players ----------
-- MathPop's players, saved in the family account (the same Supabase
-- project and the same sign-in as PitchPop). Each row is one player:
--   profile_key  the player's id in the app
--   name         the player's name
--   grade        the grade they play at: 'p' (Pre-K), 'k', '1', '2', '3' or '4'
-- Row-level security limits each family account to its own players.
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to run again.

create table if not exists public.mathpop_profiles (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  profile_key text not null,
  name text not null,
  grade text not null default '2',
  created_at timestamptz not null default now(),
  unique (owner_id, profile_key)
);

-- The grades a player can have (Pre-K was added later: safe to run again).
alter table public.mathpop_profiles drop constraint if exists mathpop_profiles_grade_check;
alter table public.mathpop_profiles
  add constraint mathpop_profiles_grade_check check (grade in ('p', 'k', '1', '2', '3', '4'));

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


-- ---------- Stickers ----------
-- Syncs each player's sticker book across the family's phones. Each
-- player's row in mathpop_profiles (MathPop's players) gets a list of stickers:
--   stickers  [{ "index", "at", "from" }, ...]  (one per sticker stuck in)
-- The app calls merge_mathpop_stickers(...) with what one phone has; the
-- database adds anything new and returns the combined list, so phones
-- never overwrite each other's stickers. See src/stickerSync.js. Until
-- this has been run, stickers just stay on the phone they were earned on.
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to run again.

alter table public.mathpop_profiles
  add column if not exists stickers jsonb not null default '[]'::jsonb;

-- security invoker: runs as the signed-in user, so the table's row-level
-- security still limits it to the family's own players.
create or replace function public.merge_mathpop_stickers(
  p_profile_key text,
  p_stickers jsonb
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  update public.mathpop_profiles p
  set stickers = (
    select coalesce(jsonb_agg(e order by e->>'at'), '[]'::jsonb)
    from (
      select distinct on (e->>'at') e
      from jsonb_array_elements(p.stickers || coalesce(p_stickers, '[]'::jsonb)) as e
      where e->>'at' is not null
    ) as entries
  )
  where p.owner_id = auth.uid() and p.profile_key = p_profile_key
  returning p.stickers;
$$;

revoke all on function public.merge_mathpop_stickers(text, jsonb) from public, anon;
grant execute on function public.merge_mathpop_stickers(text, jsonb) to authenticated;
