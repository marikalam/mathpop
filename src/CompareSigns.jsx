import { useRef, useState } from 'react';
import { playStickerPick, playStickerStick } from './sound.js';

// "Which sign is correct?": the < and > answers are alligators whose open
// mouth eats the bigger number. Tap one, or drag it into the dashed box
// between the numbers (the box in App.jsx has id "compare-blank").

export function GatorSign({ sign, size = 74 }) {
  if (sign === '=') {
    return (
      <svg viewBox="0 0 100 60" width={size} height={(size * 60) / 100} aria-hidden="true">
        <rect x="22" y="16" width="56" height="10" rx="5" fill="#171a2b" />
        <rect x="22" y="34" width="56" height="10" rx="5" fill="#171a2b" />
      </svg>
    );
  }
  // Drawn as "<" (mouth open to the right); ">" is the mirror image.
  const teeth = (y0, dir) =>
    Array.from({ length: 4 }, (_, i) => {
      const t = 0.3 + i * 0.17;
      const x = 20 + t * 66;
      const y = 30 + (y0 - 30) * t;
      return <path key={i} d={`M${x - 4} ${y}L${x + 4} ${y}L${x} ${y + dir * 7}Z`} fill="#fff" />;
    });
  return (
    <svg viewBox="0 0 100 60" width={size} height={(size * 60) / 100} aria-hidden="true">
      <g transform={sign === '>' ? 'translate(100 0) scale(-1 1)' : undefined}>
        <circle cx="16" cy="30" r="12" fill="#2f9e5a" />
        <path d="M14 26L90 4L92 14L22 34Z" fill="#37b26a" stroke="#257a46" strokeWidth="2" strokeLinejoin="round" />
        <path d="M14 34L90 56L92 46L22 26Z" fill="#37b26a" stroke="#257a46" strokeWidth="2" strokeLinejoin="round" />
        {teeth(10, 1)}
        {teeth(50, -1)}
        <circle cx="30" cy="16" r="6" fill="#fff" stroke="#257a46" strokeWidth="2" />
        <circle cx="31.5" cy="16" r="2.6" fill="#171a2b" />
        <circle cx="86" cy="8" r="1.6" fill="#257a46" />
      </g>
    </svg>
  );
}

const label = { '<': 'less than', '>': 'greater than', '=': 'equal to' };

export function CompareChoices({ options, onChoose }) {
  const [drag, setDrag] = useState(null); // { value, x, y, moved }
  const start = useRef(null);

  const blank = () => document.getElementById('compare-blank');
  const overBlank = (x, y) => {
    const el = blank();
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const pad = 36;
    return x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad;
  };

  function down(e, value) {
    start.current = { value, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function move(e) {
    const s = start.current;
    if (!s) return;
    const moved = Math.hypot(e.clientX - s.x, e.clientY - s.y) > 10;
    if (!moved && !drag) return;
    if (!drag) playStickerPick();
    setDrag({ value: s.value, x: e.clientX, y: e.clientY });
    blank()?.classList.toggle('compare-blank-over', overBlank(e.clientX, e.clientY));
  }
  function up(e) {
    const s = start.current;
    start.current = null;
    if (!s) return;
    blank()?.classList.remove('compare-blank-over');
    if (!drag) {
      onChoose(s.value);
      return;
    }
    const value = drag.value;
    if (overBlank(e.clientX, e.clientY)) {
      // Snap into the box, then answer.
      const r = blank().getBoundingClientRect();
      setDrag({ value, x: r.left + r.width / 2, y: r.top + r.height / 2, snap: true });
      playStickerStick();
      setTimeout(() => {
        setDrag(null);
        onChoose(value);
      }, 280);
    } else {
      setDrag(null);
    }
  }

  return (
    <>
      <p className="screen-sub compare-drag-tip">Tap a sign, or drag it into the box</p>
      <div className="options-grid options-grid-3">
        {options.map((value) => (
          <button
            key={value}
            className={`option-btn option-btn-sign${drag?.value === value ? ' option-btn-lifted' : ''}`}
            onPointerDown={(e) => down(e, value)}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={() => {
              start.current = null;
              setDrag(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChoose(value);
              }
            }}
            aria-label={label[value] || String(value)}
          >
            <GatorSign sign={value} />
          </button>
        ))}
      </div>
      {drag && (
        <span className={`sign-ghost${drag.snap ? ' sign-ghost-snap' : ''}`} style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <GatorSign sign={drag.value} size={drag.snap ? 46 : 86} />
        </span>
      )}
    </>
  );
}
