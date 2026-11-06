-- Apple's own App Store numbers for MathPop (first-time downloads,
-- redownloads, updates, impressions, product page views, by country),
-- shown on the MathPop stats page. A GitHub workflow
-- (.github/workflows/appstore-analytics.yml) reads them each day from the
-- App Store Connect Analytics Reports and sends them to the
-- store-stats function, which saves them here. Apple's numbers run a day
-- or two behind.
--
-- Run once in the Supabase dashboard (SQL Editor). Safe to run again.

create table if not exists public.mathpop_store_daily (
  day date not null,
  kind text not null check (kind in ('download', 'redownload', 'update', 'impression', 'page_view')),
  territory text not null default '',
  n int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (day, kind, territory)
);

-- Nobody reads or writes it directly: the store-stats function writes it
-- (with the service key), and the stats viewers read it added up below.
alter table public.mathpop_store_daily enable row level security;

create or replace function public.mathpop_store_stats(days int default 30)
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
  with s as (select * from mathpop_store_daily where day >= since)
  select jsonb_build_object(
    'since', since,
    'through', (select max(day) from mathpop_store_daily),
    'updatedAt', (select max(updated_at) from mathpop_store_daily),
    'totals', (select coalesce(jsonb_object_agg(kind, n), '{}') from (select kind, sum(n) as n from s group by kind) t),
    'allTime', (select coalesce(jsonb_object_agg(kind, n), '{}') from (select kind, sum(n) as n from mathpop_store_daily group by kind) t),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object('day', day, 'downloads', n) order by day), '[]')
      from (select day, sum(n) as n from s where kind = 'download' group by day) t
    ),
    'countries', (
      select coalesce(jsonb_agg(jsonb_build_object('territory', territory, 'downloads', n) order by n desc), '[]')
      from (
        select territory, sum(n) as n from s
        where kind = 'download' and territory <> ''
        group by territory order by n desc limit 12
      ) t
    )
  ) into result;
  return result;
end;
$$;

revoke all on function public.mathpop_store_stats(int) from public, anon;
grant execute on function public.mathpop_store_stats(int) to authenticated;
