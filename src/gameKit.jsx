import { useEffect, useState } from 'react';
import { FINISH_EVENT, clockSeconds, finishRound, thinkMode } from './sgMode.js';

// Shared pieces for the games (Games.jsx, GamesSG.jsx).
export const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = (list) => list[Math.floor(Math.random() * list.length)];
export const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// The timer for the timed games: seconds left, and done at 0. Think time
// (sgMode.js): "Wait for me" has no clock (it ends with I'm done), "Slow"
// has a longer one.
export function useCountdown(seconds, running) {
  const [eff] = useState(() => clockSeconds(seconds));
  const [left, setLeft] = useState(eff || seconds);
  useEffect(() => {
    const done = () => setLeft(0);
    window.addEventListener(FINISH_EVENT, done);
    return () => window.removeEventListener(FINISH_EVENT, done);
  }, []);
  useEffect(() => {
    if (!running || !eff) return undefined;
    const end = Date.now() + eff * 1000;
    const id = setInterval(() => {
      const s = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) clearInterval(id);
    }, 200);
    return () => clearInterval(id);
  }, [running, eff]);
  return left;
}

export function TimerBar({ left, seconds, score, label }) {
  const [noClock] = useState(() => thinkMode() === 'wait');
  const [full] = useState(() => clockSeconds(seconds) || seconds);
  if (noClock) {
    return (
      <div className="mm-top">
        <span className="mm-time tk-noclock">No clock · take your time</span>
        <span className="mm-right">
          {score} {label}
        </span>
        <button type="button" className="tk-done" onClick={finishRound}>
          I'm done
        </button>
      </div>
    );
  }
  return (
    <>
      <div className="mm-top">
        <span className={`mm-time${left <= 10 ? ' mm-time-low' : ''}`}>{left}s</span>
        <span className="mm-right">
          {score} {label}
        </span>
      </div>
      <div className="mm-bar">
        <i style={{ width: `${Math.min(100, (left / full) * 100)}%` }} />
      </div>
    </>
  );
}

// The top line of the round-based games: "Order 2 of 6 · 5 coins".
export function RoundBar({ at, of, word = 'Round', score, label }) {
  return (
    <div className="mm-top">
      <span className="mm-time">
        {word} {at} of {of}
      </span>
      <span className="mm-right">
        {score} {label}
      </span>
    </div>
  );
}

// A number pad that types into `value` (up to `max` digits).
export function NumPad({ value, onChange, onSubmit, max = 4, disabled }) {
  const press = (d) => !disabled && onChange((value + d).replace(/^0+(?=\d)/, '').slice(0, max));
  return (
    <div className="game-pad">
      <div className="game-pad-show">{value || '?'}</div>
      <div className="mm-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <button key={d} type="button" className="mm-key" onClick={() => press(String(d))}>
            {d}
          </button>
        ))}
        <button type="button" className="mm-key mm-key-small" onClick={() => onChange(value.slice(0, -1))} aria-label="Delete">
          ⌫
        </button>
        <button type="button" className="mm-key" onClick={() => press('0')}>
          0
        </button>
        <button type="button" className="mm-key mm-key-small mm-key-go" disabled={!value || disabled} onClick={onSubmit}>
          OK
        </button>
      </div>
    </div>
  );
}
