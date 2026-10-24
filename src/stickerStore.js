import { BOOK_SIZE, STICKERS } from './stickers.js';

// Each player's sticker book (the same as PitchPop's): a sticker for every
// finished round of ten problems, no limit. The player picks which one;
// each sticker appears once per page of BOOK_SIZE, then a new page starts.
// Only signed-in families keep stickers (the book syncs with the family
// account, stickerSync.js); a guest still gets to pick one each round.
//
// Saved per player: [{ index, at, from }] (`from` is the game played;
// `at` is when it was stuck in, and tells stickers apart when phones sync).
// Stickers earned but not yet picked wait in PENDING_KEY (this phone only).
const STICKERS_KEY = 'mathpop-stickers-v1';
const PENDING_KEY = 'mathpop-sticker-pending-v1';

function read(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: nothing more to do.
  }
}

const byTime = (a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0);

// Every sticker in a player's book, oldest first (not the forest look's
// treasures, which share the list: treasures.js).
export function playerStickers(playerId) {
  return savedEntries(playerId).filter((s) => !s.treasure);
}

// Everything saved in the list, stickers and treasures, for syncing.
export function savedEntries(playerId) {
  return [...(read(STICKERS_KEY)[playerId] || [])].sort(byTime);
}

// The page a sticker is being added to (`adding`) or the last page with
// stickers: the stickers on it and the ones still free to pick.
export function bookPage(stickers, adding = false) {
  const n = stickers.length;
  const page = adding ? Math.floor(n / BOOK_SIZE) : Math.max(0, Math.floor((n - 1) / BOOK_SIZE));
  const onPage = stickers.slice(page * BOOK_SIZE, (page + 1) * BOOK_SIZE);
  const used = new Set(onPage.map((s) => s.index));
  return { page, onPage, total: n, free: STICKERS.map((_, i) => i).filter((i) => !used.has(i)) };
}

export function pendingStickers(playerId) {
  return read(PENDING_KEY)[playerId] || 0;
}

// A finished round: one more sticker waiting to be picked.
export function earnSticker(playerId) {
  const pending = read(PENDING_KEY);
  write(PENDING_KEY, { ...pending, [playerId]: (pending[playerId] || 0) + 1 });
  window.dispatchEvent(new Event('mathpop-stickers-changed'));
}

// Sticks the picked sticker in the book (using up one that was waiting).
export function addSticker(playerId, index, from) {
  const all = read(STICKERS_KEY);
  write(STICKERS_KEY, { ...all, [playerId]: [...(all[playerId] || []), { index, at: new Date().toISOString(), from }] });
  const pending = read(PENDING_KEY);
  write(PENDING_KEY, { ...pending, [playerId]: Math.max(0, (pending[playerId] || 0) - 1) });
  window.dispatchEvent(new Event('mathpop-stickers-changed'));
  // stickerSync.js sends it to the family account.
  window.dispatchEvent(new CustomEvent('mathpop-stickers-added', { detail: playerId }));
}

// Takes in the synced list from the family account (keeping any sticker
// stuck in here while it was on its way).
export function replaceSavedStickers(playerId, list) {
  const all = read(STICKERS_KEY);
  const merged = [...new Map([...(all[playerId] || []), ...list].map((s) => [s.at, s])).values()].sort(byTime);
  write(STICKERS_KEY, { ...all, [playerId]: merged });
  window.dispatchEvent(new Event('mathpop-stickers-changed'));
}
