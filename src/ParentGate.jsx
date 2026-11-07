import { useState } from 'react';
import Icon from './Icon.jsx';

// A grown-ups-only check before anything that leaves the app or costs
// money: buying Plus, rating MathPop on the App Store, sharing a child's
// week, opening Safari to print (Apple's Kids category rules). No math:
// three numbers are written as words ("seven, two, five") and typed in as
// digits, which needs reading that young children don't have yet.
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

function newCode() {
  return Array.from({ length: 3 }, () => Math.floor(Math.random() * 10));
}

export default function ParentGate({ reason, onPass, onCancel }) {
  const [code, setCode] = useState(newCode);
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);

  function check(e) {
    e.preventDefault();
    if (answer === code.join('')) {
      onPass();
      return;
    }
    setWrong(true);
    setAnswer('');
    setCode(newCode());
  }

  return (
    <div className="handoff-backdrop" role="dialog" aria-modal="true" aria-labelledby="parent-gate-title">
      <form className="handoff-card" onSubmit={check}>
        <div className="handoff-icon" aria-hidden="true">
          <Icon name="lock" size="1em" />
        </div>
        <h2 id="parent-gate-title" className="handoff-title">
          For grown-ups
        </h2>
        <p className="handoff-text">
          {wrong ? 'Not quite. Try again: type ' : `${reason}, type these numbers: `}
          <strong className="parent-gate-words">{code.map((d) => WORDS[d]).join(', ')}</strong>
        </p>
        <input
          className="parent-gate-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          aria-label="The numbers"
          value={answer}
          onChange={(e) => setAnswer(e.target.value.replace(/\D/g, '').slice(0, 3))}
          autoFocus
        />
        <button type="submit" className="pill-btn-primary pill-btn-full handoff-open" disabled={answer.length < 3}>
          Continue
        </button>
        <button type="button" className="handoff-stay" onClick={onCancel}>
          Cancel
        </button>
      </form>
    </div>
  );
}
