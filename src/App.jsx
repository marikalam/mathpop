import { useState } from 'react';
import ProfileSwitcher from './ProfileSwitcher.jsx';
import { ChartIcon, CheckIcon, XIcon } from './icons.jsx';
import { playCorrectChime, playIncorrectBuzz } from './sound.js';

const SESSION_ROUNDS = 5;
const PROGRESS_KEY = 'mathpop-progress-v1';

const OPERATIONS = {
  multiply: { symbol: '×', label: 'Multiplication', color: '#3B6FEF' },
  add: { symbol: '+', label: 'Addition', color: '#2FAE6B' },
  subtract: { symbol: '−', label: 'Subtraction', color: '#8E4FD6' },
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildProblem(operation, profile) {
  let a;
  let b;
  if (operation === 'multiply') {
    if (profile === 'maddie') {
      a = randInt(2, 9);
      b = randInt(2, 15);
    } else {
      a = randInt(2, 9);
      b = randInt(2, 9);
    }
    if (Math.random() < 0.5) [a, b] = [b, a];
    return { a, b, symbol: '×', correct: a * b };
  }
  if (operation === 'add') {
    if (profile === 'maddie') {
      a = randInt(10, 50);
      b = randInt(10, 50);
    } else {
      a = randInt(2, 20);
      b = randInt(2, 20);
    }
    return { a, b, symbol: '+', correct: a + b };
  }
  if (profile === 'maddie') {
    a = randInt(20, 99);
    b = randInt(1, Math.min(a, 50));
  } else {
    a = randInt(5, 30);
    b = randInt(1, Math.min(a, 20));
  }
  return { a, b, symbol: '−', correct: a - b };
}

function buildOptions(problem) {
  const { a, b, symbol, correct } = problem;
  const pool = new Set();
  const add = (v) => {
    if (Number.isInteger(v) && v >= 0 && v !== correct) pool.add(v);
  };
  if (symbol === '×') {
    add(a * (b + 1));
    add(a * (b - 1));
    add((a + 1) * b);
    add((a - 1) * b);
    add(a + b);
  } else if (symbol === '−') {
    add(a - b + 10);
    add(a - b - 10);
    add(a + b);
    add(a - b + 1);
    add(a - b - 1);
  } else {
    add(a + b + 10);
    add(a + b - 10);
    add(Math.abs(a - b));
    add(a + b + 1);
    add(a + b - 1);
  }
  let distractors = shuffle([...pool]);
  while (distractors.length < 3) {
    const candidate = correct + randInt(1, 9) * (Math.random() < 0.5 ? -1 : 1);
    if (candidate >= 0 && candidate !== correct && !distractors.includes(candidate)) {
      distractors.push(candidate);
    }
  }
  return shuffle([correct, ...distractors.slice(0, 3)]);
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProgress(data) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function AppHeader({ profile, onChangeProfile, onBack, showBack }) {
  return (
    <>
      <div className="brand-row">
        <h1 className="logo">
          <span className="ink">Math</span>
          <span className="pop-blue">P</span>
          <span className="pop-purple">o</span>
          <span className="pop-green">p</span>
        </h1>
        {!showBack && <span className="brand-spacer" />}
      </div>
      {showBack ? (
        <div className="nav-row">
          <button className="back-link" onClick={onBack}>
            ← Back
          </button>
          <ProfileSwitcher profile={profile} onChange={onChangeProfile} />
        </div>
      ) : (
        <ProfileSwitcher profile={profile} onChange={onChangeProfile} />
      )}
    </>
  );
}

function ProgressDots({ current, total }) {
  const items = [];
  for (let i = 1; i <= total; i++) {
    items.push(<span key={`d${i}`} className={`progress-dot${i <= current ? ' progress-dot-filled' : ''}`} />);
    if (i < total) {
      items.push(<span key={`l${i}`} className={`progress-line${i < current ? ' progress-line-filled' : ''}`} />);
    }
  }
  return (
    <div className="progress-wrap">
      <div className="progress-dots">{items}</div>
      <span className="progress-count">
        {current} / {total}
      </span>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('home');
  const [profile, setProfile] = useState('maddie');
  const [progress, setProgress] = useState(loadProgress);

  const [operation, setOperation] = useState('multiply');
  const [roundIndex, setRoundIndex] = useState(0);
  const [problem, setProblem] = useState(null);
  const [options, setOptions] = useState([]);
  const [answerCorrect, setAnswerCorrect] = useState(false);
  const [chosen, setChosen] = useState(null);

  function goHome() {
    setView('home');
  }

  function startOperation(op) {
    const first = buildProblem(op, profile);
    setOperation(op);
    setRoundIndex(0);
    setProblem(first);
    setOptions(buildOptions(first));
    setChosen(null);
    setView('question');
  }

  function chooseAnswer(value) {
    const correct = value === problem.correct;
    setChosen(value);
    setAnswerCorrect(correct);
    if (correct) playCorrectChime();
    else playIncorrectBuzz();
    if (navigator.vibrate) navigator.vibrate(correct ? 20 : [20, 40, 20]);

    setProgress((prev) => {
      const p = prev[profile] || { total: 0, correct: 0, byOp: {} };
      const opStats = p.byOp[operation] || { total: 0, correct: 0 };
      const next = {
        ...prev,
        [profile]: {
          total: p.total + 1,
          correct: p.correct + (correct ? 1 : 0),
          byOp: {
            ...p.byOp,
            [operation]: { total: opStats.total + 1, correct: opStats.correct + (correct ? 1 : 0) },
          },
        },
      };
      saveProgress(next);
      return next;
    });
    setView('feedback');
  }

  function nextProblem() {
    if (roundIndex + 1 >= SESSION_ROUNDS) {
      setView('complete');
      return;
    }
    const next = buildProblem(operation, profile);
    setRoundIndex((r) => r + 1);
    setProblem(next);
    setOptions(buildOptions(next));
    setChosen(null);
    setView('question');
  }

  const stats = progress[profile] || { total: 0, correct: 0, byOp: {} };
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  const opMeta = OPERATIONS[operation];

  return (
    <div className="page">
      <div className="app">
        {view === 'home' && (
          <>
            <AppHeader profile={profile} onChangeProfile={setProfile} showBack={false} />
            <div className="menu-list">
              <button className="menu-card menu-card-blue" onClick={() => startOperation('multiply')}>
                <span className="icon-badge" style={{ background: 'rgba(255,255,255,0.22)' }}>
                  <span className="op-symbol">×</span>
                </span>
                <span className="menu-text">
                  <span className="menu-title">Multiplication</span>
                  <span className="menu-sub">Times tables practice</span>
                </span>
              </button>
              <button className="menu-card menu-card-green" onClick={() => startOperation('add')}>
                <span className="icon-badge" style={{ background: 'rgba(255,255,255,0.22)' }}>
                  <span className="op-symbol">+</span>
                </span>
                <span className="menu-text">
                  <span className="menu-title">Addition</span>
                  <span className="menu-sub">Add it up</span>
                </span>
              </button>
              <button className="menu-card menu-card-purple" onClick={() => startOperation('subtract')}>
                <span className="icon-badge" style={{ background: 'rgba(255,255,255,0.22)' }}>
                  <span className="op-symbol">−</span>
                </span>
                <span className="menu-text">
                  <span className="menu-title">Subtraction</span>
                  <span className="menu-sub">Take it away</span>
                </span>
              </button>
              <button className="menu-card menu-card-amber" onClick={() => setView('progress')}>
                <span className="icon-badge" style={{ background: '#C9871F' }}>
                  <ChartIcon />
                </span>
                <span className="menu-text">
                  <span className="menu-title">Progress</span>
                  <span className="menu-sub">See your stats</span>
                </span>
              </button>
            </div>
          </>
        )}

        {view === 'question' && problem && (
          <>
            <AppHeader profile={profile} onChangeProfile={setProfile} showBack onBack={goHome} />
            <ProgressDots current={roundIndex + 1} total={SESSION_ROUNDS} />
            <h2 className="screen-title">What's the answer?</h2>
            <div className="problem-card" style={{ background: opMeta.color }}>
              {problem.a} {problem.symbol} {problem.b}
            </div>
            <div className="options-grid">
              {options.map((value) => (
                <button key={value} className="option-btn" onClick={() => chooseAnswer(value)}>
                  {value}
                </button>
              ))}
            </div>
          </>
        )}

        {view === 'feedback' && problem && (
          <>
            <AppHeader profile={profile} onChangeProfile={setProfile} showBack onBack={goHome} />
            <ProgressDots current={roundIndex + 1} total={SESSION_ROUNDS} />
            <div className={`feedback-icon-wrap${answerCorrect ? ' feedback-correct' : ' feedback-incorrect'}`}>
              {answerCorrect && (
                <div className="feedback-confetti" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              )}
              <span className="feedback-icon">{answerCorrect ? <CheckIcon /> : <XIcon />}</span>
            </div>
            <h2 className="screen-title">{answerCorrect ? 'Great job!' : 'Not quite!'}</h2>
            <p className="screen-sub">
              {answerCorrect ? "That's right!" : `You picked ${chosen}. The correct answer is:`}
            </p>
            <div className="answer-card" style={{ background: opMeta.color }}>
              <div className="answer-equation">
                {problem.a} {problem.symbol} {problem.b} = {problem.correct}
              </div>
            </div>
            <button className="pill-btn-primary pill-btn-full" onClick={nextProblem}>
              {roundIndex + 1 >= SESSION_ROUNDS ? 'Finish' : 'Next problem'} →
            </button>
          </>
        )}

        {view === 'complete' && (
          <>
            <AppHeader profile={profile} onChangeProfile={setProfile} showBack onBack={goHome} />
            <div className="complete-wrap">
              <div className="complete-emoji">🎉</div>
              <h2 className="screen-title">All done!</h2>
              <p className="screen-sub">
                You went through {SESSION_ROUNDS} {opMeta.label.toLowerCase()} problems.
              </p>
              <div className="feedback-actions">
                <button className="pill-btn-secondary" onClick={goHome}>
                  Home
                </button>
                <button className="pill-btn-primary" onClick={() => startOperation(operation)}>
                  Play again →
                </button>
              </div>
            </div>
          </>
        )}

        {view === 'progress' && (
          <>
            <AppHeader profile={profile} onChangeProfile={setProfile} showBack onBack={goHome} />
            <h2 className="screen-title">Progress</h2>
            <div className="stat-tiles">
              <div className="stat-tile">
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">Problems answered</div>
              </div>
              <div className="stat-tile">
                <div className="stat-number">{accuracy}%</div>
                <div className="stat-label">Accuracy</div>
              </div>
            </div>
            <div className="screen-sub progress-colors-label">By operation</div>
            <div className="op-stat-list">
              {Object.entries(OPERATIONS).map(([key, meta]) => {
                const s = stats.byOp[key] || { total: 0, correct: 0 };
                return (
                  <div key={key} className="op-stat-row">
                    <span className="op-stat-symbol" style={{ background: meta.color }}>
                      {meta.symbol}
                    </span>
                    <span className="op-stat-label">{meta.label}</span>
                    <span className="op-stat-count">{s.total} done</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
