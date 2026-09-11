import { useState } from 'react';

const LEVELS = [
  { key: 'easy', label: 'Easy', color: '#2FAE6B' },
  { key: 'medium', label: 'Medium', color: '#E0A53B' },
  { key: 'hard', label: 'Hard', color: '#E5484D' },
];

export default function LevelSwitcher({ level, onChange }) {
  const [open, setOpen] = useState(false);
  const current = LEVELS.find((l) => l.key === level);

  return (
    <div className="level-switcher">
      <button className="level-pill" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="level-dot" style={{ background: current.color }} />
        <span className="level-pill-text">
          <span className="level-pill-label">Level</span>
          <span className="level-pill-name">{current.label}</span>
        </span>
        <span className="level-pill-chevron">▾</span>
      </button>
      {open && (
        <div className="level-menu">
          {LEVELS.map((l) => (
            <button
              key={l.key}
              className={`level-menu-item${l.key === level ? ' level-menu-item-active' : ''}`}
              onClick={() => {
                onChange(l.key);
                setOpen(false);
              }}
            >
              <span className="level-dot" style={{ background: l.color }} />
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
