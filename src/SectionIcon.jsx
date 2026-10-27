// The home page's section tiles: a small flat drawing for each section
// (in place of emoji), white and yellow on the tile's color.

const W = '#fff';
const Y = '#ffe066';

function Bead({ x, y }) {
  return <circle cx={x} cy={y} r="5.5" fill="#e6a35e" stroke={W} strokeWidth="1.5" />;
}

const DRAWINGS = {
  numbers: (
    <g fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="16" textAnchor="middle">
      <rect x="4" y="22" width="16" height="20" rx="4" fill={W} />
      <text x="12" y="38" fill="#3b6fef">1</text>
      <rect x="21" y="12" width="16" height="30" rx="4" fill={Y} />
      <text x="29" y="33" fill="#3b6fef">2</text>
      <rect x="38" y="2" width="16" height="40" rx="4" fill={W} />
      <text x="46" y="28" fill="#3b6fef">3</text>
    </g>
  ),
  addsub: (
    <g>
      <rect x="6" y="6" width="22" height="22" rx="7" fill={W} />
      <path d="M17 11v12M11 17h12" stroke="#2fae6b" strokeWidth="4" strokeLinecap="round" />
      <rect x="30" y="18" width="22" height="22" rx="7" fill={Y} />
      <path d="M35 29h12" stroke="#2fae6b" strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  muldiv: (
    <g>
      <rect x="4" y="6" width="50" height="34" rx="8" fill="#c98f5c" />
      {[0, 1].map((r) => [0, 1, 2].map((c) => <Bead key={`${r}${c}`} x={16 + c * 13} y={16 + r * 14} />))}
    </g>
  ),
  fractions: (
    <g>
      <path d="M29 42 6 9Q29-3 52 9Z" fill="#ffcf6e" stroke={W} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M8 11Q29 1 50 11" stroke="#e2a85a" strokeWidth="5" fill="none" />
      <circle cx="24" cy="19" r="4" fill="#e5484d" />
      <circle cx="34" cy="27" r="3.5" fill="#e5484d" />
    </g>
  ),
  decimals: (
    <g fontFamily="Fredoka, sans-serif" fontWeight="700" textAnchor="middle">
      <rect x="4" y="6" width="50" height="34" rx="8" fill={W} />
      <text x="29" y="31" fontSize="19" fill="#14898c">
        0.5
      </text>
    </g>
  ),
  measure: (
    <g>
      <rect x="2" y="24" width="54" height="14" rx="3" fill={Y} />
      <path d="M8 24v7M14 24v4M20 24v7M26 24v4M32 24v7M38 24v4M44 24v7M50 24v4" stroke="#7a5a00" strokeWidth="1.8" />
      <path d="M12 18 40 4l5 4-28 14z" fill={W} />
      <path d="M40 4l5 4 4-6z" fill="#ff8fa3" />
    </g>
  ),
  shapes: (
    <g>
      <path d="M14 6 26 26H2z" fill={Y} />
      <circle cx="40" cy="14" r="10" fill={W} />
      <rect x="18" y="26" width="16" height="16" rx="3" fill="#ffb3c6" />
    </g>
  ),
  data: (
    <g>
      <rect x="6" y="22" width="10" height="20" rx="3" fill={W} />
      <rect x="20" y="10" width="10" height="32" rx="3" fill={Y} />
      <rect x="34" y="2" width="10" height="40" rx="3" fill={W} />
      <path d="M2 42h52" stroke={W} strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  puzzles: (
    <g>
      <path d="M10 10h12a6 6 0 1 1 10 0h12v12a6 6 0 1 0 0 10v12H32a6 6 0 1 0-10 0H10z" fill={W} />
      <text x="27" y="32" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="14" fill="#8e4fd6">
        ?
      </text>
    </g>
  ),
  explore: (
    <g>
      <path d="M6 16h8l10-8v28l-10-8H6z" fill={W} />
      <path d="M30 12a10 10 0 0 1 0 16" stroke={W} strokeWidth="3" fill="none" strokeLinecap="round" />
      <g fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="13" fill={Y}>
        <text x="38" y="14">1</text>
        <text x="44" y="30">2</text>
        <text x="36" y="42">3</text>
      </g>
    </g>
  ),
};

export default function SectionIcon({ id }) {
  return (
    <svg className="section-icon" viewBox="0 0 58 46" aria-hidden="true">
      {DRAWINGS[id] || DRAWINGS.numbers}
    </svg>
  );
}
