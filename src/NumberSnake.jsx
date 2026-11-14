import { useEffect, useRef, useState } from 'react';
import { playCorrectChime, playIncorrectBuzz, playStickerPick, playStickerStick, speak } from './sound.js';
import { rand, shuffle } from './gameKit.jsx';

// Number Snake: steer a friendly snake around a garden (drag a finger, or
// tap where it should go; arrow keys work too) and eat the fruit with the
// answer. Made easy for little ones: the snake is slow and turns sharply,
// it stays (circling) where you last pointed, it's pulled in when it's
// close to the right fruit, and a wrong fruit just pops away (the snake
// doesn't shrink), leaving fewer to choose from. The answer glows after a
// miss or 10 seconds, and after two misses an arrow points at it. Sparkle
// dots are snacks. Every few answers the snake levels up: rainbow, then a
// sparkle trail, then a gold crown. No clock: you have hearts (5 for Pre-K
// and K, 3 after), a wrong fruit costs one, every 5 answers wins one back,
// and the snake speeds up a little as you go; out of hearts, it's over.
// Drawn on a canvas.
// `makeRound(grade)` gives { text, say, answer, others } (Pop the Bubbles').

// Slower for the youngest; it turns fast, so it follows the finger closely.
const SPEEDS = { p: 72, k: 80, 1: 90, 2: 98 };
const TURN = 7.5; // radians a second
const GAP = 9; // px between body pieces
const BALL_R = 27;
// How many fruits to choose from.
const CHOICES = { p: 3, k: 3, 1: 3, 2: 4 };
const COLORS = ['#ff6b9a', '#3b8cf0', '#ff9f43', '#9b6bf2', '#14b8a6', '#e5484d'];
// The fruits the numbers sit on: [skin, darker side, leaf].
const FRUITS = [
  ['#ef4444', '#b91c1c', '#22c55e'],
  ['#fb923c', '#ea580c', '#16a34a'],
  ['#a855f7', '#7e22ce', '#22c55e'],
  ['#84cc16', '#4d7c0f', '#15803d'],
  ['#f472b6', '#db2777', '#22c55e'],
  ['#facc15', '#ca8a04', '#16a34a'],
];
const LEVELS = [
  { at: 4, name: 'Rainbow snake!' },
  { at: 8, name: 'Sparkle snake!' },
  { at: 12, name: 'King snake! 👑' },
];
const levelFor = (score) => LEVELS.filter((l) => score >= l.at).length;

export default function NumberSnake({ grade, onEnd, makeRound }) {
  // Hearts instead of a clock (more for the youngest).
  const maxHearts = grade === 'p' || grade === 'k' ? 5 : 3;
  const [hearts, setHearts] = useState(maxHearts);
  const heartsRef = useRef(maxHearts);
  const [lost, setLost] = useState(-1);
  const [over, setOver] = useState(false);
  const SPEED = SPEEDS[grade] || 104;
  const [round, setRound] = useState(() => kidRound(makeRound(grade), grade));
  const [score, setScore] = useState(0);
  const [banner, setBanner] = useState(null);
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  // Everything the game loop changes lives here (not in React state).
  const g = useRef(null);
  const roundRef = useRef(round);
  roundRef.current = round;
  const scoreRef = useRef(0);

  // Pre-K's "Pop 4!" becomes "Eat 4!".
  function kidRound(r, gr) {
    return gr === 'p' ? { ...r, text: `Eat ${r.answer}!`, say: `Eat the number ${r.answer}!` } : r;
  }

  useEffect(() => {
    if (round.say) speak(round.say);
  }, [round]);
  // Out of hearts: a moment to see it, then the results.
  useEffect(() => {
    if (!over) return undefined;
    const id = setTimeout(() => onEnd(scoreRef.current), 2200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  // Set up the field and run the loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const state = {
      W: 360,
      H: 460,
      head: { x: 180, y: 300, a: -Math.PI / 2 },
      body: [],
      grow: 0,
      target: null,
      keys: { left: false, right: false },
      balls: [],
      dots: [],
      parts: [],
      floats: [],
      misses: 0,
      shake: 0,
      over: false,
      t: 0,
      dotSound: 0,
      dotsPattern: [],
      flowers: [],
      roundAt: 0,
      blink: 0,
      tongue: 0,
    };
    g.current = state;
    // For automated play tests in development only.
    if (import.meta.env.DEV) window.__snake = { state, round: () => roundRef.current };

    function size() {
      const r = wrapRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      state.W = r.width;
      state.H = r.height;
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // The garden: grass tufts and little flowers.
      state.dotsPattern = Array.from({ length: Math.round((r.width * r.height) / 3200) }, () => ({
        x: Math.random() * r.width,
        y: Math.random() * r.height,
        s: 0.7 + Math.random() * 0.6,
      }));
      state.flowers = Array.from({ length: Math.round((r.width * r.height) / 9000) }, (_, i) => ({
        x: Math.random() * r.width,
        y: Math.random() * r.height,
        c: ['#ffffff', '#ffd23f', '#ff9ec4', '#c4b5fd'][i % 4],
        r: 3 + Math.random() * 2,
      }));
    }
    size();
    state.head = { x: state.W / 2, y: state.H * 0.7, a: -Math.PI / 2 };
    state.body = Array.from({ length: 9 }, (_, i) => ({ x: state.head.x, y: state.head.y + (i + 1) * GAP }));
    placeBalls(roundRef.current);
    for (let i = 0; i < 10; i++) state.dots.push(newDot());

    const ro = new ResizeObserver(size);
    ro.observe(wrapRef.current);

    let last = performance.now();
    let raf = requestAnimationFrame(function frame(now) {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      if (!state.over) step(dt);
      draw();
      raf = requestAnimationFrame(frame);
    });

    // Steering: drag (or tap) where the snake should go; arrow keys turn.
    const toLocal = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = (e) => {
      canvas.setPointerCapture?.(e.pointerId);
      state.target = toLocal(e);
      state.dragging = true;
    };
    const move = (e) => {
      if (state.dragging) state.target = toLocal(e);
    };
    // Let go: the snake stays around where you last pointed.
    const up = () => {
      state.dragging = false;
    };
    const key = (on) => (e) => {
      if (e.key === 'ArrowLeft') state.keys.left = on;
      else if (e.key === 'ArrowRight') state.keys.right = on;
      else return;
      e.preventDefault();
    };
    const kd = key(true);
    const ku = key(false);
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };

    // ---- the game ----
    function freeSpot(r) {
      for (let k = 0; k < 60; k++) {
        const p = { x: r + 8 + Math.random() * (state.W - 2 * r - 16), y: r + 8 + Math.random() * (state.H - 2 * r - 16) };
        const nearHead = Math.hypot(p.x - state.head.x, p.y - state.head.y) < 110;
        const nearBall = state.balls.some((b) => Math.hypot(p.x - b.x, p.y - b.y) < 2 * BALL_R + 18);
        if (!nearHead && !nearBall) return p;
      }
      return { x: state.W / 2, y: state.H / 3 };
    }
    function placeBalls(r) {
      state.balls = [];
      state.misses = 0;
      state.roundAt = state.t;
      const fruits = shuffle(FRUITS);
      shuffle([r.answer, ...r.others.slice(0, (CHOICES[grade] || 5) - 1)]).forEach((v, i) => {
        const p = freeSpot(BALL_R);
        state.balls.push({ ...p, v, f: fruits[i % fruits.length], c: fruits[i % fruits.length][0], born: state.t, bob: Math.random() * 6 });
      });
    }
    function newDot() {
      return { x: 10 + Math.random() * (state.W - 20), y: 10 + Math.random() * (state.H - 20), c: COLORS[rand(0, COLORS.length - 1)], born: state.t };
    }
    function burst(x, y, color, n = 14, speed = 160) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = speed * (0.4 + Math.random() * 0.8);
        state.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, c: color, r: 3 + Math.random() * 4 });
      }
    }

    function step(dt) {
      state.t += dt;
      const h = state.head;
      // Turn toward the finger (or with the keys), at most TURN a second.
      let want = null;
      const r0 = roundRef.current;
      const ans = state.balls.find((b) => b.v === r0.answer);
      if (ans && Math.hypot(ans.x - h.x, ans.y - h.y) < 80) {
        // Close to the right fruit: pulled in.
        want = Math.atan2(ans.y - h.y, ans.x - h.x);
      } else if (state.target) {
        const dist = Math.hypot(state.target.x - h.x, state.target.y - h.y);
        // At the spot: circle gently around it, instead of wandering off.
        want = dist > 26 ? Math.atan2(state.target.y - h.y, state.target.x - h.x) : h.a + 1.4;
      }
      if (want !== null) {
        let d = want - h.a;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        h.a += Math.max(-TURN * dt, Math.min(TURN * dt, d));
      } else if (state.keys.left) h.a -= TURN * dt;
      else if (state.keys.right) h.a += TURN * dt;
      // A little faster with each answer (up to half as fast again).
      const v = SPEED * (1 + Math.min(0.5, scoreRef.current * 0.03));
      h.x += Math.cos(h.a) * v * dt;
      h.y += Math.sin(h.a) * v * dt;
      // Soft walls: bounce off the edge.
      const m = 14;
      if (h.x < m || h.x > state.W - m) {
        h.a = Math.PI - h.a;
        h.x = Math.max(m, Math.min(state.W - m, h.x));
      }
      if (h.y < m || h.y > state.H - m) {
        h.a = -h.a;
        h.y = Math.max(m, Math.min(state.H - m, h.y));
      }
      // The body follows the leader.
      let prev = h;
      for (const s of state.body) {
        const dx = s.x - prev.x;
        const dy = s.y - prev.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d > GAP) {
          s.x = prev.x + (dx / d) * GAP;
          s.y = prev.y + (dy / d) * GAP;
        }
        prev = s;
      }
      // It grows up to a point (so a long game doesn't fill the garden).
      if (state.grow >= 1 && state.body.length >= 46) state.grow = 0;
      if (state.grow >= 1) {
        const tail = state.body[state.body.length - 1];
        state.body.push({ ...tail });
        state.grow -= 1;
      }

      // Snacks.
      state.dots.forEach((d, i) => {
        if (Math.hypot(d.x - h.x, d.y - h.y) < 20) {
          burst(d.x, d.y, d.c, 6, 90);
          state.grow += 0.34;
          state.dots[i] = newDot();
          if (state.t - state.dotSound > 0.25) {
            playStickerPick();
            state.dotSound = state.t;
          }
        }
      });

      // Number balls.
      const r = roundRef.current;
      for (let i = 0; i < state.balls.length; i++) {
        const b = state.balls[i];
        if (state.t - b.born < 0.35) continue;
        if (Math.hypot(b.x - h.x, b.y - h.y) > BALL_R + (b.v === r.answer ? 16 : 6)) continue;
        if (b.v === r.answer) {
          playCorrectChime();
          burst(b.x, b.y, b.c, 26, 220);
          burst(b.x, b.y, b.f[2], 8, 140);
          burst(b.x, b.y, '#ffd23f', 12, 160);
          state.floats.push({ x: b.x, y: b.y, text: '+1', life: 1 });
          state.grow += 3;
          scoreRef.current += 1;
          const s = scoreRef.current;
          setScore(s);
          if (s % 5 === 0 && heartsRef.current < maxHearts) {
            heartsRef.current += 1;
            setHearts(heartsRef.current);
            state.floats.push({ x: h.x, y: h.y - 30, text: '+❤', life: 1.2 });
          }
          const lv = LEVELS.find((l) => l.at === s);
          if (lv) {
            playStickerStick();
            setBanner(lv.name);
            speak(lv.name.replace(' 👑', ''));
            setTimeout(() => setBanner(null), 1800);
            burst(h.x, h.y, '#ffd23f', 40, 260);
          }
          const next = kidRound(makeRound(grade), grade);
          setRound(next);
          roundRef.current = next;
          placeBalls(next);
        } else {
          // Not that one: it pops away (one fewer to choose from).
          playIncorrectBuzz();
          burst(b.x, b.y, b.c, 12, 120);
          state.floats.push({ x: b.x, y: b.y, text: `${b.v}`, life: 1, bad: true });
          state.balls.splice(i, 1);
          state.shake = 0.2;
          state.misses += 1;
          heartsRef.current -= 1;
          setHearts(heartsRef.current);
          setLost(heartsRef.current);
          if (heartsRef.current <= 0) {
            state.over = true;
            state.shake = 0.5;
            setOver(true);
            speak(`Oh no, no more hearts! You got ${scoreRef.current} ${scoreRef.current === 1 ? 'answer' : 'answers'}!`);
            break;
          }
          if (state.misses === 1) speak(`Oops, that's ${b.v}! You lost a heart. Look for the glowing one!`);
          else if (state.misses === 2) speak('Follow the arrow!');
        }
        break;
      }

      state.parts = state.parts.filter((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.life -= dt * 1.6;
        return p.life > 0;
      });
      state.floats = state.floats.filter((f) => {
        f.y -= 40 * dt;
        f.life -= dt * 1.1;
        return f.life > 0;
      });
      state.shake = Math.max(0, state.shake - dt);
      state.blink = state.blink > 0 ? state.blink - dt : Math.random() < dt / 3 ? 0.14 : 0;
      state.tongue = state.tongue > 0 ? state.tongue - dt : Math.random() < dt / 2.5 ? 0.35 : 0;
      // A sparkle trail once the snake is a Sparkle snake.
      if (levelFor(scoreRef.current) >= 2 && Math.random() < 0.5) {
        const tail = state.body[state.body.length - 1];
        state.parts.push({ x: tail.x, y: tail.y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, life: 0.8, c: COLORS[rand(0, COLORS.length - 1)], r: 2.5 });
      }
    }

    function draw() {
      const { W, H } = state;
      ctx.save();
      ctx.clearRect(0, 0, W, H);
      if (state.shake > 0) ctx.translate((Math.random() - 0.5) * 10 * state.shake, (Math.random() - 0.5) * 10 * state.shake);
      // The garden: mowed stripes of grass, tufts and little flowers.
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#a7e08f');
      bg.addColorStop(1, '#7cc96b');
      ctx.fillStyle = bg;
      ctx.fillRect(-10, -10, W + 20, H + 20);
      ctx.fillStyle = 'rgba(255,255,255,0.09)';
      for (let x = -10; x < W; x += 56) ctx.fillRect(x, -10, 28, H + 20);
      ctx.strokeStyle = 'rgba(46, 125, 50, 0.35)';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      for (const d of state.dotsPattern) {
        ctx.beginPath();
        ctx.moveTo(d.x - 4 * d.s, d.y);
        ctx.lineTo(d.x - 6 * d.s, d.y - 7 * d.s);
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x, d.y - 9 * d.s);
        ctx.moveTo(d.x + 4 * d.s, d.y);
        ctx.lineTo(d.x + 6 * d.s, d.y - 7 * d.s);
        ctx.stroke();
      }
      for (const f of state.flowers) {
        ctx.fillStyle = f.c;
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(f.x + Math.cos(a) * f.r, f.y + Math.sin(a) * f.r, f.r * 0.75, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Snacks: twinkling dots.
      for (const d of state.dots) {
        const s = Math.max(0, Math.min(1, (state.t - d.born) * 4)) * (1 + 0.15 * Math.sin(state.t * 6 + d.x));
        ctx.fillStyle = d.c;
        ctx.shadowColor = d.c;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 5 * s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Number balls (they pop in, and bob).
      const r = roundRef.current;
      const answerBall = state.balls.find((b) => b.v === r.answer);
      for (const b of state.balls) {
        const age = state.t - b.born;
        const s = age < 0.35 ? Math.max(0.01, easeBack(Math.max(0, age) / 0.35)) : 1;
        const y = b.y + Math.sin(state.t * 2 + b.bob) * 3;
        const glow = (state.misses >= 1 || state.t - state.roundAt > 10) && b === answerBall;
        if (glow) {
          const p = (Math.sin(state.t * 6) + 1) / 2;
          ctx.strokeStyle = `rgba(255, 210, 63, ${0.5 + 0.5 * p})`;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(b.x, y, (BALL_R + 8 + 4 * p) * s, 0, Math.PI * 2);
          ctx.stroke();
        }
        // A fruit: shadow, round body, shine, stem and leaf, and its number.
        const R = BALL_R * s;
        ctx.fillStyle = 'rgba(20, 70, 20, 0.22)';
        ctx.beginPath();
        ctx.ellipse(b.x, b.y + BALL_R + 3, BALL_R * 0.8 * s, 5 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        const fg = ctx.createRadialGradient(b.x - R * 0.35, y - R * 0.4, R * 0.1, b.x, y, R);
        fg.addColorStop(0, b.f[0]);
        fg.addColorStop(1, b.f[1]);
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(b.x, y, R, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.ellipse(b.x - R * 0.42, y - R * 0.42, R * 0.22, R * 0.13, -0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#6b4423';
        ctx.lineWidth = 3 * s;
        ctx.beginPath();
        ctx.moveTo(b.x, y - R + 2);
        ctx.quadraticCurveTo(b.x + 2, y - R - 6 * s, b.x + 4, y - R - 8 * s);
        ctx.stroke();
        ctx.fillStyle = b.f[2];
        ctx.beginPath();
        ctx.ellipse(b.x + 10 * s, y - R - 4 * s, 9 * s, 4.5 * s, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `700 ${Math.round((String(b.v).length > 2 ? 18 : 24) * s)}px Fredoka, ui-rounded, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.strokeText(String(b.v), b.x, y + 2);
        ctx.fillStyle = '#fff';
        ctx.fillText(String(b.v), b.x, y + 2);
      }

      // After two misses, a dotted arrow from the head to the answer.
      if (state.misses >= 2 && answerBall) {
        const h = state.head;
        const a = Math.atan2(answerBall.y - h.y, answerBall.x - h.x);
        const d = Math.hypot(answerBall.y - h.y, answerBall.x - h.x) - BALL_R - 14;
        if (d > 30) {
          ctx.save();
          ctx.translate(h.x, h.y);
          ctx.rotate(a);
          ctx.strokeStyle = '#ffb000';
          ctx.lineWidth = 5;
          ctx.lineCap = 'round';
          ctx.setLineDash([2, 12]);
          ctx.lineDashOffset = -state.t * 40;
          ctx.beginPath();
          ctx.moveTo(22, 0);
          ctx.lineTo(d - 6, 0);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#ffb000';
          ctx.beginPath();
          ctx.moveTo(d + 4, 0);
          ctx.lineTo(d - 10, -9);
          ctx.lineTo(d - 10, 9);
          ctx.fill();
          ctx.restore();
        }
      }

      // The snake, tail first.
      const lv = levelFor(scoreRef.current);
      const n = state.body.length;
      const rad = (i) => Math.max(5, 14 - Math.max(0, i - (n - 8)) * 1.1);
      const col = (i) => (lv >= 3 ? '#ffc72c' : lv >= 1 ? `hsl(${(i * 22 - state.t * 120) % 360}, 85%, 62%)` : '#3fbf6f');
      // An outline first (all of it), then the body on top, so it reads as one snake.
      ctx.fillStyle = lv >= 3 ? '#c98a00' : lv >= 1 ? 'rgba(60,40,90,0.45)' : '#23874a';
      for (let i = n - 1; i >= 0; i--) {
        ctx.beginPath();
        ctx.arc(state.body[i].x, state.body[i].y, rad(i) + 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = n - 1; i >= 0; i--) {
        const s = state.body[i];
        const rr = rad(i);
        ctx.fillStyle = col(i);
        ctx.beginPath();
        ctx.arc(s.x, s.y, rr, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = n - 1; i >= 0; i--) {
        const s = state.body[i];
        const rr = rad(i);
        // Belly shine, and spots every few pieces.
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.beginPath();
        ctx.arc(s.x - rr * 0.25, s.y - rr * 0.3, rr * 0.38, 0, Math.PI * 2);
        ctx.fill();
        if (i % 3 === 1 && lv < 1) {
          ctx.fillStyle = '#ffd23f';
          ctx.beginPath();
          ctx.arc(s.x + rr * 0.15, s.y + rr * 0.2, rr * 0.28, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      drawHead(lv);

      // Sparkles and floating numbers.
      for (const p of state.parts) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0, p.r * p.life), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (const f of state.floats) {
        ctx.globalAlpha = Math.max(0, f.life);
        ctx.font = '700 26px Fredoka, ui-rounded, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#fff';
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = f.bad ? '#9aa5b8' : '#2fae6b';
        ctx.fillText(f.text, f.x, f.y);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function drawHead(lv) {
      const h = state.head;
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.a);
      // Near a fruit, the mouth opens; now and then the tongue flicks.
      const near = state.balls.some((b) => Math.hypot(b.x - h.x, b.y - h.y) < 70);
      if (state.tongue > 0 && !near) {
        ctx.strokeStyle = '#e5484d';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        const L = 14 + Math.sin(state.tongue * 18) * 4;
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(16 + L, 0);
        ctx.moveTo(16 + L, 0);
        ctx.lineTo(16 + L + 5, -4);
        ctx.moveTo(16 + L, 0);
        ctx.lineTo(16 + L + 5, 4);
        ctx.stroke();
      }
      ctx.fillStyle = lv >= 3 ? '#c98a00' : lv >= 1 ? 'rgba(60,40,90,0.45)' : '#23874a';
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 18.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = lv >= 3 ? '#ffc72c' : lv >= 1 ? `hsl(${(-state.t * 120) % 360}, 85%, 60%)` : '#3fbf6f';
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 16.5, 0, 0, Math.PI * 2);
      ctx.fill();
      if (near) {
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.moveTo(19, 0);
        ctx.arc(12, 0, 8, -0.9, 0.9);
        ctx.closePath();
        ctx.fill();
      }
      // Cheeks, eyes and a smile.
      ctx.fillStyle = 'rgba(255,107,154,0.55)';
      ctx.beginPath();
      ctx.arc(4, -11, 3.5, 0, Math.PI * 2);
      ctx.arc(4, 11, 3.5, 0, Math.PI * 2);
      ctx.fill();
      for (const side of [-1, 1]) {
        if (state.blink > 0) {
          ctx.strokeStyle = '#173a66';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(4, side * 7.5);
          ctx.lineTo(11, side * 7.5);
          ctx.stroke();
          continue;
        }
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(6, side * 7.5, 6.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#173a66';
        ctx.beginPath();
        ctx.arc(8.5, side * 7.5, 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(9.6, side * 7.5 - 1.4, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!near) {
        ctx.strokeStyle = '#173a66';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(11, 0, 4, -Math.PI / 2.6, Math.PI / 2.6);
        ctx.stroke();
      }
      if (lv >= 3) {
        // The crown sits on top of the head.
        ctx.rotate(-h.a);
        ctx.translate(0, -20);
        ctx.fillStyle = '#ffd23f';
        ctx.strokeStyle = '#d99a00';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-10, 6);
        ctx.lineTo(-11, -6);
        ctx.lineTo(-5, -1);
        ctx.lineTo(0, -9);
        ctx.lineTo(5, -1);
        ctx.lineTo(11, -6);
        ctx.lineTo(10, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#e5484d';
        ctx.beginPath();
        ctx.arc(0, 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="game game-snake">
      <div className="mm-top snake-top">
        <span className="snake-hearts" aria-label={`${hearts} ${hearts === 1 ? 'heart' : 'hearts'} left`}>
          {Array.from({ length: maxHearts }, (_, i) => (
            <span key={i} className={`snake-heart${i < hearts ? '' : ' snake-heart-gone'}${i === lost ? ' snake-heart-lost' : ''}`}>
              ❤
            </span>
          ))}
        </span>
        <span className="mm-right">
          {score} {score === 1 ? 'answer' : 'answers'}
        </span>
      </div>
      <div className="game-question" key={round.text + score}>
        {round.text}
      </div>
      <div className="snake-field" ref={wrapRef}>
        <canvas ref={canvasRef} className="snake-canvas" aria-label={`Number Snake. ${round.text}`} />
        {banner && !over && <div className="snake-banner">{banner}</div>}
        {over && <div className="snake-banner snake-over">Out of hearts!</div>}
        {score === 0 && <div className="snake-tip">Touch where the snake should go!</div>}
      </div>
      <div className="snake-levels" aria-hidden="true">
        {LEVELS.map((l, i) => (
          <span key={l.at} className={`snake-level${score >= l.at ? ' snake-level-on' : ''}`}>
            {['🌈', '✨', '👑'][i]} <small>{score >= l.at ? 'Got it!' : `${l.at - score} more`}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

// Back-out easing: a little overshoot as things pop in.
function easeBack(t) {
  const c = 1.7;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
}
