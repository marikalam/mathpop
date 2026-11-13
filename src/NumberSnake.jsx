import { useEffect, useRef, useState } from 'react';
import { playCorrectChime, playIncorrectBuzz, playStickerPick, playStickerStick, speak } from './sound.js';
import { TimerBar, rand, shuffle, useCountdown } from './gameKit.jsx';

// Number Snake: steer a bubbly snake (drag a finger; arrow keys work too)
// and eat the ball with the answer. The right answer grows the snake; a
// wrong one shrinks it a little and that ball is gone, so the choices get
// easier. After a miss the answer glows, after two an arrow points at it.
// Sparkle dots are snacks. Every few answers the snake levels up: rainbow,
// then a sparkle trail, then a gold crown. Drawn on a canvas.
// `makeRound(grade)` gives { text, say, answer, others } (Pop the Bubbles').

const SPEED = 118; // px a second
const TURN = 4.6; // radians a second
const GAP = 9; // px between body pieces
const BALL_R = 24;
const COLORS = ['#ff6b9a', '#3b8cf0', '#ff9f43', '#9b6bf2', '#14b8a6', '#e5484d'];
const LEVELS = [
  { at: 4, name: 'Rainbow snake!' },
  { at: 8, name: 'Sparkle snake!' },
  { at: 12, name: 'King snake! 👑' },
];
const levelFor = (score) => LEVELS.filter((l) => score >= l.at).length;

export default function NumberSnake({ grade, onEnd, makeRound }) {
  const seconds = 60;
  const left = useCountdown(seconds, true);
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
  useEffect(() => {
    if (left === 0) {
      if (g.current) g.current.over = true;
      onEnd(scoreRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

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
      // The background's soft dots.
      state.dotsPattern = Array.from({ length: Math.round((r.width * r.height) / 2600) }, () => ({
        x: Math.random() * r.width,
        y: Math.random() * r.height,
        r: 2 + Math.random() * 4,
        c: COLORS[rand(0, COLORS.length - 1)],
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
    };
    const move = (e) => {
      if (state.target) state.target = toLocal(e);
    };
    const up = () => {
      state.target = null;
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
      shuffle([r.answer, ...r.others]).forEach((v, i) => {
        const p = freeSpot(BALL_R);
        state.balls.push({ ...p, v, c: COLORS[i % COLORS.length], born: state.t, bob: Math.random() * 6 });
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
      if (state.target && Math.hypot(state.target.x - h.x, state.target.y - h.y) > 8) want = Math.atan2(state.target.y - h.y, state.target.x - h.x);
      if (want !== null) {
        let d = want - h.a;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        h.a += Math.max(-TURN * dt, Math.min(TURN * dt, d));
      } else if (state.keys.left) h.a -= TURN * dt;
      else if (state.keys.right) h.a += TURN * dt;
      h.x += Math.cos(h.a) * SPEED * dt;
      h.y += Math.sin(h.a) * SPEED * dt;
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
        if (Math.hypot(b.x - h.x, b.y - h.y) > BALL_R + 12) continue;
        if (b.v === r.answer) {
          playCorrectChime();
          burst(b.x, b.y, b.c, 26, 220);
          burst(b.x, b.y, '#ffd23f', 12, 160);
          state.floats.push({ x: b.x, y: b.y, text: '+1', life: 1 });
          state.grow += 3;
          scoreRef.current += 1;
          const s = scoreRef.current;
          setScore(s);
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
          playIncorrectBuzz();
          burst(b.x, b.y, '#9aa5b8', 12, 120);
          state.floats.push({ x: b.x, y: b.y, text: `${b.v}`, life: 1, bad: true });
          state.balls.splice(i, 1);
          state.shake = 0.3;
          state.misses += 1;
          if (state.body.length > 6) state.body.splice(-2, 2);
          if (state.misses === 1) speak('Oops! Look for the glowing one!');
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
      // Background: a bright meadow with soft dots.
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#e9f8ef');
      bg.addColorStop(1, '#cfeedd');
      ctx.fillStyle = bg;
      ctx.fillRect(-10, -10, W + 20, H + 20);
      ctx.globalAlpha = 0.18;
      for (const d of state.dotsPattern) {
        ctx.fillStyle = d.c;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

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
        const glow = state.misses >= 1 && b === answerBall;
        if (glow) {
          const p = (Math.sin(state.t * 6) + 1) / 2;
          ctx.strokeStyle = `rgba(255, 210, 63, ${0.5 + 0.5 * p})`;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(b.x, y, (BALL_R + 8 + 4 * p) * s, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(b.x, b.y + BALL_R + 4, BALL_R * 0.8 * s, 5 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = b.c;
        ctx.beginPath();
        ctx.arc(b.x, y, BALL_R * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.arc(b.x - BALL_R * 0.4 * s, y - BALL_R * 0.4 * s, BALL_R * 0.22 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `700 ${Math.round((String(b.v).length > 2 ? 17 : 22) * s)}px Fredoka, ui-rounded, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(b.v), b.x, y + 1);
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
      for (let i = n - 1; i >= 0; i--) {
        const s = state.body[i];
        const rr = Math.max(6, 13 - Math.max(0, i - (n - 6)) * 1.2);
        ctx.fillStyle =
          lv >= 3 ? (i % 2 ? '#ffc72c' : '#ffb000') : lv >= 1 ? `hsl(${(i * 22 - state.t * 120) % 360}, 85%, 62%)` : i % 2 ? '#38c07f' : '#2fae6b';
        ctx.beginPath();
        ctx.arc(s.x, s.y, rr, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.arc(s.x - 3, s.y - 4, rr * 0.35, 0, Math.PI * 2);
        ctx.fill();
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
      ctx.fillStyle = lv >= 3 ? '#ffc72c' : lv >= 1 ? `hsl(${(-state.t * 120) % 360}, 85%, 60%)` : '#38c07f';
      ctx.beginPath();
      ctx.ellipse(0, 0, 17, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      // Cheeks, eyes and a smile.
      ctx.fillStyle = 'rgba(255,107,154,0.55)';
      ctx.beginPath();
      ctx.arc(4, -11, 3.5, 0, Math.PI * 2);
      ctx.arc(4, 11, 3.5, 0, Math.PI * 2);
      ctx.fill();
      for (const side of [-1, 1]) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(7, side * 6.5, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#173a66';
        ctx.beginPath();
        ctx.arc(9, side * 6.5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(10, side * 6.5 - 1.2, 1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#173a66';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(10, 0, 4, -Math.PI / 2.6, Math.PI / 2.6);
      ctx.stroke();
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
      <TimerBar left={left} seconds={seconds} score={score} label="answers" />
      <div className="game-question" key={round.text + score}>
        {round.text}
      </div>
      <div className="snake-field" ref={wrapRef}>
        <canvas ref={canvasRef} className="snake-canvas" aria-label={`Number Snake. ${round.text}`} />
        {banner && <div className="snake-banner">{banner}</div>}
        {score === 0 && <div className="snake-tip">Drag your finger to steer!</div>}
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
