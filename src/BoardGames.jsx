import { useEffect, useRef, useState } from 'react';
import Pip from './Pip.jsx';
import { playCorrectChime, playIncorrectBuzz, playStickerPick, playStickerStick, speak } from './sound.js';
import { PuzzleTop, useLevel } from './puzzleKit.jsx';
import ChessSchool, { SCHOOL } from './ChessSchool.jsx';

// Board games against Pip: Chess (start with pawns only, then rooks and
// pawns, then knights and bishops, then full chess), Checkers and Reversi.
// You always see where a piece can go. Pip looks a move or two ahead and
// gets a little smarter each time you win (the level). Win 3, draw 1.

export const later = (ref, fn, ms) => ref.current.push(setTimeout(fn, ms));
export const rc = (i) => [Math.floor(i / 8), i % 8];
export const at = (r, c) => (r >= 0 && r < 8 && c >= 0 && c < 8 ? r * 8 + c : -1);
// A small search: negamax with alpha-beta. gen(b, side) → moves,
// play(b, m) → board, score(b, side) → number (side's view), over(b,
// side) → null or a final score for `side`.
export function search(b, side, depth, { gen, play, score, over, other }, alpha = -Infinity, beta = Infinity) {
  const end = over(b, side);
  if (end !== null) return { v: end * (1 + depth) };
  if (depth === 0) return { v: score(b, side) };
  const moves = gen(b, side);
  if (!moves.length) return { v: score(b, side) };
  let best = { v: -Infinity, m: moves[0] };
  for (const m of moves) {
    const v = -search(play(b, m, side), other(side), depth - 1, { gen, play, score, over, other }, -beta, -alpha).v;
    if (v > best.v) best = { v, m };
    alpha = Math.max(alpha, v);
    if (alpha >= beta) break;
  }
  return best;
}
// Pip's move: the search, with a little randomness (more at low levels).
export function pipMove(b, side, depth, rules, noise) {
  const moves = rules.gen(b, side);
  let best = null;
  let bestV = -Infinity;
  for (const m of moves) {
    const nb = rules.play(b, m, side);
    const v = -search(nb, rules.other(side), depth - 1, rules).v + Math.random() * noise;
    if (v > bestV) {
      bestV = v;
      best = m;
    }
  }
  return best;
}

// ------------------------------------------------------------------ Chess
const VARIANTS = [
  ['pawns', 'Pawn Wars', 'Pawns only: get a pawn across first, take all of Pip’s pawns, or leave Pip with no moves!'],
  ['rooks', 'Rooks & pawns', 'Get a pawn across, or take all of Pip’s pieces!'],
  ['minor', 'Knights & bishops too', 'Get a pawn across, or take all of Pip’s pieces!'],
  ['full', 'Full chess', 'Checkmate Pip’s king!'],
];
export const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
function chessSetup(v) {
  const b = Array(64).fill(null);
  const back = { pawns: {}, rooks: { 0: 'r', 7: 'r' }, minor: { 0: 'r', 1: 'n', 2: 'b', 5: 'b', 6: 'n', 7: 'r' }, full: { 0: 'r', 1: 'n', 2: 'b', 3: 'q', 4: 'k', 5: 'b', 6: 'n', 7: 'r' } }[v];
  for (let c = 0; c < 8; c++) {
    b[48 + c] = { c: 'w', t: 'p' };
    b[8 + c] = { c: 'b', t: 'p' };
  }
  for (const [c, t] of Object.entries(back)) {
    b[56 + Number(c)] = { c: 'w', t };
    b[Number(c)] = { c: 'b', t };
  }
  return b;
}
const SLIDE = { r: [[1, 0], [-1, 0], [0, 1], [0, -1]], b: [[1, 1], [1, -1], [-1, 1], [-1, -1]] };
SLIDE.q = [...SLIDE.r, ...SLIDE.b];
export function pseudo(b, side) {
  const out = [];
  b.forEach((p, i) => {
    if (!p || p.c !== side) return;
    const [r, c] = rc(i);
    const add = (j) => j >= 0 && (!b[j] || b[j].c !== side) && out.push({ from: i, to: j });
    if (p.t === 'p') {
      const d = side === 'w' ? -1 : 1;
      const one = at(r + d, c);
      if (one >= 0 && !b[one]) {
        out.push({ from: i, to: one });
        const two = at(r + 2 * d, c);
        if ((side === 'w' ? r === 6 : r === 1) && two >= 0 && !b[two]) out.push({ from: i, to: two });
      }
      for (const dc of [-1, 1]) {
        const j = at(r + d, c + dc);
        if (j >= 0 && b[j] && b[j].c !== side) out.push({ from: i, to: j });
      }
    } else if (p.t === 'n') {
      for (const [dr, dc] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) add(at(r + dr, c + dc));
    } else if (p.t === 'k') {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) add(at(r + dr, c + dc));
    } else {
      for (const [dr, dc] of SLIDE[p.t]) {
        for (let k = 1; k < 8; k++) {
          const j = at(r + dr * k, c + dc * k);
          if (j < 0) break;
          if (b[j]) {
            if (b[j].c !== side) out.push({ from: i, to: j });
            break;
          }
          out.push({ from: i, to: j });
        }
      }
    }
  });
  return out;
}
export function chessPlay(b, m, v) {
  const n = [...b];
  const p = n[m.from];
  n[m.to] = p;
  n[m.from] = null;
  const [r] = rc(m.to);
  // In full chess a pawn that gets across becomes a queen.
  if (v === 'full' && p.t === 'p' && (r === 0 || r === 7)) n[m.to] = { c: p.c, t: 'q' };
  return n;
}
export function inCheck(b, side) {
  const k = b.findIndex((p) => p && p.c === side && p.t === 'k');
  if (k < 0) return false;
  return pseudo(b, side === 'w' ? 'b' : 'w').some((m) => m.to === k);
}
function chessRules(v) {
  const other = (s) => (s === 'w' ? 'b' : 'w');
  const gen = (b, side) => {
    const ms = pseudo(b, side);
    return v === 'full' ? ms.filter((m) => !inCheck(chessPlay(b, m, v), side)) : ms;
  };
  // null, or for `side`: 1 won, -1 lost, 0 a draw.
  const over = (b, side) => {
    if (v !== 'full') {
      if (b.some((p, i) => p && p.t === 'p' && ((p.c === 'w' && i < 8) || (p.c === 'b' && i >= 56)))) {
        const winner = b.some((p, i) => p && p.t === 'p' && p.c === 'w' && i < 8) ? 'w' : 'b';
        return winner === side ? 1 : -1;
      }
      if (!b.some((p) => p && p.c === side)) return -1;
      if (!b.some((p) => p && p.c === other(side))) return 1;
      if (!pseudo(b, side).length) return -1;
      return null;
    }
    if (!gen(b, side).length) return inCheck(b, side) ? -1 : 0;
    if (b.filter(Boolean).length === 2) return 0;
    return null;
  };
  const score = (b, side) => {
    let s = 0;
    b.forEach((p, i) => {
      if (!p) return;
      const [r, c] = rc(i);
      let x = VAL[p.t];
      if (p.t === 'p') x += (v === 'full' ? 0.05 : 0.25) * (p.c === 'w' ? 6 - r : r - 1);
      if (p.t === 'n' || p.t === 'b') x += 0.1 * (3.5 - Math.abs(3.5 - c));
      s += p.c === side ? x : -x;
    });
    return s / 40;
  };
  return { gen, play: (b, m) => chessPlay(b, m, v), score, over: (b, s) => over(b, s), other };
}
const INK = { w: ['#fff', '#173a66'], b: ['#2b3040', '#0b0d14'] };
export function ChessPiece({ p, size = '86%' }) {
  const [fill, edge] = INK[p.c];
  const sh = { fill, stroke: edge, strokeWidth: 2, strokeLinejoin: 'round' };
  const d = {
    p: <path d="M20 8a5 5 0 0 1 3 9c3 2 4 6 5 11h3v5H9v-5h3c1-5 2-9 5-11a5 5 0 0 1 3-9z" {...sh} />,
    r: <path d="M10 33h20v-4h-2l-1-11h2V9h-4v3h-3V9h-4v3h-3V9h-4v9h2l-1 11h-2z" {...sh} />,
    n: <path d="M11 33h19c0-9-1-16-6-21l-1-5-4 4c-5 1-9 5-9 10l4 2 4-3c0 4-4 7-7 13z" {...sh} />,
    b: (
      <g>
        <path d="M12 33h16l-2-5c3-3 4-8 0-13l-3 4 1-6c-1-1-2-2-4-2-4 4-6 11-2 17z" {...sh} />
        <circle cx="20" cy="7" r="2.5" {...sh} />
      </g>
    ),
    q: (
      <g>
        <path d="M10 33h20l-2-8 3-12-6 7-5-10-5 10-6-7 3 12z" {...sh} />
        {[[9, 12], [20, 9], [31, 12]].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="2.4" {...sh} />
        ))}
      </g>
    ),
    k: (
      <g>
        <path d="M11 33h18l-1-8c4-3 3-9-2-10-2 0-4 1-6 3-2-2-4-3-6-3-5 1-6 7-2 10z" {...sh} />
        <path d="M20 4v9M16 8h8" stroke={edge} strokeWidth="2.5" strokeLinecap="round" />
      </g>
    ),
  }[p.t];
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      {d}
    </svg>
  );
}
export const NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const VAR_KEY = 'mathpop-chess-variant-v1';

export function Chess({ grade, onEnd, playerId }) {
  const [level, levelUp] = useLevel(playerId, grade, 'chess');
  const [variant, setVariant] = useState(() => {
    try {
      return localStorage.getItem(VAR_KEY) || 'pawns';
    } catch {
      return 'pawns';
    }
  });
  const [phase, setPhase] = useState('pick'); // pick, you, pip, over, school
  const [school, setSchool] = useState(null);
  // The menu talks: tap a choice to hear it (and pick it), then Play.
  const [picked, setPicked] = useState(null);
  useEffect(() => {
    if (phase === 'pick') speak('Pick a chess game! Tap one to hear what it is, then tap Play.');
  }, [phase]);
  function hear(id) {
    playStickerPick();
    setPicked(id);
    const v = VARIANTS.find((x) => x[0] === id);
    const sc = SCHOOL.find((x) => x[0] === id);
    speak(v ? `${v[1]}. ${v[2]}` : `${sc[1]}. ${sc[2]}`);
  }
  function play() {
    if (!picked) return;
    if (VARIANTS.some((x) => x[0] === picked)) start(picked);
    else {
      setSchool(picked);
      setPhase('school');
    }
  }
  const [b, setB] = useState(null);
  const [sel, setSel] = useState(null);
  const [last, setLast] = useState(null);
  const [note, setNote] = useState(null);
  const [result, setResult] = useState(null);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const rules = chessRules(variant);
  function start(v) {
    setVariant(v);
    try {
      localStorage.setItem(VAR_KEY, v);
    } catch {
      /* private mode */
    }
    setB(chessSetup(v));
    setPhase('you');
    setSel(null);
    setLast(null);
    setNote(null);
    speak(`${VARIANTS.find((x) => x[0] === v)[2]} You're white. Tap a piece to see where it can go.`);
  }
  function finish(board, side) {
    const r = chessRules(variant).over(board, side);
    if (r === null) return false;
    // r is for `side`; the player is white.
    const you = side === 'w' ? r : -r;
    setPhase('over');
    if (you > 0) {
      playStickerStick();
      const lv = levelUp();
      setResult(`You win! Pip gets smarter: level ${lv}.`);
      speak('You win! Great thinking!');
      later(timers, () => onEnd(3), 2400);
    } else if (you < 0) {
      setResult('Pip wins this time!');
      speak('Pip wins this time. Want to try again?');
      later(timers, () => onEnd(0), 2400);
    } else {
      setResult("It's a draw!");
      speak("It's a draw!");
      later(timers, () => onEnd(1), 2400);
    }
    return true;
  }
  function pipTurn(board) {
    setPhase('pip');
    later(timers, () => {
      const depth = variant === 'full' ? 2 : level >= 3 ? 3 : 2;
      const m = pipMove(board, 'b', depth, rules, Math.max(0.004, 0.03 - level * 0.006));
      if (!m) return finish(board, 'b');
      const nb = rules.play(board, m);
      playStickerPick();
      setB(nb);
      setLast(m);
      if (finish(nb, 'w')) return undefined;
      if (variant === 'full' && inCheck(nb, 'w')) {
        setNote('Check! Keep your king safe.');
        speak('Check! Keep your king safe.');
      } else setNote(null);
      setPhase('you');
      return undefined;
    }, 650);
  }
  const legal = phase === 'you' && b ? rules.gen(b, 'w') : [];
  const targets = sel === null ? [] : legal.filter((m) => m.from === sel).map((m) => m.to);
  function tap(i) {
    if (phase !== 'you') return;
    const p = b[i];
    if (sel !== null && targets.includes(i)) {
      const m = legal.find((x) => x.from === sel && x.to === i);
      const nb = rules.play(b, m);
      if (b[i]) playCorrectChime();
      else playStickerPick();
      setB(nb);
      setLast(m);
      setSel(null);
      setNote(null);
      if (!finish(nb, 'b')) pipTurn(nb);
      return;
    }
    if (p && p.c === 'w') {
      if (!legal.some((m) => m.from === i)) {
        playIncorrectBuzz();
        setNote(variant === 'full' && inCheck(b, 'w') ? 'Your king is in check: move so it is safe.' : `That ${NAMES[p.t]} can't move right now.`);
        return;
      }
      playStickerPick();
      setSel(i);
      setNote(null);
      return;
    }
    setSel(null);
  }
  if (phase === 'school' && school) {
    return (
      <ChessSchool
        key={school}
        mode={school}
        onEnd={onEnd}
        onBack={() => {
          setSchool(null);
          setPhase('pick');
        }}
      />
    );
  }
  if (phase === 'pick' || !b) {
    return (
      <div className="game game-pz">
        <p className="ops-ask">Play Pip</p>
        <div className="bg-pick">
          {VARIANTS.map(([id, name, how]) => (
            <button key={id} type="button" className={`bg-var${picked === id ? ' ops-on' : ''}`} onClick={() => hear(id)} aria-pressed={picked === id}>
              <span className="bg-var-pieces">
                {(id === 'pawns' ? ['p'] : id === 'rooks' ? ['r', 'p'] : id === 'minor' ? ['n', 'b', 'r', 'p'] : ['k', 'q', 'r', 'b', 'n', 'p']).map((t) => (
                  <ChessPiece key={t} p={{ c: 'w', t }} size="28px" />
                ))}
              </span>
              <b>{name}</b>
              <small>{how}</small>
            </button>
          ))}
        </div>
        <p className="ops-ask">Chess School</p>
        <div className="cs-list">
          {SCHOOL.map(([id, name, how, t]) => (
            <button key={id} type="button" className={`cs-item${picked === id ? ' cs-picked' : ''}`} onClick={() => hear(id)} aria-pressed={picked === id}>
              <span className="cs-icon">
                <ChessPiece p={{ c: 'w', t }} size="30px" />
              </span>
              <span>
                <b>{name}</b>
                <small>{how}</small>
              </span>
            </button>
          ))}
        </div>
        {picked && (
          <div className="bg-playbar">
            <button type="button" className="bg-play" onClick={play}>
              <svg viewBox="0 0 20 20" width="22" height="22" aria-hidden="true">
                <path d="M6 3l11 7-11 7z" fill="currentColor" />
              </svg>
              Play {(VARIANTS.find((x) => x[0] === picked) || SCHOOL.find((x) => x[0] === picked))[1]}
            </button>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="game game-pz">
      <PuzzleTop level={level} score={variant === 'full' ? 'Full' : VARIANTS.find((x) => x[0] === variant)[1]} label="" />
      <p className="game-ask bg-turn">
        {phase === 'over' ? (
          result
        ) : phase === 'pip' ? (
          <>
            <Pip size={26} /> Pip is thinking…
          </>
        ) : (
          note || (sel === null ? 'Your turn: tap a white piece' : 'Tap a dot to move there')
        )}
      </p>
      <div className="bg-board">
        {b.map((p, i) => {
          const [r, c] = rc(i);
          return (
            <button key={i} type="button" className={`bg-sq${(r + c) % 2 ? ' bg-dark' : ''}${sel === i ? ' bg-sel' : ''}${last && (last.from === i || last.to === i) ? ' bg-last' : ''}`} onClick={() => tap(i)} aria-label={p ? `${p.c === 'w' ? 'white' : 'black'} ${NAMES[p.t]}` : 'empty'}>
              {p && <ChessPiece p={p} />}
              {targets.includes(i) && <i className={b[i] ? 'bg-take' : 'bg-dot'} />}
            </button>
          );
        })}
      </div>
      <div className="bakery-actions">
        <button type="button" className="bakery-btn" onClick={() => setPhase('pick')} disabled={phase === 'pip'}>
          Change pieces
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------------------- Checkers
const dark = (i) => {
  const [r, c] = rc(i);
  return (r + c) % 2 === 1;
};
function checkersSetup() {
  const b = Array(64).fill(null);
  for (let i = 0; i < 64; i++) {
    if (!dark(i)) continue;
    const [r] = rc(i);
    if (r < 3) b[i] = { c: 'b', k: false };
    if (r > 4) b[i] = { c: 'r', k: false };
  }
  return b;
}
function ckDirs(p) {
  const f = p.c === 'r' ? -1 : 1;
  return p.k ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[f, 1], [f, -1]];
}
function ckGen(b, side) {
  const jumps = [];
  const steps = [];
  b.forEach((p, i) => {
    if (!p || p.c !== side) return;
    const walk = (sq, board, path, caps, piece) => {
      let more = false;
      const [r, c] = rc(sq);
      for (const [dr, dc] of ckDirs(piece)) {
        const mid = at(r + dr, c + dc);
        const land = at(r + 2 * dr, c + 2 * dc);
        if (mid < 0 || land < 0) continue;
        if (!board[mid] || board[mid].c === side || caps.includes(mid) || board[land]) continue;
        more = true;
        const nb = [...board];
        nb[land] = piece;
        nb[sq] = null;
        const [lr] = rc(land);
        const crowned = !piece.k && (lr === 0 || lr === 7);
        if (crowned) jumps.push({ from: i, to: land, path: [...path, land], caps: [...caps, mid] });
        else walk(land, nb, [...path, land], [...caps, mid], piece);
      }
      if (!more && caps.length) jumps.push({ from: i, to: sq, path, caps });
    };
    walk(i, b, [], [], p);
    const [r, c] = rc(i);
    for (const [dr, dc] of ckDirs(p)) {
      const j = at(r + dr, c + dc);
      if (j >= 0 && !b[j]) steps.push({ from: i, to: j, path: [j], caps: [] });
    }
  });
  return jumps.length ? jumps : steps;
}
function ckPlay(b, m) {
  const n = [...b];
  const p = { ...n[m.from] };
  n[m.from] = null;
  for (const x of m.caps) n[x] = null;
  const [r] = rc(m.to);
  if ((p.c === 'r' && r === 0) || (p.c === 'b' && r === 7)) p.k = true;
  n[m.to] = p;
  return n;
}
const ckRules = {
  gen: ckGen,
  play: ckPlay,
  other: (s) => (s === 'r' ? 'b' : 'r'),
  over: (b, side) => (ckGen(b, side).length ? null : -1),
  score: (b, side) => {
    let s = 0;
    b.forEach((p, i) => {
      if (!p) return;
      const [r] = rc(i);
      const x = p.k ? 1.7 : 1 + 0.04 * (p.c === 'r' ? 7 - r : r);
      s += p.c === side ? x : -x;
    });
    return s / 15;
  },
};
const Disc = ({ p }) => (
  <svg viewBox="0 0 40 40" width="82%" height="82%" aria-hidden="true">
    <circle cx="20" cy="22" r="16" fill={p.c === 'r' ? '#a3202a' : '#0b0d14'} />
    <circle cx="20" cy="19" r="16" fill={p.c === 'r' ? '#e5484d' : '#2b3040'} />
    <circle cx="20" cy="19" r="10.5" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
    {p.k && <path d="M12 23l1.5-8 4 4 2.5-6 2.5 6 4-4 1.5 8z" fill="#ffd23f" stroke="#b45309" strokeWidth="1" />}
  </svg>
);

export function Checkers({ grade, onEnd, playerId }) {
  const [level, levelUp] = useLevel(playerId, grade, 'checkers');
  const [b, setB] = useState(checkersSetup);
  const [phase, setPhase] = useState('you');
  const [sel, setSel] = useState(null);
  const [last, setLast] = useState(null);
  const [note, setNote] = useState(null);
  const [result, setResult] = useState(null);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    speak("You're red. Move one step forward on the dark squares. Jump over Pip's pieces to take them!");
  }, []);
  const legal = phase === 'you' ? ckGen(b, 'r') : [];
  const mustJump = legal.some((m) => m.caps.length);
  const targets = sel === null ? [] : legal.filter((m) => m.from === sel).map((m) => m.to);
  const count = (c) => b.filter((p) => p && p.c === c).length;
  function finish(board, side) {
    if (ckRules.over(board, side) === null) return false;
    setPhase('over');
    if (side === 'b') {
      playStickerStick();
      const lv = levelUp();
      setResult(`You win! Pip gets smarter: level ${lv}.`);
      speak('You win!');
      later(timers, () => onEnd(3), 2400);
    } else {
      setResult('Pip wins this time!');
      speak('Pip wins this time!');
      later(timers, () => onEnd(0), 2400);
    }
    return true;
  }
  function tap(i) {
    if (phase !== 'you') return;
    if (sel !== null && targets.includes(i)) {
      const m = legal.find((x) => x.from === sel && x.to === i);
      const nb = ckPlay(b, m);
      if (m.caps.length) {
        playCorrectChime();
        speak(m.caps.length > 1 ? `Double jump! You took ${m.caps.length}!` : 'Jump! You took one!');
      } else playStickerPick();
      setB(nb);
      setLast(m);
      setSel(null);
      setNote(null);
      if (finish(nb, 'b')) return;
      setPhase('pip');
      later(timers, () => {
        const mv = pipMove(nb, 'b', Math.min(4, 1 + level), ckRules, Math.max(0.005, 0.05 - level * 0.01));
        const nb2 = ckPlay(nb, mv);
        playStickerPick();
        setB(nb2);
        setLast(mv);
        if (mv.caps.length) setNote(`Pip jumped and took ${mv.caps.length}!`);
        if (!finish(nb2, 'r')) setPhase('you');
      }, 700);
      return;
    }
    const p = b[i];
    if (p && p.c === 'r') {
      if (!legal.some((m) => m.from === i)) {
        playIncorrectBuzz();
        setNote(mustJump ? 'You have a jump! Jumps come first: find the piece that can jump.' : "That piece can't move right now.");
        return;
      }
      playStickerPick();
      setSel(i);
      setNote(null);
      return;
    }
    setSel(null);
  }
  return (
    <div className="game game-pz">
      <PuzzleTop level={level} score={`${count('r')} vs ${count('b')}`} label="pieces" />
      <p className="game-ask bg-turn">
        {phase === 'over' ? (
          result
        ) : phase === 'pip' ? (
          <>
            <Pip size={26} /> Pip is thinking…
          </>
        ) : (
          note || (mustJump ? 'You must jump! Tap the piece that can.' : sel === null ? 'Your turn: tap a red piece' : 'Tap a dot to move there')
        )}
      </p>
      <div className="bg-board bg-checkers">
        {b.map((p, i) => {
          const can = phase === 'you' && sel === null && mustJump && legal.some((m) => m.from === i);
          return (
            <button key={i} type="button" className={`bg-sq${dark(i) ? ' bg-dark' : ''}${sel === i ? ' bg-sel' : ''}${last && (last.from === i || last.to === i) ? ' bg-last' : ''}${can ? ' bg-must' : ''}`} onClick={() => tap(i)} aria-label={p ? `${p.c === 'r' ? 'red' : 'black'}${p.k ? ' king' : ''}` : 'empty'}>
              {p && <Disc p={p} />}
              {targets.includes(i) && <i className="bg-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Reversi
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const WEIGHTS = [100, -20, 10, 5, 5, 10, -20, 100, -20, -50, -2, -2, -2, -2, -50, -20, 10, -2, 1, 1, 1, 1, -2, 10, 5, -2, 1, 0, 0, 1, -2, 5, 5, -2, 1, 0, 0, 1, -2, 5, 10, -2, 1, 1, 1, 1, -2, 10, -20, -50, -2, -2, -2, -2, -50, -20, 100, -20, 10, 5, 5, 10, -20, 100];
function rvFlips(b, i, side) {
  if (b[i]) return [];
  const [r, c] = rc(i);
  const out = [];
  for (const [dr, dc] of DIRS) {
    const line = [];
    let k = 1;
    for (;;) {
      const j = at(r + dr * k, c + dc * k);
      if (j < 0 || !b[j]) break;
      if (b[j] === side) {
        out.push(...line);
        break;
      }
      line.push(j);
      k += 1;
    }
  }
  return out;
}
const rvGen = (b, side) => b.map((_, i) => ({ to: i, flips: rvFlips(b, i, side) })).filter((m) => m.flips.length);
function rvPlay(b, m, side) {
  const n = [...b];
  n[m.to] = side;
  for (const j of m.flips) n[j] = side;
  return n;
}
const rvRules = {
  gen: rvGen,
  play: rvPlay,
  other: (s) => (s === 'd' ? 'l' : 'd'),
  over: (b, side) => {
    if (rvGen(b, side).length || rvGen(b, side === 'd' ? 'l' : 'd').length) return null;
    const mine = b.filter((x) => x === side).length;
    const theirs = b.filter((x) => x && x !== side).length;
    return Math.sign(mine - theirs);
  },
  score: (b, side) => b.reduce((s, x, i) => s + (x ? (x === side ? WEIGHTS[i] : -WEIGHTS[i]) : 0), 0) / 200,
};
function rvSetup() {
  const b = Array(64).fill(null);
  b[27] = 'l';
  b[28] = 'd';
  b[35] = 'd';
  b[36] = 'l';
  return b;
}

export function Reversi({ grade, onEnd, playerId }) {
  const [level, levelUp] = useLevel(playerId, grade, 'reversi');
  const [b, setB] = useState(rvSetup);
  const [phase, setPhase] = useState('you');
  const [last, setLast] = useState(null);
  const [flipped, setFlipped] = useState([]);
  const [note, setNote] = useState(null);
  const [result, setResult] = useState(null);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    speak("You're dark. Put a disc where it traps Pip's light discs in a line. They flip to yours!");
  }, []);
  const mine = b.filter((x) => x === 'd').length;
  const pips = b.filter((x) => x === 'l').length;
  const legal = phase === 'you' ? rvGen(b, 'd') : [];
  function end(board) {
    const r = rvRules.over(board, 'd');
    if (r === null) return false;
    setPhase('over');
    const d = board.filter((x) => x === 'd').length;
    const l = board.filter((x) => x === 'l').length;
    if (r > 0) {
      playStickerStick();
      const lv = levelUp();
      setResult(`You win, ${d} to ${l}! Pip gets smarter: level ${lv}.`);
      speak(`You win, ${d} to ${l}!`);
      later(timers, () => onEnd(3), 2600);
    } else if (r < 0) {
      setResult(`Pip wins, ${l} to ${d}.`);
      speak(`Pip wins, ${l} to ${d}. Try again!`);
      later(timers, () => onEnd(0), 2600);
    } else {
      setResult(`A tie, ${d} to ${l}!`);
      later(timers, () => onEnd(1), 2600);
    }
    return true;
  }
  function pipTurn(board) {
    setPhase('pip');
    later(timers, () => {
      const moves = rvGen(board, 'l');
      if (!moves.length) {
        setNote('Pip has no move, so it’s your turn again.');
        if (!end(board)) {
          if (!rvGen(board, 'd').length) end(board);
          else setPhase('you');
        }
        return;
      }
      const m = pipMove(board, 'l', Math.min(3, level), rvRules, Math.max(0.02, 0.25 - level * 0.05));
      const nb = rvPlay(board, m, 'l');
      playStickerPick();
      setB(nb);
      setLast(m.to);
      setFlipped(m.flips);
      if (end(nb)) return;
      if (!rvGen(nb, 'd').length) {
        setNote('You have no move, so Pip goes again.');
        pipTurn(nb);
        return;
      }
      setNote(null);
      setPhase('you');
    }, 750);
  }
  function tap(i) {
    if (phase !== 'you') return;
    const m = legal.find((x) => x.to === i);
    if (!m) {
      if (!b[i]) {
        playIncorrectBuzz();
        setNote('Put it on a dot: a spot that traps Pip’s discs in a line.');
      }
      return;
    }
    playCorrectChime();
    speak(m.flips.length === 1 ? 'You flipped 1!' : `You flipped ${m.flips.length}!`);
    const nb = rvPlay(b, m, 'd');
    setB(nb);
    setLast(i);
    setFlipped(m.flips);
    setNote(null);
    if (!end(nb)) pipTurn(nb);
  }
  return (
    <div className="game game-pz">
      <PuzzleTop level={level} score={`${mine} vs ${pips}`} label="discs" />
      <p className="game-ask bg-turn">
        {phase === 'over' ? (
          result
        ) : phase === 'pip' ? (
          <>
            <Pip size={26} /> Pip is thinking…
          </>
        ) : (
          note || 'Your turn: tap a dot'
        )}
      </p>
      <div className="bg-board bg-reversi">
        {b.map((x, i) => (
          <button key={i} type="button" className={`bg-sq rv-sq${last === i ? ' bg-last' : ''}`} onClick={() => tap(i)} aria-label={x ? (x === 'd' ? 'dark' : 'light') : 'empty'}>
            {x && <i key={`${x}${flipped.includes(i) ? last : ''}`} className={`rv-disc rv-${x}${flipped.includes(i) ? ' rv-flip' : ''}`} />}
            {!x && legal.some((m) => m.to === i) && <i className="bg-dot" />}
          </button>
        ))}
      </div>
    </div>
  );
}
