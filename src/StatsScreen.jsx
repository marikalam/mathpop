import { useEffect, useState } from 'react';
import { loadAppleSales, loadMoneyProgress, loadSignups, loadStats, loadStoreStats } from './cloud.js';

// MathPop stats (Account -> MathPop stats, for the accounts listed in
// supabase/mathpop_stats.sql): how much the app is used, added up from
// anonymous events (stats.js). Big numbers first, then the family
// accounts that signed up (with their emails), then one bar chart a day,
// then what's played.
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
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

// Apple's own App Store numbers (the App Store downloads workflow saves
// them each day; they run a day or two behind): first-time downloads,
// how many saw MathPop and opened its page, and the top countries.
function countryName(code) {
  try {
    return new Intl.DisplayNames(undefined, { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

function AppStore({ store, days }) {
  if (store === undefined) return null;
  const t = store?.totals || {};
  const has = store && store.through;
  const downloads = t.download || 0;
  return (
    <>
      <section className="stats-card">
        <h3 className="stats-card-title">App Store (from Apple)</h3>
        {!has ? (
          <p className="stats-empty">
            {store === null
              ? 'Couldn’t load the App Store numbers.'
              : 'Apple’s numbers will show here a day or two after the App Store downloads workflow first runs.'}
          </p>
        ) : (
          <>
            <div className="stats-tiles">
              <Tile value={downloads} label="downloads" />
              <Tile value={t.redownload || 0} label="redownloads" />
              <Tile value={(t.impression || 0).toLocaleString()} label="saw it in the App Store" />
              <Tile value={t.page_view || 0} label="opened its page" />
              <Tile value={t.page_view ? `${Math.round((downloads / t.page_view) * 100)}%` : '–'} label="page → download" />
            </div>
            <p className="stats-note">
              Last {days} days, up to {shortDate(`${store.through}T12:00:00`)}. {store.allTime?.download || 0} downloads in all. Apple’s numbers run a day or
              two behind.
            </p>
          </>
        )}
      </section>
      {has && (store.countries || []).length > 0 && (
        <BarList
          title="Downloads by country"
          rows={store.countries.map((c) => ({
            label: countryName(c.territory),
            value: c.downloads,
          }))}
        />
      )}
    </>
  );
}

function sortedRows(obj, names = {}) {
  return Object.entries(obj || {})
    .map(([k, v]) => ({ label: names[k] || k, value: v }))
    .sort((a, b) => b.value - a.value);
}

// The one number to watch, at the top: how many kids play MathPop each
// day (devices that opened it): today so far, compared with yesterday,
// and the last DAYS days as bars (tap one for its number). Below it, this
// week's path: new downloads -> family sign-ups -> paying families.
const DAYS = 30;

// The few numbers that matter, since the start, in plain words:
// downloads (Apple's App Store reports), users (devices that played, on
// the app or the website), family accounts and paying families.
function TotalsCard() {
  const [apple, setApple] = useState(undefined);
  const [stats, setStats] = useState(undefined);
  const [signups, setSignups] = useState(undefined);
  const [money, setMoney] = useState(undefined);
  useEffect(() => {
    let live = true;
    loadAppleSales().then((a) => live && setApple(a));
    loadStats(7).then((s) => live && setStats(s));
    loadSignups(7).then((s) => live && setSignups(s));
    loadMoneyProgress().then((m) => live && setMoney(m));
    return () => {
      live = false;
    };
  }, []);
  const dash = (v) => (v === undefined ? '…' : '–');
  const mine = Array.isArray(apple) ? apple.find((a) => /mathpop/i.test(a.title || '')) : null;
  const downloads = mine?.allTime?.downloads;
  const users = stats?.allTimeInstalls;
  const appUsers = money?.mathpop?.allDownloads;
  const families = signups?.total;
  const paying = money?.paying?.mathpop;
  return (
    <section className="stats-card totals-card">
      <h3 className="stats-card-title">All time</h3>
      <div className="totals-grid">
        <div className="totals-item">
          <span className="totals-num">{downloads ?? dash(apple)}</span>
          <span className="totals-label">Downloads</span>
          <span className="totals-sub">from the App Store{mine?.allTime?.redownloads ? ` (+${mine.allTime.redownloads} re-downloads)` : ''}</span>
        </div>
        <div className="totals-item">
          <span className="totals-num">{users ?? dash(stats)}</span>
          <span className="totals-label">Users</span>
          <span className="totals-sub">
            {appUsers != null && users != null ? `${appUsers} on iPhone & iPad, ${Math.max(0, users - appUsers)} on the website` : 'devices that played'}
          </span>
        </div>
        <div className="totals-item">
          <span className="totals-num">{families ?? dash(signups)}</span>
          <span className="totals-label">Family accounts</span>
          <span className="totals-sub">signed up with an email</span>
        </div>
        <div className="totals-item">
          <span className="totals-num">{paying ?? dash(money)}</span>
          <span className="totals-label">Paying</span>
          <span className="totals-sub">families with MathPop Plus</span>
        </div>
      </div>
      <p className="stats-note">Apple’s download numbers run a day or two behind. A user is a phone, tablet or computer that opened MathPop.</p>
    </section>
  );
}

function ProgressCard() {
  const [stats, setStats] = useState(undefined);
  const [signups, setSignups] = useState(undefined);
  const [money, setMoney] = useState(undefined);
  const [pick, setPick] = useState(null);
  useEffect(() => {
    let live = true;
    loadStats(DAYS).then((s) => live && setStats(s));
    loadSignups(7).then((s) => live && setSignups(s));
    loadMoneyProgress().then((m) => live && setMoney(m));
    return () => {
      live = false;
    };
  }, []);
  if (stats === null) return null;
  if (stats === undefined)
    return (
      <section className="stats-card progress-card">
        <p className="stats-empty">Loading…</p>
      </section>
    );
  const daily = (stats.daily || []).slice(-DAYS);
  if (!daily.length) return null;
  const today = daily[daily.length - 1];
  const yesterday = daily[daily.length - 2];
  const weekAgo = daily[daily.length - 8];
  const max = Math.max(1, ...daily.map((d) => d.devices));
  const shown = daily[pick ?? daily.length - 1];
  const week = daily.slice(-7);
  const weekInstalls = week.reduce((n, d) => n + d.newInstalls, 0);
  const paying = money?.paying?.mathpop;
  return (
    <section className="stats-card progress-card">
      <h3 className="stats-card-title">Kids playing each day</h3>
      <div className="progress-big">
        <span className="progress-num">{today.devices}</span>
        <span className="progress-today">today so far</span>
      </div>
      <p className="progress-sub">
        Yesterday: <strong>{yesterday ? yesterday.devices : '–'}</strong>
        {weekAgo && (
          <>
            {' · '}Same day last week: <strong>{weekAgo.devices}</strong>
          </>
        )}
      </p>
      <div className="progress-chart progress-chart-days" onMouseLeave={() => setPick(null)}>
        {daily.map((d, i) => (
          <button
            key={d.day}
            type="button"
            className={`progress-bar${shown === d ? ' progress-bar-on' : ''}`}
            onClick={() => setPick(i)}
            onMouseEnter={() => setPick(i)}
            aria-label={`${shortDay(d.day)}: ${d.devices} playing`}
          >
            <span style={{ height: `${Math.max(3, (d.devices / max) * 100)}%` }} />
          </button>
        ))}
      </div>
      <div className="stats-axis">
        <span>{shortDay(daily[0].day)}</span>
        <span>
          {shown === today ? 'Today' : shortDay(shown.day)}: <strong>{shown.devices}</strong> playing
          {shown.newInstalls > 0 && ` · ${shown.newInstalls} new`}
        </span>
      </div>
      <div className="progress-funnel">
        <span className="progress-funnel-title">Last 7 days</span>
        <span className="progress-step">
          <strong>{weekInstalls}</strong> new downloads
        </span>
        <span className="progress-arrow">→</span>
        <span className="progress-step">
          <strong>{signups?.newInRange ?? '–'}</strong> signed up
        </span>
        <span className="progress-arrow">→</span>
        <span className="progress-step">
          <strong>{paying ?? '–'}</strong> paying
        </span>
      </div>
    </section>
  );
}

export default function StatsScreen({ topicName, gradeName }) {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState(undefined);
  const [signups, setSignups] = useState(undefined);
  const [store, setStore] = useState(undefined);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    let live = true;
    setStats(undefined);
    setSignups(undefined);
    setStore(undefined);
    loadStats(days).then((s) => live && setStats(s));
    loadStoreStats(days).then((s) => live && setStore(s));
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
      <TotalsCard />
      <ProgressCard />
      {/* Everything else, folded away. */}
      <details className="stats-more">
        <summary>More numbers</summary>
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
            {stats.allTimeInstalls} {stats.allTimeInstalls === 1 ? 'device' : 'devices'} since stats began. The usage counts are anonymous; only the sign-ups
            list below shows emails.
          </p>

          <AppStore store={store} days={days} />
          <Signups signups={signups} days={days} />

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
          <BarList
            title="Rounds by grade"
            rows={sortedRows(stats.grades).map((r) => ({
              ...r,
              label: gradeName(r.label),
            }))}
          />
          <BarList
            title="Most played"
            rows={(stats.topics || []).map((x) => ({
              label: topicName(x.topic),
              value: x.rounds,
              note: x.answered ? `${Math.round((x.correct / x.answered) * 100)}% right` : null,
            }))}
          />
          <BarList title="Language" rows={sortedRows(stats.languages, LANG_NAMES)} />
        </>
      )}
      </details>
    </div>
  );
}
