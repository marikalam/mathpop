import { loadCloudClosets, saveCloudCloset } from './cloud.js';
import { closetFor, mergeCloudCloset, rememberUnlocks } from './pipCloset.js';

// Keeps Pip's Closet (what Pip wears, what's been tried on) the same on
// every phone signed in to the family account: each change goes up
// straight away, and the account's copy comes down on sign-in, when the
// app comes back to the foreground and when the internet comes back. The
// newest change wins (pipCloset.js mergeCloudCloset).
async function pull(ids) {
  const closets = await loadCloudClosets();
  if (!closets) return;
  for (const id of ids) {
    rememberUnlocks(id);
    const c = closetFor(id);
    const newerHere = closets[id] ? mergeCloudCloset(id, closets[id]) : Boolean(c.at || c.unlocked.length);
    if (newerHere) saveCloudCloset(id, closetFor(id));
  }
}

export function startClosetSync(profileIds) {
  const ids = new Set(profileIds);
  pull([...ids]);
  const onSaved = (e) => {
    if (ids.has(e.detail)) saveCloudCloset(e.detail, closetFor(e.detail));
  };
  const onVisible = () => {
    if (document.visibilityState === 'visible') pull([...ids]);
  };
  const onOnline = () => pull([...ids]);
  window.addEventListener('mathpop-closet-saved', onSaved);
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('online', onOnline);
  return () => {
    window.removeEventListener('mathpop-closet-saved', onSaved);
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('online', onOnline);
  };
}
