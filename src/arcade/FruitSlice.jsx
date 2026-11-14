import { useArcade, bond, fact, heartsFor, near, shuffle, speak, text, rand } from './kit.jsx';

// Fruit Slice: fruits with numbers fly up. Swipe through the one with the
// answer (facts, or number bonds like "8 and ? make 10"); leave the
// others. A wrong slice costs a heart; a right one splats into juice and
// the next question comes. Missing the right one just sends it again.
const FRUITS = [
  ['#ef4444', '#b91c1c', '#fde68a'],
  ['#fb923c', '#ea580c', '#fed7aa'],
  ['#a855f7', '#7e22ce', '#e9d5ff'],
  ['#84cc16', '#4d7c0f', '#d9f99d'],
  ['#facc15', '#ca8a04', '#fef9c3'],
  ['#f472b6', '#db2777', '#fce7f3'],
];

export default function FruitSlice({ grade, onEnd }) {
  const { view } = useArcade({
    hearts: heartsFor(grade),
    onEnd,
    setup(g) {
      let q;
      let fruits = [];
      let halves = [];
      let trail = [];
      let launchIn = 0.3;
      let wave = [];
      const R = 30;
      function newQ() {
        q = grade !== 'p' && Math.random() < 0.5 ? bond(grade) : fact(grade);
        wave = shuffle([q.answer, ...near(q.answer, grade === 'p' || grade === 'k' ? 1 : 2)]);
        launchIn = 0.4;
        g.prompt(q.text, q.say || `${q.text.replace('×', 'times').replace('−', 'minus').replace('÷', 'divided by').replace('?', 'what')}`);
      }
      function launch(v, i) {
        const x = g.W * (0.2 + 0.6 * Math.random());
        fruits.push({
          v,
          x,
          y: g.H + R,
          vx: (g.W / 2 - x) * 0.5 + (Math.random() - 0.5) * 60,
          vy: -(Math.sqrt(2 * 520 * g.H * (0.6 + Math.random() * 0.2))),
          rot: 0,
          spin: (Math.random() - 0.5) * 4,
          f: FRUITS[(i + rand(0, 5)) % FRUITS.length],
        });
      }
      return {
        // For automated play tests in development only.
        ...(import.meta.env.DEV ? { dbg: () => ({ fruits, q }) } : {}),
        start: newQ,
        step(dt) {
          if (wave.length) {
            launchIn -= dt;
            if (launchIn <= 0) {
              launch(wave.shift(), wave.length);
              launchIn = 0.45;
            }
          }
          for (const f of fruits) {
            f.vy += 520 * dt;
            f.x += f.vx * dt;
            f.y += f.vy * dt;
            f.rot += f.spin * dt;
          }
          for (const h of halves) {
            h.vy += 700 * dt;
            h.x += h.vx * dt;
            h.y += h.vy * dt;
            h.rot += h.spin * dt;
          }
          halves = halves.filter((h) => h.y < g.H + 60);
          // Fruit that fell back down: the answer comes up again.
          const gone = fruits.filter((f) => f.vy > 0 && f.y > g.H + R);
          fruits = fruits.filter((f) => !(f.vy > 0 && f.y > g.H + R));
          if (gone.some((f) => f.v === q.answer) && !fruits.some((f) => f.v === q.answer)) {
            wave = shuffle([q.answer, ...near(q.answer, 1)]);
            launchIn = 0.6;
          }
          trail = trail.filter((p) => g.t - p.t < 0.18);
        },
        draw(ctx) {
          const W = g.W;
          const H = g.H;
          // A wooden board.
          ctx.fillStyle = '#c98a54';
          ctx.fillRect(0, 0, W, H);
          for (let y = 0; y < H; y += 44) {
            ctx.fillStyle = y % 88 ? '#bf7f48' : '#d0965f';
            ctx.fillRect(0, y, W, 42);
          }
          for (const h of halves) {
            ctx.save();
            ctx.translate(h.x, h.y);
            ctx.rotate(h.rot);
            ctx.fillStyle = h.f[0];
            ctx.beginPath();
            ctx.arc(0, 0, R, h.side ? 0 : Math.PI, h.side ? Math.PI : Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = h.f[2];
            ctx.fillRect(-R + 3, -2, 2 * R - 6, 4);
            ctx.restore();
          }
          for (const f of fruits) {
            ctx.save();
            ctx.translate(f.x, f.y);
            ctx.rotate(f.rot);
            const gr = ctx.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R);
            gr.addColorStop(0, f.f[0]);
            gr.addColorStop(1, f.f[1]);
            ctx.fillStyle = gr;
            ctx.beginPath();
            ctx.arc(0, 0, R, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#16a34a';
            ctx.beginPath();
            ctx.ellipse(8, -R - 2, 10, 5, -0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            text(ctx, f.v, f.x, f.y + 1, String(f.v).length > 2 ? 22 : 28, '#fff');
          }
          // The swipe trail.
          if (trail.length > 1) {
            ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            ctx.lineCap = 'round';
            for (let i = 1; i < trail.length; i++) {
              ctx.lineWidth = 2 + i * 1.2;
              ctx.beginPath();
              ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
              ctx.lineTo(trail[i].x, trail[i].y);
              ctx.stroke();
            }
          }
          if (g.score === 0) text(ctx, 'Swipe through the answer!', W / 2, H - 20, 18, '#fff', 'rgba(0,0,0,0.3)');
        },
        down(p) {
          trail = [{ ...p, t: g.t }];
        },
        move(p, pressed) {
          if (!pressed) return;
          const last = trail[trail.length - 1];
          trail.push({ ...p, t: g.t });
          if (!last) return;
          // Slice any fruit the swipe passes through.
          for (const f of fruits) {
            if (f.cut) continue;
            const dx = p.x - last.x;
            const dy = p.y - last.y;
            const L = Math.hypot(dx, dy) || 1;
            const t = Math.max(0, Math.min(1, ((f.x - last.x) * dx + (f.y - last.y) * dy) / (L * L)));
            const d = Math.hypot(last.x + dx * t - f.x, last.y + dy * t - f.y);
            if (d > R) continue;
            f.cut = true;
            for (const side of [0, 1]) halves.push({ x: f.x, y: f.y, vx: (side ? 1 : -1) * 90 + f.vx * 0.3, vy: f.vy * 0.3 - 80, rot: Math.atan2(dy, dx), spin: (side ? 1 : -1) * 3, f: f.f, side });
            g.burst(f.x, f.y, f.f[0], 16, 200);
            if (f.v === q.answer) {
              g.win(1, f.x, f.y - 20);
              speak(`Yes! ${q.answer}!`);
              fruits = fruits.filter((x) => x !== f);
              // The rest drop away, and the next question comes.
              for (const o of fruits) o.vy = Math.max(o.vy, 100);
              setTimeout(() => !g.over && newQ(), 700);
            } else {
              fruits = fruits.filter((x) => x !== f);
              g.lose(f.x, f.y, `That was ${f.v}. We need ${q.answer}.`);
            }
          }
        },
        up() {
          trail = [];
        },
      };
    },
  });
  return <div className="game game-arcade">{view}</div>;
}
