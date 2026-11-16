import { useEffect, useRef, useState } from 'react';
import { playCorrectChime, playStickerPick, playStickerStick, speak } from './sound.js';
import { PuzzleTop, useLevel } from './puzzleKit.jsx';
import { PARK_PUZZLES } from './carParkPuzzles.js';

// Car Park: slide the cars (each only along its own lane) to clear a way
// out for the red car, on the right. The puzzles get harder level by
// level (from 3 moves to about 20); the count of moves is shown with the
// fewest it can be done in. Three puzzles a game.
const N = 6;
const EXIT_ROW = 2;
const COLORS = ['#3b8cf0', '#2fae6b', '#ffb000', '#9b6bf2', '#14b8a6', '#ff8a3d', '#ec4899', '#64748b', '#84cc16', '#0ea5e9', '#a16207', '#6366f1'];
// Older grades start a few puzzles in.
const START = { p: 0, k: 0, 1: 2, 2: 4, 3: 8, 4: 12 };

function parse(p) {
  const cars = [];
  for (let i = 0; i < p.c.length; i += 4) {
    const [r, c, len, h] = p.c.slice(i, i + 4).split('').map(Number);
    cars.push({ id: i / 4, r, c, len, h: h === 1 });
  }
  return cars;
}
const cellsOf = (car) => Array.from({ length: car.len }, (_, k) => (car.h ? [car.r, car.c + k] : [car.r + k, car.c]));
// How far a car can slide back (negative) and forward (positive).
function room(cars, car) {
  const taken = new Set();
  for (const o of cars) if (o.id !== car.id) for (const [r, c] of cellsOf(o)) taken.add(`${r},${c}`);
  let lo = 0;
  let hi = 0;
  if (car.h) {
    while (car.c + lo - 1 >= 0 && !taken.has(`${car.r},${car.c + lo - 1}`)) lo -= 1;
    while (car.c + car.len + hi < N && !taken.has(`${car.r},${car.c + car.len + hi}`)) hi += 1;
  } else {
    while (car.r + lo - 1 >= 0 && !taken.has(`${car.r + lo - 1},${car.c}`)) lo -= 1;
    while (car.r + car.len + hi < N && !taken.has(`${car.r + car.len + hi},${car.c}`)) hi += 1;
  }
  return [lo, hi];
}

export default function CarPark({ grade, onEnd, playerId }) {
  const [level, levelUp] = useLevel(playerId, grade, 'carPark');
  const index = (lv) => Math.min(PARK_PUZZLES.length - 1, (START[grade] || 0) + lv - 1);
  const [pz, setPz] = useState(() => PARK_PUZZLES[index(level)]);
  const [cars, setCars] = useState(() => parse(pz));
  const [hist, setHist] = useState([]);
  const [moves, setMoves] = useState(0);
  const [drag, setDrag] = useState(null);
  const [out, setOut] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(0);
  const [banner, setBanner] = useState(null);
  const boardRef = useRef(null);
  useEffect(() => {
    speak('Slide the cars to make a way out for the red car!');
  }, []);
  function down(e, car) {
    if (out || banner) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const cell = boardRef.current.getBoundingClientRect().width / N;
    setDrag({ id: car.id, x: e.clientX, y: e.clientY, off: 0, cell, room: room(cars, car) });
  }
  function move(e) {
    if (!drag) return;
    const car = cars.find((c) => c.id === drag.id);
    const d = ((car.h ? e.clientX - drag.x : e.clientY - drag.y) / drag.cell);
    setDrag({ ...drag, off: Math.max(drag.room[0], Math.min(drag.room[1], d)) });
  }
  function up() {
    if (!drag) return;
    const step = Math.round(drag.off);
    setDrag(null);
    if (!step) return;
    playStickerPick();
    const next = cars.map((c) => (c.id === drag.id ? (c.h ? { ...c, c: c.c + step } : { ...c, r: c.r + step }) : c));
    setHist((h) => [...h, cars]);
    setCars(next);
    const m = moves + 1;
    setMoves(m);
    const red = next[0];
    if (red.c + red.len === N) win(m);
  }
  function win(m) {
    setOut(true);
    playCorrectChime();
    const stars = m <= pz.m + 1 ? 3 : m <= pz.m * 2 ? 2 : 1;
    const total = score + stars;
    setScore(total);
    speak(m <= pz.m ? `Out in ${m} moves! That's the fewest!` : `Out in ${m} moves! It can be done in ${pz.m}.`);
    setTimeout(() => {
      playStickerStick();
      const lv = levelUp();
      const n = done + 1;
      setDone(n);
      setBanner(n >= 3 ? 'You did it!' : `Level ${lv}!`);
      setTimeout(() => {
        setBanner(null);
        if (n >= 3) {
          onEnd(total);
          return;
        }
        const next = PARK_PUZZLES[index(lv)];
        setPz(next);
        setCars(parse(next));
        setHist([]);
        setMoves(0);
        setOut(false);
      }, 1400);
    }, 1100);
  }
  const pct = (x) => `${(x / N) * 100}%`;
  return (
    <div className="game game-pz">
      <PuzzleTop level={level} score={score} label="stars" />
      <p className="game-ask">
        Get the red car out · Moves: <b>{moves}</b> · Best: {pz.m}
      </p>
      <div className="cp-wrap">
        <div className="cp-board" ref={boardRef} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          {Array.from({ length: N * N }, (_, i) => (
            <span key={i} className="cp-cell" />
          ))}
          <span className="cp-exit" style={{ top: pct(EXIT_ROW), height: pct(1) }} aria-hidden="true">
            EXIT
          </span>
          {cars.map((car, i) => {
            const off = drag && drag.id === car.id ? drag.off : 0;
            const red = i === 0;
            const shift = out && red ? 3 : 0;
            return (
              <button
                key={car.id}
                type="button"
                className={`cp-car${car.h ? ' cp-h' : ' cp-v'}${red ? ' cp-red' : ''}${drag && drag.id === car.id ? ' cp-drag' : ''}${out && red ? ' cp-out' : ''}`}
                style={{
                  left: pct(car.c + (car.h ? off + shift : 0)),
                  top: pct(car.r + (car.h ? 0 : off)),
                  width: pct(car.h ? car.len : 1),
                  height: pct(car.h ? 1 : car.len),
                  '--cc': red ? '#e5484d' : COLORS[i % COLORS.length],
                }}
                onPointerDown={(e) => down(e, car)}
                aria-label={red ? 'Red car' : car.len === 3 ? 'Truck' : 'Car'}
              >
                <span className="cp-body">
                  <i className="cp-glass" />
                  <i className="cp-glass cp-glass2" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="bakery-actions">
        <button
          type="button"
          className="bakery-btn"
          disabled={!hist.length || out}
          onClick={() => {
            setCars(hist[hist.length - 1]);
            setHist(hist.slice(0, -1));
            setMoves((m) => Math.max(0, m - 1));
          }}
        >
          Undo
        </button>
        <button
          type="button"
          className="bakery-btn"
          disabled={out}
          onClick={() => {
            setCars(parse(pz));
            setHist([]);
            setMoves(0);
          }}
        >
          Start over
        </button>
      </div>
      {banner && <div className="pz-banner">{banner}</div>}
    </div>
  );
}
