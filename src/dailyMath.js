import { rand, pick } from './gameKit.jsx';

// Daily Math: a mastery ladder of small steps (counting → adding →
// taking away → two and three digits → times tables → dividing → bigger
// multiplying and dividing), in levels. Each day a player does 3 sheets of
// 20 at their step. Two great sheets in a row (18 of 20 right the first
// time, inside the goal time) move them up a step; two rough sheets in a
// row move them back one. Kept
// on this device for each player.

const N = (lo, hi) => rand(lo, hi);
const dots = (n) => '●'.repeat(n);
const add = (a, b) => ({ text: `${a} + ${b}`, answer: a + b });
const sub = (a, b) => ({ text: `${a} − ${b}`, answer: a - b });
const mul = (a, b) => ({ text: `${a} × ${b}`, answer: a * b });
const div = (a, b) => ({ text: `${a * b} ÷ ${b}`, answer: a });
function noCarry(lo, hi, lo2, hi2) {
  for (let t = 0; t < 50; t++) {
    const a = N(lo, hi);
    const b = N(lo2, hi2);
    if ((a % 10) + (b % 10) < 10 && (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) < 10) return add(a, b);
  }
  return add(21, 13);
}
function carry(lo, hi, lo2, hi2) {
  for (let t = 0; t < 50; t++) {
    const a = N(lo, hi);
    const b = N(lo2, hi2);
    if ((a % 10) + (b % 10) >= 10) return add(a, b);
  }
  return add(27, 15);
}
function borrow(lo, hi, lo2, hi2, need) {
  for (let t = 0; t < 50; t++) {
    const a = N(lo, hi);
    const b = N(lo2, Math.min(hi2, a - 1));
    if (a > b && (a % 10 < b % 10) === need) return sub(a, b);
  }
  return need ? sub(52, 27) : sub(58, 23);
}

// [name, make(), seconds per question for the goal time, questions a sheet]
export const STEPS = [
  ['Count the dots to 5', () => { const n = N(1, 5); return { text: dots(n), answer: n }; }, 6, 5],
  ['Count the dots to 10', () => { const n = N(4, 10); return { text: dots(n), answer: n }; }, 7, 5],
  ['What comes next? To 10', () => { const n = N(1, 9); return { text: `${n}, ?`, answer: n + 1 }; }, 6, 10],
  ['What comes next? To 30', () => { const n = N(9, 29); return { text: `${n}, ?`, answer: n + 1 }; }, 6, 10],
  ['What comes before? To 20', () => { const n = N(2, 20); return { text: `?, ${n}`, answer: n - 1 }; }, 6, 10],
  ['Adding 1', () => add(N(1, 9), 1), 5, 10],
  ['Adding 2', () => add(N(1, 8), 2), 5, 10],
  ['Adding 3', () => add(N(1, 7), 3), 5, 10],
  ['Adding 1, 2 and 3', () => add(N(1, 9), N(1, 3)), 5, 10],
  ['Adding 4 and 5', () => add(N(1, 5), N(4, 5)), 5, 10],
  ['Making 10', () => { const a = N(1, 9); return { text: `${a} + ? = 10`, answer: 10 - a }; }, 5, 10],
  ['Adding 6 and 7', () => add(N(1, 4), N(6, 7)), 5, 10],
  ['Adding 8 and 9', () => add(N(1, 9), N(8, 9)), 5, 10],
  ['Adding within 20', () => add(N(2, 9), N(2, 9)), 4, 10],
  ['Adding within 20, faster', () => add(N(3, 9), N(3, 9)), 3, 10],
  ['Taking away 1 and 2', () => sub(N(3, 10), N(1, 2)), 5, 10],
  ['Taking away 3, 4 and 5', () => sub(N(6, 10), N(3, 5)), 5, 10],
  ['Taking away from 10', () => sub(10, N(1, 9)), 4, 10],
  ['Taking away within 20', () => { const a = N(11, 18); return sub(a, N(a - 9, 9)); }, 5, 10],
  ['Adding and taking away within 20', () => (Math.random() < 0.5 ? add(N(3, 9), N(3, 9)) : (() => { const a = N(11, 18); return sub(a, N(a - 9, 9)); })()), 4, 10],
  ['Tens and ones', () => { const t = N(1, 9) * 10; return add(t, N(1, 9)); }, 4, 10],
  ['Two digits + one digit', () => noCarry(11, 85, 1, 9), 5, 10],
  ['Two digits + one digit, carrying', () => carry(15, 89, 2, 9), 6, 10],
  ['Two digits + two digits', () => noCarry(11, 76, 11, 23), 6, 10],
  ['Two digits + two digits, carrying', () => carry(15, 79, 15, 29), 8, 10],
  ['Two digits − one digit', () => borrow(12, 99, 1, 9, Math.random() < 0.5), 6, 10],
  ['Two digits − two digits', () => borrow(35, 99, 11, 30, false), 6, 10],
  ['Two digits − two digits, borrowing', () => borrow(31, 98, 12, 29, true), 9, 10],
  ['Three-digit adding', () => carry(120, 699, 110, 299), 10, 10],
  ['Three-digit taking away', () => borrow(300, 999, 110, 299, Math.random() < 0.6), 12, 10],
  ['Times 2 and 10', () => mul(pick([2, 10]), N(1, 10)), 4, 10],
  ['Times 5', () => mul(5, N(1, 10)), 4, 10],
  ['Times 3', () => mul(3, N(1, 10)), 4, 10],
  ['Times 4', () => mul(4, N(1, 10)), 4, 10],
  ['Times 2, 3, 4, 5 and 10', () => mul(pick([2, 3, 4, 5, 10]), N(2, 10)), 4, 10],
  ['Times 6', () => mul(6, N(1, 10)), 4, 10],
  ['Times 7', () => mul(7, N(1, 10)), 4, 10],
  ['Times 8', () => mul(8, N(1, 10)), 4, 10],
  ['Times 9', () => mul(9, N(1, 10)), 4, 10],
  ['All the times tables', () => mul(N(2, 9), N(2, 9)), 3, 10],
  ['Dividing by 2, 5 and 10', () => div(N(1, 10), pick([2, 5, 10])), 4, 10],
  ['Dividing by 3 and 4', () => div(N(1, 10), pick([3, 4])), 5, 10],
  ['Dividing by 6, 7, 8 and 9', () => div(N(2, 10), N(6, 9)), 5, 10],
  ['Times and dividing', () => (Math.random() < 0.5 ? mul(N(2, 9), N(2, 9)) : div(N(2, 9), N(2, 9))), 4, 10],
  ['Two digits × one digit', () => mul(N(12, 49), N(2, 9)), 12, 10],
  ['Three digits × one digit', () => mul(N(102, 499), N(2, 9)), 18, 10],
  ['Missing factors', () => { const a = N(2, 9); const b = N(2, 9); return { text: `? × ${b} = ${a * b}`, answer: a }; }, 5, 10],
  ['Two digits ÷ one digit', () => div(N(11, 24), N(3, 6)), 12, 10],
  ['Two digits × two digits', () => mul(N(12, 49), N(11, 19)), 25, 10],
  ['Three digits ÷ one digit', () => div(N(21, 99), N(3, 9)), 20, 10],
];
// The steps in levels (first step of each), like chapters of a workbook.
// Times tables start only after adding and taking away with bigger numbers
// are mastered.
export const LEVELS = [
  [0, 'Counting'],
  [5, 'Adding'],
  [15, 'Taking away'],
  [20, 'Bigger numbers'],
  [30, 'Times tables'],
  [40, 'Dividing'],
  [44, 'Big multiplying and dividing'],
];
export const levelOf = (step) => {
  let k = 0;
  LEVELS.forEach(([start], i) => {
    if (step >= start) k = i;
  });
  return { n: k + 1, name: LEVELS[k][1], first: LEVELS[k][0], last: (LEVELS[k + 1]?.[0] ?? STEPS.length) - 1 };
};
// Every sheet has 20 questions: 18 at the step, and 2 review questions
// from steps already mastered (from the step before, once past step 5).
export const SHEET_SIZE = 20;
const REVIEW = 2;
export const stepName = (i) => STEPS[Math.min(i, STEPS.length - 1)][0];
// Where each grade starts: a little below their grade, so the first sheets
// feel easy.
const START = { p: 0, k: 5, 1: 13, 2: 20, 3: 30, 4: 35 };
export const SHEETS_A_DAY = 3;

const KEY = 'mathpop-daily-math-v1';
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
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
  window.dispatchEvent(new Event('mathpop-daily-changed'));
}
// { step, passes, rough, day, done, log: [{ day, step, right, of, secs, goal }] }
export function dailyFor(id, grade) {
  const d = readAll()[id];
  const base = d || { step: START[grade] ?? 13, passes: 0, rough: 0, day: '', done: 0, log: [] };
  return { ...base, done: base.day === today() ? base.done : 0 };
}
export function setStep(id, grade, step) {
  const all = readAll();
  all[id] = { ...dailyFor(id, grade), step: Math.max(0, Math.min(STEPS.length - 1, step)), passes: 0, rough: 0 };
  writeAll(all);
}
export function makeSheet(step) {
  const [, make] = STEPS[step];
  const review = step >= 5 ? REVIEW : 0;
  const out = [];
  const fresh = (q) => !(out.length && out[out.length - 1].text === q.text) && out.filter((x) => x.text === q.text).length < 2;
  for (let t = 0; out.length < SHEET_SIZE - review && t < 400; t++) {
    const q = make();
    if (fresh(q)) out.push(q);
  }
  // Review: from steps already mastered that take about as long (so the
  // goal time still fits): earlier steps of this level first, else the
  // last few steps before it. None fit: no review on this sheet.
  const lv = levelOf(step);
  const quick = (x) => STEPS[x][2] <= STEPS[step][2] + 1;
  let pool = [];
  for (let x = lv.first; x < step; x++) if (quick(x)) pool.push(x);
  if (!pool.length) for (let x = Math.max(0, step - 6); x < step; x++) if (quick(x)) pool.push(x);
  for (let r = 0; r < (pool.length ? review : 0); r++) {
    const from = pool[Math.floor(Math.random() * pool.length)];
    for (let t = 0; t < 40; t++) {
      const q = STEPS[from][1]();
      if (!out.some((x) => x.text === q.text)) {
        out.splice(1 + Math.floor(Math.random() * out.length), 0, { ...q, review: true });
        break;
      }
    }
  }
  while (out.length < SHEET_SIZE) out.push(make());
  return out;
}
export const goalSeconds = (step) => STEPS[step][2] * SHEET_SIZE;

// Saves a finished sheet and moves the step. Returns what happened (and
// newLevel when a step up starts a new level): 'up' (mastered: next step), 'great' (one more great sheet to move up),
// 'slow' (right, but over the goal time), 'again' (practice this step
// again) or 'down' (back one step).
export function finishSheet(id, grade, { right, of, secs }) {
  const all = readAll();
  const d = dailyFor(id, grade);
  const goal = goalSeconds(d.step);
  // Great: 90% right the first time (18 of 20), inside the goal time.
  const accurate = right >= Math.ceil(of * 0.9);
  const fast = secs <= goal;
  let { step, passes, rough } = d;
  let result;
  if (accurate && fast) {
    passes += 1;
    rough = 0;
    if (passes >= 2 && step < STEPS.length - 1) {
      step += 1;
      passes = 0;
      result = 'up';
    } else result = 'great';
  } else if (right / of < 0.6) {
    passes = 0;
    rough += 1;
    if (rough >= 2 && step > 0) {
      step -= 1;
      rough = 0;
      result = 'down';
    } else result = 'again';
  } else {
    passes = 0;
    rough = 0;
    result = accurate ? 'slow' : 'again';
  }
  const log = [...d.log, { day: today(), step: d.step, right, of, secs, goal }].slice(-30);
  all[id] = { step, passes, rough, day: today(), done: d.done + 1, log };
  writeAll(all);
  return { result, step, goal, newLevel: result === 'up' && levelOf(step).first === step };
}
export const clock = (s) => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}`;
