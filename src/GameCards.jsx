// The home page's game cards: a bold title over a big picture, like a
// game shelf. Each game has a background, a title color and a picture
// (an SVG drawn to fill the bottom of the card, 160 × 110).

const T = ({ x, y, s = 20, c = '#fff', children, w = 700, stroke }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor="middle" dominantBaseline="central" fontFamily="Fredoka, ui-rounded, system-ui, sans-serif" stroke={stroke} strokeWidth={stroke ? 3 : 0} paintOrder="stroke">
    {children}
  </text>
);
// A rounded number tile with a darker bottom edge.
const Tile = ({ x, y, w = 34, h = 34, fill, label, s = 18, c = '#fff', r = 8, rot = 0 }) => (
  <g transform={`rotate(${rot} ${x + w / 2} ${y + h / 2})`}>
    <rect x={x} y={y + 3} width={w} height={h} rx={r} fill="rgba(0,0,0,0.22)" />
    <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} />
    {label !== undefined && (
      <T x={x + w / 2} y={y + h / 2 + 1} s={s} c={c}>
        {label}
      </T>
    )}
  </g>
);
const Fruit = ({ x, y, r = 16, fill = '#ef4444', label, s = 16 }) => (
  <g>
    <circle cx={x} cy={y + 2} r={r} fill="rgba(0,0,0,0.18)" />
    <circle cx={x} cy={y} r={r} fill={fill} />
    <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.28} fill="rgba(255,255,255,0.45)" />
    <path d={`M${x} ${y - r} q4 -8 10 -8 q-2 7 -10 8`} fill="#22c55e" />
    {label !== undefined && (
      <T x={x} y={y + 1} s={s}>
        {label}
      </T>
    )}
  </g>
);
const Pipish = ({ x, y, r = 16 }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="#5aa9ff" stroke="#fff" strokeWidth="2.5" />
    <circle cx={x - r * 0.35} cy={y - r * 0.4} r={r * 0.25} fill="rgba(255,255,255,0.7)" />
    <circle cx={x - r * 0.3} cy={y + 1} r={r * 0.13} fill="#173a66" />
    <circle cx={x + r * 0.3} cy={y + 1} r={r * 0.13} fill="#173a66" />
    <path d={`M${x - r * 0.3} ${y + r * 0.35} q${r * 0.3} ${r * 0.3} ${r * 0.6} 0`} stroke="#173a66" strokeWidth="2" fill="none" strokeLinecap="round" />
  </g>
);
const Star = ({ x, y, r = 10, fill = '#ffd23f' }) => (
  <path
    d={Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      return `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)}`;
    }).join(' ') + 'Z'}
    fill={fill}
  />
);

const ART = {
  madminute: (
    <g>
      <circle cx="80" cy="64" r="40" fill="#fff" />
      <circle cx="80" cy="64" r="40" fill="none" stroke="#173a66" strokeWidth="6" />
      <rect x="72" y="14" width="16" height="10" rx="3" fill="#173a66" />
      <path d="M80 64 L80 36" stroke="#e5484d" strokeWidth="6" strokeLinecap="round" />
      <path d="M80 64 L100 74" stroke="#173a66" strokeWidth="5" strokeLinecap="round" />
      <T x="34" y="98" s={18} c="#fff" stroke="#c43c3c">3×4</T>
      <T x="128" y="98" s={18} c="#fff" stroke="#c43c3c">9+6</T>
    </g>
  ),
  bubbles: (
    <g>
      {[
        [40, 70, 26, '#7cc4ff', 7],
        [104, 52, 30, '#a98bff', 12],
        [70, 30, 18, '#7fe3c1', 3],
        [132, 92, 16, '#ffb3c8', 5],
      ].map(([x, y, r, c, v]) => (
        <g key={x}>
          <circle cx={x} cy={y} r={r} fill={c} stroke="#fff" strokeWidth="3" />
          <circle cx={x - r * 0.4} cy={y - r * 0.4} r={r * 0.22} fill="rgba(255,255,255,0.7)" />
          <T x={x} y={y + 1} s={r * 0.9}>
            {v}
          </T>
        </g>
      ))}
    </g>
  ),
  make10: (
    <g>
      <Tile x={22} y={36} w={50} h={56} fill="#fff" label="3" c="#2a9e60" s={32} rot={-8} />
      <Tile x={88} y={36} w={50} h={56} fill="#fff" label="7" c="#2a9e60" s={32} rot={8} />
      <T x="80" y="20" s={20} c="#ffd23f" stroke="#1f7a4a">= 10!</T>
    </g>
  ),
  bakery: (
    <g>
      <rect x="18" y="70" width="124" height="34" rx="6" fill="#fff4dc" />
      {[34, 66, 98, 130].map((x, i) => (
        <g key={x}>
          <path d={`M${x - 13} 66 h26 l-4 22 h-18 z`} fill="#f4a261" />
          <circle cx={x} cy={58} r={13} fill={['#ff8fb1', '#fff', '#c4a1ff', '#ffd23f'][i]} />
          <circle cx={x + 2} cy={46} r={4} fill="#e5484d" />
        </g>
      ))}
      <T x="80" y="20" s={18} c="#fff" stroke="#b9770e">4 × 2 = 8</T>
    </g>
  ),
  snake: (
    <g>
      <path d="M16 96 C40 60 70 110 92 70 S120 30 138 40" stroke="#1f8a51" strokeWidth="24" fill="none" strokeLinecap="round" />
      <path d="M16 96 C40 60 70 110 92 70 S120 30 138 40" stroke="#5be08f" strokeWidth="18" fill="none" strokeLinecap="round" />
      <circle cx="140" cy="38" r="16" fill="#5be08f" stroke="#1f8a51" strokeWidth="3" />
      <circle cx="145" cy="33" r="4" fill="#fff" />
      <circle cx="146" cy="33" r="2" fill="#173a66" />
      <Fruit x={50} y={36} r={15} label="7" />
      <Fruit x={104} y={98} r={13} fill="#a855f7" label="9" s={13} />
    </g>
  ),
  snipDrop: (
    <g>
      <path d="M80 0 Q86 30 80 46" stroke="#8a5a2b" strokeWidth="3" fill="none" />
      <circle cx="80" cy="54" r="12" fill="#ff6b9a" stroke="#fff" strokeWidth="2" />
      <path d="M66 54 l-8 -6 v12z M94 54 l8 -6 v12z" fill="#ff6b9a" />
      {[
        [30, '6'],
        [80, '4'],
        [130, '8'],
      ].map(([x, v]) => (
        <g key={x}>
          <path d={`M${x - 20} 84 h40 l-5 24 h-30 z`} fill="#c97b3d" />
          <T x={x} y={96} s={16}>
            {v}
          </T>
        </g>
      ))}
    </g>
  ),
  pipHop: (
    <g>
      {[
        [34, 98, '2'],
        [100, 72, '4'],
        [50, 44, '6'],
        [118, 18, '8'],
      ].map(([x, y, v]) => (
        <g key={v}>
          <ellipse cx={x} cy={y} rx="26" ry="11" fill="#fff" />
          <T x={x} y={y} s={14} c="#0284c7">
            {v}
          </T>
        </g>
      ))}
      <Pipish x={88} y={46} r={14} />
    </g>
  ),
  numberRun: (
    <g>
      <path d="M50 110 L72 10 H88 L110 110 Z" fill="#fde68a" />
      <path d="M80 18 V110" stroke="#fff" strokeWidth="3" strokeDasharray="8 8" />
      {[
        [40, '12'],
        [80, '15'],
        [120, '13'],
      ].map(([x, v]) => (
        <g key={x}>
          <rect x={x - 17} y={26} width={34} height={28} rx="6" fill="#fff" stroke="#d97706" strokeWidth="3" />
          <T x={x} y={40} s={15} c="#d97706">
            {v}
          </T>
        </g>
      ))}
      <Pipish x={80} y={88} r={15} />
    </g>
  ),
  gardenGuard: (
    <g>
      <rect x="0" y="86" width="160" height="24" fill="#4ade80" />
      {[22, 40, 58].map((x) => (
        <g key={x}>
          <path d={`M${x} 86 V70`} stroke="#15803d" strokeWidth="3" />
          <circle cx={x} cy={66} r="7" fill={['#f472b6', '#ffd23f', '#fb923c'][x % 3]} />
        </g>
      ))}
      <ellipse cx="116" cy="82" rx="26" ry="8" fill="#d6c4a8" />
      <circle cx="118" cy="66" r="20" fill="#f59e0b" stroke="#fff" strokeWidth="3" />
      <T x="118" y="67" s={14}>
        3+4
      </T>
      <path d="M140 76 l8 -14 M146 76 l6 -12" stroke="#d6c4a8" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  popDefense: (
    <g>
      {[
        [40, 50, '#ff6b9a', '6'],
        [84, 34, '#ffd23f', '9'],
        [124, 58, '#3b8cf0', '12'],
      ].map(([x, y, c, v]) => (
        <g key={v}>
          <ellipse cx={x} cy={y} rx="18" ry="22" fill={c} />
          <path d={`M${x} ${y + 22} q4 10 0 22`} stroke="#fff" strokeWidth="2" fill="none" />
          <T x={x} y={y} s={16}>
            {v}
          </T>
        </g>
      ))}
    </g>
  ),
  sweetTens: (
    <g>
      {[
        [14, 20, '#ff6b9a', '3'],
        [56, 20, '#3b8cf0', '5'],
        [98, 20, '#ffb000', '2'],
        [14, 64, '#2fae6b', '4'],
        [56, 64, '#ff6b9a', '6'],
        [98, 64, '#9b6bf2', '1'],
      ].map(([x, y, c, v]) => (
        <Tile key={`${x}${y}`} x={x + 6} y={y} w={38} h={38} r={14} fill={c} label={v} s={20} />
      ))}
    </g>
  ),
  numberKeys: (
    <g>
      {[0, 1, 2, 3].map((k) => (
        <rect key={k} x={10 + k * 37} y="6" width="34" height="104" fill={k === 1 ? '#312e81' : '#e0e7ff'} rx="4" />
      ))}
      <Tile x={47} y={20} w={34} h={44} fill="#22d3ee" label="5" r={6} />
      <Tile x={121} y={56} w={34} h={44} fill="#f472b6" label="10" s={15} r={6} />
    </g>
  ),
  pipLaunch: (
    <g>
      <path d="M20 96 H150" stroke="#173a66" strokeWidth="4" />
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <path key={k} d={`M${30 + k * 24} 90 V102`} stroke="#173a66" strokeWidth="3" />
      ))}
      <path d="M26 86 Q70 0 110 84" stroke="#173a66" strokeWidth="2.5" strokeDasharray="5 6" fill="none" />
      <Pipish x={110} y={78} r={13} />
      <path d="M14 96 V64 M14 64 l-8 -12 M14 64 l8 -12" stroke="#8a5a2b" strokeWidth="5" strokeLinecap="round" />
    </g>
  ),
  shapeDash: (
    <g>
      <rect x="0" y="92" width="160" height="18" fill="#1e1b4b" />
      <path d="M40 92 l12 -22 l12 22z" fill="#f472b6" />
      <rect x="96" y="28" width="44" height="56" rx="10" fill="rgba(255,255,255,0.18)" stroke="#fde047" strokeWidth="3" />
      <path d="M118 42 l13 8 v14 l-13 8 l-13 -8 v-14z" fill="#38bdf8" />
      <Pipish x={78} y={56} r={14} />
    </g>
  ),
  fruitSlice: (
    <g>
      <Fruit x={42} y={60} r={24} fill="#22c55e" label="12" s={18} />
      <Fruit x={112} y={44} r={22} fill="#f97316" label="8" s={18} />
      <path d="M10 104 L150 18" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
    </g>
  ),
  goFish: (
    <g>
      {[
        [22, -10, '3'],
        [62, 0, '?'],
        [102, 10, '3'],
      ].map(([x, r, v]) => (
        <g key={x} transform={`rotate(${r} ${x + 20} 64)`}>
          <rect x={x} y="28" width="40" height="58" rx="7" fill={v === '?' ? '#0e7490' : '#fff'} stroke="#fff" strokeWidth="3" />
          <T x={x + 20} y={57} s={24} c={v === '?' ? '#fff' : '#0e7490'}>
            {v}
          </T>
        </g>
      ))}
    </g>
  ),
  toyShop: (
    <g>
      {[
        [44, 64, 26, '#e2e8f0', '25¢'],
        [100, 58, 22, '#cbd5e1', '10¢'],
        [76, 92, 18, '#d6a26a', '1¢'],
      ].map(([x, y, r, c, v]) => (
        <g key={v}>
          <circle cx={x} cy={y + 3} r={r} fill="rgba(0,0,0,0.2)" />
          <circle cx={x} cy={y} r={r} fill={c} stroke="#94a3b8" strokeWidth="2.5" />
          <T x={x} y={y} s={r * 0.6} c="#475569">
            {v}
          </T>
        </g>
      ))}
      <path d="M118 14 l14 0 l4 10 h-22z" fill="#ff6b9a" />
      <rect x="114" y="24" width="26" height="22" rx="4" fill="#fff" />
    </g>
  ),
  clock: (
    <g>
      <circle cx="80" cy="60" r="44" fill="#fff" stroke="#ffd23f" strokeWidth="7" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return <circle key={i} cx={80 + Math.sin(a) * 34} cy={60 - Math.cos(a) * 34} r="2.6" fill="#173a66" />;
      })}
      <path d="M80 60 V30 M80 60 l18 10" stroke="#173a66" strokeWidth="5" strokeLinecap="round" />
      <circle cx="80" cy="60" r="4" fill="#e5484d" />
    </g>
  ),
  shapes: (
    <g>
      <Star x={50} y={56} r={30} />
      <path d="M100 86 l20 -36 l20 36z" fill="#fff" />
      <circle cx="122" cy="30" r="14" fill="#7cc4ff" />
      <rect x="18" y="86" width="22" height="22" rx="4" fill="#a7f3d0" />
    </g>
  ),
  bondPop: (
    <g>
      <path d="M80 34 L44 86 M80 34 L116 86" stroke="#fff" strokeWidth="5" />
      <circle cx="80" cy="30" r="22" fill="#fff" />
      <T x="80" y="31" s={20} c="#e08a00">
        10
      </T>
      <circle cx="44" cy="88" r="18" fill="#fff" />
      <T x="44" y="89" s={18} c="#e08a00">
        6
      </T>
      <circle cx="116" cy="88" r="18" fill="#ffe7a0" stroke="#fff" strokeWidth="3" strokeDasharray="5 4" />
      <T x="116" y="89" s={18} c="#e08a00">
        ?
      </T>
    </g>
  ),
  makeTen: (
    <g>
      <T x="80" y="30" s={26}>
        8 + 5
      </T>
      <T x="80" y="62" s={18} c="rgba(255,255,255,0.85)">
        = 10 + 3
      </T>
      <Tile x={50} y={78} w={60} h={28} fill="#fff" label="13" c="#0f9384" s={18} />
    </g>
  ),
  barModel: (
    <g>
      <rect x="16" y="34" width="80" height="26" rx="5" fill="#ffd23f" />
      <rect x="96" y="34" width="48" height="26" rx="5" fill="#ff8fb1" />
      <T x="56" y="47" s={16} c="#7a4a00">
        8
      </T>
      <T x="120" y="47" s={16} c="#8a1f45">
        5
      </T>
      <path d="M16 72 q64 18 128 0" stroke="#fff" strokeWidth="3" fill="none" />
      <T x="80" y="94" s={20}>
        ?
      </T>
    </g>
  ),
  sumGridRush: (
    <g>
      {[0, 1, 2].map((c) =>
        [0, 1].map((r) => <Tile key={`${c}${r}`} x={24 + c * 40} y={20 + r * 42} w={34} h={34} fill={r && c === 1 ? '#ffe7a0' : '#fff'} label={r && c === 1 ? '?' : [[3, 6, 8], [7, 4, 2]][r][c]} c="#6f35b8" />),
      )}
      <T x="80" y="104" s={14} c="rgba(255,255,255,0.9)">
        each column = 10
      </T>
    </g>
  ),
  patternStreak: (
    <g>
      <circle cx="26" cy="58" r="14" fill="#fff" />
      <path d="M48 72 l14 -26 l14 26z" fill="#ffd23f" />
      <circle cx="98" cy="58" r="14" fill="#fff" />
      <path d="M120 72 l14 -26 l14 26z" fill="rgba(255,255,255,0.35)" stroke="#fff" strokeWidth="2" strokeDasharray="4 3" />
      <T x="134" y="64" s={14}>
        ?
      </T>
    </g>
  ),
  equalDiff: (
    <g>
      <T x="80" y="36" s={24}>
        43 − 19
      </T>
      <T x="80" y="70" s={24} c="#fde68a">
        44 − 20
      </T>
      <T x="80" y="98" s={14} c="rgba(255,255,255,0.85)">
        +1 both
      </T>
    </g>
  ),
  timesTiles: (
    <g>
      <Tile x={18} y={30} w={56} h={40} fill="#fff" label="3 × 4" c="#7c3fc4" s={16} rot={-6} />
      <Tile x={88} y={50} w={50} h={40} fill="#ffd23f" label="12" c="#7c3fc4" s={20} rot={6} />
    </g>
  ),
  pizza: (
    <g>
      <circle cx="80" cy="62" r="44" fill="#e9b872" />
      <circle cx="80" cy="62" r="38" fill="#ffd166" />
      <path d="M80 62 L80 24 A38 38 0 0 1 118 62 Z" fill="#e5484d" />
      {[
        [62, 50],
        [96, 82],
        [64, 84],
        [100, 44],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="5" fill="#b91c1c" />
      ))}
    </g>
  ),
  logicLock: (
    <g>
      <path d="M58 52 V36 a22 22 0 0 1 44 0 V52" stroke="#cbd5e1" strokeWidth="9" fill="none" />
      <rect x="40" y="50" width="80" height="58" rx="12" fill="#ffd23f" />
      {[0, 1, 2].map((k) => (
        <Tile key={k} x={50 + k * 21} y={64} w={18} h={26} fill="#fff" label={[4, 7, 2][k]} c="#334155" s={14} r={4} />
      ))}
    </g>
  ),
  chess: (
    <g>
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x={16 + (i % 4) * 32} y={46 + Math.floor(i / 4) * 16} width="32" height="16" fill={(i + Math.floor(i / 4)) % 2 ? '#b58863' : '#f0d9b5'} opacity="0.9" />
      ))}
      <g transform="translate(30 18) scale(1.6)">
        <path d="M10 33h20v-4h-2l-1-11h2V9h-4v3h-3V9h-4v3h-3V9h-4v9h2l-1 11h-2z" fill="#fff" stroke="#173a66" strokeWidth="2" strokeLinejoin="round" />
      </g>
      <g transform="translate(78 30) scale(1.3)">
        <path d="M20 8a5 5 0 0 1 3 9c3 2 4 6 5 11h3v5H9v-5h3c1-5 2-9 5-11a5 5 0 0 1 3-9z" fill="#2b3040" stroke="#0b0d14" strokeWidth="2" strokeLinejoin="round" />
      </g>
    </g>
  ),
  checkers: (
    <g>
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={20 + (i % 4) * 30} y={30 + Math.floor(i / 4) * 27} width="30" height="27" fill={(i + Math.floor(i / 4)) % 2 ? '#1f2937' : '#f5e6c8'} />
      ))}
      {[
        [65, 70, '#e5484d'],
        [95, 43, '#2b3040'],
        [35, 97, '#e5484d'],
        [125, 97, '#2b3040'],
      ].map(([x, y, c]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y + 3} r="12" fill="rgba(0,0,0,0.35)" />
          <circle cx={x} cy={y} r="12" fill={c} />
          <circle cx={x} cy={y} r="7.5" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
        </g>
      ))}
      <path d="M65 70 Q80 40 95 43" stroke="#ffd23f" strokeWidth="3" strokeDasharray="4 4" fill="none" />
    </g>
  ),
  piMemory: (
    <g>
      <circle cx="56" cy="62" r="38" fill="#fde68a" stroke="#f59e0b" strokeWidth="6" />
      <path d="M56 62 L56 24 A38 38 0 0 1 89 43 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="3" />
      {[[42, 50], [64, 72], [46, 80], [70, 50]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="5" fill="#e5484d" />
      ))}
      <text x="124" y="70" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="800" fontSize="54" fill="#fff">π</text>
      <text x="124" y="100" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="15" fill="#fde68a">3.14159</text>
    </g>
  ),
  cubeCoach: (
    <g>
      <path d="M80.0 14.0 L94.0 22.0 L80.0 30.0 L66.0 22.0z" fill="#ffffff" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M94.0 22.0 L108.0 30.0 L94.0 38.0 L80.0 30.0z" fill="#ffd500" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M108.0 30.0 L122.0 38.0 L108.0 46.0 L94.0 38.0z" fill="#ffffff" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M66.0 22.0 L80.0 30.0 L66.0 38.0 L52.0 30.0z" fill="#009b48" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M80.0 30.0 L94.0 38.0 L80.0 46.0 L66.0 38.0z" fill="#ffffff" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M94.0 38.0 L108.0 46.0 L94.0 54.0 L80.0 46.0z" fill="#0046ad" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M52.0 30.0 L66.0 38.0 L52.0 46.0 L38.0 38.0z" fill="#ffffff" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M66.0 38.0 L80.0 46.0 L66.0 54.0 L52.0 46.0z" fill="#d10f1f" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M80.0 46.0 L94.0 54.0 L80.0 62.0 L66.0 54.0z" fill="#ffffff" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M38.0 38.0 L52.0 46.0 L52.0 63.0 L38.0 55.0z" fill="#ffd500" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M52.0 46.0 L66.0 54.0 L66.0 71.0 L52.0 63.0z" fill="#009b48" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M66.0 54.0 L80.0 62.0 L80.0 79.0 L66.0 71.0z" fill="#d10f1f" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M38.0 55.0 L52.0 63.0 L52.0 80.0 L38.0 72.0z" fill="#ffffff" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M52.0 63.0 L66.0 71.0 L66.0 88.0 L52.0 80.0z" fill="#0046ad" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M66.0 71.0 L80.0 79.0 L80.0 96.0 L66.0 88.0z" fill="#ffd500" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M38.0 72.0 L52.0 80.0 L52.0 97.0 L38.0 89.0z" fill="#ff6a00" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M52.0 80.0 L66.0 88.0 L66.0 105.0 L52.0 97.0z" fill="#d10f1f" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M66.0 88.0 L80.0 96.0 L80.0 113.0 L66.0 105.0z" fill="#009b48" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M80.0 62.0 L94.0 54.0 L94.0 71.0 L80.0 79.0z" fill="#d10f1f" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M94.0 54.0 L108.0 46.0 L108.0 63.0 L94.0 71.0z" fill="#009b48" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M108.0 46.0 L122.0 38.0 L122.0 55.0 L108.0 63.0z" fill="#ffd500" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M80.0 79.0 L94.0 71.0 L94.0 88.0 L80.0 96.0z" fill="#ffd500" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M94.0 71.0 L108.0 63.0 L108.0 80.0 L94.0 88.0z" fill="#0046ad" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M108.0 63.0 L122.0 55.0 L122.0 72.0 L108.0 80.0z" fill="#ffffff" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M80.0 96.0 L94.0 88.0 L94.0 105.0 L80.0 113.0z" fill="#009b48" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M94.0 88.0 L108.0 80.0 L108.0 97.0 L94.0 105.0z" fill="#d10f1f" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
      <path d="M108.0 80.0 L122.0 72.0 L122.0 89.0 L108.0 97.0z" fill="#ff6a00" stroke="#111827" strokeWidth="2" strokeLinejoin="round" />
    </g>
  ),
  shipHunt: (
    <g>
      <rect x="22" y="12" width="116" height="96" rx="8" fill="#1e40af" />
      {Array.from({ length: 5 }, (_, k) => (
        <path key={k} d={`M${22 + (k + 1) * 19.3} 12 V108 M22 ${12 + (k + 1) * 16} H138`} stroke="#3b82f6" strokeWidth="1.5" />
      ))}
      <rect x="44" y="31" width="54" height="14" rx="7" fill="#cbd5e1" />
      <rect x="104" y="48" width="14" height="44" rx="7" fill="#cbd5e1" />
      <circle cx="61" cy="38" r="9" fill="#ef4444" />
      <path d="M57 34 l8 8 M65 34 l-8 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="51" cy="86" r="6" fill="none" stroke="#fff" strokeWidth="2.5" />
      <circle cx="71" cy="70" r="6" fill="none" stroke="#fff" strokeWidth="2.5" />
    </g>
  ),
  lavaRun: (
    <g>
      <path d="M50 108 L80 26 h20 L130 108z" fill="#78350f" />
      <path d="M78 28 q12 -16 24 0 q-4 12 -12 6 q-8 6 -12 -6z" fill="#f97316" />
      <path d="M84 30 l-8 26 l10 -6 l4 24 l4 -24 l10 6 l-8 -26z" fill="#ef4444" />
      {[[28, 98, '#d6c4a8'], [50, 84, '#f97316'], [130, 92, '#22c55e'], [146, 76, '#d6c4a8']].map(([x, y, c]) => (
        <ellipse key={x} cx={x} cy={y} rx="12" ry="8" fill={c} />
      ))}
      <rect x="104" y="58" width="22" height="22" rx="5" fill="#fff" />
      <text x="115" y="75" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="800" fontSize="16" fill="#173a66">5</text>
      <rect x="130" y="40" width="22" height="22" rx="5" fill="#ffd23f" />
      <text x="141" y="57" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="800" fontSize="16" fill="#173a66">+</text>
    </g>
  ),
  mathIsland: (
    <g>
      <path d="M0 96 q20 -6 40 0 t40 0 t40 0 t40 0 V112 H0z" fill="#0284c7" />
      <ellipse cx="80" cy="96" rx="60" ry="16" fill="#f6e1a7" />
      <ellipse cx="78" cy="90" rx="44" ry="10" fill="#7ccf6a" />
      <path d="M70 90 q-4 -26 2 -44" stroke="#8b5a2b" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M72 46 q-16 -8 -26 6 q12 -4 26 -6z M72 46 q16 -10 28 4 q-14 -4 -28 -4z M72 46 q-4 -14 -18 -14 q12 6 18 14z" fill="#2fae6b" />
      <rect x="92" y="72" width="22" height="16" fill="#d9a066" />
      <path d="M88 74 L103 62 L118 74z" fill="#a16207" />
      <g transform="translate(120 70)">
        <path d="M0 16 h30 l-6 8 h-18z" fill="#e5484d" />
        <path d="M15 16 v-22" stroke="#5b3a29" strokeWidth="2" />
        <path d="M17 -4 l11 17 h-11z" fill="#fff" />
      </g>
    </g>
  ),
  shapeFit: (
    <g>
      <rect x="22" y="14" width="116" height="92" rx="8" fill="#1e1b4b" />
      {[
        [28, 20, '#ff6b9a'], [50, 20, '#ff6b9a'], [72, 20, '#ff6b9a'], [28, 42, '#ff6b9a'],
        [94, 20, '#3b8cf0'], [116, 20, '#3b8cf0'], [116, 42, '#3b8cf0'], [116, 64, '#3b8cf0'],
        [50, 42, '#ffb000'], [72, 42, '#ffb000'], [94, 42, '#ffb000'], [72, 64, '#ffb000'],
        [28, 64, '#2fae6b'], [50, 64, '#2fae6b'], [28, 86, '#2fae6b'],
        [94, 64, '#9b6bf2'], [94, 86, '#9b6bf2'], [116, 86, '#9b6bf2'],
      ].map(([x, y, c]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="20" height="20" rx="5" fill={c} />
      ))}
      <rect x="50" y="86" width="20" height="20" rx="5" fill="none" stroke="#ffd23f" strokeWidth="2" strokeDasharray="4 3" />
      <rect x="72" y="86" width="20" height="20" rx="5" fill="none" stroke="#ffd23f" strokeWidth="2" strokeDasharray="4 3" />
    </g>
  ),
  carPark: (
    <g>
      <rect x="18" y="10" width="124" height="98" rx="8" fill="#7b5641" />
      <rect x="142" y="42" width="10" height="28" fill="#ffd23f" />
      <rect x="30" y="44" width="56" height="24" rx="8" fill="#e5484d" />
      <rect x="62" y="48" width="14" height="16" rx="3" fill="rgba(255,255,255,0.6)" />
      <rect x="96" y="20" width="24" height="56" rx="8" fill="#ece4d4" />
      <rect x="100" y="26" width="16" height="12" rx="3" fill="rgba(23,58,102,0.4)" />
      <rect x="30" y="78" width="80" height="22" rx="8" fill="#e9dcc3" />
      <path d="M126 56 h12 l-4 -4 M138 56 l-4 4" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>
  ),
  reversi: (
    <g>
      <rect x="20" y="16" width="120" height="92" rx="6" fill="#1f6b41" />
      {Array.from({ length: 4 }, (_, k) => (
        <path key={k} d={`M${20 + (k + 1) * 24} 16 V108 M20 ${16 + (k + 1) * 18.4} H140`} stroke="#164d2f" strokeWidth="2" />
      ))}
      {[
        [56, 53, '#fff'],
        [80, 53, '#1c1c1c'],
        [56, 71, '#1c1c1c'],
        [80, 71, '#fff'],
        [104, 71, '#1c1c1c'],
        [104, 53, '#fff'],
      ].map(([x, y, c]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="9" fill={c} stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
      ))}
    </g>
  ),
  // The new puzzle games.
  valueSort: (
    <g>
      <rect x="50" y="4" width="60" height="38" rx="8" fill="#fff" stroke="#173a66" strokeWidth="3" />
      <T x="80" y="23" s={18} c="#173a66">
        2+3
      </T>
      {[
        [10, '#ff6b9a', '5'],
        [60, '#3b8cf0', '8'],
        [110, '#2fae6b', '10'],
      ].map(([x, c, v]) => (
        <g key={v}>
          <rect x={x + 6} y="50" width="28" height="7" rx="3" fill={c} />
          <rect x={x} y="56" width="40" height="52" rx="10" fill="rgba(255,255,255,0.22)" stroke={c} strokeWidth="3" />
          <rect x={x + 6} y="62" width="28" height="20" rx="6" fill={c} />
          <T x={x + 20} y={72} s={14}>
            {v}
          </T>
        </g>
      ))}
      <path d="M80 44 Q60 50 34 60" stroke="#fff" strokeWidth="2.5" strokeDasharray="4 4" fill="none" />
    </g>
  ),
  doubleUp: (
    <g transform="rotate(-10 80 60)">
      <Tile x={14} y={22} w={42} h={42} fill="#f8b195" label="4" s={22} />
      <Tile x={60} y={14} w={50} h={50} fill="#ffc94a" label="16" s={24} />
      <Tile x={114} y={22} w={42} h={42} fill="#f8b195" label="8" s={22} />
      <Tile x={36} y={70} w={42} h={42} fill="#fde2c8" label="2" c="#a0522d" s={22} />
      <Tile x={84} y={70} w={42} h={42} fill="#f8b195" label="4" s={22} />
      <Star x={128} y={10} r={7} />
    </g>
  ),
  takeTen: (
    <g>
      <rect x="10" y="8" width="140" height="102" rx="8" fill="#fff" />
      {[
        ['3', '8', '1', '6'],
        ['5', '7', '2', '9'],
        ['4', '6', '3', '5'],
      ].map((row, r) =>
        row.map((v, c) => (
          <g key={`${r}${c}`}>
            {((r === 0 && c === 0) || (r === 1 && c === 1)) && <rect x={14 + c * 34} y={12 + r * 33} width="32" height="31" rx="5" fill="#7dd3fc" />}
            <T x={30 + c * 34} y={28 + r * 33} s={20} c="#173a66" w={600}>
              {v}
            </T>
          </g>
        )),
      )}
      <path d="M30 28 L64 61" stroke="#0ea5e9" strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  crossSums: (
    <g transform="rotate(-8 80 60)">
      {[
        ['7', '3', '4'],
        ['1', '5', '2'],
        ['6', '2', '8'],
      ].map((row, r) =>
        row.map((v, c) => (
          <g key={`${r}${c}`}>
            <rect x={24 + c * 34} y={14 + r * 32} width="31" height="29" rx="5" fill={r === 0 ? '#bae6fd' : '#fff'} />
            <T x={39.5 + c * 34} y={29 + r * 32} s={17} c="#173a66" w={600}>
              {v}
            </T>
          </g>
        )),
      )}
      <circle cx="73" cy="61" r="13" fill="none" stroke="#173a66" strokeWidth="2.5" />
      <path d="M100 82 l20 20 M120 82 l-20 20" stroke="#e5484d" strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  areaBoxes: (
    <g>
      <rect x="20" y="10" width="62" height="64" rx="6" fill="#f8a5a5" />
      <rect x="84" y="10" width="56" height="30" rx="6" fill="#fde2c8" />
      <rect x="84" y="42" width="56" height="64" rx="6" fill="#c4b5fd" />
      <rect x="20" y="76" width="62" height="30" rx="6" fill="#a7e8c0" />
      <T x="51" y="42" s={24} c="#7f1d1d">
        4
      </T>
      <T x="112" y="25" s={18} c="#9a3412">
        2
      </T>
      <T x="112" y="74" s={24} c="#4c1d95">
        4
      </T>
      <T x="51" y="91" s={18} c="#14532d">
        2
      </T>
    </g>
  ),
  petSudoku: (
    <g transform="rotate(-10 80 60)">
      {[
        ['#4ade80', 'cat', '#f472b6'],
        ['#f472b6', '#60a5fa', 'dog'],
        ['bunny', '#fbbf24', '#4ade80'],
      ].map((row, r) =>
        row.map((v, c) => {
          const x = 30 + c * 36;
          const y = 8 + r * 36;
          const cx = x + 16.5;
          const cy = y + 18;
          return (
            <g key={`${r}${c}`}>
              <rect x={x} y={y} width="33" height="33" rx="6" fill={v.startsWith('#') ? v : '#fff'} />
              {v.startsWith('#') && <path d={`M${x + 8} ${y + 8} l17 17 M${x + 25} ${y + 8} l-17 17`} stroke="#fff" strokeWidth="5" strokeLinecap="round" />}
              {v === 'cat' && (
                <g>
                  <path d={`M${cx - 10} ${cy - 4} l2 -10 l6 6z M${cx + 10} ${cy - 4} l-2 -10 l-6 6z`} fill="#f59e0b" />
                  <circle cx={cx} cy={cy + 1} r="10" fill="#f59e0b" />
                </g>
              )}
              {v === 'dog' && (
                <g>
                  <ellipse cx={cx - 10} cy={cy} rx="4" ry="8" fill="#8a5a2b" />
                  <ellipse cx={cx + 10} cy={cy} rx="4" ry="8" fill="#8a5a2b" />
                  <circle cx={cx} cy={cy + 1} r="10" fill="#d6a26a" />
                </g>
              )}
              {v === 'bunny' && (
                <g>
                  <ellipse cx={cx - 4} cy={cy - 10} rx="3" ry="8" fill="#e2e8f0" stroke="#f9a8d4" strokeWidth="1.5" />
                  <ellipse cx={cx + 4} cy={cy - 10} rx="3" ry="8" fill="#e2e8f0" stroke="#f9a8d4" strokeWidth="1.5" />
                  <circle cx={cx} cy={cy + 2} r="9.5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
                </g>
              )}
              {!v.startsWith('#') && (
                <g>
                  <circle cx={cx - 3.5} cy={cy} r="1.6" fill="#173a66" />
                  <circle cx={cx + 3.5} cy={cy} r="1.6" fill="#173a66" />
                  <circle cx={cx} cy={cy + 4} r="1.4" fill="#e5484d" />
                </g>
              )}
            </g>
          );
        }),
      )}
    </g>
  ),
  tapMatch: (
    <g>
      {[
        [20, 44, '5', -8],
        [62, 56, '2+3', 4],
        [104, 40, '5', 10],
        [44, 14, '●●●', -4],
        [86, 10, '3', 6],
      ].map(([x, y, v, r]) => (
        <g key={`${x}${y}`} transform={`rotate(${r} ${x + 20} ${y + 24})`}>
          <rect x={x} y={y + 4} width="40" height="48" rx="7" fill="#f3c0c0" />
          <rect x={x} y={y} width="40" height="48" rx="7" fill="#fff" stroke="#f3c0c0" strokeWidth="2" />
          <T x={x + 20} y={y + 24} s={v.length > 2 ? 12 : 22} c="#e5484d">
            {v}
          </T>
        </g>
      ))}
    </g>
  ),
  hoopHop: (
    <g>
      <ellipse cx="112" cy="70" rx="34" ry="12" fill="none" stroke="#e5484d" strokeWidth="6" />
      <T x="112" y="98" s={18} c="#9a3412">
        12
      </T>
      <circle cx="58" cy="44" r="20" fill="#f97316" stroke="#173a66" strokeWidth="3" />
      <path d="M38 44 h40 M58 24 v40" stroke="#173a66" strokeWidth="2" />
      <ellipse cx="34" cy="34" rx="14" ry="7" fill="#fff" stroke="#173a66" strokeWidth="2" transform="rotate(-30 34 34)" />
      <ellipse cx="34" cy="50" rx="14" ry="7" fill="#fff" stroke="#173a66" strokeWidth="2" transform="rotate(20 34 50)" />
    </g>
  ),
  fourInRow: (
    <g>
      <rect x="14" y="10" width="132" height="100" rx="10" fill="#1d4ed8" />
      {Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 5 }, (_, c) => {
          const v = { '3,0': 'y', '3,1': 'y', '3,2': 'r', '2,1': 'r', '3,3': 'y', '2,2': 'y', '1,2': 'r', '3,4': 'r' }[`${r},${c}`];
          return <circle key={`${r}${c}`} cx={32 + c * 24} cy={26 + r * 24} r="9.5" fill={v === 'y' ? '#ffd23f' : v === 'r' ? '#e5484d' : '#1e3a8a'} />;
        }),
      )}
    </g>
  ),
  domino: (
    <g>
      {[
        [16, -14, ['●●', '3']],
        [58, -4, ['2+1', '●●●●']],
        [100, 8, ['4', '●●●●●●']],
      ].map(([x, r, [a, b]]) => (
        <g key={x} transform={`rotate(${r} ${x + 22} 60)`}>
          <rect x={x} y="14" width="44" height="90" rx="8" fill="#fff" stroke="#cbd5e1" strokeWidth="2" />
          <path d={`M${x + 6} 59 H${x + 38}`} stroke="#173a66" strokeWidth="2.5" />
          <T x={x + 22} y={36} s={a.includes('●') ? 10 : 18} c="#173a66">
            {a}
          </T>
          <T x={x + 22} y={82} s={b.includes('●') ? 9 : 18} c="#173a66">
            {b}
          </T>
        </g>
      ))}
    </g>
  ),
};

// Each card's colors: the background and the title.
const INK = {
  valueSort: '#e9d5ff',
  doubleUp: '#ffc94a',
  takeTen: '#fff',
  crossSums: '#075985',
  areaBoxes: '#be185d',
  petSudoku: '#be185d',
  tapMatch: '#7f1d1d',
  hoopHop: '#9a3412',
  fourInRow: '#1e3a8a',
  domino: '#fff',
  chess: '#5b3a1e',
  checkers: '#fff',
  carPark: '#ffd23f',
  shapeFit: '#fff',
  mathIsland: '#fff',
  lavaRun: '#fff',
  shipHunt: '#fff',
  cubeCoach: '#fff',
  piMemory: '#fff',
  reversi: '#fff',
};
const BG = {
  valueSort: '#5b3f73',
  doubleUp: '#7d4f63',
  takeTen: '#0ea5e9',
  crossSums: '#38bdf8',
  areaBoxes: '#fdf2e9',
  petSudoku: '#fff5ec',
  tapMatch: '#f87171',
  hoopHop: '#fde3a7',
  fourInRow: '#60a5fa',
  domino: '#0f6b4f',
  chess: '#eedbb8',
  checkers: '#c0392b',
  carPark: '#5b3a29',
  shapeFit: '#4338ca',
  mathIsland: '#38bdf8',
  lavaRun: '#fdba74',
  shipHunt: '#2563eb',
  cubeCoach: '#374151',
  piMemory: '#6d28d9',
  reversi: '#2e7d4f',
};
export const cardColors = (id, fallback) => ({ bg: BG[id] || fallback, ink: INK[id] });
export function CardArt({ id }) {
  return (
    <svg className="gc-art" viewBox="0 0 160 112" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      {ART[id] || null}
    </svg>
  );
}
export const hasCardArt = (id) => Boolean(ART[id]);
