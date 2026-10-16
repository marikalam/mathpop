import { TOPIC_ICONS, gradeSections } from './curriculum.js';
import { earnSticker } from './stickerStore.js';

// "Today's practice" on the home page (like PitchPop's): three rounds for
// each player, made from how they've done at their grade:
//   - the topic they get wrong most (once they've tried it a few times),
//   - something new: the next topic in the grade they haven't played yet
//     (or, when they've tried them all, the one played longest ago),
//   - and a Random Mix to keep everything fresh.
// The list is fixed for the day (so it doesn't change under them as they
// play), and each item checks off when a round of it is finished today.
// Finishing all three earns a bonus sticker, once a day.
const LOG_KEY = 'mathpop-round-log-v1';
const PLAN_KEY = 'mathpop-today-plan-v1';
const BONUS_KEY = 'mathpop-today-bonus-v1';
const KEEP_ROUNDS = 200;
// A topic counts as tricky once tried this many times with fewer right.
const MIN_TRIES = 5;
const GOOD_ENOUGH = 0.85;

export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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
  window.dispatchEvent(new Event('mathpop-today-changed'));
}

// A finished round: the game played (a topic id, or 'random'), the grade
// and the score.
export function recordRound(playerId, mode, grade, correct, total) {
  const all = read(LOG_KEY);
  const entry = { day: dayKey(), mode, grade, correct, total };
  write(LOG_KEY, { ...all, [playerId]: [...(all[playerId] || []), entry].slice(-KEEP_ROUNDS) });
}

function gradeTopicList(grade) {
  const seen = new Set();
  const list = [];
  gradeSections(grade).forEach((section) =>
    section.topics.forEach((t) => {
      if (seen.has(t.id)) return;
      seen.add(t.id);
      list.push({ ...t, icon: TOPIC_ICONS[t.id] || section.icon });
    }),
  );
  return list;
}

function makePlan(playerId, grade, byOp) {
  const topics = gradeTopicList(grade);
  const rounds = (read(LOG_KEY)[playerId] || []).filter((r) => r.grade === grade);
  const items = [];

  const tricky = topics
    .map((t) => ({ t, s: byOp[t.id] }))
    .filter(({ s }) => s && s.total >= MIN_TRIES && s.correct / s.total < GOOD_ENOUGH)
    .sort((a, b) => a.s.correct / a.s.total - b.s.correct / b.s.total)[0];
  if (tricky) {
    const pct = Math.round((100 * tricky.s.correct) / tricky.s.total);
    items.push({ id: 'focus', mode: tricky.t.id, icon: '🎯', title: `Work on: ${tricky.t.title}`, sub: `${pct}% right so far · 1 round of 10` });
  }

  const used = new Set(items.map((i) => i.mode));
  const untried = topics.filter((t) => !used.has(t.id) && !(byOp[t.id]?.total > 0));
  const lastPlayed = (id) => rounds.reduce((last, r, i) => (r.mode === id ? i : last), -1);
  const oldest = topics.filter((t) => !used.has(t.id)).sort((a, b) => lastPlayed(a.id) - lastPlayed(b.id));
  const newOnes = untried.length ? untried : oldest;
  const wanted = items.length ? 1 : 2;
  newOnes.slice(0, wanted).forEach((t, i) => {
    items.push({
      id: `next${i}`,
      mode: t.id,
      icon: t.icon,
      title: untried.length ? `Something new: ${t.title}` : `Review: ${t.title}`,
      sub: `${t.sub} · 1 round of 10`,
    });
  });

  items.push({ id: 'mix', mode: 'random', icon: '🎲', title: 'Random Mix', sub: 'A bit of everything · 1 round of 10' });
  return items;
}

// Today's list for a player at a grade: [{ id, mode, icon, title, sub, done }].
export function todayPlan(playerId, grade, byOp = {}) {
  const today = dayKey();
  const plans = read(PLAN_KEY);
  let plan = plans[playerId];
  if (!plan || plan.day !== today || plan.grade !== grade) {
    plan = { day: today, grade, items: makePlan(playerId, grade, byOp) };
    try {
      localStorage.setItem(PLAN_KEY, JSON.stringify({ ...plans, [playerId]: plan }));
    } catch {
      /* ignore */
    }
  }
  const playedToday = new Set((read(LOG_KEY)[playerId] || []).filter((r) => r.day === today).map((r) => r.mode));
  return plan.items.map((item) => ({ ...item, done: playedToday.has(item.mode) }));
}

// The day's bonus sticker, once, when the whole list is done.
export function giveBonusIfDone(playerId, items) {
  if (!items.length || !items.every((i) => i.done)) return false;
  const given = read(BONUS_KEY);
  if (given[playerId] === dayKey()) return false;
  write(BONUS_KEY, { ...given, [playerId]: dayKey() });
  earnSticker(playerId);
  return true;
}

export function bonusGivenToday(playerId) {
  return read(BONUS_KEY)[playerId] === dayKey();
}
