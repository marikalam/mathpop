import { DRAWINGS } from './Drawings.jsx';

// The app's little pictures (in place of emoji): flat shapes in a few
// bright colors, drawn on a 48 x 48 grid. <Icon name="star" /> sits in
// line with text, 1.25em across; a name that isn't here but is one of
// the Drawings (an apple, a frog) draws that, and anything else (a
// "+" sign) shows as text.

const R = '#f25c54';
const O = '#ff9f43';
const Y = '#ffd23f';
const G = '#2fbf71';
const B = '#3b8cf0';
const P = '#9b6bf2';
const K = '#ff8fb1';
const N = '#c98f5c';
const D = '#2b2d42';
const W = '#fff';
const L = '#e3e8f2';

const ICONS = {
  fire: (
    <>
      <path d="M24 4c3 8 13 13 13 25a13 13 0 0 1-26 0c0-6 3-10 6-13 0 4 2 7 4 7-1-8 0-14 3-19z" fill={O} />
      <path d="M24 24c2 4 7 6 7 12a7 7 0 0 1-14 0c0-4 3-6 4-9 1 2 2 3 3 3z" fill={Y} />
    </>
  ),
  check: (
    <>
      <circle cx="24" cy="24" r="20" fill={G} />
      <path d="M14 25l7 7 13-15" stroke={W} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  target: (
    <>
      <circle cx="22" cy="26" r="18" fill={R} />
      <circle cx="22" cy="26" r="12" fill={W} />
      <circle cx="22" cy="26" r="6" fill={R} />
      <path d="M22 26 40 8" stroke={D} strokeWidth="3" strokeLinecap="round" />
      <path d="M36 6l6 0-0 6z" fill={Y} />
    </>
  ),
  star: <path d="M24 4l6 13 14 1.5-10.5 9.5 3 14L24 35l-12.5 7 3-14L4 18.5 18 17z" fill={Y} stroke="#f0b400" strokeWidth="2" strokeLinejoin="round" />,
  sparkle: (
    <>
      <path d="M20 4c2 10 6 14 16 16-10 2-14 6-16 16-2-10-6-14-16-16 10-2 14-6 16-16z" fill={Y} />
      <path d="M38 28c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8z" fill={K} />
    </>
  ),
  book: (
    <>
      <rect x="8" y="5" width="32" height="38" rx="5" fill={B} />
      <rect x="8" y="5" width="7" height="38" rx="3" fill="#2a6fd0" />
      <rect x="20" y="13" width="14" height="8" rx="3" fill={W} />
      <path d="M28 27l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z" fill={Y} />
    </>
  ),
  gift: (
    <>
      <rect x="6" y="18" width="36" height="24" rx="4" fill={R} />
      <rect x="4" y="13" width="40" height="9" rx="3" fill="#ff7a72" />
      <rect x="21" y="13" width="6" height="29" fill={Y} />
      <path d="M24 13c-4-8-12-8-12-3s8 3 12 3zM24 13c4-8 12-8 12-3s-8 3-12 3z" fill={Y} />
    </>
  ),
  dice: (
    <>
      <rect x="6" y="6" width="36" height="36" rx="9" fill={W} stroke={D} strokeWidth="3" />
      {[
        [16, 16],
        [32, 16],
        [24, 24],
        [16, 32],
        [32, 32],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="3.5" fill={R} />
      ))}
    </>
  ),
  chart: (
    <>
      <rect x="7" y="24" width="9" height="17" rx="2.5" fill={B} />
      <rect x="20" y="14" width="9" height="27" rx="2.5" fill={G} />
      <rect x="33" y="6" width="9" height="35" rx="2.5" fill={O} />
      <path d="M4 42h40" stroke={D} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  growth: (
    <>
      <rect x="6" y="6" width="36" height="36" rx="7" fill={W} stroke={L} strokeWidth="2" />
      <path d="M11 34l9-9 6 5 11-13" stroke={G} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M31 15h7v7" stroke={G} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  printer: (
    <>
      <rect x="13" y="5" width="22" height="13" rx="2" fill={W} stroke={D} strokeWidth="2.5" />
      <rect x="5" y="16" width="38" height="18" rx="5" fill={B} />
      <rect x="13" y="28" width="22" height="15" rx="2" fill={W} stroke={D} strokeWidth="2.5" />
      <circle cx="37" cy="22" r="2" fill={Y} />
    </>
  ),
  zoom: (
    <>
      <path d="M30 30l12 12" stroke={N} strokeWidth="7" strokeLinecap="round" />
      <circle cx="20" cy="20" r="15" fill="#bfe3ff" stroke={B} strokeWidth="5" />
      <path d="M13 16a8 8 0 0 1 6-6" stroke={W} strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  bulb: (
    <>
      <path d="M24 4a14 14 0 0 1 8 25.5V34H16v-4.5A14 14 0 0 1 24 4z" fill={Y} />
      <rect x="16" y="35" width="16" height="5" rx="2" fill={L} stroke="#aab4c8" strokeWidth="1.5" />
      <rect x="19" y="40" width="10" height="4" rx="2" fill="#aab4c8" />
      <path d="M18 17a7 7 0 0 1 5-6" stroke={W} strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  hand: (
    <>
      {[12, 19, 26, 33].map((x, i) => (
        <rect key={x} x={x} y={[12, 6, 7, 12][i]} width="7" height="26" rx="3.5" fill="#ffc98b" />
      ))}
      <path d="M11 26h28v6a12 12 0 0 1-12 12h-4a12 12 0 0 1-12-12z" fill="#ffc98b" />
      <rect x="4" y="22" width="13" height="7" rx="3.5" transform="rotate(35 10 25)" fill="#ffc98b" />
    </>
  ),
  party: (
    <>
      <path d="M6 42l9-27 18 18z" fill={P} />
      <path d="M10 30l5 5M12 23l11 11" stroke={Y} strokeWidth="3" strokeLinecap="round" />
      <circle cx="30" cy="9" r="3" fill={R} />
      <circle cx="40" cy="18" r="3" fill={B} />
      <rect x="36" y="4" width="5" height="5" rx="1" transform="rotate(20 38 6)" fill={Y} />
      <rect x="40" y="28" width="5" height="5" rx="1" transform="rotate(-20 42 30)" fill={G} />
      <path d="M22 14c2-4 6-4 6-8" stroke={K} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  family: (
    <>
      <circle cx="13" cy="13" r="7" fill="#ffc98b" />
      <circle cx="35" cy="13" r="7" fill="#ffc98b" />
      <circle cx="24" cy="25" r="5.5" fill="#ffc98b" />
      <path d="M3 44c0-12 4-20 10-20s10 8 10 20z" fill={B} />
      <path d="M25 44c0-12 4-20 10-20s10 8 10 20z" fill={K} />
      <path d="M16 44c0-8 3-12 8-12s8 4 8 12z" fill={Y} />
    </>
  ),
  heart: <path d="M24 42S5 30 5 17a9.5 9.5 0 0 1 19-3 9.5 9.5 0 0 1 19 3c0 13-19 25-19 25z" fill={Y} stroke="#f0b400" strokeWidth="2" />,
  phone: (
    <>
      <rect x="12" y="3" width="24" height="42" rx="6" fill={D} />
      <rect x="15" y="9" width="18" height="28" rx="2" fill="#bfe3ff" />
      <circle cx="24" cy="41" r="2" fill={W} />
    </>
  ),
  lock: (
    <>
      <path d="M15 22v-6a9 9 0 0 1 18 0v6" stroke="#aab4c8" strokeWidth="5" fill="none" />
      <rect x="8" y="20" width="32" height="24" rx="6" fill={Y} />
      <circle cx="24" cy="31" r="3.5" fill={D} />
      <rect x="22.5" y="31" width="3" height="7" rx="1.5" fill={D} />
    </>
  ),
  key: (
    <>
      <circle cx="15" cy="24" r="10" fill={Y} />
      <circle cx="12" cy="24" r="3.5" fill={W} />
      <path d="M24 24h19M36 24v7M42 24v5" stroke={Y} strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  gear: (
    <>
      <g fill="#8a94a8">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <rect key={a} x="20" y="2" width="8" height="10" rx="2" transform={`rotate(${a} 24 24)`} />
        ))}
      </g>
      <circle cx="24" cy="24" r="15" fill="#8a94a8" />
      <circle cx="24" cy="24" r="6" fill={W} />
    </>
  ),
  pencil: (
    <>
      <path d="M8 40l3-11L33 7l8 8-22 22z" fill={Y} />
      <path d="M33 7l8 8 2-2a4 4 0 0 0 0-6l-2-2a4 4 0 0 0-6 0z" fill={K} />
      <path d="M8 40l3-11 8 8z" fill="#ffe2b8" />
      <path d="M8 40l1.5-5 3.5 3.5z" fill={D} />
    </>
  ),
  pointer: (
    <>
      <circle cx="20" cy="14" r="9" fill="none" stroke={B} strokeWidth="2.5" opacity=".5" />
      <rect x="16" y="10" width="8" height="24" rx="4" fill="#ffc98b" />
      <path d="M12 26h22v6a12 12 0 0 1-12 12h-1a9 9 0 0 1-9-9z" fill="#ffc98b" />
      <rect x="25" y="20" width="7" height="12" rx="3.5" fill="#ffc98b" />
    </>
  ),
  keypad: (
    <g fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="13" textAnchor="middle" fill={W}>
      <rect x="2" y="15" width="14" height="18" rx="4" fill={B} />
      <text x="9" y="29">1</text>
      <rect x="17" y="15" width="14" height="18" rx="4" fill={G} />
      <text x="24" y="29">2</text>
      <rect x="32" y="15" width="14" height="18" rx="4" fill={O} />
      <text x="39" y="29">3</text>
    </g>
  ),
  flagUS: (
    <>
      <rect x="3" y="9" width="42" height="30" rx="4" fill={W} stroke={L} strokeWidth="1.5" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="3" y={11 + i * 7.5} width="42" height="3.7" fill={R} />
      ))}
      <rect x="3" y="9" width="19" height="16" rx="3" fill="#3557b7" />
    </>
  ),
  flagJP: (
    <>
      <rect x="3" y="9" width="42" height="30" rx="4" fill={W} stroke={L} strokeWidth="1.5" />
      <circle cx="24" cy="24" r="8" fill="#e5484d" />
    </>
  ),
  clipboard: (
    <>
      <rect x="8" y="7" width="32" height="38" rx="5" fill={N} />
      <rect x="12" y="12" width="24" height="29" rx="2" fill={W} />
      <rect x="17" y="4" width="14" height="8" rx="3" fill="#8a94a8" />
      <path d="M16 21h16M16 28h16M16 35h10" stroke={L} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  repeat: (
    <>
      <path d="M8 22a14 14 0 0 1 26-7" stroke={B} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M40 26a14 14 0 0 1-26 7" stroke={B} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M36 5l1 12-12-1z" fill={B} />
      <path d="M12 43l-1-12 12 1z" fill={B} />
    </>
  ),
  warning: (
    <>
      <path d="M24 5l20 36H4z" fill={Y} stroke="#f0b400" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="22" y="16" width="4" height="14" rx="2" fill={D} />
      <circle cx="24" cy="35" r="2.5" fill={D} />
    </>
  ),
  clock: (
    <>
      <circle cx="24" cy="24" r="20" fill={W} stroke={O} strokeWidth="4" />
      <path d="M24 12v12l8 5" stroke={D} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="24" cy="24" r="2.5" fill={R} />
    </>
  ),
  scale: (
    <>
      <path d="M24 8v32M14 42h20M8 14h32" stroke={N} strokeWidth="4" strokeLinecap="round" />
      <path d="M8 14 3 28h10zM40 14l-5 14h10z" fill="none" stroke={N} strokeWidth="2" />
      <path d="M2 28a6 4 0 0 0 12 0zM34 28a6 4 0 0 0 12 0z" fill={Y} />
      <circle cx="24" cy="7" r="3.5" fill={R} />
    </>
  ),
  shapes: (
    <>
      <path d="M13 5l11 19H2z" fill={Y} />
      <circle cx="35" cy="14" r="10" fill={B} />
      <rect x="14" y="27" width="17" height="17" rx="3" fill={K} />
    </>
  ),
  tenframe: (
    <>
      <rect x="2" y="11" width="44" height="26" rx="4" fill={W} stroke={D} strokeWidth="2.5" />
      <path d="M2 24h44M10.8 11v26M19.6 11v26M28.4 11v26M37.2 11v26" stroke={D} strokeWidth="1.5" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <circle key={i} cx={6.4 + (i % 5) * 8.8} cy={i < 5 ? 17.5 : 30.5} r="3" fill={R} />
      ))}
    </>
  ),
  arrow: (
    <>
      <path d="M5 24h30" stroke={B} strokeWidth="7" strokeLinecap="round" />
      <path d="M28 12l15 12-15 12z" fill={B} />
    </>
  ),
  bond: (
    <>
      <path d="M24 13 12 34M24 13l12 21" stroke={D} strokeWidth="3" />
      <circle cx="24" cy="12" r="9" fill={O} />
      <circle cx="12" cy="36" r="8" fill={B} />
      <circle cx="36" cy="36" r="8" fill={G} />
    </>
  ),
  medal: (
    <>
      <path d="M14 3h8l6 14h-8zM34 3h-8l-6 14h8z" fill={B} />
      <circle cx="24" cy="31" r="14" fill={Y} stroke="#f0b400" strokeWidth="2.5" />
      <text x="24" y="37" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="16" fill="#9a6b00">
        1
      </text>
    </>
  ),
  ruler: (
    <>
      <rect x="2" y="15" width="44" height="18" rx="3" fill={Y} />
      <path d="M8 15v8M14 15v5M20 15v8M26 15v5M32 15v8M38 15v5" stroke="#9a6b00" strokeWidth="2" />
    </>
  ),
  coin: (
    <>
      <circle cx="24" cy="24" r="19" fill={Y} stroke="#f0b400" strokeWidth="3" />
      <circle cx="24" cy="24" r="13" fill="none" stroke="#f0b400" strokeWidth="2" />
      <text x="24" y="31" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="19" fill="#9a6b00">
        ¢
      </text>
    </>
  ),
  octagon: <path d="M16 4h16l12 12v16L32 44H16L4 32V16z" fill={R} stroke={W} strokeWidth="3" strokeLinejoin="round" />,
  grid: (
    <>
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={4 + c * 14} y={4 + r * 14} width="12" height="12" rx="3" fill={(r + c) % 2 ? B : '#9cc8ff'} />)
      )}
    </>
  ),
  pairs: (
    <>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={10 + i * 14} cy="16" r="5" fill={G} />
          <circle cx={10 + i * 14} cy="32" r="5" fill={G} />
        </g>
      ))}
    </>
  ),
  blocks: (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x="6" y={4 + i * 8} width="8" height="7" rx="1.5" fill={B} />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x="17" y={4 + i * 8} width="8" height="7" rx="1.5" fill={B} />
      ))}
      <rect x="30" y="36" width="7" height="7" rx="1.5" fill={G} />
      <rect x="39" y="36" width="7" height="7" rx="1.5" fill={G} />
      <rect x="30" y="27" width="7" height="7" rx="1.5" fill={G} />
    </>
  ),
  question: (
    <>
      <circle cx="24" cy="24" r="20" fill={P} />
      <text x="24" y="33" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="26" fill={W}>
        ?
      </text>
    </>
  ),
  pizza: (
    <>
      <path d="M24 45 4 9Q24-1 44 9Z" fill="#ffcf6e" />
      <path d="M5 10Q24 1 43 10" stroke="#e2a85a" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="19" cy="18" r="4" fill={R} />
      <circle cx="29" cy="25" r="3.5" fill={R} />
      <circle cx="23" cy="33" r="3" fill={R} />
    </>
  ),
  abacus: (
    <>
      <rect x="4" y="5" width="40" height="38" rx="5" fill="none" stroke={N} strokeWidth="4" />
      <path d="M6 16h36M6 26h36M6 36h36" stroke={N} strokeWidth="2" />
      {[
        [12, 16, R],
        [19, 16, R],
        [30, 26, B],
        [12, 26, B],
        [24, 36, G],
        [31, 36, G],
        [38, 36, G],
      ].map(([x, y, c]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="3.6" fill={c} />
      ))}
    </>
  ),
  bolt: <path d="M28 3 9 27h13l-4 18 21-26H26z" fill={Y} stroke="#f0b400" strokeWidth="2" strokeLinejoin="round" />,
  candy: (
    <>
      <path d="M13 24 3 15v18zM35 24l10-9v18z" fill={K} />
      <circle cx="24" cy="24" r="12" fill={R} />
      <path d="M17 20q7-6 14 0M17 28q7 6 14 0" stroke={W} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  scissors: (
    <>
      <path d="M10 6l22 26M38 6 16 32" stroke="#8a94a8" strokeWidth="4" strokeLinecap="round" />
      <circle cx="13" cy="37" r="7" fill="none" stroke={R} strokeWidth="4" />
      <circle cx="35" cy="37" r="7" fill="none" stroke={R} strokeWidth="4" />
    </>
  ),
  perimeter: (
    <>
      <rect x="9" y="9" width="30" height="30" rx="2" fill="#dbeeff" />
      <rect x="6" y="6" width="36" height="36" rx="3" fill="none" stroke={B} strokeWidth="4" strokeDasharray="7 4" />
    </>
  ),
  angle: (
    <>
      <path d="M6 40h36M6 40 34 10" stroke={D} strokeWidth="4" strokeLinecap="round" />
      <path d="M20 40a14 14 0 0 0-4.5-10.5" stroke={O} strokeWidth="4" fill="none" />
    </>
  ),
  lines: (
    <>
      <path d="M6 14h36M6 24h36" stroke={B} strokeWidth="4" strokeLinecap="round" />
      <path d="M14 42 34 4" stroke={R} strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  abc: (
    <g fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="20" textAnchor="middle" fill={W}>
      <rect x="2" y="12" width="21" height="24" rx="6" fill={P} />
      <text x="12.5" y="30">x</text>
      <rect x="25" y="12" width="21" height="24" rx="6" fill={O} />
      <text x="35.5" y="30">y</text>
    </g>
  ),
  puzzle: (
    <path d="M6 10h11a5 5 0 1 1 10 0h11v11a5 5 0 1 0 0 10v11H27a5 5 0 1 0-10 0H6V31a5 5 0 1 1 0-10z" fill={G} />
  ),
  gem: (
    <>
      <path d="M12 6h24l9 12-21 25L3 18z" fill="#6fd6e8" />
      <path d="M3 18h42M12 6l6 12 6-12 6 12 6-12M18 18l6 25 6-25" stroke={W} strokeWidth="1.8" fill="none" opacity=".8" />
    </>
  ),
  rocket: (
    <>
      <path d="M24 3c9 7 11 18 8 29H16C13 21 15 10 24 3z" fill={L} />
      <circle cx="24" cy="18" r="5" fill={B} />
      <path d="M16 24l-7 10 8-1zM32 24l7 10-8-1z" fill={R} />
      <path d="M19 34h10l-5 11z" fill={O} />
    </>
  ),
  thermometer: (
    <>
      <rect x="18" y="3" width="12" height="32" rx="6" fill={W} stroke={L} strokeWidth="2" />
      <circle cx="24" cy="37" r="9" fill={R} />
      <rect x="21" y="16" width="6" height="20" rx="3" fill={R} />
      <path d="M34 10h6M34 18h6M34 26h6" stroke="#aab4c8" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  compass: (
    <>
      <circle cx="24" cy="24" r="20" fill={W} stroke={B} strokeWidth="4" />
      <path d="M24 8l6 16H18z" fill={R} />
      <path d="M24 40l-6-16h12z" fill="#aab4c8" />
    </>
  ),
  decimal: (
    <g fontFamily="Fredoka, sans-serif" fontWeight="700" textAnchor="middle">
      <rect x="2" y="9" width="44" height="30" rx="8" fill={W} stroke={L} strokeWidth="2" />
      <text x="24" y="32" fontSize="20" fill="#14898c">
        0.5
      </text>
    </g>
  ),
  hundred: (
    <g fontFamily="Fredoka, sans-serif" fontWeight="700" textAnchor="middle">
      <rect x="2" y="9" width="44" height="30" rx="8" fill={R} />
      <text x="24" y="32" fontSize="19" fill={W}>
        100
      </text>
    </g>
  ),
  pattern: (
    <>
      {[R, B, R, B].map((c, i) => (
        <circle key={i} cx={7 + i * 11.3} cy="24" r="5.5" fill={c} />
      ))}
    </>
  ),
  plus: (
    <>
      <circle cx="24" cy="24" r="20" fill={G} />
      <path d="M24 14v20M14 24h20" stroke={W} strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  minus: (
    <>
      <circle cx="24" cy="24" r="20" fill={R} />
      <path d="M14 24h20" stroke={W} strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  times: (
    <>
      <circle cx="24" cy="24" r="20" fill={P} />
      <path d="M17 17l14 14M31 17 17 31" stroke={W} strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  share: (
    <>
      <circle cx="12" cy="13" r="6" fill="#ffc98b" />
      <circle cx="36" cy="13" r="6" fill="#ffc98b" />
      <path d="M3 44c0-11 4-17 9-17s9 6 9 17zM27 44c0-11 4-17 9-17s9 6 9 17z" fill={B} />
      <circle cx="24" cy="32" r="6" fill={N} />
      <circle cx="22" cy="30" r="1.2" fill="#6b4423" />
      <circle cx="26" cy="33" r="1.2" fill="#6b4423" />
    </>
  ),
  story: (
    <>
      <path d="M4 10c7-3 14-3 20 2v30c-6-5-13-5-20-2z" fill={B} />
      <path d="M44 10c-7-3-14-3-20 2v30c6-5 13-5 20-2z" fill="#6aa8f5" />
      <path d="M9 18c4-1 7-1 10 1M9 25c4-1 7-1 10 1M29 19c3-2 6-2 10-1M29 26c3-2 6-2 10-1" stroke={W} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  brain: (
    <>
      <path d="M24 8c-3-4-10-4-12 1-5 0-8 5-6 9-3 3-2 9 2 11 0 5 5 8 10 6 2 3 4 4 6 4z" fill={K} />
      <path d="M24 8c3-4 10-4 12 1 5 0 8 5 6 9 3 3 2 9-2 11 0 5-5 8-10 6-2 3-4 4-6 4z" fill="#ff7aa2" />
      <path d="M24 9v30M14 18c3 0 5 2 5 5M34 18c-3 0-5 2-5 5M13 30c3-1 5 0 6 2M35 30c-3-1-5 0-6 2" stroke={W} strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  // Plain marks in the text's own color, for ✓ ✗ ✕.
  tick: <path d="M9 25l10 10 20-22" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  cross: <path d="M12 12l24 24M36 12 12 36" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" />,
};

export function hasIcon(name) {
  return Boolean(ICONS[name] || DRAWINGS[name]);
}

export default function Icon({ name, size = '1.25em', className = '' }) {
  if (ICONS[name]) {
    return (
      <svg className={`icon ${className}`} viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
        {ICONS[name]}
      </svg>
    );
  }
  const Drawing = DRAWINGS[name];
  if (Drawing) {
    return (
      <svg className={`icon ${className}`} viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <Drawing />
      </svg>
    );
  }
  // Not a picture (a "+" or "×" sign): the text itself.
  return <span className={`icon-text ${className}`}>{name}</span>;
}
