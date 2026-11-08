import { pendingStickers, playerStickers } from './stickerStore.js';

// Pip's Closet: hats, glasses and capes for Pip that unlock as a player's
// sticker book fills up (a sticker for every finished round). Nothing is
// spent: stickers stay in the book, and each item unlocks for good once
// the player has that many stickers. Kept on this device, per player:
// { seen: [item ids already tried on], wear: { hat, glasses, cape } }.

const KEY = 'mathpop-pip-closet-v2';

// [id, kind, name, stickers needed]. 0: everyone has it from the start.
export const CLOSET_ITEMS = [
  ['party', 'hat', 'party hat', 0],
  ['round', 'glasses', 'round glasses', 0],
  ['bow', 'hat', 'bow', 2],
  ['stars', 'glasses', 'star glasses', 3],
  ['cap', 'hat', 'baseball cap', 4],
  ['red', 'cape', 'red cape', 5],
  ['crown', 'hat', 'crown', 7],
  ['sun', 'glasses', 'sunglasses', 9],
  ['bunny', 'hat', 'bunny ears', 11],
  ['purple', 'cape', 'purple cape', 13],
  ['hearts', 'glasses', 'heart glasses', 15],
  ['wizard', 'hat', 'wizard hat', 18],
  ['rainbow', 'cape', 'rainbow cape', 21],
  ['gold', 'cape', 'gold cape', 25],
].map(([id, kind, name, need]) => ({ id, kind, name, need }));

export const CLOSET_KINDS = [
  ['hat', 'Hats'],
  ['glasses', 'Glasses'],
  ['cape', 'Capes'],
];

export const itemById = (id) => CLOSET_ITEMS.find((i) => i.id === id);
export const anItem = (name) => `${/^[aeiou]/.test(name) ? 'an' : 'a'} ${name}`;

// Every sticker the player has earned: in the book, or waiting to be stuck.
export function stickerCount(playerId) {
  return playerStickers(playerId).length + pendingStickers(playerId);
}

export const isUnlocked = (item, count) => count >= item.need;

function readAll() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

function save(playerId, closet) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [playerId]: closet }));
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event('mathpop-closet-changed'));
}

export function closetFor(playerId) {
  return readAll()[playerId] || { seen: CLOSET_ITEMS.filter((i) => !i.need).map((i) => i.id), wear: {} };
}

// Puts an unlocked item on (or takes it off, if it's already on). The
// first time, it's new: returns { closet, isNew }.
export function tryOn(playerId, id) {
  const c = closetFor(playerId);
  const item = itemById(id);
  if (!item || !isUnlocked(item, stickerCount(playerId))) return { closet: c, isNew: false };
  const isNew = !c.seen.includes(id);
  const wear = { ...c.wear, [item.kind]: c.wear[item.kind] === id && !isNew ? null : id };
  const next = { ...c, wear, seen: isNew ? [...c.seen, id] : c.seen };
  save(playerId, next);
  return { closet: next, isNew };
}

// Unlocked but not tried on yet (the home page's "New for Pip!" card).
export function newItems(playerId) {
  const c = closetFor(playerId);
  const n = stickerCount(playerId);
  return CLOSET_ITEMS.filter((i) => isUnlocked(i, n) && !c.seen.includes(i.id));
}

// The next item to unlock (what the stickers are going towards).
export function nextItem(playerId) {
  const n = stickerCount(playerId);
  return CLOSET_ITEMS.find((i) => !isUnlocked(i, n)) || null;
}
