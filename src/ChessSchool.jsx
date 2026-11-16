import { useEffect, useRef, useState } from 'react';
import Pip from './Pip.jsx';
import { rand, shuffle } from './gameKit.jsx';
import { playCorrectChime, playIncorrectBuzz, playStickerPick, playStickerStick, speak } from './sound.js';
import { ChessPiece, NAMES, VAL, at, chessPlay, inCheck, later, pipMove, pseudo, rc } from './BoardGames.jsx';

// Chess School: small games and puzzles that practice one idea at a time
// (the way chess is taught to children), inside Chess.
//   Games against Pip: Rook Hunt and Bishop Hunt (only those pieces move;
//   take all of Pip's pawns first), Knight Feast (only knights move),
//   Queen vs Pawns (your queen stops Pip's pawns crossing the board),
//   Two-Rook Checkmate (the ladder).
//   Puzzles: Check! (put the king in check), Safe King Walk (walk the king
//   to the star without stepping where a piece guards), Pawn Magic
//   (taking in passing: en passant) and Skewer (check the king, then take
//   the piece behind it).

export const SCHOOL = [
  ['check', 'Check!', 'Move your piece to put Pip’s king in check.', 'q'],
  ['walk', 'Safe King Walk', 'Walk your king to the star. Never step where a piece guards!', 'k'],
  ['rookHunt', 'Rook Hunt', 'Only rooks move. Take all of Pip’s pawns first!', 'r'],
  ['bishopHunt', 'Bishop Hunt', 'Only bishops move. Take all of Pip’s pawns first!', 'b'],
  ['knights', 'Knight Feast', 'Only knights move. Eat Pip’s pieces before Pip eats yours!', 'n'],
  ['queenPawns', 'Queen vs Pawns', 'Your queen must catch all 8 pawns before one gets across safely.', 'q'],
  ['magic', 'Pawn Magic', 'A pawn can take a pawn that jumped two squares past it: “in passing”.', 'p'],
  ['skewer', 'Skewer', 'Check the king; when it moves, take the piece behind it!', 'r'],
  ['ladder', 'Two-Rook Checkmate', 'Push the king to the edge with your two rooks, like climbing a ladder.', 'r'],
];

// The squares a piece attacks (sliders stop at the first piece).
function attacksOf(b, i) {
  const p = b[i];
  const [r, c] = rc(i);
  const out = [];
  if (p.t === 'p') {
    const d = p.c === 'w' ? -1 : 1;
    for (const dc of [-1, 1]) {
      const j = at(r + d, c + dc);
      if (j >= 0) out.push(j);
    }
    return out;
  }
  if (p.t === 'n') {
    for (const [dr, dc] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) {
      const j = at(r + dr, c + dc);
      if (j >= 0) out.push(j);
    }
    return out;
  }
  if (p.t === 'k') {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) {
      const j = at(r + dr, c + dc);
      if (j >= 0) out.push(j);
    }
    return out;
  }
  const dirs = { r: [[1, 0], [-1, 0], [0, 1], [0, -1]], b: [[1, 1], [1, -1], [-1, 1], [-1, -1]] };
  dirs.q = [...dirs.r, ...dirs.b];
  for (const [dr, dc] of dirs[p.t]) {
    for (let k = 1; k < 8; k++) {
      const j = at(r + dr * k, c + dc * k);
      if (j < 0) break;
      out.push(j);
      if (b[j]) break;
    }
  }
  return out;
}

function Board({ b, sel, targets = [], last, marks = {}, onTap, flipKey }) {
  return (
    <div className="bg-board" key={flipKey}>
      {b.map((p, i) => {
        const [r, c] = rc(i);
        return (
          <button key={i} type="button" className={`bg-sq${(r + c) % 2 ? ' bg-dark' : ''}${sel === i ? ' bg-sel' : ''}${last && (last.from === i || last.to === i) ? ' bg-last' : ''}${marks[i] ? ` ${marks[i]}` : ''}`} onClick={() => onTap(i)} aria-label={p ? `${p.c === 'w' ? 'white' : 'black'} ${NAMES[p.t]}` : 'empty'}>
            {p && <ChessPiece p={p} />}
            {targets.includes(i) && <i className={b[i] ? 'bg-take' : 'bg-dot'} />}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------- games against Pip
const empty = () => Array(64).fill(null);
function putRandom(b, piece, n, rows) {
  const spots = shuffle(Array.from({ length: 64 }, (_, i) => i).filter((i) => !b[i] && rows.includes(rc(i)[0])));
  for (const i of spots.slice(0, n)) b[i] = { ...piece };
}
function huntSetup(t) {
  const b = empty();
  if (t === 'r') {
    b[56] = { c: 'w', t: 'r' };
    b[7] = { c: 'b', t: 'r' };
  } else {
    b[58] = { c: 'w', t: 'b' };
    b[61] = { c: 'w', t: 'b' };
    b[2] = { c: 'b', t: 'b' };
    b[5] = { c: 'b', t: 'b' };
  }
  putRandom(b, { c: 'w', t: 'p' }, 8, [1, 2, 3, 4, 5, 6]);
  putRandom(b, { c: 'b', t: 'p' }, 8, [1, 2, 3, 4, 5, 6]);
  return b;
}
function knightSetup() {
  const b = empty();
  const back = ['r', 'n', 'b', 'q', null, 'b', null, 'r'];
  back.forEach((t, c) => {
    if (t) {
      b[56 + c] = { c: 'w', t };
      b[c] = { c: 'b', t };
    }
    b[48 + c] = { c: 'w', t: 'p' };
    b[8 + c] = { c: 'b', t: 'p' };
  });
  // Each side's other knight starts in the middle of the other side's pieces.
  b[4] = { c: 'w', t: 'n' };
  b[60] = { c: 'b', t: 'n' };
  return b;
}
function queenSetup() {
  const b = empty();
  b[59] = { c: 'w', t: 'q' };
  for (let c = 0; c < 8; c++) b[8 + c] = { c: 'b', t: 'p' };
  return b;
}
function ladderSetup() {
  const b = empty();
  b[57] = { c: 'w', t: 'r' };
  b[58] = { c: 'w', t: 'r' };
  b[59] = { c: 'w', t: 'k' };
  b[at(rand(2, 4), rand(2, 5))] = { c: 'b', t: 'k' };
  return b;
}
const count = (b, side, f = () => true) => b.filter((p) => p && p.c === side && f(p)).length;
const other = (s) => (s === 'w' ? 'b' : 'w');
function modeRules(mode) {
  const play = (b, m) => chessPlay(b, m, 'school');
  if (mode === 'rookHunt' || mode === 'bishopHunt' || mode === 'knights') {
    const mover = mode === 'rookHunt' ? 'r' : mode === 'bishopHunt' ? 'b' : 'n';
    const gen = (b, side) => pseudo(b, side).filter((m) => b[m.from].t === mover);
    const targetOf = (p) => (mode === 'knights' ? true : p.t === 'p');
    return {
      gen,
      play,
      other,
      over: (b, side) => {
        if (!count(b, other(side), targetOf)) return 1;
        if (!count(b, side, targetOf) || !gen(b, side).length) return -1;
        return null;
      },
      score: (b, side) => (count(b, side, targetOf) - count(b, other(side), targetOf) + 2 * (count(b, side, (p) => p.t === mover) - count(b, other(side), (p) => p.t === mover))) / 20,
    };
  }
  if (mode === 'queenPawns') {
    const gen = (b, side) => pseudo(b, side);
    return {
      gen,
      play,
      other,
      over: (b, side) => {
        const crossed = b.findIndex((p, i) => p && p.c === 'b' && p.t === 'p' && i >= 56);
        if (!count(b, 'w')) return side === 'w' ? -1 : 1;
        if (!count(b, 'b')) return side === 'w' ? 1 : -1;
        if (crossed >= 0) {
          // Across safely: White to move can't take it.
          if (side === 'b') return 1;
          return gen(b, 'w').some((m) => m.to === crossed) ? null : -1;
        }
        if (!gen(b, side).length) return side === 'b' ? -1 : 0;
        return null;
      },
      score: (b, side) => {
        let s = 0;
        b.forEach((p, i) => {
          if (p && p.c === 'b') s += 1 + rc(i)[0] * 0.3;
        });
        s -= count(b, 'w') * 3;
        return (side === 'b' ? s : -s) / 20;
      },
    };
  }
  // The ladder: full chess rules (check), with the black king kept central.
  const gen = (b, side) => pseudo(b, side).filter((m) => !inCheck(play(b, m), side));
  return {
    gen,
    play,
    other,
    over: (b, side) => {
      if (!gen(b, side).length) return inCheck(b, side) ? -1 : 0;
      if (!count(b, 'w', (p) => p.t === 'r')) return side === 'w' ? -1 : 1;
      return null;
    },
    score: (b, side) => {
      const k = b.findIndex((p) => p && p.c === 'b' && p.t === 'k');
      const [r, c] = rc(k);
      const center = 3.5 - Math.max(Math.abs(3.5 - r), Math.abs(3.5 - c));
      const s = -count(b, 'w', (p) => p.t === 'r') * 2 + center * 0.4 + gen(b, 'b').length * 0.05;
      return (side === 'b' ? s : -s) / 10;
    },
  };
}
const SETUPS = { rookHunt: () => huntSetup('r'), bishopHunt: () => huntSetup('b'), knights: knightSetup, queenPawns: queenSetup, ladder: ladderSetup };

function VsPip({ mode, info, onEnd, onBack }) {
  const rules = modeRules(mode);
  const [b, setB] = useState(SETUPS[mode]);
  const [phase, setPhase] = useState('you');
  const [sel, setSel] = useState(null);
  const [last, setLast] = useState(null);
  const [note, setNote] = useState(null);
  const [result, setResult] = useState(null);
  const [moves, setMoves] = useState(0);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    speak(info[2]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  function finish(board, side) {
    let r = rules.over(board, side);
    if (r === null && mode === 'ladder' && moves >= 40) r = 0;
    if (r === null) return false;
    const you = side === 'w' ? r : -r;
    setPhase('over');
    if (you > 0) {
      playStickerStick();
      setResult(mode === 'ladder' ? 'Checkmate! You did it!' : 'You win!');
      speak(mode === 'ladder' ? 'Checkmate! You did it!' : 'You win! Great moves!');
      later(timers, () => onEnd(3), 2400);
    } else if (you < 0) {
      setResult('Pip wins this time!');
      speak('Pip wins this time. Try again!');
      later(timers, () => onEnd(0), 2400);
    } else {
      setResult(mode === 'ladder' ? 'Stalemate: the king can’t move but isn’t in check. That’s a draw!' : "It's a draw!");
      speak(mode === 'ladder' ? "Stalemate! That's a draw. Leave the king a square until you check." : "It's a draw!");
      later(timers, () => onEnd(1), 3000);
    }
    return true;
  }
  const legal = phase === 'you' ? rules.gen(b, 'w') : [];
  const targets = sel === null ? [] : legal.filter((m) => m.from === sel).map((m) => m.to);
  function tap(i) {
    if (phase !== 'you') return;
    if (sel !== null && targets.includes(i)) {
      const m = legal.find((x) => x.from === sel && x.to === i);
      const nb = rules.play(b, m);
      if (b[i]) playCorrectChime();
      else playStickerPick();
      setB(nb);
      setLast(m);
      setSel(null);
      setNote(null);
      setMoves((n) => n + 1);
      if (finish(nb, 'b')) return;
      setPhase('pip');
      later(timers, () => {
        const pm = pipMove(nb, 'b', mode === 'ladder' ? 2 : 2, rules, 0.01);
        if (!pm) {
          finish(nb, 'b');
          return;
        }
        const nb2 = rules.play(nb, pm);
        playStickerPick();
        setB(nb2);
        setLast(pm);
        if (!finish(nb2, 'w')) {
          if (mode === 'ladder' && inCheck(nb2, 'w')) setNote('Careful: keep your rooks away from the king!');
          setPhase('you');
        }
      }, 650);
      return;
    }
    const p = b[i];
    if (p && p.c === 'w') {
      if (!legal.some((m) => m.from === i)) {
        playIncorrectBuzz();
        setNote(mode === 'rookHunt' || mode === 'bishopHunt' || mode === 'knights' ? `Only your ${mode === 'rookHunt' ? 'rooks' : mode === 'bishopHunt' ? 'bishops' : 'knights'} move in this game.` : `That ${NAMES[p.t]} can't move right now.`);
        return;
      }
      playStickerPick();
      setSel(i);
      return;
    }
    setSel(null);
  }
  const hint = {
    ladder: 'Ladder: put one rook on the row next to the king to fence it in, then check with the other rook on the king’s row. Keep stepping up!',
    queenPawns: 'Catch the pawns that are closest to the end first, and stay where a pawn can’t take your queen.',
    knights: 'A knight jumps in an L: two squares, then one to the side.',
    rookHunt: 'Rooks go straight: up, down, left, right, as far as they like.',
    bishopHunt: 'Bishops go slanting, and stay on their own color.',
  }[mode];
  return (
    <div className="game game-pz">
      <div className="mm-top pz-top">
        <span className="pz-level">{info[1]}</span>
        <span className="mm-right">{mode === 'ladder' ? `${moves} moves` : mode === 'queenPawns' ? `${count(b, 'b')} pawns left` : `${count(b, 'w', (p) => (mode === 'knights' ? true : p.t === 'p'))} vs ${count(b, 'b', (p) => (mode === 'knights' ? true : p.t === 'p'))}`}</span>
      </div>
      <p className="game-ask bg-turn">
        {phase === 'over' ? (
          result
        ) : phase === 'pip' ? (
          <>
            <Pip size={26} /> Pip is thinking…
          </>
        ) : (
          note || info[2]
        )}
      </p>
      <Board b={b} sel={sel} targets={targets} last={last} onTap={tap} />
      <div className="bakery-actions">
        <button type="button" className="bakery-btn" onClick={() => speak(hint)}>
          Tip
        </button>
        <button type="button" className="bakery-btn" onClick={onBack} disabled={phase === 'pip'}>
          Chess School
        </button>
      </div>
      <p className="cs-tip">{hint}</p>
    </div>
  );
}

// ------------------------------------------------------------- puzzles
const TYPES = ['r', 'b', 'q', 'n'];
function checkPuzzle() {
  for (;;) {
    const b = empty();
    const k = rand(0, 63);
    b[k] = { c: 'b', t: 'k' };
    const t = TYPES[rand(0, 3)];
    const w = rand(0, 63);
    if (b[w]) continue;
    b[w] = { c: 'w', t };
    if (attacksOf(b, w).includes(k)) continue;
    const goals = pseudo(b, 'w').filter((m) => m.to !== k && attacksOf(chessPlay(b, m, 'school'), m.to).includes(k)).map((m) => m.to);
    if (goals.length) return { b, from: w, goals };
  }
}
function walkPuzzle() {
  for (;;) {
    const b = empty();
    const types = ['n', 'b', 'r', 'p', 'n', 'p'];
    const n = rand(5, 8);
    for (let k = 0; k < n; k++) {
      const i = at(rand(1, 6), rand(0, 7));
      if (!b[i]) b[i] = { c: 'b', t: types[rand(0, types.length - 1)] };
    }
    const guard = new Set();
    b.forEach((p, i) => p && attacksOf(b, i).forEach((j) => guard.add(j)));
    const safe = (i) => !b[i] && !guard.has(i);
    const start = at(7, rand(0, 7));
    const goal = at(0, rand(0, 7));
    if (!safe(start) || !safe(goal)) continue;
    // Shortest safe path (king steps).
    const dist = { [start]: 0 };
    const q = [start];
    while (q.length) {
      const i = q.shift();
      const [r, c] = rc(i);
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const j = at(r + dr, c + dc);
        if (j >= 0 && safe(j) && dist[j] === undefined) {
          dist[j] = dist[i] + 1;
          q.push(j);
        }
      }
    }
    if (dist[goal] !== undefined && dist[goal] >= 7) {
      b[start] = { c: 'w', t: 'k' };
      return { b, start, goal, guard, best: dist[goal] };
    }
  }
}
function magicPuzzle() {
  const b = empty();
  const c = rand(0, 7);
  const side = c === 0 ? 1 : c === 7 ? -1 : Math.random() < 0.5 ? -1 : 1;
  b[at(3, c)] = { c: 'w', t: 'p' };
  b[at(1, c + side)] = { c: 'b', t: 'p' };
  putRandom(b, { c: 'w', t: 'p' }, 3, [4, 5, 6]);
  putRandom(b, { c: 'b', t: 'p' }, 2, [1, 2]);
  return { b, mine: at(3, c), from: at(1, c + side), to: at(3, c + side), ep: at(2, c + side) };
}
// Pip's king, with one of Pip's pieces right behind it on a line; your
// rook, bishop or queen can move to check along that line.
function skewerPuzzle() {
  for (;;) {
    const t = ['r', 'b', 'q'][rand(0, 2)];
    const dirs = t === 'r' ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : t === 'b' ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
    const [dr, dc] = dirs[rand(0, dirs.length - 1)];
    const k = rand(0, 63);
    const [kr, kc] = rc(k);
    const behind = at(kr - dr, kc - dc);
    const s = rand(2, 4);
    const tgt = at(kr + dr * s, kc + dc * s);
    if (behind < 0 || tgt < 0) continue;
    const b = empty();
    b[k] = { c: 'b', t: 'k' };
    b[behind] = { c: 'b', t: ['n', 'r', 'b', 'q'][rand(0, 3)] };
    let ok = null;
    for (const w of shuffle(Array.from({ length: 64 }, (_, i) => i))) {
      if (b[w] || w === tgt) continue;
      const nb = [...b];
      nb[w] = { c: 'w', t };
      if (attacksOf(nb, w).includes(k)) continue;
      if (!pseudo(nb, 'w').some((m) => m.from === w && m.to === tgt)) continue;
      ok = { nb, w };
      break;
    }
    if (!ok) continue;
    const after = chessPlay(ok.nb, { from: ok.w, to: tgt }, 'school');
    if (!attacksOf(after, tgt).includes(k)) continue;
    const kingMoves = pseudo(after, 'b').filter((m) => m.from === k && !inCheck(chessPlay(after, m, 'school'), 'b'));
    if (!kingMoves.length) continue;
    return { b: ok.nb, behind };
  }
}
const isSkewer = (b, to) => {
  const k = b.findIndex((p) => p && p.c === 'b' && p.t === 'k');
  if (!attacksOf(b, to).includes(k)) return false;
  const [tr, tc] = rc(to);
  const [kr, kc] = rc(k);
  const dr = Math.sign(kr - tr);
  const dc = Math.sign(kc - tc);
  for (let s = 1; s < 8; s++) {
    const j = at(kr + dr * s, kc + dc * s);
    if (j < 0) return false;
    if (b[j]) return b[j].c === 'b';
  }
  return false;
};

function Puzzles({ mode, info, onEnd, onBack }) {
  const make = { check: checkPuzzle, walk: walkPuzzle, magic: magicPuzzle, skewer: skewerPuzzle }[mode];
  const N = 5;
  const [n, setN] = useState(0);
  const [pz, setPz] = useState(make);
  const [b, setB] = useState(() => pz.b);
  const [sel, setSel] = useState(null);
  const [step, setStep] = useState(0);
  const [stars, setStars] = useState(0);
  const [misses, setMisses] = useState(0);
  const [note, setNote] = useState(null);
  const [showGuard, setShowGuard] = useState(false);
  const [last, setLast] = useState(null);
  const [steps, setSteps] = useState(0);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    speak(info[2]);
    if (mode === 'magic') pipJump(pz);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  function pipJump(p) {
    // Pip's pawn jumps two squares, next to yours.
    setStep(0);
    later(timers, () => {
      const nb = [...p.b];
      nb[p.to] = nb[p.from];
      nb[p.from] = null;
      setB(nb);
      setLast({ from: p.from, to: p.to });
      setStep(1);
      playStickerPick();
      speak('Pip’s pawn jumped two squares, right past yours! Take it in passing!');
    }, 900);
  }
  function next(ok) {
    const total = stars + (ok ? (misses ? 1 : 2) : 0);
    setStars(total);
    later(timers, () => {
      if (n + 1 >= N) {
        onEnd(total);
        return;
      }
      const p = make();
      setN(n + 1);
      setPz(p);
      setB(p.b);
      setSel(null);
      setMisses(0);
      setNote(null);
      setLast(null);
      setSteps(0);
      setShowGuard(false);
      setStep(0);
      if (mode === 'magic') pipJump(p);
    }, 1400);
  }
  function miss(line) {
    playIncorrectBuzz();
    setMisses((m) => m + 1);
    setNote(line);
    speak(line);
  }
  // Moves for the selected piece.
  const myPiece = (i) => b[i] && b[i].c === 'w';
  let targets = [];
  if (sel !== null && mode !== 'walk') {
    targets = pseudo(b, 'w').filter((m) => m.from === sel).map((m) => m.to);
    if (mode === 'magic' && step === 1 && sel === pz.mine) targets = [...targets, pz.ep];
  }
  function tap(i) {
    if (mode === 'walk') {
      const k = b.findIndex((p) => p && p.t === 'k');
      const [r, c] = rc(k);
      const [r2, c2] = rc(i);
      if (Math.max(Math.abs(r - r2), Math.abs(c - c2)) !== 1) return;
      if (b[i] || pz.guard.has(i)) {
        miss(b[i] ? 'That square has a piece on it!' : 'Boom! A piece guards that square. Back to the start!');
        const nb = [...pz.b];
        setB(nb);
        setSteps(0);
        return;
      }
      playStickerPick();
      const nb = [...b];
      nb[i] = nb[k];
      nb[k] = null;
      setB(nb);
      setSteps((s) => s + 1);
      if (i === pz.goal) {
        playCorrectChime();
        setNote(`Safe! ${steps + 1} steps (fewest: ${pz.best}).`);
        speak('You made it safely!');
        next(true);
      }
      return;
    }
    if (sel !== null && targets.includes(i)) {
      if (mode === 'check') {
        const nb = chessPlay(b, { from: sel, to: i }, 'school');
        setB(nb);
        setSel(null);
        if (pz.goals.includes(i)) {
          playCorrectChime();
          setNote('Check! The king is attacked.');
          speak(`Check! Your ${NAMES[nb[i].t]} attacks the king.`);
          next(true);
        } else {
          miss(`That doesn't attack the king. Think how a ${NAMES[nb[i].t]} moves, and try again!`);
          later(timers, () => setB(pz.b), 900);
        }
        return;
      }
      if (mode === 'magic') {
        if (i === pz.ep && sel === pz.mine) {
          const nb = [...b];
          nb[pz.ep] = nb[pz.mine];
          nb[pz.mine] = null;
          nb[pz.to] = null;
          setB(nb);
          setSel(null);
          playCorrectChime();
          setNote('Magic! You took it in passing (en passant).');
          speak('Magic! You took it in passing!');
          next(true);
        } else miss('Look at the pawn that just jumped past yours. Your pawn can take it by moving slanting behind it!');
        setSel(null);
        return;
      }
      if (mode === 'skewer') {
        const nb = chessPlay(b, { from: sel, to: i }, 'school');
        if (step === 0) {
          if (!isSkewer(nb, i)) {
            miss('Find a check where another of Pip’s pieces is behind the king, on the same line.');
            setSel(null);
            return;
          }
          playCorrectChime();
          setB(nb);
          setSel(null);
          setLast({ from: sel, to: i });
          setNote('Skewer! The king must move…');
          speak('Check! The king has to move out of the way.');
          setStep(1);
          later(timers, () => {
            const k = nb.findIndex((p) => p && p.c === 'b' && p.t === 'k');
            const kms = pseudo(nb, 'b').filter((m) => m.from === k && !inCheck(chessPlay(nb, m, 'school'), 'b'));
            const km = kms[rand(0, kms.length - 1)];
            const nb2 = chessPlay(nb, km, 'school');
            setB(nb2);
            setLast(km);
            setStep(2);
            setNote('Now take the piece that was behind the king!');
            speak('Now take the piece that was behind the king!');
          }, 1200);
          return;
        }
        if (step === 2) {
          if (b[i] && b[i].c === 'b') {
            playCorrectChime();
            setB(nb);
            setSel(null);
            setNote(`You won the ${NAMES[b[i].t]}!`);
            speak(`You won the ${NAMES[b[i].t]}!`);
            next(true);
          } else miss('Take the piece that was behind the king.');
          setSel(null);
        }
        return;
      }
    }
    if (myPiece(i) && (mode !== 'magic' || step === 1)) {
      playStickerPick();
      setSel(i);
      return;
    }
    setSel(null);
  }
  const marks = {};
  if (mode === 'walk') {
    marks[pz.goal] = 'cs-goal';
    if (showGuard) pz.guard.forEach((j) => !b[j] && (marks[j] = 'cs-guard'));
    const k = b.findIndex((p) => p && p.t === 'k');
    const [r, c] = rc(k);
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const j = at(r + dr, c + dc);
      if ((dr || dc) && j >= 0 && !marks[j]) marks[j] = 'cs-step';
    }
  }
  if (mode === 'check' && sel === null && b[pz.from] && b[pz.from].c === 'w') marks[pz.from] = 'bg-must';
  const ask = {
    check: `Move the ${b[pz.from] ? NAMES[b[pz.from].t] : 'piece'} so it checks the king`,
    walk: 'Tap a square next to your king to step. Get to the star!',
    magic: step === 0 ? 'Watch Pip’s pawn…' : 'Take Pip’s pawn in passing!',
    skewer: step === 0 ? 'Check the king so a piece is stuck behind it' : step === 1 ? 'The king moves…' : 'Take the piece behind!',
  }[mode];
  return (
    <div className="game game-pz">
      <div className="mm-top pz-top">
        <span className="pz-level">
          {info[1]} {n + 1} of {N}
        </span>
        <span className="mm-right">{stars} stars</span>
      </div>
      <p className="game-ask bg-turn">{note || ask}</p>
      <Board b={b} sel={sel} targets={targets} last={last} marks={marks} onTap={tap} />
      <div className="bakery-actions">
        {mode === 'walk' && (
          <button type="button" className="bakery-btn" onClick={() => setShowGuard(!showGuard)}>
            {showGuard ? 'Hide' : 'Show'} guarded squares
          </button>
        )}
        <button type="button" className="bakery-btn" onClick={onBack}>
          Chess School
        </button>
      </div>
    </div>
  );
}

export default function ChessSchool({ mode, onEnd, onBack }) {
  const info = SCHOOL.find((x) => x[0] === mode);
  if (['check', 'walk', 'magic', 'skewer'].includes(mode)) return <Puzzles mode={mode} info={info} onEnd={onEnd} onBack={onBack} />;
  return <VsPip mode={mode} info={info} onEnd={onEnd} onBack={onBack} />;
}
void VAL;
