import { useEffect, useMemo, useRef, useState } from 'react';
import { Thing } from './Drawings.jsx';
import Icon from './Icon.jsx';
import { Confetti } from './Celebrate.jsx';
import TopicVisual, { PatternShape } from './TopicVisual.jsx';
import { TOPIC_BUILDERS } from './topics.js';
import { storyNames } from './storyNames.js';
import { playCorrectChime, playIncorrectBuzz, playStickerPick, playStickerStick, speak } from './sound.js';
import Pip from './Pip.jsx';
import { Finale, TREASURES, TreasureChest, addReward } from './Rewards.jsx';
import { useDragDrop } from './dragDrop.js';
import { NumPad, RoundBar, TimerBar, pick, rand, shuffle, useCountdown } from './gameKit.jsx';

// Games built on Singapore math and Beast Academy ideas (Games.jsx lists
// and runs them). Each is `({ grade, onEnd })`: call onEnd(score) once.
//   barModel      Bar Model Builder: pick the bar model, then solve
//   bondPop       Number Bond Pop: find the missing part of the bond
//   makeTen       Make a Ten Race: 8 + 5 = 8 + 2 + 3 = 13
//   sumGridRush   Sum Grid Rush: fill the sum grids (BA 1B)
//   patternStreak Shape Pattern Streak: what comes next, in a row (BA 1C)
//   equalDiff     Equal Differences: slide both numbers, then subtract (BA 1C)
//   timesTiles    Times Table Tiles: match each fact to its answer
//   pizza         Fraction Pizza Shop: cut and serve the fraction
//   logicLock     Logic Lock: crack the code from the clues (BA 2-4)

const useEndAtZero = (left, score, onEnd) =>
  useEffect(() => {
    if (left === 0) onEnd(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

const big = (grade) => (grade === 'k' || grade === '1' ? 20 : grade === '2' ? 100 : 1000);

// ---------------------------------------------------------------- Bar Model
// Build the bar model from the story, then solve it. The bars are labeled
// with the story's people (an animal face and a name) and "Together" (a
// bracket over both parts) or "more" (the gap between two amounts). The
// story's numbers, and a ? for the mystery number, are chips: drag each
// one (or tap it, then tap a spot) onto its place. Then pick the mystery
// number from three; the wrong ones are the add-or-subtract mix-up. Help:
// a wrong spot says what to look for, then the right spot glows; a wrong
// answer explains the sum, then the right answer glows.
const BAR_ITEMS = [
  { id: 'cookie', name: 'cookies' },
  { id: 'star', name: 'stickers' },
  { id: 'balloon', name: 'balloons' },
  { id: 'strawberry', name: 'strawberries' },
  { id: 'flower', name: 'flowers' },
  { id: 'fish', name: 'fish' },
];
const BAR_FACES = ['bunny', 'bear', 'fox', 'panda', 'frog', 'monkey', 'cat', 'dog'];
function barProblem(grade) {
  const top = big(grade);
  const [p, q] = storyNames(2);
  const [fp, fq] = shuffle(BAR_FACES);
  const it = pick(BAR_ITEMS);
  const kind = pick(['total', 'part', 'more', 'compareTotal']);
  let a = rand(Math.ceil(top * 0.2), Math.floor(top * 0.55));
  let b = rand(Math.ceil(top * 0.1), Math.floor(top * 0.4));
  if (a === b) a += 1;
  const P = { name: p, face: fp };
  const Q = { name: q, face: fq };
  if (kind === 'total' || kind === 'part') {
    // One bar in two parts (P's and Q's), with "Together" over both.
    const spots = { A: a, B: b, W: a + b };
    const unknown = kind === 'total' ? 'W' : 'B';
    const text =
      kind === 'total'
        ? [`${p} has ${a} ${it.name}.`, `${q} has ${b} ${it.name}.`, 'How many do they have together?']
        : [`${p} and ${q} have ${a + b} ${it.name} together.`, `${p} has ${a}.`, `How many does ${q} have?`];
    const sum = kind === 'total' ? `Together means add the parts: ${a} + ${b}` : `Take ${p}'s part away from the whole: ${a + b} − ${a}`;
    const wrong = kind === 'total' ? Math.abs(a - b) : a + b + a;
    return { model: 'partWhole', P, Q, item: it, spots, unknown, text, sum, choices: [spots[unknown], wrong] };
  }
  // Two bars, one longer, with the "more" gap after the shorter one.
  const small = a;
  const more = b;
  const bigV = a + b;
  if (kind === 'more') {
    const text = [`${p} has ${bigV} ${it.name}.`, `${q} has ${small}.`, `How many more does ${p} have?`];
    return { model: 'compare', BIG: P, SMALL: Q, item: it, spots: { BIG: bigV, SMALL: small, D: more }, unknown: 'D', text, sum: `How many more: take the smaller away, ${bigV} − ${small}`, choices: [more, bigV + small] };
  }
  const text = [`${p} has ${small} ${it.name}.`, `${q} has ${more} more than ${p}.`, `How many does ${q} have?`];
  return { model: 'compare', BIG: Q, SMALL: P, item: it, spots: { BIG: bigV, SMALL: small, D: more }, unknown: 'BIG', text, sum: `${q} has ${p}'s and ${more} more: ${small} + ${more}`, choices: [bigV, Math.abs(small - more) || bigV + 10] };
}
// What each spot is called, for the hints.
function spotName(pr, k) {
  if (pr.model === 'partWhole') return k === 'A' ? `${pr.P.name}'s part` : k === 'B' ? `${pr.Q.name}'s part` : 'Together';
  return k === 'BIG' ? `${pr.BIG.name}'s bar` : k === 'SMALL' ? `${pr.SMALL.name}'s bar` : 'the "more" gap';
}

function BarSpot({ pr, k, placed, glow, over, onTap, lit }) {
  const v = placed[k];
  return (
    <button
      type="button"
      data-drop={k}
      className={`bm-spot${v !== undefined ? ' bm-spot-full' : ''}${glow ? ' toy-glow' : ''}${over ? ' bm-spot-over' : ''}${lit ? ' bm-spot-lit' : ''}`}
      onClick={() => onTap(k)}
      aria-label={spotName(pr, k)}
    >
      {v === undefined ? '' : <b key={String(v)}>{v}</b>}
    </button>
  );
}

export function BarModel({ grade, onEnd }) {
  const N = 6;
  const [n, setN] = useState(0);
  const [pr, setPr] = useState(() => barProblem(grade));
  const [placed, setPlaced] = useState({});
  const [chosen, setChosen] = useState(null);
  const [step, setStep] = useState('build');
  const [choices, setChoices] = useState([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [miss2, setMiss2] = useState(0);
  const [note, setNote] = useState(null);
  const [glowSpot, setGlowSpot] = useState(null);
  const [solved, setSolved] = useState(false);
  const [shake, setShake] = useState(null);
  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const keys = pr.model === 'partWhole' ? ['A', 'B', 'W'] : ['BIG', 'SMALL', 'D'];
  // The chips: the story's numbers and the ?.
  const chips = useMemo(() => shuffle(keys.map((k) => ({ k, label: k === pr.unknown ? '?' : pr.spots[k] }))), [pr]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    speak(`${pr.text.join(' ')} Drag each number onto the bars. The question mark goes where the mystery number is.`);
    setPlaced({});
    setChosen(null);
    setStep('build');
    setMisses(0);
    setMiss2(0);
    setNote(null);
    setGlowSpot(null);
    setSolved(false);
  }, [pr]);

  function place(chip, k) {
    if (step !== 'build' || placed[k] !== undefined) return;
    if (chip.k === k) {
      playStickerPick();
      const next = { ...placed, [k]: chip.label };
      setPlaced(next);
      setChosen(null);
      setGlowSpot(null);
      setNote(null);
      if (Object.keys(next).length === 3) {
        // Built: now find the mystery number.
        const right = pr.spots[pr.unknown];
        const extra = right + (rand(0, 1) ? 1 : -1) * (right > 20 ? 10 : 1);
        setChoices(shuffle([...new Set([right, ...pr.choices.slice(1), extra > 0 ? extra : right + 2])]).slice(0, 3));
        later(() => {
          playCorrectChime();
          setStep('solve');
          setNote(null);
          speak('You built it! Now, what is the mystery number?');
        }, 500);
      }
    } else {
      playIncorrectBuzz();
      const m = misses + 1;
      setMisses(m);
      setShake(chip.k + Math.random());
      const what = chip.label === '?' ? 'The ? goes where the mystery number is: what does the question ask?' : `Which line of the story says ${chip.label}? Put it on that bar.`;
      if (m >= 2) {
        setGlowSpot(chip.k);
        setNote(`Try the glowing spot: ${spotName(pr, chip.k)}.`);
        speak(`Try the glowing spot!`);
      } else {
        setNote(what);
        speak(what);
      }
    }
  }
  const { drag, start } = useDragDrop({
    onDrop: (chip, zone) => zone && place(chip, zone),
    onTap: (chip) => {
      setChosen(chip.k);
      playStickerPick();
      speak(chip.label === '?' ? 'The mystery number. Where does it go?' : `${chip.label}. Where does it go?`);
    },
  });
  function tapSpot(k) {
    const chip = chips.find((c) => c.k === chosen);
    if (chip) place(chip, k);
  }
  function answer(v) {
    if (solved) return;
    const right = pr.spots[pr.unknown];
    if (v === right) {
      playCorrectChime();
      setSolved(true);
      setPlaced((x) => ({ ...x, [pr.unknown]: right }));
      const pts = Math.max(1, 3 - (misses ? 1 : 0) - (miss2 ? 1 : 0));
      const total = score + pts;
      setScore(total);
      setNote(`Yes! ${right}! +${pts} ${pts === 1 ? 'star' : 'stars'}`);
      speak(`Yes! The mystery number is ${right}!`);
      later(() => {
        if (n + 1 >= N) onEnd(total);
        else {
          setN(n + 1);
          setPr(barProblem(grade));
        }
      }, 2200);
    } else {
      playIncorrectBuzz();
      const m = miss2 + 1;
      setMiss2(m);
      setShake(`c${v}${Math.random()}`);
      setNote(m >= 2 ? `${pr.sum} = ? Try the glowing one!` : `${pr.sum} = ?`);
      speak(`${pr.sum.replace('−', 'minus')}.`);
    }
  }

  // Bar sizes from the real amounts (so a bigger number is a longer bar).
  const pw = pr.model === 'partWhole';
  const wA = pw ? Math.max(28, Math.min(72, (pr.spots.A / pr.spots.W) * 100)) : 0;
  const wS = pw ? 0 : Math.max(30, Math.min(78, (pr.spots.SMALL / pr.spots.BIG) * 100));
  const over = drag?.over;
  const picsIn = (count) => Math.min(count, 8);
  const fill = (count, cls) =>
    solved && (
      <span className={`bm-fill ${cls || ''}`} aria-hidden="true">
        {Array.from({ length: picsIn(count) }, (_, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.06}s` }}>
            <Thing id={pr.item.id} size={16} />
          </span>
        ))}
      </span>
    );
  return (
    <div className="game game-bar">
      <RoundBar at={n + 1} of={N} word="Problem" score={score} label="stars" />
      <button type="button" className="bm-story" onClick={() => speak(pr.text.join(' '))}>
        <Thing id={pr.item.id} size={34} />
        <span>
          {pr.text.map((line, i) => (
            <span key={i} className={i === 2 ? 'bm-q' : ''}>
              {line}{' '}
            </span>
          ))}
        </span>
      </button>

      <div className={`bm-board${solved ? ' bm-board-solved' : ''}`}>
        {pw ? (
          <>
            <div className="bm-brace">
              <span className="bm-brace-label">Together</span>
              <BarSpot pr={pr} k="W" placed={placed} glow={glowSpot === 'W'} over={over === 'W'} lit={chosen && placed.W === undefined} onTap={tapSpot} />
            </div>
            <div className="bm-row">
              <div className="bm-seg bm-seg-a" style={{ width: `${wA}%` }}>
                <span className="bm-who">
                  <Thing id={pr.P.face} size={22} /> {pr.P.name}
                </span>
                <BarSpot pr={pr} k="A" placed={placed} glow={glowSpot === 'A'} over={over === 'A'} lit={chosen && placed.A === undefined} onTap={tapSpot} />
                {fill(pr.spots.A)}
              </div>
              <div className="bm-seg bm-seg-b" style={{ width: `${100 - wA}%` }}>
                <span className="bm-who">
                  <Thing id={pr.Q.face} size={22} /> {pr.Q.name}
                </span>
                <BarSpot pr={pr} k="B" placed={placed} glow={glowSpot === 'B'} over={over === 'B'} lit={chosen && placed.B === undefined} onTap={tapSpot} />
                {fill(pr.spots.B)}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bm-row bm-row-label">
              <span className="bm-who">
                <Thing id={pr.BIG.face} size={22} /> {pr.BIG.name}
              </span>
            </div>
            <div className="bm-row">
              <div className="bm-seg bm-seg-a" style={{ width: '100%' }}>
                <BarSpot pr={pr} k="BIG" placed={placed} glow={glowSpot === 'BIG'} over={over === 'BIG'} lit={chosen && placed.BIG === undefined} onTap={tapSpot} />
                {fill(pr.spots.BIG)}
              </div>
            </div>
            <div className="bm-row bm-row-label">
              <span className="bm-who">
                <Thing id={pr.SMALL.face} size={22} /> {pr.SMALL.name}
              </span>
            </div>
            <div className="bm-row">
              <div className="bm-seg bm-seg-b" style={{ width: `${wS}%` }}>
                <BarSpot pr={pr} k="SMALL" placed={placed} glow={glowSpot === 'SMALL'} over={over === 'SMALL'} lit={chosen && placed.SMALL === undefined} onTap={tapSpot} />
                {fill(pr.spots.SMALL)}
              </div>
              <div className="bm-gap" style={{ width: `${100 - wS}%` }}>
                <span className="bm-gap-label">more</span>
                <BarSpot pr={pr} k="D" placed={placed} glow={glowSpot === 'D'} over={over === 'D'} lit={chosen && placed.D === undefined} onTap={tapSpot} />
              </div>
            </div>
          </>
        )}
      </div>

      {step === 'build' ? (
        <div className="bm-chips">
          <span className="bm-chips-label">Drag each one onto the bars</span>
          {chips.map((c) =>
            placed[c.k] !== undefined ? (
              <span key={c.k} className="bm-chip bm-chip-used" />
            ) : (
              <button
                key={c.k}
                type="button"
                className={`bm-chip${c.label === '?' ? ' bm-chip-q' : ''}${chosen === c.k ? ' bm-chip-chosen' : ''}${drag?.item?.k === c.k ? ' bm-chip-dragging' : ''}${String(shake).startsWith(c.k) ? ' bm-shake' : ''}`}
               
                onPointerDown={start(c)}
              >
                {c.label}
              </button>
            ),
          )}
        </div>
      ) : (
        <div className="bm-solve">
          <span className="bm-chips-label">What is the mystery number?</span>
          <div className="bm-answers">
            {choices.map((v) => (
              <button
                key={v}
                type="button"
                className={`bm-answer${miss2 >= 2 && !solved && v === pr.spots[pr.unknown] ? ' toy-glow' : ''}${solved && v === pr.spots[pr.unknown] ? ' bm-answer-right' : ''}${String(shake).startsWith(`c${v}`) ? ' bm-shake' : ''}`}
                onClick={() => answer(v)}
                disabled={solved}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}
      {note && (
        <p className={`bakery-note${solved ? ' bakery-note-good' : ''}${(misses >= 1 || miss2 >= 1) && !solved ? ' bakery-note-pip' : ''}`}>
          {(misses >= 1 || miss2 >= 1) && !solved && <Pip size={30} mood="wave" />}
          <span>{note}</span>
        </p>
      )}
      {drag && (
        <span className={`bm-chip bm-chip-ghost${drag.item.label === '?' ? ' bm-chip-q' : ''}`} style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          {drag.item.label}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------- Number Bond Pop
function bondRound(grade) {
  let whole;
  let part;
  if (grade === 'k') {
    whole = rand(3, 10);
    part = rand(0, whole);
  } else if (grade === '1') {
    whole = rand(8, 20);
    part = rand(1, whole - 1);
  } else {
    whole = rand(2, 10) * 10;
    part = rand(1, whole / 10 - 1) * 10 + (Math.random() < 0.5 ? 0 : 5);
    if (part >= whole) part = whole - 5;
  }
  const answer = whole - part;
  const near = shuffle([answer + 1, answer - 1, answer + 2, answer + 10, answer - 10, whole, part].filter((x) => x >= 0 && x !== answer));
  return { whole, part, answer, opts: shuffle([answer, ...[...new Set(near)].slice(0, 3)]), id: Math.random() };
}

export function BondPop({ grade, onEnd }) {
  const seconds = 60;
  const left = useCountdown(seconds, true);
  const [r, setR] = useState(() => bondRound(grade));
  const [score, setScore] = useState(0);
  const [bad, setBad] = useState(null);
  const [pop, setPop] = useState(null);
  useEndAtZero(left, score, onEnd);
  function tap(v) {
    if (left === 0 || pop !== null) return;
    if (v === r.answer) {
      playCorrectChime();
      setPop(v);
      setScore((s) => s + 1);
      setTimeout(() => {
        setPop(null);
        setR(bondRound(grade));
      }, 300);
    } else {
      playIncorrectBuzz();
      setBad(v);
      setTimeout(() => setBad(null), 400);
    }
  }
  return (
    <div className="game game-bond">
      <TimerBar left={left} seconds={seconds} score={score} label="bonds" />
      <svg viewBox="0 0 240 170" className="bond-pic" aria-label={`Whole ${r.whole}, parts ${r.part} and what?`}>
        <path d="M120 50 L60 125 M120 50 L180 125" stroke="#173a66" strokeWidth="5" />
        <circle cx="120" cy="45" r="38" fill="#ffd23f" stroke="#173a66" strokeWidth="4" />
        <circle cx="60" cy="128" r="34" fill="#fff" stroke="#173a66" strokeWidth="4" />
        <circle cx="180" cy="128" r="34" fill="#e8f4ff" stroke="#3b6fef" strokeWidth="4" strokeDasharray="7 5" />
        <text x="120" y="56" textAnchor="middle" className="bond-txt">{r.whole}</text>
        <text x="60" y="139" textAnchor="middle" className="bond-txt">{r.part}</text>
        <text x="180" y="139" textAnchor="middle" className="bond-txt bond-q">{pop !== null ? pop : '?'}</text>
      </svg>
      <div className="bond-bubbles">
        {r.opts.map((v) => (
          <button key={`${r.id}-${v}`} type="button" className={`bond-bubble${bad === v ? ' make10-bad' : ''}${pop === v ? ' bubble-pop' : ''}`} onClick={() => tap(v)}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

// --------------------------------------------------------- Make a Ten Race
function tenRound() {
  const a = rand(6, 9);
  const b = rand(10 - a + 1, 9);
  return { a, b, fill: 10 - a, rest: b - (10 - a), id: Math.random() };
}
const opts4 = (answer, lo = 0) => shuffle([answer, ...shuffle([answer + 1, answer - 1, answer + 2, answer - 2, answer + 3].filter((x) => x >= lo && x !== answer)).slice(0, 3)]);

export function MakeTen({ onEnd }) {
  const seconds = 60;
  const left = useCountdown(seconds, true);
  const [r, setR] = useState(tenRound);
  const [step, setStep] = useState(0); // 0: fill to 10, 1: the rest, 2: the answer
  const [score, setScore] = useState(0);
  const [bad, setBad] = useState(null);
  useEndAtZero(left, score, onEnd);
  const ask = useMemo(
    () => [
      { q: `${r.a} needs ? to make 10`, ans: r.fill, opts: opts4(r.fill, 1) },
      { q: `${r.b} is ${r.fill} and ?`, ans: r.rest, opts: opts4(r.rest, 0) },
      { q: `10 + ${r.rest} = ?`, ans: 10 + r.rest, opts: opts4(10 + r.rest, 10) },
    ],
    [r],
  );
  useEffect(() => {
    speak(`${r.a} plus ${r.b}. Make a ten first!`);
  }, [r]);
  function tap(v) {
    if (left === 0) return;
    if (v === ask[step].ans) {
      playCorrectChime();
      if (step === 2) {
        setScore((s) => s + 1);
        setStep(0);
        setR(tenRound());
      } else setStep(step + 1);
    } else {
      playIncorrectBuzz();
      setBad(v);
      setTimeout(() => setBad(null), 400);
    }
  }
  const cur = ask[step];
  return (
    <div className="game game-maketen">
      <TimerBar left={left} seconds={seconds} score={score} label="done" />
      <div className="game-question">
        {r.a} + {r.b} = ?
      </div>
      <div className="maketen-steps">
        <span className={step > 0 ? 'mt-done' : 'mt-now'}>
          {r.a} + <b>{step > 0 ? r.fill : '?'}</b> = 10
        </span>
        <span className={step > 1 ? 'mt-done' : step === 1 ? 'mt-now' : ''}>
          {r.b} = {r.fill} + <b>{step > 1 ? r.rest : '?'}</b>
        </span>
        <span className={step === 2 ? 'mt-now' : ''}>
          10 + {step > 1 ? r.rest : '?'} = <b>?</b>
        </span>
      </div>
      <p className="game-ask">{cur.q}</p>
      <div className="shapes-grid">
        {cur.opts.map((v) => (
          <button key={`${r.id}-${step}-${v}`} type="button" className={`choice-big${bad === v ? ' make10-bad' : ''}`} onClick={() => tap(v)}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------------- Sum Grid Rush
function gridRound() {
  let top;
  for (;;) {
    top = [rand(0, 10), rand(0, 10), rand(0, 10)];
    const last = 20 - top[0] - top[1] - top[2];
    if (last >= 0 && last <= 10) {
      top.push(last);
      break;
    }
  }
  const rows = [top, top.map((x) => 10 - x)];
  const cols = shuffle([0, 1, 2, 3]).slice(0, 3);
  const blanks = cols.map((c) => [rand(0, 1), c]);
  return { rows, blanks, id: Math.random() };
}

// Each column has its own color, so "these two make 10" is easy to see.
const SG_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7'];

export function SumGridRush({ onEnd }) {
  const seconds = 90;
  const left = useCountdown(seconds, true);
  const [g, setG] = useState(gridRound);
  const [filled, setFilled] = useState({});
  const [sel, setSel] = useState(0);
  const [score, setScore] = useState(0);
  const [bad, setBad] = useState(null);
  const [pop, setPop] = useState(null);
  useEndAtZero(left, score, onEnd);
  const key = (r, c) => `${r}-${c}`;
  const [sr, sc] = g.blanks[sel] || [0, 0];
  const partner = g.rows[1 - sr][sc];
  useEffect(() => {
    speak(`The two numbers in each column make 10. ${partner} and what make 10?`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g]);
  function pickBox(i) {
    setSel(i);
    const [r, c] = g.blanks[i];
    speak(`${g.rows[1 - r][c]} and what make 10?`);
  }
  function put(v) {
    if (left === 0) return;
    if (g.rows[sr][sc] === v) {
      playCorrectChime();
      const next = { ...filled, [key(sr, sc)]: v };
      setFilled(next);
      setPop(key(sr, sc));
      const open = g.blanks.findIndex(([rr, cc]) => next[key(rr, cc)] === undefined);
      if (open === -1) {
        setScore((s) => s + 1);
        speak('You did it!');
        setTimeout(() => {
          setG(gridRound());
          setFilled({});
          setSel(0);
          setPop(null);
        }, 700);
      } else {
        setSel(open);
        const [r, c] = g.blanks[open];
        speak(`${g.rows[1 - r][c]} and what make 10?`);
      }
    } else {
      playIncorrectBuzz();
      setBad(v);
      speak(`${partner} and ${v} make ${partner + v}. We need 10!`);
      setTimeout(() => setBad(null), 500);
    }
  }
  // A column the child filled in (columns with no empty box get no check).
  const colDone = (c) => g.blanks.some(([, cc]) => cc === c) && g.blanks.every(([r, cc]) => cc !== c || filled[key(r, cc)] !== undefined);
  return (
    <div className="game game-sumgrid">
      <TimerBar left={left} seconds={seconds} score={score} label="grids" />
      <div className="sgk-board">
        {[0, 1, 2, 3].map((c) => (
          <div key={c} className={`sgk-col${sc === c ? ' sgk-col-on' : ''}`} style={{ '--sgk': SG_COLORS[c] }}>
            <span className={`sgk-ten${colDone(c) ? ' sgk-ten-done' : ''}`}>{colDone(c) ? '✓ 10' : '10'}</span>
            {[0, 1].map((r) => {
              const bi = g.blanks.findIndex(([rr, cc]) => rr === r && cc === c);
              if (bi === -1) {
                return (
                  <span key={r} className="sgk-cell">
                    {g.rows[r][c]}
                  </span>
                );
              }
              const v = filled[key(r, c)];
              return (
                <button
                  key={r}
                  type="button"
                  className={`sgk-cell sgk-blank${sel === bi && v === undefined ? ' sgk-sel' : ''}${v !== undefined ? ' sgk-done' : ''}${pop === key(r, c) ? ' sgk-pop' : ''}`}
                  onClick={() => v === undefined && pickBox(bi)}
                  aria-label={v === undefined ? 'Empty box' : String(v)}
                >
                  {v ?? '?'}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="sgk-rows">Each row adds up to 20 too!</p>
      <button type="button" className="sgk-help" style={{ '--sgk': SG_COLORS[sc] }} onClick={() => speak(`${partner} and what make 10?`)}>
        {sr === 0 ? (
          <>
            <b>?</b> + {partner} = 10
          </>
        ) : (
          <>
            {partner} + <b>?</b> = 10
          </>
        )}
      </button>
      <div className="sgk-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 10].map((v) => (
          <button key={v} type="button" className={`sgk-key${v === 10 ? ' sgk-key-wide' : ''}${bad === v ? ' make10-bad sgk-key-bad' : ''}`} onClick={() => put(v)}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------ Shape Pattern Streak
export function PatternStreak({ onEnd }) {
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(2);
  const tier = streak < 4 ? 'easy' : streak < 9 ? 'medium' : 'hard';
  const [pr, setPr] = useState(() => TOPIC_BUILDERS.shapePattern('easy'));
  const [bad, setBad] = useState(null);
  useEffect(() => {
    speak('What comes next?');
  }, [pr]);
  function tap(c) {
    if (c === pr.correct) {
      playCorrectChime();
      const s = streak + 1;
      setStreak(s);
      setPr(TOPIC_BUILDERS.shapePattern(s < 4 ? 'easy' : s < 9 ? 'medium' : 'hard'));
    } else {
      playIncorrectBuzz();
      setBad(c);
      setTimeout(() => setBad(null), 400);
      if (lives <= 1) setTimeout(() => onEnd(streak), 500);
      else {
        setLives(lives - 1);
        speak('Oops! One heart left.');
      }
    }
  }
  return (
    <div className="game game-pattern">
      <div className="mm-top">
        <span className="mm-time">{'♥'.repeat(lives)}</span>
        <span className="mm-right">{streak} in a row</span>
      </div>
      <p className="game-ask">
        Level: {tier === 'easy' ? 'Easy' : tier === 'medium' ? 'Turning shapes' : 'Two patterns'}
      </p>
      <TopicVisual v={pr.visual} />
      <div className="shapes-grid">
        {pr.choices.map((c) => (
          <button key={c} type="button" className={`shapes-btn${bad === c ? ' make10-bad' : ''}`} onClick={() => tap(c)} aria-label={pr.choiceNames[c]}>
            <PatternShape id={c} color={pr.shapeColor} size={84} />
          </button>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------- Equal Differences
function diffRound(grade) {
  const unit = grade === '3' || grade === '4' ? 10 : 1;
  const hi = grade === '1' ? 60 : grade === '2' ? 99 : 999;
  let a;
  let b;
  do {
    b = rand(unit === 10 ? 110 : 11, Math.floor(hi * 0.6));
    a = rand(b + 5, hi);
  } while (b % 10 === 0 || (unit === 10 && b % 100 === 0));
  const target = unit === 10 ? Math.round(b / 10) * 10 : Math.round(b / 10) * 10;
  return { a, b, best: Math.abs(target - b), id: Math.random() };
}

export function EqualDiff({ grade, onEnd }) {
  const N = 6;
  const [n, setN] = useState(0);
  const [r, setR] = useState(() => diffRound(grade));
  const [shift, setShift] = useState(0);
  const [steps, setSteps] = useState(0);
  const [typed, setTyped] = useState('');
  const [score, setScore] = useState(0);
  const [note, setNote] = useState(null);
  useEffect(() => {
    speak(`${r.a} minus ${r.b}. Slide both numbers until the second one is a ten. Then subtract!`);
  }, [r]);
  const a = r.a + shift;
  const b = r.b + shift;
  const round = b % 10 === 0;
  function move(d) {
    playStickerPick();
    setShift((s) => s + d);
    setSteps((s) => s + 1);
  }
  function solve() {
    if (Number(typed) === r.a - r.b) {
      playCorrectChime();
      const pts = round && steps <= r.best ? 3 : round ? 2 : 1;
      const total = score + pts;
      setScore(total);
      setNote(`Yes! ${r.a} − ${r.b} = ${r.a - r.b}. +${pts} stars`);
      setTimeout(() => {
        if (n + 1 >= N) onEnd(total);
        else {
          setN(n + 1);
          setR(diffRound(grade));
          setShift(0);
          setSteps(0);
          setTyped('');
          setNote(null);
        }
      }, 1100);
    } else {
      playIncorrectBuzz();
      setTyped('');
      setNote('Not quite! The difference stays the same when both move together.');
    }
  }
  return (
    <div className="game game-diff">
      <RoundBar at={n + 1} of={N} word="Problem" score={score} label="stars" />
      <div className="game-question">
        {r.a} − {r.b}
      </div>
      <div className={`diff-now${round ? ' diff-round' : ''}`}>
        = {a} − {b}
      </div>
      <div className="bakery-actions">
        <button type="button" className="bakery-btn" onClick={() => move(-1)}>
          −1 both
        </button>
        <button type="button" className="bakery-btn bakery-add" onClick={() => move(1)}>
          +1 both
        </button>
      </div>
      <p className="game-ask">{round ? 'Easy now! What is the answer?' : `Make ${b} a ten number (fewest moves = 3 stars)`}</p>
      <NumPad value={typed} onChange={setTyped} onSubmit={solve} />
      {note && <p className="bakery-note">{note}</p>}
    </div>
  );
}

// -------------------------------------------------------- Times Table Tiles
function timesBoard(grade) {
  const tables = grade === '2' ? [2, 3, 4, 5, 10] : [2, 3, 4, 5, 6, 7, 8, 9];
  const facts = [];
  const used = new Set();
  while (facts.length < 6) {
    const t = pick(tables);
    const x = rand(2, grade === '2' ? 10 : 9);
    if (used.has(t * x)) continue;
    used.add(t * x);
    facts.push([t, x]);
  }
  const tiles = facts.flatMap(([t, x], i) => [
    { id: `f${i}`, label: `${t} × ${x}`, v: t * x, fact: true },
    { id: `a${i}`, label: String(t * x), v: t * x, fact: false },
  ]);
  return shuffle(tiles).map((t) => ({ ...t, gone: false }));
}

export function TimesTiles({ grade, onEnd }) {
  const seconds = 60;
  const left = useCountdown(seconds, true);
  const [tiles, setTiles] = useState(() => timesBoard(grade));
  const [picked, setPicked] = useState(null);
  const [bad, setBad] = useState([]);
  const [score, setScore] = useState(0);
  useEndAtZero(left, score, onEnd);
  useEffect(() => {
    speak('Match each times fact to its answer!');
  }, []);
  function tap(t) {
    if (left === 0 || t.gone) return;
    if (!picked) {
      playStickerPick();
      setPicked(t.id);
      return;
    }
    if (picked === t.id) return setPicked(null);
    const first = tiles.find((x) => x.id === picked);
    if (first.v === t.v && first.fact !== t.fact) {
      playCorrectChime();
      setScore((s) => s + 1);
      const next = tiles.map((x) => (x.id === t.id || x.id === picked ? { ...x, gone: true } : x));
      setTiles(next);
      setPicked(null);
      if (next.every((x) => x.gone)) setTimeout(() => setTiles(timesBoard(grade)), 350);
    } else {
      playIncorrectBuzz();
      setBad([picked, t.id]);
      setPicked(null);
      setTimeout(() => setBad([]), 450);
    }
    return undefined;
  }
  return (
    <div className="game game-times">
      <TimerBar left={left} seconds={seconds} score={score} label="matches" />
      <div className="times-grid">
        {tiles.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={t.gone}
            className={`times-tile${t.fact ? ' times-fact' : ''}${t.gone ? ' make10-gone' : ''}${picked === t.id ? ' make10-picked' : ''}${bad.includes(t.id) ? ' make10-bad' : ''}`}
            onClick={() => tap(t)}
          >
            {t.gone ? '' : t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------- Fraction Pizza Shop
const CUTS = { 2: [2, 3, 4], 3: [2, 3, 4, 6, 8], 4: [2, 3, 4, 5, 6, 8] };
function pizzaOrder(grade) {
  const dens = grade === '2' ? [2, 3, 4] : grade === '3' ? [2, 3, 4, 6, 8] : [3, 4, 5, 6, 8];
  const d = pick(dens);
  const nn = rand(1, d - 1);
  return { n: nn, d, who: pick(['Bunny', 'Bear', 'Fox', 'Panda', 'Frog']) };
}
const PIZZA_WHO = { Bunny: 'bunny', Bear: 'bear', Fox: 'fox', Panda: 'panda', Frog: 'frog' };

function Pizza({ slices, on, onTap }) {
  const R = 90;
  const paths = Array.from({ length: slices }, (_, i) => {
    const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / slices;
    const a1 = a0 + (2 * Math.PI) / slices;
    const p = (a) => `${100 + R * Math.cos(a)} ${100 + R * Math.sin(a)}`;
    return slices === 1 ? `M10 100 A90 90 0 1 1 190 100 A90 90 0 1 1 10 100` : `M100 100 L${p(a0)} A${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)} Z`;
  });
  return (
    <svg viewBox="0 0 200 200" className="pizza-pic">
      <circle cx="100" cy="100" r="96" fill="#e9b872" />
      {paths.map((d, i) => (
        <path key={i} d={d} fill={on.includes(i) ? '#e5484d' : '#ffe08a'} stroke="#c98a3a" strokeWidth="3" onClick={() => onTap(i)} style={{ cursor: 'pointer' }} />
      ))}
    </svg>
  );
}

export function PizzaShop({ grade, onEnd }) {
  const N = 6;
  const [n, setN] = useState(0);
  const [o, setO] = useState(() => pizzaOrder(grade));
  const [slices, setSlices] = useState(0);
  const [on, setOn] = useState([]);
  const [tries, setTries] = useState(0);
  const [coins, setCoins] = useState(0);
  const [note, setNote] = useState(null);
  const say = (x) => `${x.who} wants ${x.n} ${x.d === 2 ? 'half' : `out of ${x.d}`} of a pizza. Cut it, then tap the slices!`;
  useEffect(() => {
    speak(say(o));
  }, [o]); // eslint-disable-line react-hooks/exhaustive-deps
  function cut(k) {
    playStickerPick();
    setSlices(k);
    setOn([]);
  }
  function tapSlice(i) {
    playStickerPick();
    setOn((list) => (list.includes(i) ? list.filter((x) => x !== i) : [...list, i]));
  }
  function serve() {
    // Equal fractions count: 6 of 8 is 3 of 4.
    if (on.length * o.d === o.n * slices) {
      playCorrectChime();
      const pts = tries ? 1 : 3;
      const total = coins + pts;
      setCoins(total);
      setNote(slices === o.d ? `Yum! ${o.n}/${o.d}! +${pts} coins` : `Yum! ${on.length}/${slices} is the same as ${o.n}/${o.d}! +${pts} coins`);
      speak('Yum! Thank you!');
      setTimeout(() => {
        if (n + 1 >= N) onEnd(total);
        else {
          setN(n + 1);
          setO(pizzaOrder(grade));
          setSlices(0);
          setOn([]);
          setTries(0);
          setNote(null);
        }
      }, 1300);
    } else {
      playIncorrectBuzz();
      setTries((t) => t + 1);
      const line = slices % o.d !== 0 && o.d % slices !== 0 && (o.n * slices) % o.d !== 0 ? `Hmm, ${o.n}/${o.d} doesn't fit ${slices} slices. Try another cut!` : `That's ${on.length}/${slices}. I want ${o.n}/${o.d}!`;
      setNote(line);
      speak(line);
    }
  }
  return (
    <div className="game game-pizza">
      <RoundBar at={n + 1} of={N} word="Order" score={coins} label="coins" />
      <button type="button" className="bakery-order" onClick={() => speak(say(o))}>
        <Thing id={PIZZA_WHO[o.who]} size={56} />
        <span>
          <strong>
            I want <span className="frac">
              <i>{o.n}</i>
              <i>{o.d}</i>
            </span>{' '}
            of a pizza!
          </strong>
        </span>
      </button>
      <p className="game-ask">{slices ? `Tap the slices (${on.length} of ${slices})` : 'Cut the pizza into slices:'}</p>
      <div className="pizza-cuts">
        {CUTS[grade === '2' ? 2 : grade === '3' ? 3 : 4].map((k) => (
          <button key={k} type="button" className={`bakery-btn${slices === k ? ' bakery-add' : ''}`} onClick={() => cut(k)}>
            {k}
          </button>
        ))}
      </div>
      <Pizza slices={slices || 1} on={slices ? on : []} onTap={(i) => slices && tapSlice(i)} />
      {note && <p className="bakery-note">{note}</p>}
      <button type="button" className="pill-btn-primary pill-btn-full" disabled={!slices || !on.length} onClick={serve}>
        Serve it!
      </button>
    </div>
  );
}

// ------------------------------------------------------------- Logic Lock
// A code and true clues about it, picked until only the code fits. Each
// grade gets its own numbers and its own kinds of clues:
//   Pre-K  1 dial, 1 to 5: more than, less than, one more, one less
//   K      1 dial, 0 to 9: the same, plus "it is 2 + 3" and "between"
//   1st    2 dials, 10 to 59: tens and ones, 10 more / 10 less, odd or even
//   2nd    2 dials, 10 to 99: digit sums, double, more than, between
//   3rd    3 dials: place-value clues and rounding to the nearest ten or hundred
//   4th    3 dials: the 3rd grade clues plus multiples and digit products
const PLACE = ['hundreds', 'tens', 'ones'];
const LOCK_LEVELS = {
  p: { len: 1, lo: 1, hi: 5, max: 5, clues: [2, 3] },
  k: { len: 1, lo: 0, hi: 9, max: 9, clues: [2, 3] },
  1: { len: 2, lo: 10, hi: 59, max: 9, clues: [2, 3] },
  2: { len: 2, lo: 10, hi: 99, max: 9, clues: [2, 4] },
  3: { len: 3, lo: 100, hi: 999, max: 9, clues: [3, 4] },
  4: { len: 3, lo: 100, hi: 999, max: 9, clues: [3, 4] },
};
const lockDigits = (x, len) => String(x).padStart(len, '0').split('').map(Number);

function lockClues(code, grade, L) {
  const d = lockDigits(code, L.len);
  const places = L.len === 3 ? PLACE : ['tens', 'ones'];
  const cand = [];
  const c = (text, test) => cand.push([text, test]);

  if (L.len === 1) {
    // One "more than" and one "less than", close to the code.
    if (code > L.lo) {
      const a = rand(Math.max(L.lo, code - 3), code - 1);
      c(`It is more than ${a}.`, (x) => x > a);
    }
    if (code < L.hi) {
      const b = rand(code + 1, Math.min(L.hi, code + 3));
      c(`It is less than ${b}.`, (x) => x < b);
    }
    if (code > L.lo) c(`It is one more than ${code - 1}.`, (x) => x === code);
    if (code < L.hi) c(`It is one less than ${code + 1}.`, (x) => x === code);
    if (grade === 'k') {
      if (code >= 2) {
        const a = rand(1, code - 1);
        c(`It is ${a} + ${code - a}.`, (x) => x === code);
      }
      if (code - 1 >= L.lo && code + 1 <= L.hi) c(`It is between ${code - 1} and ${code + 1}.`, (x) => x > code - 1 && x < code + 1);
      if (code - 2 >= L.lo && code + 2 <= L.hi) c(`It is between ${code - 2} and ${code + 2}.`, (x) => x > code - 2 && x < code + 2);
    }
    return cand;
  }

  if (grade === '1') {
    const [t, o] = d;
    c(`It has ${t} ${t === 1 ? 'ten' : 'tens'}.`, (x) => Math.floor(x / 10) === t);
    c(`It has ${o} ${o === 1 ? 'one' : 'ones'}.`, (x) => x % 10 === o);
    c(code % 2 ? 'It is an odd number.' : 'It is an even number.', (x) => x % 2 === code % 2);
    if (code - 10 >= L.lo) c(`It is 10 more than ${code - 10}.`, (x) => x === code);
    if (code + 10 <= L.hi) c(`It is 10 less than ${code + 10}.`, (x) => x === code);
    if (o > t) c('The ones digit is bigger than the tens digit.', (x) => x % 10 > Math.floor(x / 10));
    if (o < t) c('The ones digit is smaller than the tens digit.', (x) => x % 10 < Math.floor(x / 10));
    const above = Math.max(L.lo - 1, code - rand(1, 4));
    c(`It is more than ${above}.`, (x) => x > above);
    return cand;
  }

  // 2nd grade and up.
  const sum = d.reduce((x, y) => x + y, 0);
  c(`The digits add up to ${sum}.`, (x) => lockDigits(x, L.len).reduce((p, q) => p + q, 0) === sum);
  c(code % 2 ? 'It is an odd number.' : 'It is an even number.', (x) => x % 2 === code % 2);
  for (let i = 0; i < L.len; i++) {
    for (let j = 0; j < L.len; j++) {
      if (i === j) continue;
      if (d[i] === 2 * d[j] && d[j]) c(`The ${places[i]} digit is double the ${places[j]} digit.`, (x) => lockDigits(x, L.len)[i] === 2 * lockDigits(x, L.len)[j]);
      if (d[i] - d[j] > 0 && d[i] - d[j] <= 3) c(`The ${places[i]} digit is ${d[i] - d[j]} more than the ${places[j]} digit.`, (x) => lockDigits(x, L.len)[i] - lockDigits(x, L.len)[j] === d[i] - d[j]);
    }
  }
  const step = 10 ** (L.len - 1);
  const floor = Math.floor(code / step) * step;
  c(`It is between ${floor} and ${floor + step}.`, (x) => x >= floor && x < floor + step);
  if (new Set(d).size === L.len) c('All the digits are different.', (x) => new Set(lockDigits(x, L.len)).size === L.len);
  if (grade === '3' || grade === '4') {
    const ten = Math.round(code / 10) * 10;
    // (Not when it rounds up to 1000: a 3-digit lock saying 1000 is confusing.)
    if (ten < 1000) c(`Rounded to the nearest ten, it is ${ten}.`, (x) => Math.round(x / 10) * 10 === ten);
    const hun = Math.round(code / 100) * 100;
    if (hun < 1000) c(`Rounded to the nearest hundred, it is ${hun}.`, (x) => Math.round(x / 100) * 100 === hun);
  }
  if (grade === '4') {
    for (const m of [3, 4, 5, 6, 9]) if (code % m === 0) c(`It is a multiple of ${m}.`, (x) => x % m === 0);
    const prod = d.reduce((x, y) => x * y, 1);
    if (prod) c(`The digits multiply to ${prod}.`, (x) => lockDigits(x, L.len).reduce((p, q) => p * q, 1) === prod);
  }
  return cand;
}

function lockRound(grade) {
  const L = LOCK_LEVELS[grade] || LOCK_LEVELS[2];
  const all = Array.from({ length: L.hi - L.lo + 1 }, (_, i) => L.lo + i);
  for (let tries = 0; tries < 300; tries++) {
    const code = rand(L.lo, L.hi);
    // Pick clues until only the code is left.
    const picked = [];
    let left = all;
    for (const [text, test] of shuffle(lockClues(code, grade, L))) {
      const next = left.filter(test);
      if (next.length < left.length) {
        picked.push(text);
        left = next;
      }
      if (left.length === 1) break;
    }
    if (left.length === 1 && picked.length >= L.clues[0] && picked.length <= L.clues[1]) return { code, len: L.len, max: L.max, clues: picked, id: Math.random() };
  }
  const code = L.len === 1 ? L.lo + 2 : L.len === 2 ? 42 : 246;
  return { code, len: L.len, max: L.max, clues: [`It is ${code}.`], id: 0 };
}

// The padlock: a metal shackle, a polished gold body with rivets and a
// keyhole, and number wheels that roll when turned (the digits above and
// below peek out). A miss rattles it; the right code lights the wheels
// green one by one and the shackle pops up and swings open.
const Chevron = ({ up }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path d={up ? 'M5 15l7-7 7 7' : 'M5 9l7 7 7-7'} fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
function Padlock({ dials, known, rolls, max, open, rattle, lockId, onTurn }) {
  const M = max + 1;
  const body = useRef(null);
  // Rattle on each miss (restart the animation in place).
  useEffect(() => {
    const el = body.current;
    if (!rattle || !el) return;
    el.classList.remove('padlock-rattle');
    void el.offsetWidth;
    el.classList.add('padlock-rattle');
  }, [rattle]);
  return (
    <div key={lockId} className={`padlock${open ? ' padlock-open' : ''}`}>
      <svg viewBox="0 0 120 92" className="padlock-shackle" aria-hidden="true">
        <defs>
          <linearGradient id="shackle-metal" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#8b95a8" />
            <stop offset="0.3" stopColor="#eef2f8" />
            <stop offset="0.55" stopColor="#b7c0cf" />
            <stop offset="1" stopColor="#6b7486" />
          </linearGradient>
        </defs>
        <path d="M28 92V46a32 32 0 0 1 64 0v46" fill="none" stroke="#5b6478" strokeWidth="19" />
        <path d="M28 92V46a32 32 0 0 1 64 0v46" fill="none" stroke="url(#shackle-metal)" strokeWidth="15" />
        <path d="M34 60V46a26 26 0 0 1 20-25" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div ref={body} className="padlock-body">
        <span className="padlock-shine" aria-hidden="true" />
        {['tl', 'tr', 'bl', 'br'].map((c) => (
          <span key={c} className={`padlock-rivet padlock-rivet-${c}`} aria-hidden="true" />
        ))}
        <div className="padlock-dials">
          {dials.map((v, i) => {
            const roll = rolls[i] || { dir: 0, n: 0 };
            return (
              <div key={i} className={`pl-dial${known[i] ? ' pl-dial-known' : ''}`} style={{ '--i': i }}>
                <button type="button" className="pl-btn" onClick={() => onTurn(i, 1)} disabled={known[i] || open} aria-label="Up">
                  <Chevron up />
                </button>
                <div className="pl-window">
                  <div key={roll.n} className={`pl-strip pl-roll-${roll.dir > 0 ? 'up' : roll.dir < 0 ? 'down' : 'pop'}`}>
                    <span>{(v + M - 1) % M}</span>
                    <span className="pl-cur">{v}</span>
                    <span>{(v + 1) % M}</span>
                  </div>
                  {known[i] && (
                    <span className="pl-badge" aria-hidden="true">
                      ★
                    </span>
                  )}
                </div>
                <button type="button" className="pl-btn" onClick={() => onTurn(i, -1)} disabled={known[i] || open} aria-label="Down">
                  <Chevron />
                </button>
              </div>
            );
          })}
        </div>
        <span className="padlock-keyhole" aria-hidden="true" />
      </div>
      {open && (
        <span className="padlock-burst" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} style={{ '--a': `${i * 30}deg` }} />
          ))}
        </span>
      )}
    </div>
  );
}

// Hints for the lock: the first explains one clue; then digits are shown.
function clueTip(c) {
  // The clues each grade gets (Pre-K to 1st, and rounding/multiples for 3rd and 4th).
  let m = c.match(/^It is more than (\d+)/);
  if (m) return `The code is bigger than ${m[1]}. Count up from ${m[1]}.`;
  m = c.match(/^It is less than (\d+)/);
  if (m) return `The code is smaller than ${m[1]}. Count down from ${m[1]}.`;
  m = c.match(/one more than (\d+)/);
  if (m) return `One more than ${m[1]} is the number right after ${m[1]}.`;
  m = c.match(/one less than (\d+)/);
  if (m) return `One less than ${m[1]} is the number right before ${m[1]}.`;
  m = c.match(/It is (\d+) \+ (\d+)/);
  if (m) return `Start at ${m[1]} and count on ${m[2]} more.`;
  m = c.match(/10 more than (\d+)/);
  if (m) return `10 more means one more ten: only the tens digit of ${m[1]} goes up.`;
  m = c.match(/10 less than (\d+)/);
  if (m) return `10 less means one less ten: only the tens digit of ${m[1]} goes down.`;
  if (/has \d+ tens?\./.test(c)) return 'The tens digit tells you how many tens.';
  if (/has \d+ ones?\./.test(c)) return 'The ones digit is the last digit.';
  m = c.match(/nearest ten, it is (\d+)/);
  if (m) return `Numbers that round to ${m[1]} go from ${+m[1] - 5} to ${+m[1] + 4}.`;
  m = c.match(/nearest hundred, it is (\d+)/);
  if (m) return `Numbers that round to ${m[1]} go from ${+m[1] - 50} to ${+m[1] + 49}.`;
  m = c.match(/multiple of (\d+)/);
  if (m) return `A multiple of ${m[1]} is in the ${m[1]} times table.`;
  m = c.match(/multiply to (\d+)/);
  if (m) return `Find digits that multiply to ${m[1]}: try its times-table facts.`;
  if (/bigger than the tens digit/.test(c)) return 'The last digit is bigger than the first one.';
  if (/smaller than the tens digit/.test(c)) return 'The last digit is smaller than the first one.';
  m = c.match(/between (\d+) and (\d+)/);
  if (m) return `The code is ${m[1]} or more, but less than ${m[2]}. So what is the first digit?`;
  m = c.match(/add up to (\d+)/);
  if (m) return `Find digits that add up to ${m[1]}, then check them with the other clues.`;
  if (/even/.test(c)) return 'Even numbers end in 0, 2, 4, 6 or 8.';
  if (/odd/.test(c)) return 'Odd numbers end in 1, 3, 5, 7 or 9.';
  if (/double/.test(c)) return 'Double means two times as much: 6 is double 3, and 8 is double 4.';
  m = c.match(/(\d+) more than/);
  if (m) return `Pick a digit, then add ${m[1]} to it for the other one.`;
  if (/different/.test(c)) return 'No digit can be used twice.';
  return 'Try one clue at a time, and turn the dials to match it.';
}

// The surprise inside each opened lock: a different friend, doing a
// different dance, with a number fact, every time.
const SURPRISE_THINGS = ['panda', 'fox', 'bunny', 'frog', 'monkey', 'turtle', 'butterfly', 'duck', 'cat', 'dog', 'bear', 'fish', 'cupcake', 'donut', 'strawberry', 'balloon'];
const SURPRISE_MOVES = [
  ['spin', 'spinning'],
  ['bounce', 'bouncing'],
  ['wiggle', 'wiggling'],
  ['float', 'floating'],
  ['grow', 'growing'],
  ['flip', 'flipping'],
];
const SURPRISE_BG = ['#ffd23f', '#ff8fb1', '#7fd8ff', '#b8f2c8', '#d9b8ff', '#ffb870'];
const FACTS = [
  'A spider has 8 legs.',
  'An octopus has 3 hearts.',
  'A week has 7 days.',
  'A starfish has 5 arms.',
  'Bees build honeycomb out of hexagons: shapes with 6 sides.',
  'A year has 12 months.',
  'Snowflakes have 6 points.',
  'A piano has 88 keys.',
  'There are 60 seconds in a minute.',
  'Opposite sides of a dice always add up to 7.',
  'A soccer team has 11 players on the field.',
  '3 cats have 12 legs: 4 + 4 + 4.',
  'A clock goes around 2 times every day.',
  'An ant has 6 legs, so 2 ants have 12.',
];
function surprise(last) {
  let s;
  do {
    s = { thing: pick(SURPRISE_THINGS), move: pick(SURPRISE_MOVES), bg: pick(SURPRISE_BG), fact: pick(FACTS) };
  } while (last && (s.thing === last.thing || s.move === last.move || s.fact === last.fact));
  return s;
}

function Surprise({ s, onNext, last }) {
  return (
    <div className="lock-surprise" style={{ '--sbg': s.bg }}>
      <Confetti />
      <p className="lock-surprise-title">Surprise!</p>
      <div className="lock-chest" aria-hidden="true">
        <span className="lock-chest-lid" />
        <span className="lock-chest-box" />
        <span className={`lock-surprise-thing surprise-${s.move[0]}`}>
          <Thing id={s.thing} size={110} />
        </span>
      </div>
      <p className="lock-surprise-what">
        A {s.move[1]} {s.thing}!
      </p>
      <p className="lock-surprise-fact">{s.fact}</p>
      <button type="button" className="pill-btn-primary pill-btn-full" onClick={onNext}>
        {last ? 'Finish' : 'Next lock →'}
      </button>
    </div>
  );
}

// Five locks, one padlock off the treasure chest each. Two kinds of help:
// "Need a hint?" (the first explains a clue, the next ones show a digit,
// never all of them; each hint costs a star), and Pip's help after a miss
// (the 1st reads the clues again; from the 2nd on Pip fills in a digit per
// miss), so every lock opens in the end. Each opened lock has a surprise
// inside (a friend doing a dance, with a number fact); after the last one
// the chest flies open and a treasure pops out.
export function LogicLock({ grade, onEnd, playerId }) {
  const N = 5;
  const [n, setN] = useState(0);
  const [r, setR] = useState(() => lockRound(grade));
  const [dials, setDials] = useState(() => Array(r.len).fill(0));
  // Digits filled in for the kid (by a hint or by Pip): green, and fixed.
  const [known, setKnown] = useState(() => Array(r.len).fill(false));
  const [tries, setTries] = useState(0);
  const [hints, setHints] = useState(0);
  const [tip, setTip] = useState(null);
  const [score, setScore] = useState(0);
  const [note, setNote] = useState(null);
  const [open, setOpen] = useState(false);
  const [prize, setPrize] = useState(null);
  const lastPrize = useRef(null);
  const [party, setParty] = useState(null);
  const [chestOpen, setChestOpen] = useState(false);
  // How each dial last turned (for the rolling digits) and a rattle on a miss.
  const [rolls, setRolls] = useState(() => Array(r.len).fill({ dir: 0, n: 0 }));
  const [rattle, setRattle] = useState(0);
  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const digits = lockDigits(r.code, r.len);
  const places = r.len === 3 ? PLACE : r.len === 2 ? ['tens', 'ones'] : ['ones'];
  // Hint 1 explains a clue; then a digit at a time (never all of them).
  const maxHints = 1 + (r.len - 1);
  useEffect(() => {
    speak(`Crack the code! ${r.clues.join(' ')}`);
    setDials(Array(r.len).fill(0));
    setKnown(Array(r.len).fill(false));
    setRolls(Array(r.len).fill({ dir: 0, n: 0 }));
    setHints(0);
    setTip(null);
  }, [r]);
  function turn(i, d) {
    if (known[i] || open) return;
    playStickerPick();
    setDials((list) => list.map((v, k) => (k === i ? (v + d + r.max + 1) % (r.max + 1) : v)));
    setRolls((list) => list.map((x, k) => (k === i ? { dir: d, n: x.n + 1 } : x)));
  }
  // Fill in digit i for the kid.
  function reveal(i) {
    setKnown((list) => list.map((v, k) => (k === i ? true : v)));
    setDials((list) => list.map((v, k) => (k === i ? digits[i] : v)));
    setRolls((list) => list.map((x, k) => (k === i ? { dir: 0, n: x.n + 1 } : x)));
  }
  function hint() {
    if (hints >= maxHints || open) return;
    playStickerPick();
    setNote(null);
    if (hints === 0) {
      const line = clueTip(r.clues[0]);
      setTip(line);
      speak(line);
    } else {
      const i = [0, r.len - 1, 1].find((k) => !known[k]);
      if (i === undefined) return;
      reveal(i);
      const line = `The ${places[i]} digit is ${digits[i]}.`;
      setTip(line);
      speak(line);
    }
    setHints((h) => h + 1);
  }
  function tryOpen() {
    if (open) return;
    const guess = Number(dials.join(''));
    if (guess === r.code) {
      playCorrectChime();
      setOpen(true);
      setTip(null);
      const pts = Math.max(1, (tries === 0 ? 3 : tries === 1 ? 2 : 1) - hints);
      setScore((sc) => sc + pts);
      setNote(`Click! It opened! +${pts} ${pts === 1 ? 'star' : 'stars'}`);
      const s = surprise(lastPrize.current);
      lastPrize.current = s;
      later(() => {
        setPrize(s);
        speak(`Surprise! A ${s.move[1]} ${s.thing}! ${s.fact}`);
      }, 1100);
      return;
    }
    playIncorrectBuzz();
    setRattle((x) => x + 1);
    setTip(null);
    const t = tries + 1;
    setTries(t);
    if (t === 1) {
      setNote('Still locked. Tap each clue to hear it again, or tap Need a hint!');
      speak(`Still locked. Let's read the clues again. ${r.clues.join(' ')}`);
      return;
    }
    // Pip fills in a digit: a wrong one first.
    let i = digits.findIndex((d, k) => !known[k] && dials[k] !== d);
    if (i < 0) i = known.findIndex((k) => !k);
    if (i < 0) return;
    reveal(i);
    if (r.len === 1) {
      setNote(`Pip's help: it's ${digits[i]}!`);
      speak(`Here's some help! The code is ${digits[i]}. It's green now. Tap open!`);
    } else {
      setNote(`Pip's help: the ${places[i]} digit is ${digits[i]}!`);
      speak(`Here's some help! The ${places[i]} digit is ${digits[i]}. It's green now. Try again!`);
    }
  }
  function next() {
    setPrize(null);
    if (n + 1 >= N) {
      // The last lock: the treasure chest opens.
      const found = addReward(playerId, 'chests');
      const treasure = TREASURES[(found - 1) % TREASURES.length];
      setParty({ found, treasure });
      playStickerStick();
      speak(`You opened the treasure chest! You found ${treasure.en}!`);
      later(() => setChestOpen(true), 700);
      return;
    }
    setN(n + 1);
    setR(lockRound(grade));
    setTries(0);
    setNote(null);
    setOpen(false);
  }
  if (prize) return <Surprise s={prize} onNext={next} last={n + 1 >= N} />;
  return (
    <div className="game game-lock">
      <RoundBar at={n + 1} of={N} word="Lock" score={score} label="stars" />
      <div className="lock-chest-row">
        <TreasureChest total={N} opened={n + (open ? 1 : 0)} size={96} />
        <span className="lock-chest-text">{N - n - (open ? 1 : 0) ? `${N - n - (open ? 1 : 0)} more to open the treasure!` : 'Treasure time!'}</span>
      </div>
      <ol className="lock-clues">
        {r.clues.map((c) => (
          <li key={c}>
            <button type="button" onClick={() => speak(c)}>
              {c}
            </button>
          </li>
        ))}
      </ol>
      <Padlock dials={dials} known={known} rolls={rolls} max={r.max} open={open} rattle={rattle} lockId={r.id} onTurn={turn} />
      {tip && (
        <button type="button" className="lock-tip" onClick={() => speak(tip)}>
          {tip}
        </button>
      )}
      {note && (
        <p className={`bakery-note${open ? ' bakery-note-good' : ''}${tries >= 2 && !open ? ' bakery-note-pip' : ''}`}>
          {tries >= 2 && !open && <Pip size={34} mood="wave" />}
          <span>{note}</span>
        </p>
      )}
      <div className="lock-actions">
        <button type="button" className="lock-hint-btn" onClick={hint} disabled={hints >= maxHints || open || known.every(Boolean)}>
          <Icon name="bulb" /> {hints === 0 ? 'Need a hint?' : hints >= maxHints ? 'No more hints' : 'Another hint'}
        </button>
        <button type="button" className="pill-btn-primary lock-open-btn" onClick={tryOpen} disabled={open}>
          Open the lock
        </button>
      </div>
      {party && (
        <Finale
          title="You opened the treasure chest!"
          line={`You found ${party.treasure.en}! Treasures found: ${party.found}`}
          button="Awesome! →"
          onDone={() => onEnd(score)}
        >
          <TreasureChest total={N} opened={N} open={chestOpen} treasure={party.treasure.id} size={190} />
        </Finale>
      )}
    </div>
  );
}
