import { useEffect, useState } from 'react';

// The finished page's party: confetti falling from the top (a few
// seconds, then it's gone) and a score that counts up.
const COLORS = ['#ffd23f', '#ff6b9a', '#3b8cf0', '#2fae6b', '#ff9f43', '#9b6bf2', '#14b8a6'];

export function Confetti({ pieces = 36 }) {
  const [on, setOn] = useState(true);
  const [bits] = useState(() =>
    Array.from({ length: pieces }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      dur: 1.8 + Math.random() * 1.2,
      drift: (Math.random() - 0.5) * 120,
      spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
      color: COLORS[i % COLORS.length],
      round: i % 3 === 0,
      size: 7 + Math.random() * 6,
    })),
  );
  useEffect(() => {
    const id = setTimeout(() => setOn(false), 3600);
    return () => clearTimeout(id);
  }, []);
  if (!on) return null;
  return (
    <span className="confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <i
          key={i}
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.round ? b.size : b.size * 0.5,
            borderRadius: b.round ? '50%' : 2,
            background: b.color,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
            '--drift': `${b.drift}px`,
            '--spin': `${b.spin}deg`,
          }}
        />
      ))}
    </span>
  );
}

// Counts up from 0 to `to` (about a second), then gives a little pop.
export function CountUp({ to, ms = 900 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!to) return undefined;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const k = Math.min(1, (t - start) / ms);
      setN(Math.round(to * (1 - (1 - k) * (1 - k))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return <span className={n === to ? 'count-up count-up-done' : 'count-up'}>{n}</span>;
}
