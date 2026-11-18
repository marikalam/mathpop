import { useEffect, useState } from 'react';

// Play time limits (set by a grown-up in Players & grades, behind the
// parental gate): minutes a day for each player. Time counts while the app
// is open and on screen, and starts again each day. A grown-up can add
// extra minutes for today. Kept on this device.
const KEY = 'mathpop-playtime-v1';
export const LIMITS = [0, 10, 15, 20, 30, 45, 60];
// The session timer (a grown-up starts it: play for N minutes, then the app
// shows their message, like "Time for your worksheet!", until a grown-up
// starts another). For this device; counts while the app is on screen.
export const SESSION_MINUTES = [5, 10, 15, 20, 30, 45, 60];
export const SESSION_NOTES = ['Time for your worksheet!', 'Time for a break!', 'Time to read a book!'];

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
// { on, total, used, note, minutes } (on: a timer is running or has run out).
export const session = () => ({ on: false, total: 0, used: 0, note: SESSION_NOTES[0], minutes: 15, ...(read().session || {}) });
export function startSession(minutes, note) {
  const all = read();
  all.session = { on: true, total: minutes * 60, used: 0, note: note || SESSION_NOTES[0], minutes };
  write(all);
}
export function endSession() {
  const all = read();
  all.session = { ...session(), on: false };
  write(all);
}
export const sessionLeft = () => {
  const s = session();
  return s.on ? Math.max(0, s.total - s.used) : Infinity;
};
// Seconds left today (Infinity with no limit).
export function dailyLeft(id) {
  const all = read();
  const lim = (all.limits || {})[id] || 0;
  if (!lim) return Infinity;
  const d = day(all, id);
  return Math.max(0, (lim + d.extra) * 60 - d.sec);
}
// Whichever runs out first: the daily limit or the session timer.
export const secondsLeft = (id) => Math.min(dailyLeft(id), sessionLeft());
export function addMinutes(id, minutes) {
  const all = read();
  const d = day(all, id);
  all.days = { ...(all.days || {}), [id]: { ...d, extra: d.extra + minutes } };
  write(all);
}
function tick(id, sec) {
  const all = read();
  const s = all.session;
  const timing = s && s.on && s.used < s.total;
  if (!(all.limits || {})[id] && !timing) return;
  if ((all.limits || {})[id]) {
    const d = day(all, id);
    all.days = { ...(all.days || {}), [id]: { ...d, sec: d.sec + sec } };
  }
  if (timing) all.session = { ...s, used: Math.min(s.total, s.used + sec) };
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
export const clockText = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
export const minutesText = (sec) => {
  const m = Math.ceil(sec / 60);
  return `${m} ${m === 1 ? 'minute' : 'minutes'}`;
};
