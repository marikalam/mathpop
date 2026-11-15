import { useEffect, useState } from 'react';

// Singapore Math Mode: the grown-up settings for how games teach.
//   think   'auto' | 'wait' | 'slow' | 'normal'
//           wait: action games stop at each new question until the kid
//           taps I'm ready, and timed games have no clock (they count
//           answers, and end with I'm done). slow: half-speed action
//           games and longer clocks. auto: wait for Pre-K to 1st,
//           normal from 2nd.
//   tenFrames, bonds, bars, disks: which pictures the hints and games show
//   hintAfterMiss: the think card (with its hints) comes back after a miss
// Kept on this device.
const KEY = 'mathpop-sgmode-v1';
export const SG_DEFAULTS = { think: 'auto', tenFrames: true, bonds: true, bars: true, disks: true, hintAfterMiss: true };

let current = read();
const listeners = new Set();
function read() {
  try {
    return { ...SG_DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY)) || {}) };
  } catch {
    return { ...SG_DEFAULTS };
  }
}
export const sgSettings = () => current;
export function setSgSettings(changes) {
  current = { ...current, ...changes };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* private mode */
  }
  listeners.forEach((f) => f(current));
}
export function useSgSettings() {
  const [s, setS] = useState(current);
  useEffect(() => {
    listeners.add(setS);
    return () => listeners.delete(setS);
  }, []);
  return s;
}

// The grade being played (set by the game screens), for 'auto'.
let playGrade = '2';
export const setPlayGrade = (g) => {
  playGrade = g || playGrade;
};
// The think time in effect: 'wait' | 'slow' | 'normal'.
export function thinkMode(grade = playGrade) {
  const t = current.think;
  if (t !== 'auto') return t;
  return ['p', 'k', '1'].includes(grade) ? 'wait' : 'normal';
}
// How fast action games run (1 = normal).
export const speedFactor = (grade) => (thinkMode(grade) === 'slow' ? 0.6 : 1);
// How long a timed game's clock is, in seconds (0 = no clock).
export function clockSeconds(seconds, grade) {
  const m = thinkMode(grade);
  if (m === 'wait') return 0;
  return m === 'slow' ? Math.round(seconds * 1.5) : seconds;
}
// "I'm done" for a timed game with no clock.
export const FINISH_EVENT = 'mathpop-finish-round';
export const finishRound = () => window.dispatchEvent(new Event(FINISH_EVENT));
