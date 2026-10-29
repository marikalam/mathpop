// Sets up MathPop Plus in App Store Connect: the "MathPop Plus"
// subscription group and its two subscriptions (monthly and yearly), each
// with its name and description, its price in every country (Apple's
// equivalents of the US price) and the screenshot for App Review. No
// App Store free trial: the app gives new families its own 7 days first
// (src/plus.js), so any old one is removed. Safe to run again: it only
// adds what's missing, and keeps the description and review note up to
// date. Run by
// appstore-plus.yml. The App Store's Paid Apps agreement must be active.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { api, BUNDLE_ID } from './asc.mjs';

const GROUP = 'MathPop Plus';
const PLANS = [
  { productId: 'com.marikalam.mathpop.plus.monthly', name: 'MathPop Plus Monthly', period: 'ONE_MONTH', price: '3.99', level: 2 },
  { productId: 'com.marikalam.mathpop.plus.yearly', name: 'MathPop Plus Yearly', period: 'ONE_YEAR', price: '29.99', level: 1 },
];
const DISPLAY = { name: 'MathPop Plus', description: 'Unlimited rounds, full report and assigned practice' };
const REVIEW_NOTE =
  'MathPop Plus unlocks all of MathPop: unlimited rounds (without it, one free round a day after a 7-day free trial that needs no payment ' +
  'details), plus the full progress report and assigning practice. It is only offered to grown-ups, behind a grown-ups check, and does not ' +
  'require an account. Families who used MathPop before Plus started keep it free. A fresh install is a new family, so the purchase can be tested.';

// Every page of a list.
async function all(path) {
  const out = [];
  let next = path;
  while (next) {
    const res = await api('GET', next);
    out.push(...res.data);
    next = res.links?.next ? res.links.next.replace('https://api.appstoreconnect.apple.com', '') : null;
  }
  return out;
}

const app = (await api('GET', `/v1/apps?filter[bundleId]=${BUNDLE_ID}`)).data[0];

let group = (await all(`/v1/apps/${app.id}/subscriptionGroups?limit=50`)).find((g) => g.attributes.referenceName === GROUP);
if (!group) {
  group = (
    await api('POST', '/v1/subscriptionGroups', {
      type: 'subscriptionGroups',
      attributes: { referenceName: GROUP },
      relationships: { app: { data: { type: 'apps', id: app.id } } },
    })
  ).data;
  await api('POST', '/v1/subscriptionGroupLocalizations', {
    type: 'subscriptionGroupLocalizations',
    attributes: { locale: 'en-US', name: GROUP },
    relationships: { subscriptionGroup: { data: { type: 'subscriptionGroups', id: group.id } } },
  });
  console.log('Made the MathPop Plus subscription group');
}

const territories = await all('/v1/territories?limit=200');
const screenshot = readFileSync(new URL('../../appstore/plus-review.png', import.meta.url));

for (const plan of PLANS) {
  let sub = (await all(`/v1/subscriptionGroups/${group.id}/subscriptions?limit=50`)).find((s) => s.attributes.productId === plan.productId);
  if (!sub) {
    sub = (
      await api('POST', '/v1/subscriptions', {
        type: 'subscriptions',
        attributes: {
          name: plan.name,
          productId: plan.productId,
          subscriptionPeriod: plan.period,
          familySharable: true,
          groupLevel: plan.level,
          reviewNote: REVIEW_NOTE,
        },
        relationships: { group: { data: { type: 'subscriptionGroups', id: group.id } } },
      })
    ).data;
    console.log(`Made ${plan.name}`);
  }

  const local = (await all(`/v1/subscriptions/${sub.id}/subscriptionLocalizations?limit=50`)).find((l) => l.attributes.locale === 'en-US');
  if (!local) {
    await api('POST', '/v1/subscriptionLocalizations', {
      type: 'subscriptionLocalizations',
      attributes: { locale: 'en-US', ...DISPLAY },
      relationships: { subscription: { data: { type: 'subscriptions', id: sub.id } } },
    });
    console.log(`${plan.name}: name and description`);
  } else if (local.attributes.description !== DISPLAY.description || local.attributes.name !== DISPLAY.name) {
    await api('PATCH', `/v1/subscriptionLocalizations/${local.id}`, { type: 'subscriptionLocalizations', id: local.id, attributes: DISPLAY });
    console.log(`${plan.name}: description updated`);
  }
  if (sub.attributes.reviewNote !== REVIEW_NOTE) {
    await api('PATCH', `/v1/subscriptions/${sub.id}`, { type: 'subscriptions', id: sub.id, attributes: { reviewNote: REVIEW_NOTE } });
    console.log(`${plan.name}: review note updated`);
  }

  // Prices: the US price, and Apple's matching price in every other country.
  const priced = await all(`/v1/subscriptions/${sub.id}/prices?limit=200&include=territory`);
  if (!priced.length) {
    const usPoints = await all(`/v1/subscriptions/${sub.id}/pricePoints?filter[territory]=USA&limit=200`);
    const us = usPoints.find((p) => p.attributes.customerPrice === plan.price);
    if (!us) throw new Error(`No US price point of $${plan.price}`);
    const others = await all(`/v1/subscriptionPricePoints/${us.id}/equalizations?limit=200&include=territory`);
    let n = 0;
    for (const point of [us, ...others]) {
      const territory = point === us ? 'USA' : point.relationships?.territory?.data?.id;
      if (!territory) continue;
      try {
        await api('POST', '/v1/subscriptionPrices', {
          type: 'subscriptionPrices',
          attributes: { preserveCurrentPrice: false },
          relationships: {
            subscription: { data: { type: 'subscriptions', id: sub.id } },
            subscriptionPricePoint: { data: { type: 'subscriptionPricePoints', id: point.id } },
            territory: { data: { type: 'territories', id: territory } },
          },
        });
        n++;
      } catch (err) {
        // The first refusal in full (Apple says why), then one line each.
        console.log(n === 0 && territory === 'USA' ? `${plan.name}: no price in USA: ${err.message}` : `${plan.name}: no price in ${territory}`);
      }
    }
    console.log(`${plan.name}: priced in ${n} countries ($${plan.price} in the US)`);
  }

  // Sold everywhere, including new App Store countries.
  try {
    await api('POST', '/v1/subscriptionAvailabilities', {
      type: 'subscriptionAvailabilities',
      attributes: { availableInNewTerritories: true },
      relationships: {
        subscription: { data: { type: 'subscriptions', id: sub.id } },
        availableTerritories: { data: territories.map((t) => ({ type: 'territories', id: t.id })) },
      },
    });
    console.log(`${plan.name}: available in ${territories.length} countries`);
  } catch (err) {
    if (!String(err).includes('409')) throw err;
  }

  // No App Store free trial (the app's own 7 days come first): remove any.
  const offers = await all(`/v1/subscriptions/${sub.id}/introductoryOffers?limit=200`);
  let removed = 0;
  for (const offer of offers) {
    try {
      await api('DELETE', `/v1/subscriptionIntroductoryOffers/${offer.id}`);
      removed++;
    } catch (err) {
      if (removed === 0) console.log(`${plan.name}: free trial not removed: ${String(err).split('\n')[0]}`);
    }
  }
  if (offers.length) console.log(`${plan.name}: App Store free trial removed in ${removed} of ${offers.length} countries`);

  // The screenshot App Review sees.
  const has = await api('GET', `/v1/subscriptions/${sub.id}/appStoreReviewScreenshot`).catch(() => ({ data: null }));
  if (!has.data) {
    const shot = (
      await api('POST', '/v1/subscriptionAppStoreReviewScreenshots', {
        type: 'subscriptionAppStoreReviewScreenshots',
        attributes: { fileName: 'plus-review.png', fileSize: screenshot.length },
        relationships: { subscription: { data: { type: 'subscriptions', id: sub.id } } },
      })
    ).data;
    for (const op of shot.attributes.uploadOperations) {
      const headers = Object.fromEntries((op.requestHeaders || []).map((h) => [h.name, h.value]));
      const res = await fetch(op.url, { method: op.method, headers, body: screenshot.subarray(op.offset, op.offset + op.length) });
      if (!res.ok) throw new Error(`Screenshot upload -> ${res.status}`);
    }
    await api('PATCH', `/v1/subscriptionAppStoreReviewScreenshots/${shot.id}`, {
      type: 'subscriptionAppStoreReviewScreenshots',
      id: shot.id,
      attributes: { uploaded: true, sourceFileChecksum: createHash('md5').update(screenshot).digest('hex') },
    });
    console.log(`${plan.name}: review screenshot uploaded`);
  }

  const state = (await api('GET', `/v1/subscriptions/${sub.id}`)).data.attributes.state;
  console.log(`${plan.name}: ${state}`);
}
