import { TOPIC_ICONS, gradeSections } from './curriculum.js';
import { earnSticker } from './stickerStore.js';

// "Today's practice" on the home page (like PitchPop's): three rounds for
// each player, made from how they've done at their grade:
//   - Fix my mistakes: the very problems they got wrong lately, asked again
//     (each one leaves the list once they get it right),
//   - the topic they get wrong most (once they've tried it a few times),
//   - something new: the next topic in the grade they haven't played yet
//     (or, when they've tried them all, the one played longest ago),
//   - and a Random Mix to keep everything fresh.
// The list is fixed for the day (so it doesn't change under them as they
// play), and each item checks off when a round of it is finished today.
// Finishing all three earns a bonus sticker, once a day.
const LOG_KEY = 'mathpop-round-log-v1';
const PLAN_KEY = 'mathpop-today-plan-v2';
const MISTAKES_KEY = 'mathpop-mistakes-v1';
const KEEP_MISTAKES = 40;
const BONUS_KEY = 'mathpop-today-bonus-v1';
const FIXED_KEY = 'mathpop-mistakes-fixed-v1';
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

// ---------- Mistakes: the problems a player got wrong ----------

// What the child saw, as words (also tells problems apart).
export function problemText(problem) {
  if (problem.type === 'sentence') return problem.text;
  if (problem.type === 'clock') return `the clock at ${problem.correct}`;
  if (problem.type === 'skill') {
    return problem.promptKind === 'compare' ? `${problem.compareLeft} ? ${problem.compareRight}` : problem.prompt;
  }
  return `${problem.a} ${problem.symbol} ${problem.b}`;
}

const mistakeKey = (problem) => `${problemText(problem)}|${problem.correct}`;

export function loadMistakes(playerId, grade) {
  return (read(MISTAKES_KEY)[playerId] || []).filter((m) => m.grade === grade);
}

// Got it wrong (the first try): keep the problem to ask again.
export function recordMistake(playerId, grade, problem) {
  const all = read(MISTAKES_KEY);
  const key = mistakeKey(problem);
  const mine = (all[playerId] || []).filter((m) => m.key !== key);
  const entry = { key, grade, op: problem.op, at: Date.now(), problem };
  write(MISTAKES_KEY, { ...all, [playerId]: [...mine, entry].slice(-KEEP_MISTAKES) });
}

// Got it right (the first try): if it was one of their mistakes, it's fixed.
export function clearMistake(playerId, problem) {
  const all = read(MISTAKES_KEY);
  const key = mistakeKey(problem);
  if (!(all[playerId] || []).some((m) => m.key === key)) return;
  write(MISTAKES_KEY, { ...all, [playerId]: all[playerId].filter((m) => m.key !== key) });
  // Counted for the grown-ups' weekly card (weekSummary).
  const fixed = read(FIXED_KEY);
  const mine = { ...(fixed[playerId] || {}) };
  const today = dayKey();
  mine[today] = (mine[today] || 0) + 1;
  // Only the last few weeks are kept.
  const oldest = dayKey(new Date(Date.now() - 35 * 86400000));
  for (const day of Object.keys(mine)) if (day < oldest) delete mine[day];
  write(FIXED_KEY, { ...fixed, [playerId]: mine });
}

// The problems for a Fix my mistakes round: the newest mistakes first.
export function mistakeRound(playerId, grade, count) {
  return loadMistakes(playerId, grade)
    .slice(-count)
    .reverse()
    .map((m) => m.problem);
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

  const mistakes = loadMistakes(playerId, grade);
  if (mistakes.length) {
    items.push({ id: 'mistakes', mode: 'mistakes', icon: '🔁', title: 'Fix my mistakes', sub: '' });
  }

  const tricky = topics
    .map((t) => ({ t, s: byOp[t.id] }))
    .filter(({ s }) => s && s.total >= MIN_TRIES && s.correct / s.total < GOOD_ENOUGH)
    .sort((a, b) => a.s.correct / a.s.total - b.s.correct / b.s.total)[0];
  if (tricky) {
    const pct = Math.round((100 * tricky.s.correct) / tricky.s.total);
    const missed = [...mistakes].reverse().find((m) => m.op === tricky.t.id);
    items.push({
      id: 'focus',
      mode: tricky.t.id,
      icon: '🎯',
      title: `Work on: ${tricky.t.title}`,
      sub: missed ? `${pct}% right · missed ${problemText(missed.problem)}` : `${pct}% right so far · 1 round of 10`,
    });
  }

  const used = new Set(items.map((i) => i.mode));
  const untried = topics.filter((t) => !used.has(t.id) && !(byOp[t.id]?.total > 0));
  const lastPlayed = (id) => rounds.reduce((last, r, i) => (r.mode === id ? i : last), -1);
  const oldest = topics.filter((t) => !used.has(t.id)).sort((a, b) => lastPlayed(a.id) - lastPlayed(b.id));
  const newOnes = untried.length ? untried : oldest;
  // Three in all, with the Random Mix last.
  const wanted = Math.max(0, 2 - items.length);
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
  const playedSoFar = (read(LOG_KEY)[playerId] || []).some((r) => r.day === today);
  // A new day or grade gets a new list; so does one with mistakes to fix
  // that the list doesn't have yet, as long as nothing on it is done.
  const needsMistakes = plan && !plan.items.some((i) => i.id === 'mistakes') && loadMistakes(playerId, grade).length && !playedSoFar;
  if (!plan || plan.day !== today || plan.grade !== grade || needsMistakes) {
    plan = { day: today, grade, items: makePlan(playerId, grade, byOp) };
    try {
      localStorage.setItem(PLAN_KEY, JSON.stringify({ ...plans, [playerId]: plan }));
    } catch {
      /* ignore */
    }
  }
  const playedToday = new Set((read(LOG_KEY)[playerId] || []).filter((r) => r.day === today).map((r) => r.mode));
  const mistakes = loadMistakes(playerId, grade);
  return plan.items.map((item) => {
    if (item.id !== 'mistakes') return { ...item, done: playedToday.has(item.mode) };
    // How many are still waiting (it changes as they're fixed).
    const left = mistakes.length;
    const example = left ? problemText(mistakes[mistakes.length - 1].problem) : '';
    return {
      ...item,
      done: playedToday.has('mistakes') || !left,
      sub: left ? `${left} to try again · like ${example}` : 'All fixed! 🎉',
    };
  });
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

// ---------- Streak and the week, for the home page and grown-ups ----------

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dayKey(d);
}

// Days in a row with at least one finished round, up to today (or up to
// yesterday, if they haven't played yet today: the streak isn't lost
// until today is over).
export function streakDays(playerId) {
  const days = new Set((read(LOG_KEY)[playerId] || []).map((r) => r.day));
  const start = days.has(daysAgo(0)) ? 0 : 1;
  let n = 0;
  while (days.has(daysAgo(start + n))) n++;
  return n;
}

// The last 7 days for one player: rounds, days played, how many right,
// the games played most, and the mistakes they fixed.
export function weekSummary(playerId) {
  const since = daysAgo(6);
  const rounds = (read(LOG_KEY)[playerId] || []).filter((r) => r.day >= since);
  const fixed = Object.entries(read(FIXED_KEY)[playerId] || {})
    .filter(([day]) => day >= since)
    .reduce((sum, [, n]) => sum + n, 0);
  const games = {};
  for (const r of rounds) games[r.mode] = (games[r.mode] || 0) + 1;
  return {
    rounds: rounds.length,
    days: new Set(rounds.map((r) => r.day)).size,
    correct: rounds.reduce((s, r) => s + r.correct, 0),
    total: rounds.reduce((s, r) => s + r.total, 0),
    topGames: Object.entries(games)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([mode, n]) => ({ mode, rounds: n })),
    fixed,
    streak: streakDays(playerId),
  };
}
