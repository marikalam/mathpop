import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';
import { loadFamilyPlus, loadPlusStart, verifyPlusPurchase } from './cloud.js';

// MathPop Plus: all of MathPop, every day (and the grown-ups' extras: the
// full progress report and assigning practice), one family plan with
// PitchPop. Without it, kids get one free round a day. Who has it:
//   - everyone, until the day Plus starts is set (supabase/plus_setup.sql);
//   - founding families, free for good: anyone using MathPop before that
//     day - this device had MathPop before it, or (iPhone) the app was
//     first downloaded before it, or the family account was made before it;
//   - new families for 7 days after making their family account (the free
//     trial: no payment details);
//   - families who subscribe in the iPhone app (or in PitchPop): the
//     purchase is checked with Apple (verify-plus) and saved to the family
//     account, so every device and both apps have it.
// TestFlight and App Review (Apple's sandbox) act as if Plus had started
// today when no start day is set yet, so a fresh install is a new family
// (trial, free round, subscribing can be tried) while a device that
// already had MathPop is still a founding family.
export const PLUS_PRODUCTS = ['com.marikalam.mathpop.plus.monthly', 'com.marikalam.mathpop.plus.yearly'];
const IS_NATIVE = Capacitor.isNativePlatform();
const FIRST_SEEN_KEY = 'mathpop-first-seen-v1';
const STATUS_KEY = 'mathpop-plus-status-v1';
const START_KEY = 'mathpop-plus-start-v1';
const FREE_ROUND_KEY = 'mathpop-free-round-v1';
export const TRIAL_DAYS = 7;

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

// The day MathPop was first used on this device. A device that already
// had MathPop (progress, rounds or players) before this version counts
// from long ago.
(function rememberFirstSeen() {
  if (read(FIRST_SEEN_KEY)) return;
  let before = false;
  try {
    before = ['mathpop-progress-v3', 'mathpop-progress-v2', 'mathpop-round-log-v1', 'mathpop-account-players-v1', 'mathpop-stats-installed-v1'].some((k) =>
      localStorage.getItem(k),
    );
  } catch {
    /* ignore */
  }
  write(FIRST_SEEN_KEY, before ? '2000-01-01' : today());
})();

// The last known answer, for an instant (and offline) start.
export function cachedPlus() {
  return read(STATUS_KEY) || { plus: true, why: 'early' };
}

let appTransactionPromise = null;
function appTransaction() {
  if (!IS_NATIVE) return Promise.resolve(null);
  if (!appTransactionPromise) {
    appTransactionPromise = NativePurchases.getAppTransaction()
      .then((r) => r.appTransaction)
      .catch(() => null);
  }
  return appTransactionPromise;
}

// This device's own App Store subscription (iPhone), if any.
async function deviceSubscription() {
  if (!IS_NATIVE) return null;
  try {
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.SUBS, onlyCurrentEntitlements: true });
    return purchases.find((p) => PLUS_PRODUCTS.includes(p.productIdentifier) && p.isActive !== false) || null;
  } catch {
    return null;
  }
}

// Works out whether this family has Plus: { plus, why, paidUntil,
// trialEnds }. `why` is 'early' (Plus hasn't started), 'founder', 'paid',
// 'trial' or null (then trialOver says whether the trial was had).
export async function refreshPlus(user) {
  const remote = await loadPlusStart();
  const plusStarts = remote ? remote.plusStarts : read(START_KEY);
  if (remote) write(START_KEY, plusStarts);
  const app = await appTransaction();
  const testing = IS_NATIVE && app && app.environment && app.environment !== 'Production';
  let status;
  const start = plusStarts || (testing ? today() : null);
  if (!start) {
    status = { plus: true, why: 'early' };
  } else {
    const firstSeen = read(FIRST_SEEN_KEY) || today();
    const family = user ? await loadFamilyPlus() : null;
    const sub = await deviceSubscription();
    // Keep the family account up to date with this device's subscription
    // (renewals included).
    if (sub?.jwsRepresentation && user) verifyPlusPurchase(sub.jwsRepresentation);
    const paidUntil = family?.paidUntil && new Date(family.paidUntil) > new Date() ? family.paidUntil : sub?.expirationDate || null;
    const founder = Boolean(
      firstSeen < start || (app?.originalPurchaseDate && app.originalPurchaseDate.slice(0, 10) < start) || family?.founder,
    );
    const trialEnds = family?.accountCreated
      ? new Date(new Date(family.accountCreated).getTime() + TRIAL_DAYS * 86400000).toISOString()
      : null;
    const previous = read(STATUS_KEY);
    if (founder) status = { plus: true, why: 'founder' };
    else if (paidUntil || sub) status = { plus: true, why: 'paid', paidUntil };
    else if (trialEnds && new Date(trialEnds) > new Date()) status = { plus: true, why: 'trial', trialEnds };
    // Signed in but offline: keep what it was, while that still holds.
    else if (user && !family && previous?.plus && !(previous.trialEnds && new Date(previous.trialEnds) <= new Date())) status = previous;
    else status = { plus: false, why: null, trialOver: Boolean(trialEnds) };
  }
  write(STATUS_KEY, status);
  return status;
}

// Without Plus: one free round a day, on this device.
export function freeRoundLeft() {
  return read(FREE_ROUND_KEY) !== today();
}

export function spendFreeRound() {
  write(FREE_ROUND_KEY, today());
}

// Whole days left in the free trial (1 on its last day).
export function trialDaysLeft(status) {
  if (status?.why !== 'trial' || !status.trialEnds) return 0;
  return Math.max(1, Math.ceil((new Date(status.trialEnds) - Date.now()) / 86400000));
}

// The subscriptions as the App Store sells them here (localized prices).
export async function plusProducts() {
  if (!IS_NATIVE) return [];
  try {
    const { products } = await NativePurchases.getProducts({ productIdentifiers: PLUS_PRODUCTS, productType: PURCHASE_TYPE.SUBS });
    return PLUS_PRODUCTS.map((id) => products.find((p) => p.identifier === id)).filter(Boolean);
  } catch {
    return [];
  }
}

// Buys Plus: tagged with the family account (so it reaches every device
// and PitchPop), then checked with Apple and saved to the account.
export async function buyPlus(productId, user) {
  const purchase = await NativePurchases.purchaseProduct({
    productIdentifier: productId,
    productType: PURCHASE_TYPE.SUBS,
    ...(user ? { appAccountToken: user.id } : {}),
  });
  if (user && purchase?.jwsRepresentation) await verifyPlusPurchase(purchase.jwsRepresentation);
  return refreshPlus(user);
}

export async function restorePlus(user) {
  try {
    await NativePurchases.restorePurchases();
  } catch {
    /* nothing to restore */
  }
  return refreshPlus(user);
}

export function manageSubscription() {
  return NativePurchases.manageSubscriptions().catch(() => {});
}
