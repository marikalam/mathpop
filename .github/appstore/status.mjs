// Where MathPop stands on the App Store: each version's state (waiting
// for review, approved, live...) and the newest builds. Run by
// appstore-status.yml; changes nothing.
import { api, BUNDLE_ID } from './asc.mjs';

const app = (await api('GET', `/v1/apps?filter[bundleId]=${BUNDLE_ID}`)).data[0];
console.log(`App: ${app.attributes.name}`);
const versions = (await api('GET', `/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS&limit=6`)).data;
for (const v of versions) console.log(`Version ${v.attributes.versionString}: ${v.attributes.appStoreState}`);
const builds = (await api('GET', `/v1/builds?filter[app]=${app.id}&sort=-uploadedDate&limit=5&include=preReleaseVersion`)).data;
for (const b of builds) console.log(`Build ${b.attributes.version}: ${b.attributes.processingState}, uploaded ${b.attributes.uploadedDate}`);
