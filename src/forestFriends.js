// The forest look's rewards and friend (look.js). Every finished round
// counts toward the player's forest, and at set numbers of rounds a new
// animal moves in and lives on the home map. Saved per player on this
// device.
import { completeSets } from './treasures.js';

const ROUNDS_KEY = 'mathpop-forest-rounds-v1';

// Who moves in, after how many rounds, and where they live on the map
// (ForestHome.jsx, in its 360 x 450 drawing): on the paths, the bushes
// and the stream.
export const ANIMALS = [
  { emoji: '🐿️', name: 'squirrel', at: 1, x: 30, y: 146 },
  { emoji: '🐇', name: 'rabbit', at: 2, x: 330, y: 144 },
  { emoji: '🦔', name: 'hedgehog', at: 4, x: 120, y: 298 },
  { emoji: '🦊', name: 'fox', at: 6, x: 240, y: 150 },
  { emoji: '🦌', name: 'deer', at: 9, x: 30, y: 294 },
  { emoji: '🐦', name: 'bird', at: 12, x: 122, y: 10 },
  { emoji: '🦋', name: 'butterfly', at: 15, x: 330, y: 296 },
  { emoji: '🐻', name: 'bear', at: 19, x: 240, y: 298 },
  { emoji: '🦡', name: 'badger', at: 24, x: 120, y: 148 },
  { emoji: '🐢', name: 'turtle', at: 30, x: 334, y: 432 },
];

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(ROUNDS_KEY)) || {};
  } catch {
    return {};
  }
}

export function forestRounds(playerId) {
  return readAll()[playerId] || 0;
}

// The animals living in the player's forest: from rounds played, and one
// for each finished treasure set (treasures.js).
export function forestAnimals(playerId) {
  const rounds = forestRounds(playerId);
  return [...ANIMALS.filter((a) => rounds >= a.at), ...completeSets(playerId).map((set) => set.animal)];
}

// Count a finished round; returns the animal that just moved in, if one did.
export function addForestRound(playerId) {
  const all = readAll();
  const rounds = (all[playerId] || 0) + 1;
  all[playerId] = rounds;
  try {
    localStorage.setItem(ROUNDS_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
  return ANIMALS.find((a) => a.at === rounds) || null;
}

// The next one to move in, and how many more rounds until then.
export function nextAnimal(playerId) {
  const rounds = forestRounds(playerId);
  const next = ANIMALS.find((a) => a.at > rounds);
  return next ? { ...next, left: next.at - rounds } : null;
}

// Hazel the hedgehog, the forest friend, says one of these after an answer.
const RIGHT = [
  'Great job, NAME!',
  'You got it, NAME!',
  'Hooray! That was quick as a squirrel!',
  'Brilliant, NAME!',
  'Yes! The whole forest is cheering!',
  'Wow, NAME, you’re a math explorer!',
];
const WRONG = [
  'Almost, NAME! Let’s try again together.',
  'Hmm, not quite. Have another go!',
  'Good try, NAME! Let’s look again.',
  'Oops! Even owls need a second look.',
];

export function friendLine(correct, name) {
  const list = correct ? RIGHT : WRONG;
  const line = list[Math.floor(Math.random() * list.length)];
  return name ? line.replace('NAME', name) : line.replace(', NAME', '').replace('NAME, ', '');
}
