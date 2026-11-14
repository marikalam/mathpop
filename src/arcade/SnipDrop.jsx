import { useArcade, backdrop, bond, fact, heartsFor, near, roundRect, shuffle, text, drawPip, playStickerPick, speak } from './kit.jsx';

// Snip & Drop: a sweet swings on a rope over numbered baskets. Tap to snip
// the rope when the sweet is over the basket with the answer (number
// bonds: "10 = 6 + ?"; Pre-K counts dots). A wrong basket costs a heart;
// a miss just brings a new sweet. The swing speeds up as you go.
export default function SnipDrop({ grade, onEnd }) {
  const { view } = useArcade({
    hearts: heartsFor(grade),
    onEnd,
    setup(g) {
      let q;
      let baskets = [];
      let sweet;
      const L = () => Math.min(g.H * 0.42, 210);
      const anchor = () => ({ x: g.W / 2, y: 18 });
      function newRound() {
        q = grade === 'p' ? fact('p') : bond(grade);
        const n = grade === 'p' || grade === 'k' ? 3 : 4;
        const vals = shuffle([q.answer, ...near(q.answer, n - 1)]).slice(0, n);
        baskets = vals.map((v, i) => ({ v, i, n }));
        sweet = { th: -0.95, w: 0, held: true, x: 0, y: 0, vx: 0, vy: 0, spin: 0 };
        g.prompt(q.text, q.say || q.text.replace('?', 'what').replace('=', 'equals').replace('+', 'plus'));
      }
      const bx = (b) => (g.W / (b.n + 1)) * (b.i + 1);
      const bw = () => Math.min(80, g.W / 5.2);
      const by = () => g.H - 70;
      return {
        // For automated play tests in development only.
        ...(import.meta.env.DEV ? { dbg: () => ({ sweet, baskets, q, bx: (b) => bx(b), by: by(), bw: bw() }) } : {}),
        start: newRound,
        step(dt) {
          const a = anchor();
          if (sweet.held) {
            // A pendulum, kept swinging (a little faster as the score grows).
            const k = (9.8 / (L() / 100)) * (1 + Math.min(0.8, g.score * 0.06));
            sweet.w += -k * Math.sin(sweet.th) * dt;
            sweet.th += sweet.w * dt;
            const E = Math.cos(sweet.th);
            if (Math.abs(sweet.th) < 0.02 && Math.abs(sweet.w) < 1) sweet.w = 2;
            sweet.x = a.x + Math.sin(sweet.th) * L();
            sweet.y = a.y + E * L();
          } else {
            sweet.vy += 900 * dt;
            sweet.x += sweet.vx * dt;
            sweet.y += sweet.vy * dt;
            sweet.spin += dt * 6;
            if (sweet.y > by() - 10 && !sweet.done) {
              sweet.done = true;
              const hit = baskets.find((b) => Math.abs(sweet.x - bx(b)) < bw() / 2 + 6);
              if (hit && hit.v === q.answer) {
                g.win(1, bx(hit), by() - 20);
                speak(`Yes! ${q.answer}!`);
                setTimeout(newRound, 900);
              } else if (hit) {
                if (!g.lose(bx(hit), by() - 20, `That basket is ${hit.v}. Try again!`)) setTimeout(newRound, 1000);
              } else {
                g.float(sweet.x, by() - 30, 'Missed!', '#64748b');
                speak('Missed! Try again.');
                setTimeout(newRound, 900);
              }
            }
          }
        },
        draw(ctx) {
          backdrop(ctx, g.W, g.H, '#ffe8f1', '#fff8e6');
          // Wooden beam and peg.
          ctx.fillStyle = '#b9783f';
          roundRect(ctx, g.W / 2 - 60, 6, 120, 16, 8);
          ctx.fill();
          const a = anchor();
          // Rope.
          if (sweet.held) {
            ctx.strokeStyle = '#a16207';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.quadraticCurveTo((a.x + sweet.x) / 2 + Math.sin(sweet.th) * 10, (a.y + sweet.y) / 2 + 8, sweet.x, sweet.y - 14);
            ctx.stroke();
            ctx.setLineDash([2, 6]);
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);
          }
          // Baskets with their numbers.
          for (const b of baskets) {
            const x = bx(b);
            const w = bw();
            ctx.fillStyle = '#d4a056';
            roundRect(ctx, x - w / 2, by() - 8, w, 56, 12);
            ctx.fill();
            ctx.strokeStyle = '#a8742f';
            ctx.lineWidth = 2;
            for (let k = 0; k < 4; k++) {
              ctx.beginPath();
              ctx.moveTo(x - w / 2 + 4, by() + 6 + k * 12);
              ctx.lineTo(x + w / 2 - 4, by() + 6 + k * 12);
              ctx.stroke();
            }
            ctx.fillStyle = '#8a5a2b';
            roundRect(ctx, x - w / 2 - 4, by() - 14, w + 8, 12, 6);
            ctx.fill();
            text(ctx, b.v, x, by() + 24, String(b.v).length > 2 ? 22 : 28, '#fff');
          }
          // Pip cheering on the side.
          drawPip(ctx, g.W - 30, g.H - 140, 22, { mood: sweet.held ? 'happy' : 'wow', look: -1 });
          // The sweet: a wrapped candy.
          ctx.save();
          ctx.translate(sweet.x, sweet.y);
          ctx.rotate(sweet.held ? sweet.th : sweet.spin);
          ctx.fillStyle = '#ff6b9a';
          for (const s of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(s * 14, 0);
            ctx.lineTo(s * 30, -12);
            ctx.lineTo(s * 30, 12);
            ctx.closePath();
            ctx.fill();
          }
          const gr = ctx.createRadialGradient(-5, -5, 2, 0, 0, 18);
          gr.addColorStop(0, '#ffd1e1');
          gr.addColorStop(1, '#e0577f');
          ctx.fillStyle = gr;
          ctx.beginPath();
          ctx.arc(0, 0, 17, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0.4, 2.4);
          ctx.stroke();
          ctx.restore();
          if (sweet.held && g.score === 0) text(ctx, 'Tap to snip!', g.W / 2, g.H * 0.62, 20, '#be185d', 'rgba(255,255,255,0.9)');
        },
        down() {
          if (!sweet.held) return;
          playStickerPick();
          // Snip: it drops straight down (just a touch of its swing), so
          // snipping over a basket lands in that basket.
          const v = sweet.w * L();
          sweet.held = false;
          sweet.vx = Math.cos(sweet.th) * v * 0.04;
          sweet.vy = 0;
          g.burst(sweet.x, sweet.y - 16, '#a16207', 6, 80);
        },
      };
    },
  });
  return <div className="game game-arcade">{view}</div>;
}
