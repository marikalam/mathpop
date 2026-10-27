import { useEffect, useState } from 'react';
import { loadSignups, loadStats } from './cloud.js';

// MathPop stats (Account -> MathPop stats, for the accounts listed in
// supabase/mathpop_stats.sql): how much the app is used, added up from
// anonymous events (stats.js). Big numbers first, then one bar chart a
// day, then what's played, then the family accounts that signed up.
const RANGES = [7, 30, 90];
const PLATFORM_NAMES = { iphone: 'iPhone', ipad: 'iPad', web: 'Website' };
const LANG_NAMES = { en: 'English', ja: '日本語' };

function shortDay(iso) {
  const [, m, d] = iso.split('-').map(Number);
  return `${m}/${d}`;
}

function Tile({ value, label }) {
  return (
    <div className="stats-tile">
      <span className="stats-tile-value">{value}</span>
      <span className="stats-tile-label">{label}</span>
    </div>
  );
}

// Bars for a few named counts, biggest first, each with its number.
function BarList({ title, rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="stats-card">
      <h3 className="stats-card-title">{title}</h3>
      {rows.length === 0 ? (
        <p className="stats-empty">Nothing yet</p>
      ) : (
        <ul className="stats-bars">
          {rows.map((r) => (
            <li key={r.label} className="stats-bar-row">
              <span className="stats-bar-label">{r.label}</span>
              <span className="stats-bar-track">
                <span className="stats-bar-fill" style={{ width: `${(r.value / max) * 100}%` }} />
              </span>
              <span className="stats-bar-value">
                {r.value}
                {r.note && <span className="stats-bar-note"> · {r.note}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function shortDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// The family accounts, newest first: email, when they signed up, and how
// many players they have. "Copy emails" puts them all on the clipboard.
function Signups({ signups, days }) {
  const [copied, setCopied] = useState(false);
  if (signups === undefined) return null;
  if (signups === null) {
    return (
      <section className="stats-card">
        <h3 className="stats-card-title">Sign-ups</h3>
        <p className="stats-empty">Couldn’t load the sign-ups.</p>
      </section>
    );
  }
  const list = signups.accounts || [];
  async function copy() {
    try {
      await navigator.clipboard.writeText(list.map((a) => a.email).join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* no clipboard */
    }
  }
  return (
    <section className="stats-card">
      <div className="signups-head">
        <h3 className="stats-card-title">Sign-ups</h3>
        {list.length > 0 && (
          <button type="button" className="signups-copy" onClick={copy}>
            {copied ? 'Copied!' : 'Copy emails'}
          </button>
        )}
      </div>
      <p className="stats-note signups-note">
        {signups.total} {signups.total === 1 ? 'family account' : 'family accounts'} · {signups.newInRange} new in the last {days} days
      </p>
      {list.length === 0 ? (
        <p className="stats-empty">No sign-ups yet</p>
      ) : (
        <ul className="signups-list">
          {list.map((a) => (
            <li key={a.email} className="signups-row">
              <span className="signups-email">
                {a.email}
                {a.isNew && <span className="signups-new">New</span>}
              </span>
              <span className="signups-meta">
                {shortDate(a.at)} · {a.players} {a.players === 1 ? 'player' : 'players'}
                {!a.confirmed && ' · email not confirmed'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function sortedRows(obj, names = {}) {
  return Object.entries(obj || {})
    .map(([k, v]) => ({ label: names[k] || k, value: v }))
    .sort((a, b) => b.value - a.value);
}

export default function StatsScreen({ topicName, gradeName }) {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState(undefined);
  const [signups, setSignups] = useState(undefined);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    let live = true;
    setStats(undefined);
    setSignups(undefined);
    loadStats(days).then((s) => live && setStats(s));
    loadSignups(days).then((s) => live && setSignups(s));
    return () => {
      live = false;
    };
  }, [days]);

  const t = stats?.totals;
  const daily = stats?.daily || [];
  const maxDevices = Math.max(1, ...daily.map((d) => d.devices));
  const shown = hover ?? daily.length - 1;

  return (
    <div className="stats-screen">
      <div className="stats-range" role="radiogroup" aria-label="Time range">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={days === r}
            className={`stats-range-btn${days === r ? ' stats-range-btn-active' : ''}`}
            onClick={() => setDays(r)}
          >
            {r} days
          </button>
        ))}
      </div>

      {stats === undefined && <p className="screen-sub">Loading…</p>}
      {stats === null && (
        <p className="screen-sub">Couldn’t load the stats. Check the internet connection, and that supabase/mathpop_stats.sql has been run.</p>
      )}

      {t && (
        <>
          <div className="stats-tiles">
            <Tile value={Math.round((t.activeDays / (stats.daily?.length || days)) * 10) / 10} label="devices a day (average)" />
            <Tile value={t.newInstalls} label="new devices" />
            {signups && <Tile value={signups.newInRange} label="new sign-ups" />}
            <Tile value={t.rounds} label="rounds played" />
            <Tile value={t.answered ? `${Math.round((t.correct / t.answered) * 100)}%` : '–'} label="answered right" />
          </div>
          <p className="stats-note">
            {stats.allTimeInstalls} {stats.allTimeInstalls === 1 ? 'device' : 'devices'} since stats began. The usage counts are
            anonymous; only the sign-ups list shows emails.
          </p>

          <section className="stats-card">
            <h3 className="stats-card-title">Devices using MathPop each day</h3>
            {daily[shown] && (
              <p className="stats-chart-readout">
                <strong>{shortDay(daily[shown].day)}</strong> · {daily[shown].devices} {daily[shown].devices === 1 ? 'device' : 'devices'} ·{' '}
                {daily[shown].rounds} {daily[shown].rounds === 1 ? 'round' : 'rounds'}
                {daily[shown].newInstalls > 0 && ` · ${daily[shown].newInstalls} new`}
              </p>
            )}
            <div className="stats-chart" onMouseLeave={() => setHover(null)}>
              {daily.map((d, i) => (
                <button
                  key={d.day}
                  type="button"
                  className={`stats-col${i === shown ? ' stats-col-on' : ''}`}
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onClick={() => setHover(i)}
                  aria-label={`${shortDay(d.day)}: ${d.devices} devices, ${d.rounds} rounds`}
                >
                  <span className="stats-col-fill" style={{ height: `${(d.devices / maxDevices) * 100}%` }} />
                </button>
              ))}
            </div>
            <div className="stats-axis">
              <span>{daily[0] && shortDay(daily[0].day)}</span>
              <span>Today</span>
            </div>
          </section>

          <BarList title="iPhone, iPad or website (devices a day, added up)" rows={sortedRows(stats.platforms, PLATFORM_NAMES)} />
          <BarList title="Rounds by grade" rows={sortedRows(stats.grades).map((r) => ({ ...r, label: gradeName(r.label) }))} />
          <BarList
            title="Most played"
            rows={(stats.topics || []).map((x) => ({
              label: topicName(x.topic),
              value: x.rounds,
              note: x.answered ? `${Math.round((x.correct / x.answered) * 100)}% right` : null,
            }))}
          />
          <BarList title="Language" rows={sortedRows(stats.languages, LANG_NAMES)} />
          <Signups signups={signups} days={days} />
        </>
      )}
    </div>
  );
}
