import { useEffect, useRef, useState } from 'react';
import { GRADES, gradeInfo } from './grades.js';

export default function LevelSwitcher({ level, onChange }) {
  const [open, setOpen] = useState(false);
  const current = gradeInfo(level);
  const ref = useRef(null);

  // Tapping anywhere outside the menu closes it.
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <div className="level-switcher" ref={ref}>
      <button className="level-pill" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={`Grade: ${current.label}`}>
        <span className="level-dot" style={{ background: current.color }} />
        <span className="level-pill-text">
          <span className="level-pill-label">Grade</span>
          <span className="level-pill-name">{current.short}</span>
        </span>
        <span className="level-pill-chevron">▾</span>
      </button>
      {open && (
        <div className="level-menu">
          {GRADES.map((g) => (
            <button
              key={g.id}
              className={`level-menu-item${g.id === current.id ? ' level-menu-item-active' : ''}`}
              onClick={() => {
                onChange(g.id);
                setOpen(false);
              }}
            >
              <span className="level-dot" style={{ background: g.color }} />
              <span>{g.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
