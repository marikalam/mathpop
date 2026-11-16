import { useEffect, useState } from 'react';
import { playCorrectChime, playIncorrectBuzz, playStickerPick, playStickerStick, speak } from './sound.js';
import { gameFact, nearMisses } from './ops.js';
import ThinkCard from './ThinkCard.jsx';

// Math Island: sail from island to island by answering questions (from
// the grade, and the +− / ×÷ and how-hard choices), collecting shells.
// A miss opens the think card with a hint, then the same question again.
// Shells build up each player's own island: buying a palm tree for 3 when
// you have 10 leaves 10 − 3 = 7, said out loud. The island is kept on this
// device for each player.

const SAVE_KEY = 'mathpop-island-v1';
function readAll() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY)) || {};
  } catch {
    return {};
  }
}
function loadIsland(playerId) {
  return readAll()[playerId] || { shells: 0, items: [] };
}
function saveIsland(playerId, island) {
  const all = readAll();
  all[playerId] = island;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(all));
  } catch {
    /* private mode */
  }
}

const STOPS = 8;
// The sea map: where each island is (in a 360 × 330 picture).
const MAP = [
  [60, 290],
  [170, 280],
  [290, 255],
  [250, 185],
  [120, 175],
  [60, 105],
  [180, 70],
  [300, 45],
];

// Things to build, drawn on the home island.
const SHOP = [
  { id: 'flag', box: '166 82 40 54', name: 'Flag', cost: 2 },
  { id: 'palm', box: '70 80 70 80', name: 'Palm tree', cost: 3 },
  { id: 'turtle', box: '226 164 46 34', name: 'Turtle friend', cost: 4 },
  { id: 'fire', box: '190 128 36 48', name: 'Campfire', cost: 4 },
  { id: 'hut', box: '116 94 72 62', name: 'Hut', cost: 6 },
  { id: 'dock', box: '280 142 66 34', name: 'Dock', cost: 6 },
  { id: 'garden', box: '58 132 62 46', name: 'Garden', cost: 8 },
  { id: 'boat', box: '292 176 56 56', name: 'Sailboat', cost: 9 },
  { id: 'palm2', box: '236 52 104 102', name: 'Big palm', cost: 10 },
  { id: 'light', box: '28 42 46 84', name: 'Lighthouse', cost: 12 },
  { id: 'tree', box: '178 28 76 106', name: 'Treehouse', cost: 15 },
  { id: 'castle', box: '132 154 74 50', name: 'Sand castle', cost: 20 },
];

function Item({ id }) {
  switch (id) {
    case 'flag':
      return (
        <g transform="translate(176 92)">
          <path d="M0 0 v38" stroke="#5b3a29" strokeWidth="3" />
          <path d="M1 1 h22 l-6 7 l6 7 h-22z" fill="#e5484d" />
        </g>
      );
    case 'palm':
    case 'palm2': {
      const big = id === 'palm2';
      return (
        <g transform={big ? 'translate(262 70) scale(1.3)' : 'translate(92 98)'}>
          <path d="M14 60 q-4 -30 2 -50" stroke="#8b5a2b" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M16 10 q-18 -8 -28 6 q14 -4 28 -6z M16 10 q18 -10 30 4 q-16 -4 -30 -4z M16 10 q-6 -16 -22 -16 q14 6 22 16z M16 10 q8 -16 24 -14 q-16 4 -24 14z" fill="#2fae6b" />
          <circle cx="13" cy="14" r="3" fill="#7c4a1e" />
          <circle cx="19" cy="14" r="3" fill="#7c4a1e" />
        </g>
      );
    }
    case 'turtle':
      return (
        <g transform="translate(232 178)">
          <ellipse cx="14" cy="10" rx="14" ry="9" fill="#2f855a" />
          <path d="M6 8 l8 -5 l8 5 l-8 6z" fill="#48bb78" />
          <circle cx="30" cy="10" r="5" fill="#68d391" />
          <circle cx="32" cy="9" r="1.2" fill="#173a66" />
        </g>
      );
    case 'fire':
      return (
        <g transform="translate(196 150)">
          <path d="M0 22 l24 -6 M0 16 l24 6" stroke="#8b5a2b" strokeWidth="4" strokeLinecap="round" />
          <path d="M12 18 q-10 -10 0 -22 q2 8 6 10 q4 6 -6 12z" fill="#ff8a3d" />
          <path d="M12 18 q-4 -6 0 -12 q4 6 0 12z" fill="#ffd23f" />
        </g>
      );
    case 'hut':
      return (
        <g transform="translate(126 106)">
          <rect x="4" y="22" width="44" height="30" fill="#d9a066" />
          <path d="M-4 24 L26 0 L56 24z" fill="#a16207" />
          <rect x="20" y="34" width="12" height="18" rx="2" fill="#5b3a29" />
        </g>
      );
    case 'dock':
      return (
        <g transform="translate(286 150)">
          <rect x="0" y="0" width="56" height="12" fill="#a16207" />
          {[6, 22, 38, 52].map((x) => (
            <rect key={x} x={x} y="10" width="4" height="12" fill="#5b3a29" />
          ))}
        </g>
      );
    case 'garden':
      return (
        <g transform="translate(64 150)">
          <rect x="0" y="6" width="50" height="18" rx="6" fill="#8b5a2b" />
          {[8, 20, 32, 44].map((x, i) => (
            <g key={x}>
              <path d={`M${x} 8 v-8`} stroke="#2fae6b" strokeWidth="2" />
              <circle cx={x} cy="-2" r="4" fill={['#ff6b9a', '#ffd23f', '#9b6bf2', '#ff8a3d'][i]} />
            </g>
          ))}
        </g>
      );
    case 'boat':
      return (
        <g transform="translate(300 196)">
          <path d="M0 16 h44 l-8 10 h-28z" fill="#e5484d" />
          <path d="M22 16 v-30" stroke="#5b3a29" strokeWidth="2" />
          <path d="M24 -12 l16 24 h-16z" fill="#fff" />
        </g>
      );
    case 'light':
      return (
        <g transform="translate(36 52)">
          <path d="M6 70 l4 -54 h12 l4 54z" fill="#fff" />
          <path d="M8 46 h16 M7 58 h18 M9 32 h14" stroke="#e5484d" strokeWidth="6" />
          <rect x="8" y="6" width="16" height="12" fill="#ffd23f" />
          <path d="M6 6 L16 -4 L26 6z" fill="#e5484d" />
        </g>
      );
    case 'tree':
      return (
        <g transform="translate(206 56)">
          <rect x="18" y="30" width="10" height="44" fill="#8b5a2b" />
          <circle cx="23" cy="24" r="24" fill="#2fae6b" />
          <rect x="10" y="22" width="26" height="18" fill="#d9a066" />
          <path d="M6 24 L23 10 L40 24z" fill="#a16207" />
        </g>
      );
    case 'castle':
      return (
        <g transform="translate(142 168)">
          <rect x="0" y="10" width="50" height="22" fill="#f6d28b" />
          <rect x="-4" y="0" width="14" height="32" fill="#f1c36a" />
          <rect x="40" y="0" width="14" height="32" fill="#f1c36a" />
          <path d="M-4 0 h4 v-4 h6 v4 h4 M40 0 h4 v-4 h6 v4 h4" stroke="#f1c36a" strokeWidth="2" fill="none" />
          <rect x="20" y="20" width="10" height="12" rx="5" fill="#a16207" />
        </g>
      );
    default:
      return null;
  }
}

function HomeIsland({ items, fresh }) {
  return (
    <svg className="mi-home" viewBox="0 0 360 240" role="img" aria-label="Your island">
      <rect width="360" height="240" fill="#4fc3f7" />
      <path d="M0 40 q20 -6 40 0 t40 0 M220 30 q20 -6 40 0 t40 0 M140 220 q20 -6 40 0 t40 0" stroke="rgba(255,255,255,0.6)" strokeWidth="3" fill="none" />
      <ellipse cx="180" cy="160" rx="160" ry="66" fill="#f6e1a7" />
      <ellipse cx="176" cy="148" rx="128" ry="48" fill="#7ccf6a" />
      {SHOP.filter((s) => items.includes(s.id)).map((s) => (
        <g key={s.id} className={fresh === s.id ? 'mi-pop' : undefined}>
          <Item id={s.id} />
        </g>
      ))}
    </svg>
  );
}

function makeQuestion(grade, stop) {
  const f = gameFact(grade);
  // Every third stop (K to 2nd), a number bond: 6 + ? = 13.
  const m = String(f.text).match(/^(\d+) \+ (\d+)$/);
  if (m && stop % 3 === 2 && ['k', '1', '2'].includes(grade)) return { text: `${m[1]} + ? = ${f.answer}`, answer: +m[2] };
  return f;
}
function choicesFor(q) {
  const list = [q.answer, ...nearMisses(q.answer, 3)];
  return list.sort(() => Math.random() - 0.5);
}
const sayQ = (q) => (/^●+$/.test(q.text) ? 'How many dots?' : q.text.includes('?') ? q.text.replace('?', 'what') : `${q.text} equals what?`);

function Shell({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M12 3 C4 6 2 14 4 20 h16 c2 -6 0 -14 -8 -17z" fill="#ffb4a2" stroke="#e5737a" strokeWidth="1.5" />
      <path d="M12 4 v16 M8 6 l-2 14 M16 6 l2 14" stroke="#e5737a" strokeWidth="1.2" />
    </svg>
  );
}

export default function MathIsland({ grade, onEnd, playerId = 'guest' }) {
  const [island, setIsland] = useState(() => loadIsland(playerId));
  const [view, setView] = useState('home');
  const [stop, setStop] = useState(0);
  const [q, setQ] = useState(null);
  const [choices, setChoices] = useState([]);
  const [missed, setMissed] = useState(false);
  const [think, setThink] = useState(false);
  const [wrong, setWrong] = useState(null);
  const [earned, setEarned] = useState(0);
  const [note, setNote] = useState(null);
  const [fresh, setFresh] = useState(null);
  const [sailing, setSailing] = useState(false);

  useEffect(() => {
    speak(island.items.length ? 'Welcome back to your island! Sail to collect shells, then build.' : 'This is your island! Sail to collect shells, then build things on it.');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function update(next) {
    setIsland(next);
    saveIsland(playerId, next);
  }
  function ask(s) {
    const nq = makeQuestion(grade, s);
    setQ(nq);
    setChoices(choicesFor(nq));
    setMissed(false);
    setWrong(null);
    speak(sayQ(nq));
  }
  function sail() {
    playStickerPick();
    setView('sea');
    setStop(0);
    setEarned(0);
    ask(0);
  }
  function answer(n) {
    if (sailing || think) return;
    if (n !== q.answer) {
      playIncorrectBuzz();
      setWrong(n);
      setMissed(true);
      setThink(true);
      return;
    }
    playCorrectChime();
    const gain = missed ? 1 : 2;
    const last = stop + 1 >= STOPS;
    const total = earned + gain + (last ? 5 : 0);
    setEarned(total);
    update({ ...island, shells: island.shells + gain + (last ? 5 : 0) });
    setSailing(true);
    speak(last ? `Treasure! You found 5 more shells. ${total} shells this trip!` : `Yes! ${gain} ${gain === 1 ? 'shell' : 'shells'}. Sail on!`);
    setTimeout(() => {
      setSailing(false);
      if (last) {
        playStickerStick();
        setStop(STOPS);
        setTimeout(() => {
          setView('home');
          setQ(null);
        }, 1600);
        return;
      }
      setStop(stop + 1);
      ask(stop + 1);
    }, 1100);
  }
  function buy(item) {
    if (island.items.includes(item.id)) return;
    if (island.shells < item.cost) {
      const need = item.cost - island.shells;
      const line = `The ${item.name.toLowerCase()} costs ${item.cost}. You have ${island.shells}. You need ${need} more ${need === 1 ? 'shell' : 'shells'}: ${island.shells} + ${need} = ${item.cost}.`;
      setNote(line);
      speak(line);
      return;
    }
    playStickerStick();
    const left = island.shells - item.cost;
    update({ shells: left, items: [...island.items, item.id] });
    setFresh(item.id);
    const line = `${island.shells} − ${item.cost} = ${left}. You built a ${item.name.toLowerCase()}! ${left} ${left === 1 ? 'shell' : 'shells'} left.`;
    setNote(line);
    speak(line);
  }

  const boat = MAP[Math.min(stop, STOPS - 1)];
  if (view === 'sea') {
    return (
      <div className="game game-pz mi-game">
        <div className="mm-top pz-top">
          <span className="pz-level">
            Island {Math.min(stop + 1, STOPS)} of {STOPS}
          </span>
          <span className="mm-right mi-count">
            <Shell /> {earned}
          </span>
        </div>
        <svg className="mi-sea" viewBox="0 0 360 330" role="img" aria-label={`Sea map: island ${stop + 1} of ${STOPS}`}>
          <rect width="360" height="330" rx="18" fill="#38bdf8" />
          <path d={`M${MAP.map((p) => p.join(' ')).join(' L')}`} stroke="#fff" strokeWidth="3" strokeDasharray="6 8" fill="none" opacity="0.8" />
          {MAP.map(([x, y], i) => (
            <g key={i}>
              <ellipse cx={x} cy={y + 4} rx="30" ry="14" fill="#f6e1a7" />
              <ellipse cx={x} cy={y} rx="20" ry="9" fill={i === STOPS - 1 ? '#facc15' : '#7ccf6a'} />
              {i === STOPS - 1 && <rect x={x - 9} y={y - 14} width="18" height="12" rx="2" fill="#a16207" stroke="#5b3a29" strokeWidth="2" />}
              {i < stop && <path d={`M${x + 8} ${y - 2} v-18 l12 5 l-12 5`} fill="#e5484d" stroke="#5b3a29" strokeWidth="2" />}
            </g>
          ))}
          <g className="mi-boat" style={{ transform: `translate(${boat[0] - 18}px, ${boat[1] - 34}px)` }}>
            <path d="M0 20 h36 l-7 9 h-22z" fill="#e5484d" />
            <path d="M18 20 v-24" stroke="#5b3a29" strokeWidth="2" />
            <path d="M20 -2 l13 19 h-13z" fill="#fff" />
          </g>
        </svg>
        {q && stop < STOPS && (
          <>
            <button type="button" className="mi-q" data-answer={q.answer} onClick={() => speak(sayQ(q))}>
              {/^●+$/.test(q.text) ? <span className="mi-dots">{q.text}</span> : q.text.includes('?') ? q.text : `${q.text} = ?`}
            </button>
            <div className="mi-choices">
              {choices.map((n) => (
                <button key={n} type="button" className={`mi-choice${wrong === n ? ' mi-wrong' : ''}`} disabled={wrong === n || sailing} onClick={() => answer(n)}>
                  {n}
                </button>
              ))}
            </div>
          </>
        )}
        {stop >= STOPS && <p className="mi-q">Treasure! +5 shells</p>}
        {think && <ThinkCard text={q.text} title="Let's think together" start={1} onReady={() => setThink(false)} />}
      </div>
    );
  }

  return (
    <div className="game game-pz mi-game">
      <div className="mm-top pz-top">
        <span className="pz-level">My island</span>
        <span className="mm-right mi-count">
          <Shell /> {island.shells}
        </span>
      </div>
      <HomeIsland items={island.items} fresh={fresh} />
      {note && (
        <button type="button" className="mi-note" onClick={() => speak(note)}>
          {note}
        </button>
      )}
      <button type="button" className="mi-sail" onClick={sail}>
        Sail for shells
      </button>
      <p className="mi-shop-title">Build on your island</p>
      <div className="mi-shop">
        {SHOP.map((s) => {
          const own = island.items.includes(s.id);
          return (
            <button key={s.id} type="button" className={`mi-buy${own ? ' mi-own' : ''}${!own && island.shells < s.cost ? ' mi-short' : ''}`} disabled={own} onClick={() => buy(s)}>
              <svg viewBox={s.box} className="mi-thumb" aria-hidden="true">
                <Item id={s.id} />
              </svg>
              <b>{s.name}</b>
              <span>{own ? 'Built' : (
                <>
                  <Shell size={16} /> {s.cost}
                </>
              )}</span>
            </button>
          );
        })}
      </div>
      <button type="button" className="bakery-btn" onClick={() => onEnd(earned)}>
        Done for now
      </button>
    </div>
  );
}
