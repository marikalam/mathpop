import { useEffect, useRef, useState } from 'react';
import { explainSteps } from './explain.js';
import ExplainPicture from './ExplainPicture.jsx';
import { speakSteps, stopSpeaking } from './sound.js';
import Icon from './Icon.jsx';
import { RichText } from './Drawings.jsx';

// "Show me how": MathPop talks the child through this problem out loud,
// one step at a time, lighting up each step on screen as it's said (for
// kids who can't read yet, the voice is the main thing). `withAnswer`
// (after a wrong try) finishes with the answer.
export default function ExplainPanel({ problem, withAnswer = false, onClose, children }) {
  const steps = explainSteps(problem, withAnswer);
  const ja = problem.lang === 'ja';
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
    speakSteps(steps, (i) => live && setCurrent(i), problem.lang).then(() => {
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
          <Icon name="hand" />
        </span>
        <h3 className="explain-title">{ja ? 'いっしょに やってみよう！' : 'Let me show you!'}</h3>
        <button className="explain-close" onClick={onClose} aria-label="Close">
          <Icon name="cross" size="0.8em" />
        </button>
      </div>
      <ExplainPicture problem={problem} reveal={withAnswer} />
      <ol className="explain-steps">
        {steps.map((step, i) => (
          <li
            key={`${round}-${i}`}
            className={`explain-step${i === current ? ' explain-step-now' : ''}${current >= 0 && i > current ? ' explain-step-later' : ''}`}
          >
            <RichText text={step} size={24} />
          </li>
        ))}
      </ol>
      {children}
      <button className="pill-btn-secondary pill-btn-full explain-again" onClick={() => setRound((r) => r + 1)}>
        <Icon name="repeat" /> {ja ? 'もういちど きく' : 'Say it again'}
      </button>
    </div>
  );
}
