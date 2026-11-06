// Apple's App Store numbers for MathPop, for the MathPop stats page:
// first-time downloads, redownloads, updates (the "App Downloads" report)
// and impressions and product page views (the "Discovery and Engagement"
// report), by day and country, from the App Store Connect Analytics
// Reports. Sends them to the store-stats Supabase function, which saves
// them (supabase/mathpop_store_stats.sql).
//
// The first run asks Apple to start making the reports (one with the
// history, one ongoing); Apple takes a day or two to make the first ones.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { api, token } from './asc.mjs';

const APP_ID = '6819345004';
const cloud = readFileSync(new URL('../../src/cloud.js', import.meta.url), 'utf8');
const SUPABASE_URL = cloud.match(/SUPABASE_URL = '([^']+)'/)[1];
const SUPABASE_KEY = cloud.match(/SUPABASE_KEY = '([^']+)'/)[1];

async function all(path) {
  const out = [];
  let next = path;
  while (next) {
    const res = await api('GET', next);
    out.push(...(res.data || []));
    next = res.links?.next ? res.links.next.replace('https://api.appstoreconnect.apple.com', '') : null;
  }
  return out;
}

// 1. The report requests: one ongoing (every day from now on) and one
//    snapshot (the history so far).
let requests = await all(`/v1/apps/${APP_ID}/analyticsReportRequests`);
for (const accessType of ['ONGOING', 'ONE_TIME_SNAPSHOT']) {
  if (requests.some((r) => r.attributes.accessType === accessType && !r.attributes.stoppedDueToInactivity)) continue;
  try {
    const res = await api('POST', '/v1/analyticsReportRequests', {
      type: 'analyticsReportRequests',
      attributes: { accessType },
      relationships: { app: { data: { type: 'apps', id: APP_ID } } },
    });
    requests.push(res.data);
    console.log(`Asked Apple to start the ${accessType} reports. The first ones take a day or two.`);
  } catch (e) {
    console.log(`Could not ask for the ${accessType} reports: ${e.message.split('\n')[0]}`);
  }
}

// 2. Read the daily report files and add them up by day, kind and country.
const KIND = {
  downloads: (row) => {
    const t = (row['Download Type'] || '').toLowerCase();
    if (t.startsWith('first')) return 'download';
    if (t.startsWith('redownload')) return 'redownload';
    if (t.includes('update')) return 'update';
    return null;
  },
  engagement: (row) => {
    const e = (row.Event || '').toLowerCase();
    if (e.startsWith('impression')) return 'impression';
    if (e.startsWith('page view')) return 'page_view';
    return null;
  },
};
const totals = new Map();
const seen = new Set();
let files = 0;
for (const request of requests) {
  const reports = await all(`/v1/analyticsReportRequests/${request.id}/reports`);
  for (const report of reports) {
    const name = report.attributes.name;
    const which = /^App Downloads Standard$/i.test(name) ? 'downloads' : /^App Store Discovery and Engagement Standard$/i.test(name) ? 'engagement' : null;
    if (!which) continue;
    const instances = await all(`/v1/analyticsReports/${report.id}/instances?filter[granularity]=DAILY&limit=200`);
    console.log(`${request.attributes.accessType} · ${name}: ${instances.length} days`);
    for (const inst of instances) {
      const key = `${which}|${inst.attributes.processingDate}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const segments = await all(`/v1/analyticsReportInstances/${inst.id}/segments`);
      for (const seg of segments) {
        const res = await fetch(seg.attributes.url);
        if (!res.ok) continue;
        let text = Buffer.from(await res.arrayBuffer());
        try {
          text = gunzipSync(text);
        } catch {}
        const [head, ...lines] = text.toString('utf8').split('\n').filter(Boolean);
        const cols = head.split('\t').map((c) => c.replace(/^"|"$/g, ''));
        files++;
        for (const line of lines) {
          const vals = line.split('\t').map((c) => c.replace(/^"|"$/g, ''));
          const row = Object.fromEntries(cols.map((c, i) => [c, vals[i]]));
          if (row['App Apple Identifier'] && row['App Apple Identifier'] !== APP_ID) continue;
          const kind = KIND[which](row);
          const n = Number(row.Counts);
          if (!kind || !row.Date || !Number.isFinite(n)) continue;
          const k = `${row.Date}|${kind}|${row.Territory || ''}`;
          totals.set(k, (totals.get(k) || 0) + n);
        }
      }
    }
  }
}

const rows = [...totals].map(([k, n]) => {
  const [day, kind, territory] = k.split('|');
  return { day, kind, territory, n };
});
const sum = (kind) => rows.filter((r) => r.kind === kind).reduce((s, r) => s + r.n, 0);
console.log(`${files} report files, ${rows.length} rows: downloads ${sum('download')}, redownloads ${sum('redownload')}, impressions ${sum('impression')}, page views ${sum('page_view')}`);
if (!rows.length) {
  console.log('Nothing to save yet.');
  process.exit(0);
}

// 3. Save them (the store-stats function checks the App Store Connect token).
const res = await fetch(`${SUPABASE_URL}/functions/v1/store-stats`, {
  method: 'POST',
  headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'x-asc-token': token(), 'Content-Type': 'application/json' },
  body: JSON.stringify({ rows }),
});
console.log(`Saved: ${res.status} ${await res.text()}`);
if (!res.ok) process.exit(1);
