// store-stats: saves Apple's App Store numbers for MathPop (downloads,
// impressions, product page views, by day and country) into
// mathpop_store_daily (supabase/mathpop_store_stats.sql). The daily GitHub
// workflow (.github/workflows/appstore-analytics.yml) reads them from App
// Store Connect and sends them here.
//
// Only whoever holds MathPop's App Store Connect API key can send them:
// the workflow sends a short-lived token signed with that key (header
// x-asc-token), and this function checks it by asking Apple for MathPop
// with it. No extra secret to set up.
import { createClient } from 'npm:@supabase/supabase-js@2';

const APP_ID = '6819345004';
const KINDS = new Set(['download', 'redownload', 'update', 'impression', 'page_view']);

const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply(405, { error: 'POST only' });
  const asc = req.headers.get('x-asc-token') || '';
  if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(asc)) return reply(401, { error: 'missing App Store Connect token' });

  const check = await fetch(`https://api.appstoreconnect.apple.com/v1/apps/${APP_ID}?fields[apps]=bundleId`, {
    headers: { Authorization: `Bearer ${asc}` },
  });
  if (!check.ok) return reply(401, { error: `Apple did not accept the token (${check.status})` });
  const app = await check.json();
  if (app?.data?.id !== APP_ID) return reply(401, { error: 'not MathPop' });

  let body: { rows?: { day: string; kind: string; territory?: string; n: number }[] };
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: 'bad JSON' });
  }
  const now = new Date().toISOString();
  const rows = (body.rows || [])
    .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.day) && KINDS.has(r.kind) && Number.isFinite(r.n))
    .map((r) => ({ day: r.day, kind: r.kind, territory: String(r.territory || '').slice(0, 8), n: Math.max(0, Math.round(r.n)), updated_at: now }));
  if (!rows.length) return reply(200, { saved: 0 });

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from('mathpop_store_daily').upsert(rows.slice(i, i + 500), { onConflict: 'day,kind,territory' });
    if (error) return reply(500, { error: error.message });
  }
  return reply(200, { saved: rows.length });
});
