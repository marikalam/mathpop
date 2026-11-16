import { useState } from 'react';

// The parental gate (App Store Kids Category, guideline 1.3): before
// anything that buys (MathPop Plus) or leaves the app (links, sharing,
// rating), a grown-up types four numbers written as words ("seven, two,
// nine, four"). Young kids can't read them yet. It shows every time and
// can't be turned off. A wrong answer makes a new one.
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const newCode = () => Array.from({ length: 4 }, () => Math.floor(Math.random() * 10));

export default function ParentGate({ onPass, onCancel }) {
  const [code, setCode] = useState(newCode);
  const [typed, setTyped] = useState('');
  const [wrong, setWrong] = useState(false);
  function press(d) {
    const next = (typed + d).slice(0, 4);
    setTyped(next);
    setWrong(false);
    if (next.length === 4) {
      if (next === code.join('')) onPass();
      else {
        setWrong(true);
        setTyped('');
        setCode(newCode());
      }
    }
  }
  return (
    <div className="pg-back" role="dialog" aria-modal="true" aria-labelledby="pg-title">
      <div className="pg-card">
        <h2 id="pg-title">For grown-ups</h2>
        <p className="pg-sub">Ask a grown-up to continue. Type these numbers:</p>
        <p className="pg-words">{code.map((d) => WORDS[d]).join(', ')}</p>
        <div className="pg-typed" aria-live="polite">
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i}>{typed[i] ? '•' : ''}</span>
          ))}
        </div>
        {wrong && <p className="pg-wrong">That's not it. Here are new numbers.</p>}
        <div className="pg-pad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => (
            <button key={d} type="button" onClick={() => press(String(d))}>
              {d}
            </button>
          ))}
          <button type="button" className="pg-del" onClick={() => setTyped(typed.slice(0, -1))} aria-label="Delete">
            ⌫
          </button>
        </div>
        <button type="button" className="pg-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
