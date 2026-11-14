import { useArcade, rand, speak, text, roundRect, playStickerPick, playCorrectChime } from './kit.jsx';

// Sweet Tens: a grid of number candies. Swap two side by side (tap one,
// then its neighbor, or drag) to line up three in a row or column that
// make the target: the same number for Pre-K and K, 10 for 1st and 2nd,
// 20 for 3rd and 4th (making ten, Singapore style). Lines pop, candies
// fall, and new lines can pop too. 20 moves; a hint glows if you're stuck.
const CANDY = ['#ff6b9a', '#3b8cf0', '#ffb000', '#2fae6b', '#9b6bf2', '#ff8a3d', '#14b8a6', '#e5484d', '#6366f1', '#84cc16', '#f472b6', '#0ea5e9'];

export default function SweetTens({ grade, onEnd }) {
  const { view } = useArcade({
    hearts: 0,
    onEnd,
    setup(g) {
      const same = grade === 'p' || grade === 'k';
      const N = same ? 5 : 6;
      const T = grade === '3' || grade === '4' ? 20 : 10;
      const lo = same ? 1 : T === 20 ? 2 : 1;
      const hi = same ? (grade === 'p' ? 4 : 5) : T === 20 ? 12 : 8;
      const fits = (a, b, c) => (same ? a === b && b === c : a + b + c === T);
      let grid;
      let sel = null;
      let moves = 20;
      let busy = 0;
      let idle = 0;
      let hint = null;
      let dragFrom = null;
      const cell = () => Math.min((g.W - 20) / N, (g.H - 20) / N);
      const ox = () => (g.W - cell() * N) / 2;
      const oy = () => (g.H - cell() * N) / 2;
      const newV = () => rand(lo, hi);
      function matches(gr) {
        const out = new Set();
        for (let r = 0; r < N; r++)
          for (let c = 0; c < N; c++) {
            if (c + 2 < N && fits(gr[r][c].v, gr[r][c + 1].v, gr[r][c + 2].v)) [0, 1, 2].forEach((k) => out.add(`${r},${c + k}`));
            if (r + 2 < N && fits(gr[r][c].v, gr[r + 1][c].v, gr[r + 2][c].v)) [0, 1, 2].forEach((k) => out.add(`${r + k},${c}`));
          }
        return out;
      }
      const swap = (gr, a, b) => {
        const t = gr[a[0]][a[1]];
        gr[a[0]][a[1]] = gr[b[0]][b[1]];
        gr[b[0]][b[1]] = t;
      };
      function findMove() {
        for (let r = 0; r < N; r++)
          for (let c = 0; c < N; c++)
            for (const [dr, dc] of [
              [0, 1],
              [1, 0],
            ]) {
              const r2 = r + dr;
              const c2 = c + dc;
              if (r2 >= N || c2 >= N) continue;
              swap(grid, [r, c], [r2, c2]);
              const ok = matches(grid).size > 0;
              swap(grid, [r, c], [r2, c2]);
              if (ok) return [
                [r, c],
                [r2, c2],
              ];
            }
        return null;
      }
      function fresh() {
        do {
          grid = Array.from({ length: N }, () => Array.from({ length: N }, () => ({ v: newV(), dy: 0, pop: 0 })));
          let m;
          let guard = 0;
          while ((m = matches(grid)).size && guard++ < 200) for (const k of m) {
            const [r, c] = k.split(',').map(Number);
            grid[r][c].v = newV();
          }
        } while (!findMove());
      }
      function promptLine() {
        g.prompt(same ? `3 the same · ${moves} moves` : `Make ${T} · ${moves} moves`, false);
      }
      function settle() {
        const m = matches(grid);
        if (!m.size) {
          busy = 0;
          if (!findMove()) {
            fresh();
            g.banner('New candies!', 1200);
          }
          if (moves <= 0) g.end(`Out of moves! You made ${g.score} ${same ? 'lines' : `${T}s`}!`);
          return;
        }
        const lines = Math.max(1, Math.round(m.size / 3));
        let sx = 0;
        let sy = 0;
        for (const k of m) {
          const [r, c] = k.split(',').map(Number);
          grid[r][c].pop = 0.001;
          sx += ox() + (c + 0.5) * cell();
          sy += oy() + (r + 0.5) * cell();
          g.burst(ox() + (c + 0.5) * cell(), oy() + (r + 0.5) * cell(), CANDY[grid[r][c].v % CANDY.length], 8, 160);
        }
        g.win(lines, sx / m.size, sy / m.size);
        if (!same) speak(`${T}!`);
        setTimeout(() => {
          // Gravity: the candies above fall into the gaps; new ones drop in.
          for (let c = 0; c < N; c++) {
            const col = [];
            for (let r = N - 1; r >= 0; r--) if (!m.has(`${r},${c}`)) col.push(grid[r][c]);
            let r = N - 1;
            for (const k of col) {
              const fromR = grid.findIndex((row) => row[c] === k);
              k.dy += (fromR - r) * cell();
              grid[r][c] = k;
              r--;
            }
            let fall = 1;
            for (; r >= 0; r--) grid[r][c] = { v: newV(), dy: -(fall++ + r) * cell() * 0.6, pop: 0 };
          }
          setTimeout(settle, 380);
        }, 260);
      }
      function trySwap(a, b) {
        if (busy) return;
        if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) !== 1) return;
        busy = 1;
        idle = 0;
        hint = null;
        playStickerPick();
        swap(grid, a, b);
        if (matches(grid).size) {
          moves -= 1;
          promptLine();
          settle();
        } else {
          setTimeout(() => {
            swap(grid, a, b);
            busy = 0;
            g.float(ox() + (b[1] + 0.5) * cell(), oy() + (b[0] + 0.5) * cell(), same ? 'Not 3 the same' : `Not ${T}`, '#64748b');
          }, 280);
        }
      }
      const cellAt = (p) => {
        const c = Math.floor((p.x - ox()) / cell());
        const r = Math.floor((p.y - oy()) / cell());
        return r >= 0 && r < N && c >= 0 && c < N ? [r, c] : null;
      };
      return {
        // For automated play tests in development only.
        ...(import.meta.env.DEV ? { dbg: () => ({ move: findMove(), cell: cell(), ox: ox(), oy: oy(), busy }) } : {}),
        start() {
          fresh();
          promptLine();
          speak(same ? 'Swap candies to line up three the same!' : `Swap candies to line up three that make ${T}!`);
        },
        step(dt) {
          for (const row of grid) for (const k of row) {
            k.dy *= Math.pow(0.0001, dt);
            if (Math.abs(k.dy) < 0.5) k.dy = 0;
            if (k.pop) k.pop += dt;
          }
          if (!busy) {
            idle += dt;
            if (idle > 7 && !hint) {
              hint = findMove();
              if (hint) speak('Here is a hint!');
            }
          }
        },
        draw(ctx) {
          ctx.fillStyle = '#ffe4ef';
          ctx.fillRect(0, 0, g.W, g.H);
          const s = cell();
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          roundRect(ctx, ox() - 6, oy() - 6, s * N + 12, s * N + 12, 18);
          ctx.fill();
          for (let r = 0; r < N; r++)
            for (let c = 0; c < N; c++) {
              const k = grid[r][c];
              if (k.pop > 0.25) continue;
              const x = ox() + (c + 0.5) * s;
              const y = oy() + (r + 0.5) * s + k.dy;
              const isSel = sel && sel[0] === r && sel[1] === c;
              const isHint = hint && hint.some(([hr, hc]) => hr === r && hc === c);
              const R = s * 0.42 * (k.pop ? 1 + k.pop * 3 : 1) * (isSel ? 1.1 : 1) * (isHint ? 1 + Math.sin(g.t * 8) * 0.08 : 1);
              const col = CANDY[k.v % CANDY.length];
              const gr = ctx.createRadialGradient(x - R * 0.35, y - R * 0.4, R * 0.1, x, y, R);
              gr.addColorStop(0, '#fff');
              gr.addColorStop(0.3, col);
              gr.addColorStop(1, col);
              ctx.fillStyle = gr;
              roundRect(ctx, x - R, y - R, R * 2, R * 2, R * 0.55);
              ctx.fill();
              if (isSel || isHint) {
                ctx.strokeStyle = isSel ? '#173a66' : '#ffd23f';
                ctx.lineWidth = 4;
                ctx.stroke();
              }
              text(ctx, k.v, x, y + 1, s * 0.42, '#fff');
            }
        },
        down(p) {
          const c = cellAt(p);
          dragFrom = c;
        },
        move(p, pressed) {
          if (!pressed || !dragFrom) return;
          const c = cellAt(p);
          if (c && (c[0] !== dragFrom[0] || c[1] !== dragFrom[1])) {
            const to = Math.abs(c[0] - dragFrom[0]) > Math.abs(c[1] - dragFrom[1]) ? [dragFrom[0] + Math.sign(c[0] - dragFrom[0]), dragFrom[1]] : [dragFrom[0], dragFrom[1] + Math.sign(c[1] - dragFrom[1])];
            trySwap(dragFrom, to);
            dragFrom = null;
            sel = null;
          }
        },
        up(p) {
          if (!dragFrom) return;
          const c = cellAt(p);
          dragFrom = null;
          if (!c) return;
          if (sel && Math.abs(sel[0] - c[0]) + Math.abs(sel[1] - c[1]) === 1) {
            const a = sel;
            sel = null;
            trySwap(a, c);
          } else {
            sel = c;
            playStickerPick();
          }
        },
      };
    },
  });
  // (playCorrectChime is played by the kit when a line pops.)
  void playCorrectChime;
  return <div className="game game-arcade">{view}</div>;
}
