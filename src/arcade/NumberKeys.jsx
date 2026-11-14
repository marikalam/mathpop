import { useArcade, heartsFor, skipStep, speak, text, roundRect, playNote, rand } from './kit.jsx';

// Number Keys: tiles fall down four piano keys. Tap the tiles that are
// next when you skip count (by 2s, 5s...); each right tap plays the next
// note of "Twinkle Twinkle Little Star". Other tiles (the numbers you skip)
// pass by; tapping one, or letting a counting tile reach the bottom, costs
// a heart. It speeds up as the song goes on.
const C4 = 261.63;
const semis = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9 };
const SONG = 'C C G G A A G F F E E D D C G G F F E E D G G F F E E D C C G G A A G F F E E D D C'.split(' ').map((n) => C4 * 2 ** (semis[n] / 12));

export default function NumberKeys({ grade, onEnd }) {
  const { view } = useArcade({
    hearts: heartsFor(grade),
    onEnd,
    setup(g) {
      const step = skipStep(grade);
      let next = step;
      let made = step; // the next counting number to send down
      let tiles = [];
      let sendIn = 0.4;
      let note = 0;
      let speed = grade === 'p' || grade === 'k' ? 110 : 140;
      const lanes = 4;
      const lw = () => g.W / lanes;
      const th = () => Math.min(110, g.H / 5);
      const lineY = () => g.H - 60;
      function prompt() {
        g.prompt(step === 1 ? `Count: ${next}` : `Count by ${step}s · next ${next}`, false);
      }
      return {
        // For automated play tests in development only.
        ...(import.meta.env.DEV ? { dbg: () => ({ tiles, next, lw: lw(), th: th() }) } : {}),
        start() {
          prompt();
          speak(step === 1 ? 'Tap the tiles as you count: 1, 2, 3!' : `Count by ${step}s! Tap ${step}, ${step * 2}, ${step * 3}, and skip the others.`);
        },
        step(dt) {
          sendIn -= dt;
          if (sendIn <= 0) {
            // Mostly the counting numbers in order, with numbers to skip between.
            const skip = Math.random() < 0.35 && tiles.length > 0;
            // A number to skip: between two counting numbers (or, counting
            // by ones, one already counted).
            const v = skip ? (step === 1 ? Math.max(0, made - rand(2, 4)) : made - step + rand(1, step - 1)) : made;
            if (!skip) made += step;
            const used = new Set(tiles.filter((t) => t.y < th() * 1.2).map((t) => t.lane));
            const free = [0, 1, 2, 3].filter((l) => !used.has(l));
            tiles.push({ v, good: !skip, lane: free.length ? free[rand(0, free.length - 1)] : rand(0, 3), y: -th(), hit: 0 });
            sendIn = th() / speed + 0.25;
          }
          for (const t of tiles) {
            t.y += speed * dt;
            if (t.hit) t.hit += dt;
            if (!t.hit && t.good && t.y > lineY()) {
              t.hit = 0.001;
              t.missed = true;
              g.lose((t.lane + 0.5) * lw(), lineY(), `We missed ${t.v}!`);
              if (t.v === next) {
                next += step;
                prompt();
              }
            }
          }
          tiles = tiles.filter((t) => t.y < g.H + th() && !(t.hit > 0.4 && !t.missed));
        },
        draw(ctx) {
          const W = g.W;
          const H = g.H;
          const bg = ctx.createLinearGradient(0, 0, 0, H);
          bg.addColorStop(0, '#1e1b4b');
          bg.addColorStop(1, '#4c1d95');
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, W, H);
          ctx.strokeStyle = 'rgba(255,255,255,0.12)';
          ctx.lineWidth = 2;
          for (let l = 1; l < lanes; l++) {
            ctx.beginPath();
            ctx.moveTo(l * lw(), 0);
            ctx.lineTo(l * lw(), H);
            ctx.stroke();
          }
          // Little stars.
          for (let i = 0; i < 20; i++) {
            ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.3 * Math.sin(g.t * 2 + i)})`;
            ctx.fillRect((i * 67) % W, (i * 131 + g.t * 10) % H, 2, 2);
          }
          // The tap line.
          ctx.fillStyle = 'rgba(255,210,63,0.25)';
          ctx.fillRect(0, lineY() - 4, W, 8);
          for (const t of tiles) {
            const x = t.lane * lw() + 4;
            const w = lw() - 8;
            ctx.globalAlpha = t.hit ? Math.max(0, 1 - t.hit * 2.5) : 1;
            const gr = ctx.createLinearGradient(0, t.y, 0, t.y + th());
            gr.addColorStop(0, t.hit && !t.missed ? '#fde047' : '#38bdf8');
            gr.addColorStop(1, t.hit && !t.missed ? '#f59e0b' : '#6366f1');
            ctx.fillStyle = gr;
            roundRect(ctx, x, t.y, w, th() - 6, 12);
            ctx.fill();
            text(ctx, t.v, x + w / 2, t.y + (th() - 6) / 2, 30, '#fff');
            ctx.globalAlpha = 1;
          }
          if (g.score === 0) text(ctx, `Tap ${next}!`, W / 2, H - 24, 18, '#fde047', 'rgba(0,0,0,0.4)');
        },
        down(p) {
          const lane = Math.floor(p.x / lw());
          const t = tiles.filter((x) => !x.hit && x.lane === lane && p.y > x.y - 20 && p.y < x.y + th() + 20).sort((a, b) => b.y - a.y)[0];
          if (!t) return;
          t.hit = 0.001;
          if (t.good && t.v === next) {
            playNote(SONG[note % SONG.length]);
            note += 1;
            g.add(1);
            g.burst(t.lane * lw() + lw() / 2, t.y + th() / 2, '#fde047', 10, 150);
            next += step;
            speed = Math.min(300, speed + 3);
            prompt();
          } else if (t.good) {
            // A counting tile, but not the next one: count in order.
            t.hit = 0;
            g.float(lane * lw() + lw() / 2, t.y, `${next} first`, '#fde047');
          } else {
            t.missed = true;
            g.lose(lane * lw() + lw() / 2, t.y + th() / 2, `${t.v} isn't next. We skip it!`);
          }
        },
      };
    },
  });
  return <div className="game game-arcade">{view}</div>;
}
