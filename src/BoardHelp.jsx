import { useEffect, useState } from 'react';
import Pip from './Pip.jsx';
import { playStickerPick, speak, stopSpeaking } from './sound.js';
import { ChessPiece, NAMES, chessPlay, inCheck, pseudo } from './BoardGames.jsx';

// Help for the board games (Chess, Checkers, Reversi): a How to play
// lesson (said out loud, with pictures; Chess has "Meet the pieces", where
// tapping a piece shows how it moves), and the words for Help me: why a
// move is good.

const SEEN_KEY = 'mathpop-howto-seen-v1';
export function howtoSeen(game) {
  try {
    return Boolean((JSON.parse(localStorage.getItem(SEEN_KEY)) || {})[game]);
  } catch {
    return false;
  }
}
function markSeen(game) {
  try {
    const all = JSON.parse(localStorage.getItem(SEEN_KEY)) || {};
    all[game] = true;
    localStorage.setItem(SEEN_KEY, JSON.stringify(all));
  } catch {
    /* private mode */
  }
}

// A small board picture: n×n cells; `cells` maps index → 'wp' (white
// chess piece p), 'bn' (black knight), 'R'/'B' (red/black checker), 'D'/'L'
// (dark/light disc), '.' (a dot: you can go here), 'x' (a ring: take).
function Mini({ n = 4, cells, checkers, reversi }) {
  return (
    <div className={`hm-board${reversi ? ' hm-rv' : ''}`} style={{ '--n': n }}>
      {Array.from({ length: n * n }, (_, i) => {
        const r = Math.floor(i / n);
        const c = i % n;
        const v = cells[i];
        const dark = (r + c) % 2 === 1;
        return (
          <span key={i} className={`hm-sq${dark ? (checkers ? ' hm-cdark' : ' hm-dark') : ''}`}>
            {v && /^[wb][prnbqk]$/.test(v) && <ChessPiece p={{ c: v[0], t: v[1] }} />}
            {(v === 'R' || v === 'B' || v === 'RK') && <i className={`hm-ck${v === 'B' ? ' hm-ck-b' : ''}`}>
                {v === 'RK' && (
                  <svg viewBox="0 0 20 14" width="60%" aria-hidden="true">
                    <path d="M2 13l1.5-9 4.5 4.5 2-7 2 7 4.5-4.5 1.5 9z" fill="#ffd23f" stroke="#b45309" strokeWidth="1" />
                  </svg>
                )}
              </i>}
            {(v === 'D' || v === 'L') && <i className={`hm-rd${v === 'L' ? ' hm-rd-l' : ''}`} />}
            {v === '.' && <i className="bg-dot" />}
            {v === 'x' && <i className="bg-take" />}
          </span>
        );
      })}
    </div>
  );
}

const PIECE_SAYS = {
  p: 'The pawn steps forward one square, or two on its first move. It takes slanting, one square forward.',
  r: 'The rook goes straight: up, down, left and right, as far as it wants.',
  n: 'The knight jumps in an L: two squares one way, then one to the side. It can jump over pieces!',
  b: 'The bishop goes slanting, as far as it wants. It always stays on its own color.',
  q: 'The queen goes straight or slanting, as far as she wants. She is the strongest piece!',
  k: 'The king steps one square any way. Keep him safe: if he can’t get away, the game is over.',
};
function PieceMoves() {
  const [t, setT] = useState('r');
  const at = t === 'p' ? 52 : 35;
  const b = Array(64).fill(null);
  b[at] = { c: 'w', t };
  const dots = pseudo(b, 'w').map((m) => m.to);
  useEffect(() => {
    speak(PIECE_SAYS[t]);
  }, [t]);
  return (
    <div className="hm-pieces">
      <div className="hm-pick">
        {['p', 'r', 'n', 'b', 'q', 'k'].map((x) => (
          <button key={x} type="button" className={`hm-pbtn${x === t ? ' hm-pon' : ''}`} onClick={() => setT(x)} aria-label={NAMES[x]}>
            <ChessPiece p={{ c: 'w', t: x }} size="34px" />
            <small>{NAMES[x]}</small>
          </button>
        ))}
      </div>
      <div className="hm-board" style={{ '--n': 8 }}>
        {b.map((p, i) => (
          <span key={i} className={`hm-sq${(Math.floor(i / 8) + (i % 8)) % 2 ? ' hm-dark' : ''}`}>
            {p && <ChessPiece p={p} />}
            {dots.includes(i) && <i className="bg-dot" />}
          </span>
        ))}
      </div>
      <p className="hm-line">{PIECE_SAYS[t]}</p>
    </div>
  );
}

const GOALS = {
  pawns: 'Pawn Wars: win by getting a pawn to the other side first, by taking all of Pip’s pawns, or when Pip has no moves.',
  rooks: 'Get a pawn to the other side first, or take all of Pip’s pieces!',
  minor: 'Get a pawn to the other side first, or take all of Pip’s pieces!',
  full: 'Checkmate! Attack Pip’s king so it can’t get away. When your king is attacked, that’s “check”: keep him safe.',
};
function steps(game, variant) {
  if (game === 'chess') {
    return [
      { say: 'You are white and Pip is black. You take turns: one move each.', pic: <Mini cells={{ 1: 'bp', 2: 'bp', 13: 'wp', 14: 'wp' }} /> },
      { say: 'Tap one of your pieces. Green dots show where it can go. A red ring means you can take Pip’s piece there.', pic: <Mini cells={{ 13: 'wr', 9: '.', 5: '.', 1: 'x', 12: '.', 14: '.', 15: '.', 0: 'bp' }} /> },
      { say: 'Meet the pieces! Tap each one to see how it moves.', pieces: true },
      { say: GOALS[variant] || GOALS.full, pic: variant === 'full' ? <Mini cells={{ 1: 'bk', 13: 'wq', 9: '.', 5: '.' }} /> : <Mini cells={{ 1: 'wp', 5: 'bp', 13: 'wp' }} /> },
      { say: 'Stuck? Tap Help me, and Pip shows you a good move and why. Oops? Tap Take back to try again.', help: true },
    ];
  }
  if (game === 'checkers') {
    return [
      { say: 'You are red. Move one step forward, slanting, on the dark squares.', pic: <Mini checkers cells={{ 13: 'R', 8: '.', 10: '.' }} /> },
      { say: 'Jump over Pip’s piece into the empty square behind it to take it. If you can jump, you must jump! Those pieces glow.', pic: <Mini checkers cells={{ 13: 'R', 10: 'B', 7: '.' }} /> },
      { say: 'Get a piece all the way to the other side and it becomes a king with a crown. Kings can go backward too!', pic: <Mini checkers cells={{ 1: 'RK', 4: '.', 6: '.' }} /> },
      { say: 'You win when Pip can’t move: no pieces left, or every piece is stuck.' },
      { say: 'Stuck? Tap Help me, and Pip shows you a good move and why. Oops? Tap Take back.', help: true },
    ];
  }
  return [
    { say: 'You are dark. Put a disc where it traps Pip’s light discs in a line between your discs.', pic: <Mini reversi cells={{ 4: 'D', 5: 'L', 6: 'L', 7: '.' }} /> },
    { say: 'All the trapped discs flip to your color!', pic: <Mini reversi cells={{ 4: 'D', 5: 'D', 6: 'D', 7: 'D' }} /> },
    { say: 'The dots show where you can play. Corners are the best spots: they can never be flipped back.', pic: <Mini reversi cells={{ 0: '.', 5: 'L', 10: 'D' }} /> },
    { say: 'When nobody can play, count the discs. The most discs wins!' },
    { say: 'Stuck? Tap Help me, and Pip shows you a good move and why. Oops? Tap Take back.', help: true },
  ];
}

export function HowTo({ game, variant, onDone }) {
  const list = steps(game, variant);
  const [k, setK] = useState(0);
  const st = list[k];
  useEffect(() => {
    if (!st.pieces) speak(st.say);
    else speak(st.say);
  }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
  function done() {
    stopSpeaking();
    markSeen(game);
    onDone();
  }
  return (
    <div className="hm-wrap" role="dialog" aria-label="How to play">
      <div className="hm-card">
        <div className="hm-head">
          <Pip size={36} />
          <b>How to play</b>
          <span className="hm-count">
            {k + 1} of {list.length}
          </span>
        </div>
        {st.pieces ? <PieceMoves /> : st.pic}
        {!st.pieces && (
          <button type="button" className="hm-say" onClick={() => speak(st.say)}>
            {st.say}
          </button>
        )}
        {st.help && (
          <div className="hm-helpbtns" aria-hidden="true">
            <span className="bakery-btn">Help me</span>
            <span className="bakery-btn">Take back</span>
          </div>
        )}
        <div className="tk-btns">
          {k > 0 && (
            <button type="button" className="tk-next" onClick={() => setK(k - 1)}>
              Back
            </button>
          )}
          {k < list.length - 1 ? (
            <button
              type="button"
              className="tk-ready"
              onClick={() => {
                playStickerPick();
                setK(k + 1);
              }}
            >
              Next
            </button>
          ) : (
            <button type="button" className="tk-ready" onClick={done}>
              Let’s play!
            </button>
          )}
        </div>
        <button type="button" className="hm-skip" onClick={done}>
          Skip
        </button>
      </div>
    </div>
  );
}

// Why a move is good, in words.
export function chessWhy(b, m, variant) {
  const p = b[m.from];
  const tgt = b[m.to];
  const nb = chessPlay(b, m, variant);
  const name = NAMES[p.t];
  if (tgt) return `Take Pip’s ${NAMES[tgt.t]} with your ${name}!`;
  if (variant === 'full' && inCheck(nb, 'b')) return `Check! Your ${name} attacks Pip’s king.`;
  const wasAttacked = pseudo(b, 'b').some((x) => x.to === m.from);
  const safe = !pseudo(nb, 'b').some((x) => x.to === m.to);
  if (wasAttacked && safe) return `Move your ${name} away: Pip could take it where it was!`;
  if (p.t === 'p' && variant !== 'full') return 'Push this pawn closer to the other side!';
  return safe ? `Move your ${name} here. It’s safe from Pip.` : `Try your ${name} here.`;
}
// After your move: is the piece you moved in danger (Pip can take it and
// you can't take back)?
export function chessDanger(nb, to) {
  if (!pseudo(nb, 'b').some((x) => x.to === to)) return null;
  const test = [...nb];
  const mine = test[to];
  test[to] = { c: 'b', t: 'p' };
  const guarded = pseudo(test, 'w').some((x) => x.to === to);
  if (guarded && mine.t === 'p') return null;
  return `Careful! Pip can take your ${NAMES[mine.t]} there. Tap Take back to try another move.`;
}
export function checkersWhy(m, crowned) {
  if (m.caps.length > 1) return `Double jump! You take ${m.caps.length} of Pip’s pieces!`;
  if (m.caps.length) return 'Jump over Pip’s piece to take it!';
  if (crowned) return 'Get to the end and make a king!';
  return 'Step here: Pip can’t jump this piece.';
}
export function reversiWhy(m) {
  const corner = [0, 7, 56, 63].includes(m.to);
  if (corner) return `Take the corner! Corners never flip back, and you flip ${m.flips.length}.`;
  return `Put it here: you flip ${m.flips.length} of Pip’s ${m.flips.length === 1 ? 'disc' : 'discs'}!`;
}
