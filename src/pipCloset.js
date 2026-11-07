// Pip's Closet: hats, glasses and capes for Pip, bought with ★ that each
// player earns by playing (1 ★ a finished round, 1 more for a "Just for
// me" round from Today's practice). Kept on this device, per player:
// { earned, spent, owned: [item ids], wear: { hat, glasses, cape } }.
// A player who played before the closet existed starts with 1 ★ for each
// round they've already finished.

const KEY = 'mathpop-pip-closet-v1';
const LOG_KEY = 'mathpop-round-log-v1';

// [id, kind, name, price]. Price 0: everyone has it from the start.
export const CLOSET_ITEMS = [
  ['party', 'hat', 'party hat', 0],
  ['bow', 'hat', 'bow', 3],
  ['cap', 'hat', 'baseball cap', 5],
  ['crown', 'hat', 'crown', 8],
  ['bunny', 'hat', 'bunny ears', 11],
  ['wizard', 'hat', 'wizard hat', 15],
  ['round', 'glasses', 'round glasses', 0],
  ['stars', 'glasses', 'star glasses', 4],
  ['sun', 'glasses', 'sunglasses', 7],
  ['hearts', 'glasses', 'heart glasses', 10],
  ['red', 'cape', 'red cape', 5],
  ['purple', 'cape', 'purple cape', 9],
  ['rainbow', 'cape', 'rainbow cape', 14],
  ['gold', 'cape', 'gold cape', 20],
].map(([id, kind, name, price]) => ({ id, kind, name, price }));

export const CLOSET_KINDS = [
  ['hat', 'Hats'],
  ['glasses', 'Glasses'],
  ['cape', 'Capes'],
];

export const itemById = (id) => CLOSET_ITEMS.find((i) => i.id === id);

function readAll() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

function writeAll(all) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event('mathpop-closet-changed'));
}

function roundsPlayedBefore(playerId) {
  try {
    const log = JSON.parse(localStorage.getItem(LOG_KEY)) || {};
    return (log[playerId] || []).length;
  } catch {
    return 0;
  }
}

export function closetFor(playerId) {
  const all = readAll();
  const saved = all[playerId];
  if (saved) return saved;
  return {
    earned: roundsPlayedBefore(playerId),
    spent: 0,
    owned: CLOSET_ITEMS.filter((i) => !i.price).map((i) => i.id),
    wear: {},
  };
}

function save(playerId, closet) {
  writeAll({ ...readAll(), [playerId]: closet });
}

export const starsLeft = (closet) => Math.max(0, closet.earned - closet.spent);

// A finished round: +1 ★, and +1 more for a Today's practice round.
export function earnStars(playerId, n) {
  const c = closetFor(playerId);
  save(playerId, { ...c, earned: c.earned + n });
}

// Puts an owned item on (or takes it off, if it's already on).
export function toggleWear(playerId, id) {
  const c = closetFor(playerId);
  const item = itemById(id);
  if (!item || !c.owned.includes(id)) return c;
  const wear = { ...c.wear, [item.kind]: c.wear[item.kind] === id ? null : id };
  const next = { ...c, wear };
  save(playerId, next);
  return next;
}

// Buys an item (and puts it on), if there are enough ★. Returns the
// closet, or null when there aren't.
export function buyItem(playerId, id) {
  const c = closetFor(playerId);
  const item = itemById(id);
  if (!item || c.owned.includes(id) || starsLeft(c) < item.price) return null;
  const next = { ...c, spent: c.spent + item.price, owned: [...c.owned, id], wear: { ...c.wear, [item.kind]: id } };
  save(playerId, next);
  return next;
}

// The cheapest item not owned yet (what to save up for next).
export function nextItem(closet) {
  return CLOSET_ITEMS.filter((i) => !closet.owned.includes(i.id)).sort((a, b) => a.price - b.price)[0] || null;
}
