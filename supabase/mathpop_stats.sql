-- MathPop's own usage stats: anonymous counts of how the app is used, for
-- the grown-up who runs MathPop (Account -> MathPop stats). Nothing here
-- says who anyone is: no names, no emails, no account or device ids. Each
-- app sends only "opened" (and whether it's the first time today, or the
-- first time ever on that device) and "finished a round" (grade, game,
-- language and score). First-party only: no third-party analytics, as the
-- Kids category requires.
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste ->
-- Run. Safe to run again. Then let your own account see the stats (the
-- last step, at the bottom).

create table if not exists public.mathpop_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  day date not null,                 -- the day on the device (its own time zone)
  event text not null check (event in ('open', 'round')),
  first_today boolean not null default false,
  new_install boolean not null default false,
  platform text not null check (platform in ('iphone', 'ipad', 'web')),
  grade text check (grade in ('p', 'k', '1', '2', '3', '4')),
  topic text check (char_length(topic) <= 40),
  lang text check (lang in ('en', 'ja')),
  correct smallint check (correct between 0 and 100),
  total smallint check (total between 1 and 100)
);
create index if not exists mathpop_events_day on public.mathpop_events (day);

-- Anyone using the app can add an event; nobody can read them directly.
alter table public.mathpop_events enable row level security;
drop policy if exists "The app sends MathPop events" on public.mathpop_events;
create policy "The app sends MathPop events" on public.mathpop_events
  for insert to anon, authenticated
  with check (day between current_date - 2 and current_date + 2);

-- The accounts allowed to see the stats.
create table if not exists public.mathpop_stat_viewers (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.mathpop_stat_viewers enable row level security;

create or replace function public.mathpop_can_view_stats()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from mathpop_stat_viewers where user_id = auth.uid());
$$;

-- The stats for the last `days` days, added up (never single events).
create or replace function public.mathpop_stats(days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  since date := current_date - greatest(1, least(days, 365)) + 1;
  result jsonb;
begin
  if not mathpop_can_view_stats() then
    raise exception 'not allowed';
  end if;
  with ev as (select * from mathpop_events where day >= since)
  select jsonb_build_object(
    'since', since,
    'totals', (
      select jsonb_build_object(
        'activeDays', count(*) filter (where event = 'open' and first_today),
        'newInstalls', count(*) filter (where event = 'open' and new_install),
        'opens', count(*) filter (where event = 'open'),
        'rounds', count(*) filter (where event = 'round'),
        'correct', coalesce(sum(correct) filter (where event = 'round'), 0),
        'answered', coalesce(sum(total) filter (where event = 'round'), 0)
      ) from ev
    ),
    'allTimeInstalls', (select count(*) from mathpop_events where event = 'open' and new_install),
    'daily', (
      select jsonb_agg(jsonb_build_object(
        'day', d.day,
        'devices', (select count(*) from ev where ev.day = d.day and event = 'open' and first_today),
        'rounds', (select count(*) from ev where ev.day = d.day and event = 'round'),
        'newInstalls', (select count(*) from ev where ev.day = d.day and event = 'open' and new_install)
      ) order by d.day)
      from (select generate_series(since, current_date, interval '1 day')::date as day) d
    ),
    'platforms', (
      select coalesce(jsonb_object_agg(platform, n), '{}') from (
        select platform, count(*) as n from ev where event = 'open' and first_today group by platform
      ) t
    ),
    'grades', (
      select coalesce(jsonb_object_agg(grade, n), '{}') from (
        select grade, count(*) as n from ev where event = 'round' and grade is not null group by grade
      ) t
    ),
    'languages', (
      select coalesce(jsonb_object_agg(lang, n), '{}') from (
        select lang, count(*) as n from ev where event = 'round' and lang is not null group by lang
      ) t
    ),
    'topics', (
      select coalesce(jsonb_agg(jsonb_build_object('topic', topic, 'rounds', n, 'correct', c, 'answered', a) order by n desc), '[]')
      from (
        select topic, count(*) as n, sum(correct) as c, sum(total) as a
        from ev where event = 'round' and topic is not null
        group by topic order by n desc limit 15
      ) t
    )
  ) into result;
  return result;
end;
$$;

revoke all on function public.mathpop_stats(int) from public, anon;
grant execute on function public.mathpop_stats(int) to authenticated;
grant execute on function public.mathpop_can_view_stats() to authenticated;

-- Family accounts that signed up for MathPop, newest first, with their
-- email: the sign-in is shared with PitchPop, so an account counts as
-- MathPop's when it has MathPop players, or when it signed up from MathPop
-- (the app marks those with app = 'mathpop'). Only for the stats viewers.
create or replace function public.mathpop_signups(days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  since timestamptz := now() - make_interval(days => greatest(1, least(days, 365)));
  result jsonb;
begin
  if not mathpop_can_view_stats() then
    raise exception 'not allowed';
  end if;
  with accounts as (
    select u.id, u.email, u.created_at, u.email_confirmed_at, u.last_sign_in_at,
      (select count(*) from mathpop_profiles p where p.owner_id = u.id) as players
    from auth.users u
    where u.raw_user_meta_data ->> 'app' = 'mathpop'
      or exists (select 1 from mathpop_profiles p where p.owner_id = u.id)
  )
  select jsonb_build_object(
    'total', (select count(*) from accounts),
    'newInRange', (select count(*) from accounts where created_at >= since),
    'accounts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'email', email,
        'at', created_at,
        'confirmed', email_confirmed_at is not null,
        'lastSignIn', last_sign_in_at,
        'players', players,
        'isNew', created_at >= since
      ) order by created_at desc)
      from (select * from accounts order by created_at desc limit 500) a
    ), '[]')
  ) into result;
  return result;
end;
$$;

revoke all on function public.mathpop_signups(int) from public, anon;
grant execute on function public.mathpop_signups(int) to authenticated;

-- Last step: let your own account see the stats (put in the email you sign
-- in to MathPop with, then run this line too):
-- insert into public.mathpop_stat_viewers (user_id)
--   select id from auth.users where email = 'you@example.com'
--   on conflict do nothing;
