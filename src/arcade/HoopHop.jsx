import { sgSettings } from '../sgMode.js';
import { useArcade, heartsFor, fact, bond, near, speak, text, cloud, backdrop, playStickerPick } from './kit.jsx';

// Hoop Hop: tap to flap the ball up; it falls when you don't. Two hoops
// come along, each with a number: fly through the one with the answer.
// The wrong hoop costs a heart; missing both is fine (the question
// stays). The ground is bouncy, so there's no crashing. Every 5 points
// is a new level: a little faster.
export default function HoopHop({ grade, onEnd }) {
  const { view } = useArcade({
    hearts: heartsFor(grade),
    onEnd,
    setup(g) {
      const little = grade === 'p' || grade === 'k';
      let ball;
      let hoops = [];
      let q;
      let level = 1;
      let asked = 0;
      let nextIn = 1.2;
      const bx = () => g.W * 0.28;
      const R = 15;
      // The hoop's half height: big, and biggest for the youngest. Anywhere
      // inside it counts.
      const HR = little ? 64 : 54;
      const speed = () => (little ? 85 : 105) + (level - 1) * 10;
      function ask() {
        // Every other question is a number bond (Singapore Math Mode).
        asked = (asked || 0) + 1;
        q = sgSettings().bonds && grade !== 'p' && asked % 2 === 0 ? bond(grade) : fact(grade);
        g.prompt(q.text, q.say || q.text.replace(/−/g, ' minus ').replace(/×/g, ' times ').replace(/÷/g, ' divided by '));
      }
      function addHoops() {
        const wrong = near(q.answer, 2).find((v) => v !== q.answer) ?? q.answer + 1;
        const upRight = Math.random() < 0.5;
        const ys = [g.H * 0.27, g.H * 0.68];
        for (const [k, y] of ys.entries()) {
          const right = (k === 0) === upRight;
          hoops.push({ x: g.W + 40, y, v: right ? q.answer : wrong, right, col: hoops.length, done: false });
        }
      }
      return {
        // For automated play tests in development only.
        ...(import.meta.env.DEV ? { dbg: () => ({ ball, hoops, q }) } : {}),
        start() {
          ball = { y: g.H * 0.45, vy: 0, spin: 0 };
          ask();
        },
        step(dt) {
          ball.vy += (little ? 620 : 760) * dt;
          ball.y += ball.vy * dt;
          ball.spin += dt * 4;
          if (ball.y > g.H - 40 - R) {
            ball.y = g.H - 40 - R;
            ball.vy = -Math.abs(ball.vy) * 0.55 - 120;
          }
          if (ball.y < R + 4) {
            ball.y = R + 4;
            ball.vy = Math.max(0, ball.vy);
          }
          nextIn -= dt;
          if (nextIn <= 0 && !hoops.length) {
            addHoops();
            nextIn = 0.8;
          }
          // As a hoop comes close, the ball drifts toward the nearest one a
          // little, so a near miss still goes in (which one is still up to you).
          const ahead = hoops.filter((h) => !h.done && h.x > bx() && h.x - bx() < 150);
          if (ahead.length) {
            const h = ahead.reduce((a, b) => (Math.abs(a.y - ball.y) < Math.abs(b.y - ball.y) ? a : b));
            ball.y += Math.max(-1, Math.min(1, (h.y - ball.y) / 40)) * (little ? 90 : 60) * dt;
          }
          for (const h of hoops) {
            h.x -= speed() * dt;
            if (!h.done && h.x < bx()) {
              h.done = true;
              if (Math.abs(ball.y - h.y) < HR + 6) {
                hoops.forEach((o) => (o.done = true));
                if (h.right) {
                  g.win(1, bx(), ball.y);
                  speak(`${h.v}! Swish!`);
                  if (g.score % 5 === 0) {
                    level += 1;
                    g.banner(`Level ${level}!`);
                  }
                  setTimeout(ask, 500);
                } else if (!g.lose(bx(), ball.y, `That's ${h.v}. The answer is ${q.answer}!`)) {
                  setTimeout(ask, 900);
                }
              }
            }
          }
          hoops = hoops.filter((h) => h.x > -60);
        },
        draw(ctx) {
          const W = g.W;
          const H = g.H;
          backdrop(ctx, W, H, '#ffe7b0', '#fff6dd');
          cloud(ctx, ((W + 200 - ((g.t * 20) % (W + 200))) % (W + 200)) - 80, 70, 1);
          cloud(ctx, ((W + 200 - ((g.t * 12 + 160) % (W + 200))) % (W + 200)) - 80, 150, 0.7);
          // Sandy ground with stripes going by.
          ctx.fillStyle = '#f5c26b';
          ctx.fillRect(0, H - 40, W, 40);
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          for (let x = -((g.t * speed()) % 40); x < W; x += 40) ctx.fillRect(x, H - 30, 18, 4);
          // Hoops: the back of the ring, then the ball, then the front.
          const ring = (h, front) => {
            ctx.strokeStyle = front ? '#e5484d' : '#b91c1c';
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.ellipse(h.x, h.y, 16, HR, 0, front ? -Math.PI / 2 : Math.PI / 2, front ? Math.PI / 2 : (Math.PI * 3) / 2);
            ctx.stroke();
          };
          for (const h of hoops) {
            ring(h, false);
            text(ctx, h.v, h.x + 36, h.y, String(h.v).length > 2 ? 20 : 26, '#173a66', 'rgba(255,255,255,0.95)');
          }
          // The ball, with little wings.
          const y = ball.y;
          const x = bx();
          const flap = Math.sin(g.t * 18) * (ball.vy < 0 ? 0.6 : 0.2);
          for (const side of [-1, 1]) {
            ctx.save();
            ctx.translate(x - 6, y - 4);
            ctx.rotate(side * (0.5 + flap));
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#173a66';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(-10, side * -6, 12, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
          ctx.fillStyle = '#f97316';
          ctx.strokeStyle = '#173a66';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(x, y, R, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(ball.spin);
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-R, 0);
          ctx.lineTo(R, 0);
          ctx.moveTo(0, -R);
          ctx.lineTo(0, R);
          ctx.stroke();
          ctx.restore();
          for (const h of hoops) ring(h, true);
          if (g.score === 0) text(ctx, 'Tap to fly up!', W / 2, H - 60, 18, '#9a3412', 'rgba(255,255,255,0.9)');
        },
        down() {
          ball.vy = little ? -280 : -310;
          playStickerPick();
        },
      };
    },
  });
  return <div className="game game-arcade">{view}</div>;
}
