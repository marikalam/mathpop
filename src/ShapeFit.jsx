import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { playCorrectChime, playStickerPick, playStickerStick, speak } from './sound.js';
import { PuzzleTop, useLevel } from './puzzleKit.jsx';

// Shape Fit: fill every square of the board with block pieces. Some
// pieces are already in place; drag the others in (tap a piece to turn
// it, Flip to flip it). Each puzzle is made by tiling the board at random,
// so there is always a way; any way that fills the board wins. Boards get
// bigger, with more pieces to place, level by level. Three puzzles a game.

// Pieces of 3 to 5 squares, as [row, col] cells.
const SHAPES = [
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [0, 3]],
  [[0, 0], [1, 0], [2, 0], [2, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 1]],
  [[0, 1], [0, 2], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]],
  [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]],
  [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]],
  [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]],
  [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]],
  [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
  [[0, 1], [1, 0], [1, 1], [2, 1], [3, 1]],
  [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3]],
  [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]],
  [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]],
];
const COLORS = ['#ff6b9a', '#3b8cf0', '#ffb000', '#2fae6b', '#9b6bf2', '#ff8a3d', '#14b8a6', '#e5484d', '#6366f1', '#84cc16', '#0ea5e9', '#d946ef', '#a16207', '#f43f5e', '#22c55e', '#64748b', '#eab308', '#7c3aed'];
// [rows, cols, pieces to place].
const SIZES = [
  [3, 4, 2],
  [3, 5, 3],
  [4, 5, 3],
  [4, 6, 4],
  [5, 6, 4],
  [5, 7, 5],
  [5, 8, 6],
  [5, 9, 7],
  [5, 10, 8],
  [5, 11, 9],
];
const START = { p: 0, k: 0, 1: 1, 2: 2, 3: 3, 4: 4 };

const shuffle = (a) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
function norm(cells) {
  const r0 = Math.min(...cells.map((x) => x[0]));
  const c0 = Math.min(...cells.map((x) => x[1]));
  return cells.map(([r, c]) => [r - r0, c - c0]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}
const turn = (cells) => norm(cells.map(([r, c]) => [c, -r]));
const flip = (cells) => norm(cells.map(([r, c]) => [r, -c]));
function orientations(cells) {
  const out = [];
  let x = norm(cells);
  for (let f = 0; f < 2; f++) {
    for (let k = 0; k < 4; k++) {
      if (!out.some((o) => JSON.stringify(o) === JSON.stringify(x))) out.push(x);
      x = turn(x);
    }
    x = flip(x);
  }
  return out;
}
const ORIENTS = SHAPES.map(orientations);

// Tile an R×C board with different shapes: [{shape, cells, r, c}], or null.
function tile(R, C) {
  const grid = Array(R * C).fill(-1);
  const out = [];
  const used = new Set();
  let steps = 0;
  function smallHole() {
    const seen = new Set();
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] !== -1 || seen.has(i)) continue;
      let size = 0;
      const stack = [i];
      seen.add(i);
      while (stack.length) {
        const j = stack.pop();
        size += 1;
        const r = Math.floor(j / C);
        const c = j % C;
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const rr = r + dr;
          const cc = c + dc;
          const k = rr * C + cc;
          if (rr >= 0 && rr < R && cc >= 0 && cc < C && grid[k] === -1 && !seen.has(k)) {
            seen.add(k);
            stack.push(k);
          }
        }
      }
      if (size < 3) return true;
    }
    return false;
  }
  function rec() {
    if (++steps > 4000) return false;
    const i = grid.indexOf(-1);
    if (i < 0) return true;
    const r = Math.floor(i / C);
    const c = i % C;
    for (const s of shuffle(SHAPES.map((_, k) => k))) {
      if (used.has(s)) continue;
      for (const o of shuffle(ORIENTS[s])) {
        const ar = r - o[0][0];
        const ac = c - o[0][1];
        const ok = o.every(([dr, dc]) => {
          const rr = ar + dr;
          const cc = ac + dc;
          return rr >= 0 && rr < R && cc >= 0 && cc < C && grid[rr * C + cc] === -1;
        });
        if (!ok) continue;
        for (const [dr, dc] of o) grid[(ar + dr) * C + ac + dc] = out.length;
        out.push({ shape: s, cells: o, r: ar, c: ac });
        used.add(s);
        if (!smallHole() && rec()) return true;
        used.delete(s);
        out.pop();
        for (const [dr, dc] of o) grid[(ar + dr) * C + ac + dc] = -1;
      }
    }
    return false;
  }
  return rec() ? out : null;
}

function makePuzzle(index) {
  const [R, C, free] = SIZES[index];
  let sol = null;
  while (!sol) sol = tile(R, C);
  const freeIds = new Set(shuffle(sol.map((_, i) => i)).slice(0, Math.min(free, sol.length)));
  const colors = shuffle(COLORS);
  const pieces = sol.map((p, i) => {
    const isFree = freeIds.has(i);
    // From the third size on, loose pieces come turned or flipped.
    let cells = p.cells;
    if (isFree && index >= 2) {
      const o = ORIENTS[p.shape];
      cells = o[Math.floor(Math.random() * o.length)];
    }
    return { id: i, color: colors[i % colors.length], cells, sol: p, fixed: !isFree, at: isFree ? null : { r: p.r, c: p.c } };
  });
  return { R, C, pieces };
}

function occupancy(pz, pieces, skip) {
  const grid = Array(pz.R * pz.C).fill(null);
  for (const p of pieces) {
    if (!p.at || p.id === skip) continue;
    for (const [dr, dc] of p.cells) grid[(p.at.r + dr) * pz.C + p.at.c + dc] = p;
  }
  return grid;
}
function fits(pz, pieces, piece, cells, at) {
  const grid = occupancy(pz, pieces, piece.id);
  return cells.every(([dr, dc]) => {
    const r = at.r + dr;
    const c = at.c + dc;
    return r >= 0 && r < pz.R && c >= 0 && c < pz.C && !grid[r * pz.C + c];
  });
}

function PieceView({ cells, color, size, className = '', style, ...rest }) {
  const rows = Math.max(...cells.map((x) => x[0])) + 1;
  const cols = Math.max(...cells.map((x) => x[1])) + 1;
  return (
    <span className={`sf-piece ${className}`} style={{ width: cols * size, height: rows * size, '--pc': color, ...style }} {...rest}>
      {cells.map(([r, c]) => (
        <i key={`${r}-${c}`} data-cell={`${r},${c}`} className="sf-block" style={{ left: c * size, top: r * size, width: size, height: size }} />
      ))}
    </span>
  );
}

export default function ShapeFit({ grade, onEnd, playerId }) {
  const [level, levelUp] = useLevel(playerId, grade, 'shapeFit');
  const index = (lv) => Math.min(SIZES.length - 1, (START[grade] || 0) + lv - 1);
  const [pz, setPz] = useState(() => makePuzzle(index(level)));
  const [pieces, setPieces] = useState(pz.pieces);
  const [sel, setSel] = useState(null);
  const [drag, setDrag] = useState(null);
  const [hints, setHints] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(0);
  const [banner, setBanner] = useState(null);
  const [won, setWon] = useState(false);
  const boardRef = useRef(null);
  const dragRef = useRef(null);
  dragRef.current = drag;

  useEffect(() => {
    speak('Fill every square! Drag the pieces onto the board. Tap a piece to turn it.');
  }, []);

  const cs = () => (boardRef.current ? boardRef.current.getBoundingClientRect().width / pz.C : 32);
  const [size, setSize] = useState(32);
  useLayoutEffect(() => {
    const f = () => setSize(cs());
    f();
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, [pz]); // eslint-disable-line react-hooks/exhaustive-deps
  const filled = occupancy(pz, pieces).filter(Boolean).length;
  const left = pz.R * pz.C - filled;

  // Where the dragged piece would land, from the pointer.
  function landing(d) {
    const box = boardRef.current.getBoundingClientRect();
    const size = box.width / pz.C;
    const piece = pieces.find((p) => p.id === d.id);
    const [gr, gc] = piece.cells[d.k];
    const r = Math.floor((d.y - box.top) / size) - gr;
    const c = Math.floor((d.x - box.left) / size) - gc;
    const inside = d.x >= box.left && d.x <= box.right && d.y >= box.top && d.y <= box.bottom;
    if (!inside) return null;
    return { r, c, ok: fits(pz, pieces, piece, piece.cells, { r, c }) };
  }

  function down(e, piece) {
    if (piece.fixed || won || banner) return;
    e.preventDefault();
    const cellEl = e.target.closest('[data-cell]');
    const [r, c] = cellEl ? cellEl.dataset.cell.split(',').map(Number) : piece.cells[0];
    const k = Math.max(0, piece.cells.findIndex(([a, b]) => a === r && b === c));
    setSel(piece.id);
    setDrag({ id: piece.id, k, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moved: false });
  }
  useEffect(() => {
    if (!drag) return undefined;
    function move(e) {
      const d = dragRef.current;
      if (!d) return;
      const moved = d.moved || Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 8;
      setDrag({ ...d, x: e.clientX, y: e.clientY, moved });
    }
    function up() {
      const d = dragRef.current;
      setDrag(null);
      if (!d) return;
      if (!d.moved) {
        rotate(d.id, turn);
        return;
      }
      const spot = landing(d);
      if (spot && spot.ok) {
        playStickerPick();
        const next = pieces.map((p) => (p.id === d.id ? { ...p, at: { r: spot.r, c: spot.c } } : p));
        setPieces(next);
        check(next);
      } else {
        setPieces(pieces.map((p) => (p.id === d.id ? { ...p, at: null } : p)));
      }
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [drag !== null, pieces]); // eslint-disable-line react-hooks/exhaustive-deps

  // Turn or flip a piece. On the board it stays put if it still fits;
  // otherwise it goes back to the tray.
  function rotate(id, how) {
    const piece = pieces.find((p) => p.id === id);
    if (!piece || piece.fixed) return;
    playStickerPick();
    const cells = how(piece.cells);
    const at = piece.at && fits(pz, pieces, piece, cells, piece.at) ? piece.at : null;
    const next = pieces.map((p) => (p.id === id ? { ...p, cells, at } : p));
    setPieces(next);
    setSel(id);
    if (at) check(next);
  }

  function check(next) {
    const n = occupancy(pz, next).filter(Boolean).length;
    if (n < pz.R * pz.C) return;
    setWon(true);
    playCorrectChime();
    const stars = hints === 0 ? 3 : hints === 1 ? 2 : 1;
    const total = score + stars;
    setScore(total);
    speak(`You filled all ${pz.R * pz.C} squares!`);
    setTimeout(() => {
      playStickerStick();
      const lv = levelUp();
      const count = done + 1;
      setDone(count);
      setBanner(count >= 3 ? 'You did it!' : `Level ${lv}!`);
      setTimeout(() => {
        setBanner(null);
        if (count >= 3) {
          onEnd(total);
          return;
        }
        const np = makePuzzle(index(lv));
        setPz(np);
        setPieces(np.pieces);
        setSel(null);
        setHints(0);
        setWon(false);
      }, 1400);
    }, 1200);
  }

  // Show me: put one loose piece where it goes in the made-up answer
  // (moving off any piece in the way).
  function showMe() {
    if (won) return;
    const wrong = pieces.filter((p) => !p.fixed && !(p.at && p.at.r === p.sol.r && p.at.c === p.sol.c && JSON.stringify(p.cells) === JSON.stringify(p.sol.cells)));
    if (!wrong.length) return;
    const piece = wrong.find((p) => p.id === sel) || wrong[0];
    const target = new Set(piece.sol.cells.map(([dr, dc]) => `${piece.sol.r + dr},${piece.sol.c + dc}`));
    const next = pieces.map((p) => {
      if (p.id === piece.id) return { ...p, cells: p.sol.cells, at: { r: p.sol.r, c: p.sol.c } };
      if (p.fixed || !p.at) return p;
      const hit = p.cells.some(([dr, dc]) => target.has(`${p.at.r + dr},${p.at.c + dc}`));
      return hit ? { ...p, at: null } : p;
    });
    setHints((h) => h + 1);
    setSel(piece.id);
    setPieces(next);
    speak('This piece goes here.');
    check(next);
  }

  const tray = pieces.filter((p) => !p.fixed && !p.at);
  const selPiece = pieces.find((p) => p.id === sel && !p.fixed);
  const spot = drag && drag.moved ? landing(drag) : null;
  const dragging = drag && drag.moved ? pieces.find((p) => p.id === drag.id) : null;
  const trayBlock = Math.max(16, Math.min(26, Math.floor(size * 0.62)));

  return (
    <div className="game game-pz sf-game">
      <PuzzleTop level={level} score={score} label={score === 1 ? 'star' : 'stars'} />
      <p className="game-ask">
        Fill every square · <b>{left}</b> {left === 1 ? 'square' : 'squares'} left
      </p>
      <div className="sf-board" ref={boardRef} style={{ '--cols': pz.C, '--rows': pz.R }}>
        {Array.from({ length: pz.R * pz.C }, (_, i) => (
          <span key={i} className="sf-cell" />
        ))}
        {pieces
          .filter((p) => p.at && !(dragging && dragging.id === p.id))
          .map((p) => (
            <PieceView
              key={p.id}
              cells={p.cells}
              color={p.color}
              size={size}
              className={`${p.fixed ? 'sf-fixed' : 'sf-loose'}${p.id === sel ? ' sf-sel' : ''}`}
              style={{ left: p.at.c * size, top: p.at.r * size }}
              onPointerDown={(e) => down(e, p)}
            />
          ))}
        {spot &&
          dragging.cells.map(([dr, dc]) => {
            const r = spot.r + dr;
            const c = spot.c + dc;
            if (r < 0 || c < 0 || r >= pz.R || c >= pz.C) return null;
            return <i key={`${r}-${c}`} className={`sf-ghost${spot.ok ? '' : ' sf-bad'}`} style={{ left: c * size, top: r * size, width: size, height: size }} />;
          })}
      </div>
      <div className="sf-tray">
        {tray.length ? (
          tray.map((p) => (
            <button key={p.id} type="button" className={`sf-slot${p.id === sel ? ' sf-slot-on' : ''}${dragging && dragging.id === p.id ? ' sf-slot-gone' : ''}`} aria-label="Piece" onPointerDown={(e) => down(e, p)}>
              <PieceView cells={p.cells} color={p.color} size={trayBlock} />
            </button>
          ))
        ) : (
          <span className="sf-empty">{won ? 'All filled!' : 'Every piece is on the board. Move them so they all fit!'}</span>
        )}
      </div>
      <div className="bakery-actions sf-actions">
        <button type="button" className="bakery-btn" disabled={!selPiece || won} onClick={() => rotate(sel, turn)}>
          Turn
        </button>
        <button type="button" className="bakery-btn" disabled={!selPiece || won} onClick={() => rotate(sel, flip)}>
          Flip
        </button>
        <button type="button" className="bg-help" disabled={won} onClick={showMe}>
          Show me
        </button>
        <button
          type="button"
          className="bakery-btn"
          disabled={won}
          onClick={() => {
            setPieces(pieces.map((p) => (p.fixed ? p : { ...p, at: null })));
            setSel(null);
          }}
        >
          Start over
        </button>
      </div>
      {dragging && (
        <PieceView
          cells={dragging.cells}
          color={dragging.color}
          size={size}
          className="sf-float"
          style={{ left: drag.x - (dragging.cells[drag.k][1] + 0.5) * size, top: drag.y - (dragging.cells[drag.k][0] + 0.5) * size }}
        />
      )}
      {banner && <div className="pz-banner">{banner}</div>}
    </div>
  );
}
