-- MathPop Plus (and PitchPop's, the same family plan): who has it.
--
--   plus_config   one row: the day Plus starts (plus_starts). Until it's
--                 set, everyone has everything. Set it on the day the Plus
--                 version goes live (the last step, below).
--   family_plus   a family account's paid Plus: until when, and the
--                 App Store purchase behind it. Written only by the
--                 verify-plus edge function, after checking the purchase
--                 is really Apple's (supabase/functions/verify-plus).
--   my_plus()     what the signed-in family has: founding family (the
--                 account was made before Plus started: free for good,
--                 in MathPop and PitchPop), paid until a date, and when
--                 the account was made (a new family's 7-day free trial).
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste ->
-- Run. Safe to run again.

create table if not exists public.plus_config (
  id int primary key default 1 check (id = 1),
  plus_starts date
);
insert into public.plus_config (id, plus_starts) values (1, null) on conflict (id) do nothing;
alter table public.plus_config enable row level security;
drop policy if exists "Everyone can read the Plus start day" on public.plus_config;
create policy "Everyone can read the Plus start day" on public.plus_config
  for select to anon, authenticated using (true);

create table if not exists public.family_plus (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  expires_at timestamptz not null,
  product_id text not null,
  original_transaction_id text not null,
  app text not null,
  environment text not null,
  updated_at timestamptz not null default now()
);
alter table public.family_plus enable row level security;
drop policy if exists "Families read their own Plus" on public.family_plus;
create policy "Families read their own Plus" on public.family_plus
  for select to authenticated using (owner_id = auth.uid());

create or replace function public.my_plus()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'plusStarts', (select plus_starts from plus_config where id = 1),
    'founder', coalesce(
      (select u.created_at::date < c.plus_starts from auth.users u, plus_config c where u.id = auth.uid() and c.id = 1),
      false
    ),
    'paidUntil', (select expires_at from family_plus where owner_id = auth.uid()),
    -- When the account was made: a new family's 7-day free trial starts then.
    'accountCreated', (select created_at from auth.users where id = auth.uid())
  );
$$;
grant execute on function public.my_plus() to authenticated;

-- Last step, on the day the Plus version is live on the App Store (put in
-- that day's date, then run this line). Everyone using MathPop before
-- that day keeps Plus free:
-- update public.plus_config set plus_starts = '2026-12-01' where id = 1;
