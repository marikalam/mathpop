import { useState } from 'react';
import { GRADES } from './grades.js';
import Pip from './Pip.jsx';
import SectionIcon from './SectionIcon.jsx';

// The very first time MathPop opens: "How old is your child?" with a big
// button for each age. Tapping one starts a game for that age straight
// away (App.jsx), so a new family is playing within seconds; the name is
// optional ("Ready to pop some math, Marcus?" once it's set). Signing up
// comes later, after the first round.
const AGES = { p: ['2–4', 'Toddler'], k: ['5', 'Kindergarten'], 1: ['6', '1st grade'], 2: ['7', '2nd grade'], 3: ['8', '3rd grade'], 4: ['9+', '4th grade'] };
const PICTURES = { p: 'tap-animals', k: 'numbers', 1: 'addsub', 2: 'measure', 3: 'muldiv', 4: 'fractions' };

export default function WelcomeCard({ onDone, onSkip }) {
  const [name, setName] = useState('');
  return (
    <div className="handoff-backdrop" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="handoff-card welcome-card welcome-ages-card">
        <div className="welcome-pip">
          <Pip size={78} mood="wave" />
        </div>
        <h2 id="welcome-title" className="handoff-title">
          How old is your child?
        </h2>
        <p className="handoff-text">Tap one and start playing.</p>
        <div className="welcome-ages">
          {GRADES.map((g) => (
            <button
              key={g.id}
              type="button"
              className="welcome-age"
              style={{ '--grade-color': g.color }}
              onClick={() => onDone(name.trim() || null, g.id)}
            >
              <span className="welcome-age-pic" aria-hidden="true">
                <SectionIcon id={PICTURES[g.id]} />
              </span>
              <span className="welcome-age-num">{AGES[g.id][0]}</span>
              <span className="welcome-age-grade">{AGES[g.id][1]}</span>
            </button>
          ))}
        </div>
        <input
          className="welcome-name"
          type="text"
          placeholder="Their first name (optional)"
          autoComplete="off"
          maxLength={20}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="First name (optional)"
        />
        <button type="button" className="handoff-stay" onClick={onSkip}>
          Skip for now
        </button>
      </div>
    </div>
  );
}
