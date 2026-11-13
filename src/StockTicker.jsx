import { useEffect, useState } from 'react';
import { loadSignups, loadStats, loadStoreStats } from './cloud.js';

// The top of MathPop stats, read like a stock app: each number is a
// "ticker" with its value for the last week (or month), a green ▲ or red ▼
// with the change from the period before, and a little chart whose dotted
// line is the period before's level. A ticker tape runs across the top.
// Days are whole days through yesterday (today isn't over yet), and
// Apple's downloads through the last day Apple has sent.

const PERIODS = [
  { id: '1W', days: 7, label: 'vs the week before' },
  { id: '1M', days: 30, label: 'vs the 30 days before' },
];

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function addDays(day, n) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + n);
  return iso(d);
}

// One value per day for the 2 × `days` days ending on `last` (0 for a day
// with nothing).
function series(byDay, last, days) {
  return Array.from({ length: days * 2 }, (_, i) => byDay[addDays(last, i - days * 2 + 1)] || 0);
}

// The tickers, from what the stats calls return.
export function buildTickers({ stats, store, signups }, days, today = iso(new Date())) {
  const yesterday = addDays(today, -1);
  const rows = [];
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const add = (sym, name, values, how = 'sum') => {
    const prev = values.slice(0, days);
    const cur = values.slice(days);
    const value = how === 'avg' ? sum(cur) / days : sum(cur);
    const before = how === 'avg' ? sum(prev) / days : sum(prev);
    rows.push({ sym, name, value, before, spark: cur, avg: how === 'avg', baseline: how === 'avg' ? before : before / days });
  };
  if (stats?.daily?.length) {
    const by = (k) => Object.fromEntries(stats.daily.map((d) => [d.day, d[k]]));
    add('PLAY', 'Kids playing a day', series(by('devices'), yesterday, days), 'avg');
    add('RNDS', 'Rounds played', series(by('rounds'), yesterday, days));
    add('NEW', 'New devices', series(by('newInstalls'), yesterday, days));
  }
  if (store?.through && store.daily) {
    const by = Object.fromEntries(store.daily.map((d) => [d.day, d.downloads]));
    add('DL', 'App Store downloads', series(by, store.through, days));
  }
  if (signups?.accounts) {
    const by = {};
    for (const a of signups.accounts) {
      const d = iso(new Date(a.at));
      by[d] = (by[d] || 0) + 1;
    }
    add('SIGN', 'Family sign-ups', series(by, yesterday, days));
  }
  return rows.map((r) => {
    const diff = r.value - r.before;
    const pct = r.before ? (diff / r.before) * 100 : r.value ? null : 0;
    return { ...r, diff, pct, dir: Math.abs(diff) < 1e-9 ? 'flat' : diff > 0 ? 'up' : 'down' };
  });
}

const fmt = (v, avg) => (avg ? (Math.round(v * 10) / 10).toLocaleString() : Math.round(v).toLocaleString());
const arrow = { up: '▲', down: '▼', flat: '▶' };
function change(r) {
  if (r.dir === 'flat') return 'no change';
  if (r.pct === null) return `${arrow.up} new`;
  return `${arrow[r.dir]} ${Math.abs(r.pct) >= 10 ? Math.round(Math.abs(r.pct)) : Math.abs(r.pct).toFixed(1)}%`;
}

// A little line chart; the dotted line is the period before's level.
function Spark({ values, baseline, dir }) {
  const W = 96;
  const H = 34;
  const max = Math.max(1, baseline, ...values);
  const x = (i) => (values.length < 2 ? W / 2 : (i / (values.length - 1)) * W);
  const y = (v) => H - 3 - (v / max) * (H - 6);
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const id = `spark-${dir}`;
  return (
    <svg className={`ticker-spark ticker-${dir}`} viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" x2={W} y1={y(baseline)} y2={y(baseline)} className="ticker-base" />
      <polygon points={`0,${H} ${pts} ${W},${H}`} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1] || 0)} r="2.6" fill="currentColor" />
    </svg>
  );
}

export function TickerBoard({ rows, period, onPeriod, loading }) {
  const p = PERIODS.find((x) => x.id === period);
  return (
    <section className="stats-card ticker-card">
      <div className="ticker-head">
        <h3 className="stats-card-title">MathPop market</h3>
        <div className="ticker-periods" role="radiogroup" aria-label="Compare">
          {PERIODS.map((x) => (
            <button key={x.id} type="button" role="radio" aria-checked={x.id === period} className={`ticker-period${x.id === period ? ' ticker-period-on' : ''}`} onClick={() => onPeriod(x.id)}>
              {x.id}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <p className="stats-empty">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="stats-empty">Couldn’t load the numbers.</p>
      ) : (
        <>
          {/* The tape: the tickers scrolling by, twice over so it loops. */}
          <div className="ticker-tape" aria-hidden="true">
            <div className="ticker-tape-run">
              {[0, 1].map((k) => (
                <span key={k} className="ticker-tape-set">
                  {rows.map((r) => (
                    <span key={r.sym} className="ticker-tape-item">
                      <b>{r.sym}</b> {fmt(r.value, r.avg)} <span className={`ticker-${r.dir}`}>{change(r)}</span>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
          <ul className="ticker-list">
            {rows.map((r) => (
              <li key={r.sym} className="ticker-row">
                <span className="ticker-name">
                  <b>{r.sym}</b>
                  <small>{r.name}</small>
                </span>
                <Spark values={r.spark} baseline={r.baseline} dir={r.dir} />
                <span className="ticker-value">
                  <b>{fmt(r.value, r.avg)}</b>
                  <span className={`ticker-pill ticker-pill-${r.dir}`} title={`${p.label}: ${fmt(r.before, r.avg)}`}>
                    {change(r)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="stats-note">
            Last {p.days} days through yesterday {p.label}
            {rows.some((r) => r.sym === 'PLAY') && ' (PLAY is a daily average)'}. Apple’s downloads run a day or two behind.
          </p>
        </>
      )}
    </section>
  );
}

export default function StockTicker() {
  const [period, setPeriod] = useState('1W');
  const [data, setData] = useState(null);
  useEffect(() => {
    let live = true;
    // Enough days for this period and the one before (and today).
    Promise.all([loadStats(61), loadStoreStats(64), loadSignups(61)]).then(([stats, store, signups]) => live && setData({ stats, store, signups }));
    return () => {
      live = false;
    };
  }, []);
  const days = PERIODS.find((x) => x.id === period).days;
  return <TickerBoard rows={data ? buildTickers(data, days) : []} period={period} onPeriod={setPeriod} loading={!data} />;
}
