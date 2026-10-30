// The home page's section tiles: one big, simple flat drawing for each
// section (in place of emoji), white and yellow on the tile's color so
// it reads at a glance. Drawn on a 64 x 48 grid.

const W = '#fff';
const Y = '#ffe066';
const FONT = { fontFamily: 'Fredoka, sans-serif', fontWeight: 700, textAnchor: 'middle' };

// A rounded white (or yellow) card with a sign or number on it.
function Card({ x, y, w = 28, h = 28, fill = W, children }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="8" fill={fill} />
      {children}
    </g>
  );
}

const DRAWINGS = {
  numbers: (
    <g {...FONT} fontSize="22">
      <Card x="1" y="10" w="19" h="30" />
      <text x="10.5" y="33" fill="#3b6fef">
        1
      </text>
      <Card x="22.5" y="10" w="19" h="30" fill={Y} />
      <text x="32" y="33" fill="#3b6fef">
        2
      </text>
      <Card x="44" y="10" w="19" h="30" />
      <text x="53.5" y="33" fill="#3b6fef">
        3
      </text>
    </g>
  ),
  addsub: (
    <g strokeLinecap="round" strokeWidth="5.5">
      <Card x="2" y="10" />
      <path d="M16 17v14M9 24h14" stroke="#2fae6b" />
      <Card x="34" y="10" fill={Y} />
      <path d="M41 24h14" stroke="#2fae6b" />
    </g>
  ),
  muldiv: (
    <g strokeLinecap="round" strokeWidth="5.5">
      <Card x="2" y="10" />
      <path d="M11 19l10 10M21 19l-10 10" stroke="#8e4fd6" />
      <Card x="34" y="10" fill={Y} />
      <path d="M41 24h14" stroke="#8e4fd6" />
      <circle cx="48" cy="16.5" r="3" fill="#8e4fd6" />
      <circle cx="48" cy="31.5" r="3" fill="#8e4fd6" />
    </g>
  ),
  fractions: (
    <g>
      {/* A pizza with one slice out. */}
      <path d="M30 24V3a21 21 0 1 0 21 21z" fill="#ffcf6e" stroke={W} strokeWidth="3" strokeLinejoin="round" />
      <path d="M30 24V3M30 24H51M30 24 15 39M30 24 9 24" stroke="#e2a85a" strokeWidth="2" />
      <circle cx="20" cy="14" r="3.2" fill="#e5484d" />
      <circle cx="38" cy="34" r="3.2" fill="#e5484d" />
      <circle cx="17" cy="31" r="2.8" fill="#e5484d" />
      <path d="M35 21V2a21 21 0 0 1 21 19z" fill="#ffcf6e" stroke={W} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="45" cy="12" r="3" fill="#e5484d" />
    </g>
  ),
  decimals: (
    <g {...FONT}>
      <Card x="4" y="8" w="56" h="32" />
      <text x="32" y="32" fontSize="22" fill="#14898c">
        0.5
      </text>
    </g>
  ),
  measure: (
    <g>
      <rect x="2" y="12" width="60" height="24" rx="5" fill={Y} />
      <path d="M8 12v9M14 12v5M20 12v9M26 12v5M32 12v9M38 12v5M44 12v9M50 12v5M56 12v9" stroke="#7a5a00" strokeWidth="2" strokeLinecap="round" />
      <g {...FONT} fontSize="9" fill="#7a5a00">
        <text x="8" y="32">0</text>
        <text x="20" y="32">1</text>
        <text x="32" y="32">2</text>
        <text x="44" y="32">3</text>
        <text x="56" y="32">4</text>
      </g>
    </g>
  ),
  shapes: (
    <g>
      <path d="M13 6 25 27H1z" fill={Y} strokeLinejoin="round" />
      <circle cx="48" cy="16" r="12" fill={W} />
      <rect x="21" y="25" width="20" height="20" rx="4" fill="#ffb3c6" />
    </g>
  ),
  data: (
    <g>
      <rect x="9" y="24" width="11" height="18" rx="3" fill={W} />
      <rect x="25" y="13" width="11" height="29" rx="3" fill={Y} />
      <rect x="41" y="4" width="11" height="38" rx="3" fill={W} />
      <path d="M4 43h56" stroke={W} strokeWidth="3.5" strokeLinecap="round" />
    </g>
  ),
  puzzles: (
    <g>
      <path d="M14 8h12a6 6 0 1 1 12 0h12v13a6 6 0 1 0 0 12v13H38a6 6 0 1 0-12 0H14V33a6 6 0 1 1 0-12z" fill={W} transform="translate(0 -2)" />
      <text x="32" y="32" {...FONT} fontSize="21" fill="#8e4fd6">
        ?
      </text>
    </g>
  ),
  explore: (
    <g>
      {/* A speech bubble saying the numbers: hear them out loud. */}
      <path d="M8 4h48a6 6 0 0 1 6 6v20a6 6 0 0 1-6 6H26l-10 9v-9H8a6 6 0 0 1-6-6V10a6 6 0 0 1 6-6z" fill={W} />
      <text x="32" y="27" {...FONT} fontSize="18" fill="#e8792f">
        123
      </text>
    </g>
  ),
};

export default function SectionIcon({ id }) {
  return (
    <svg className="section-icon" viewBox="0 0 64 48" aria-hidden="true">
      {DRAWINGS[id] || DRAWINGS.numbers}
    </svg>
  );
}
