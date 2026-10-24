import { STICKERS } from './stickers.js';

// The forest look's treasure box (look.js), in place of the sticker book:
// every finished round opens the chest at the end of the stepping stones,
// and there's a nature treasure inside - a leaf, a seed, a flower, a
// minibeast, a shell or stone, or now and then a rare one. Finishing a
// set brings that set's animal to the forest map (forestFriends.js).
//
// Treasures are kept in the same per-player list as stickers
// (stickerStore.js), so they sync with the family account the same way:
// { treasure, at, from, index }. `index` (a sticker) is only there so an
// older MathPop on another phone shows it as a sticker rather than
// breaking; this version tells them apart by `treasure`.

export const TREASURE_SETS = [
  {
    id: 'leaves',
    title: 'Leaves',
    animal: { emoji: '🦉', name: 'owl', x: 180, y: 152 },
    items: [
      { id: 'maple', emoji: '🍁', name: 'maple leaf', fact: 'Maple trees make the sweet sap that becomes maple syrup.' },
      { id: 'autumn', emoji: '🍂', name: 'autumn leaf', fact: 'Leaves turn yellow and red in autumn when the green fades away.' },
      { id: 'breeze', emoji: '🍃', name: 'leaf in the breeze', fact: 'A big tree can have more than a hundred thousand leaves.' },
      { id: 'fern', emoji: '🌿', name: 'fern', fact: 'Ferns were growing on Earth even before the dinosaurs.' },
    ],
  },
  {
    id: 'seeds',
    title: 'Seeds & nuts',
    animal: { emoji: '🐭', name: 'field mouse', x: 180, y: 300 },
    items: [
      { id: 'chestnut', emoji: '🌰', name: 'chestnut', fact: 'Squirrels bury nuts and forget some, and they grow into new trees.' },
      { id: 'grass', emoji: '🌾', name: 'grass seeds', fact: 'Bread is made from the seeds of a grass called wheat.' },
      { id: 'sunflower', emoji: '🌻', name: 'sunflower', fact: 'One sunflower can hold more than a thousand seeds.' },
      { id: 'peapod', emoji: '🫛', name: 'pea pod', fact: 'A pea pod is a little case that keeps its seeds safe.' },
    ],
  },
  {
    id: 'flowers',
    title: 'Flowers',
    animal: { emoji: '🐝', name: 'bee', x: 300, y: 16 },
    items: [
      { id: 'blossom', emoji: '🌸', name: 'blossom', fact: 'Blossoms turn into fruit, like cherries and apples.' },
      { id: 'daisy', emoji: '🌼', name: 'daisy', fact: 'Daisies close up at night and open again in the morning.' },
      { id: 'tulip', emoji: '🌷', name: 'tulip', fact: 'Tulips grow from bulbs, a bit like onions.' },
      { id: 'bluebell', emoji: '🪻', name: 'bluebell', fact: 'Bluebells carpet some woods in spring.' },
    ],
  },
  {
    id: 'minibeasts',
    title: 'Minibeasts',
    animal: { emoji: '🐸', name: 'frog', x: 60, y: 16 },
    items: [
      { id: 'ladybug', emoji: '🐞', name: 'ladybug', fact: 'A ladybug has six legs, like every insect.' },
      { id: 'caterpillar', emoji: '🐛', name: 'caterpillar', fact: 'A caterpillar turns into a butterfly or a moth.' },
      { id: 'cricket', emoji: '🦗', name: 'cricket', fact: 'Crickets chirp by rubbing their wings together.' },
      { id: 'snail', emoji: '🐌', name: 'snail', fact: 'A snail carries its house on its back.' },
    ],
  },
  {
    id: 'stones',
    title: 'Shells & stones',
    animal: { emoji: '🦦', name: 'otter', x: 228, y: 436 },
    items: [
      { id: 'shell', emoji: '🐚', name: 'spiral shell', fact: 'A spiral shell keeps growing in a curl as its snail grows.' },
      { id: 'rock', emoji: '🪨', name: 'smooth stone', fact: 'Rivers make stones smooth by rolling them for years and years.' },
      { id: 'crystal', emoji: '💎', name: 'crystal', fact: 'Crystals grow in neat shapes with flat sides.' },
      { id: 'coral', emoji: '🪸', name: 'piece of coral', fact: 'Coral is made by tiny sea animals.' },
    ],
  },
];

export const RARE = [
  { id: 'clover', emoji: '🍀', name: 'four-leaf clover', fact: 'Only about one clover in ten thousand has four leaves!' },
  { id: 'nest', emoji: '🪺', name: 'bird’s nest', fact: 'Birds build nests from twigs, grass, moss and even spider silk.' },
];
const RARE_CHANCE = 0.08;

const ALL = [...TREASURE_SETS.flatMap((set) => set.items.map((item) => ({ ...item, set: set.id }))), ...RARE.map((item) => ({ ...item, set: 'rare' }))];
const BY_ID = new Map(ALL.map((t) => [t.id, t]));

const STICKERS_KEY = 'mathpop-stickers-v1';
const SEEN_KEY = 'mathpop-treasures-seen-v1';
const STAND_IN = Math.max(0, STICKERS.findIndex(([n]) => n === 'Star'));

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
    /* ignore */
  }
}

// "a maple leaf", "an otter".
export function withArticle(name) {
  return `${/^[aeiou]/i.test(name) ? 'an' : 'a'} ${name}`;
}

export function treasureInfo(id) {
  return BY_ID.get(id);
}

// Every treasure a player has found, oldest first: [{ treasure, at, from }].
export function playerTreasures(playerId) {
  return (read(STICKERS_KEY)[playerId] || []).filter((s) => s.treasure && BY_ID.has(s.treasure)).sort((a, b) => (a.at < b.at ? -1 : 1));
}

export function ownedTreasureIds(playerId) {
  return new Set(playerTreasures(playerId).map((s) => s.treasure));
}

// The sets this player has finished.
export function completeSets(playerId) {
  const owned = ownedTreasureIds(playerId);
  return TREASURE_SETS.filter((set) => set.items.every((item) => owned.has(item.id)));
}

// What's in the chest: one they don't have yet (now and then a rare one);
// once they have them all, any of them again.
function pickTreasure(owned) {
  const rareLeft = RARE.filter((t) => !owned.has(t.id));
  if (rareLeft.length && Math.random() < RARE_CHANCE) return rareLeft[Math.floor(Math.random() * rareLeft.length)];
  const commonLeft = ALL.filter((t) => t.set !== 'rare' && !owned.has(t.id));
  const pool = commonLeft.length ? commonLeft : rareLeft.length ? rareLeft : ALL;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Opens the chest: saves the treasure and returns it, with the set it
// finished (if it finished one).
export function findTreasure(playerId, from) {
  const owned = ownedTreasureIds(playerId);
  const before = new Set(completeSets(playerId).map((s) => s.id));
  const treasure = pickTreasure(owned);
  const all = read(STICKERS_KEY);
  const entry = { treasure: treasure.id, index: STAND_IN, at: new Date().toISOString(), from };
  write(STICKERS_KEY, { ...all, [playerId]: [...(all[playerId] || []), entry] });
  window.dispatchEvent(new Event('mathpop-stickers-changed'));
  // stickerSync.js sends it to the family account.
  window.dispatchEvent(new CustomEvent('mathpop-stickers-added', { detail: playerId }));
  const finished = completeSets(playerId).find((s) => !before.has(s.id)) || null;
  return { ...treasure, finished };
}

// Treasures found since the box was last opened (the badge on the button).
export function newTreasures(playerId) {
  return Math.max(0, playerTreasures(playerId).length - (read(SEEN_KEY)[playerId] || 0));
}

export function markTreasuresSeen(playerId) {
  write(SEEN_KEY, { ...read(SEEN_KEY), [playerId]: playerTreasures(playerId).length });
}
