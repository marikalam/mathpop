import { useArcade, heartsFor, pick, shuffle, speak, text, drawPip, roundRect, playStickerPick } from './kit.jsx';

// Shape Dash: Pip rolls along; tap to jump. Spikes: jump over them. Shape
// gates: two doors, one up high (jump into it) and one on the ground (stay
// down); go through the one that fits ("the hexagon", "has 5 corners",
// "a quadrilateral with only one pair of parallel sides"...). Right door
// scores; a wrong door or a spike costs a heart. It speeds up as you go.
const POLY = { triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6, heptagon: 7, octagon: 8, rhombus: 4, trapezoid: 4, parallelogram: 4, kite: 4 };

function shapeQuestion(grade) {
  const sets = {
    p: [['circle', 'square'], ['triangle', 'circle'], ['star', 'square'], ['heart', 'triangle'], ['square', 'heart']].map(([a, b]) => ({ want: a, other: b, ask: `the ${a}` })),
    k: ['circle', 'square', 'triangle', 'rectangle', 'hexagon', 'star', 'heart'].map((a) => ({ want: a, ask: `the ${a}` })),
    1: [3, 4, 5, 6, 8].map((n) => ({ sides: n, ask: `${n} sides` })),
    2: [3, 4, 5, 6, 8].map((n) => ({ sides: n, ask: `${n} corners`, corners: true })),
    3: ['rhombus', 'trapezoid', 'parallelogram', 'rectangle', 'pentagon', 'hexagon', 'octagon'].map((a) => ({ want: a, ask: `the ${a}` })),
    4: [
      { want: 'trapezoid', ask: 'one pair of parallel sides' },
      { want: 'rhombus', ask: '4 equal sides, no right angles' },
      { want: 'rectangle', ask: '4 right angles, not all sides equal' },
      { want: 'square', ask: '4 equal sides and 4 right angles' },
      { want: 'kite', ask: 'two pairs of equal sides next to each other' },
      { want: 'triangle', ask: 'right angle (a right triangle)', right: true },
    ],
  }[grade] || [];
  const q = pick(sets);
  const all = ['circle', 'square', 'triangle', 'rectangle', 'hexagon', 'star', 'heart', 'pentagon', 'octagon', 'rhombus', 'trapezoid', 'parallelogram', 'kite'];
  let want = q.want;
  if (q.sides) want = Object.keys(POLY).find((k) => POLY[k] === q.sides && ['triangle', 'square', 'pentagon', 'hexagon', 'octagon'].includes(k));
  let other = q.other;
  if (!other) {
    const pool = all.filter((s) => s !== want && (!q.sides || POLY[s] !== q.sides) && (grade === '3' || grade === '4' ? POLY[s] : true) && (grade === 'k' ? !POLY[s] || POLY[s] <= 6 : true));
    if (grade === '4' && want !== 'triangle') other = pick(['trapezoid', 'rhombus', 'rectangle', 'square', 'kite', 'parallelogram'].filter((s) => s !== want));
    else other = pick(pool);
  }
  return { ...q, want, other, text: q.sides ? `${q.ask}` : `${q.ask}` };
}

export function drawShape(ctx, name, x, y, r, color, outline = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  const poly = (pts) => pts.forEach(([px, py], i) => (i ? ctx.lineTo(px * r, py * r) : ctx.moveTo(px * r, py * r)));
  const reg = (n, rot = -Math.PI / 2) => Array.from({ length: n }, (_, i) => [Math.cos(rot + (i * 2 * Math.PI) / n), Math.sin(rot + (i * 2 * Math.PI) / n)]);
  if (name === 'circle') ctx.arc(0, 0, r, 0, Math.PI * 2);
  else if (name === 'square') poly([[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]]);
  else if (name === 'rectangle') poly([[-1, -0.55], [1, -0.55], [1, 0.55], [-1, 0.55]]);
  else if (name === 'rhombus') poly([[0, -1], [0.7, 0], [0, 1], [-0.7, 0]]);
  else if (name === 'trapezoid') poly([[-0.5, -0.6], [0.5, -0.6], [1, 0.6], [-1, 0.6]]);
  else if (name === 'parallelogram') poly([[-0.6, -0.6], [1, -0.6], [0.6, 0.6], [-1, 0.6]]);
  else if (name === 'kite') poly([[0, -1], [0.6, -0.3], [0, 1], [-0.6, -0.3]]);
  else if (name === 'triangle') poly(reg(3));
  else if (name === 'pentagon') poly(reg(5));
  else if (name === 'hexagon') poly(reg(6, 0));
  else if (name === 'heptagon') poly(reg(7));
  else if (name === 'octagon') poly(reg(8, Math.PI / 8));
  else if (name === 'star') poly(Array.from({ length: 10 }, (_, i) => [Math.cos(-Math.PI / 2 + (i * Math.PI) / 5) * (i % 2 ? 0.45 : 1), Math.sin(-Math.PI / 2 + (i * Math.PI) / 5) * (i % 2 ? 0.45 : 1)]));
  else if (name === 'heart') {
    ctx.moveTo(0, r * 0.8);
    ctx.bezierCurveTo(-r * 1.2, -r * 0.1, -r * 0.6, -r * 1, 0, -r * 0.4);
    ctx.bezierCurveTo(r * 0.6, -r * 1, r * 1.2, -r * 0.1, 0, r * 0.8);
  }
  ctx.closePath();
  ctx.fill();
  if (outline) ctx.stroke();
  ctx.restore();
}

export default function ShapeDash({ grade, onEnd }) {
  const { view } = useArcade({
    hearts: heartsFor(grade),
    onEnd,
    setup(g) {
      let things = [];
      let pip;
      let speed = grade === 'p' || grade === 'k' ? 150 : 180;
      let dist = 0;
      let nextAt = 220;
      let q = null;
      const ground = () => g.H - 70;
      const px = () => g.W * 0.24;
      return {
        // For automated play tests in development only.
        ...(import.meta.env.DEV ? { dbg: () => ({ things, pip, ground: ground(), px: px() }) } : {}),
        start() {
          pip = { y: 0, vy: 0, rot: 0 };
          speak('Tap to jump! Jump over spikes, and go through the right shape door.');
        },
        step(dt) {
          dist += speed * dt;
          // Pip: gravity and jumping.
          pip.vy += 1700 * dt;
          pip.y += pip.vy * dt;
          if (pip.y > 0) {
            pip.y = 0;
            pip.vy = 0;
          }
          pip.rot += (pip.y < 0 ? 8 : speed / 22) * dt;
          // New things: spikes, and every few, a shape gate.
          if (dist > nextAt) {
            const gate = !things.some((t) => t.kind === 'gate') && Math.random() < 0.55;
            if (gate) {
              q = shapeQuestion(grade);
              const upIsRight = Math.random() < 0.5;
              things.push({ kind: 'gate', x: g.W + 60, up: upIsRight ? q.want : q.other, low: upIsRight ? q.other : q.want, rightUp: upIsRight, q });
              g.prompt(`Go through: ${q.text}`, `Go through the door with ${q.ask}!`);
              nextAt = dist + 420;
            } else {
              things.push({ kind: 'spike', x: g.W + 30 });
              nextAt = dist + 200 + Math.random() * 180;
            }
          }
          for (const t of things) {
            t.x -= speed * dt;
            if (t.done) continue;
            if (t.kind === 'spike' && Math.abs(t.x - px()) < 22 && pip.y > -26) {
              t.done = true;
              g.lose(px(), ground() - 20, 'Ouch! Jump over the spikes.');
            }
            if (t.kind === 'gate' && t.x < px()) {
              t.done = true;
              const wentUp = pip.y < -60;
              const right = wentUp === t.rightUp;
              const shape = wentUp ? t.up : t.low;
              if (right) {
                g.win(1, px(), ground() + pip.y - 30);
                speak(`Yes! ${shape}!`);
                speed = Math.min(320, speed + 8);
              } else {
                g.lose(px(), ground() + pip.y - 30, `That was the ${shape}.`);
              }
              g.prompt('', false);
            }
          }
          things = things.filter((t) => t.x > -80);
        },
        draw(ctx) {
          const W = g.W;
          const H = g.H;
          const bg = ctx.createLinearGradient(0, 0, 0, H);
          bg.addColorStop(0, '#312e81');
          bg.addColorStop(1, '#7c3aed');
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, W, H);
          // Moving background shapes (parallax).
          for (let i = 0; i < 8; i++) {
            const x = ((i * 140 - dist * 0.3) % (W + 140) + W + 140) % (W + 140) - 70;
            drawShape(ctx, ['circle', 'triangle', 'square', 'star', 'hexagon'][i % 5], x, 60 + (i % 3) * 70, 14, 'rgba(255,255,255,0.1)', false);
          }
          // Ground with moving stripes.
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(0, ground(), W, H - ground());
          ctx.fillStyle = '#a78bfa';
          ctx.fillRect(0, ground(), W, 4);
          for (let x = -(dist % 40); x < W; x += 40) {
            ctx.fillStyle = 'rgba(167,139,250,0.25)';
            ctx.fillRect(x, ground() + 14, 20, 4);
          }
          for (const t of things) {
            if (t.kind === 'spike') {
              ctx.fillStyle = '#f472b6';
              ctx.beginPath();
              ctx.moveTo(t.x - 18, ground());
              ctx.lineTo(t.x, ground() - 30);
              ctx.lineTo(t.x + 18, ground());
              ctx.closePath();
              ctx.fill();
            } else {
              // Two doors: up high and on the ground, each with its shape.
              for (const [shape, y, h] of [
                [t.up, ground() - 190, 90],
                [t.low, ground() - 90, 90],
              ]) {
                ctx.fillStyle = 'rgba(255,255,255,0.14)';
                roundRect(ctx, t.x - 32, y, 64, h, 14);
                ctx.fill();
                ctx.strokeStyle = '#fde047';
                ctx.lineWidth = 3;
                ctx.stroke();
                drawShape(ctx, shape, t.x, y + h / 2, 24, ['#38bdf8', '#f472b6', '#4ade80', '#fbbf24'][shape.length % 4]);
              }
              // A platform under the top door, so a jump gets you in.
              ctx.fillStyle = '#a78bfa';
              ctx.fillRect(t.x - 36, ground() - 98, 72, 6);
            }
          }
          // Pip: a rolling bubble.
          ctx.save();
          ctx.translate(px(), ground() + pip.y - 20);
          ctx.rotate(Math.sin(pip.rot) * 0.15);
          drawPip(ctx, 0, 0, 20, { mood: pip.y < 0 ? 'wow' : 'happy' });
          ctx.restore();
          if (g.score === 0 && dist < 400) text(ctx, 'Tap to jump!', W / 2, 40, 22, '#fde047', 'rgba(0,0,0,0.35)');
        },
        down() {
          if (pip.y > -2) {
            pip.vy = -720;
            playStickerPick();
          }
        },
      };
    },
  });
  return <div className="game game-arcade">{view}</div>;
}
