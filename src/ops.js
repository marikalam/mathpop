import { useEffect, useState } from 'react';
import { madMinuteFact } from './MadMinute.jsx';
import { pick, rand } from './gameKit.jsx';

// The games' questions (Pop the Bubbles, Number Snake and the arcade
// games), by grade, how hard (Easy, Medium, Hard) and which operations
// the player picked on the get-ready screen: '+-' (adding and taking away), 'x/' (times and
// dividing) or 'mix'. Saved on this device, per grade.
//   Pre-K, K  small adding and taking away (no choice)
//   1st       adding and taking away within 20, making a ten (no choice)
// (Medium shown; see addSub and mulDiv for Easy and Hard.)
//   2nd       +-: two-digit numbers, no regrouping (34 + 25, 68 − 23)
//             x/: the 2, 3, 4, 5 and 10 times tables, and dividing by them
//   3rd       +-: three-digit and two-digit numbers (346 + 78)
//             x/: times tables to 10 × 10, and dividing
//   4th       +-: four-digit and three-digit numbers (3,482 + 759)
//             x/: tables to 12, and dividing
const KEY = 'mathpop-game-ops-v1';
export const OPS = [
  ['+-', '+ −', 'Add & take away'],
  ['x/', '× ÷', 'Times & divide'],
  ['mix', 'Mix', 'Both'],
];
export const hasOpsChoice = (grade) => ['2', '3', '4'].includes(grade);
const listeners = new Set();
function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}
export function gameOps(grade) {
  return hasOpsChoice(grade) ? readAll()[grade] || 'mix' : '+-';
}
export function setGameOps(grade, ops) {
  const all = { ...readAll(), [grade]: ops };
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* private mode */
  }
  listeners.forEach((f) => f());
}
export function useGameOps(grade) {
  const [, bump] = useState(0);
  useEffect(() => {
    const f = () => bump((n) => n + 1);
    listeners.add(f);
    return () => listeners.delete(f);
  }, []);
  return gameOps(grade);
}

// How hard (also picked on the get-ready screen, every grade but Pre-K):
// 1 easy, 2 medium (the default), 3 hard.
const LEVEL_KEY = 'mathpop-game-level-v1';
export const LEVELS = [
  [1, 'Easy'],
  [2, 'Medium'],
  [3, 'Hard'],
];
export const hasLevelChoice = (grade) => grade !== 'p';
function readLevels() {
  try {
    return JSON.parse(localStorage.getItem(LEVEL_KEY)) || {};
  } catch {
    return {};
  }
}
export function gameLevel(grade) {
  return readLevels()[grade] || 2;
}
export function setGameLevel(grade, lv) {
  try {
    localStorage.setItem(LEVEL_KEY, JSON.stringify({ ...readLevels(), [grade]: lv }));
  } catch {
    /* private mode */
  }
  listeners.forEach((f) => f());
}
export function useGameLevel(grade) {
  const [, bump] = useState(0);
  useEffect(() => {
    const f = () => bump((n) => n + 1);
    listeners.add(f);
    return () => listeners.delete(f);
  }, []);
  return gameLevel(grade);
}

const fmt = (n) => n.toLocaleString('en-US');
// a + b or a − b with a in [aLo, aHi] and b in [bLo, bHi]; regroup:
// true (the ones make a ten / need a ten), false (they don't), null (either).
function sum(aLo, aHi, bLo, bHi, regroup) {
  for (let t = 0; t < 60; t++) {
    const add = Math.random() < 0.5;
    let a = rand(aLo, aHi);
    let b = rand(bLo, Math.min(bHi, add ? bHi : a));
    if (!add && b > a) [a, b] = [b, a];
    const carries = add ? (a % 10) + (b % 10) >= 10 : a % 10 < b % 10;
    if (regroup !== null && carries !== regroup) continue;
    if (!add && a - b <= 0) continue;
    const big = a >= 1000 || b >= 1000;
    const show = (x) => (big ? fmt(x) : String(x));
    return add ? { text: `${show(a)} + ${show(b)}`, answer: a + b } : { text: `${show(a)} − ${show(b)}`, answer: a - b };
  }
  return { text: '10 + 5', answer: 15 };
}
function addSub(grade, lv) {
  const P = {
    k: [
      [1, 4, 1, 4, null],
      [2, 9, 1, 5, null],
      [5, 15, 1, 5, null],
    ],
    1: [
      [2, 9, 1, 9, false],
      [6, 19, 2, 9, null],
      [21, 89, 3, 9, true],
    ],
    2: [
      [11, 49, 2, 9, null],
      [21, 79, 11, 29, false],
      [23, 79, 14, 39, true],
    ],
    3: [
      [24, 89, 15, 59, true],
      [120, 699, 25, 99, null],
      [150, 899, 110, 399, true],
    ],
    4: [
      [150, 899, 110, 599, null],
      [1200, 6999, 150, 999, null],
      [1500, 7999, 1100, 3999, true],
    ],
  }[grade];
  const [aLo, aHi, bLo, bHi, rg] = P[lv - 1];
  return sum(aLo, aHi, bLo, bHi, rg);
}
function mulDiv(grade, lv) {
  const T = {
    2: [[2, 5, 10], [2, 3, 4, 5, 10], [2, 3, 4, 5, 10]],
    3: [[2, 3, 4, 5, 10], [2, 3, 4, 5, 6, 7, 8, 9, 10], [6, 7, 8, 9]],
    4: [[2, 3, 4, 5, 6, 7, 8, 9, 10], [3, 4, 6, 7, 8, 9, 11, 12], [6, 7, 8, 9, 11, 12]],
  }[grade];
  const t = pick(T[lv - 1]);
  const x = rand(2, lv === 1 ? 5 : grade === '4' ? 12 : 10);
  if (grade === '4' && lv === 3 && Math.random() < 0.45) {
    const a = rand(12, 49);
    const b = rand(3, 9);
    return { text: `${a} × ${b}`, answer: a * b };
  }
  // Easy is mostly times; dividing comes in from medium.
  if (Math.random() < (lv === 1 ? 0.8 : 0.55)) return Math.random() < 0.5 ? { text: `${t} × ${x}`, answer: t * x } : { text: `${x} × ${t}`, answer: t * x };
  return { text: `${t * x} ÷ ${t}`, answer: x };
}

// One question for the grade, the chosen operations and how hard: { text, answer }.
export function gameFact(grade) {
  if (grade === 'p') return madMinuteFact(grade);
  const lv = gameLevel(grade);
  if (!hasOpsChoice(grade)) return addSub(grade, lv);
  const ops = gameOps(grade);
  const useMul = ops === 'x/' || (ops === 'mix' && Math.random() < 0.5);
  return useMul ? mulDiv(grade, lv) : addSub(grade, lv);
}
// Wrong answers that look right (off by one, a ten, a regrouping slip).
export function nearMisses(answer, n = 4) {
  const d = answer >= 100 ? [1, -1, 10, -10, 100, -100, 2, 20] : answer >= 20 ? [1, -1, 10, -10, 2, -2, 5] : [1, -1, 2, -2, 3, 10];
  const out = new Set();
  for (const x of d.sort(() => Math.random() - 0.5)) {
    if (answer + x >= 0 && answer + x !== answer) out.add(answer + x);
    if (out.size >= n) break;
  }
  return [...out];
}
