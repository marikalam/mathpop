// MathPop's own drawings for the toddler games (preK.jsx), in place of
// emoji: things to count and compare, pattern pictures, and a hand
// holding up fingers. Each is drawn in a 100 x 100 box. <Thing> also
// shows an old emoji (from a saved mistake) as it was.

const OUTLINE = '#2b2b3a';

function Strawberry() {
  return (
    <g transform="translate(4 -2) scale(.92)">
      <path d="M50 106C22 94 6 66 9 44 12 28 28 22 50 29 72 22 88 28 91 44 94 66 78 94 50 106Z" fill="#e5383b" />
      <path d="M50 106C64 98 80 80 86 60 80 84 66 98 50 106Z" fill="#c1272d" />
      <ellipse cx="30" cy="50" rx="7" ry="14" fill="#fff" opacity=".28" transform="rotate(-20 30 50)" />
      <g fill="#ffd166">
        {[[36, 46], [56, 44], [72, 52], [28, 64], [48, 62], [66, 70], [38, 80], [58, 84], [50, 96], [80, 66]].map(([x, y]) => (
          <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2.6" ry="3.6" />
        ))}
      </g>
      <path d="M50 34C38 33 25 27 18 18 30 19 40 22 46 26 44 18 44 12 50 6 56 12 56 18 54 26 60 22 70 19 82 18 75 27 62 33 50 34Z" fill="#3aa655" />
      <path d="M50 26 50 4" stroke="#2c8a45" strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

function Apple() {
  return (
    <g>
      <path d="M50 30C30 18 8 30 12 56 15 80 34 96 50 90 66 96 85 80 88 56 92 30 70 18 50 30Z" fill="#e5383b" />
      <path d="M50 90C66 96 85 80 88 56 84 76 68 90 50 90Z" fill="#c1272d" />
      <ellipse cx="28" cy="48" rx="6" ry="12" fill="#fff" opacity=".3" transform="rotate(-25 28 48)" />
      <path d="M50 31C50 20 52 14 56 8" stroke="#7a4a2a" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M55 20C63 8 76 8 81 12 75 22 63 25 55 20Z" fill="#3aa655" />
    </g>
  );
}

function Star() {
  return (
    <g>
      <path d="M50 6 62 36 94 38 69 58 78 90 50 72 22 90 31 58 6 38 38 36Z" fill="#ffc83d" stroke="#f0a500" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="42" cy="52" r="3.5" fill="#6b4500" />
      <circle cx="58" cy="52" r="3.5" fill="#6b4500" />
      <path d="M44 60q6 5 12 0" stroke="#6b4500" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Duck() {
  return (
    <g>
      <path d="M10 62C10 50 22 46 34 50 46 54 56 50 62 46L80 60C82 80 64 88 44 88 24 88 10 78 10 62Z" fill="#ffd43b" />
      <path d="M8 56 2 46 16 52Z" fill="#ffd43b" />
      <ellipse cx="38" cy="66" rx="17" ry="10" fill="#f5c518" transform="rotate(-12 38 66)" />
      <circle cx="68" cy="38" r="19" fill="#ffd43b" />
      <path d="M85 36 99 41 85 47Z" fill="#ff922b" />
      <circle cx="73" cy="33" r="4" fill={OUTLINE} />
      <circle cx="74.5" cy="31.5" r="1.4" fill="#fff" />
    </g>
  );
}

function Fish() {
  return (
    <g>
      <path d="M76 50 98 30 96 50 98 70Z" fill="#339af0" />
      <ellipse cx="44" cy="50" rx="36" ry="26" fill="#4dabf7" />
      <path d="M40 26C48 14 60 16 62 26Z" fill="#339af0" />
      <path d="M44 32C38 44 38 56 44 68M56 30C50 44 50 56 56 70" stroke="#74c0fc" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="24" cy="44" r="7" fill="#fff" />
      <circle cx="22.5" cy="44" r="3.6" fill={OUTLINE} />
      <path d="M12 56q5 3 9 0" stroke="#1c6fb8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Balloon() {
  return (
    <g>
      <path d="M50 82C46 88 56 92 50 99" stroke="#9aa0b4" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="40" rx="30" ry="36" fill="#ef476f" />
      <ellipse cx="38" cy="26" rx="6" ry="11" fill="#fff" opacity=".4" transform="rotate(-25 38 26)" />
      <path d="M45 75h10l-5 7z" fill="#d6335c" />
    </g>
  );
}

function Ladybug() {
  return (
    <g>
      <path d="M42 12 34 4M58 12 66 4" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="22" r="14" fill={OUTLINE} />
      <circle cx="50" cy="58" r="36" fill="#e5383b" />
      <path d="M50 24v70" stroke={OUTLINE} strokeWidth="3" />
      <g fill={OUTLINE}>
        <circle cx="34" cy="44" r="7" />
        <circle cx="66" cy="44" r="7" />
        <circle cx="30" cy="66" r="6" />
        <circle cx="70" cy="66" r="6" />
        <circle cx="42" cy="82" r="5" />
        <circle cx="58" cy="82" r="5" />
      </g>
      <circle cx="44" cy="20" r="3" fill="#fff" />
      <circle cx="56" cy="20" r="3" fill="#fff" />
    </g>
  );
}

function Flower() {
  return (
    <g>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={50 + 24 * Math.sin((a * Math.PI) / 180)} cy={50 - 24 * Math.cos((a * Math.PI) / 180)} r="19" fill="#ff8fab" />
      ))}
      <circle cx="50" cy="50" r="15" fill="#ffd43b" />
      <circle cx="45" cy="47" r="2.4" fill="#6b4500" />
      <circle cx="55" cy="47" r="2.4" fill="#6b4500" />
      <path d="M45 54q5 4 10 0" stroke="#6b4500" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Car() {
  return (
    <g>
      <path d="M24 48 34 28h34l12 20Z" fill="#3b6fef" />
      <path d="M36 46 42 32h10v14ZM58 46V32h8l8 14Z" fill="#cfe8ff" />
      <rect x="6" y="46" width="88" height="28" rx="12" fill="#3b6fef" />
      <rect x="84" y="54" width="8" height="6" rx="2" fill="#ffd43b" />
      <circle cx="28" cy="76" r="12" fill={OUTLINE} />
      <circle cx="72" cy="76" r="12" fill={OUTLINE} />
      <circle cx="28" cy="76" r="5" fill="#ced4da" />
      <circle cx="72" cy="76" r="5" fill="#ced4da" />
    </g>
  );
}

function Bunny() {
  return (
    <g transform="translate(5 2) scale(.45)">
      <g stroke="#cfd4de" strokeWidth="6">
        <ellipse cx="70" cy="56" rx="22" ry="56" fill="#fff" transform="rotate(-10 70 56)" />
        <ellipse cx="132" cy="56" rx="22" ry="56" fill="#fff" transform="rotate(10 132 56)" />
      </g>
      <ellipse cx="70" cy="58" rx="10" ry="40" fill="#ffc2d1" transform="rotate(-10 70 58)" />
      <ellipse cx="132" cy="58" rx="10" ry="40" fill="#ffc2d1" transform="rotate(10 132 58)" />
      <ellipse cx="100" cy="146" rx="74" ry="64" fill="#fff" stroke="#cfd4de" strokeWidth="6" />
      <circle cx="74" cy="132" r="10" fill={OUTLINE} />
      <circle cx="126" cy="132" r="10" fill={OUTLINE} />
      <circle cx="77" cy="129" r="3.5" fill="#fff" />
      <circle cx="129" cy="129" r="3.5" fill="#fff" />
      <ellipse cx="58" cy="162" rx="13" ry="8" fill="#ffc2d1" />
      <ellipse cx="142" cy="162" rx="13" ry="8" fill="#ffc2d1" />
      <path d="M92 152h16l-8 9z" fill="#ff8fa3" />
      <path d="M88 172q12 12 24 0" stroke={OUTLINE} strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Moon() {
  return (
    <g>
      <path d="M60 8A42 42 0 1 0 92 72 34 34 0 1 1 60 8Z" fill="#ffd43b" stroke="#f0a500" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="40" cy="56" r="3.5" fill="#6b4500" />
      <path d="M36 66q6 4 12 0" stroke="#6b4500" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Sun() {
  return (
    <g>
      <g stroke="#ffa94d" strokeWidth="7" strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const r = (a * Math.PI) / 180;
          return <line key={a} x1={50 + 34 * Math.cos(r)} y1={50 + 34 * Math.sin(r)} x2={50 + 46 * Math.cos(r)} y2={50 + 46 * Math.sin(r)} />;
        })}
      </g>
      <circle cx="50" cy="50" r="26" fill="#ffc83d" />
      <circle cx="42" cy="46" r="3.5" fill="#6b4500" />
      <circle cx="58" cy="46" r="3.5" fill="#6b4500" />
      <path d="M42 56q8 6 16 0" stroke="#6b4500" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  );
}

const CLOUD = (
  <g>
    <circle cx="32" cy="58" r="20" />
    <circle cx="52" cy="44" r="24" />
    <circle cx="72" cy="58" r="20" />
    <rect x="22" y="56" width="60" height="22" rx="11" />
  </g>
);

function Cloud() {
  return (
    <g>
      <g fill="#b9c6dc" stroke="#b9c6dc" strokeWidth="6">
        {CLOUD}
      </g>
      <g fill="#fff">{CLOUD}</g>
    </g>
  );
}

function Dot({ color }) {
  return (
    <g>
      <circle cx="50" cy="50" r="38" fill={color} />
      <ellipse cx="36" cy="36" rx="9" ry="13" fill="#fff" opacity=".35" transform="rotate(-35 36 36)" />
    </g>
  );
}

export const DRAWINGS = {
  strawberry: Strawberry,
  apple: Apple,
  star: Star,
  duck: Duck,
  fish: Fish,
  balloon: Balloon,
  ladybug: Ladybug,
  flower: Flower,
  car: Car,
  bunny: Bunny,
  moon: Moon,
  sun: Sun,
  cloud: Cloud,
  red: () => <Dot color="#ef4444" />,
  blue: () => <Dot color="#3b6fef" />,
  yellow: () => <Dot color="#ffc83d" />,
  green: () => <Dot color="#2fae6b" />,
};

// One thing, `size` across. An id from DRAWINGS, or (from an older saved
// problem) an emoji, shown as text.
export function Thing({ id, size = 64 }) {
  const Drawing = DRAWINGS[id];
  if (!Drawing) {
    return (
      <span className="thing-emoji" style={{ fontSize: size * 0.8 }} aria-hidden="true">
        {id}
      </span>
    );
  }
  return (
    <svg className="thing" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <Drawing />
    </svg>
  );
}

// A hand holding up `fingers` (1-5): index first, then middle, ring,
// little finger and thumb, the way small children count on a hand.
const FINGERS = [
  { x: 27, top: 22, w: 17 },
  { x: 47, top: 10, w: 17 },
  { x: 67, top: 16, w: 17 },
  { x: 87, top: 34, w: 16 },
];
function handShape(fingers) {
  return (
    <>
      {FINGERS.map((f, i) => (
        <rect key={i} x={f.x} y={i < fingers ? f.top : 54} width={f.w} height={i < fingers ? 86 - f.top : 26} rx={f.w / 2} />
      ))}
      {fingers >= 5 ? (
        <rect x="4" y="70" width="17" height="48" rx="8.5" transform="rotate(-38 12 94)" />
      ) : (
        <rect x="16" y="74" width="17" height="30" rx="8.5" transform="rotate(-62 24 89)" />
      )}
      <rect x="24" y="58" width="80" height="74" rx="32" />
    </>
  );
}

export function Hand({ fingers = 5, size = 110 }) {
  return (
    <svg className="hand" viewBox="-10 0 130 140" width={size} height={(size * 140) / 130} aria-hidden="true">
      <g fill="#d99a6c" stroke="#d99a6c" strokeWidth="6">
        {handShape(fingers)}
      </g>
      <g fill="#ffcf9e">{handShape(fingers)}</g>
    </svg>
  );
}

// A small speaker, for "tap to hear it".
export function Speaker({ size = 26, color = '#fff' }) {
  return (
    <svg viewBox="0 0 30 24" width={size} height={(size * 24) / 30} aria-hidden="true">
      <path d="M0 7h7l9-7v24l-9-7H0z" fill={color} />
      <path d="M21 5a10 10 0 0 1 0 14M26 1a16 16 0 0 1 0 22" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
