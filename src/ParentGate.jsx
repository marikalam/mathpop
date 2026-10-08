import { useState } from 'react';

// A grown-ups-only check before the family account screen in the iPhone
// app (App Store Kids category rule): a multiplication a young child is
// unlikely to know, typed in rather than picked from choices.
function newQuestion() {
  const a = 12 + Math.floor(Math.random() * 8);
  const b = 3 + Math.floor(Math.random() * 7);
  return { a, b };
}

export default function ParentGate({ onPass, onCancel }) {
  const [question, setQuestion] = useState(newQuestion);
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);

  function check(e) {
    e.preventDefault();
    if (Number(answer) === question.a * question.b) {
      onPass();
      return;
    }
    setWrong(true);
    setAnswer('');
    setQuestion(newQuestion());
  }

  return (
    <div className="handoff-backdrop" role="dialog" aria-modal="true" aria-labelledby="parent-gate-title">
      <form className="handoff-card" onSubmit={check}>
        <div className="handoff-icon" aria-hidden="true">
          🔒
        </div>
        <h2 id="parent-gate-title" className="handoff-title">
          Grown-ups only
        </h2>
        <p className="handoff-text">
          {wrong ? 'Not quite. Try this one: ' : 'To open the family account, answer: '}
          what is {question.a} × {question.b}?
        </p>
        <input
          className="parent-gate-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          aria-label="Answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value.replace(/\D/g, '').slice(0, 4))}
          autoFocus
        />
        <button type="submit" className="pill-btn-primary pill-btn-full handoff-open" disabled={!answer}>
          Continue
        </button>
        <button type="button" className="handoff-stay" onClick={onCancel}>
          Cancel
        </button>
      </form>
    </div>
  );
}
