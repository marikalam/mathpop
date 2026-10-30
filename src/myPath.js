import { GRADES } from './grades.js';
import { gradeSections, gradeTopics } from './curriculum.js';

// "Just for me": a round made from this player's own history, not one
// grade's list. Every topic of every grade, from Toddler up, is a step on
// one path (a grade's sections taken in turn: its first topic of each
// section, then the second of each, and so on, so a child moves through
// numbers, adding, shapes and the rest together). The player's grade is
// where they start: steps below it count as known.
//
// A step is mastered after at least 6 answers with 7 of the last 8 right.
// A round works on the first 3 steps not yet mastered, so as each one is
// mastered the next comes in, and after the last of a grade the path goes
// on into the next grade's. A step they're struggling with (under half
// right lately) brings in the same topic a grade down (or the step before
// it) to rebuild it, and steps already mastered come back now and then so
// they stay fresh.

const KEY = 'mathpop-path-v1';
const KEEP = 10;
const ORDER = GRADES.map((g) => g.id);

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
    /* ignore */
  }
}

const nodeId = (grade, topic) => `${grade}:${topic}`;

function gradePath(grade) {
  const sections = gradeSections(grade).map((s) => s.topics.map((t) => t.id));
  const known = new Set(gradeTopics(grade));
  const out = [];
  const seen = new Set();
  for (let i = 0; sections.some((s) => i < s.length); i++) {
    for (const s of sections) {
      const topic = s[i];
      if (topic && known.has(topic) && !seen.has(topic)) {
        seen.add(topic);
        out.push({ grade, topic, id: nodeId(grade, topic) });
      }
    }
  }
  return out;
}

const PATH = ORDER.flatMap(gradePath);

// The last answers on each step (1 right, 0 wrong), newest last.
export function recordPathAnswer(playerId, grade, topic, correct) {
  const all = read();
  const mine = all[playerId] || {};
  const id = nodeId(grade, topic);
  mine[id] = [...(mine[id] || []), correct ? 1 : 0].slice(-KEEP);
  write({ ...all, [playerId]: mine });
}

function stepState(results, fallback) {
  const r = results || [];
  if (r.length >= 6 && r.slice(-8).reduce((a, b) => a + b, 0) >= Math.min(7, r.slice(-8).length - 1)) return 'mastered';
  if (r.length >= 5 && r.slice(-6).reduce((a, b) => a + b, 0) < 3) return 'struggling';
  // No answers here yet: what they did in that grade's own rounds counts.
  if (!r.length && fallback && fallback.total >= 8 && fallback.correct / fallback.total >= 0.85) return 'mastered';
  return r.length ? 'learning' : 'new';
}

// Where the player is: the steps being worked on (`current`), one to
// rebuild if they're struggling (`foundation`), and steps already
// mastered (`review`). `progress` is the player's progress by grade
// (App.jsx), so their history from ordinary rounds counts too.
export function pathStatus(playerId, startGrade, progress = {}) {
  const mine = read()[playerId] || {};
  const start = Math.max(0, ORDER.indexOf(startGrade));
  const state = (n) => {
    const s = stepState(mine[n.id], progress[n.grade]?.byOp?.[n.topic]);
    // Below their grade, a step counts as known unless they've shown otherwise.
    if (ORDER.indexOf(n.grade) < start && (s === 'new' || s === 'learning')) return 'mastered';
    return s;
  };
  const current = PATH.filter((n) => state(n) !== 'mastered').slice(0, 3);
  const struggling = current.find((n) => state(n) === 'struggling');
  let foundation = null;
  if (struggling) {
    const lower = ORDER.slice(0, ORDER.indexOf(struggling.grade)).reverse();
    const down = lower.map((g) => PATH.find((n) => n.grade === g && n.topic === struggling.topic)).find(Boolean);
    foundation = down || PATH[PATH.indexOf(struggling) - 1] || null;
  }
  const review = PATH.filter((n) => mine[n.id]?.length && state(n) === 'mastered');
  const mastered = PATH.filter((n) => ORDER.indexOf(n.grade) >= start && state(n) === 'mastered').length;
  const gradeNow = current[0]?.grade || ORDER[ORDER.length - 1];
  const inGrade = PATH.filter((n) => n.grade === gradeNow);
  return {
    current,
    foundation,
    review,
    mastered,
    grade: gradeNow,
    gradeDone: inGrade.filter((n) => state(n) === 'mastered').length,
    gradeSize: inGrade.length,
  };
}

// The steps for one round of `count` problems: most from the steps being
// worked on (the first one most), one to rebuild if needed, and two from
// what's mastered, mixed up.
export function pathRound(status, count) {
  const { current, foundation, review } = status;
  if (!current.length) return [];
  const picks = [];
  const reviewCount = review.length ? Math.min(2, review.length) : 0;
  const shuffled = [...review].sort(() => Math.random() - 0.5);
  for (let i = 0; i < reviewCount; i++) picks.push(shuffled[i]);
  if (foundation) picks.push(foundation, foundation);
  const pattern = [0, 1, 0, 2, 0, 1, 2, 0, 1, 0];
  for (let i = 0; picks.length < count; i++) picks.push(current[pattern[i % pattern.length] % current.length]);
  return picks.slice(0, count).sort(() => Math.random() - 0.5);
}
