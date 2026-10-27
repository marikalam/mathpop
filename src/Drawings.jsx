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


// Animal faces, all one shape: a head, ears, eyes, a snout or beak.
function Eyes({ y = 48, gap = 13, r = 5 }) {
  return (
    <g>
      <circle cx={50 - gap} cy={y} r={r} fill={OUTLINE} />
      <circle cx={50 + gap} cy={y} r={r} fill={OUTLINE} />
      <circle cx={51.5 - gap} cy={y - 1.6} r={r * 0.35} fill="#fff" />
      <circle cx={51.5 + gap} cy={y - 1.6} r={r * 0.35} fill="#fff" />
    </g>
  );
}
function Cheeks({ y = 60, color = '#ff9fb3' }) {
  return (
    <g fill={color} opacity=".75">
      <ellipse cx="27" cy={y} rx="6" ry="4" />
      <ellipse cx="73" cy={y} rx="6" ry="4" />
    </g>
  );
}
function Smile({ y = 64 }) {
  return <path d={`M44 ${y}q6 5 12 0`} stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />;
}

function Dog() {
  return (
    <g>
      <ellipse cx="20" cy="46" rx="12" ry="22" fill="#a0683e" transform="rotate(18 20 46)" />
      <ellipse cx="80" cy="46" rx="12" ry="22" fill="#a0683e" transform="rotate(-18 80 46)" />
      <circle cx="50" cy="54" r="34" fill="#e2b07a" />
      <ellipse cx="50" cy="66" rx="16" ry="12" fill="#f6dcc0" />
      <Eyes y={48} gap={13} />
      <ellipse cx="50" cy="60" rx="6" ry="4.5" fill={OUTLINE} />
      <path d="M44 67q6 5 12 0" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  );
}
function Cat() {
  return (
    <g>
      <path d="M18 44 22 10 44 28Z" fill="#f2a65a" />
      <path d="M82 44 78 10 56 28Z" fill="#f2a65a" />
      <path d="M24 34 26 18 37 28Z" fill="#ffc9a8" />
      <path d="M76 34 74 18 63 28Z" fill="#ffc9a8" />
      <circle cx="50" cy="56" r="34" fill="#f2a65a" />
      <path d="M40 26q10 6 20 0" stroke="#d98a3e" strokeWidth="4" fill="none" strokeLinecap="round" />
      <Eyes y={52} gap={13} />
      <path d="M46 60h8l-4 4z" fill="#ff8fa3" />
      <path d="M50 64q-5 6-10 2M50 64q5 6 10 2" stroke={OUTLINE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M24 60H10M24 66H12M76 60h14M76 66h12" stroke="#d98a3e" strokeWidth="2.2" strokeLinecap="round" />
    </g>
  );
}
function Frog() {
  return (
    <g>
      <circle cx="30" cy="30" r="15" fill="#5cc28b" />
      <circle cx="70" cy="30" r="15" fill="#5cc28b" />
      <ellipse cx="50" cy="60" rx="40" ry="30" fill="#5cc28b" />
      <circle cx="30" cy="30" r="9" fill="#fff" />
      <circle cx="70" cy="30" r="9" fill="#fff" />
      <circle cx="31" cy="31" r="5" fill={OUTLINE} />
      <circle cx="71" cy="31" r="5" fill={OUTLINE} />
      <path d="M30 66q20 14 40 0" stroke="#2f8a57" strokeWidth="4" fill="none" strokeLinecap="round" />
      <Cheeks y={62} />
    </g>
  );
}
function Monkey() {
  return (
    <g>
      <circle cx="16" cy="50" r="12" fill="#8a5a3c" />
      <circle cx="84" cy="50" r="12" fill="#8a5a3c" />
      <circle cx="16" cy="50" r="6" fill="#f2c9a0" />
      <circle cx="84" cy="50" r="6" fill="#f2c9a0" />
      <circle cx="50" cy="52" r="34" fill="#8a5a3c" />
      <path d="M50 40c-12-10-28-2-26 14 2 18 14 28 26 28s24-10 26-28c2-16-14-24-26-14z" fill="#f2c9a0" />
      <Eyes y={50} gap={11} />
      <path d="M44 64q6 6 12 0" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="46" cy="58" r="1.6" fill={OUTLINE} />
      <circle cx="54" cy="58" r="1.6" fill={OUTLINE} />
    </g>
  );
}
function Pig() {
  return (
    <g>
      <path d="M20 36 18 12 40 26Z" fill="#f59ab5" />
      <path d="M80 36 82 12 60 26Z" fill="#f59ab5" />
      <circle cx="50" cy="54" r="34" fill="#ffb8cc" />
      <Eyes y={46} gap={14} />
      <ellipse cx="50" cy="62" rx="14" ry="10" fill="#f59ab5" />
      <ellipse cx="45" cy="62" rx="3" ry="4" fill="#c2577a" />
      <ellipse cx="55" cy="62" rx="3" ry="4" fill="#c2577a" />
    </g>
  );
}
function Chicken() {
  return (
    <g>
      <path d="M40 16q4-10 10-2 6-10 10 2 10-2 6 10H34q-4-12 6-10z" fill="#ef4444" />
      <circle cx="50" cy="54" r="34" fill="#fff4d6" stroke="#f0d9a0" strokeWidth="3" />
      <Eyes y={48} gap={13} />
      <path d="M42 56h16l-8 10z" fill="#ffa94d" />
      <path d="M46 66q4 8 8 0" fill="#ef4444" />
      <Cheeks y={60} />
    </g>
  );
}
function Bear() {
  return (
    <g>
      <circle cx="22" cy="26" r="13" fill="#9c6b45" />
      <circle cx="78" cy="26" r="13" fill="#9c6b45" />
      <circle cx="22" cy="26" r="6" fill="#d9a77a" />
      <circle cx="78" cy="26" r="6" fill="#d9a77a" />
      <circle cx="50" cy="54" r="36" fill="#9c6b45" />
      <ellipse cx="50" cy="66" rx="16" ry="12" fill="#d9a77a" />
      <Eyes y={48} gap={14} />
      <ellipse cx="50" cy="61" rx="6" ry="4.5" fill={OUTLINE} />
      <path d="M45 68q5 4 10 0" stroke={OUTLINE} strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </g>
  );
}
function Fox() {
  return (
    <g>
      <path d="M14 46 18 8 44 30Z" fill="#f08a3c" />
      <path d="M86 46 82 8 56 30Z" fill="#f08a3c" />
      <path d="M50 92C26 92 14 72 16 56c2-16 16-26 34-26s32 10 34 26c2 16-10 36-34 36z" fill="#f08a3c" />
      <path d="M50 92c-14 0-24-8-26-20 10 4 18 0 26-8 8 8 16 12 26 8-2 12-12 20-26 20z" fill="#fff3e6" />
      <Eyes y={56} gap={13} />
      <ellipse cx="50" cy="70" rx="5" ry="4" fill={OUTLINE} />
    </g>
  );
}
function Panda() {
  return (
    <g>
      <circle cx="22" cy="24" r="13" fill={OUTLINE} />
      <circle cx="78" cy="24" r="13" fill={OUTLINE} />
      <circle cx="50" cy="54" r="36" fill="#fff" stroke="#e3e6ee" strokeWidth="3" />
      <ellipse cx="36" cy="50" rx="10" ry="12" fill={OUTLINE} transform="rotate(-20 36 50)" />
      <ellipse cx="64" cy="50" rx="10" ry="12" fill={OUTLINE} transform="rotate(20 64 50)" />
      <circle cx="38" cy="50" r="4" fill="#fff" />
      <circle cx="62" cy="50" r="4" fill="#fff" />
      <ellipse cx="50" cy="64" rx="5" ry="3.5" fill={OUTLINE} />
      <path d="M45 70q5 4 10 0" stroke={OUTLINE} strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </g>
  );
}
function Cookie() {
  return (
    <g>
      <circle cx="50" cy="50" r="40" fill="#d18b47" />
      <circle cx="50" cy="50" r="34" fill="#e6a35e" />
      {[[36, 38], [60, 34], [46, 56], [66, 58], [34, 64], [54, 74]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="5" fill="#5a3a1e" />
      ))}
    </g>
  );
}
function Cupcake() {
  return (
    <g>
      <path d="M24 52h52l-8 40H32z" fill="#74c0fc" />
      <path d="M38 54l2 36M50 54v36M62 54l-2 36" stroke="#4dabf7" strokeWidth="3" />
      <path d="M20 54c-6-10 4-20 12-18 0-12 16-16 20-8 6-8 22-2 18 8 10 0 14 10 8 18z" fill="#ffc9de" />
      <circle cx="52" cy="18" r="7" fill="#ef4444" />
    </g>
  );
}
function Ball() {
  return (
    <g>
      <circle cx="50" cy="50" r="40" fill="#fff" stroke={OUTLINE} strokeWidth="3" />
      <path d="M50 34l14 10-5 16H41l-5-16z" fill={OUTLINE} />
      <path d="M50 34V12M64 44l20-6M59 60l12 18M41 60 29 78M36 44l-20-6" stroke={OUTLINE} strokeWidth="3" />
    </g>
  );
}
function Donut() {
  return (
    <g>
      <circle cx="50" cy="52" r="40" fill="#e6a35e" />
      <path d="M50 16c20 0 36 14 36 32 0 6-4 8-8 6-4-2-6 4-10 2s-4-6-8-4-6 6-10 4-4-6-8-4-6 6-10 4-4-6-8-4-4 4-8 2-6-6-6-6c0-18 16-32 40-32z" fill="#ff8fb8" />
      <circle cx="50" cy="52" r="12" fill="#fff" />
      {[[30, 34, '#ffd43b'], [44, 26, '#4dabf7'], [62, 30, '#69db7c'], [72, 42, '#ffd43b'], [28, 48, '#4dabf7']].map(([x, y, c]) => (
        <rect key={`${x}${y}`} x={x} y={y} width="7" height="3" rx="1.5" fill={c} transform={`rotate(30 ${x} ${y})`} />
      ))}
    </g>
  );
}
function Butterfly() {
  return (
    <g>
      <ellipse cx="30" cy="36" rx="20" ry="22" fill="#9b7cf0" />
      <ellipse cx="70" cy="36" rx="20" ry="22" fill="#9b7cf0" />
      <ellipse cx="32" cy="70" rx="16" ry="16" fill="#ff9ec4" />
      <ellipse cx="68" cy="70" rx="16" ry="16" fill="#ff9ec4" />
      <circle cx="30" cy="36" r="7" fill="#ffd43b" />
      <circle cx="70" cy="36" r="7" fill="#ffd43b" />
      <rect x="45" y="22" width="10" height="62" rx="5" fill={OUTLINE} />
      <path d="M48 22 40 8M52 22l8-14" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}
function Turtle() {
  return (
    <g>
      <circle cx="84" cy="56" r="11" fill="#7fcf8e" />
      <circle cx="87" cy="53" r="2.4" fill={OUTLINE} />
      <ellipse cx="26" cy="78" rx="9" ry="7" fill="#7fcf8e" />
      <ellipse cx="68" cy="78" rx="9" ry="7" fill="#7fcf8e" />
      <path d="M10 70C10 40 30 26 46 26s34 14 34 44z" fill="#3f9b5b" />
      <path d="M46 32 34 46l12 14 12-14zM24 54l10-8 12 14-6 10H18zM68 54l-10-8-12 14 6 10h22z" fill="#58b874" />
    </g>
  );
}
function Banana() {
  return (
    <g>
      <path d="M18 30c4 34 30 54 66 46-6 10-24 16-40 10C24 78 10 56 12 30z" fill="#ffd43b" stroke="#f0b400" strokeWidth="3" strokeLinejoin="round" />
      <path d="M14 30 12 18l8 2z" fill="#7a5a3a" />
    </g>
  );
}
function Grapes() {
  return (
    <g>
      <path d="M50 18q6-10 18-8" stroke="#2f8a57" strokeWidth="5" fill="none" strokeLinecap="round" />
      {[[38, 30], [62, 30], [50, 30], [32, 46], [50, 46], [68, 46], [40, 62], [60, 62], [50, 78]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="11" fill="#9b6ae0" stroke="#7b4cc0" strokeWidth="2" />
      ))}
    </g>
  );
}
function Orange() {
  return (
    <g>
      <circle cx="50" cy="56" r="36" fill="#ff9f43" />
      <ellipse cx="36" cy="44" rx="7" ry="10" fill="#fff" opacity=".3" transform="rotate(-25 36 44)" />
      <path d="M50 22c6-8 18-10 22-4-6 6-16 6-22 4z" fill="#3aa655" />
    </g>
  );
}
function Bus() {
  return (
    <g>
      <rect x="8" y="22" width="84" height="54" rx="10" fill="#ffc233" />
      <rect x="14" y="30" width="16" height="16" rx="3" fill="#cfe8ff" />
      <rect x="34" y="30" width="16" height="16" rx="3" fill="#cfe8ff" />
      <rect x="54" y="30" width="16" height="16" rx="3" fill="#cfe8ff" />
      <rect x="74" y="30" width="12" height="30" rx="3" fill="#cfe8ff" />
      <path d="M8 56h84" stroke="#e0a000" strokeWidth="4" />
      <circle cx="28" cy="78" r="10" fill={OUTLINE} />
      <circle cx="72" cy="78" r="10" fill={OUTLINE} />
      <circle cx="28" cy="78" r="4" fill="#ced4da" />
      <circle cx="72" cy="78" r="4" fill="#ced4da" />
    </g>
  );
}
function Walk() {
  return (
    <g stroke="#3b6fef" strokeWidth="9" strokeLinecap="round" fill="none">
      <circle cx="54" cy="16" r="10" fill="#f5c9a0" stroke="none" />
      <path d="M52 32 46 60" />
      <path d="M46 60 34 88M46 60l16 26" />
      <path d="M50 38 32 50M50 38l18 12" />
    </g>
  );
}
function Bike() {
  return (
    <g>
      <circle cx="24" cy="66" r="18" fill="none" stroke={OUTLINE} strokeWidth="5" />
      <circle cx="76" cy="66" r="18" fill="none" stroke={OUTLINE} strokeWidth="5" />
      <path d="M24 66 42 38h30L76 66M42 38l14 28L72 38M56 66H24" stroke="#ef4444" strokeWidth="5" fill="none" strokeLinejoin="round" />
      <path d="M38 30h10M70 38l-4-12h10" stroke={OUTLINE} strokeWidth="5" strokeLinecap="round" fill="none" />
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
  black: () => <Dot color="#343a40" />,
  dog: Dog,
  cat: Cat,
  frog: Frog,
  monkey: Monkey,
  pig: Pig,
  chicken: Chicken,
  bear: Bear,
  fox: Fox,
  panda: Panda,
  cookie: Cookie,
  cupcake: Cupcake,
  ball: Ball,
  donut: Donut,
  butterfly: Butterfly,
  turtle: Turtle,
  banana: Banana,
  grapes: Grapes,
  orange: Orange,
  bus: Bus,
  walk: Walk,
  bike: Bike,
};

// Pictures that older versions stored as emoji (saved mistakes, and
// words in problem text), drawn instead.
export const EMOJI_DRAWING = {
  '🍓': 'strawberry', '🍎': 'apple', '⭐': 'star', '🦆': 'duck', '🐟': 'fish', '🎈': 'balloon', '🐞': 'ladybug',
  '🌸': 'flower', '🚗': 'car', '🐰': 'bunny', '🌙': 'moon', '☀️': 'sun', '☀': 'sun', '☁️': 'cloud', '☁': 'cloud',
  '🔴': 'red', '🔵': 'blue', '🟡': 'yellow', '🟢': 'green', '⚫': 'black', '🐶': 'dog', '🐱': 'cat', '🐸': 'frog',
  '🐵': 'monkey', '🐷': 'pig', '🐔': 'chicken', '🐻': 'bear', '🦊': 'fox', '🐼': 'panda', '🍪': 'cookie',
  '🧁': 'cupcake', '⚽': 'ball', '🍩': 'donut', '🦋': 'butterfly', '🐢': 'turtle', '🍌': 'banana', '🍇': 'grapes',
  '🍊': 'orange', '🚌': 'bus', '🚶': 'walk', '🚲': 'bike', '🐘': 'bear', '🐳': 'fish', '🏠': 'car', '🌳': 'flower',
};
const EMOJI_RE = new RegExp(`(${Object.keys(EMOJI_DRAWING).sort((a, b) => b.length - a.length).join('|')})`, 'u');

// Text with pictures in it: any of those emoji (or a "{{cat}}" marker)
// becomes its drawing, `size` across, in line with the words.
export function RichText({ text, size = 28 }) {
  if (text === null || text === undefined) return null;
  const str = String(text);
  const re = new RegExp(`\\{\\{(\\w+)\\}\\}|${EMOJI_RE.source}`, 'gu');
  const out = [];
  let last = 0;
  let m;
  while ((m = re.exec(str))) {
    if (m.index > last) out.push(str.slice(last, m.index));
    const id = m[1] || EMOJI_DRAWING[m[2]];
    out.push(<Thing key={m.index} id={id} size={size} inline />);
    last = m.index + m[0].length;
  }
  if (!out.length) return str;
  if (last < str.length) out.push(str.slice(last));
  return <>{out}</>;
}

// One thing, `size` across: an id from DRAWINGS, or (from an older saved
// problem) the emoji it replaced.
export function Thing({ id, size = 64, inline = false }) {
  const Drawing = DRAWINGS[id] || DRAWINGS[EMOJI_DRAWING[id]];
  if (!Drawing) {
    // Not a picture after all (a word or number): show it as text.
    return <span className="thing-text">{id}</span>;
  }
  return (
    <svg className={`thing${inline ? ' thing-inline' : ''}`} viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
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
