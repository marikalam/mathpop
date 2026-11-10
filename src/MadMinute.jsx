import { useEffect, useRef, useState } from 'react';
import Pip from './Pip.jsx';
import { Confetti, CountUp } from './Celebrate.jsx';
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

// The kinds of Mad Minute a grade can pick (the first is the usual one):
// from 2nd grade, times tables too (2nd: the 2, 3, 4, 5 and 10 tables).
const MODES = {
  addsub: { label: 'Adding & taking away', sign: '+ −' },
  times: { label: 'Times tables', sign: '×' },
  mixed: { label: 'Times & division', sign: '× ÷' },
};
export function madMinuteModes(grade) {
  if (grade === '2') return ['addsub', 'times'];
  if (grade === '3') return ['times', 'addsub'];
  if (grade === '4') return ['mixed', 'times', 'addsub'];
  return ['addsub'];
}

export function madMinuteFact(grade, mode = madMinuteModes(grade)[0]) {
  if (mode === 'times' || (mode === 'mixed' && Math.random() >= 0.4)) {
    const table = grade === '2' ? [2, 3, 4, 5, 10][rand(0, 4)] : rand(2, grade === '3' ? 10 : 12);
    const b = rand(1, grade === '2' ? 10 : grade === '3' ? 10 : 12);
    return Math.random() < 0.5 ? { text: `${table} × ${b}`, answer: table * b } : { text: `${b} × ${table}`, answer: table * b };
  }
  if (mode === 'mixed') {
    const a = rand(2, 12);
    const b = rand(2, 12);
    return { text: `${a * b} ÷ ${a}`, answer: b };
  }
  if (grade === 'k') {
    const a = rand(0, 5);
    const b = rand(0, 5);
    return { text: `${a} + ${b}`, answer: a + b };
  }
  if (grade !== 'k') {
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
  return { text: '1 + 1', answer: 2 };
}

function readBest() {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY)) || {};
  } catch {
    return {};
  }
}

// Each kind has its own best (the usual kind keeps the first key). With
// no `mode`: the best of any kind (the home page's tile).
const bestKey = (playerId, grade, mode) => (mode === madMinuteModes(grade)[0] ? `${playerId}:${grade}` : `${playerId}:${grade}:${mode}`);
export function madMinuteBest(playerId, grade, mode) {
  const all = readBest();
  if (mode) return all[bestKey(playerId, grade, mode)] || 0;
  return Math.max(0, ...madMinuteModes(grade).map((m) => all[bestKey(playerId, grade, m)] || 0));
}

function saveBest(playerId, grade, mode, score) {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ ...readBest(), [bestKey(playerId, grade, mode)]: score }));
  } catch {
    /* private mode */
  }
}

export default function MadMinute({ playerId, grade, onDone, stickerSlot }) {
  const modes = madMinuteModes(grade);
  const [mode, setMode] = useState(modes[0]);
  // pick (which kind, when there's a choice) | ready | play | done
  const [phase, setPhase] = useState(modes.length > 1 ? 'pick' : 'ready');
  const [count, setCount] = useState(3);
  const [left, setLeft] = useState(SECONDS);
  const [fact, setFact] = useState(() => madMinuteFact(grade, modes[0]));
  const [typed, setTyped] = useState('');
  const [flash, setFlash] = useState(null); // 'right' | 'wrong'
  const [right, setRight] = useState(0);
  const [tries, setTries] = useState(0);
  const [result, setResult] = useState(null);
  const best = useRef(madMinuteBest(playerId, grade, modes[0]));
  const busy = useRef(false);

  // Starts a minute of this kind (again).
  function start(m = mode) {
    setMode(m);
    best.current = madMinuteBest(playerId, grade, m);
    setFact(madMinuteFact(grade, m));
    setCount(3);
    setLeft(SECONDS);
    setTyped('');
    setFlash(null);
    setRight(0);
    setTries(0);
    setResult(null);
    busy.current = false;
    setPhase('ready');
  }

  // The choice, said out loud (for kids who can't read yet).
  useEffect(() => {
    if (phase !== 'pick') return;
    speak(`Pick your Mad Minute! ${modes.map((m) => MODES[m].label.replace('&', 'and')).join(', or ')}?`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

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
    if (isBest) saveBest(playerId, grade, mode, right);
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
        setFact(madMinuteFact(grade, mode));
        setTyped('');
        setFlash(null);
        busy.current = false;
      }, 220);
    } else {
      playIncorrectBuzz();
      setFlash('wrong');
      setTimeout(() => {
        setFact(madMinuteFact(grade, mode));
        setTyped('');
        setFlash(null);
        busy.current = false;
      }, 900);
    }
  }

  if (phase === 'pick') {
    return (
      <div className="mm mm-pick">
        <p className="mm-how">Pick your Mad Minute!</p>
        {modes.map((m) => (
          <button key={m} type="button" className={`mm-mode mm-mode-${m}`} onClick={() => start(m)}>
            <span className="mm-mode-sign">{MODES[m].sign}</span>
            <span className="mm-mode-text">
              {MODES[m].label}
              <small>{madMinuteBest(playerId, grade, m) ? `Best: ${madMinuteBest(playerId, grade, m)}` : 'Not tried yet'}</small>
            </span>
          </button>
        ))}
      </div>
    );
  }

  if (phase === 'ready') {
    return (
      <div className="mm mm-ready">
        <p className="mm-how">{modes.length > 1 ? `${MODES[mode].label}: answer` : 'Answer'} as many as you can in one minute!</p>
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
        <Confetti />
        <span className="complete-pip">
          <Pip size={96} mood="cheer" />
        </span>
        <h2 className="screen-title">Time's up!</h2>
        <div className="mm-score">
          <span>
            <CountUp to={result.right} />
          </span>{' '}
          right in one minute
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
        <button className="pill-btn-primary pill-btn-full" onClick={() => start(mode)}>
          Go again →
        </button>
        {modes.length > 1 && (
          <button type="button" className="back-link back-link-center" onClick={() => setPhase('pick')}>
            Try a different one
          </button>
        )}
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
