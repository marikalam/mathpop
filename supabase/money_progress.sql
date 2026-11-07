-- Money progress (MathPop and PitchPop share this database): for the
-- accounts that can see either app's stats (mathpop_stat_viewers,
-- pitchpop_stat_viewers), how families move from download to paying
-- since each app's paid plan started:
--   allDownloads first opens on iPhone/iPad since stats began
--   downloads   first opens on iPhone/iPad since the paid plan started
--               (from the anonymous events, TestFlight included)
--   inTrial     of those, the ones from the last 7 days: still in their
--               free week
--   trialDone   the ones older than 7 days: their free week is over
--   accounts    family accounts made since the paid plan started
--               (founders: accounts made before it, free for good)
--   paying      family accounts with a paid plan that hasn't run out
--               (App Store purchases only, not sandbox/TestFlight ones),
--               monthly / yearly / lifetime
-- PitchPop's purchases go through RevenueCat and aren't saved here yet,
-- so its paying count only covers what reaches family_plus.
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste ->
-- Run. Safe to run again.

create or replace function public.money_progress()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  mp_start date := (select plus_starts from plus_config where id = 1);
  pp_start date := date '2026-11-04'; -- PAID_SINCE in pitchpop/src/plan.js
  week_ago date := current_date - 6;
begin
  if not (exists (select 1 from mathpop_stat_viewers where user_id = auth.uid())
          or exists (select 1 from pitchpop_stat_viewers where user_id = auth.uid())) then
    return null;
  end if;
  return jsonb_build_object(
    'updatedAt', now(),
    'mathpop', jsonb_build_object(
      'allDownloads', (select count(*) from mathpop_events where new_install and platform in ('iphone', 'ipad')),
      'paidSince', mp_start,
      'downloads', (select count(*) from mathpop_events where new_install and platform in ('iphone', 'ipad') and day >= mp_start),
      'inTrial', (select count(*) from mathpop_events where new_install and platform in ('iphone', 'ipad') and day >= greatest(mp_start, week_ago)),
      'trialDone', (select count(*) from mathpop_events where new_install and platform in ('iphone', 'ipad') and day >= mp_start and day < week_ago),
      'accounts', (select count(*) from auth.users where created_at::date >= mp_start),
      'founders', (select count(*) from auth.users where created_at::date < mp_start)
    ),
    'pitchpop', jsonb_build_object(
      'allDownloads', (select count(*) from pitchpop_events where new_install and platform in ('iphone', 'ipad')),
      'paidSince', pp_start,
      'downloads', (select count(*) from pitchpop_events where new_install and platform in ('iphone', 'ipad') and day >= pp_start),
      'inTrial', (select count(*) from pitchpop_events where new_install and platform in ('iphone', 'ipad') and day >= greatest(pp_start, week_ago)),
      'trialDone', (select count(*) from pitchpop_events where new_install and platform in ('iphone', 'ipad') and day >= pp_start and day < week_ago),
      'accounts', (select count(*) from auth.users where created_at::date >= pp_start),
      'founders', (select count(*) from auth.users where created_at::date < pp_start)
    ),
    'paying', (
      select jsonb_build_object(
        'families', count(*),
        'monthly', count(*) filter (where product_id like '%monthly%'),
        'yearly', count(*) filter (where product_id like '%yearly%'),
        'lifetime', count(*) filter (where product_id like '%lifetime%'),
        'mathpop', count(*) filter (where app like '%mathpop%'),
        'pitchpop', count(*) filter (where app like '%pitchpop%')
      )
      from family_plus
      where environment = 'Production' and expires_at > now()
    )
  );
end;
$$;
revoke all on function public.money_progress() from public, anon;
grant execute on function public.money_progress() to authenticated;
