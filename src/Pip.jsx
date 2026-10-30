// Pip the bubble, MathPop's mascot: a flat blue bubble with a white shine
// and a friendly face. `mood` is 'wave' (one arm up) or 'cheer' (both
// arms up, mouth open, confetti).
const B = '#5aa9ff';
const D = '#2f7fe0';
const INK = '#173a66';

export default function Pip({ size = 110, mood = 'wave', className = '' }) {
  const cheer = mood === 'cheer';
  return (
    <svg className={`pip ${className}`} width={size} height={size * 1.1} viewBox="0 0 120 132" aria-hidden="true">
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
    </svg>
  );
}
