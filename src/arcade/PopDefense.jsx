import { useArcade, rule, numberFor, heartsFor, speak, text, roundRect, playStickerPick } from './kit.jsx';

// Pop Defense: balloons with numbers float along a winding path past three
// dart towers. Each wave has a rule ("even numbers", "in the 3 times
// table", "makes 10 with 4"): tap a balloon that fits and the nearest
// tower pops it. A balloon that fits and gets away, or popping one that
// doesn't fit, costs a heart. Waves get longer and faster.
export default function PopDefense({ grade, onEnd }) {
  const { view } = useArcade({
    hearts: heartsFor(grade),
    onEnd,
    setup(g) {
      let wave = 0;
      let r;
      let balloons = [];
      let darts = [];
      let toSend = 0;
      let sendIn = 0;
      let waveGap = 0;
      // The path: a winding line through the field (fractions of W/H).
      const PATH = [
        [-0.1, 0.12],
        [0.8, 0.12],
        [0.8, 0.38],
        [0.2, 0.38],
        [0.2, 0.64],
        [0.8, 0.64],
        [0.8, 0.88],
        [1.1, 0.88],
      ];
      const TOWERS = [
        [0.5, 0.25],
        [0.5, 0.51],
        [0.5, 0.77],
      ];
      const pts = () => PATH.map(([x, y]) => [x * g.W, y * g.H]);
      const len = () => {
        const p = pts();
        let L = 0;
        for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
        return L;
      };
      const at = (d) => {
        const p = pts();
        for (let i = 1; i < p.length; i++) {
          const seg = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
          if (d <= seg) return [p[i - 1][0] + ((p[i][0] - p[i - 1][0]) * d) / seg, p[i - 1][1] + ((p[i][1] - p[i - 1][1]) * d) / seg];
          d -= seg;
        }
        return p[p.length - 1];
      };
      function newWave() {
        wave += 1;
        r = rule(grade);
        toSend = 5 + wave;
        sendIn = 1.2;
        g.prompt(`Pop: ${r.name}!`, `Wave ${wave}! Pop the balloons with ${r.say}!`);
        g.banner(`Wave ${wave}`);
      }
      const speed = () => (grade === 'p' || grade === 'k' ? 55 : 65) + wave * 6;
      return {
        // For automated play tests in development only.
        ...(import.meta.env.DEV ? { dbg: () => ({ balloons, r, at }) } : {}),
        start: newWave,
        step(dt) {
          if (toSend > 0) {
            sendIn -= dt;
            if (sendIn <= 0) {
              const fits = Math.random() < 0.55;
              const v = numberFor(r, fits);
              balloons.push({ d: 0, v, ok: r.test(v), c: ['#ff6b9a', '#3b8cf0', '#ffd23f', '#2fae6b', '#9b6bf2'][balloons.length % 5], bob: Math.random() * 6 });
              toSend -= 1;
              sendIn = Math.max(0.8, 1.5 - wave * 0.1);
            }
          } else if (!balloons.some((b) => b.ok && !b.popped && !b.aimed && !b.leaving)) {
            waveGap += dt;
            if (waveGap > 1.2) {
              waveGap = 0;
              // Balloons left from this wave float off quickly.
              for (const b of balloons) b.leaving = true;
              newWave();
            }
          }
          const L = len();
          for (const b of balloons) {
            if (b.popped) {
              b.popped += dt;
              continue;
            }
            b.d += speed() * (b.leaving ? 5 : 1) * dt;
            if (b.d >= L) {
              b.gone = true;
              if (b.ok && !b.aimed && !b.leaving) g.lose(g.W - 20, g.H * 0.88, `${b.v} got away!`);
            }
          }
          balloons = balloons.filter((b) => !b.gone && !(b.popped > 0.4));
          for (const dt2 of darts) {
            dt2.k += dt * 4;
            if (dt2.k >= 1 && !dt2.done) {
              dt2.done = true;
              dt2.b.popped = 0.001;
              const [x, y] = at(dt2.b.d);
              g.burst(x, y, dt2.b.c, 18, 200);
              g.win(1, x, y);
            }
          }
          darts = darts.filter((d) => !d.done);
        },
        draw(ctx) {
          const W = g.W;
          const H = g.H;
          ctx.fillStyle = '#a7e08f';
          ctx.fillRect(0, 0, W, H);
          // The path.
          const p = pts();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = '#e8c48f';
          ctx.lineWidth = 46;
          ctx.beginPath();
          p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 12]);
          ctx.stroke();
          ctx.setLineDash([]);
          // Towers: little dart cannons on stone bases.
          for (const [tx, ty] of TOWERS) {
            const x = tx * W;
            const y = ty * H;
            ctx.fillStyle = '#94a3b8';
            roundRect(ctx, x - 20, y - 14, 40, 30, 8);
            ctx.fill();
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(x, y - 16, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffd23f';
            ctx.beginPath();
            ctx.arc(x, y - 16, 5, 0, Math.PI * 2);
            ctx.fill();
          }
          // Balloons.
          for (const b of balloons) {
            const [x, y0] = at(b.d);
            const y = y0 - 18 + Math.sin(g.t * 3 + b.bob) * 3;
            if (b.popped) continue;
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x, y + 20);
            ctx.quadraticCurveTo(x + 5, y + 28, x, y + 36);
            ctx.stroke();
            const gr = ctx.createRadialGradient(x - 9, y - 11, 1, x, y, 22);
            gr.addColorStop(0, 'rgba(255,255,255,0.9)');
            gr.addColorStop(0.12, b.c);
            gr.addColorStop(1, b.c);
            ctx.fillStyle = gr;
            ctx.beginPath();
            ctx.ellipse(x, y, 19, 22, 0, 0, Math.PI * 2);
            ctx.fill();
            text(ctx, b.v, x, y + 1, String(b.v).length > 2 ? 16 : 21, '#fff', 'rgba(0,0,0,0.5)');
          }
          // Darts.
          for (const d of darts) {
            const [bx, by] = at(d.b.d);
            const x = d.x + (bx - d.x) * d.k;
            const y = d.y + (by - 18 - d.y) * d.k;
            ctx.fillStyle = '#173a66';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
          }
          if (g.score === 0 && wave === 1) text(ctx, 'Tap the balloons that fit!', W / 2, H - 14, 16, '#166534', 'rgba(255,255,255,0.9)');
        },
        down(pt) {
          // The balloon tapped (nearest within reach).
          let best = null;
          let bd = 40;
          for (const b of balloons) {
            if (b.popped || b.aimed || b.leaving) continue;
            const [x, y0] = at(b.d);
            const dd = Math.hypot(pt.x - x, pt.y - (y0 - 18));
            if (dd < bd) {
              bd = dd;
              best = b;
            }
          }
          if (!best) return;
          if (!best.ok) {
            best.aimed = true;
            best.popped = 0.001;
            const [x, y] = at(best.d);
            g.lose(x, y, `${best.v} isn't ${r.name}.`);
            return;
          }
          playStickerPick();
          best.aimed = true;
          const [bx, by] = at(best.d);
          let tw = TOWERS[0];
          for (const t of TOWERS) if (Math.hypot(t[0] * g.W - bx, t[1] * g.H - by) < Math.hypot(tw[0] * g.W - bx, tw[1] * g.H - by)) tw = t;
          darts.push({ x: tw[0] * g.W, y: tw[1] * g.H - 16, b: best, k: 0 });
          speak(String(best.v));
        },
      };
    },
  });
  return <div className="game game-arcade">{view}</div>;
}
