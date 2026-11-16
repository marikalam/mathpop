import { useEffect, useRef, useState } from 'react';
import { playCorrectChime, playIncorrectBuzz, playStickerPick, playStickerStick, speak } from './sound.js';
import { gameOps, nearMisses } from './ops.js';
import ThinkCard from './ThinkCard.jsx';

// Lava Run: race Pip up the path to the volcano. Roll two number dice and
// a + or − die; say the answer, and move that far. Each rock on the path
// is worth a number of steps (1 for the youngest, more for older grades,
// so it is a number line: "you're at 45"). Hot lava rocks slide you back;
// vines pull you ahead. First to the top wins. A miss opens the think
// card with a hint, then the same question again.

const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

// The dice for each grade: a and b ranges, the signs, the steps per rock.
function diceFor(grade) {
  const ops = gameOps(grade);
  const times = ops === 'x/' || (ops === 'mix' && Math.random() < 0.5);
  // Longer paths for + and −, which move further each turn.
  const rocks = ops === 'x/' ? 24 : 36;
  switch (grade) {
    case 'p':
      return { a: [1, 3], b: null, signs: [], unit: 1, rocks: 12 };
    case 'k':
      return { a: [1, 5], b: [1, 5], signs: ['+'], unit: 1, rocks: 30 };
    case '1':
      return { a: [1, 10], b: [1, 10], signs: ['+', '−'], unit: 1, rocks: 42 };
    case '2':
      return times ? { a: [2, 5], b: [2, 10], signs: ['×'], unit: 5, rocks } : { a: [10, 30], b: [1, 10], signs: ['+', '−'], unit: 5, rocks };
    case '3':
      return times ? { a: [2, 9], b: [2, 9], signs: ['×'], unit: 10, rocks } : { a: [20, 90], b: [10, 50], signs: ['+', '−'], unit: 10, rocks };
    default:
      return times ? { a: [10, 40], b: [3, 9], signs: ['×'], unit: 50, rocks } : { a: [100, 500], b: [50, 300], signs: ['+', '−'], unit: 50, rocks };
  }
}
function roll(grade) {
  const d = diceFor(grade);
  let a = rand(...d.a);
  if (!d.b) return { a, b: null, sign: null, text: '●'.repeat(a), answer: a, unit: d.unit, rocks: d.rocks };
  let b = rand(...d.b);
  const sign = d.signs[rand(0, d.signs.length - 1)];
  if (sign === '−') {
    if (b > a) [a, b] = [b, a];
    if (a === b) a += 1;
  }
  const answer = sign === '+' ? a + b : sign === '−' ? a - b : a * b;
  return { a, b, sign, text: `${a} ${sign} ${b}`, answer, unit: d.unit, rocks: d.rocks };
}

// Rock places on the path (a zigzag up the mountain), 6 to a row.
function spots(rocks) {
  const rows = Math.ceil((rocks + 1) / 6);
  const out = [];
  for (let i = 0; i <= rocks; i++) {
    const row = Math.floor(i / 6);
    const k = i % 6;
    const col = row % 2 ? 5 - k : k;
    out.push([40 + col * 56, 400 - (row * 300) / Math.max(1, rows - 1) - 10]);
  }
  return out;
}
// Which rocks are lava (back 3) and which have vines (ahead 3).
function specials(rocks) {
  const lava = new Set();
  const vine = new Set();
  for (let i = 4; i < rocks - 1; i += 5) (i % 2 ? lava : vine).add(i);
  lava.add(rocks - 2);
  vine.delete(rocks - 2);
  return { lava, vine };
}

function Die({ v, sign, rolling }) {
  return (
    <span className={`lr-die${sign ? ' lr-sign' : ''}${rolling ? ' lr-rolling' : ''}`}>
      {typeof v === 'string' && /^●+$/.test(v) ? <small>{v}</small> : v}
    </span>
  );
}

export default function LavaRun({ grade, onEnd }) {
  const first = useRef(roll(grade));
  const rocks = first.current.rocks;
  const unit = first.current.unit;
  const [pos, setPos] = useState({ you: 0, pip: 0 });
  const [turn, setTurn] = useState('you');
  const [phase, setPhase] = useState('roll'); // roll | rolling | answer | moving | over
  const [q, setQ] = useState(null);
  const [shown, setShown] = useState(null);
  const [choices, setChoices] = useState([]);
  const [wrong, setWrong] = useState([]);
  const [think, setThink] = useState(false);
  const [missed, setMissed] = useState(false);
  const [score, setScore] = useState(0);
  const [note, setNote] = useState(null);
  const sp = spots(rocks);
  const { lava, vine } = specials(rocks);
  const posRef = useRef(pos);
  posRef.current = pos;
  const scoreRef = useRef(score);
  scoreRef.current = score;

  useEffect(() => {
    speak('Race Pip to the volcano! Roll the dice, then tap the answer to move.');
  }, []);

  const steps = (n) => Math.max(1, Math.round(n / unit));
  const where = (r) => (unit === 1 ? `rock ${r}` : `${r * unit}`);

  function doRoll(who) {
    const r = roll(grade);
    setPhase('rolling');
    setNote(null);
    playStickerPick();
    let k = 0;
    const id = setInterval(() => {
      k += 1;
      setShown(roll(grade));
      if (k >= 6) {
        clearInterval(id);
        setShown(r);
        setQ(r);
        if (who === 'you') {
          setPhase('answer');
          setWrong([]);
          setMissed(false);
          setChoices([r.answer, ...nearMisses(r.answer, 3)].sort(() => Math.random() - 0.5));
          speak(r.b === null ? 'How many dots?' : `${r.text} equals what?`);
        } else {
          const line = r.b === null ? `Pip rolled ${r.answer}.` : `Pip says ${r.text} = ${r.answer}.`;
          setNote(line);
          speak(line);
          setTimeout(() => move('pip', r.answer), 1300);
        }
      }
    }, 90);
  }

  function answer(n) {
    if (phase !== 'answer' || think) return;
    if (n !== q.answer) {
      playIncorrectBuzz();
      setWrong((w) => [...w, n]);
      setMissed(true);
      setThink(true);
      return;
    }
    playCorrectChime();
    if (!missed) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }
    const n2 = steps(q.answer);
    const line = unit === 1 ? `Yes! Move ${n2}.` : `Yes, ${q.answer}! That's ${q.answer % unit ? 'about ' : ''}${n2} ${n2 === 1 ? 'rock' : 'rocks'}.`;
    setNote(line);
    speak(line);
    move('you', q.answer);
  }

  // Walk a token one rock at a time, then lava or vines, then the next turn.
  function move(who, amount) {
    setPhase('moving');
    const target = Math.min(rocks, posRef.current[who] + steps(amount));
    const id = setInterval(() => {
      const cur = posRef.current[who];
      if (cur >= target) {
        clearInterval(id);
        land(who, target);
        return;
      }
      setPos((p) => ({ ...p, [who]: p[who] + 1 }));
    }, 260);
  }
  function land(who, at) {
    const name = who === 'you' ? 'You' : 'Pip';
    if (at >= rocks) {
      setPhase('over');
      if (who === 'you') {
        playStickerStick();
        const total = scoreRef.current + 5;
        setScore(total);
        setNote('You reached the volcano first! You win!');
        speak('You reached the volcano first! You win!');
        setTimeout(() => onEnd(total), 2600);
      } else {
        setNote('Pip got there first! Good race.');
        speak('Pip got there first! Good race.');
        setTimeout(() => onEnd(scoreRef.current), 2600);
      }
      return;
    }
    let to = at;
    let line = null;
    if (lava.has(at)) {
      to = Math.max(0, at - 3);
      line = `Hot lava! ${name} ${who === 'you' ? 'slide' : 'slides'} back 3 rocks.`;
    } else if (vine.has(at)) {
      to = Math.min(rocks, at + 3);
      line = `A vine! ${name} ${who === 'you' ? 'swing' : 'swings'} ahead 3 rocks.`;
    }
    const next = () => {
      const other = who === 'you' ? 'pip' : 'you';
      setTurn(other);
      if (other === 'pip') {
        setPhase('rolling');
        setTimeout(() => doRoll('pip'), 900);
      } else setPhase('roll');
    };
    if (line) {
      setNote(line);
      speak(line);
      setTimeout(() => {
        setPos((p) => ({ ...p, [who]: to }));
        if (to >= rocks) land(who, to);
        else setTimeout(next, 900);
      }, 900);
    } else setTimeout(next, 500);
  }

  const d = shown;
  return (
    <div className="game game-pz lr-game">
      <div className="mm-top pz-top">
        <span className="pz-level">
          You {unit === 1 ? pos.you : pos.you * unit} · Pip {unit === 1 ? pos.pip : pos.pip * unit}
        </span>
        <span className="mm-right">{score} {score === 1 ? 'point' : 'points'}</span>
      </div>
      <svg className="lr-map" viewBox="0 0 360 440" role="img" aria-label={`You are at ${where(pos.you)}, Pip is at ${where(pos.pip)}, the volcano is at ${where(rocks)}`}>
        <defs>
          <linearGradient id="lr-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fde68a" />
            <stop offset="1" stopColor="#86efac" />
          </linearGradient>
        </defs>
        <rect width="360" height="440" rx="20" fill="url(#lr-sky)" />
        <path d="M120 70 L170 8 h20 L240 70z" fill="#78350f" />
        <path d="M168 10 q12 -14 24 0 q-4 12 -12 6 q-8 6 -12 -6z" fill="#f97316" />
        <path d="M172 14 l-10 28 l12 -8 l6 30 l6 -30 l12 8 l-10 -28z" fill="#ef4444" opacity="0.85" />
        <path d={`M${sp.map((p) => p.join(' ')).join(' L')}`} stroke="#a16207" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.35" />
        {sp.map(([x, y], i) => {
          const isLava = lava.has(i);
          const isVine = vine.has(i);
          return (
            <g key={i}>
              <ellipse cx={x} cy={y} rx="22" ry="15" fill={i === rocks ? '#facc15' : isLava ? '#f97316' : isVine ? '#22c55e' : '#d6c4a8'} stroke={isLava ? '#b91c1c' : isVine ? '#15803d' : '#a8916f'} strokeWidth="2.5" />
              {isVine && <path d={`M${x + 14} ${y - 10} q8 -8 10 2 q-6 2 -10 -2z`} fill="#14532d" />}
              <text x={x} y={y + 5} textAnchor="middle" className="lr-num">
                {i === 0 ? 'Go' : i * unit}
              </text>
            </g>
          );
        })}
        {[
          ['pip', '#ff8a3d', 9],
          ['you', '#3b6fef', -9],
        ].map(([who, color, dx]) => {
          const [x, y] = sp[Math.min(rocks, pos[who])];
          return (
            <g key={who} className="lr-token" style={{ transform: `translate(${x + dx}px, ${y - 18}px)` }}>
              <path d="M0 14 l-9 -14 a9 9 0 1 1 18 0z" fill={color} stroke="#fff" strokeWidth="2" />
              <text x="0" y="3" textAnchor="middle" className="lr-tok">
                {who === 'you' ? 'Me' : 'Pip'}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="lr-key">
        <i className="lr-k-lava" /> Lava: back 3 <i className="lr-k-vine" /> Vine: ahead 3
      </p>
      <div className="lr-dice" aria-live="polite">
        {d ? (
          <>
            <Die v={d.b === null ? d.text : d.a} rolling={phase === 'rolling'} />
            {d.sign && <Die v={d.sign} sign rolling={phase === 'rolling'} />}
            {d.b !== null && <Die v={d.b} rolling={phase === 'rolling'} />}
          </>
        ) : (
          <span className="lr-hint">Tap Roll to start!</span>
        )}
      </div>
      {note && (
        <button type="button" className="mi-note" onClick={() => speak(note)}>
          {note}
        </button>
      )}
      {phase === 'answer' && turn === 'you' ? (
        <div className="mi-choices">
          {choices.map((n) => (
            <button key={n} type="button" className={`mi-choice lr-choice${wrong.includes(n) ? ' mi-wrong' : ''}`} disabled={wrong.includes(n)} onClick={() => answer(n)}>
              {n}
            </button>
          ))}
        </div>
      ) : (
        <button type="button" className="mi-sail lr-roll" disabled={phase !== 'roll' || turn !== 'you'} onClick={() => doRoll('you')}>
          {phase === 'over' ? 'Race over' : turn === 'pip' ? 'Pip’s turn…' : phase === 'roll' ? 'Roll' : 'Moving…'}
        </button>
      )}
      {think && <ThinkCard text={q.text} title="Let's think together" start={1} onReady={() => setThink(false)} />}
    </div>
  );
}
