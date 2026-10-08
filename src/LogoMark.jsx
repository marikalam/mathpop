import { useId } from 'react';

// The app icon (+ − × ÷ tiles), drawn in SVG rather than shown as the PNG,
// so its pieces can move when the logo is tapped: the + spins, the −
// stretches, the × twirls and the ÷ dots jump apart, one after another.
// `playing` is a number that goes up with each tap; it's used as the key,
// so a new tap restarts the animation from the beginning.
const ROUND = { strokeWidth: 28, strokeLinecap: 'round', fill: 'none' };

export default function LogoMark({ playing = 0 }) {
  const bg = useId();
  return (
    <svg
      key={playing}
      className={`logo-mark logo-mark-svg${playing ? ' logo-mark-play' : ''}`}
      viewBox="0 0 512 512"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38c07f" />
          <stop offset="1" stopColor="#4a7cf5" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="144" fill={`url(#${bg})`} />
      <g className="lm-tile lm-plus">
        <rect x="118" y="118" width="128" height="128" rx="32" fill="#fff" />
        <path className="lm-sign" d="M182 136 V228 M136 182 H228" stroke="#38c07f" {...ROUND} />
      </g>
      <g className="lm-tile lm-minus">
        <rect x="266" y="118" width="128" height="128" rx="32" fill="#fff" />
        <path className="lm-sign" d="M294 182 H366" stroke="#3f9bc0" {...ROUND} />
      </g>
      <g className="lm-tile lm-times">
        <rect x="118" y="266" width="128" height="128" rx="32" fill="#ffd23f" />
        <path className="lm-sign" d="M156 304 L208 356 M208 304 L156 356" stroke="#171a2b" {...ROUND} />
      </g>
      <g className="lm-tile lm-divide">
        <rect x="266" y="266" width="128" height="128" rx="32" fill="#fff" />
        <path d="M294 330 H366" stroke="#4a7cf5" {...ROUND} />
        <circle className="lm-dot-top" cx="330" cy="298" r="14" fill="#4a7cf5" />
        <circle className="lm-dot-bottom" cx="330" cy="362" r="14" fill="#4a7cf5" />
      </g>
    </svg>
  );
}
