import { useEffect, useRef, useState } from 'react';
import { madMinuteFact } from '../MadMinute.jsx';
import { playCorrectChime, playIncorrectBuzz, playStickerPick, speak } from '../sound.js';
import { rand, shuffle } from '../gameKit.jsx';

// The arcade games' shared kit: a canvas that fills its box, a loop
// (step + draw), finger/mouse input in canvas coordinates, hearts (a game
// ends when they're gone), a score, a prompt line (shown and said), and
// sparkles and floating text. Each game is `useArcade(...)` plus a
// `setup(g)` that returns { step(dt), draw(ctx), down(p), move(p), up(p) }.

export const COLORS = ['#ff6b9a', '#3b8cf0', '#ff9f43', '#9b6bf2', '#14b8a6', '#e5484d', '#ffd23f', '#2fae6b'];
export { rand, shuffle, playCorrectChime, playIncorrectBuzz, playStickerPick, speak };
export const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function useArcade({ hearts: maxHearts = 3, onEnd, setup }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [hearts, setHearts] = useState(maxHearts);
  const [score, setScore] = useState(0);
  const [prompt, setPromptState] = useState('');
  const [over, setOver] = useState(false);
  const [banner, setBanner] = useState(null);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const g = {
      W: 360,
      H: 480,
      t: 0,
      over: false,
      hearts: maxHearts,
      score: 0,
      parts: [],
      floats: [],
      shake: 0,
      burst(x, y, color, n = 14, speed = 160) {
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2;
          const s = speed * (0.4 + Math.random() * 0.8);
          g.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, c: color, r: 3 + Math.random() * 4 });
        }
      },
      float(x, y, text, color = '#2fae6b') {
        g.floats.push({ x, y, text, color, life: 1 });
      },
      prompt(text, say) {
        setPromptState(text);
        if (say !== false) speak(say || text);
      },
      banner(text, ms = 1600) {
        setBanner(text);
        setTimeout(() => setBanner(null), ms);
      },
      win(n = 1, x, y) {
        g.score += n;
        setScore(g.score);
        playCorrectChime();
        if (x !== undefined) {
          g.burst(x, y, '#ffd23f', 16, 180);
          g.float(x, y - 10, `+${n}`);
        }
      },
      // Points without the chime (for games with their own sounds).
      add(n = 1) {
        g.score += n;
        setScore(g.score);
      },
      // A heart lost; true when that was the last one.
      lose(x, y, say) {
        if (g.over) return true;
        playIncorrectBuzz();
        g.hearts -= 1;
        setHearts(g.hearts);
        g.shake = 0.3;
        if (x !== undefined) g.burst(x, y, '#94a3b8', 10, 120);
        if (g.hearts <= 0) {
          g.over = true;
          setOver(true);
          speak(`Out of hearts! You got ${g.score}!`);
          setTimeout(() => endRef.current(g.score), 2300);
          return true;
        }
        if (say) speak(say);
        return false;
      },
      // End the game (for games that end on moves, not hearts).
      end(say) {
        if (g.over) return;
        g.over = true;
        setOver(true);
        speak(say || `Great game! You got ${g.score}!`);
        setTimeout(() => endRef.current(g.score), 2300);
      },
      gainHeart() {
        if (g.hearts < maxHearts) {
          g.hearts += 1;
          setHearts(g.hearts);
        }
      },
    };
    function size() {
      const r = wrapRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      g.W = r.width;
      g.H = r.height;
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      game.resize?.();
    }
    const game = setup(g);
    size();
    game.start?.();
    const ro = new ResizeObserver(size);
    ro.observe(wrapRef.current);
    let last = performance.now();
    let raf = requestAnimationFrame(function frame(now) {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      g.t += dt;
      if (!g.over) game.step(dt);
      g.parts = g.parts.filter((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.life -= dt * 1.6;
        return p.life > 0;
      });
      g.floats = g.floats.filter((f) => {
        f.y -= 40 * dt;
        f.life -= dt * 1.1;
        return f.life > 0;
      });
      g.shake = Math.max(0, g.shake - dt);
      ctx.save();
      ctx.clearRect(0, 0, g.W, g.H);
      if (g.shake > 0) ctx.translate((Math.random() - 0.5) * 10 * g.shake, (Math.random() - 0.5) * 10 * g.shake);
      game.draw(ctx);
      for (const p of g.parts) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0, p.r * p.life), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (const f of g.floats) {
        ctx.globalAlpha = Math.max(0, f.life);
        text(ctx, f.text, f.x, f.y, 26, f.color);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      raf = requestAnimationFrame(frame);
    });
    const at = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = (e) => {
      if (g.over) return;
      canvas.setPointerCapture?.(e.pointerId);
      game.down?.(at(e));
    };
    const move = (e) => !g.over && game.move?.(at(e), e.buttons > 0 || e.pointerType !== 'mouse');
    const up = (e) => !g.over && game.up?.(at(e));
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    if (import.meta.env.DEV) window.__arcade = { g, game };
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const view = (
    <>
      <div className="mm-top arc-top">
        <span className="snake-hearts" aria-label={`${hearts} hearts left`} style={maxHearts ? undefined : { visibility: 'hidden' }}>
          {Array.from({ length: maxHearts }, (_, i) => (
            <span key={i} className={`snake-heart${i < hearts ? '' : ' snake-heart-gone'}`}>
              ❤
            </span>
          ))}
        </span>
        <span className="mm-right">{score}</span>
      </div>
      {prompt && (
        <div className="game-question arc-prompt" key={prompt}>
          {prompt}
        </div>
      )}
      <div className="arc-field" ref={wrapRef}>
        <canvas ref={canvasRef} className="arc-canvas" />
        {banner && !over && <div className="snake-banner">{banner}</div>}
        {over && <div className={`snake-banner${maxHearts ? ' snake-over' : ''}`}>{maxHearts ? 'Out of hearts!' : 'Great game!'}</div>}
      </div>
    </>
  );
  return { view, score, hearts, over };
}

// ---- Drawing helpers ----
export function text(ctx, s, x, y, size = 22, color = '#fff', outline = 'rgba(0,0,0,0.35)') {
  ctx.font = `700 ${size}px Fredoka, ui-rounded, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (outline) {
    ctx.lineWidth = Math.max(3, size / 6);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = outline;
    ctx.strokeText(String(s), x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(String(s), x, y);
}
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
// Pip, MathPop's bubble, on a canvas.
export function drawPip(ctx, x, y, r, { mood = 'happy', look = 0, squash = 1 } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1 / Math.sqrt(squash), squash);
  const gr = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
  gr.addColorStop(0, '#8fd0ff');
  gr.addColorStop(1, '#3d8ef0');
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.42, -r * 0.45, r * 0.18, r * 0.11, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#173a66';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * r * 0.3 + look * r * 0.1, -r * 0.05, r * 0.1, r * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,107,154,0.5)';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(s * r * 0.55, r * 0.2, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#173a66';
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mood === 'wow') {
    ctx.fillStyle = '#7f1d1d';
    ctx.ellipse(0, r * 0.3, r * 0.16, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (mood === 'sad') {
    ctx.arc(0, r * 0.5, r * 0.22, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else {
    ctx.arc(0, r * 0.12, r * 0.25, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }
  ctx.restore();
}
// A sky-to-grass backdrop.
export function backdrop(ctx, W, H, top = '#bfe6ff', bottom = '#e9f8ff') {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, top);
  bg.addColorStop(1, bottom);
  ctx.fillStyle = bg;
  ctx.fillRect(-10, -10, W + 20, H + 20);
}
export function cloud(ctx, x, y, s, color = 'rgba(255,255,255,0.9)') {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 14 * s, 0, Math.PI * 2);
  ctx.arc(x + 16 * s, y - 6 * s, 18 * s, 0, Math.PI * 2);
  ctx.arc(x + 34 * s, y, 13 * s, 0, Math.PI * 2);
  ctx.fill();
}

// ---- Math for each grade (Singapore math and Beast Academy ideas) ----
// A fact: { text, answer } for the grade (Pre-K: counting to 5).
export function fact(grade) {
  if (grade === 'p') {
    const n = rand(1, 5);
    return { text: `${'●'.repeat(n)}`, answer: n, say: `How many dots?` };
  }
  return madMinuteFact(grade);
}
// Number bonds: a whole and one part; the answer is the other part.
export function bond(grade) {
  const whole = { p: 5, k: rand(5, 10), 1: 10, 2: pick([10, 20, 100]), 3: pick([100, 1000]), 4: pick([100, 1000]) }[grade] || 10;
  const step = whole >= 100 ? (grade === '3' && whole === 1000 ? 100 : 10) : 1;
  const part = rand(1, whole / step - 1) * step;
  return { whole, part, answer: whole - part, text: `${whole} = ${part} + ?`, say: `${part} and what make ${whole}?` };
}
// Skip counting: the step for the grade.
export function skipStep(grade) {
  return { p: 1, k: pick([1, 2]), 1: pick([2, 5, 10]), 2: pick([2, 3, 4, 5, 10]), 3: pick([3, 4, 6, 7, 8, 9]), 4: pick([6, 7, 8, 9, 11, 12]) }[grade] || 2;
}
// Number properties, for sorting games: { name, test, max }.
export function rule(grade) {
  const max = { p: 5, k: 10, 1: 20, 2: 50, 3: 100, 4: 100 }[grade] || 20;
  const list = {
    p: [3, 4, 5, 2].map((n) => ({ name: `${n}`, say: `the number ${n}`, test: (x) => x === n })),
    k: [
      { name: 'more than 5', test: (x) => x > 5 },
      { name: 'less than 5', test: (x) => x < 5 },
      ...[2, 3, 4, 6, 7].map((n) => ({ name: `makes 10 with ${n}`, test: (x) => x + n === 10 })),
    ],
    1: [
      { name: 'even', test: (x) => x % 2 === 0 },
      { name: 'odd', test: (x) => x % 2 === 1 },
      { name: 'more than 10', test: (x) => x > 10 },
      ...[3, 4, 6, 8].map((n) => ({ name: `makes 10 with ${n}`, test: (x) => x + n === 10 })),
    ],
    2: [
      { name: 'even', test: (x) => x % 2 === 0 },
      { name: 'odd', test: (x) => x % 2 === 1 },
      { name: 'counted by 5s', test: (x) => x % 5 === 0 },
      { name: 'counted by 10s', test: (x) => x % 10 === 0 },
      { name: 'more than 25', test: (x) => x > 25 },
    ],
    3: [3, 4, 6, 7, 8, 9].map((n) => ({ name: `in the ${n} times table`, test: (x) => x % n === 0 && x > 0 })),
    4: [
      ...[6, 7, 8, 9].map((n) => ({ name: `a multiple of ${n}`, test: (x) => x % n === 0 && x > 0 })),
      { name: 'odd', test: (x) => x % 2 === 1 },
      { name: 'a square number', test: (x) => [1, 4, 9, 16, 25, 36, 49, 64, 81, 100].includes(x) },
    ],
  }[grade] || [];
  const r = pick(list);
  return { ...r, max, say: r.say || `numbers that are ${r.name}` };
}
// A number that does (or doesn't) fit a rule.
export function numberFor(r, fits) {
  for (let k = 0; k < 200; k++) {
    const x = rand(1, r.max);
    if (r.test(x) === fits) return x;
  }
  return fits ? r.max : 1;
}
// Wrong answers near a right one.
export function near(answer, n = 3) {
  const out = new Set();
  const d = answer >= 50 ? [10, -10, 1, -1, 5, -5, 2] : [1, -1, 2, -2, 3, 10, -10];
  for (const x of shuffle(d)) {
    if (answer + x >= 0 && answer + x !== answer) out.add(answer + x);
    if (out.size >= n) break;
  }
  return [...out];
}
// Hearts for the grade (more for the youngest).
export const heartsFor = (grade) => (grade === 'p' || grade === 'k' ? 5 : 3);

// A note on a little music box (for the tiles game).
let actx = null;
export function playNote(freq, dur = 0.35) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t0 = actx.currentTime;
    const o = actx.createOscillator();
    const o2 = actx.createOscillator();
    const gn = actx.createGain();
    o.type = 'triangle';
    o2.type = 'sine';
    o.frequency.value = freq;
    o2.frequency.value = freq * 2;
    gn.gain.setValueAtTime(0.0001, t0);
    gn.gain.exponentialRampToValueAtTime(0.25, t0 + 0.01);
    gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(gn);
    o2.connect(gn);
    gn.connect(actx.destination);
    o.start(t0);
    o2.start(t0);
    o.stop(t0 + dur);
    o2.stop(t0 + dur);
  } catch {
    /* no sound */
  }
}
