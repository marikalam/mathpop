import { useEffect, useState } from 'react';
import { madMinuteFact } from './MadMinute.jsx';
import { pick, rand } from './gameKit.jsx';

// The games' questions (Pop the Bubbles, Number Snake and the arcade
// games), by grade, and which operations the player picked on the get-
// ready screen: '+-' (adding and taking away), 'x/' (times and
// dividing) or 'mix'. Saved on this device, per grade.
//   Pre-K, K  small adding and taking away (no choice)
//   1st       adding and taking away within 20, making a ten (no choice)
//   2nd       +-: two-digit numbers with regrouping (47 + 28, 82 − 37)
//             x/: the 2, 3, 4, 5 and 10 times tables, and dividing by them
//   3rd       +-: three-digit numbers (346 + 278, 702 − 359)
//             x/: times tables to 10 × 10, and dividing
//   4th       +-: four-digit numbers (3,482 + 1,759)
//             x/: two digits times one (23 × 4), tables to 12, dividing
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

const fmt = (n) => n.toLocaleString('en-US');
function addSub(grade) {
  if (grade === '2') {
    if (Math.random() < 0.5) {
      // Two-digit + two-digit, mostly with regrouping (ones make a ten).
      const a = rand(1, 7) * 10 + rand(3, 9);
      const b = rand(1, 8 - Math.floor(a / 10)) * 10 + rand(10 - (a % 10), 9);
      return { text: `${a} + ${b}`, answer: a + b };
    }
    const a = rand(3, 9) * 10 + rand(0, 6);
    const b = rand(1, Math.floor(a / 10) - 1) * 10 + rand((a % 10) + 1, 9);
    return { text: `${a} − ${b}`, answer: a - b };
  }
  if (grade === '3') {
    if (Math.random() < 0.5) {
      const a = rand(120, 599);
      const b = rand(110, 999 - a);
      return { text: `${a} + ${b}`, answer: a + b };
    }
    const a = rand(300, 999);
    const b = rand(100, a - 50);
    return { text: `${a} − ${b}`, answer: a - b };
  }
  if (Math.random() < 0.5) {
    const a = rand(1200, 5999);
    const b = rand(500, 9999 - a);
    return { text: `${fmt(a)} + ${fmt(b)}`, answer: a + b };
  }
  const a = rand(2000, 9999);
  const b = rand(500, a - 300);
  return { text: `${fmt(a)} − ${fmt(b)}`, answer: a - b };
}
function mulDiv(grade) {
  const tables = grade === '2' ? [2, 3, 4, 5, 10] : grade === '3' ? [2, 3, 4, 5, 6, 7, 8, 9, 10] : [3, 4, 6, 7, 8, 9, 11, 12];
  const t = pick(tables);
  const x = rand(2, grade === '4' ? 12 : 10);
  if (grade === '4' && Math.random() < 0.35) {
    const a = rand(12, 49);
    const b = rand(3, 9);
    return { text: `${a} × ${b}`, answer: a * b };
  }
  if (Math.random() < 0.55) return Math.random() < 0.5 ? { text: `${t} × ${x}`, answer: t * x } : { text: `${x} × ${t}`, answer: t * x };
  return { text: `${t * x} ÷ ${t}`, answer: x };
}

// One question for the grade and the chosen operations: { text, answer }.
export function gameFact(grade) {
  if (!hasOpsChoice(grade)) return madMinuteFact(grade);
  const ops = gameOps(grade);
  const useMul = ops === 'x/' || (ops === 'mix' && Math.random() < 0.5);
  return useMul ? mulDiv(grade) : addSub(grade);
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
