import { useState } from 'react';
import { GRADES } from './grades.js';
import LogoMark from './LogoMark.jsx';

// The very first time MathPop opens: who's playing, and their grade, so
// the greeting, the word problems and the voice use their name from the
// start ("Ready to pop some math, Marcus?") instead of "Player 1".
export default function WelcomeCard({ grade, onDone, onSkip }) {
  const [name, setName] = useState('');
  const [picked, setPicked] = useState(grade);
  return (
    <div className="handoff-backdrop" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <form
        className="handoff-card welcome-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onDone(name.trim(), picked);
        }}
      >
        <div className="welcome-logo">
          <LogoMark playing={1} />
        </div>
        <h2 id="welcome-title" className="handoff-title">
          Welcome to MathPop!
        </h2>
        <p className="handoff-text">Who’s playing?</p>
        <input
          className="welcome-name"
          type="text"
          placeholder="Your child’s first name"
          autoComplete="off"
          maxLength={20}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="First name"
        />
        <p className="handoff-text">What grade?</p>
        <div className="welcome-grades" role="radiogroup" aria-label="Grade">
          {GRADES.map((g) => (
            <button
              key={g.id}
              type="button"
              role="radio"
              aria-checked={picked === g.id}
              className={`welcome-grade${picked === g.id ? ' welcome-grade-on' : ''}`}
              style={{ '--grade-color': g.color }}
              onClick={() => setPicked(g.id)}
            >
              {g.short}
            </button>
          ))}
        </div>
        <button type="submit" className="pill-btn-primary pill-btn-full handoff-open" disabled={!name.trim()}>
          Let’s go!
        </button>
        <button type="button" className="handoff-stay" onClick={onSkip}>
          Skip for now
        </button>
      </form>
    </div>
  );
}
