import { useEffect, useRef, useState } from 'react';
import { explainSteps } from './explain.js';
import ExplainPicture from './ExplainPicture.jsx';
import { speakSteps, stopSpeaking } from './sound.js';

// "Show me how": MathPop talks the child through this problem out loud,
// one step at a time, lighting up each step on screen as it's said (for
// kids who can't read yet, the voice is the main thing). `withAnswer`
// (after a wrong try) finishes with the answer.
export default function ExplainPanel({ problem, withAnswer = false, onClose, children }) {
  const steps = explainSteps(problem, withAnswer);
  const [current, setCurrent] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [round, setRound] = useState(0);
  const panelRef = useRef(null);

  useEffect(() => {
    panelRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  }, []);

  useEffect(() => {
    let live = true;
    setPlaying(true);
    speakSteps(steps, (i) => live && setCurrent(i)).then(() => {
      if (live) {
        setPlaying(false);
        setCurrent(-1);
      }
    });
    return () => {
      live = false;
      stopSpeaking();
    };
    // Say it again when the problem changes or "Say it again" is tapped.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem, withAnswer, round]);

  return (
    <div className="explain-panel" ref={panelRef} role="region" aria-label="Show me how">
      <div className="explain-head">
        <span className={`explain-speaker${playing ? ' explain-speaker-on' : ''}`} aria-hidden="true">
          🙋
        </span>
        <h3 className="explain-title">Let me show you!</h3>
        <button className="explain-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      <ExplainPicture problem={problem} reveal={withAnswer} />
      <ol className="explain-steps">
        {steps.map((step, i) => (
          <li
            key={`${round}-${i}`}
            className={`explain-step${i === current ? ' explain-step-now' : ''}${current >= 0 && i > current ? ' explain-step-later' : ''}`}
          >
            {step}
          </li>
        ))}
      </ol>
      {children}
      <button className="pill-btn-secondary pill-btn-full explain-again" onClick={() => setRound((r) => r + 1)}>
        🔁 Say it again
      </button>
    </div>
  );
}
