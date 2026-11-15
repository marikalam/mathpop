import { useEffect, useMemo, useRef, useState } from 'react';
import { Thing } from './Drawings.jsx';
import { rand, shuffle } from './gameKit.jsx';
import { playCorrectChime, playIncorrectBuzz, playStickerPick, playStickerStick, speak } from './sound.js';
import { Bar, TenFrames } from './ThinkCard.jsx';
import { sgSettings } from './sgMode.js';
import { PuzzleTop, VALUE_COLORS, dots, labelSize, sayValue, useLevel, valueKeys, waysOf } from './puzzleKit.jsx';

// Puzzle games, each with levels inside (saved for each player and grade):
//   ValueSort   sort number cards into tubes by what they're worth (5, 2 + 3, ●●●●●)
//   DoubleUp    slide tiles; two the same join into their double
//   TakeTen     clear pairs that make 10 (or are the same) when nothing is between
//   CrossSums   cross out numbers until each row and column makes its total
//   AreaBoxes   draw boxes: each has one number, and that many squares
//   PetSudoku   every pet (or number) once in each row, column and box

// A board done: a cheer and a "Level up!", then the next board (or the end).
function useBoards(boards, onEnd, levelUp) {
  const [done, setDone] = useState(0);
  const [banner, setBanner] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  function boardDone(score, next) {
    playStickerStick();
    const lv = levelUp();
    const n = done + 1;
    setDone(n);
    setBanner(n >= boards ? 'You did it!' : `Level ${lv}!`);
    speak(n >= boards ? 'You did it!' : `Level up! Level ${lv}!`);
    timer.current = setTimeout(() => {
      setBanner(null);
      if (n >= boards) onEnd(score);
      else next(lv);
    }, 1500);
  }
  return { done, banner, boardDone };
}
const Banner = ({ text }) => (text ? <div className="pz-banner">{text}</div> : null);

// ------------------------------------------------------------ Value Sort
// Jars with a number on each; one card at a time ("2 + 3", "●●●●●",
// "10 − 2"): tap the jar it's worth. A miss says what the card makes,
// then the right jar glows. Fill every jar to finish the level.
function sortBoard(grade, level) {
  const little = grade === 'p';
  const n = little ? Math.min(3, 2 + Math.floor((level - 1) / 2)) : Math.min(5, 3 + Math.floor((level - 1) / 2));
  const per = little ? 2 : 3;
  const keys = valueKeys(grade, n).sort((a, b) => (grade === '4' ? 0 : Number(a) - Number(b)));
  let id = 0;
  const cards = keys.flatMap((key, ki) => {
    // The cards say the value a different way from the jar (toddlers: dots).
    let ways = waysOf(grade, key, per + 2).filter((w) => w !== key);
    if (little) ways = [dots(Number(key))];
    return Array.from({ length: per }, (_, k) => ({ id: ++id, key, label: ways[k % ways.length], c: ki }));
  });
  return { keys, per, queue: shuffle(cards) };
}

export function ValueSort({ grade, onEnd, playerId }) {
  const [level, levelUp] = useLevel(playerId, grade, 'valueSort');
  const [b, setB] = useState(() => sortBoard(grade, level));
  const [jars, setJars] = useState({});
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [shake, setShake] = useState(null);
  const [glow, setGlow] = useState(null);
  const [pop, setPop] = useState(null);
  const [note, setNote] = useState(null);
  const { banner, boardDone } = useBoards(3, onEnd, levelUp);
  const card = b.queue[0];
  useEffect(() => {
    if (card) speak(`${sayValue(card.label)}. Which jar is it worth?`);
  }, [card && card.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    speak(grade === 'p' ? 'Count the dots, then tap the jar with that number!' : 'Each card goes in the jar with the same value. Tap the right jar!');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  function drop(key, ki) {
    if (!card || banner) return;
    if (key !== card.key) {
      playIncorrectBuzz();
      setShake(ki);
      setTimeout(() => setShake(null), 450);
      const m = misses + 1;
      setMisses(m);
      const line = grade === 'p' ? `Count the dots: that's ${card.key}! Find the ${card.key} jar.` : `${card.label} isn't ${key}. ${m >= 1 && sgSettings().hintAfterMiss ? `It makes ${card.key}. Find the ${card.key} jar!` : 'Try again!'}`;
      setNote(line);
      speak(line.replace(card.label, sayValue(card.label)));
      if (m >= 1) setGlow(card.key);
      return;
    }
    playCorrectChime();
    speak(`${sayValue(card.label)} is ${sayValue(card.key)}!`);
    setNote(null);
    setGlow(null);
    setPop(key);
    setTimeout(() => setPop(null), 400);
    const nj = { ...jars, [key]: [...(jars[key] || []), card] };
    setJars(nj);
    const total = score + (misses ? 1 : 2);
    setScore(total);
    setMisses(0);
    const rest = b.queue.slice(1);
    setB({ ...b, queue: rest });
    if (!rest.length) {
      boardDone(total, (lv) => {
        setB(sortBoard(grade, lv));
        setJars({});
      });
    }
  }
  return (
    <div className="game game-pz">
      <PuzzleTop level={level} score={score} label="stars" />
      <div className="vs-deal">
        {card ? (
          <>
            <p className="vs-ask">Which jar is this card worth?</p>
            <button type="button" key={card.id} className="vs-now" onClick={() => speak(sayValue(card.label))} style={{ '--fs': labelSize(card.label) }}>
              {card.label}
            </button>
            <span className="vs-left">
              {b.queue.length} {b.queue.length === 1 ? 'card' : 'cards'} left
            </span>
          </>
        ) : (
          <p className="vs-ask">All sorted!</p>
        )}
      </div>
      <div className="vs-jars" style={{ '--n': Math.min(b.keys.length, 3) }}>
        {b.keys.map((key, ki) => {
          const inJar = jars[key] || [];
          const color = VALUE_COLORS[ki % VALUE_COLORS.length];
          return (
            <button key={key} type="button" className={`vs-jar${shake === ki ? ' make10-bad' : ''}${glow === key ? ' vs-glow' : ''}${pop === key ? ' vs-pop' : ''}${inJar.length >= b.per ? ' vs-jar-full' : ''}`} style={{ '--jc': color }} onClick={() => drop(key, ki)} aria-label={`Jar ${key}`}>
              <span className="vs-lid" />
              <span className="vs-label">
                {key}
                {grade === 'p' && <small>{dots(Number(key))}</small>}
              </span>
              <span className="vs-in">
                {inJar.map((x) => (
                  <i key={x.id} style={{ '--fs': labelSize(x.label) }}>
                    {x.label}
                  </i>
                ))}
              </span>
              <span className="vs-count">
                {inJar.length} / {b.per}
              </span>
            </button>
          );
        })}
      </div>
      {note && <p className="bakery-note">{note}</p>}
      <Banner text={banner} />
    </div>
  );
}

// ------------------------------------------------------------- Double Up
// Doubles: tap two tiles with the same number and they join into their
// double ("4 + 4 = 8!"). A new tile drops into the empty spot. The ladder
// on top shows the way to the goal (2 → 4 → 8 → 16). Make the goal to
// finish the level. Same numbers glow when you're stuck.
const BASE = { p: 1, k: 1, 1: 2, 2: 2, 3: 3, 4: 5 };
const STEPS = { p: 2, k: 3, 1: 3, 2: 4, 3: 4, 4: 4 };
let tileId = 0;
const newTile = (base, big) => ({ id: ++tileId, v: big && Math.random() < 0.3 ? base * 2 : base, born: true });
function dupBoard(grade, n) {
  const base = BASE[grade] || 2;
  return Array.from({ length: n }, (_, i) => newTile(base, i % 3 === 2));
}
// Makes sure two tiles match (so there's always a move).
function withPair(cells, base) {
  const seen = new Set();
  for (const c of cells) {
    if (seen.has(c.v)) return cells;
    seen.add(c.v);
  }
  const next = [...cells];
  const k = rand(0, next.length - 1);
  const other = next.find((_, i) => i !== k) || { v: base };
  next[k] = { id: ++tileId, v: other.v, born: true };
  return next;
}

export function DoubleUp({ grade, onEnd, playerId }) {
  const [level, levelUp] = useLevel(playerId, grade, 'doubleUp');
  const base = BASE[grade] || 2;
  const size = grade === 'p' ? 6 : grade === 'k' ? 9 : 12;
  const cols = grade === 'p' ? 3 : grade === 'k' ? 3 : 4;
  const stepsFor = (lv) => STEPS[grade] + Math.min(2, Math.floor((lv - 1) / 2));
  const [steps, setSteps] = useState(() => stepsFor(level));
  const goal = base * 2 ** steps;
  const [cells, setCells] = useState(() => withPair(dupBoard(grade, size), base));
  const [sel, setSel] = useState(null);
  const [score, setScore] = useState(0);
  const [made, setMade] = useState(base);
  const [sum, setSum] = useState(null);
  const [bad, setBad] = useState([]);
  const [hint, setHint] = useState(null);
  const { banner, boardDone } = useBoards(3, onEnd, levelUp);
  const idle = useRef(null);
  const ladder = Array.from({ length: steps + 1 }, (_, k) => base * 2 ** k);
  useEffect(() => {
    speak(`Tap two the same, and they make double! Can you make ${goal}?`);
  }, [goal]);
  useEffect(() => {
    clearTimeout(idle.current);
    setHint(null);
    idle.current = setTimeout(() => {
      const byV = {};
      cells.forEach((c, i) => (byV[c.v] = [...(byV[c.v] || []), i]));
      const pair = Object.values(byV).find((l) => l.length >= 2);
      if (pair) setHint(pair.slice(0, 2));
    }, 8000);
    return () => clearTimeout(idle.current);
  }, [cells]);
  function tap(i) {
    if (banner) return;
    setHint(null);
    if (sel === null) {
      playStickerPick();
      speak(String(cells[i].v));
      return setSel(i);
    }
    if (sel === i) return setSel(null);
    const a = cells[sel];
    const c = cells[i];
    if (a.v !== c.v) {
      playIncorrectBuzz();
      setBad([sel, i]);
      setTimeout(() => setBad([]), 450);
      speak(`${a.v} and ${c.v} aren't the same. Find two ${a.v}s!`);
      setSel(null);
      return undefined;
    }
    playCorrectChime();
    const v = a.v * 2;
    speak(`${a.v} plus ${a.v} makes ${v}!`);
    setSum({ text: `${a.v} + ${a.v} = ${v}`, n: Math.random() });
    const next = [...cells];
    next[i] = { id: ++tileId, v, pop: true };
    next[sel] = newTile(base, true);
    setSel(null);
    const total = score + 1;
    setScore(total);
    if (v > made) setMade(v);
    if (v >= goal) {
      boardDone(total + 3, (lv) => {
        setSteps(stepsFor(lv));
        setCells(withPair(dupBoard(grade, size), base));
        setMade(base);
        setSum(null);
      });
      setScore(total + 3);
      setCells(next);
      return undefined;
    }
    setCells(withPair(next, base));
    return undefined;
  }
  const tint = (v) => VALUE_COLORS[Math.round(Math.log2(v / base)) % VALUE_COLORS.length];
  return (
    <div className="game game-pz">
      <PuzzleTop level={level} score={score} label="doubles" />
      <div className="du-ladder" aria-label={`Make ${goal}`}>
        {ladder.map((v, k) => (
          <span key={v} className="du-step">
            {k > 0 && <i aria-hidden="true">→</i>}
            <b className={`${made >= v ? 'du-got' : ''}${k === ladder.length - 1 ? ' du-goal' : ''}`} style={{ '--dc': tint(v) }}>
              {v}
            </b>
          </span>
        ))}
      </div>
      <p className="game-ask">Tap two the same to make double!</p>
      <div className="du-sum" key={sum ? sum.n : 'none'}>
        {sum ? sum.text : `${base} + ${base} = ${base * 2}`}
      </div>
      <div className="du-board" style={{ '--n': cols }}>
        {cells.map((c, i) => (
          <button key={c.id} type="button" className={`du-cell du-tile${sel === i ? ' du-sel' : ''}${c.pop ? ' du-pop' : ''}${c.born ? ' du-born' : ''}${bad.includes(i) ? ' make10-bad' : ''}${hint && hint.includes(i) ? ' tt-hint' : ''}`} style={{ '--dc': tint(c.v), '--fs': String(c.v).length > 2 ? 0.78 : 1 }} onClick={() => tap(i)}>
            {c.v}
          </button>
        ))}
      </div>
      <Banner text={banner} />
    </div>
  );
}

// -------------------------------------------------------------- Take Ten
// Each grade's pairs: the same number, or two that make T (in steps of unit).
const TEN = { p: { T: 0, hi: 5 }, k: { T: 10, hi: 9 }, 1: { T: 10, hi: 9 }, 2: { T: 20, hi: 19 }, 3: { T: 100, hi: 19, unit: 5 }, 4: { T: 1, hi: 9, unit: 0.1 } };
const tenOf = (grade) => TEN[grade] || TEN[1];
const shown = (grade, k) => {
  const u = tenOf(grade).unit || 1;
  return Number((k * u).toFixed(1));
};
function tenBoard(grade, level) {
  const { T, hi, unit } = tenOf(grade);
  const cols = grade === 'p' ? 4 : grade === 'k' ? 5 : 6;
  const rows = Math.min(8, 2 + level);
  const steps = T ? Math.round(T / (unit || 1)) : 0;
  const seq = [];
  for (let i = 0; i < (rows * cols) / 2; i++) {
    const a = rand(1, hi);
    const same = !T || Math.random() < 0.25 || steps - a < 1 || steps - a > hi;
    seq.push(a, same ? a : steps - a);
  }
  // Mix a little, so pairs are near each other but not always side by side.
  for (let t = 0; t < seq.length; t++) {
    const i = rand(0, seq.length - 1);
    const j = Math.min(seq.length - 1, i + rand(1, cols));
    [seq[i], seq[j]] = [seq[j], seq[i]];
  }
  return { cols, cells: seq.map((v, i) => ({ id: i, v, gone: false })), adds: 3 };
}
function linked(cells, cols, i, j) {
  const [a, b] = i < j ? [i, j] : [j, i];
  // Next to each other in reading order (cleared ones between are fine).
  let clear = true;
  for (let k = a + 1; k < b; k++) if (!cells[k].gone) clear = false;
  if (clear) return true;
  const ra = Math.floor(a / cols);
  const ca = a % cols;
  const rb = Math.floor(b / cols);
  const cb = b % cols;
  const dr = Math.sign(rb - ra);
  const dc = Math.sign(cb - ca);
  if (!(ra === rb || ca === cb || Math.abs(rb - ra) === Math.abs(cb - ca))) return false;
  let r = ra + dr;
  let c = ca + dc;
  while (r !== rb || c !== cb) {
    if (!cells[r * cols + c].gone) return false;
    r += dr;
    c += dc;
  }
  return true;
}
const pairs = (grade, x, y) => {
  const { T, unit } = tenOf(grade);
  return x === y || (T && x + y === Math.round(T / (unit || 1)));
};
// Singapore Math Mode: the picked number in a ten frame (or a bar for
// 100 and 1), with what's missing to make the target.
function TenPeek({ grade, v }) {
  const s = sgSettings();
  const { T } = tenOf(grade);
  const x = shown(grade, v);
  const need = Number((T - x).toFixed(1));
  const frames = T <= 20 && s.tenFrames;
  if (!frames && !s.bars) return null;
  return (
    <div className="tt-peek">
      <span className="tk-tag">You picked {x}. What makes {T}?</span>
      {frames ? <TenFrames a={x} frames={T / 10 || 1} /> : <Bar parts={[x, '?']} total={T} />}
      <span className="tt-peek-line">
        <span>
          {x} + <b>?</b> = {T}
        </span>
        {frames && <small>Count the empty spots: {need}</small>}
      </span>
    </div>
  );
}

function findPair(b, grade) {
  for (let i = 0; i < b.cells.length; i++)
    for (let j = i + 1; j < b.cells.length; j++) {
      if (b.cells[i].gone || b.cells[j].gone) continue;
      if (pairs(grade, b.cells[i].v, b.cells[j].v) && linked(b.cells, b.cols, i, j)) return [i, j];
    }
  return null;
}

export function TakeTen({ grade, onEnd, playerId }) {
  const [level, levelUp] = useLevel(playerId, grade, 'takeTen');
  const [b, setB] = useState(() => tenBoard(grade, level));
  const [sel, setSel] = useState(null);
  const [score, setScore] = useState(0);
  const [bad, setBad] = useState([]);
  const [hint, setHint] = useState(null);
  const [note, setNote] = useState(null);
  const { banner, boardDone } = useBoards(2, onEnd, levelUp);
  const { T } = tenOf(grade);
  const ask = T ? `Tap two that make ${T}, or two the same` : 'Tap two the same';
  const idle = useRef(null);
  useEffect(() => {
    speak(`${ask}! They have to be next to each other, with nothing in between.`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    clearTimeout(idle.current);
    idle.current = setTimeout(() => setHint(findPair(b, grade)), 12000);
    return () => clearTimeout(idle.current);
  }, [b, grade]);
  function tap(i) {
    if (banner || b.cells[i].gone) return;
    setHint(null);
    if (sel === null) {
      playStickerPick();
      return setSel(i);
    }
    if (sel === i) return setSel(null);
    const x = b.cells[sel].v;
    const y = b.cells[i].v;
    if (!pairs(grade, x, y)) {
      playIncorrectBuzz();
      setBad([sel, i]);
      // A hint after a miss: a partner that works glows.
      if (sgSettings().hintAfterMiss) {
        const j = b.cells.findIndex((c, k) => k !== sel && !c.gone && pairs(grade, x, c.v) && linked(b.cells, b.cols, sel, k));
        if (j !== -1) setTimeout(() => setHint([sel, j]), 500);
      }
      const line = T ? `${shown(grade, x)} and ${shown(grade, y)} make ${shown(grade, x + y)}, not ${T}.` : `${x} and ${y} aren't the same.`;
      setNote(line);
      speak(line);
    } else if (!linked(b.cells, b.cols, sel, i)) {
      playIncorrectBuzz();
      setBad([sel, i]);
      const line = 'Those two need a clear path: side by side, up and down, slanting, or next in the line.';
      setNote(line);
      speak(line);
    } else {
      playCorrectChime();
      speak(x === y ? `${shown(grade, x)} and ${shown(grade, y)}, the same!` : `${shown(grade, x)} and ${shown(grade, y)} make ${T}!`);
      let cells = b.cells.map((c, k) => (k === sel || k === i ? { ...c, gone: true } : c));
      // Rows that are all cleared go away.
      const keep = [];
      for (let r = 0; r * b.cols < cells.length; r++) {
        const row = cells.slice(r * b.cols, r * b.cols + b.cols);
        if (!(row.length === b.cols && row.every((c) => c.gone))) keep.push(...row);
      }
      cells = keep;
      const total = score + 1;
      setScore(total);
      setNote(null);
      const nb = { ...b, cells };
      setB(nb);
      if (cells.every((c) => c.gone)) {
        boardDone(total + 3, (lv) => setB(tenBoard(grade, lv)));
        setScore(total + 3);
      } else if (!findPair(nb, grade) && !nb.adds) {
        speak('No more pairs!');
        setTimeout(() => onEnd(total), 1400);
      }
    }
    setSel(null);
    setTimeout(() => setBad([]), 450);
    return undefined;
  }
  function addMore() {
    if (!b.adds) return;
    playStickerPick();
    let id = Math.max(...b.cells.map((c) => c.id)) + 1;
    const more = b.cells.filter((c) => !c.gone).map((c) => ({ id: id++, v: c.v, gone: false }));
    setB({ ...b, cells: [...b.cells, ...more], adds: b.adds - 1 });
    speak('More numbers!');
  }
  return (
    <div className="game game-pz">
      <PuzzleTop level={level} score={score} label="pairs" />
      <p className="game-ask">{ask}</p>
      <div className="tt-board" style={{ '--cols': b.cols }}>
        {b.cells.map((c, i) => (
          <button key={c.id} type="button" disabled={c.gone} className={`tt-cell${c.gone ? ' tt-gone' : ''}${sel === i ? ' tt-sel' : ''}${bad.includes(i) ? ' make10-bad' : ''}${hint && hint.includes(i) ? ' tt-hint' : ''}`} style={{ '--tc': VALUE_COLORS[c.v % VALUE_COLORS.length] }} onClick={() => tap(i)}>
            {shown(grade, c.v)}
          </button>
        ))}
      </div>
      {sel !== null && T > 0 && <TenPeek grade={grade} v={b.cells[sel].v} />}
      {note && <p className="bakery-note">{note}</p>}
      <div className="bakery-actions">
        <button type="button" className="bakery-btn bakery-add" disabled={!b.adds} onClick={addMore}>
          + More numbers ({b.adds})
        </button>
        <button type="button" className="bakery-btn" onClick={() => setHint(findPair(b, grade))}>
          💡 Hint
        </button>
      </div>
      <Banner text={banner} />
    </div>
  );
}

// ------------------------------------------------------------ Cross Sums
function crossBoard(grade, level) {
  const n = Math.min({ p: 3, k: 3, 1: 4, 2: 4, 3: 5, 4: 5 }[grade] || 4, ({ p: 2, k: 3, 1: 3, 2: 4, 3: 4, 4: 5 }[grade] || 3) + (level >= 4 ? 1 : 0));
  const hi = { p: 3, k: 5, 1: 9, 2: 9, 3: 9, 4: 12 }[grade] || 9;
  for (;;) {
    const nums = Array.from({ length: n * n }, () => rand(1, hi));
    const keep = nums.map(() => Math.random() < 0.6);
    const rowsOk = Array.from({ length: n }, (_, r) => keep.slice(r * n, r * n + n).some(Boolean));
    const colsOk = Array.from({ length: n }, (_, c) => keep.filter((_, i) => i % n === c).some(Boolean));
    if (!rowsOk.every(Boolean) || !colsOk.every(Boolean) || keep.every(Boolean)) continue;
    const rows = Array.from({ length: n }, (_, r) => nums.slice(r * n, r * n + n).reduce((s, v, c) => s + (keep[r * n + c] ? v : 0), 0));
    const cols = Array.from({ length: n }, (_, c) => nums.reduce((s, v, i) => s + (i % n === c && keep[i] ? v : 0), 0));
    return { n, nums, keep, rows, cols };
  }
}
export function CrossSums({ grade, onEnd, playerId }) {
  const [level, levelUp] = useLevel(playerId, grade, 'crossSums');
  const [b, setB] = useState(() => crossBoard(grade, level));
  const [out, setOut] = useState(() => new Set());
  const [score, setScore] = useState(0);
  const [hint, setHint] = useState(null);
  const [helps, setHelps] = useState(0);
  const { banner, boardDone } = useBoards(3, onEnd, levelUp);
  useEffect(() => {
    speak('Cross out numbers so each row and each column adds up to its total!');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const { n } = b;
  const rowSum = (r) => b.nums.slice(r * n, r * n + n).reduce((s, v, c) => s + (out.has(r * n + c) ? 0 : v), 0);
  const colSum = (c) => b.nums.reduce((s, v, i) => s + (i % n === c && !out.has(i) ? v : 0), 0);
  function tap(i) {
    if (banner) return;
    setHint(null);
    const next = new Set(out);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    playStickerPick();
    setOut(next);
    const rs = (r) => b.nums.slice(r * n, r * n + n).reduce((s, v, c) => s + (next.has(r * n + c) ? 0 : v), 0);
    const cs = (c) => b.nums.reduce((s, v, k) => s + (k % n === c && !next.has(k) ? v : 0), 0);
    const r = Math.floor(i / n);
    if (rs(r) === b.rows[r]) playCorrectChime();
    if (Array.from({ length: n }, (_, k) => rs(k) === b.rows[k] && cs(k) === b.cols[k]).every(Boolean)) {
      const total = score + Math.max(1, 3 - helps);
      setScore(total);
      boardDone(total, (lv) => {
        setB(crossBoard(grade, lv));
        setOut(new Set());
        setHelps(0);
      });
    }
  }
  function help() {
    // One cell that is in the wrong state now.
    const wrong = b.nums.map((_, i) => i).filter((i) => out.has(i) === b.keep[i]);
    if (!wrong.length) return;
    const i = wrong[rand(0, wrong.length - 1)];
    setHelps((h) => h + 1);
    setHint(i);
    speak(b.keep[i] ? `Keep the ${b.nums[i]}!` : `Cross out the ${b.nums[i]}!`);
  }
  return (
    <div className="game game-pz">
      <PuzzleTop level={level} score={score} label="stars" />
      <p className="game-ask">Tap to cross out numbers. Each row and column must make its total!</p>
      <div className="cs-board" style={{ '--n': n + 1 }}>
        {Array.from({ length: n }, (_, r) => (
          <div key={r} className="cs-row">
            {Array.from({ length: n }, (_, c) => {
              const i = r * n + c;
              return (
                <button key={c} type="button" className={`cs-cell${out.has(i) ? ' cs-out' : ''}${hint === i ? ' tt-hint' : ''}`} onClick={() => tap(i)}>
                  {b.nums[i]}
                </button>
              );
            })}
            <span className={`cs-sum${rowSum(r) === b.rows[r] ? ' cs-ok' : ''}`}>{b.rows[r]}</span>
          </div>
        ))}
        <div className="cs-row">
          {Array.from({ length: n }, (_, c) => (
            <span key={c} className={`cs-sum${colSum(c) === b.cols[c] ? ' cs-ok' : ''}`}>
              {b.cols[c]}
            </span>
          ))}
          <span className="cs-corner" />
        </div>
      </div>
      <div className="bakery-actions">
        <button type="button" className="bakery-btn" onClick={help}>
          💡 Help
        </button>
        <button type="button" className="bakery-btn" onClick={() => setOut(new Set())}>
          ↺ Start over
        </button>
      </div>
      <Banner text={banner} />
    </div>
  );
}

// ------------------------------------------------------------ Area Boxes
const AREA = { p: [3, 3, 3], k: [4, 4, 4], 1: [4, 5, 6], 2: [5, 5, 8], 3: [6, 6, 12], 4: [6, 7, 12] };
function areaBoard(grade, level) {
  const [w0, h0, maxA] = AREA[grade] || AREA[1];
  const w = w0;
  const h = Math.min(h0 + (level >= 3 ? 1 : 0), 8);
  const rects = [];
  const split = (r) => {
    const a = r.w * r.h;
    if (a <= maxA && (a <= 2 || Math.random() < 0.45)) return rects.push(r);
    const vert = r.w > 1 && (r.h === 1 || Math.random() < r.w / (r.w + r.h));
    if (vert) {
      const k = rand(1, r.w - 1);
      split({ ...r, w: k });
      split({ ...r, x: r.x + k, w: r.w - k });
    } else {
      const k = rand(1, r.h - 1);
      split({ ...r, h: k });
      split({ ...r, y: r.y + k, h: r.h - k });
    }
    return undefined;
  };
  split({ x: 0, y: 0, w, h });
  const clues = {};
  for (const r of rects) clues[`${r.y + rand(0, r.h - 1)},${r.x + rand(0, r.w - 1)}`] = r.w * r.h;
  return { w, h, clues, n: rects.length };
}
const BOX_COLORS = ['#ffb4c8', '#a9d1ff', '#ffd98a', '#a7e8c0', '#d6c2ff', '#ffc49b', '#9ee5dd', '#ffadad', '#c3c8ff', '#d4f0a0'];

export function AreaBoxes({ grade, onEnd, playerId }) {
  const [level, levelUp] = useLevel(playerId, grade, 'areaBoxes');
  const [b, setB] = useState(() => areaBoard(grade, level));
  const [boxes, setBoxes] = useState([]);
  const [drag, setDrag] = useState(null);
  const [note, setNote] = useState(null);
  const [score, setScore] = useState(0);
  const [bad, setBad] = useState(null);
  const { banner, boardDone } = useBoards(3, onEnd, levelUp);
  useEffect(() => {
    speak('Drag to draw boxes! Each box has one number, and that many squares.');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const owner = useMemo(() => {
    const m = {};
    boxes.forEach((bx, k) => {
      for (let r = bx.r1; r <= bx.r2; r++) for (let c = bx.c1; c <= bx.c2; c++) m[`${r},${c}`] = k;
    });
    return m;
  }, [boxes]);
  const cellAt = (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const d = el && el.closest('[data-cell]');
    return d ? d.dataset.cell.split(',').map(Number) : null;
  };
  const span = (d) => d && { r1: Math.min(d.a[0], d.b[0]), r2: Math.max(d.a[0], d.b[0]), c1: Math.min(d.a[1], d.b[1]), c2: Math.max(d.a[1], d.b[1]) };
  function finish(d) {
    const s = span(d);
    const cells = [];
    for (let r = s.r1; r <= s.r2; r++) for (let c = s.c1; c <= s.c2; c++) cells.push(`${r},${c}`);
    // A tap on a box takes it away.
    if (cells.length === 1 && owner[cells[0]] !== undefined) {
      playStickerPick();
      setBoxes(boxes.filter((_, k) => k !== owner[cells[0]]));
      return;
    }
    const clues = cells.filter((k) => b.clues[k]);
    const area = cells.length;
    const w = s.c2 - s.c1 + 1;
    const h = s.r2 - s.r1 + 1;
    let line = null;
    if (cells.some((k) => owner[k] !== undefined)) line = 'That covers another box. Tap a box to take it away.';
    else if (!clues.length) line = 'Every box needs one number in it.';
    else if (clues.length > 1) line = 'Only one number in each box!';
    else if (b.clues[clues[0]] !== area) line = w > 1 && h > 1 ? `That's ${w} × ${h} = ${area} squares. It needs ${b.clues[clues[0]]}.` : `That's ${area} ${area === 1 ? 'square' : 'squares'}. It needs ${b.clues[clues[0]]}.`;
    if (line) {
      if (area === 1 && !clues.length) return;
      playIncorrectBuzz();
      setNote(line);
      speak(line);
      setBad(s);
      setTimeout(() => setBad(null), 500);
      return;
    }
    playCorrectChime();
    setNote(null);
    speak(w > 1 && h > 1 ? `${w} times ${h} is ${area}!` : `${area}!`);
    const next = [...boxes, { ...s, c: BOX_COLORS[boxes.length % BOX_COLORS.length] }];
    setBoxes(next);
    if (next.reduce((t, bx) => t + (bx.r2 - bx.r1 + 1) * (bx.c2 - bx.c1 + 1), 0) === b.w * b.h) {
      const total = score + 3;
      setScore(total);
      boardDone(total, (lv) => {
        setB(areaBoard(grade, lv));
        setBoxes([]);
      });
    }
  }
  const live = span(drag);
  const inLive = (r, c) => live && r >= live.r1 && r <= live.r2 && c >= live.c1 && c <= live.c2;
  return (
    <div className="game game-pz">
      <PuzzleTop level={level} score={score} label="stars" />
      <p className="game-ask">Draw a box around each number with that many squares</p>
      <div
        className="ab-board"
        style={{ '--w': b.w }}
        onPointerDown={(e) => {
          const c = cellAt(e);
          if (c) setDrag({ a: c, b: c });
        }}
        onPointerMove={(e) => {
          if (!drag) return;
          const c = cellAt(e);
          if (c && (c[0] !== drag.b[0] || c[1] !== drag.b[1])) setDrag({ ...drag, b: c });
        }}
        onPointerUp={() => {
          if (drag) finish(drag);
          setDrag(null);
        }}
        onPointerCancel={() => setDrag(null)}
      >
        {Array.from({ length: b.h }, (_, r) =>
          Array.from({ length: b.w }, (_, c) => {
            const k = `${r},${c}`;
            const o = owner[k];
            const isBad = bad && r >= bad.r1 && r <= bad.r2 && c >= bad.c1 && c <= bad.c2;
            return (
              <span key={k} data-cell={k} className={`ab-cell${inLive(r, c) ? ' ab-live' : ''}${isBad ? ' make10-bad ab-bad' : ''}`} style={o !== undefined ? { background: boxes[o].c } : undefined}>
                {b.clues[k] || ''}
              </span>
            );
          }),
        )}
      </div>
      {live && (
        <p className="ab-size">
          {live.c2 - live.c1 + 1} × {live.r2 - live.r1 + 1} = {(live.c2 - live.c1 + 1) * (live.r2 - live.r1 + 1)}
        </p>
      )}
      {note && !live && <p className="bakery-note">{note}</p>}
      <div className="bakery-actions">
        <button type="button" className="bakery-btn" onClick={() => setBoxes([])}>
          ↺ Start over
        </button>
      </div>
      <Banner text={banner} />
    </div>
  );
}

// ------------------------------------------------------------ Pet Sudoku
const PETS = ['cat', 'dog', 'bunny', 'panda', 'frog', 'fox'];
const SUDOKU = { p: [3, 0, 0], k: [3, 0, 0], 1: [4, 2, 2], 2: [4, 2, 2], 3: [4, 2, 2], 4: [6, 2, 3] };
function solve(grid, n, br, bc, limit = 2) {
  let count = 0;
  const g = [...grid];
  const ok = (i, v) => {
    const r = Math.floor(i / n);
    const c = i % n;
    for (let k = 0; k < n; k++) if (g[r * n + k] === v || g[k * n + c] === v) return false;
    if (br) {
      const r0 = r - (r % br);
      const c0 = c - (c % bc);
      for (let y = r0; y < r0 + br; y++) for (let x = c0; x < c0 + bc; x++) if (g[y * n + x] === v) return false;
    }
    return true;
  };
  const go = () => {
    const i = g.indexOf(-1);
    if (i === -1) return ++count >= limit;
    for (let v = 0; v < n; v++)
      if (ok(i, v)) {
        g[i] = v;
        if (go()) return true;
        g[i] = -1;
      }
    return false;
  };
  go();
  return count;
}
function sudokuBoard(grade, level) {
  const [n, br, bc] = SUDOKU[grade] || SUDOKU[1];
  // A solved grid from the standard pattern, then shuffled.
  const base = (r, c) => (br ? (bc * (r % br) + Math.floor(r / br) + c) % n : (r + c) % n);
  const sym = shuffle(Array.from({ length: n }, (_, i) => i));
  const bands = br ? shuffle(Array.from({ length: n / br }, (_, i) => i)) : [0];
  const rowOrder = br ? bands.flatMap((bd) => shuffle(Array.from({ length: br }, (_, i) => bd * br + i))) : shuffle(Array.from({ length: n }, (_, i) => i));
  const stacks = bc ? shuffle(Array.from({ length: n / bc }, (_, i) => i)) : [0];
  const colOrder = bc ? stacks.flatMap((st) => shuffle(Array.from({ length: bc }, (_, i) => st * bc + i))) : shuffle(Array.from({ length: n }, (_, i) => i));
  const sol = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) sol.push(sym[base(rowOrder[r], colOrder[c])]);
  const holes = n === 3 ? Math.min(6, 2 + level) : n === 4 ? Math.min(11, 5 + level) : Math.min(22, 12 + level * 2);
  const grid = [...sol];
  let made = 0;
  for (const i of shuffle(sol.map((_, k) => k))) {
    if (made >= holes) break;
    const keep = grid[i];
    grid[i] = -1;
    if (solve(grid, n, br, bc) === 1) made++;
    else grid[i] = keep;
  }
  return { n, br, bc, sol, grid, given: grid.map((v) => v !== -1) };
}
export function PetSudoku({ grade, onEnd, playerId }) {
  const [level, levelUp] = useLevel(playerId, grade, 'petSudoku');
  const [b, setB] = useState(() => sudokuBoard(grade, level));
  const [sel, setSel] = useState(null);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [bad, setBad] = useState(null);
  const [note, setNote] = useState(null);
  const { banner, boardDone } = useBoards(3, onEnd, levelUp);
  const pets = grade !== '3' && grade !== '4';
  const nameOf = (v) => (pets ? PETS[v] : String(v + 1));
  const Sym = ({ v, size = 34 }) => (pets ? <Thing id={PETS[v]} size={size} /> : <b className="sd-num">{v + 1}</b>);
  useEffect(() => {
    speak(pets ? 'Every pet once in each row and each column! Tap a square, then a pet.' : 'Every number once in each row, column and box! Tap a square, then a number.');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const { n, br, bc } = b;
  function place(v) {
    if (sel === null || banner) return;
    if (b.sol[sel] !== v) {
      playIncorrectBuzz();
      setMisses((m) => m + 1);
      setBad(sel);
      setTimeout(() => setBad(null), 450);
      const r = Math.floor(sel / n);
      const c = sel % n;
      const rowHas = Array.from({ length: n }, (_, k) => b.grid[r * n + k]).includes(v);
      const colHas = Array.from({ length: n }, (_, k) => b.grid[k * n + c]).includes(v);
      const article = pets ? `a ${nameOf(v)}` : `a ${nameOf(v)}`;
      const line = rowHas ? `There's already ${article} in this row.` : colHas ? `There's already ${article} in this column.` : br ? `Look at the box, and the other rows and columns. Try another!` : 'Look at the other rows and columns. Try another!';
      setNote(line);
      speak(line);
      return;
    }
    playCorrectChime();
    setNote(null);
    const grid = [...b.grid];
    grid[sel] = v;
    setB({ ...b, grid });
    setSel(null);
    if (!grid.includes(-1)) {
      const total = score + Math.max(1, 3 - misses);
      setScore(total);
      boardDone(total, (lv) => {
        setB(sudokuBoard(grade, lv));
        setMisses(0);
      });
    }
  }
  return (
    <div className="game game-pz">
      <PuzzleTop level={level} score={score} label="stars" />
      <p className="game-ask">{pets ? 'Each pet once in every row and column' : 'Each number once in every row, column and box'}</p>
      <div className="sd-board" style={{ '--n': n }}>
        {b.grid.map((v, i) => {
          const r = Math.floor(i / n);
          const c = i % n;
          const edgeR = bc && (c + 1) % bc === 0 && c < n - 1;
          const edgeB = br && (r + 1) % br === 0 && r < n - 1;
          return (
            <button key={i} type="button" disabled={b.given[i]} className={`sd-cell${b.given[i] ? ' sd-given' : ''}${sel === i ? ' sd-sel' : ''}${bad === i ? ' make10-bad' : ''}${edgeR ? ' sd-er' : ''}${edgeB ? ' sd-eb' : ''}`} onClick={() => { playStickerPick(); setSel(i); }}>
              {v !== -1 && <Sym v={v} size={n > 4 ? 26 : 36} />}
            </button>
          );
        })}
      </div>
      {note && <p className="bakery-note">{note}</p>}
      <div className="sd-pal">
        {Array.from({ length: n }, (_, v) => (
          <button key={v} type="button" className="sd-pick" disabled={sel === null} onClick={() => place(v)} aria-label={nameOf(v)}>
            <Sym v={v} size={34} />
          </button>
        ))}
      </div>
      <Banner text={banner} />
    </div>
  );
}
