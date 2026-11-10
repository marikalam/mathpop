import { GRADES, gradeInfo, gradeOps, gradeTier } from './grades.js';
import { gradeTopics } from './curriculum.js';

// Levels that go up by themselves. Every topic a player practises has a
// level, per grade. Each answer counts: after 8 or more answers at a level
// with 85% or more right (of the last 10), the topic goes up a level; with
// under half right lately it comes down one, so it's never too hard for
// long. Both happen right in the middle of a round, and the round's
// "All done!" page says what went up.
//
// What a level means: the Beast Academy puzzles (sum grids, patterns...)
// are written in three steps (easy, medium, hard) and start at the first.
// Everything else borrows the same topic from the grades around: level 1
// is the grade below (when it has the topic), the next level is the
// player's own grade, then the grade above, and two above.

const KEY = 'mathpop-topic-levels-v1';
const KEEP = 10;
const ORDER = GRADES.map((g) => g.id);
const TIERS = ['easy', 'medium', 'hard'];
const TIERED = new Set(['sumGrid', 'gridSquares', 'shapePattern', 'tensOnes', 'howManyMore', 'kuku', 'kanjiNumbers', 'counters', 'yenShop']);
const CORE = new Set(['add', 'subtract', 'multiply', 'divide']);

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function write(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode */
  }
}

function hasTopic(grade, topic) {
  if (grade === 'p') return false;
  if (CORE.has(topic)) return gradeOps(grade).includes(topic);
  if (topic === 'sentence' || topic === 'clock') return true;
  return gradeTopics(grade).includes(topic);
}

// The steps of a topic at a grade: [{ grade, tier }], easiest first, and
// where a new player starts.
function steps(grade, topic) {
  const g = gradeInfo(grade).id;
  if (TIERED.has(topic)) return { list: TIERS.map((tier) => ({ grade: g, tier })), start: 0 };
  const i = ORDER.indexOf(g);
  const list = [];
  if (i > 0 && hasTopic(ORDER[i - 1], topic)) list.push(ORDER[i - 1]);
  const start = list.length;
  list.push(g);
  for (const up of [ORDER[i + 1], ORDER[i + 2]]) {
    if (up && hasTopic(up, topic)) list.push(up);
    else break;
  }
  return { list: list.map((x) => ({ grade: x, tier: gradeTier(x) })), start };
}

const key = (grade, topic) => `${gradeInfo(grade).id}:${topic}`;

function entry(playerId, grade, topic) {
  const saved = read()[playerId]?.[key(grade, topic)];
  const { list, start } = steps(grade, topic);
  const at = Math.min(list.length - 1, Math.max(0, saved?.at ?? start));
  return { at, results: saved?.results || [], list };
}

// Whether a topic has levels at all (Toddler games and topics with only
// one step don't).
export function hasLevels(grade, topic) {
  return gradeInfo(grade).id !== 'p' && steps(grade, topic).list.length > 1;
}

// The player's level in a topic: { level (1, 2...), of, grade, tier }.
export function topicLevel(playerId, grade, topic) {
  const e = entry(playerId, grade, topic);
  return { level: e.at + 1, of: e.list.length, ...e.list[e.at] };
}

// Counts one answer. Returns 'up' or 'down' when the level just changed.
export function recordLevelAnswer(playerId, grade, topic, correct) {
  if (!playerId || !topic || !hasLevels(grade, topic)) return null;
  const e = entry(playerId, grade, topic);
  const results = [...e.results, correct ? 1 : 0].slice(-KEEP);
  const right = results.reduce((a, b) => a + b, 0);
  let at = e.at;
  let moved = null;
  if (results.length >= 8 && right / results.length >= 0.85 && at < e.list.length - 1) {
    at += 1;
    moved = 'up';
  } else if (results.length >= 6 && results.slice(-8).reduce((a, b) => a + b, 0) / Math.min(8, results.length) < 0.5 && at > 0) {
    at -= 1;
    moved = 'down';
  }
  const all = read();
  all[playerId] = { ...(all[playerId] || {}), [key(grade, topic)]: { at, results: moved ? [] : results } };
  write(all);
  return moved;
}
