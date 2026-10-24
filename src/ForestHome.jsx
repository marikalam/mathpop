import { useState } from 'react';
import { gradeTier } from './grades.js';
import { playStickerPick, speak } from './sound.js';

// The forest look's home page (look.js): a drawn woodland where each spot
// is one of the grade's sections - pinecones on a log for Numbers, a stick
// den for + −, a tree stump for Fractions, a mud kitchen for Measure, and
// so on - and the stepping stones are Explore Numbers. A spot the grade
// doesn't have is just more trees.

const INK = '#3a3428';
const BARK = '#8b5e3c';
const WOOD = '#e2c79a';
const PINE = '#4f7a52';
const DEEP = '#35593f';
const MOSS = '#8fae6b';
const OCHRE = '#e0a83e';
const CLAY = '#c8643f';
const STONE = '#d4d0c4';
const STONE_DARK = '#b9b4a6';

// Where each section sits on the map (a 3 x 3 grid). Add & subtract and
// decimals share a spot: no grade has both.
const SPOTS = [
  { ids: ['numbers'], x: 62, y: 75 },
  { ids: ['addsub', 'decimals'], x: 180, y: 75 },
  { ids: ['muldiv'], x: 298, y: 75 },
  { ids: ['fractions'], x: 62, y: 222 },
  { ids: ['measure'], x: 180, y: 222 },
  { ids: ['shapes'], x: 298, y: 222 },
  { ids: ['data'], x: 62, y: 369 },
  { ids: ['puzzles'], x: 180, y: 369 },
  { ids: ['explore'], x: 298, y: 369 },
];

// Short names that fit on a little wooden sign.
const SIGNS = {
  numbers: 'Numbers',
  addsub: '+  −',
  decimals: 'Decimals',
  muldiv: '×  ÷',
  fractions: 'Fractions',
  measure: 'Measure',
  shapes: 'Shapes',
  data: 'Graphs',
  puzzles: 'Puzzles',
  explore: 'Explore',
};

function Pinecone({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse rx="9" ry="12" fill="#a0683e" />
      <path d="M-6-4l6 4 6-4M-7 3l7 4 7-4M-4 9l4 2 4-2" fill="none" strokeWidth="1.8" />
    </g>
  );
}

function Acorn({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cy="3" rx="6" ry="7.5" fill="#b5793f" />
      <path d="M-7-1q7-9 14 0z" fill="#6b4a2e" />
    </g>
  );
}

function Pine({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0-30l17 26H-17z" fill={PINE} />
      <path d="M0-16l21 28H-21z" fill={DEEP} />
      <path d="M0 12v9" fill="none" strokeWidth="3.5" />
    </g>
  );
}

function Bush({ x, y, r = 18 }) {
  return (
    <g>
      <path d={`M${x} ${y + r - 4}v14`} fill="none" strokeWidth="3.5" />
      <circle cx={x} cy={y} r={r} fill={MOSS} />
    </g>
  );
}

// Something on the map to tap just for fun: it wiggles (or hops) and
// makes a little sound; an animal also says what it is.
function Toy({ x, y, hop, say, children }) {
  const [n, setN] = useState(0);
  return (
    <g
      transform={`translate(${x} ${y})`}
      className="forest-toy"
      onClick={() => {
        setN((k) => k + 1);
        playStickerPick();
        if (say) setTimeout(() => speak(say), 150);
      }}
    >
      <g key={n} className={n ? (hop ? 'forest-toy-hop' : 'forest-toy-wiggle') : undefined}>
        {children}
      </g>
    </g>
  );
}

// Each spot's drawing, centred on (0, 0) in a box about 110 wide.
const DRAWINGS = {
  numbers: (
    <g>
      <rect x="-46" y="-4" width="84" height="28" rx="14" fill={BARK} />
      <ellipse cx="36" cy="10" rx="9" ry="14" fill={WOOD} />
      <ellipse cx="36" cy="10" rx="4" ry="7" fill="none" strokeWidth="1.8" />
      <path d="M-30 6h30M-18 16h34" fill="none" strokeWidth="1.8" />
      <Pinecone x={-24} y={-14} />
      <Pinecone x={-2} y={-16} />
      <Pinecone x={20} y={-14} />
      <path d="M-50-14v28" fill="none" strokeWidth="4" />
      <rect x="-60" y="-40" width="22" height="24" rx="4" fill={WOOD} />
      <text x="-49" y="-22" className="forest-map-digit">3</text>
    </g>
  ),
  addsub: (
    <g>
      <path d="M0-46L-38 22H38z" fill="#d9b98a" />
      <path d="M0-8L-12 22H12z" fill="#5a4030" />
      <path d="M0-46L-38 22M0-46L-18 23M0-46V22M0-46L18 23M0-46L38 22M-8-56L0-46 8-56" fill="none" stroke={BARK} strokeWidth="4" />
      <path d="M0-46L-38 22H38z" fill="none" />
      <path d="M42-6v26M48-6v26M54-6v26M-54 2v18M-48 2v18" fill="none" stroke={BARK} strokeWidth="4" />
    </g>
  ),
  decimals: (
    <g>
      {[[-30, 12], [-10, 12], [10, 12], [30, 12], [-20, -6], [0, -6], [20, -6], [-10, -24], [10, -24], [0, -42]].map(([x, y]) => (
        <g key={`${x},${y}`}>
          <circle cx={x} cy={y} r="10" fill={WOOD} />
          <circle cx={x} cy={y} r="4.5" fill="none" stroke="#b08a5a" strokeWidth="1.8" />
        </g>
      ))}
    </g>
  ),
  muldiv: (
    <g>
      <rect x="-46" y="-40" width="92" height="66" rx="14" fill="#c5d6a0" />
      {[-24, -4, 14].map((y) => [-30, -10, 10, 30].map((x) => <Acorn key={`${x},${y}`} x={x} y={y} />))}
    </g>
  ),
  fractions: (
    <g>
      <path d="M-42-6v24a42 16 0 0 0 84 0v-24z" fill={BARK} />
      <ellipse cx="0" cy="-6" rx="42" ry="30" fill={WOOD} />
      <path d="M0-6V-36A42 30 0 0 1 42-6z" fill={OCHRE} />
      <ellipse cx="0" cy="-6" rx="26" ry="18" fill="none" stroke="#b08a5a" strokeWidth="1.8" />
      <ellipse cx="0" cy="-6" rx="12" ry="8" fill="none" stroke="#b08a5a" strokeWidth="1.8" />
      <path d="M0-36v60M-42-6h84" fill="none" strokeWidth="2.5" />
      <ellipse cx="0" cy="-6" rx="42" ry="30" fill="none" />
    </g>
  ),
  measure: (
    <g>
      <path d="M-40-6v38M40-6v38" fill="none" stroke={BARK} strokeWidth="7" />
      <rect x="-50" y="-2" width="100" height="14" rx="4" fill="#c9a272" />
      <rect x="-44" y="20" width="88" height="10" rx="3" fill="#c9a272" />
      <path d="M-42-30h26l-4 28h-18z" fill={CLAY} />
      <rect x="-8" y="-34" width="22" height="32" rx="5" fill={STONE_DARK} />
      <path d="M14-26c9 0 9 14 0 14" fill="none" />
      <rect x="24" y="-50" width="12" height="48" rx="2" fill={OCHRE} />
      <path d="M24-40h5M24-30h4M24-20h5M24-10h4" fill="none" strokeWidth="1.6" />
    </g>
  ),
  shapes: (
    <g>
      <circle cx="0" cy="-8" r="48" fill="#c5d6a0" />
      <path d="M-38 16L-16-28 6 16z" fill="none" stroke="#8a8578" strokeWidth="9" strokeDasharray="0 16.4" />
      <rect x="12" y="-16" width="30" height="30" fill="none" stroke="#8a8578" strokeWidth="9" strokeDasharray="0 15" />
    </g>
  ),
  data: (
    <g>
      <path d="M-50 24H50" fill="none" stroke={BARK} strokeWidth="3.5" />
      {[[-32, 3], [-8, 2], [16, 4], [40, 1]].map(([x, n]) =>
        Array.from({ length: n }, (_, i) => (
          <ellipse key={`${x}-${i}`} cx={x} cy={16 - i * 11} rx={12 - i} ry="6" fill={i % 2 ? STONE : STONE_DARK} />
        ))
      )}
    </g>
  ),
  puzzles: (
    <g>
      <path d="M-14 30C-10 10-10-6-6-20H6C10-6 10 10 14 30z" fill={BARK} />
      <circle cx="-22" cy="-30" r="22" fill={PINE} />
      <circle cx="22" cy="-30" r="22" fill={PINE} />
      <circle cx="0" cy="-44" r="28" fill={DEEP} />
      <ellipse cx="0" cy="10" rx="9" ry="13" fill="#3a2a1e" />
      <circle cx="-4" cy="6" r="3.2" fill={OCHRE} strokeWidth="1" />
      <circle cx="4" cy="6" r="3.2" fill={OCHRE} strokeWidth="1" />
      <path d="M32 6v24" fill="none" stroke={BARK} strokeWidth="3.5" />
      <rect x="22" y="-14" width="20" height="22" rx="4" fill={WOOD} />
      <text x="32" y="2" className="forest-map-digit">?</text>
    </g>
  ),
  explore: (
    <g>
      <path d="M-90 74C-40 30 10 44 90-26" fill="none" stroke={INK} strokeWidth="36" />
      <path d="M-90 74C-40 30 10 44 90-26" fill="none" stroke="#8fc3c9" strokeWidth="31" />
      {[[-40, 36, '1'], [-6, 24, '2'], [28, 6, '3']].map(([x, y, n]) => (
        <g key={n}>
          <ellipse cx={x} cy={y} rx="14" ry="9" fill={STONE} />
          <text x={x} y={y + 4} className="forest-map-stone">{n}</text>
        </g>
      ))}
      <ellipse cx="58" cy="-10" rx="11" ry="8" fill={MOSS} />
      <circle cx="54" cy="-14" r="1.6" fill={INK} stroke="none" />
      <circle cx="62" cy="-14" r="1.6" fill={INK} stroke="none" />
    </g>
  ),
};

function Decor() {
  return (
    <g>
      <Pine x={-20} y={0} />
      <Pine x={18} y={-6} s={0.85} />
      <path d="M-6 20c0-10 16-10 16 0z" fill={CLAY} />
      <path d="M2 20v8" fill="none" />
    </g>
  );
}

function Spot({ id, label, x, y, onOpen }) {
  const open = () => onOpen(id);
  return (
    <g
      className="forest-spot"
      transform={`translate(${x} ${y})`}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
    >
      <rect x="-58" y="-62" width="116" height="132" fill="transparent" stroke="none" />
      <g className="forest-spot-art">{DRAWINGS[id]}</g>
      <g transform="translate(0 50)">
        <rect x="-38" y="-11" width="76" height="22" rx="6" fill={WOOD} />
        <text y={id === 'addsub' || id === 'muldiv' ? 7 : 5} className={`forest-map-sign${id === 'addsub' || id === 'muldiv' ? ' forest-map-sign-sym' : ''}`}>
          {SIGNS[id]}
        </text>
      </g>
    </g>
  );
}

export function ForestMap({ sections, animals = [], onOpenSection, onExplore }) {
  const have = new Map(sections.map((s) => [s.id, s]));
  return (
    <div className="forest-map">
      <svg viewBox="0 0 360 450" preserveAspectRatio="xMidYMid meet" role="group" aria-label="The MathPop forest">
        <g fill="none" strokeLinecap="round">
          <g stroke="#d6c08f" strokeWidth="20">
            <path d="M-10 150C80 162 120 138 180 152S300 164 370 148" />
            <path d="M-10 298C80 310 120 286 180 300S300 312 370 296" />
            <path d="M180 -10C170 50 190 100 180 152C170 200 190 250 180 300C172 350 186 400 180 460" />
          </g>
          <g stroke="#e8d6ab" strokeWidth="14">
            <path d="M-10 150C80 162 120 138 180 152S300 164 370 148" />
            <path d="M-10 298C80 310 120 286 180 300S300 312 370 296" />
            <path d="M180 -10C170 50 190 100 180 152C170 200 190 250 180 300C172 350 186 400 180 460" />
          </g>
        </g>
        <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <Toy x={122} y={20}>
            <Bush x={0} y={0} r={11} />
          </Toy>
          <Toy x={240} y={196}>
            <Bush x={0} y={0} r={10} />
          </Toy>
          <Toy x={120} y={420}>
            <Bush x={0} y={0} r={12} />
          </Toy>
          <Toy x={240} y={52}>
            <Pine x={0} y={0} s={0.6} />
          </Toy>
          <Toy x={120} y={262}>
            <Pine x={0} y={0} s={0.6} />
          </Toy>
          <Toy x={240} y={414}>
            <Pine x={0} y={0} s={0.6} />
          </Toy>
          {SPOTS.map((spot) => {
            const id = spot.ids.find((sid) => sid === 'explore' || have.has(sid));
            if (!id) {
              return (
                <g key={spot.ids[0]} transform={`translate(${spot.x} ${spot.y})`}>
                  <Decor />
                </g>
              );
            }
            const label = id === 'explore' ? 'Explore Numbers' : have.get(id).title;
            return (
              <Spot
                key={id}
                id={id}
                label={label}
                x={spot.x}
                y={spot.y}
                onOpen={(sid) => (sid === 'explore' ? onExplore() : onOpenSection(sid))}
              />
            );
          })}
          {/* The animals that have moved in (forestFriends.js). */}
          {animals.map((a) => (
            <Toy key={a.name} x={a.x} y={a.y} hop say={`A ${a.name}!`}>
              <text className="forest-animal">{a.emoji}</text>
            </Toy>
          ))}
        </g>
      </svg>
    </div>
  );
}

// The forest look's progress through a round: stepping stones, with a
// hedgehog on the current one, to a treasure chest at the end.
export function ForestPath({ current, total }) {
  const gap = 290 / total;
  return (
    <div className="progress-wrap forest-path">
      <svg viewBox="0 0 340 46" role="img" aria-label={`Problem ${current} of ${total}`}>
        <path d="M6 30Q170 22 334 30" fill="none" stroke="#e2cfa3" strokeWidth="8" strokeLinecap="round" />
        <g stroke={INK} strokeWidth="2">
          {Array.from({ length: total }, (_, i) => (
            <ellipse key={i} cx={14 + i * gap} cy="29" rx="11" ry="7" fill={i < current - 1 ? MOSS : i === current - 1 ? OCHRE : STONE} />
          ))}
          <rect x="304" y="16" width="30" height="22" rx="4" fill={BARK} />
          <path d="M304 24q15-14 30 0z" fill={OCHRE} />
          <rect x="316" y="24" width="6" height="7" rx="1" fill={OCHRE} />
        </g>
        <text transform={`translate(${14 + (current - 1) * gap} 22) scale(-1 1)`} className="forest-animal forest-path-walker">
          🦔
        </text>
      </svg>
      <span className="progress-count">
        {current} / {total}
      </span>
    </div>
  );
}

// Forest-school ideas to try outside together, one a day, for the grade.
const OUTSIDE = {
  easy: [
    'Find 10 pinecones. Make two piles. How many ways can you do it?',
    'Count the trees on your walk. Which one is the tallest?',
    'Find a leaf, a stick and a stone. Which is the longest?',
    'Make a triangle and a square out of sticks.',
    'Line up 5 acorns. Count them, then count back down to 1.',
    'Find something round, something pointy and something flat.',
  ],
  medium: [
    'Find 20 small stones. Put them in groups of 2, then 5, then 10.',
    'Measure a log with your feet. How many feet long is it?',
    'Lay sticks in a line from 0 to 10 and hop along it.',
    'Count the petals on 3 flowers, then add them up.',
    'Look for shapes in nature: circles, triangles and spirals.',
    'Make a pattern with leaves and stones: leaf, stone, leaf, stone…',
  ],
  hard: [
    'Make 4 rows of 6 pinecones. How many are there in all?',
    'Share 24 acorns among 3 friends. How many does each get?',
    'Snap a long stick into halves, then quarters.',
    'Draw around your shadow in the morning and again later. What changed?',
    'Collect leaves and make a tally chart of their colors.',
    'Find a tree and guess how many big steps around it. Then check!',
  ],
};

export function OutsideCard({ grade }) {
  const ideas = OUTSIDE[gradeTier(grade)] || OUTSIDE.easy;
  const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  const idea = ideas[day % ideas.length];
  return (
    <button className="forest-outside" onClick={() => speak(idea)}>
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
        <g stroke={INK} strokeWidth="2" strokeLinejoin="round">
          <ellipse cx="17" cy="17" rx="10" ry="14" fill="#a0683e" />
          <path d="M10 12l7 5 7-5M9 20l8 5 8-5" fill="none" />
        </g>
      </svg>
      <span className="forest-outside-text">
        <span className="forest-outside-title">Try it outside</span>
        <span className="forest-outside-sub">{idea}</span>
      </span>
    </button>
  );
}
