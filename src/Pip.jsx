// Pip the bubble, MathPop's mascot: a flat blue bubble with a white shine
// and a friendly face. `mood` is 'wave' (one arm up) or 'cheer' (both
// arms up, mouth open, confetti). `wear` dresses Pip from Pip's Closet
// (pipCloset.js): { hat, glasses, cape }, each an item id or empty.
const B = '#5aa9ff';
const D = '#2f7fe0';
const INK = '#173a66';

// Capes go behind Pip, from the shoulders.
const CAPES = {
  red: '#e5484d',
  purple: '#8e4fd6',
  gold: '#ffc83d',
};
function Cape({ id }) {
  const shape = 'M24 78 0 136h120L96 78z';
  if (id === 'rainbow') {
    const colors = ['#e5484d', '#ff9f43', '#ffd23f', '#2fae6b', '#3b8cf0', '#8e4fd6'];
    return (
      <g>
        <clipPath id="pip-cape-clip">
          <path d={shape} />
        </clipPath>
        <g clipPath="url(#pip-cape-clip)">
          {colors.map((c, i) => (
            <rect key={c} x={i * 20} y="76" width="20" height="62" fill={c} />
          ))}
        </g>
      </g>
    );
  }
  return <path d={shape} fill={CAPES[id] || CAPES.red} />;
}

function Glasses({ id }) {
  if (id === 'sun') {
    return (
      <g>
        <rect x="33" y="56" width="26" height="18" rx="7" fill={INK} />
        <rect x="61" y="56" width="26" height="18" rx="7" fill={INK} />
        <path d="M57 62h6" stroke={INK} strokeWidth="3" />
        <path d="M38 60l6 0" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".6" />
      </g>
    );
  }
  if (id === 'stars' || id === 'hearts') {
    const star = (cx) =>
      `M${cx} 49l4 9 10 1-7.5 7 2 10-8.5-5-8.5 5 2-10-7.5-7 10-1z`;
    const heart = (cx) => `M${cx} 78c-12-7-17-13-15-19 2-5 9-6 15 0 6-6 13-5 15 0 2 6-3 12-15 19z`;
    const d = id === 'stars' ? star : heart;
    const color = id === 'stars' ? '#ffd23f' : '#ff6b9a';
    return (
      <g fill={color} fillOpacity=".35" stroke={id === 'stars' ? '#e0a100' : '#e0457a'} strokeWidth="3.5" strokeLinejoin="round">
        <path d={d(46)} />
        <path d={d(74)} />
        <path d="M58 64h4" />
      </g>
    );
  }
  return (
    <g fill="none" stroke={INK} strokeWidth="3.5">
      <circle cx="46" cy="64" r="11" />
      <circle cx="74" cy="64" r="11" />
      <path d="M57 64h6" />
    </g>
  );
}

function Hat({ id }) {
  switch (id) {
    case 'party':
      return (
        <g>
          <path d="M44 26 62 -16 78 26z" fill="#ff8fb1" />
          <path d="M50 14h22M55 2h13" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="62" cy="-17" r="6" fill="#ffd23f" />
        </g>
      );
    case 'bow':
      return (
        <g>
          <path d="M80 22 62 10v24z" fill="#ff6b9a" />
          <path d="M80 22 98 10v24z" fill="#ff6b9a" />
          <circle cx="80" cy="22" r="6" fill="#e0457a" />
        </g>
      );
    case 'cap':
      return (
        <g>
          <path d="M18 40c3-22 20-34 42-34s39 12 42 34z" fill="#2fae6b" />
          <path d="M92 38h24c5 0 5 8 0 8H92z" fill="#238a54" />
          <circle cx="60" cy="6" r="4" fill="#238a54" />
        </g>
      );
    case 'crown':
      return (
        <path
          d="M36 28 40 -2l11 14 9-20 9 20 11-14 4 30z"
          fill="#ffd23f"
          stroke="#e0a100"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      );
    case 'bunny':
      return (
        <g>
          <ellipse cx="42" cy="0" rx="10" ry="26" fill="#fff" stroke="#dfe3ee" strokeWidth="2.5" transform="rotate(-12 42 0)" />
          <ellipse cx="78" cy="0" rx="10" ry="26" fill="#fff" stroke="#dfe3ee" strokeWidth="2.5" transform="rotate(12 78 0)" />
          <ellipse cx="42" cy="2" rx="4.5" ry="17" fill="#ffb3c6" transform="rotate(-12 42 2)" />
          <ellipse cx="78" cy="2" rx="4.5" ry="17" fill="#ffb3c6" transform="rotate(12 78 2)" />
        </g>
      );
    case 'wizard':
      return (
        <g>
          <path d="M34 28 64 -28 88 28z" fill="#8e4fd6" />
          <path d="M26 28h70" stroke="#6f35b8" strokeWidth="7" strokeLinecap="round" />
          <circle cx="62" cy="0" r="4" fill="#ffd23f" />
          <circle cx="72" cy="14" r="3" fill="#ffd23f" />
          <circle cx="54" cy="18" r="2.5" fill="#ffd23f" />
        </g>
      );
    default:
      return null;
  }
}

export default function Pip({ size = 110, mood = 'wave', wear = {}, className = '' }) {
  const cheer = mood === 'cheer';
  // Room above Pip for a hat.
  const top = wear.hat ? (wear.hat === 'wizard' ? -32 : -24) : 0;
  const height = 132 - top;
  return (
    <svg
      className={`pip ${className}`}
      width={size}
      height={(size * height) / 120}
      viewBox={`0 ${top} 120 ${height}`}
      aria-hidden="true"
    >
      {wear.cape && <Cape id={wear.cape} />}
      {cheer && (
        <>
          <circle cx="106" cy="22" r="5" fill="#ffd166" />
          <circle cx="14" cy="30" r="4" fill="#ff7b6b" />
          <circle cx="110" cy="44" r="3" fill="#5cc28b" />
        </>
      )}
      <g className="pip-arm-left">
        <path d={cheer ? 'M24 76 12 52' : 'M24 82 12 66'} stroke={D} strokeWidth="8" strokeLinecap="round" />
      </g>
      <g className={cheer ? 'pip-arm-right' : 'pip-arm-right pip-wave'}>
        <path d={cheer ? 'M96 76l12-24' : 'M96 70l14-16'} stroke={D} strokeWidth="8" strokeLinecap="round" />
      </g>
      <ellipse cx="60" cy="126" rx="28" ry="4" fill={INK} opacity=".1" />
      <circle cx="60" cy="68" r="48" fill={B} />
      <path d="M30 50a32 32 0 0 1 22-22" stroke="#fff" strokeWidth="8" strokeLinecap="round" fill="none" />
      <circle cx="84" cy="36" r="5" fill="#fff" />
      <ellipse cx="46" cy="64" rx="6" ry="8" fill={INK} />
      <ellipse cx="74" cy="64" rx="6" ry="8" fill={INK} />
      <circle cx="48" cy="61" r="2.2" fill="#fff" />
      <circle cx="76" cy="61" r="2.2" fill="#fff" />
      {cheer ? (
        <>
          <path d="M46 76h28q-2 18-14 18t-14-18z" fill={INK} />
          <path d="M52 88q8 5 16 0q-2 6-8 6t-8-6z" fill="#ff8a8a" />
        </>
      ) : (
        <path d="M50 80q10 9 20 0" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      )}
      <circle cx="33" cy="78" r="6" fill="#ff9ec4" opacity=".8" />
      <circle cx="87" cy="78" r="6" fill="#ff9ec4" opacity=".8" />
      {wear.glasses && <Glasses id={wear.glasses} />}
      {wear.hat && <Hat id={wear.hat} />}
    </svg>
  );
}
