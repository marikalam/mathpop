import { useArcade, fact, heartsFor, near, shuffle, speak, text, roundRect, playStickerPick } from './kit.jsx';

// Garden Guard: snails carrying problems crawl toward Pip's flowers in
// three rows. Tap the seed with an answer: the flower in that snail's row
// shoots it, and it slides away happy. A snail that reaches the flowers
// eats one (a heart). More snails come, a bit faster, as you go.
export default function GardenGuard({ grade, onEnd }) {
  const { view } = useArcade({
    hearts: heartsFor(grade),
    onEnd,
    setup(g) {
      let snails = [];
      let shots = [];
      let seeds = [];
      let spawnIn = 0.5;
      let made = 0;
      const ROWS = 3;
      const fieldTop = () => 10;
      const rowH = () => (g.H - 110) / ROWS;
      const rowY = (r) => fieldTop() + rowH() * (r + 0.6);
      const speed = () => (grade === 'p' || grade === 'k' ? 11 : 14) + Math.min(22, g.score * 1.2);
      function refreshSeeds() {
        const answers = [...new Set(snails.filter((s) => !s.hit).map((s) => s.q.answer))];
        const extra = near(answers[0] ?? 5, 4).filter((x) => !answers.includes(x));
        seeds = shuffle([...answers, ...extra].slice(0, 4)).map((v, i) => ({ v, i }));
      }
      function spawn() {
        const busy = new Set(snails.filter((s) => s.x > g.W - 120).map((s) => s.row));
        const free = [0, 1, 2].filter((r) => !busy.has(r));
        if (!free.length) return;
        const row = free[Math.floor(Math.random() * free.length)];
        const q = fact(grade);
        snails.push({ q, row, x: g.W + 40, hit: 0, id: made++ });
        if (made === 1) g.prompt('Tap the answer!', `Tap the answer to ${q.say ? 'how many dots' : q.text.replace('×', 'times').replace('−', 'minus')}!`);
        refreshSeeds();
      }
      const seedBox = (i) => {
        const w = (g.W - 50) / 4;
        return { x: 10 + i * (w + 10), y: g.H - 84, w, h: 70 };
      };
      return {
        // For automated play tests in development only.
        ...(import.meta.env.DEV ? { dbg: () => ({ snails, seeds, seedBox }) } : {}),
        step(dt) {
          spawnIn -= dt;
          const max = 1 + Math.min(3, Math.floor(g.score / 4));
          if (spawnIn <= 0 && snails.filter((s) => !s.hit).length < max) {
            spawn();
            spawnIn = Math.max(1.2, 3.2 - g.score * 0.08);
          }
          for (const s of snails) {
            if (s.hit) {
              s.hit += dt;
              s.x += 120 * dt;
              continue;
            }
            s.x -= speed() * dt;
            if (s.x < 58) {
              s.hit = 0.001;
              s.ate = true;
              g.lose(40, rowY(s.row), 'Oh no, a snail ate a flower!');
              refreshSeeds();
            }
          }
          snails = snails.filter((s) => !s.hit || s.hit < 1.2);
          for (const sh of shots) sh.x += 520 * dt;
          shots = shots.filter((sh) => {
            if (sh.x >= sh.to.x) {
              sh.to.hit = 0.001;
              g.win(1, sh.to.x, rowY(sh.to.row) - 20);
              refreshSeeds();
              return false;
            }
            return true;
          });
        },
        draw(ctx) {
          const W = g.W;
          // Garden rows.
          for (let r = 0; r < ROWS; r++) {
            ctx.fillStyle = r % 2 ? '#8fd47a' : '#9fdc8a';
            ctx.fillRect(0, fieldTop() + rowH() * r, W, rowH());
            // The flower guarding the row.
            const y = rowY(r);
            ctx.strokeStyle = '#2e7d32';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(30, y + 26);
            ctx.lineTo(30, y);
            ctx.stroke();
            for (let k = 0; k < 6; k++) {
              ctx.fillStyle = '#ffd23f';
              ctx.beginPath();
              ctx.arc(30 + Math.cos((k / 6) * Math.PI * 2) * 12, y - 6 + Math.sin((k / 6) * Math.PI * 2) * 12, 8, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = '#9a5a1a';
            ctx.beginPath();
            ctx.arc(30, y - 6, 8, 0, Math.PI * 2);
            ctx.fill();
          }
          // Snails with their problems on their shells.
          for (const s of snails) {
            const y = rowY(s.row);
            ctx.save();
            ctx.globalAlpha = s.hit ? Math.max(0, 1 - s.hit) : 1;
            ctx.translate(s.x, y + Math.sin(g.t * 6 + s.id) * 1.5);
            if (s.hit) ctx.rotate(-0.3);
            ctx.fillStyle = '#c4b5fd';
            roundRect(ctx, -30, 6, 74, 18, 9);
            ctx.fill();
            ctx.fillStyle = '#a78bfa';
            ctx.beginPath();
            ctx.arc(-26, 4, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#7c3aed';
            ctx.lineWidth = 2;
            for (const dx of [-30, -22]) {
              ctx.beginPath();
              ctx.moveTo(dx, -2);
              ctx.lineTo(dx - 3, -14);
              ctx.stroke();
            }
            ctx.fillStyle = '#173a66';
            ctx.beginPath();
            ctx.arc(-28, 2, 2, 0, Math.PI * 2);
            ctx.fill();
            const sh = ctx.createRadialGradient(8, -10, 4, 10, -4, 32);
            sh.addColorStop(0, '#ffb870');
            sh.addColorStop(1, '#e07a2b');
            ctx.fillStyle = sh;
            ctx.beginPath();
            ctx.arc(10, -4, 28, Math.PI, 0);
            ctx.lineTo(38, 8);
            ctx.lineTo(-18, 8);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            text(ctx, s.hit ? '😊' : s.q.text, s.x + 10, y - 12, s.q.text.length > 7 ? 15 : 19, '#fff');
          }
          // Seeds flying.
          for (const sh of shots) {
            ctx.fillStyle = '#2fae6b';
            ctx.beginPath();
            ctx.arc(sh.x, rowY(sh.to.row) - 6, 7, 0, Math.PI * 2);
            ctx.fill();
          }
          // The seed packets (answers).
          ctx.fillStyle = '#6b4423';
          ctx.fillRect(0, g.H - 96, W, 96);
          for (const sd of seeds) {
            const b = seedBox(sd.i);
            ctx.fillStyle = sd.flash ? '#fde047' : '#fff6e8';
            roundRect(ctx, b.x, b.y, b.w, b.h, 14);
            ctx.fill();
            text(ctx, sd.v, b.x + b.w / 2, b.y + b.h / 2, 30, '#173a66', null);
          }
        },
        down(p) {
          const sd = seeds.find((s) => {
            const b = seedBox(s.i);
            return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
          });
          if (!sd) return;
          playStickerPick();
          const targets = snails.filter((s) => !s.hit && !s.targeted && s.q.answer === sd.v).sort((a, b) => a.x - b.x);
          if (targets.length) {
            const t = targets[0];
            t.targeted = true;
            shots.push({ x: 40, to: t });
            speak(String(sd.v));
          } else {
            g.lose(seedBox(sd.i).x + seedBox(sd.i).w / 2, g.H - 60, `No snail needs ${sd.v}.`);
          }
        },
      };
    },
  });
  return <div className="game game-arcade">{view}</div>;
}
