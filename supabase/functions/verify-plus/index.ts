// verify-plus: a family bought Plus in MathPop (or PitchPop) on an iPhone.
// The app sends the purchase as Apple signed it (StoreKit 2's JWS); this
// checks the signature really comes from Apple (the certificate chain up to
// Apple Root CA - G3), that it's our app and a Plus product, and that it
// was bought for this family account (appAccountToken = the account id),
// then records it in family_plus (supabase/plus_setup.sql). Every device
// and app signed in to the family then has Plus.
//
// Deploy: Supabase dashboard -> Edge Functions -> Deploy a new function ->
// Via Editor -> name it verify-plus -> paste this file -> Deploy.
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as x509 from 'npm:@peculiar/x509@1.12.3';

const APPLE_ROOT_G3_SHA256 = '63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179';
const APPS = ['com.marikalam.mathpop', 'com.marikalam.pitchpop'];
const PRODUCT = /^com\.marikalam\.(mathpop|pitchpop)\.plus\.[a-z]+$/;
// Apple's marks on its App Store receipt-signing certificates.
const LEAF_OID = '1.2.840.113635.100.6.11.1';
const INTERMEDIATE_OID = '1.2.840.113635.100.6.2.1';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const b64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

// The transaction inside a StoreKit 2 JWS, once Apple's signature checks out.
async function verifiedTransaction(jws: string) {
  const [head, body, sig] = jws.split('.');
  const header = JSON.parse(new TextDecoder().decode(b64url(head)));
  if (header.alg !== 'ES256' || !Array.isArray(header.x5c) || header.x5c.length !== 3) throw new Error('not an App Store signature');
  const [leafDer, midDer, rootDer] = header.x5c.map(b64);
  if (hex(await crypto.subtle.digest('SHA-256', rootDer)) !== APPLE_ROOT_G3_SHA256) throw new Error('not Apple’s root certificate');
  const [leaf, mid, root] = [leafDer, midDer, rootDer].map((d) => new x509.X509Certificate(d));
  if (!leaf.getExtension(LEAF_OID) || !mid.getExtension(INTERMEDIATE_OID)) throw new Error('not App Store certificates');
  if (!(await mid.verify({ publicKey: root.publicKey, signatureOnly: true }))) throw new Error('bad intermediate certificate');
  if (!(await leaf.verify({ publicKey: mid.publicKey, signatureOnly: true }))) throw new Error('bad signing certificate');
  const key = await crypto.subtle.importKey('spki', leaf.publicKey.rawData, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, b64url(sig), new TextEncoder().encode(`${head}.${body}`));
  if (!ok) throw new Error('bad signature');
  return JSON.parse(new TextDecoder().decode(b64url(body)));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: who } = await asUser.auth.getUser();
    if (!who?.user) return reply(401, { error: 'Sign in first' });

    const { jws } = await req.json();
    const t = await verifiedTransaction(String(jws || ''));
    if (!APPS.includes(t.bundleId) || !PRODUCT.test(t.productId)) return reply(400, { error: 'Not a Plus purchase' });
    if (String(t.appAccountToken || '').toLowerCase() !== who.user.id.toLowerCase()) {
      return reply(403, { error: 'This purchase belongs to another account' });
    }
    if (t.revocationDate) return reply(200, { plus: false, reason: 'refunded' });

    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const expires = new Date(Number(t.expiresDate)).toISOString();
    // Never shorten Plus another purchase already gave (two apps, two plans).
    const { data: had } = await admin.from('family_plus').select('expires_at').eq('owner_id', who.user.id).maybeSingle();
    if (!had || new Date(had.expires_at) < new Date(expires)) {
      const { error } = await admin.from('family_plus').upsert({
        owner_id: who.user.id,
        expires_at: expires,
        product_id: t.productId,
        original_transaction_id: String(t.originalTransactionId),
        app: t.bundleId,
        environment: String(t.environment || ''),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    }
    return reply(200, { plus: new Date(expires) > new Date(), paidUntil: had && new Date(had.expires_at) > new Date(expires) ? had.expires_at : expires });
  } catch (err) {
    return reply(400, { error: String((err as Error).message || err) });
  }
});
