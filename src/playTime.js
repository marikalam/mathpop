import { useEffect, useState } from 'react';

// Play time limits (set by a grown-up in Players & grades, behind the
// parental gate): minutes a day for each player. Time counts while the app
// is open and on screen, and starts again each day. A grown-up can add
// extra minutes for today. Kept on this device.
const KEY = 'mathpop-playtime-v1';
export const LIMITS = [0, 10, 15, 20, 30, 45, 60];

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}
function write(all) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* private mode */
  }
  listeners.forEach((f) => f());
}
const listeners = new Set();

function day(all, id) {
  const d = (all.days || {})[id];
  return d && d.day === today() ? d : { day: today(), sec: 0, extra: 0 };
}
export const limitFor = (id) => (read().limits || {})[id] || 0;
export function setLimit(id, minutes) {
  const all = read();
  all.limits = { ...(all.limits || {}), [id]: minutes };
  write(all);
}
export const usedSeconds = (id) => day(read(), id).sec;
// Seconds left today (Infinity with no limit).
export function secondsLeft(id) {
  const all = read();
  const lim = (all.limits || {})[id] || 0;
  if (!lim) return Infinity;
  const d = day(all, id);
  return Math.max(0, (lim + d.extra) * 60 - d.sec);
}
export function addMinutes(id, minutes) {
  const all = read();
  const d = day(all, id);
  all.days = { ...(all.days || {}), [id]: { ...d, extra: d.extra + minutes } };
  write(all);
}
function tick(id, sec) {
  const all = read();
  if (!(all.limits || {})[id]) return;
  const d = day(all, id);
  all.days = { ...(all.days || {}), [id]: { ...d, sec: d.sec + sec } };
  write(all);
}

// Counts the player's time while the app is visible; gives seconds left.
export function usePlayClock(id) {
  const [, setN] = useState(0);
  useEffect(() => {
    const f = () => setN((n) => n + 1);
    listeners.add(f);
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') tick(id, 1);
    }, 1000);
    return () => {
      listeners.delete(f);
      clearInterval(t);
    };
  }, [id]);
  return secondsLeft(id);
}
// Re-renders when any limit or time changes (for the settings card).
export function usePlayTimes() {
  const [, setN] = useState(0);
  useEffect(() => {
    const f = () => setN((n) => n + 1);
    listeners.add(f);
    return () => listeners.delete(f);
  }, []);
}
export const minutesText = (sec) => {
  const m = Math.ceil(sec / 60);
  return `${m} ${m === 1 ? 'minute' : 'minutes'}`;
};
