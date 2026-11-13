import { useEffect, useRef, useState } from 'react';
import { Thing } from './Drawings.jsx';
import Pip from './Pip.jsx';
import { Finale } from './Rewards.jsx';
import { RoundBar, pick, rand, shuffle } from './gameKit.jsx';
import { playCorrectChime, playIncorrectBuzz, playStickerPick, playStickerStick, speak } from './sound.js';

// Money and time, as games. Both follow the bakery's pattern: a miss is
// never a dead end (Pip helps a little more each time and, on the 3rd
// miss, does it so the kid can finish), and each round adds to something
// that ends in a party.
//   - ToyShop: pay for a toy with US coins (and bills from 3rd grade).
//     Each toy bought goes on the shelf; a full shelf is the party.
//   - SetClock: drag the clock's hands to the time in a little story.
//     Each right time lights a star on the clock tower; at the end the
//     cuckoo pops out.

const ROUNDS = 6;
const timers = () => {
  const list = [];
  return { later: (fn, ms) => list.push(setTimeout(fn, ms)), clear: () => list.forEach(clearTimeout) };
};
function useTimers() {
  const t = useRef(null);
  if (!t.current) t.current = timers();
  useEffect(() => () => t.current.clear(), []);
  return t.current.later;
}

// =================================================================== Money
// US coins and bills, in cents.
const MONEY = {
  1: { name: 'penny', plural: 'pennies', label: '1¢', size: 46, face: '#c97a3d', rim: '#9a5426', ink: '#5a2e0e' },
  5: { name: 'nickel', plural: 'nickels', label: '5¢', size: 52, face: '#d9dee6', rim: '#9aa3b2', ink: '#4b5563' },
  10: { name: 'dime', plural: 'dimes', label: '10¢', size: 42, face: '#e4e8ef', rim: '#a3acbb', ink: '#4b5563' },
  25: { name: 'quarter', plural: 'quarters', label: '25¢', size: 58, face: '#dde2ea', rim: '#949eae', ink: '#374151' },
  100: { name: 'dollar', plural: 'dollars', label: '$1', bill: true },
  500: { name: 'five-dollar bill', plural: 'five-dollar bills', label: '$5', bill: true },
};
const MONEY_LEVELS = {
  p: { coins: [1], lo: 1, hi: 5, by: 1 },
  k: { coins: [1, 5], lo: 2, hi: 10, by: 1 },
  1: { coins: [1, 5, 10], lo: 10, hi: 50, by: 1 },
  2: { coins: [1, 5, 10, 25], lo: 25, hi: 99, by: 1 },
  3: { coins: [5, 10, 25, 100], lo: 100, hi: 500, by: 5 },
  4: { coins: [5, 10, 25, 100, 500], lo: 100, hi: 500, by: 5, two: true },
};
const TOYS = [
  { id: 'ball', name: 'ball' },
  { id: 'car', name: 'toy car' },
  { id: 'bear', name: 'teddy bear' },
  { id: 'duck', name: 'rubber duck' },
  { id: 'balloon', name: 'balloon' },
  { id: 'bike', name: 'bike' },
  { id: 'turtle', name: 'turtle' },
  { id: 'monkey', name: 'monkey' },
  { id: 'butterfly', name: 'butterfly kite' },
  { id: 'fish', name: 'fish' },
];
export const money = (c) => (c < 100 ? `${c}¢` : `$${Math.floor(c / 100)}.${String(c % 100).padStart(2, '0')}`);
const moneySay = (c) => {
  if (c < 100) return `${c} ${c === 1 ? 'cent' : 'cents'}`;
  const d = Math.floor(c / 100);
  const r = c % 100;
  return `${d} ${d === 1 ? 'dollar' : 'dollars'}${r ? ` and ${r} ${r === 1 ? 'cent' : 'cents'}` : ''}`;
};

export function Coin({ value, size }) {
  const m = MONEY[value];
  if (m.bill) {
    return (
      <svg viewBox="0 0 96 46" width={size || 84} height={(size || 84) * 0.48} className="money-bill" aria-label={m.label}>
        <rect x="1" y="1" width="94" height="44" rx="5" fill="#cfe8c8" stroke="#5c8f55" strokeWidth="2" />
        <rect x="6" y="6" width="84" height="34" rx="3" fill="none" stroke="#7fae76" strokeWidth="1.2" />
        <ellipse cx="48" cy="23" rx="13" ry="15" fill="#e7f3e2" stroke="#7fae76" strokeWidth="1.2" />
        <text x="48" y="29" textAnchor="middle" fontSize="17" fontWeight="700" fill="#2f5d2a" fontFamily="Fredoka, sans-serif">
          {value / 100}
        </text>
        <text x="14" y="18" textAnchor="middle" fontSize="10" fontWeight="700" fill="#2f5d2a" fontFamily="Fredoka, sans-serif">
          {value / 100}
        </text>
        <text x="82" y="38" textAnchor="middle" fontSize="10" fontWeight="700" fill="#2f5d2a" fontFamily="Fredoka, sans-serif">
          {value / 100}
        </text>
      </svg>
    );
  }
  const s = size || m.size;
  return (
    <svg viewBox="0 0 60 60" width={s} height={s} className="money-coin" aria-label={m.label}>
      <circle cx="30" cy="30" r="29" fill={m.rim} />
      <circle cx="30" cy="30" r="25" fill={m.face} />
      <circle cx="30" cy="30" r="25" fill="none" stroke={m.rim} strokeWidth="1.5" strokeDasharray="1.5 2.5" />
      <ellipse cx="22" cy="19" rx="9" ry="5" fill="#fff" opacity="0.35" transform="rotate(-30 22 19)" />
      <text x="30" y="37" textAnchor="middle" fontSize={m.label.length > 2 ? 17 : 19} fontWeight="700" fill={m.ink} fontFamily="Fredoka, sans-serif">
        {m.label}
      </text>
    </svg>
  );
}

function moneyRound(grade, used) {
  const L = MONEY_LEVELS[grade] || MONEY_LEVELS[1];
  const toys = shuffle(TOYS.filter((t) => !used.includes(t.id)));
  const price = () => rand(L.lo / L.by, L.hi / L.by) * L.by;
  if (L.two) {
    const a = price();
    const b = rand(1, Math.max(1, (1000 - a) / L.by)) * L.by;
    return { items: [{ ...toys[0], price: a }, { ...toys[1], price: Math.min(b, 500) }], coins: L.coins };
  }
  return { items: [{ ...toys[0], price: price() }], coins: L.coins };
}
// The fewest coins that make `c` (biggest first).
function greedy(c, coins) {
  const out = [];
  for (const v of [...coins].sort((a, b) => b - a)) {
    while (c >= v) {
      out.push(v);
      c -= v;
    }
  }
  return out;
}

export function ToyShop({ grade, onEnd }) {
  const later = useTimers();
  const [n, setN] = useState(0);
  const [used, setUsed] = useState([]);
  const [r, setR] = useState(() => moneyRound(grade, []));
  const [tray, setTray] = useState([]);
  const [tries, setTries] = useState(0);
  const [note, setNote] = useState(null);
  const [paid, setPaid] = useState(false);
  const [demo, setDemo] = useState(false);
  const [score, setScore] = useState(0);
  const [shelf, setShelf] = useState([]);
  const [party, setParty] = useState(null);
  const [flying, setFlying] = useState(null);
  const want = r.items.reduce((s, t) => s + t.price, 0);
  const have = tray.reduce((s, c) => s + c, 0);
  const two = r.items.length > 1;

  const ask = (rr) =>
    rr.items.length > 1
      ? `You want the ${rr.items[0].name} for ${moneySay(rr.items[0].price)} and the ${rr.items[1].name} for ${moneySay(rr.items[1].price)}. How much do they cost together? Pay that much!`
      : `The ${rr.items[0].name} costs ${moneySay(rr.items[0].price)}. Pay with your coins!`;
  useEffect(() => {
    speak(ask(r));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r]);

  function add(v) {
    if (paid || demo || tray.length >= 30) return;
    playStickerPick();
    const next = [...tray, v];
    setTray(next);
    setFlying({ v, n: Math.random() });
    speak(money(next.reduce((s, c) => s + c, 0)).replace('¢', ' cents'));
  }
  function remove(i) {
    if (paid || demo) return;
    playStickerPick();
    const next = tray.filter((_, k) => k !== i);
    setTray(next);
    if (next.length) speak(money(next.reduce((s, c) => s + c, 0)).replace('¢', ' cents'));
  }

  // Pip pays: the fewest coins, one at a time.
  function showHow() {
    setDemo(true);
    setTray([]);
    const coins = greedy(want, r.coins);
    setNote('Watch Pip pay!');
    speak(`Watch me! ${coins.map((c) => MONEY[c].name).join(', ')}. That makes ${moneySay(want)}!`);
    coins.forEach((c, i) =>
      later(() => {
        playStickerPick();
        setTray((t) => [...t, c]);
      }, 550 * (i + 1)),
    );
    later(() => {
      setDemo(false);
      setNote('Now you tap “Pay!”');
    }, 550 * coins.length + 500);
  }

  function pay() {
    if (paid || demo || !tray.length) return;
    if (have === want) {
      playCorrectChime();
      const pts = tries === 0 ? 3 : tries === 1 ? 2 : 1;
      const total = score + pts;
      setScore(total);
      setPaid(true);
      setNote(`Thank you! +${pts} stars`);
      speak(`${moneySay(want)}. That's just right! Thank you!`);
      const nextShelf = [...shelf, ...r.items.map((t) => t.id)];
      later(() => {
        setShelf(nextShelf);
        if (n + 1 >= ROUNDS) {
          playStickerStick();
          setParty({ total });
          speak('Your toy shelf is full! Party time!');
        } else {
          // Not the same toys again for a while.
          const u = [...used, ...r.items.map((t) => t.id)].slice(-6);
          setUsed(u);
          setN(n + 1);
          setR(moneyRound(grade, u));
          setTray([]);
          setTries(0);
          setNote(null);
          setPaid(false);
        }
      }, 1500);
      return;
    }
    playIncorrectBuzz();
    const t = tries + 1;
    setTries(t);
    const line = have > want ? `That's ${moneySay(have)}. Too much! Take some out.` : `That's ${moneySay(have)}. Not enough yet!`;
    if (t === 1) {
      setNote(line);
      speak(two && t === 1 ? `${line} First add the two prices together.` : line);
    } else if (t === 2) {
      setNote(`${line} Try the glowing coin!`);
      speak(`${line} Here's a tip: try the glowing coin!`);
    } else {
      setNote(line);
      speak(line);
      later(showHow, 1100);
    }
  }

  // The coin that helps next: the biggest that still fits (or, if it's
  // too much, a coin in the tray to take out).
  const tip = tries >= 2 && !demo && !paid ? (have < want ? greedy(want - have, r.coins)[0] : null) : null;
  const tipOut = tries >= 2 && !demo && !paid && have > want;
  const shelfIds = shelf.slice(-12);

  return (
    <div className="game game-toyshop">
      <RoundBar at={n + 1} of={ROUNDS} word="Toy" score={score} label="stars" />
      <div className="toy-shelf" aria-label="Your toys">
        {Array.from({ length: Math.max(ROUNDS * (MONEY_LEVELS[grade]?.two ? 2 : 1), shelfIds.length) }, (_, i) => (
          <span key={i} className={`toy-slot${shelfIds[i] ? ' toy-slot-full' : ''}`}>
            {shelfIds[i] ? <Thing id={shelfIds[i]} size={28} /> : null}
          </span>
        ))}
      </div>
      <div className="toy-counter">
        {r.items.map((t, i) => (
          <button key={t.id + i} type="button" className={`toy-item${paid ? ' toy-item-bought' : ''}`} onClick={() => speak(ask(r))}>
            <span className="toy-pic">
              <Thing id={t.id} size={two ? 64 : 84} />
            </span>
            <span className="toy-tag">{money(t.price)}</span>
          </button>
        ))}
        {two && <span className="toy-plus">+</span>}
      </div>
      <div className={`toy-tray${have === want && tray.length ? ' toy-tray-good' : ''}`}>
        <span className="toy-tray-total" key={have}>
          {money(have)}
        </span>
        <div className="toy-tray-coins">
          {tray.length === 0 && <span className="toy-tray-empty">Tap coins to pay</span>}
          {tray.map((c, i) => (
            <button
              key={i}
              type="button"
              className={`toy-paid${i === tray.length - 1 && flying ? ' toy-paid-new' : ''}${tipOut ? ' toy-glow' : ''}`}
              onClick={() => remove(i)}
              aria-label={`Take out ${MONEY[c].name}`}
            >
              <Coin value={c} size={MONEY[c].bill ? 64 : MONEY[c].size * 0.8} />
            </button>
          ))}
        </div>
      </div>
      {note && (
        <p className={`bakery-note${paid ? ' bakery-note-good' : ''}${tries >= 2 && !paid ? ' bakery-note-pip' : ''}`}>
          {tries >= 2 && !paid && <Pip size={34} mood="wave" />}
          <span>{note}</span>
        </p>
      )}
      <div className="toy-wallet">
        {r.coins.map((v) => (
          <button key={v} type="button" className={`toy-coin-btn${tip === v ? ' toy-glow' : ''}`} onClick={() => add(v)} disabled={paid || demo} aria-label={`Add a ${MONEY[v].name}`}>
            <Coin value={v} />
            <small>{MONEY[v].name}</small>
          </button>
        ))}
      </div>
      <button
        type="button"
        className={`bake-serve${tries >= 3 && !demo && !paid && have === want ? ' bake-serve-pulse' : ''}`}
        disabled={!tray.length || paid || demo}
        onClick={pay}
      >
        Pay!
      </button>
      {party && (
        <Finale title="Your toy shelf is full!" line="You paid for every toy!" button="Yay! →" onDone={() => onEnd(party.total)}>
          <span className="toy-party">
            {shelf.map((id, i) => (
              <span key={i} className="finale-guest" style={{ animationDelay: `${i * 0.1}s` }}>
                <Thing id={id} size={shelf.length > 6 ? 44 : 58} />
              </span>
            ))}
          </span>
        </Finale>
      )}
    </div>
  );
}

// =================================================================== Clock
// Pip's day, for the stories ("Pip rides the bus at 8:30").
const EVENTS = [
  { hour: 7, what: 'wakes up', icon: 'sun' },
  { hour: 7, what: 'eats breakfast', icon: 'banana' },
  { hour: 8, what: 'rides the bus', icon: 'bus' },
  { hour: 10, what: 'has a snack', icon: 'apple' },
  { hour: 12, what: 'eats lunch', icon: 'grapes' },
  { hour: 2, what: 'plays ball', icon: 'ball' },
  { hour: 3, what: 'goes for a walk', icon: 'walk' },
  { hour: 4, what: 'rides a bike', icon: 'bike' },
  { hour: 5, what: 'feeds the fish', icon: 'fish' },
  { hour: 6, what: 'eats dinner', icon: 'cookie' },
  { hour: 7, what: 'takes a bath', icon: 'duck' },
  { hour: 8, what: 'goes to bed', icon: 'moon' },
];
const ELAPSED = [
  { what: 'Soccer practice', icon: 'ball' },
  { what: 'The movie', icon: 'star' },
  { what: 'The bike ride', icon: 'bike' },
  { what: 'Baking cookies', icon: 'cookie' },
  { what: 'The trip to the park', icon: 'bus' },
];
// What each grade does: which minutes, and whether hands are dragged.
const CLOCK_LEVELS = {
  p: { mode: 'pick', step: 60 },
  k: { mode: 'set', step: 60, hourOnly: true },
  1: { mode: 'set', step: 30 },
  2: { mode: 'set', step: 5 },
  3: { mode: 'set', step: 1 },
  4: { mode: 'elapsed', step: 5 },
};
const clockText = (t) => {
  const h = Math.floor(t / 60) % 12 || 12;
  return `${h}:${String(t % 60).padStart(2, '0')}`;
};
const clockSay = (t) => {
  const h = Math.floor(t / 60) % 12 || 12;
  const m = t % 60;
  return m === 0 ? `${h} o'clock` : m < 10 ? `${h} oh ${m}` : `${h} ${m}`;
};
// Day or night behind the clock, from the story's hour.
const SKIES = {
  morning: ['#ffe9a8', '#ffd0a1'],
  day: ['#bfe6ff', '#8fd0ff'],
  evening: ['#ffb38a', '#c58bdc'],
  night: ['#3b4b8f', '#1d2a5c'],
};
function skyFor(ev) {
  if (!ev) return 'day';
  const h = ev.hour;
  if (ev.icon === 'moon') return 'night';
  if (h >= 6 && h <= 9 && ['sun', 'banana', 'bus'].includes(ev.icon)) return 'morning';
  if (h >= 5 && h <= 7 && ['fish', 'cookie', 'duck'].includes(ev.icon)) return 'evening';
  return 'day';
}

function clockRound(grade) {
  const L = CLOCK_LEVELS[grade] || CLOCK_LEVELS[1];
  const ev = pick(EVENTS);
  const minute = () => rand(0, 59 / L.step) * L.step;
  if (L.mode === 'elapsed') {
    const e = pick(ELAPSED);
    const start = rand(1, 11) * 60 + rand(0, 11) * 5;
    const len = pick([15, 20, 30, 45, 50, 75, 90]);
    return { L, ev: { hour: Math.floor(start / 60), icon: e.icon }, start, target: (start + len) % 720, text: `${e.what} starts at ${clockText(start)} and lasts ${len} minutes. When does it end?`, short: `Starts ${clockText(start)} · lasts ${len} min` };
  }
  const target = (ev.hour % 12) * 60 + (L.step === 60 ? 0 : minute());
  if (L.mode === 'pick') {
    const opts = shuffle([target, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (h % 12) * 60).filter((x) => x !== target)).slice(0, 2)]);
    return { L, ev, target, opts, text: `Pip ${ev.what} at ${clockSay(target)}. Find that clock!` };
  }
  // The clock starts at 12:00 (or 3:00 when the answer is 12:00).
  return { L, ev, start: target === 0 ? 180 : 0, target, text: `Pip ${ev.what} at ${clockText(target)}. Set the clock!` };
}

// A big clock face. With `onSet`, its hands can be dragged: grab near the
// hour hand to turn the hours, anywhere else to turn the minute hand (the
// hour hand moves along with it, like a real clock).
function BigClock({ time, size = 250, onSet, step = 1, hourOnly = false, ghost = null, glow = false }) {
  const ref = useRef(null);
  const drag = useRef(null);
  const cur = useRef(time);
  cur.current = time;
  const angleOf = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    return ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;
  };
  const snap = (t) => (((Math.round(t / step) * step) % 720) + 720) % 720;
  function down(e) {
    if (!onSet) return;
    e.preventDefault();
    ref.current.setPointerCapture?.(e.pointerId);
    const a = angleOf(e);
    const t = cur.current;
    const hourA = ((t % 720) / 720) * 360;
    const minA = (t % 60) * 6;
    const dist = (p, q) => Math.min(Math.abs(p - q), 360 - Math.abs(p - q));
    const which = hourOnly || dist(a, hourA) < dist(a, minA) - 10 ? 'hour' : 'minute';
    drag.current = { which, last: a, raw: t };
    move(e);
  }
  function move(e) {
    const d = drag.current;
    if (!d) return;
    const a = angleOf(e);
    if (d.which === 'hour') {
      const m = hourOnly ? 0 : cur.current % 60;
      const h = Math.round((a - m * 0.5) / 30);
      const t = (((h % 12) + 12) % 12) * 60 + m;
      if (t !== cur.current) {
        playStickerPick();
        onSet(t);
      }
    } else {
      let delta = a - d.last;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      d.last = a;
      d.raw += delta / 6;
      const t = snap(d.raw);
      if (t !== cur.current) {
        if (Math.floor(t / 60) !== Math.floor(cur.current / 60) || t % 15 === 0) playStickerPick();
        onSet(t);
      }
    }
  }
  function up() {
    drag.current = null;
  }
  const hand = (t, cls) => (
    <g className={cls}>
      <line x1="100" y1="100" x2="100" y2="58" className="clk-hour" transform={`rotate(${((t % 720) / 720) * 360} 100 100)`} />
      <line x1="100" y1="100" x2="100" y2="30" className="clk-min" transform={`rotate(${(t % 60) * 6} 100 100)`} />
    </g>
  );
  return (
    <svg
      ref={ref}
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`big-clock${onSet ? ' big-clock-live' : ''}${glow ? ' big-clock-glow' : ''}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      role="img"
      aria-label={`Clock showing ${clockSay(time)}`}
    >
      <defs>
        <radialGradient id="clk-face" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eef3fb" />
        </radialGradient>
        <linearGradient id="clk-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8fb1" />
          <stop offset="1" stopColor="#e0577f" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="104" r="96" fill="rgba(0,0,0,0.15)" />
      <circle cx="100" cy="100" r="96" fill="url(#clk-rim)" />
      <circle cx="100" cy="100" r="84" fill="url(#clk-face)" />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i * 6 * Math.PI) / 180;
        const big = i % 5 === 0;
        return <line key={i} x1={100 + (big ? 72 : 76) * Math.sin(a)} y1={100 - (big ? 72 : 76) * Math.cos(a)} x2={100 + 80 * Math.sin(a)} y2={100 - 80 * Math.cos(a)} stroke={big ? '#173a66' : '#b8c3d6'} strokeWidth={big ? 2.6 : 1.2} strokeLinecap="round" />;
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const h = i + 1;
        const a = (h * 30 * Math.PI) / 180;
        return (
          <text key={h} x={100 + 58 * Math.sin(a)} y={100 - 58 * Math.cos(a) + 7} textAnchor="middle" className="clk-num">
            {h}
          </text>
        );
      })}
      {ghost !== null && hand(ghost, 'clk-ghost')}
      {hand(time, 'clk-hands')}
      <circle cx="100" cy="100" r="7" fill="#173a66" />
      <circle cx="100" cy="100" r="3" fill="#ffd23f" />
    </svg>
  );
}

function Cuckoo() {
  return (
    <svg viewBox="0 0 80 60" width="90" height="68" className="cuckoo" aria-hidden="true">
      <ellipse cx="38" cy="36" rx="22" ry="17" fill="#ffb000" />
      <circle cx="56" cy="24" r="12" fill="#ffc72c" />
      <circle cx="60" cy="21" r="3" fill="#173a66" />
      <circle cx="61" cy="20" r="1" fill="#fff" />
      <path d="M67 25l11 3-11 4z" fill="#ff6b35" />
      <path d="M22 32q-12 -4 -18 6q10 0 18 2z" fill="#e08a00" />
      <ellipse cx="34" cy="38" rx="10" ry="7" fill="#e08a00" />
    </svg>
  );
}

export function SetClock({ grade, onEnd }) {
  const later = useTimers();
  const [n, setN] = useState(0);
  const [r, setR] = useState(() => clockRound(grade));
  const [time, setTime] = useState(() => r.start ?? 0);
  const [tries, setTries] = useState(0);
  const [note, setNote] = useState(null);
  const [right, setRight] = useState(false);
  const [demo, setDemo] = useState(false);
  const [score, setScore] = useState(0);
  const [party, setParty] = useState(null);
  const [wrongPick, setWrongPick] = useState(null);
  const L = r.L;

  useEffect(() => {
    speak(r.text);
    setTime(r.start ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r]);

  function win() {
    playCorrectChime();
    const pts = tries === 0 ? 3 : tries === 1 ? 2 : 1;
    const total = score + pts;
    setScore(total);
    setRight(true);
    setNote(`Yes! It's ${clockText(r.target)}. +${pts} stars`);
    speak(`Yes! ${clockSay(r.target)}!`);
    later(() => {
      if (n + 1 >= ROUNDS) {
        playStickerStick();
        setParty({ total });
        speak('Cuckoo! Cuckoo! You set every clock!');
      } else {
        setN(n + 1);
        setR(clockRound(grade));
        setTries(0);
        setNote(null);
        setRight(false);
        setWrongPick(null);
      }
    }, 1600);
  }

  // Pip turns the hands to the time, a bit at a time.
  function showHow() {
    setDemo(true);
    setNote('Watch Pip set it!');
    speak(`Watch me! ${clockSay(r.target)}.`);
    const from = time;
    let to = r.target;
    if (to < from) to += 720;
    const steps = 24;
    for (let i = 1; i <= steps; i++) later(() => setTime(Math.round(from + ((to - from) * i) / steps) % 720), 45 * i);
    later(() => {
      setTime(r.target);
      setDemo(false);
      setNote('Now you tap “Check!”');
    }, 45 * steps + 300);
  }

  function miss(t) {
    playIncorrectBuzz();
    setTries(t);
    if (t === 1) {
      const line = L.mode === 'pick' ? `That clock says ${clockSay(wrongPick ?? 0)}. Try again!` : `Your clock says ${clockSay(time)}. We want ${clockSay(r.target)}.`;
      setNote(L.mode === 'pick' ? 'Not that one. Look at the short hand!' : `Your clock says ${clockText(time)}.`);
      speak(line);
    } else if (t === 2) {
      setNote('Tip: match the see-through hands!');
      speak('Here is a tip! Move the hands to the see-through hands.');
    } else if (L.mode !== 'pick') {
      later(showHow, 900);
    }
  }

  function check() {
    if (right || demo) return;
    if (time === r.target) win();
    else miss(tries + 1);
  }
  function pickClock(t) {
    if (right) return;
    if (t === r.target) win();
    else {
      setWrongPick(t);
      playIncorrectBuzz();
      const nt = tries + 1;
      setTries(nt);
      setNote(nt >= 2 ? 'Tip: the glowing clock!' : 'Not that one. Look at the short hand!');
      speak(nt >= 2 ? `Here is a tip! Tap the glowing clock. It says ${clockSay(r.target)}.` : `That clock says ${clockSay(t)}. Find ${clockSay(r.target)}!`);
    }
  }

  const sky = SKIES[skyFor(r.ev)];
  return (
    <div className="game game-clock">
      <RoundBar at={n + 1} of={ROUNDS} word="Clock" score={score} label="stars" />
      <div className="clock-scene" style={{ background: `linear-gradient(${sky[0]}, ${sky[1]})` }}>
        <span className="clock-stars" aria-hidden="true">
          {Array.from({ length: ROUNDS }, (_, i) => (
            <span key={i} className={`clock-star${i < n + (right ? 1 : 0) ? ' clock-star-on' : ''}`}>
              ★
            </span>
          ))}
        </span>
        <button type="button" className="clock-story" onClick={() => speak(r.text)}>
          <span className="clock-story-icon">
            <Thing id={r.ev.icon} size={44} />
          </span>
          <span className="clock-story-text">
            {L.mode === 'elapsed' ? (
              <>
                <strong>{r.text.split(' starts')[0]}</strong>
                <small>{r.short}. When does it end?</small>
              </>
            ) : (
              <>
                <strong>{L.mode === 'pick' ? clockSay(r.target) : clockText(r.target)}</strong>
                <small>Pip {r.ev.what}</small>
              </>
            )}
          </span>
        </button>
        {L.mode === 'pick' ? (
          <div className="clock-picks">
            {r.opts.map((t) => (
              <button
                key={t}
                type="button"
                className={`clock-pick${right && t === r.target ? ' clock-pick-right' : ''}${wrongPick === t ? ' clock-pick-wrong' : ''}`}
                onClick={() => pickClock(t)}
                aria-label={clockSay(t)}
              >
                <BigClock time={t} size={104} glow={tries >= 2 && t === r.target} />
              </button>
            ))}
          </div>
        ) : (
          <div className={`clock-main${right ? ' clock-main-right' : ''}`}>
            <BigClock time={time} onSet={right || demo ? null : setTime} step={L.step} hourOnly={L.hourOnly} ghost={tries >= 2 && !right ? r.target : null} />
            {!right && tries === 0 && <span className="clock-hint">{L.hourOnly ? 'Drag the short hand' : 'Drag the hands'}</span>}
          </div>
        )}
      </div>
      {note && (
        <p className={`bakery-note${right ? ' bakery-note-good' : ''}${tries >= 2 && !right ? ' bakery-note-pip' : ''}`}>
          {tries >= 2 && !right && <Pip size={34} mood="wave" />}
          <span>{note}</span>
        </p>
      )}
      {L.mode !== 'pick' && (
        <button type="button" className={`bake-serve clock-check${tries >= 3 && !demo && !right && time === r.target ? ' bake-serve-pulse' : ''}`} disabled={right || demo} onClick={check}>
          Check!
        </button>
      )}
      {party && (
        <Finale title="Cuckoo! Cuckoo!" line="You set every clock!" button="Yay! →" onDone={() => onEnd(party.total)}>
          <span className="cuckoo-show">
            <Cuckoo />
            <BigClock time={r.target} size={150} />
          </span>
        </Finale>
      )}
    </div>
  );
}
