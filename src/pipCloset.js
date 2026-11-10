import { pendingStickers, playerStickers } from './stickerStore.js';

// Pip's Closet: hats, glasses and capes for Pip that unlock with the stars a
// player earns (a star for every finished round). Nothing is
// spent: stickers stay in the book, and each item unlocks for good once
// the player has that many stickers. Kept on this device, per player:
// { seen: [item ids already tried on], wear: { hat, glasses, cape } }.

const KEY = 'mathpop-pip-closet-v2';

// [id, kind, name, stars needed, Japanese name]. 0: everyone has it from the start.
export const CLOSET_ITEMS = [
  ['party', 'hat', 'party hat', 0, 'パーティーぼうし'],
  ['round', 'glasses', 'round glasses', 0, 'まるメガネ'],
  ['bow', 'hat', 'bow', 2, 'リボン'],
  ['stars', 'glasses', 'star glasses', 3, 'ほしの メガネ'],
  ['cap', 'hat', 'baseball cap', 4, 'やきゅうぼう'],
  ['red', 'cape', 'red cape', 5, 'あかい マント'],
  ['crown', 'hat', 'crown', 7, 'おうかん'],
  ['sun', 'glasses', 'sunglasses', 9, 'サングラス'],
  ['bunny', 'hat', 'bunny ears', 11, 'うさみみ'],
  ['purple', 'cape', 'purple cape', 13, 'むらさきの マント'],
  ['hearts', 'glasses', 'heart glasses', 15, 'ハートの メガネ'],
  ['wizard', 'hat', 'wizard hat', 18, 'まほうつかいの ぼうし'],
  ['rainbow', 'cape', 'rainbow cape', 21, 'にじいろの マント'],
  ['gold', 'cape', 'gold cape', 25, 'きんいろの マント'],
].map(([id, kind, name, need, ja]) => ({ id, kind, name, need, ja }));

// [kind, English tab, Japanese tab]
export const CLOSET_KINDS = [
  ['hat', 'Hats', 'ぼうし'],
  ['glasses', 'Glasses', 'メガネ'],
  ['cape', 'Capes', 'マント'],
];

export const itemById = (id) => CLOSET_ITEMS.find((i) => i.id === id);
export const anItem = (name) => `${/^[aeiou]/.test(name) ? 'an' : 'a'} ${name}`;

// Every sticker the player has earned: in the book, or waiting to be stuck.
export function stickerCount(playerId) {
  // Stars: one for every finished round (kept as the sticker records).
  return playerStickers(playerId).length + pendingStickers(playerId);
}

// Unlocked items are remembered for good (`unlocked`, synced with the
// family account), so an outfit never locks again: not on a phone where
// fewer stickers have come in yet, nor after the app is reinstalled.
const OLD_KEY = 'mathpop-pip-closet-v1';

function readAll() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

function writeOne(playerId, closet) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [playerId]: closet }));
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event('mathpop-closet-changed'));
}

// A change made here: stamped with the time (the newest outfit wins when
// phones sync, closetSync.js) and sent to the family account.
function save(playerId, closet) {
  const stamped = { ...closet, at: new Date().toISOString() };
  writeOne(playerId, stamped);
  window.dispatchEvent(new CustomEvent('mathpop-closet-saved', { detail: playerId }));
}

const union = (a = [], b = []) => [...new Set([...a, ...b])];

// The first closet (bought with stars) carried over: everything bought
// stays unlocked, and Pip keeps wearing it.
function fromOldCloset(playerId) {
  try {
    const old = (JSON.parse(localStorage.getItem(OLD_KEY)) || {})[playerId];
    if (!old || !Array.isArray(old.owned)) return null;
    const owned = old.owned.filter((id) => itemById(id));
    return { seen: owned, unlocked: owned, wear: old.wear || {}, at: new Date().toISOString() };
  } catch {
    return null;
  }
}

const FREE = CLOSET_ITEMS.filter((i) => !i.need).map((i) => i.id);

export function closetFor(playerId) {
  const saved = readAll()[playerId];
  if (saved) return { unlocked: [], ...saved };
  const old = fromOldCloset(playerId);
  if (old) {
    writeOne(playerId, old);
    window.dispatchEvent(new CustomEvent('mathpop-closet-saved', { detail: playerId }));
    return old;
  }
  return { seen: FREE, unlocked: [], wear: {} };
}

// Everything this player can wear: unlocked by their stickers now, or
// unlocked before (on any phone).
export function unlockedSet(playerId) {
  const n = stickerCount(playerId);
  return new Set([...CLOSET_ITEMS.filter((i) => n >= i.need).map((i) => i.id), ...(closetFor(playerId).unlocked || [])]);
}

// Saves (and syncs) what the stickers have unlocked, so it stays unlocked.
export function rememberUnlocks(playerId) {
  const c = closetFor(playerId);
  const open = [...unlockedSet(playerId)].filter((id) => itemById(id).need > 0);
  if (open.every((id) => c.unlocked.includes(id))) return;
  save(playerId, { ...c, unlocked: union(c.unlocked, open) });
}

// Takes in a player's closet from the family account. What's unlocked
// and what's been tried on are kept from both; the outfit is the newest
// one. Returns true when the account needs this phone's copy.
export function mergeCloudCloset(playerId, remote) {
  if (!remote || typeof remote !== 'object') return false;
  const local = closetFor(playerId);
  const seen = union(local.seen, remote.seen);
  const unlocked = union(local.unlocked, remote.unlocked);
  const localNewer = Boolean(local.at && (!remote.at || local.at > remote.at));
  const wear = localNewer ? local.wear : remote.wear || local.wear || {};
  const at = localNewer ? local.at : remote.at || local.at;
  writeOne(playerId, { seen, unlocked, wear, at });
  const accountMissing = unlocked.length > (remote.unlocked || []).length || seen.length > (remote.seen || []).length;
  return localNewer || accountMissing;
}

// Puts an unlocked item on (or takes it off, if it's already on). The
// first time, it's new: returns { closet, isNew }.
export function tryOn(playerId, id) {
  const c = closetFor(playerId);
  const item = itemById(id);
  if (!item || !unlockedSet(playerId).has(id)) return { closet: c, isNew: false };
  const isNew = !c.seen.includes(id);
  const wear = { ...c.wear, [item.kind]: c.wear[item.kind] === id && !isNew ? null : id };
  const next = { ...c, wear, seen: isNew ? [...c.seen, id] : c.seen, unlocked: union(c.unlocked, item.need ? [id] : []) };
  save(playerId, next);
  return { closet: next, isNew };
}

// Unlocked but not tried on yet (the home page's "New for Pip!" card).
export function newItems(playerId) {
  const c = closetFor(playerId);
  const open = unlockedSet(playerId);
  return CLOSET_ITEMS.filter((i) => open.has(i.id) && !c.seen.includes(i.id));
}

// The next item to unlock (what the stickers are going towards).
export function nextItem(playerId) {
  const open = unlockedSet(playerId);
  return CLOSET_ITEMS.find((i) => !open.has(i.id)) || null;
}
