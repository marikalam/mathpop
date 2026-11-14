import { useArcade, backdrop, cloud, heartsFor, skipStep, drawPip, speak, text, rand } from './kit.jsx';

// Pip Hop: Pip bounces up from cloud to cloud. Each row has the next
// number when you skip count (by 2s, 5s, 10s... for the grade) and a
// wrong one; touch left or right of Pip (or drag) to steer. Landing on the
// right number scores; a wrong cloud poofs and costs a heart; falling off
// the bottom costs a heart too (Pip comes back on the last good cloud).
export default function PipHop({ grade, onEnd }) {
  const { view } = useArcade({
    hearts: heartsFor(grade),
    onEnd,
    setup(g) {
      const step = skipStep(grade);
      const start = step === 1 ? rand(0, 3) : 0;
      const GAP = 92;
      const JUMP = -560;
      const GRAV = 1100;
      let rows = [];
      let pip;
      let cam = 0;
      let target = null;
      let next;
      let lastGood;
      const say = () => `Count by ${step === 1 ? 'ones' : `${step}s`}! What comes after ${next - step}?`;
      function makeRow(k) {
        const v = start + step * (k + 1);
        const wrongs = [v + 1, v - 1, v + step + 1, v - 2].filter((x) => x > 0 && x % step !== start % step);
        const wrong = wrongs[rand(0, wrongs.length - 1)] ?? v + 1;
        const y = -k * GAP;
        const side = Math.random() < 0.5;
        const xs = [0.28, 0.72];
        return [
          { k, v, good: true, y, x: xs[side ? 0 : 1] + (Math.random() - 0.5) * 0.1, gone: false },
          { k, v: wrong, good: false, y, x: xs[side ? 1 : 0] + (Math.random() - 0.5) * 0.1, gone: false },
        ];
      }
      function prompt() {
        g.prompt(`${next - 2 * step >= 0 && step > 0 ? `${next - 2 * step}, ` : ''}${next - step}, ?`, say());
      }
      return {
        // For automated play tests in development only.
        ...(import.meta.env.DEV ? { dbg: () => ({ rows, pip, next, cam, W: g.W }) } : {}),
        start() {
          rows = [];
          // The cloud Pip starts on (the first number, already counted).
          rows.push({ k: -1, v: start, good: true, used: true, y: GAP, x: 0.5, gone: false });
          for (let k = 0; k < 8; k++) rows.push(...makeRow(k));
          next = start + step;
          pip = { x: 0.5, y: GAP - 10, vy: JUMP };
          lastGood = { x: 0.5, y: GAP - 10 };
          cam = 0;
          prompt();
        },
        step(dt) {
          const W = g.W;
          // Steer toward the finger.
          if (target !== null) pip.x += Math.max(-1.6 * dt, Math.min(1.6 * dt, target - pip.x));
          pip.x = Math.max(0.06, Math.min(0.94, pip.x));
          pip.vy += GRAV * dt;
          const prevY = pip.y;
          pip.y += pip.vy * dt;
          // Landing (only when falling): on a cloud under Pip.
          if (pip.vy > 0) {
            for (const c of rows) {
              if (c.gone) continue;
              const top = c.y - 10;
              if (prevY <= top && pip.y >= top && Math.abs(c.x * W - pip.x * W) < 52) {
                pip.y = top;
                pip.vy = JUMP;
                pip.squash = 0.25;
                if (c.used) {
                  // A cloud already counted: just bounce.
                } else if (c.v === next && c.good) {
                  c.used = true;
                  g.win(1, c.x * W, c.y - cam + g.H * 0.55);
                  speak(String(next));
                  lastGood = { x: c.x, y: top };
                  next += step;
                  prompt();
                } else if (!c.good) {
                  c.gone = true;
                  pip.vy = JUMP * 0.55;
                  g.lose(c.x * W, c.y - cam + g.H * 0.55, `Oops, ${c.v}! We need ${next}.`);
                }
                break;
              }
            }
          }
          pip.squash = Math.max(0, (pip.squash || 0) - dt * 2);
          // The camera follows Pip up.
          cam = Math.min(cam, pip.y - g.H * 0.15);
          // More rows above.
          const topK = Math.max(...rows.map((c) => c.k));
          if (-topK * GAP > cam - g.H) rows.push(...makeRow(topK + 1));
          rows = rows.filter((c) => c.y - cam < g.H + 100);
          // Fell off the bottom.
          if (pip.y - cam > g.H * 0.45 + 40) {
            if (!g.lose(pip.x * W, g.H - 20, 'Whoops! Hop on the right number.')) {
              pip = { x: lastGood.x, y: lastGood.y - 40, vy: JUMP };
              cam = pip.y - g.H * 0.15;
            }
          }
        },
        draw(ctx) {
          const W = g.W;
          // The sky gets deeper as Pip climbs.
          const h = Math.min(1, -cam / 4000);
          backdrop(ctx, W, g.H, `hsl(${205 + h * 40}, 85%, ${82 - h * 25}%)`, `hsl(${200 + h * 30}, 90%, 94%)`);
          const yOf = (y) => y - cam + g.H * 0.55;
          for (let i = 0; i < 6; i++) cloud(ctx, ((i * 97 + 30) % W) - 10, ((i * 173 - cam * 0.3) % g.H + g.H) % g.H, 0.7, 'rgba(255,255,255,0.35)');
          for (const c of rows) {
            if (c.gone) continue;
            const x = c.x * W;
            const y = yOf(c.y);
            ctx.fillStyle = c.used ? '#fff7cc' : '#fff';
            ctx.beginPath();
            ctx.ellipse(x, y, 50, 15, 0, 0, Math.PI * 2);
            ctx.arc(x - 20, y - 8, 15, 0, Math.PI * 2);
            ctx.arc(x + 12, y - 11, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(59,140,240,0.25)';
            ctx.lineWidth = 2;
            ctx.stroke();
            text(ctx, c.v, x, y - 4, 22, c.used ? '#d97706' : '#2a54c4', 'rgba(255,255,255,0.9)');
          }
          drawPip(ctx, pip.x * W, yOf(pip.y) - 22, 22, { squash: 1 - (pip.squash || 0) * 0.6, mood: pip.vy < 0 ? 'happy' : 'wow' });
          if (g.score === 0) text(ctx, 'Touch left or right to steer', W / 2, g.H - 22, 16, '#2a54c4', 'rgba(255,255,255,0.9)');
        },
        down(p) {
          target = p.x / g.W;
        },
        move(p, pressed) {
          if (pressed) target = p.x / g.W;
        },
        up() {
          target = null;
        },
      };
    },
  });
  return <div className="game game-arcade">{view}</div>;
}
