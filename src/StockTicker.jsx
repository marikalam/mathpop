import { useEffect, useRef, useState } from 'react';
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

// ---- The big stock chart (Settings, for the owner) ----
// One number at a time, like a stock: pick what to watch and how far
// back. The big number is the total (or, for kids playing, the daily
// average) over the range, with ▲/▼ against the range before. The line
// is green when it's up, red when it's down; the dotted line is the range
// before's level. Drag along the chart to read any day. Over 3 and 6
// months the line is a 7-day average, so it isn't too jumpy.
const METRICS = [
  { id: 'devices', label: 'Kids playing', avg: true },
  { id: 'rounds', label: 'Rounds' },
  { id: 'downloads', label: 'Downloads' },
  { id: 'signups', label: 'Sign-ups' },
  { id: 'newInstalls', label: 'New devices' },
];
const RANGES = [
  { id: '1W', days: 7 },
  { id: '1M', days: 30 },
  { id: '3M', days: 91, smooth: true },
  { id: '6M', days: 182, smooth: true },
];
const longDay = (day) => new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

function byDayFor(data, metric) {
  if (metric === 'downloads') return { by: Object.fromEntries((data.store?.daily || []).map((d) => [d.day, d.downloads])), last: data.store?.through };
  if (metric === 'signups') {
    const by = {};
    for (const a of data.signups?.accounts || []) {
      const d = iso(new Date(a.at));
      by[d] = (by[d] || 0) + 1;
    }
    return { by, last: null };
  }
  return { by: Object.fromEntries((data.stats?.daily || []).map((d) => [d.day, d[metric]])), last: null };
}

export function StockChart({ onOpenStats }) {
  const [data, setData] = useState(null);
  const [metric, setMetric] = useState('devices');
  const [range, setRange] = useState('1M');
  const [hover, setHover] = useState(null);
  const svg = useRef(null);
  useEffect(() => {
    let live = true;
    // 6 months and the 6 months before.
    Promise.all([loadStats(365), loadStoreStats(365), loadSignups(365)]).then(([stats, store, signups]) => live && setData({ stats, store, signups }));
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => setHover(null), [metric, range]);

  const R = RANGES.find((x) => x.id === range);
  const M = METRICS.find((x) => x.id === metric);
  if (!data) {
    return (
      <section className="stats-card stock-card">
        <p className="stats-empty">Loading MathPop’s chart…</p>
      </section>
    );
  }
  if (!data.stats && !data.store && !data.signups) return null;

  const today = iso(new Date());
  const { by, last } = byDayFor(data, metric);
  const end = last || addDays(today, -1);
  const n = R.days;
  const vals = series(by, end, n); // the range before, then this range
  const days = Array.from({ length: n }, (_, i) => addDays(end, i - n + 1));
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const cur = vals.slice(n);
  const prev = vals.slice(0, n);
  const value = M.avg ? sum(cur) / n : sum(cur);
  const before = M.avg ? sum(prev) / n : sum(prev);
  const diff = value - before;
  const pct = before ? (diff / before) * 100 : value ? null : 0;
  const dir = Math.abs(diff) < 1e-9 ? 'flat' : diff > 0 ? 'up' : 'down';
  // The line: daily, or a 7-day average over the longer ranges.
  const line = R.smooth ? cur.map((_, i) => sum(vals.slice(n + i - 6, n + i + 1)) / 7) : cur;
  const base = sum(prev) / n;

  const W = 340;
  const H = 170;
  const top = 12;
  const bot = 22;
  const max = Math.max(1, base, ...line) * 1.1;
  const x = (i) => (n === 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (v) => top + (1 - v / max) * (H - top - bot);
  const pts = line.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const fmtV = (v) => (M.avg || R.smooth ? (Math.round(v * 10) / 10).toLocaleString() : Math.round(v).toLocaleString());

  function pickAt(e) {
    const r = svg.current.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  }
  const h = hover;
  return (
    <section className={`stats-card stock-card stock-${dir}`}>
      <div className="stock-top">
        <span className="stock-name">MathPop · {M.label}</span>
        {onOpenStats && (
          <button type="button" className="stock-more" onClick={onOpenStats}>
            All stats →
          </button>
        )}
      </div>
      <div className="stock-price">
        {h === null ? (
          <>
            <strong key={`${metric}-${range}`}>{fmtV(value)}</strong>
            <span className={`ticker-pill ticker-pill-${dir}`}>{change({ dir, pct })}</span>
            <small>
              {M.avg ? 'a day, ' : ''}last {R.id === '1W' ? 'week' : R.id === '1M' ? 'month' : R.id === '3M' ? '3 months' : '6 months'} · was {fmtV(before)}
            </small>
          </>
        ) : (
          <>
            <strong>{fmtV(line[h])}</strong>
            <small>
              {longDay(days[h])}
              {R.smooth ? ' · 7-day average' : ''}
            </small>
          </>
        )}
      </div>
      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        className="stock-svg"
        onPointerDown={pickAt}
        onPointerMove={(e) => (e.buttons || e.pointerType === 'mouse') && pickAt(e)}
        onPointerLeave={() => setHover(null)}
        onPointerUp={(e) => e.pointerType !== 'mouse' && setHover(null)}
        role="img"
        aria-label={`${M.label}: ${fmtV(value)}, ${change({ dir, pct })}`}
      >
        <defs>
          <linearGradient id="stock-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={W} y1={top + f * (H - top - bot)} y2={top + f * (H - top - bot)} className="stock-grid" />
        ))}
        <line x1="0" x2={W} y1={y(base)} y2={y(base)} className="stock-base" />
        <polygon key={`f-${metric}-${range}`} className="stock-area" points={`0,${H - bot} ${pts} ${W},${H - bot}`} fill="url(#stock-fill)" />
        <polyline key={`l-${metric}-${range}`} className="stock-line" points={pts} pathLength="1" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
        {h === null ? (
          <circle className="stock-dot" cx={x(n - 1)} cy={y(line[n - 1])} r="4.5" fill="currentColor" />
        ) : (
          <>
            <line x1={x(h)} x2={x(h)} y1={top} y2={H - bot} className="stock-cross" />
            <circle cx={x(h)} cy={y(line[h])} r="5" fill="#fff" stroke="currentColor" strokeWidth="3" />
          </>
        )}
        <text x="2" y={H - 6} className="stock-axis">
          {longDay(days[0])}
        </text>
        <text x={W - 2} y={H - 6} textAnchor="end" className="stock-axis">
          {metric === 'downloads' && last ? longDay(end) : 'Yesterday'}
        </text>
      </svg>
      <div className="stock-ranges" role="radiogroup" aria-label="How far back">
        {RANGES.map((x2) => (
          <button key={x2.id} type="button" role="radio" aria-checked={x2.id === range} className={`stock-range${x2.id === range ? ' stock-range-on' : ''}`} onClick={() => setRange(x2.id)}>
            {x2.id}
          </button>
        ))}
      </div>
      <div className="stock-metrics" role="radiogroup" aria-label="What to watch">
        {METRICS.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={m.id === metric} className={`stock-metric${m.id === metric ? ' stock-metric-on' : ''}`} onClick={() => setMetric(m.id)}>
            {m.label}
          </button>
        ))}
      </div>
    </section>
  );
}
