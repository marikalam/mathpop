import { useEffect, useMemo, useRef, useState } from 'react';
import { Thing } from './Drawings.jsx';
import TopicVisual, { PatternShape } from './TopicVisual.jsx';
import { TOPIC_BUILDERS } from './topics.js';
import { storyNames } from './storyNames.js';
import { playCorrectChime, playIncorrectBuzz, playStickerPick, playStickerStick, speak } from './sound.js';
import Pip from './Pip.jsx';
import { Finale, TREASURES, TreasureChest, addReward } from './Rewards.jsx';
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
const BAR_ITEMS = ['stickers', 'marbles', 'shells', 'cards', 'beads', 'stamps'];
function barProblem(grade) {
  const top = big(grade);
  const [p, q] = storyNames(2);
  const item = pick(BAR_ITEMS);
  const kind = pick(['total', 'part', 'more', 'compareTotal']);
  const a = rand(Math.ceil(top * 0.2), Math.floor(top * 0.55));
  const b = rand(Math.ceil(top * 0.1), Math.floor(top * 0.4));
  if (kind === 'total') {
    return { model: 'partWhole', text: `${p} has ${a} ${item}. ${q} has ${b} ${item}. How many do they have altogether?`, bars: [a, b], whole: '?', answer: a + b };
  }
  if (kind === 'part') {
    return { model: 'partWhole', text: `${p} and ${q} have ${a + b} ${item} altogether. ${p} has ${a}. How many does ${q} have?`, bars: [a, '?'], whole: a + b, answer: b, sizes: [a, b] };
  }
  if (kind === 'more') {
    const big2 = a + b;
    return { model: 'compare', text: `${p} has ${big2} ${item}. ${q} has ${a}. How many more does ${p} have?`, top: big2, bottom: a, diff: '?', answer: b };
  }
  return { model: 'compare', text: `${p} has ${a} ${item}. ${q} has ${b} more than ${p}. How many does ${q} have?`, top: a, bottom: a + b, flip: true, diff: b, answer: a + b };
}

function BarPic({ pr, which }) {
  // which: the model drawn ('partWhole' or 'compare'), with this problem's labels.
  const W = 300;
  if (which === 'partWhole') {
    const sizes = pr.model === 'partWhole' ? pr.sizes || pr.bars : [pr.bottom, pr.answer];
    const total = sizes[0] + sizes[1];
    const w0 = Math.max(60, Math.round((sizes[0] / total) * (W - 20)));
    const labels = pr.model === 'partWhole' ? pr.bars : ['', ''];
    return (
      <svg viewBox={`0 0 ${W} 90`} className="bar-pic">
        <rect x="10" y="30" width={w0} height="34" rx="6" fill="#5aa9ff" />
        <rect x={10 + w0} y="30" width={W - 20 - w0} height="34" rx="6" fill="#ffb84d" />
        <text x={10 + w0 / 2} y="53" textAnchor="middle" className="bar-txt">{labels[0]}</text>
        <text x={10 + w0 + (W - 20 - w0) / 2} y="53" textAnchor="middle" className="bar-txt">{labels[1]}</text>
        <path d={`M10 22 V14 H${W - 10} V22`} fill="none" stroke="#173a66" strokeWidth="2.5" />
        <text x={W / 2} y="11" textAnchor="middle" className="bar-txt bar-txt-small">{pr.model === 'partWhole' ? pr.whole : ''}</text>
      </svg>
    );
  }
  const topV = pr.model === 'compare' ? Math.min(pr.top, pr.bottom) : pr.bars[0];
  const botV = pr.model === 'compare' ? Math.max(pr.top, pr.bottom) : pr.bars[0] + (pr.sizes ? pr.sizes[1] : pr.bars[1]);
  const wSmall = Math.max(70, Math.round((topV / botV) * (W - 20)));
  const small = pr.model === 'compare' ? (pr.flip ? pr.top : pr.bottom) : '';
  const large = pr.model === 'compare' ? (pr.flip ? '?' : pr.top) : '';
  return (
    <svg viewBox={`0 0 ${W} 110`} className="bar-pic">
      <rect x="10" y="12" width={W - 20} height="30" rx="6" fill="#5aa9ff" />
      <text x={W / 2} y="33" textAnchor="middle" className="bar-txt">{large}</text>
      <rect x="10" y="62" width={wSmall} height="30" rx="6" fill="#ffb84d" />
      <text x={10 + wSmall / 2} y="83" textAnchor="middle" className="bar-txt">{small}</text>
      <path d={`M${10 + wSmall} 98 H${W - 10}`} stroke="#e5484d" strokeWidth="2.5" strokeDasharray="5 4" />
      <text x={(10 + wSmall + W - 10) / 2} y="80" textAnchor="middle" className="bar-txt bar-txt-red">{pr.model === 'compare' ? pr.diff : ''}</text>
    </svg>
  );
}

export function BarModel({ grade, onEnd }) {
  const N = 6;
  const [n, setN] = useState(0);
  const [pr, setPr] = useState(() => barProblem(grade));
  const [step, setStep] = useState('model');
  const [typed, setTyped] = useState('');
  const [score, setScore] = useState(0);
  const [miss, setMiss] = useState(false);
  const [note, setNote] = useState(null);
  const order = useRef(shuffle(['partWhole', 'compare']));
  useEffect(() => {
    speak(`${pr.text} First, pick the bar model.`);
    order.current = shuffle(['partWhole', 'compare']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pr]);

  function pickModel(m) {
    if (m === pr.model) {
      playCorrectChime();
      setStep('solve');
      setNote(null);
      speak('Yes! Now solve it.');
    } else {
      playIncorrectBuzz();
      setMiss(true);
      setNote(pr.model === 'partWhole' ? 'Two parts make a whole here. Try the other one!' : 'We are comparing two amounts here. Try the other one!');
    }
  }
  function solve() {
    if (Number(typed) === pr.answer) {
      playCorrectChime();
      const pts = miss ? 1 : 3;
      const total = score + pts;
      setScore(total);
      setNote(`Yes! ${pr.answer}. +${pts} stars`);
      setTimeout(() => {
        if (n + 1 >= N) onEnd(total);
        else {
          setN(n + 1);
          setPr(barProblem(grade));
          setStep('model');
          setTyped('');
          setMiss(false);
          setNote(null);
        }
      }, 1000);
    } else {
      playIncorrectBuzz();
      setMiss(true);
      setTyped('');
      setNote('Not quite. Look at the bar model and try again!');
    }
  }
  return (
    <div className="game game-bar">
      <RoundBar at={n + 1} of={N} word="Problem" score={score} label="stars" />
      <button type="button" className="game-story" onClick={() => speak(pr.text)}>
        {pr.text}
      </button>
      {step === 'model' ? (
        <>
          <p className="game-ask">Which bar model fits?</p>
          {order.current.map((m) => (
            <button key={m} type="button" className="bar-choice" onClick={() => pickModel(m)}>
              <BarPic pr={pr} which={m} />
              <span>{m === 'partWhole' ? 'Part + part = whole' : 'Compare two amounts'}</span>
            </button>
          ))}
        </>
      ) : (
        <>
          <div className="bar-choice bar-chosen">
            <BarPic pr={pr} which={pr.model} />
          </div>
          <NumPad value={typed} onChange={setTyped} onSubmit={solve} />
        </>
      )}
      {note && <p className="bakery-note">{note}</p>}
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

export function SumGridRush({ onEnd }) {
  const seconds = 90;
  const left = useCountdown(seconds, true);
  const [g, setG] = useState(gridRound);
  const [filled, setFilled] = useState({});
  const [sel, setSel] = useState(0);
  const [score, setScore] = useState(0);
  const [bad, setBad] = useState(false);
  useEndAtZero(left, score, onEnd);
  useEffect(() => {
    speak('Each column makes 10. Each row makes 20. Fill the empty boxes!');
  }, []);
  const key = (r, c) => `${r}-${c}`;
  function put(v) {
    if (left === 0) return;
    const [r, c] = g.blanks[sel];
    if (g.rows[r][c] === v) {
      playCorrectChime();
      const next = { ...filled, [key(r, c)]: v };
      setFilled(next);
      const open = g.blanks.findIndex(([rr, cc]) => next[key(rr, cc)] === undefined);
      if (open === -1) {
        setScore((s) => s + 1);
        setTimeout(() => {
          setG(gridRound());
          setFilled({});
          setSel(0);
        }, 350);
      } else setSel(open);
    } else {
      playIncorrectBuzz();
      setBad(true);
      setTimeout(() => setBad(false), 400);
    }
  }
  return (
    <div className="game game-sumgrid">
      <TimerBar left={left} seconds={seconds} score={score} label="grids" />
      <div className={`sg-grid${bad ? ' make10-bad' : ''}`}>
        <span />
        {[0, 1, 2, 3].map((c) => (
          <span key={c} className="sg-head">10</span>
        ))}
        {[0, 1].map((r) => [
          <span key={`h${r}`} className="sg-head sg-row">20</span>,
          ...[0, 1, 2, 3].map((c) => {
            const bi = g.blanks.findIndex(([rr, cc]) => rr === r && cc === c);
            if (bi === -1) return <span key={key(r, c)} className="sg-cell">{g.rows[r][c]}</span>;
            const v = filled[key(r, c)];
            return (
              <button key={key(r, c)} type="button" className={`sg-cell sg-blank${sel === bi && v === undefined ? ' sg-sel' : ''}`} onClick={() => v === undefined && setSel(bi)}>
                {v ?? '?'}
              </button>
            );
          }),
        ])}
      </div>
      <div className="sg-pad">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
          <button key={v} type="button" className="mm-key" onClick={() => put(v)}>
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

// Five locks, one padlock off the treasure chest each. A miss is never a
// dead end: the 1st reads the clues again, and from the 2nd on Pip fills
// in one digit per miss (turned green), so every lock opens in the end.
// After the last lock the chest flies open and a treasure pops out.
export function LogicLock({ grade, onEnd, playerId }) {
  const N = 5;
  const [n, setN] = useState(0);
  const [r, setR] = useState(() => lockRound(grade));
  const [dials, setDials] = useState(() => Array(r.len).fill(0));
  const [known, setKnown] = useState(() => Array(r.len).fill(false));
  const [tries, setTries] = useState(0);
  const [score, setScore] = useState(0);
  const [note, setNote] = useState(null);
  const [open, setOpen] = useState(false);
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
  useEffect(() => {
    speak(`Crack the code! ${r.clues.join(' ')}`);
    setDials(Array(r.len).fill(0));
    setKnown(Array(r.len).fill(false));
    setRolls(Array(r.len).fill({ dir: 0, n: 0 }));
  }, [r]);
  function turn(i, d) {
    if (known[i] || open) return;
    playStickerPick();
    setDials((list) => list.map((v, k) => (k === i ? (v + d + r.max + 1) % (r.max + 1) : v)));
    setRolls((list) => list.map((x, k) => (k === i ? { dir: d, n: x.n + 1 } : x)));
  }
  function tryOpen() {
    if (open) return;
    const guess = Number(dials.join(''));
    if (guess === r.code) {
      playCorrectChime();
      setOpen(true);
      const pts = tries === 0 ? 3 : tries === 1 ? 2 : 1;
      const total = score + pts;
      setScore(total);
      setNote(`Click! It opened! +${pts} stars`);
      later(() => {
        if (n + 1 >= N) {
          const found = addReward(playerId, 'chests');
          const treasure = TREASURES[(found - 1) % TREASURES.length];
          setParty({ found, treasure, total });
          playStickerStick();
          speak(`You opened the treasure chest! You found ${treasure.en}!`);
          later(() => setChestOpen(true), 700);
        } else {
          setN(n + 1);
          setR(lockRound(grade));
          setTries(0);
          setNote(null);
          setOpen(false);
        }
      }, 1200);
      return;
    }
    playIncorrectBuzz();
    setRattle((n) => n + 1);
    const t = tries + 1;
    setTries(t);
    if (t === 1) {
      setNote('Still locked. Tap each clue to hear it again!');
      speak(`Still locked. Let's read the clues again. ${r.clues.join(' ')}`);
      return;
    }
    // Pip fills in a digit: a wrong one first.
    let i = digits.findIndex((d, k) => !known[k] && dials[k] !== d);
    if (i < 0) i = known.findIndex((k) => !k);
    if (i < 0) return;
    setKnown((list) => list.map((v, k) => (k === i ? true : v)));
    setDials((list) => list.map((v, k) => (k === i ? digits[i] : v)));
    setRolls((list) => list.map((x, k) => (k === i ? { dir: 0, n: x.n + 1 } : x)));
    if (r.len === 1) {
      setNote(`Pip's help: it's ${digits[i]}!`);
      speak(`Here's some help! The code is ${digits[i]}. It's green now. Tap open!`);
    } else {
      setNote(`Pip's help: the ${places[i]} digit is ${digits[i]}!`);
      speak(`Here's some help! The ${places[i]} digit is ${digits[i]}. It's green now. Try again!`);
    }
  }
  return (
    <div className="game game-lock">
      <RoundBar at={n + 1} of={N} word="Lock" score={score} label="stars" />
      <div className="lock-chest-row">
        <TreasureChest total={N} opened={n + (open ? 1 : 0)} size={140} />
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
      {note && (
        <p className={`bakery-note${open ? ' bakery-note-good' : ''}${tries >= 2 && !open ? ' bakery-note-pip' : ''}`}>
          {tries >= 2 && !open && <Pip size={34} mood="wave" />}
          <span>{note}</span>
        </p>
      )}
      <button type="button" className="pill-btn-primary pill-btn-full" disabled={open} onClick={tryOpen}>
        Open the lock
      </button>
      {party && (
        <Finale
          title="You opened the treasure chest!"
          line={`You found ${party.treasure.en}! Treasures found: ${party.found}`}
          button="Awesome! →"
          onDone={() => onEnd(party.total)}
        >
          <TreasureChest total={N} opened={N} open={chestOpen} treasure={party.treasure.id} size={190} />
        </Finale>
      )}
    </div>
  );
}
