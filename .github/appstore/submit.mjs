// Sends a MathPop build to App Store review through the App Store
// Connect API: makes (or reuses) the App Store version, attaches the
// build, sets "What's New" (and the description and promotional text from
// appstore/listing.md) and submits it. Run by appstore.yml.
//
// Env: ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH (the .p8), VERSION (1.1),
// BUILD (a build number, or empty for the newest one of that version),
// WHATS_NEW, RELEASE (AFTER_APPROVAL or MANUAL).
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { api, BUNDLE_ID } from './asc.mjs';

const { VERSION, BUILD, WHATS_NEW, RELEASE, SCREENSHOTS, SUBSCRIPTIONS } = process.env;

const app = (await api('GET', `/v1/apps?filter[bundleId]=${BUNDLE_ID}`)).data[0];
if (!app) throw new Error(`No app with bundle ID ${BUNDLE_ID}`);
console.log(`App: ${app.attributes.name} (${app.id})`);

// The build: the one asked for, or the newest processed one of this version.
const builds = (
  await api(
    'GET',
    `/v1/builds?filter[app]=${app.id}&filter[preReleaseVersion.version]=${VERSION}` +
      (BUILD ? `&filter[version]=${BUILD}` : '') +
      '&filter[processingState]=VALID&sort=-uploadedDate&limit=1',
  )
).data;
const build = builds[0];
if (!build) throw new Error(`No processed build ${BUILD || ''} of version ${VERSION} yet`);
console.log(`Build: ${build.attributes.version}`);
if (build.attributes.usesNonExemptEncryption == null) {
  await api('PATCH', `/v1/builds/${build.id}`, { type: 'builds', id: build.id, attributes: { usesNonExemptEncryption: false } });
}

// The App Store version (made the first time).
let version = (
  await api('GET', `/v1/apps/${app.id}/appStoreVersions?filter[versionString]=${VERSION}&filter[platform]=IOS`)
).data[0];
if (!version) {
  version = (
    await api('POST', '/v1/appStoreVersions', {
      type: 'appStoreVersions',
      attributes: { platform: 'IOS', versionString: VERSION, releaseType: RELEASE },
      relationships: { app: { data: { type: 'apps', id: app.id } } },
    })
  ).data;
  console.log(`Made App Store version ${VERSION}`);
} else {
  const state = version.attributes.appStoreState;
  console.log(`App Store version ${VERSION} is ${state}`);
  if (['PENDING_DEVELOPER_RELEASE', 'PENDING_APPLE_RELEASE', 'PROCESSING_FOR_APP_STORE', 'READY_FOR_SALE'].includes(state)) {
    throw new Error(`Version ${VERSION} is already approved (${state}): make a new version for this build`);
  }
  // Already waiting for (or in) review with an older build: take it back
  // out of review so the newer build can go in instead.
  if (['WAITING_FOR_REVIEW', 'IN_REVIEW'].includes(state)) {
    const waiting = (await api('GET', `/v1/reviewSubmissions?filter[app]=${app.id}&filter[platform]=IOS&limit=20`)).data.filter(
      (sub) => ['WAITING_FOR_REVIEW', 'IN_REVIEW', 'UNRESOLVED_ISSUES'].includes(sub.attributes.state),
    );
    for (const sub of waiting) {
      await api('PATCH', `/v1/reviewSubmissions/${sub.id}`, { type: 'reviewSubmissions', id: sub.id, attributes: { canceled: true } });
      console.log(`Took the waiting submission out of review`);
    }
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 15000));
      const now = (await api('GET', `/v1/appStoreVersions/${version.id}`)).data.attributes.appStoreState;
      if (!['WAITING_FOR_REVIEW', 'IN_REVIEW'].includes(now)) {
        console.log(`Version ${VERSION} is now ${now}`);
        break;
      }
    }
  }
  await api('PATCH', `/v1/appStoreVersions/${version.id}`, {
    type: 'appStoreVersions',
    id: version.id,
    attributes: { releaseType: RELEASE },
  });
}

await api('PATCH', `/v1/appStoreVersions/${version.id}/relationships/build`, { type: 'builds', id: build.id });

// The listing, from appstore/listing.md (English) and listing-ja.md
// (Japanese): the text under each '## ...' heading, up to the next one.
function readListing(file) {
  const text = readFileSync(new URL(`../../appstore/${file}`, import.meta.url), 'utf8') + '\n## end';
  return (title) => {
    const m = text.match(new RegExp(`^## ${title}[^\\n]*\\n([\\s\\S]*?)(?=^## )`, 'm'));
    return m ? m[1].trim() : undefined;
  };
}
const en = readListing('listing.md');
// The Japanese page needs its own links (the same as the English ones).
const JA_URLS = { supportUrl: 'https://marikalam.github.io/', marketingUrl: 'https://marikalam.github.io/apps/mathpop/' };
const ja = readListing('listing-ja.md');
const description = en('Description');
const promotionalText = en('Promotional text');
const keywords = en('Keywords');

const locs = (await api('GET', `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`)).data;
for (const loc of locs) {
  const isJa = loc.attributes.locale === 'ja';
  const text = isJa
    ? { whatsNew: ja("What's New"), description: ja('Description'), promotionalText: ja('Promotional text'), keywords: ja('Keywords'), ...JA_URLS }
    : { whatsNew: WHATS_NEW, description, promotionalText, keywords };
  await api('PATCH', `/v1/appStoreVersionLocalizations/${loc.id}`, {
    type: 'appStoreVersionLocalizations',
    id: loc.id,
    attributes: Object.fromEntries(Object.entries(text).filter(([, v]) => v)),
  });
  console.log(`Listing and What's New set (${loc.attributes.locale})`);
}

// Japanese, the first time: the version's text, plus the name and subtitle.
// Without Japanese screenshots, the App Store shows the English ones.
if (!locs.some((loc) => loc.attributes.locale === 'ja')) {
  await api('POST', '/v1/appStoreVersionLocalizations', {
    type: 'appStoreVersionLocalizations',
    attributes: {
      locale: 'ja',
      whatsNew: ja("What's New"),
      description: ja('Description'),
      promotionalText: ja('Promotional text'),
      keywords: ja('Keywords'),
      ...JA_URLS,
    },
    relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } } },
  });
  console.log('Listing added in Japanese (ja)');
}

// The name and subtitle live on the app's info (the one being edited for
// this version): the English subtitle, and the Japanese name and subtitle.
const infos = (await api('GET', `/v1/apps/${app.id}/appInfos`)).data;
const info = infos.find((i) => !['READY_FOR_DISTRIBUTION', 'READY_FOR_SALE'].includes(i.attributes.appStoreState || i.attributes.state)) || infos[0];
const infoLocs = (await api('GET', `/v1/appInfos/${info.id}/appInfoLocalizations`)).data;
const subtitleEn = en('Subtitle');
for (const loc of infoLocs) {
  const attributes = loc.attributes.locale === 'ja' ? { name: ja('Name'), subtitle: ja('Subtitle') } : { subtitle: subtitleEn };
  try {
    await api('PATCH', `/v1/appInfoLocalizations/${loc.id}`, { type: 'appInfoLocalizations', id: loc.id, attributes });
    console.log(`Name and subtitle set (${loc.attributes.locale})`);
  } catch (err) {
    console.log(`Couldn't set the subtitle (${loc.attributes.locale}): ${String(err).split('\n')[0]}`);
  }
}
if (!infoLocs.some((loc) => loc.attributes.locale === 'ja')) {
  try {
    await api('POST', '/v1/appInfoLocalizations', {
      type: 'appInfoLocalizations',
      attributes: {
        locale: 'ja',
        name: ja('Name'),
        subtitle: ja('Subtitle'),
        privacyPolicyUrl: 'https://marikalam.github.io/apps/mathpop/privacy.html',
      },
      relationships: { appInfo: { data: { type: 'appInfos', id: info.id } } },
    });
    console.log('Name and subtitle added in Japanese (ja)');
  } catch (err) {
    console.log(`Couldn't add the Japanese name: ${String(err).split('\n')[0]}`);
  }
}

// The App Store screenshots, when asked for (SCREENSHOTS=yes): the ones in
// appstore/screenshots replace what's there, for each iPhone size.
if (SCREENSHOTS === 'yes') {
  const DIRS = { APP_IPHONE_67: '6.9-inch', APP_IPHONE_65: '6.5-inch', APP_IPAD_PRO_3GEN_129: '13-inch-ipad' };
  for (const loc of locs) {
    const sets = (await api('GET', `/v1/appStoreVersionLocalizations/${loc.id}/appScreenshotSets?limit=50`)).data;
    // Older screenshots in other iPhone sizes (copied from the last
    // version) go: Apple shrinks the 6.9-inch ones for smaller iPhones.
    for (const set of sets) {
      const type = set.attributes.screenshotDisplayType;
      if (type.startsWith('APP_IPHONE') && !(type in DIRS)) {
        for (const old of (await api('GET', `/v1/appScreenshotSets/${set.id}/appScreenshots?limit=50`)).data) {
          await api('DELETE', `/v1/appScreenshots/${old.id}`);
        }
        console.log(`Old ${type} screenshots removed`);
      }
    }
    for (const [type, dir] of Object.entries(DIRS)) {
      let set = sets.find((x) => x.attributes.screenshotDisplayType === type);
      if (!set) {
        set = (
          await api('POST', '/v1/appScreenshotSets', {
            type: 'appScreenshotSets',
            attributes: { screenshotDisplayType: type },
            relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: loc.id } } },
          })
        ).data;
      }
      for (const old of (await api('GET', `/v1/appScreenshotSets/${set.id}/appScreenshots?limit=50`)).data) {
        await api('DELETE', `/v1/appScreenshots/${old.id}`);
      }
      const folder = new URL(`../../appstore/screenshots/${dir}/`, import.meta.url);
      const files = readdirSync(folder).filter((f) => f.endsWith('.png')).sort();
      for (const file of files) {
        const bytes = readFileSync(new URL(file, folder));
        const shot = (
          await api('POST', '/v1/appScreenshots', {
            type: 'appScreenshots',
            attributes: { fileName: file, fileSize: bytes.length },
            relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: set.id } } },
          })
        ).data;
        for (const op of shot.attributes.uploadOperations) {
          const headers = Object.fromEntries((op.requestHeaders || []).map((h) => [h.name, h.value]));
          const res = await fetch(op.url, { method: op.method, headers, body: bytes.subarray(op.offset, op.offset + op.length) });
          if (!res.ok) throw new Error(`Screenshot upload ${file} -> ${res.status}`);
        }
        await api('PATCH', `/v1/appScreenshots/${shot.id}`, {
          type: 'appScreenshots',
          id: shot.id,
          attributes: { uploaded: true, sourceFileChecksum: createHash('md5').update(bytes).digest('hex') },
        });
      }
      console.log(`Screenshots (${loc.attributes.locale}, ${dir}): ${files.length} uploaded`);
    }
  }
  // Apple checks each upload before the version can be submitted.
  await new Promise((r) => setTimeout(r, 30000));
}

// MathPop Plus's subscriptions, when asked for (SUBSCRIPTIONS=yes): the
// first time, Apple reviews them together with this version.
if (SUBSCRIPTIONS === 'yes') {
  for (const group of (await api('GET', `/v1/apps/${app.id}/subscriptionGroups?limit=50`)).data) {
    for (const sub of (await api('GET', `/v1/subscriptionGroups/${group.id}/subscriptions?limit=50`)).data) {
      if (sub.attributes.state !== 'READY_TO_SUBMIT') {
        console.log(`Subscription ${sub.attributes.productId}: ${sub.attributes.state}`);
        continue;
      }
      await api('POST', '/v1/subscriptionSubmissions', {
        type: 'subscriptionSubmissions',
        relationships: { subscription: { data: { type: 'subscriptions', id: sub.id } } },
      });
      console.log(`Subscription ${sub.attributes.productId} sent for review with this version`);
    }
  }
}

// Submit: reuse a submission that hasn't been sent yet, or start one.
let submission = (
  await api('GET', `/v1/reviewSubmissions?filter[app]=${app.id}&filter[platform]=IOS&filter[state]=READY_FOR_REVIEW`)
).data[0];
if (!submission) {
  submission = (
    await api('POST', '/v1/reviewSubmissions', {
      type: 'reviewSubmissions',
      attributes: { platform: 'IOS' },
      relationships: { app: { data: { type: 'apps', id: app.id } } },
    })
  ).data;
}
try {
  await api('POST', '/v1/reviewSubmissionItems', {
    type: 'reviewSubmissionItems',
    relationships: {
      reviewSubmission: { data: { type: 'reviewSubmissions', id: submission.id } },
      appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } },
    },
  });
} catch (err) {
  // Already in this submission from an earlier try is fine; anything else
  // (something Apple still needs before review) is shown as it is.
  if (!String(err).includes('409')) throw err;
  console.log(`Adding the version to the submission: ${err.message}`);
}
await api('PATCH', `/v1/reviewSubmissions/${submission.id}`, {
  type: 'reviewSubmissions',
  id: submission.id,
  attributes: { submitted: true },
});
console.log(`Submitted version ${VERSION} (build ${build.attributes.version}) for review.`);
