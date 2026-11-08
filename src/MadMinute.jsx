import { useEffect, useRef, useState } from 'react';
import Pip from './Pip.jsx';
import { playCorrectChime, playIncorrectBuzz, speak } from './sound.js';

// Mad Minute: as many quick facts as you can in one minute. The facts
// follow the grade (adding within 10 in K; adding and taking away within
// 20 in 1st and 2nd; times tables in 3rd; times and division in 4th).
// Answers are typed on a big number pad and checked as soon as there are
// enough digits, so it keeps moving. Each player's best score per grade
// is kept on this device.
const SECONDS = 60;
const BEST_KEY = 'mathpop-madminute-best-v1';

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

export function madMinuteFact(grade) {
  if (grade === 'k') {
    const a = rand(0, 5);
    const b = rand(0, 5);
    return { text: `${a} + ${b}`, answer: a + b };
  }
  if (grade === '1' || grade === '2') {
    const top = grade === '1' ? 10 : 20;
    if (Math.random() < 0.5) {
      const a = rand(1, top - 1);
      const b = rand(1, Math.min(10, top - a));
      return { text: `${a} + ${b}`, answer: a + b };
    }
    const a = rand(2, top);
    const b = rand(1, Math.min(10, a));
    return { text: `${a} − ${b}`, answer: a - b };
  }
  const max = grade === '3' ? 10 : 12;
  const a = rand(2, max);
  const b = rand(2, max);
  if (grade === '4' && Math.random() < 0.4) return { text: `${a * b} ÷ ${a}`, answer: b };
  return { text: `${a} × ${b}`, answer: a * b };
}

function readBest() {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY)) || {};
  } catch {
    return {};
  }
}

export function madMinuteBest(playerId, grade) {
  return readBest()[`${playerId}:${grade}`] || 0;
}

function saveBest(playerId, grade, score) {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ ...readBest(), [`${playerId}:${grade}`]: score }));
  } catch {
    /* private mode */
  }
}

export default function MadMinute({ playerId, grade, onDone, stickerSlot, onAgain }) {
  const [phase, setPhase] = useState('ready'); // ready | play | done
  const [count, setCount] = useState(3);
  const [left, setLeft] = useState(SECONDS);
  const [fact, setFact] = useState(() => madMinuteFact(grade));
  const [typed, setTyped] = useState('');
  const [flash, setFlash] = useState(null); // 'right' | 'wrong'
  const [right, setRight] = useState(0);
  const [tries, setTries] = useState(0);
  const [result, setResult] = useState(null);
  const best = useRef(madMinuteBest(playerId, grade));
  const busy = useRef(false);

  // 3, 2, 1, go!
  useEffect(() => {
    if (phase !== 'ready') return undefined;
    speak('Ready? 3, 2, 1, go!');
    const id = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(id);
          setPhase('play');
          return 0;
        }
        return c - 1;
      });
    }, 900);
    return () => clearInterval(id);
  }, [phase]);

  // The minute.
  useEffect(() => {
    if (phase !== 'play') return undefined;
    const end = Date.now() + SECONDS * 1000;
    const id = setInterval(() => {
      const s = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) clearInterval(id);
    }, 200);
    return () => clearInterval(id);
  }, [phase]);

  // Time's up.
  useEffect(() => {
    if (phase !== 'play' || left > 0) return;
    const isBest = right > best.current;
    if (isBest) saveBest(playerId, grade, right);
    setResult({ right, tries, isBest, before: best.current });
    setPhase('done');
    speak(
      isBest && best.current
        ? `Time's up! ${right} right. That's a new best!`
        : `Time's up! You got ${right} right in one minute!`,
    );
    onDone?.(right, Math.max(tries, right));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, phase]);

  function press(d) {
    if (phase !== 'play' || busy.current) return;
    const next = (typed + d).slice(0, 3);
    setTyped(next);
    const want = String(fact.answer);
    if (next.length < want.length) return;
    busy.current = true;
    setTries((n) => n + 1);
    if (next === want) {
      playCorrectChime();
      setRight((n) => n + 1);
      setFlash('right');
      setTimeout(() => {
        setFact(madMinuteFact(grade));
        setTyped('');
        setFlash(null);
        busy.current = false;
      }, 220);
    } else {
      playIncorrectBuzz();
      setFlash('wrong');
      setTimeout(() => {
        setFact(madMinuteFact(grade));
        setTyped('');
        setFlash(null);
        busy.current = false;
      }, 900);
    }
  }

  if (phase === 'ready') {
    return (
      <div className="mm mm-ready">
        <p className="mm-how">Answer as many as you can in one minute!</p>
        <div className="mm-count" key={count}>
          {count || 'Go!'}
        </div>
        <p className="mm-best">{best.current ? `Your best: ${best.current}` : 'Your first Mad Minute!'}</p>
      </div>
    );
  }

  if (phase === 'done' && result) {
    return (
      <div className="mm mm-done">
        <Pip size={96} mood="cheer" />
        <h2 className="screen-title">Time's up!</h2>
        <div className="mm-score">
          <span>{result.right}</span> right in one minute
        </div>
        <p className="mm-best">
          {result.isBest && result.before ? (
            <strong>New best! (was {result.before})</strong>
          ) : result.isBest ? (
            'Your first best score. Try to beat it!'
          ) : (
            `Your best: ${result.before}. ${result.before - result.right + 1} more to beat it!`
          )}
        </p>
        {stickerSlot}
        <button className="pill-btn-primary pill-btn-full" onClick={onAgain}>
          Go again →
        </button>
      </div>
    );
  }

  const pct = (left / SECONDS) * 100;
  return (
    <div className="mm mm-play">
      <div className="mm-top">
        <span className={`mm-time${left <= 10 ? ' mm-time-low' : ''}`}>{left}s</span>
        <span className="mm-right">{right} right</span>
      </div>
      <div className="mm-bar">
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className={`mm-fact${flash ? ` mm-fact-${flash}` : ''}`}>
        <span>{fact.text} =</span>
        <span className="mm-typed">{flash === 'wrong' ? fact.answer : typed || '?'}</span>
      </div>
      <div className="mm-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <button key={d} type="button" className="mm-key" onClick={() => press(String(d))}>
            {d}
          </button>
        ))}
        <button type="button" className="mm-key mm-key-small" onClick={() => setTyped('')} aria-label="Clear">
          Clear
        </button>
        <button type="button" className="mm-key" onClick={() => press('0')}>
          0
        </button>
        <button type="button" className="mm-key mm-key-small" onClick={() => setTyped((t) => t.slice(0, -1))} aria-label="Delete">
          ⌫
        </button>
      </div>
    </div>
  );
}
