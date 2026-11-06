import { createPortal } from 'react-dom';

// Printable coloring pages for the youngest players (Toddler and K): big
// black outlines on white, one idea per page, to print and color with
// crayons. Four packs: Numbers 1 to 10 (a big number to color, its word,
// that many things to color, and numbers to trace), Count & Color ("Color
// 3 balloons"), Shapes, and Color by Number. Each page is one letter / A4
// sheet, drawn as an SVG on an 800 x 1040 grid.

const INK = '#222';
const W = 800;
const H = 1040;
const LINE = { fill: '#fff', stroke: INK, strokeWidth: 4, strokeLinejoin: 'round', strokeLinecap: 'round' };
const FONT = "'Fredoka', ui-rounded, system-ui, sans-serif";

// ---- Line drawings to color, each in a 100 x 100 box.
const ART = {
  sun: (
    <g {...LINE}>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return <path key={i} d={`M${50 + 30 * Math.cos(a)} ${50 + 30 * Math.sin(a)}L${50 + 46 * Math.cos(a)} ${50 + 46 * Math.sin(a)}`} />;
      })}
      <circle cx="50" cy="50" r="24" />
      <circle cx="42" cy="46" r="2.5" fill={INK} />
      <circle cx="58" cy="46" r="2.5" fill={INK} />
      <path d="M41 56q9 8 18 0" fill="none" />
    </g>
  ),
  fish: (
    <g {...LINE}>
      <path d="M70 50 94 32V68Z" />
      <path d="M8 50C20 26 58 22 74 50 58 78 20 74 8 50Z" />
      <circle cx="26" cy="46" r="3" fill={INK} />
      <path d="M44 36q6 14 0 28" fill="none" />
    </g>
  ),
  apple: (
    <g {...LINE}>
      <path d="M50 28C30 16 8 28 12 54 15 78 34 94 50 88 66 94 85 78 88 54 92 28 70 16 50 28Z" />
      <path d="M50 29C50 18 52 12 56 6" fill="none" />
      <path d="M55 18C63 6 76 6 81 10 75 20 63 23 55 18Z" />
    </g>
  ),
  balloon: (
    <g {...LINE}>
      <path d="M50 6C30 6 18 22 18 40 18 58 34 72 50 74 66 72 82 58 82 40 82 22 70 6 50 6Z" />
      <path d="M46 74h8l-4 6z" />
      <path d="M50 80q-8 8 0 16" fill="none" />
    </g>
  ),
  star: (
    <g {...LINE}>
      <path d="M50 6 62 36 94 38 69 58 78 90 50 72 22 90 31 58 6 38 38 36Z" />
    </g>
  ),
  flower: (
    <g {...LINE}>
      <path d="M50 60V96" fill="none" />
      <path d="M50 82C40 70 28 72 26 78 34 86 44 86 50 82Z" />
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse key={r} cx="50" cy="20" rx="12" ry="16" transform={`rotate(${r} 50 38)`} />
      ))}
      <circle cx="50" cy="38" r="11" />
    </g>
  ),
  heart: (
    <g {...LINE}>
      <path d="M50 88C18 66 6 48 10 30 14 14 36 10 50 28 64 10 86 14 90 30 94 48 82 66 50 88Z" />
    </g>
  ),
  ball: (
    <g {...LINE}>
      <circle cx="50" cy="50" r="40" />
      <path d="M12 40C36 50 64 50 88 40M12 60C36 70 64 70 88 60" fill="none" />
      <path d="M50 10C40 34 40 66 50 90" fill="none" />
    </g>
  ),
  butterfly: (
    <g {...LINE}>
      <path d="M50 30C38 8 8 10 10 32 12 48 32 52 48 48Z" />
      <path d="M50 30C62 8 92 10 90 32 88 48 68 52 52 48Z" />
      <path d="M48 52C36 52 18 62 24 78 32 90 46 76 49 60Z" />
      <path d="M52 52C64 52 82 62 76 78 68 90 54 76 51 60Z" />
      <ellipse cx="50" cy="52" rx="5" ry="26" />
      <path d="M48 28Q42 14 36 10M52 28Q58 14 64 10" fill="none" />
    </g>
  ),
  duck: (
    <g {...LINE}>
      <path d="M10 62C10 50 22 46 34 50 46 54 56 50 62 46L80 60C82 80 64 88 44 88 24 88 10 78 10 62Z" />
      <circle cx="66" cy="38" r="18" />
      <path d="M83 36 97 41 83 47Z" />
      <circle cx="70" cy="33" r="3" fill={INK} />
      <path d="M26 64q12 10 26 0" fill="none" />
    </g>
  ),
  car: (
    <g {...LINE}>
      <path d="M8 66V54L20 50 32 30H66L80 50 92 54V66Z" />
      <path d="M36 36H50V50H26ZM56 36H64L74 50H56Z" />
      <circle cx="28" cy="70" r="11" />
      <circle cx="72" cy="70" r="11" />
    </g>
  ),
  cat: (
    <g {...LINE}>
      <path d="M18 40 22 8 42 26H58L78 8 82 40C88 70 70 88 50 88 30 88 12 70 18 40Z" />
      <ellipse cx="38" cy="50" rx="4" ry="6" fill={INK} />
      <ellipse cx="62" cy="50" rx="4" ry="6" fill={INK} />
      <path d="M46 62h8l-4 5z" fill={INK} />
      <path d="M50 67q-6 6-12 2M50 67q6 6 12 2M10 58h20M10 66l20-3M90 58H70M90 66l-20-3" fill="none" />
    </g>
  ),
};

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const NUMBER_ART = [null, 'sun', 'fish', 'apple', 'balloon', 'star', 'flower', 'heart', 'ball', 'butterfly', 'duck'];
const PLURALS = { fish: 'fish', butterfly: 'butterflies' };
const plural = (id, n) => (n === 1 ? id : PLURALS[id] || `${id}s`);

function Art({ id, x, y, size }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 100})`} style={{ vectorEffect: 'non-scaling-stroke' }}>
      {ART[id]}
    </g>
  );
}

// `n` drawings laid out in rows across the width, centred, from `top`.
function ArtRows({ id, n, top, height }) {
  const perRow = n <= 3 ? n : n <= 4 ? 2 : n <= 6 ? 3 : n <= 8 ? 4 : 5;
  const rows = Math.ceil(n / perRow);
  const size = Math.min(240, (W - 80) / perRow - 20, height / rows - 20);
  return Array.from({ length: n }, (_, i) => {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, n - row * perRow);
    const col = i % perRow;
    const gap = (W - 80 - inRow * size) / (inRow + 1);
    return <Art key={i} id={id} size={size} x={40 + gap + col * (size + gap)} y={top + row * (height / rows) + (height / rows - size) / 2} />;
  });
}

// Big hollow letters to color in.
function Outline({ text, x, y, size, anchor = 'middle' }) {
  return (
    <text x={x} y={y} fontFamily={FONT} fontWeight="700" fontSize={size} textAnchor={anchor} fill="#fff" stroke={INK} strokeWidth={size / 45} strokeLinejoin="round">
      {text}
    </text>
  );
}

// Dotted letters to trace.
function Trace({ text, x, y, size }) {
  return (
    <text x={x} y={y} fontFamily={FONT} fontWeight="600" fontSize={size} textAnchor="middle" fill="none" stroke="#999" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round">
      {text}
    </text>
  );
}

function Title({ children, y = 70 }) {
  return (
    <text x={W / 2} y={y} fontFamily={FONT} fontWeight="700" fontSize="44" textAnchor="middle" fill={INK}>
      {children}
    </text>
  );
}

function Footer() {
  return (
    <>
      <text x="40" y={H - 18} fontFamily={FONT} fontSize="20" fill="#888">
        Name: ____________________
      </text>
      <text x={W - 40} y={H - 18} fontFamily={FONT} fontWeight="700" fontSize="20" fill="#888" textAnchor="end">
        MathPop
      </text>
    </>
  );
}

// ---- The pages.

function NumberPage({ n }) {
  const art = NUMBER_ART[n];
  return (
    <>
      <Outline text={String(n)} x={n === 10 ? 250 : 210} y={330} size={330} />
      <Outline text={NUMBER_WORDS[n]} x={n === 10 ? 470 : 410} y={250} size={110} anchor="start" />
      <text x={n === 10 ? 470 : 410} y={315} fontFamily={FONT} fontSize="30" fill="#666">
        Color {n} {plural(art, n)}
      </text>
      <ArtRows id={art} n={n} top={370} height={420} />
      <text x="40" y="850" fontFamily={FONT} fontSize="26" fill="#666">
        Trace:
      </text>
      {Array.from({ length: n === 10 ? 3 : 6 }, (_, i) => (
        <Trace key={i} text={String(n)} x={n === 10 ? 170 + i * 230 : 125 + i * 110} y={990} size={150} />
      ))}
    </>
  );
}

const COUNT_PAGES = [
  { art: 'balloon', color: 2, of: 5 },
  { art: 'apple', color: 3, of: 6 },
  { art: 'star', color: 4, of: 8 },
  { art: 'fish', color: 1, of: 4 },
  { art: 'flower', color: 5, of: 8 },
  { art: 'heart', color: 3, of: 5 },
];

function CountPage({ art, color, of }) {
  return (
    <>
      <Title y={90}>
        Color {color} {plural(art, color)}
      </Title>
      <Outline text={String(color)} x={W / 2} y={300} size={200} />
      <ArtRows id={art} n={of} top={340} height={500} />
      <text x={W / 2} y={920} fontFamily={FONT} fontSize="30" textAnchor="middle" fill="#666">
        Count them out loud as you color: 1, 2{color > 2 ? ', 3' : ''}...
      </text>
    </>
  );
}

const SHAPES = {
  circle: <circle cx="50" cy="50" r="44" />,
  square: <rect x="8" y="8" width="84" height="84" rx="4" />,
  triangle: <path d="M50 6 94 90H6Z" />,
  star: ART.star.props.children,
  heart: ART.heart.props.children,
  rectangle: <rect x="2" y="22" width="96" height="56" rx="4" />,
};

function ShapePage({ shape }) {
  return (
    <>
      <Title y={90}>This is a {shape}!</Title>
      <text x={W / 2} y={140} fontFamily={FONT} fontSize="30" textAnchor="middle" fill="#666">
        Color the big {shape}. Trace the little ones.
      </text>
      <g transform={`translate(${W / 2 - 240} 180) scale(4.8)`} {...LINE} strokeWidth={1.2}>
        {SHAPES[shape]}
      </g>
      {Array.from({ length: 4 }, (_, i) => (
        <g key={i} transform={`translate(${70 + i * 175} 760) scale(1.5)`} fill="none" stroke="#999" strokeWidth="2.2" strokeDasharray="2 6" strokeLinecap="round">
          {SHAPES[shape]}
        </g>
      ))}
    </>
  );
}

// Color by number: each part of the picture has a number; the key says
// which crayon. The key's swatches print in color (or as a colored ring
// to match on a black-and-white printer).
const KEY_COLORS = { 1: ['red', '#e5383b'], 2: ['yellow', '#ffd23f'], 3: ['blue', '#3b8cf0'], 4: ['green', '#2fae6b'], 5: ['orange', '#ff9f43'], 6: ['purple', '#9b6bf2'] };

function Num({ x, y, n, size = 34 }) {
  return (
    <text x={x} y={y + size * 0.35} fontFamily={FONT} fontWeight="700" fontSize={size} textAnchor="middle" fill={INK}>
      {n}
    </text>
  );
}

const BY_NUMBER = {
  house: {
    title: 'A house',
    keys: [1, 2, 3, 4],
    draw: (
      <>
        <g {...LINE}>
          <circle cx="660" cy="160" r="60" />
          <path d="M140 420 400 200 660 420Z" />
          <rect x="180" y="420" width="440" height="330" />
          <rect x="350" y="560" width="100" height="190" />
          <rect x="220" y="470" width="90" height="90" />
          <rect x="490" y="470" width="90" height="90" />
          <path d="M40 750H760V830H40Z" />
        </g>
        <Num x={660} y={160} n={2} />
        <Num x={400} y={340} n={1} />
        <Num x={400} y={480} n={2} />
        <Num x={400} y={660} n={3} />
        <Num x={265} y={515} n={3} />
        <Num x={535} y={515} n={3} />
        <Num x={400} y={790} n={4} />
      </>
    ),
  },
  balloons: {
    title: 'Balloons',
    keys: [1, 2, 3, 4],
    draw: (
      <>
        <g {...LINE}>
          {[
            [210, 300],
            [400, 230],
            [590, 300],
            [300, 470],
            [500, 470],
          ].map(([x, y]) => (
            <g key={`${x}${y}`}>
              <path d={`M${x} ${y + 80}Q${x - 10} ${y + 260} 400 820`} fill="none" />
              <ellipse cx={x} cy={y} rx="80" ry="95" />
            </g>
          ))}
          <path d="M330 820h140l-20 60h-100z" />
        </g>
        <Num x={210} y={300} n={1} />
        <Num x={400} y={230} n={2} />
        <Num x={590} y={300} n={3} />
        <Num x={300} y={470} n={4} />
        <Num x={500} y={470} n={1} />
        <Num x={400} y={850} n={3} />
      </>
    ),
  },
  fish: {
    title: 'A fish',
    keys: [1, 3, 4, 5],
    draw: (
      <>
        <g {...LINE}>
          <path d="M560 470 740 330V610Z" />
          <path d="M80 470C170 260 470 230 590 470 470 710 170 680 80 470Z" />
          <path d="M310 290Q360 220 450 300" />
          <circle cx="200" cy="440" r="22" />
          <path d="M60 820Q130 760 200 820T340 820T480 820T620 820T760 820V880H60Z" />
          <circle cx="120" cy="230" r="26" />
          <circle cx="170" cy="150" r="18" />
        </g>
        <Num x={330} y={500} n={5} />
        <Num x={665} y={470} n={1} />
        <Num x={380} y={290} n={1} />
        <Num x={410} y={850} n={4} />
        <Num x={120} y={230} n={3} size={26} />
      </>
    ),
  },
  rainbow: {
    title: 'A rainbow',
    keys: [1, 5, 2, 4, 3, 6],
    draw: (
      <>
        <g {...LINE}>
          {[360, 320, 280, 240, 200, 160, 120].map((r) => (
            <path key={r} d={`M${400 - r} 640A${r} ${r} 0 0 1 ${400 + r} 640Z`} />
          ))}
          <path d="M60 680c0-50 60-70 100-40 20-40 90-40 110 10 40 0 50 50 20 70H80c-30 0-30-40-20-40z" />
          <path d="M490 680c0-50 60-70 100-40 20-40 90-40 110 10 40 0 50 50 20 70H510c-30 0-30-40-20-40z" />
        </g>
        {[
          [340, 1],
          [300, 5],
          [260, 2],
          [220, 4],
          [180, 3],
          [140, 6],
        ].map(([r, n]) => (
          <Num key={r} x={400} y={640 - r - 2} n={n} size={30} />
        ))}
      </>
    ),
  },
};

function ByNumberPage({ id }) {
  const p = BY_NUMBER[id];
  const step = p.keys.length > 4 ? 122 : 150;
  return (
    <>
      <Title y={80}>Color by number: {p.title.toLowerCase()}</Title>
      <g transform="translate(0 40)">{p.draw}</g>
      <g transform={`translate(${W / 2 - (p.keys.length * step) / 2 + 10} 940)`}>
        {p.keys.map((k, i) => (
          <g key={k} transform={`translate(${i * step} 0)`}>
            <circle cx="24" cy="0" r="20" fill={KEY_COLORS[k][1]} stroke={INK} strokeWidth="3" />
            <text x="24" y="10" fontFamily={FONT} fontWeight="700" fontSize="26" textAnchor="middle" fill={INK}>
              {k}
            </text>
            <text x="52" y="9" fontFamily={FONT} fontSize="24" fill={INK}>
              {KEY_COLORS[k][0]}
            </text>
          </g>
        ))}
      </g>
    </>
  );
}

export const COLORING_PACKS = [
  {
    id: 'numbers',
    title: 'Numbers 1 to 10',
    sub: 'Color the number, color that many, trace it',
    pages: Array.from({ length: 10 }, (_, i) => ({ kind: 'number', n: i + 1 })),
  },
  { id: 'count', title: 'Count & Color', sub: '“Color 3 apples”', pages: COUNT_PAGES.map((p) => ({ kind: 'count', ...p })) },
  { id: 'shapes', title: 'Shapes', sub: 'Circle, square, triangle, star, heart', pages: Object.keys(SHAPES).map((shape) => ({ kind: 'shape', shape })) },
  { id: 'bynumber', title: 'Color by Number', sub: 'Match the number to the crayon', pages: Object.keys(BY_NUMBER).map((id) => ({ kind: 'bynumber', id })) },
];

export function ColoringPage({ page, className = '' }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`coloring-page ${className}`} role="img" aria-label="A coloring page">
      <rect width={W} height={H} fill="#fff" />
      {page.kind === 'number' && <NumberPage n={page.n} />}
      {page.kind === 'count' && <CountPage {...page} />}
      {page.kind === 'shape' && <ShapePage shape={page.shape} />}
      {page.kind === 'bynumber' && <ByNumberPage id={page.id} />}
      <Footer />
    </svg>
  );
}

// The pages to print, rendered next to the app and only shown when
// printing (like PrintSheet.jsx): one page per sheet.
export function ColoringPrint({ pages }) {
  return createPortal(
    <div className="print-sheet coloring-print">
      {pages.map((page, i) => (
        <div key={i} className="coloring-sheet">
          <ColoringPage page={page} />
        </div>
      ))}
    </div>,
    document.body,
  );
}
