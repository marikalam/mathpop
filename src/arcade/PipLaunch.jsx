import { useArcade, heartsFor, rand, speak, text, drawPip, playStickerPick, backdrop, cloud } from './kit.jsx';

// Pip Launch: pull back the slingshot and let go to fly Pip onto a number
// on the number line (Beast Academy's number lines: where does 37 go
// between 0 and 100?). Only some ticks are labeled, so you estimate. Close
// scores (closer = more stars); too far costs a heart. Pre-K and K have
// every number labeled.
export default function PipLaunch({ grade, onEnd }) {
  const { view } = useArcade({
    hearts: heartsFor(grade),
    onEnd,
    setup(g) {
      const MAX = { p: 5, k: 10, 1: 20, 2: 100, 3: 100, 4: 1000 }[grade] || 20;
      const labelEvery = { p: 1, k: 1, 1: 5, 2: 50, 3: 25, 4: 250 }[grade] || 5;
      const tickEvery = { p: 1, k: 1, 1: 1, 2: 10, 3: 5, 4: 50 }[grade] || 1;
      // How close counts: exact for small lines, a bit of room for big ones.
      const room = MAX <= 20 ? 0.5 : MAX * 0.04;
      let target;
      let pip;
      let pull = null;
      let flying = false;
      let landed = null;
      const sling = () => ({ x: 46, y: g.H * 0.55 });
      // Launch power, worked out for this field, so a full pull (back 90,
      // down 60) lands just past the end of the line.
      let pw = null;
      const power = () => {
        if (pw && pw.W === g.W && pw.H === g.H) return pw.p;
        const s = sling();
        const L = lineY() - 14;
        const land = (p) => {
          const y0 = s.y + 60;
          const t = (60 * p + Math.sqrt(3600 * p * p + 1200 * (L - y0))) / 600;
          return s.x - 90 + 90 * p * t;
        };
        let lo = 0.5;
        let hi = 20;
        for (let k = 0; k < 40; k++) {
          const mid = (lo + hi) / 2;
          if (land(mid) < lx1() + 60) lo = mid;
          else hi = mid;
        }
        pw = { W: g.W, H: g.H, p: lo };
        return lo;
      };
      const lineY = () => g.H - 60;
      const lx0 = () => 90;
      const lx1 = () => g.W - 24;
      const xOf = (v) => lx0() + ((lx1() - lx0()) * v) / MAX;
      const vOf = (x) => ((x - lx0()) / (lx1() - lx0())) * MAX;
      function newTarget() {
        target = MAX <= 20 ? rand(1, MAX) : rand(1, MAX / tickEvery - 1) * tickEvery + (grade === '4' ? 0 : rand(0, tickEvery - 1));
        pip = { ...sling(), vx: 0, vy: 0 };
        flying = false;
        landed = null;
        g.prompt(`Land on ${target}`, `Land Pip on ${target}!`);
      }
      return {
        // For automated play tests in development only.
        ...(import.meta.env.DEV ? { dbg: () => ({ target, sling: sling(), xOf, power: power(), lineY: lineY(), flying, landed }) } : {}),
        start: newTarget,
        step(dt) {
          if (!flying) return;
          pip.vy += 600 * dt;
          pip.x += pip.vx * dt;
          pip.y += pip.vy * dt;
          if (pip.y >= lineY() - 14) {
            pip.y = lineY() - 14;
            flying = false;
            const v = vOf(pip.x);
            const off = Math.abs(v - target);
            landed = { v: Math.max(0, Math.min(MAX, MAX <= 20 ? Math.round(v) : Math.round(v / tickEvery) * tickEvery)) };
            if (off <= room) {
              const stars = off <= room / 3 ? 3 : off <= (room * 2) / 3 ? 2 : 1;
              g.win(stars, pip.x, pip.y - 30);
              g.float(pip.x, pip.y - 60, '★'.repeat(stars), '#f59e0b');
              speak(stars === 3 ? `Bullseye! ${target}!` : `Close! That's about ${landed.v}.`);
              setTimeout(newTarget, 1500);
            } else if (pip.x > g.W + 20 || pip.x < 0) {
              if (!g.lose(g.W - 20, lineY(), 'Off the line! Try again.')) setTimeout(newTarget, 1200);
            } else {
              if (!g.lose(pip.x, pip.y, `That's about ${landed.v}. ${target} is ${landed.v < target ? 'further' : 'closer'}!`)) {
                setTimeout(() => {
                  pip = { ...sling(), vx: 0, vy: 0 };
                  landed = null;
                }, 1400);
              }
            }
          }
          if (pip.x > g.W + 40) pip.y = lineY();
        },
        draw(ctx) {
          const W = g.W;
          backdrop(ctx, W, g.H, '#a5d8ff', '#e0f2fe');
          cloud(ctx, W * 0.55, 50, 1);
          cloud(ctx, W * 0.15, 90, 0.7);
          ctx.fillStyle = '#86d36b';
          ctx.fillRect(0, lineY(), W, g.H - lineY());
          // The number line.
          ctx.strokeStyle = '#173a66';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(lx0() - 6, lineY());
          ctx.lineTo(lx1() + 6, lineY());
          ctx.stroke();
          for (let v = 0; v <= MAX; v += tickEvery) {
            const big = v % labelEvery === 0;
            ctx.lineWidth = big ? 3 : 1.5;
            ctx.beginPath();
            ctx.moveTo(xOf(v), lineY() - (big ? 10 : 6));
            ctx.lineTo(xOf(v), lineY() + (big ? 10 : 6));
            ctx.stroke();
            if (big) text(ctx, v, xOf(v), lineY() + 26, MAX >= 100 ? 14 : 18, '#173a66', 'rgba(255,255,255,0.8)');
          }
          // Where Pip landed.
          if (landed) {
            ctx.fillStyle = '#e5484d';
            ctx.beginPath();
            ctx.moveTo(pip.x, lineY() - 4);
            ctx.lineTo(pip.x - 7, lineY() - 16);
            ctx.lineTo(pip.x + 7, lineY() - 16);
            ctx.fill();
          }
          // The slingshot.
          const s = sling();
          ctx.strokeStyle = '#8a5a2b';
          ctx.lineWidth = 8;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(s.x, lineY());
          ctx.lineTo(s.x, s.y + 20);
          ctx.moveTo(s.x, s.y + 20);
          ctx.lineTo(s.x - 14, s.y - 10);
          ctx.moveTo(s.x, s.y + 20);
          ctx.lineTo(s.x + 14, s.y - 10);
          ctx.stroke();
          if (!flying && !landed) {
            ctx.strokeStyle = '#7c2d12';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(s.x - 14, s.y - 10);
            ctx.lineTo(pip.x, pip.y);
            ctx.lineTo(s.x + 14, s.y - 10);
            ctx.stroke();
          }
          // While pulling: a dotted path for the first part of the flight.
          if (pull) {
            const v = { x: (s.x - pip.x) * power(), y: (s.y - pip.y) * power() };
            ctx.fillStyle = 'rgba(23,58,102,0.4)';
            for (let k = 1; k < 9; k++) {
              const t = k * 0.06;
              ctx.beginPath();
              ctx.arc(pip.x + v.x * t, pip.y + v.y * t + 300 * t * t, 3, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          drawPip(ctx, pip.x, pip.y, 18, { mood: flying ? 'wow' : 'happy' });
          if (g.score === 0 && !pull && !flying) text(ctx, 'Pull Pip back, then let go!', W / 2 + 20, 24, 16, '#173a66', 'rgba(255,255,255,0.9)');
        },
        down(p) {
          if (flying || landed) return;
          if (Math.hypot(p.x - pip.x, p.y - pip.y) < 70) pull = true;
        },
        move(p, pressed) {
          if (!pull || !pressed) return;
          const s = sling();
          const dx = Math.max(-90, Math.min(10, p.x - s.x));
          const dy = Math.max(-40, Math.min(90, p.y - s.y));
          pip.x = s.x + dx;
          pip.y = s.y + dy;
        },
        up() {
          if (!pull) return;
          pull = null;
          const s = sling();
          if (Math.hypot(pip.x - s.x, pip.y - s.y) < 8) {
            pip = { ...s, vx: 0, vy: 0 };
            return;
          }
          playStickerPick();
          pip.vx = (s.x - pip.x) * power();
          pip.vy = (s.y - pip.y) * power();
          flying = true;
        },
      };
    },
  });
  return <div className="game game-arcade">{view}</div>;
}
