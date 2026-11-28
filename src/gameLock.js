import { useEffect, useState } from 'react';

// Game lock (set by the owner in Players & grades, behind the parental
// gate), for each player on this device: 'open' (all games), 'sheets'
// (games unlock once today's 3 Daily Math sheets are done) or 'locked'
// (Daily Math only).
const KEY = 'mathpop-game-lock-v1';
export const LOCK_MODES = [
  ['open', 'Open', 'All games'],
  ['sheets', 'Sheets first', 'Games unlock after today’s 3 sheets'],
  ['locked', 'Sheets only', 'Only Daily Math'],
];
function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}
export const lockFor = (id) => read()[id] || 'open';
export function setLock(id, mode) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...read(), [id]: mode }));
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event('mathpop-lock-changed'));
}
export function useLocks() {
  const [, setN] = useState(0);
  useEffect(() => {
    const f = () => setN((n) => n + 1);
    window.addEventListener('mathpop-lock-changed', f);
    window.addEventListener('mathpop-daily-changed', f);
    return () => {
      window.removeEventListener('mathpop-lock-changed', f);
      window.removeEventListener('mathpop-daily-changed', f);
    };
  }, []);
}
