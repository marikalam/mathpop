import { useArcade, fact, heartsFor, near, shuffle, drawPip, speak, text, roundRect } from './kit.jsx';

// Number Run: Pip runs down a three-lane forest path. A row of gates comes
// with three answers; swipe (or tap left / right) into the lane with the
// answer to the question. Right gate scores, a wrong one costs a heart.
// The run speeds up as you go. Questions are the grade's facts.
export default function NumberRun({ grade, onEnd }) {
  const { view } = useArcade({
    hearts: heartsFor(grade),
    onEnd,
    setup(g) {
      let lane = 1;
      let laneX = 1;
      let gates = null;
      let q;
      let dist = 0;
      let speed = grade === 'p' || grade === 'k' ? 0.28 : 0.34;
      let swipe = null;
      let trees = Array.from({ length: 10 }, (_, i) => ({ z: i / 10, side: i % 2 ? 1 : -1 }));
      function newGates() {
        q = grade === 'p' ? { ...fact('p') } : fact(grade);
        const vals = shuffle([q.answer, ...near(q.answer, 2)]);
        gates = { z: 1, vals, done: false };
        g.prompt(q.text, q.say || `${q.text.replace('×', 'times').replace('−', 'minus').replace('÷', 'divided by')}?`);
      }
      // Perspective: z = 1 far (horizon), 0 at Pip.
      const horizon = () => g.H * 0.28;
      const proj = (laneN, z) => {
        const s = 1 - z * 0.82;
        const roadW = g.W * 0.92 * s;
        return { x: g.W / 2 + (laneN - 1) * (roadW / 3), y: horizon() + (g.H * 0.86 - horizon()) * s * s * 0 + (g.H * 0.86 - horizon()) * (1 - z) ** 1.6, s };
      };
      return {
        // For automated play tests in development only.
        ...(import.meta.env.DEV ? { dbg: () => ({ gates, q, lane, laneX }) } : {}),
        start: newGates,
        step(dt) {
          dist += dt * speed;
          laneX += (lane - laneX) * Math.min(1, dt * 12);
          for (const t of trees) {
            t.z -= dt * speed;
            if (t.z < 0) t.z += 1;
          }
          if (gates) {
            gates.z -= dt * speed;
            if (gates.z <= 0.06 && !gates.done) {
              gates.done = true;
              const v = gates.vals[lane];
              const p = proj(lane, 0.06);
              if (v === q.answer) {
                g.win(1, p.x, p.y - 60);
                speak(`${q.answer}!`);
                speed = Math.min(0.75, speed + 0.015);
              } else {
                g.lose(p.x, p.y - 60, `Oops, ${v}. It was ${q.answer}.`);
              }
            }
            if (gates.z < -0.08) {
              gates = null;
              setTimeout(() => !g.over && newGates(), 350);
            }
          }
        },
        draw(ctx) {
          const W = g.W;
          const H = g.H;
          const hz = horizon();
          // Sky and hills.
          const sky = ctx.createLinearGradient(0, 0, 0, hz);
          sky.addColorStop(0, '#ffd8a8');
          sky.addColorStop(1, '#fff1d6');
          ctx.fillStyle = sky;
          ctx.fillRect(0, 0, W, hz + 2);
          ctx.fillStyle = '#7cc96b';
          ctx.fillRect(0, hz, W, H - hz);
          ctx.fillStyle = '#5fae4f';
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.ellipse(i * W * 0.25, hz + 4, W * 0.2, 26, 0, Math.PI, 0);
            ctx.fill();
          }
          // The path (a trapezoid) with lane lines that move.
          const near0 = proj(-0.5, 0);
          const near3 = proj(2.5, 0);
          const far0 = proj(-0.5, 1);
          const far3 = proj(2.5, 1);
          ctx.fillStyle = '#e8c48f';
          ctx.beginPath();
          ctx.moveTo(far0.x, hz);
          ctx.lineTo(far3.x, hz);
          ctx.lineTo(near3.x, H);
          ctx.lineTo(near0.x, H);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 3;
          for (const ln of [0.5, 1.5]) {
            for (let k = 0; k < 8; k++) {
              const z1 = ((k / 8 - dist * 1) % 1 + 1) % 1;
              const z2 = Math.max(0, z1 - 0.04);
              const a = proj(ln, z1);
              const b = proj(ln, z2);
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
          // Trees on the sides, far ones first.
          for (const t of [...trees].sort((a, b) => b.z - a.z)) {
            const p = proj(t.side < 0 ? -1.2 : 3.2, t.z);
            const s = p.s;
            ctx.fillStyle = '#8a5a2b';
            ctx.fillRect(p.x - 5 * s, p.y - 40 * s, 10 * s, 40 * s);
            ctx.fillStyle = '#2fae6b';
            ctx.beginPath();
            ctx.arc(p.x, p.y - 55 * s, 30 * s, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.arc(p.x - 8 * s, p.y - 62 * s, 14 * s, 0, Math.PI * 2);
            ctx.fill();
          }
          // The gates: three arches with answers.
          if (gates && gates.z > -0.08) {
            gates.vals.forEach((v, i) => {
              const p = proj(i, Math.max(0, gates.z));
              const w = (W * 0.92 * p.s) / 3 - 10 * p.s;
              const h = 110 * p.s;
              ctx.fillStyle = ['#ff6b9a', '#3b8cf0', '#ff9f43'][i];
              roundRect(ctx, p.x - w / 2, p.y - h, 10 * p.s, h, 4 * p.s);
              ctx.fill();
              roundRect(ctx, p.x + w / 2 - 10 * p.s, p.y - h, 10 * p.s, h, 4 * p.s);
              ctx.fill();
              roundRect(ctx, p.x - w / 2, p.y - h - 34 * p.s, w, 38 * p.s, 10 * p.s);
              ctx.fill();
              text(ctx, v, p.x, p.y - h - 15 * p.s, Math.max(10, 28 * p.s), '#fff');
            });
          }
          // Pip running (bobbing), in its lane.
          const pp = proj(laneX, 0.06);
          const bob = Math.abs(Math.sin(g.t * 12)) * 8;
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.beginPath();
          ctx.ellipse(pp.x, pp.y, 24, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          drawPip(ctx, pp.x, pp.y - 30 - bob, 26, { squash: 1 + Math.sin(g.t * 24) * 0.04 });
          if (g.score === 0) text(ctx, 'Swipe or tap left / right', W / 2, H - 18, 16, '#7a4a24', 'rgba(255,255,255,0.9)');
        },
        down(p) {
          swipe = { x: p.x, moved: false };
        },
        move(p, pressed) {
          if (!pressed || !swipe || swipe.moved) return;
          if (Math.abs(p.x - swipe.x) > 30) {
            lane = Math.max(0, Math.min(2, lane + (p.x > swipe.x ? 1 : -1)));
            swipe.moved = true;
          }
        },
        up(p) {
          // A tap: move toward that side.
          if (swipe && !swipe.moved) {
            const pp = proj(laneX, 0.06);
            lane = Math.max(0, Math.min(2, lane + (p.x > pp.x ? 1 : -1)));
          }
          swipe = null;
        },
      };
    },
  });
  return <div className="game game-arcade">{view}</div>;
}
