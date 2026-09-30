import { createPortal } from 'react-dom';
import { ClockFace } from './icons.jsx';

// A printable worksheet: numbered problems in two columns with room to
// write, and an optional answer key on its own page. It's rendered into
// <body> next to the app and only shows up when printing (see the
// @media print rules in App.css), so the page on screen doesn't change.

function answerFor(problem) {
  if (problem.type === 'skill') return problem.answerLabel ?? String(problem.correct);
  return String(problem.correct);
}

function Problem({ problem }) {
  if (problem.type === 'clock') {
    return (
      <div className="ws-clock">
        <ClockFace hour={problem.hour} minute={problem.minute} size={96} />
        <span className="ws-answer-line">Time: ______ : ______</span>
      </div>
    );
  }
  if (problem.type === 'sentence') {
    return (
      <>
        <p className="ws-text">{problem.text}</p>
        <span className="ws-answer-line">Answer: __________</span>
      </>
    );
  }
  if (problem.type === 'skill') {
    let body;
    if (problem.promptKind === 'compare') {
      body = (
        <p className="ws-math">
          {problem.compareLeft} <span className="ws-circle-blank" /> {problem.compareRight}
        </p>
      );
    } else if (problem.promptKind === 'stack') {
      body = (
        <div className="ws-stack">
          <span>{problem.stackTop}</span>
          <span>
            <span className="ws-stack-op">{problem.stackSymbol}</span>
            {problem.stackBottom}
          </span>
          <span className="ws-stack-rule" />
        </div>
      );
    } else {
      body = <p className={problem.prompt.length > 24 ? 'ws-text' : 'ws-math'}>{problem.prompt}</p>;
    }
    return (
      <>
        {body}
        {problem.answerType === 'choice' ? (
          <span className="ws-choices">
            Circle one:
            {problem.choices.map((c) => (
              <span key={c} className="ws-choice">
                {c}
              </span>
            ))}
          </span>
        ) : (
          problem.promptKind !== 'stack' && <span className="ws-answer-line">Answer: __________</span>
        )}
      </>
    );
  }
  return (
    <p className="ws-math">
      {problem.a} {problem.symbol} {problem.b} = <span className="ws-blank" />
    </p>
  );
}

export default function PrintSheet({ problems, title, levelLabel, withKey }) {
  return createPortal(
    <div className="print-sheet">
      <header className="ws-header">
        <div className="ws-title">MathPop · {title}</div>
        <div className="ws-level">Level: {levelLabel}</div>
      </header>
      <div className="ws-name-row">
        <span>Name: ______________________</span>
        <span>Date: ____________</span>
      </div>
      <ol className="ws-list">
        {problems.map((p, i) => (
          <li key={i} className="ws-item">
            <span className="ws-num">{i + 1}.</span>
            <div className="ws-body">
              <Problem problem={p} />
            </div>
          </li>
        ))}
      </ol>
      {withKey && (
        <section className="ws-key">
          <div className="ws-title">Answer key · {title}</div>
          <ol className="ws-key-list">
            {problems.map((p, i) => (
              <li key={i}>
                <span className="ws-num">{i + 1}.</span> {answerFor(p)}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>,
    document.body,
  );
}
