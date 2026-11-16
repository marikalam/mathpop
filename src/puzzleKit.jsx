import { useState } from 'react';
import { pick, rand, shuffle } from './gameKit.jsx';

// Shared by the puzzle games (PuzzleGames.jsx, PlayGames.jsx): each game
// keeps a level for each player at each grade (so a game picks up where it
// left off, and gets a little harder as they go), and writes the same
// value in different ways for the grade (5, 2 + 3, ●●●●●), so matching
// and sorting games are about what a number is worth.

const LEVEL_KEY = 'mathpop-puzzle-levels-v1';
function readLevels() {
  try {
    return JSON.parse(localStorage.getItem(LEVEL_KEY)) || {};
  } catch {
    return {};
  }
}
export function puzzleLevel(playerId, grade, game) {
  return readLevels()[`${playerId}:${grade}:${game}`] || 1;
}
// [level, levelUp()]: levelUp saves the next level and returns it.
export function useLevel(playerId = 'guest', grade, game) {
  const [level, setLevel] = useState(() => puzzleLevel(playerId, grade, game));
  function levelUp() {
    const next = level + 1;
    const all = readLevels();
    all[`${playerId}:${grade}:${game}`] = next;
    try {
      localStorage.setItem(LEVEL_KEY, JSON.stringify(all));
    } catch {
      /* private mode */
    }
    setLevel(next);
    return next;
  }
  return [level, levelUp];
}

// The top line: the level, and the score.
export function PuzzleTop({ level, score, label, children }) {
  return (
    <div className="mm-top pz-top">
      <span className="pz-level">Level {level}</span>
      {children}
      <span className="mm-right">
        {score} {label}
      </span>
    </div>
  );
}

export const VALUE_COLORS = ['#ff6b9a', '#3b8cf0', '#ffb000', '#2fae6b', '#9b6bf2', '#ff8a3d', '#14b8a6', '#e5484d', '#6366f1', '#84cc16'];
export const dots = (n) => '●'.repeat(n);
export const isLittle = (grade) => grade === 'p' || grade === 'k';

// The values a grade works with, and one way to write each.
//   Pre-K  1 to 5: the number or its dots (colored, for the littlest)
//   K      2 to 10: the number, dots, or an add fact
//   1st    6 to 20: the number, an add or a take-away fact
//   2nd    12 to 60: the number, tens and ones, add or take away
//   3rd    times facts: the number, a × b, a division
//   4th    equal fractions: 1/2 = 2/4 = 3/6 = 4/8
const FRACS = [
  [1, 2],
  [1, 3],
  [2, 3],
  [1, 4],
  [3, 4],
  [1, 5],
  [2, 5],
];
export function valueKeys(grade, count) {
  if (grade === '4') return shuffle(FRACS.map(([n, d]) => `${n}/${d}`)).slice(0, count);
  const pool = {
    p: [1, 2, 3, 4, 5],
    k: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    1: Array.from({ length: 15 }, (_, i) => i + 6),
    2: Array.from({ length: 49 }, (_, i) => i + 12),
    3: [12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48],
  }[grade] || [5, 6, 7, 8, 9, 10];
  return shuffle(pool).slice(0, count).map(String);
}
// One way to write a value (k picks among the grade's ways).
export function writeValue(grade, key, k = rand(0, 9)) {
  if (grade === '4') {
    const [n, d] = key.split('/').map(Number);
    const m = (k % 4) + 1;
    return `${n * m}/${d * m}`;
  }
  const v = Number(key);
  const way = k % 4;
  if (grade === 'p') return way % 2 ? dots(v) : String(v);
  if (grade === 'k') {
    if (way === 0) return String(v);
    if (way === 1 && v <= 6) return dots(v);
    const a = rand(1, v - 1);
    return `${a} + ${v - a}`;
  }
  if (grade === '1') {
    if (way === 0) return String(v);
    if (way === 2) {
      const b = rand(1, 9);
      return `${v + b} − ${b}`;
    }
    const a = rand(1, v - 1);
    return `${a} + ${v - a}`;
  }
  if (grade === '2') {
    if (way === 0) return String(v);
    if (way === 1 && v % 10) return `${Math.floor(v / 10) * 10} + ${v % 10}`;
    if (way === 2) {
      const b = rand(2, 19);
      return `${v + b} − ${b}`;
    }
    const a = rand(2, v - 2);
    return `${a} + ${v - a}`;
  }
  // 3rd: times and division.
  if (way === 0) return String(v);
  const fs = [];
  for (let a = 2; a <= 10; a++) if (v % a === 0 && v / a <= 10 && v / a >= 2) fs.push(a);
  if (way === 3 || !fs.length) {
    const d = rand(2, 5);
    return `${v * d} ÷ ${d}`;
  }
  const a = pick(fs);
  return `${a} × ${v / a}`;
}
// n different ways to write a value (repeats only when a grade has fewer).
export function waysOf(grade, key, n) {
  const out = [];
  for (let t = 0; out.length < n && t < 60; t++) {
    const s = writeValue(grade, key, t < 4 ? t : rand(0, 9));
    if (!out.includes(s)) out.push(s);
  }
  while (out.length < n) out.push(out[out.length % Math.max(1, out.length)] || key);
  return shuffle(out);
}
// How to say a written value out loud.
export const sayValue = (s) =>
  s.includes('●') ? `${s.length} dots` : s.replace(/−/g, ' minus ').replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/(\d+)\/(\d+)/g, '$1 out of $2');
// A small text size for long labels.
export const labelSize = (s) => (s.length <= 2 ? 1 : s.length <= 5 ? 0.82 : s.length <= 7 ? 0.7 : 0.6);

// A level from how each player has been doing at a game against Pip
// (Chess, Checkers, Reversi): up one after a win, down one after two
// losses in a row (1 to 6). [level, record(result), history]; result is
// 1 (won), 0 (draw) or -1 (lost). Kept on this device per player.
const SKILL_KEY = 'mathpop-board-skill-v1';
function readSkill() {
  try {
    return JSON.parse(localStorage.getItem(SKILL_KEY)) || {};
  } catch {
    return {};
  }
}
export function useSkill(playerId = 'guest', game) {
  const key = `${playerId}:${game}`;
  const [s, setS] = useState(() => readSkill()[key] || { lv: 1, hist: [] });
  function record(result) {
    const hist = [...s.hist, result].slice(-10);
    let lv = s.lv;
    if (result > 0) lv = Math.min(6, lv + 1);
    else if (result < 0 && hist.length >= 2 && hist[hist.length - 2] < 0) lv = Math.max(1, lv - 1);
    const next = { lv, hist };
    const all = readSkill();
    all[key] = next;
    try {
      localStorage.setItem(SKILL_KEY, JSON.stringify(all));
    } catch {
      /* private mode */
    }
    setS(next);
    return next;
  }
  return [s.lv, record, s.hist];
}
