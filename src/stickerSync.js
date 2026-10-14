import { mergeCloudStickers } from './cloud.js';
import { playerStickers, replaceSavedStickers } from './stickerStore.js';

// Keeps each player's sticker book the same on every phone signed in to
// the family account. Each phone sends what it has and gets back the
// combined list (the database only ever adds, so phones never overwrite
// each other). Runs on sign-in, whenever a sticker is stuck in, when the
// app comes back to the foreground, and when the internet comes back.
// The sticker book listens for 'mathpop-stickers-synced'.

async function syncPlayer(profileId) {
  const stickers = await mergeCloudStickers(profileId, playerStickers(profileId));
  if (!Array.isArray(stickers)) return false;
  replaceSavedStickers(profileId, stickers);
  return true;
}

async function syncPlayers(profileIds) {
  const results = await Promise.all(profileIds.map(syncPlayer));
  if (results.some(Boolean)) window.dispatchEvent(new Event('mathpop-stickers-synced'));
}

// Starts syncing the given players (the family account's); returns a
// function that stops it (on sign-out).
export function startStickerSync(profileIds) {
  const ids = new Set(profileIds);
  syncPlayers([...ids]);
  const onAdded = (e) => {
    if (ids.has(e.detail)) syncPlayers([e.detail]);
  };
  const onVisible = () => {
    if (document.visibilityState === 'visible') syncPlayers([...ids]);
  };
  const onOnline = () => syncPlayers([...ids]);
  window.addEventListener('mathpop-stickers-added', onAdded);
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('online', onOnline);
  return () => {
    window.removeEventListener('mathpop-stickers-added', onAdded);
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('online', onOnline);
  };
}
