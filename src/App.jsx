import { useEffect, useState } from 'react';
import LevelSwitcher from './LevelSwitcher.jsx';
import { CheckIcon, ClockFace, XIcon } from './icons.jsx';
import { playFeedbackAndSpeak, prewarmVoices, speakProblem, speakResults } from './sound.js';
import { SentenceQuestionTemplates } from './types.js';
import { SKILL_UNITS, SKILL_META, buildSkillProblem, buildSkillOptions, isSkillConcept } from './skillBuilders.js';

const SESSION_ROUNDS = 10;
const PROGRESS_KEY = 'mathpop-progress-v2';
const SETTINGS_KEY = 'mathpop-settings-v1';

function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : { inputMethod: 'type' };
  } catch {
    return { inputMethod: 'type' };
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

const OPERATIONS = {
  multiply: { symbol: '×', label: 'Multiplication', color: '#3B6FEF' },
  add: { symbol: '+', label: 'Addition', color: '#2FAE6B' },
  subtract: { symbol: '−', label: 'Subtraction', color: '#8E4FD6' },
  clock: { symbol: '🕐', label: 'Clock', color: '#E0793A' },
};

const ALL_META = { ...OPERATIONS, ...SKILL_META };

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

function buildSentenceQuestion(op, level) {
  const templates = SentenceQuestionTemplates[op][level];
  const template = templates[Math.floor(Math.random() * templates.length)];
  let a, b;
  if (op === 'multiply') {
    if (level === 'easy') {
      a = randInt(1, 3);
      b = randInt(1, 3);
    } else if (level === 'medium') {
      a = randInt(2, 9);
      b = randInt(2, 15);
    } else {
      a = randInt(2, 12);
      b = randInt(5, 20);
    }
  } else if (op === 'add') {
    if (level === 'easy') {
      a = randInt(1, 5);
      b = randInt(1, 5);
    } else if (level === 'medium') {
      a = randInt(10, 50);
      b = randInt(10, 50);
    } else {
      a = randInt(20, 99);
      b = randInt(20, 99);
    }
  } else {
    if (level === 'easy') {
      a = randInt(2, 10);
      b = randInt(1, Math.min(a, 5));
    } else if (level === 'medium') {
      a = randInt(20, 99);
      b = randInt(1, Math.min(a, 50));
    } else {
      a = randInt(50, 150);
      b = randInt(10, Math.min(a, 99));
    }
  }

  let correct;
  if (op === 'multiply') correct = a * b;
  else if (op === 'add') correct = a + b;
  else correct = a - b;

  return {
    type: 'sentence',
    text: template(a, b),
    op,
    correct,
    numbers: [a, b],
    level,
  };
}

function formatTime(hour, minute) {
  return `${hour}:${String(minute).padStart(2, '0')}`;
}

function buildClockProblem(level) {
  const hour = randInt(1, 12);
  const minute = level === 'easy' ? 0 : level === 'medium' ? shuffle([0, 15, 30, 45])[0] : randInt(0, 11) * 5;
  return { type: 'clock', op: 'clock', hour, minute, correct: formatTime(hour, minute), level };
}

function buildProblem(mode, level) {
  if (mode === 'sentence') {
    const op = shuffle(['multiply', 'add', 'subtract'])[0];
    return buildSentenceQuestion(op, level);
  }
  if (mode === 'clock') {
    return buildClockProblem(level);
  }

  const op = mode === 'random' ? shuffle(['multiply', 'add', 'subtract'])[0] : mode;
  let a;
  let b;
  if (op === 'multiply') {
    if (level === 'easy') {
      a = randInt(1, 3);
      b = randInt(1, 3);
    } else if (level === 'medium') {
      a = randInt(2, 9);
      b = randInt(2, 15);
    } else {
      a = randInt(2, 12);
      b = randInt(5, 20);
    }
    if (Math.random() < 0.5) [a, b] = [b, a];
    return { a, b, op, symbol: '×', correct: a * b };
  }
  if (op === 'add') {
    if (level === 'easy') {
      a = randInt(1, 5);
      b = randInt(1, 5);
    } else if (level === 'medium') {
      a = randInt(10, 50);
      b = randInt(10, 50);
    } else {
      a = randInt(20, 99);
      b = randInt(20, 99);
    }
    return { a, b, op, symbol: '+', correct: a + b };
  }
  if (level === 'easy') {
    a = randInt(2, 10);
    b = randInt(1, Math.min(a, 5));
  } else if (level === 'medium') {
    a = randInt(20, 99);
    b = randInt(1, Math.min(a, 50));
  } else {
    a = randInt(50, 150);
    b = randInt(10, Math.min(a, 99));
  }
  return { a, b, op, symbol: '−', correct: a - b };
}

function buildOptions(problem) {
  const { correct } = problem;

  if (problem.type === 'sentence') {
    const pool = new Set();
    const add = (v) => {
      if (Number.isInteger(v) && v >= 0 && v !== correct) pool.add(v);
    };
    const [a, b] = problem.numbers;

    if (problem.op === 'multiply') {
      add(a * (b + 1));
      add(a * (b - 1));
      add((a + 1) * b);
      add((a - 1) * b);
      add(a + b);
    } else if (problem.op === 'subtract') {
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

  if (problem.type === 'clock') {
    const { hour, minute, level } = problem;
    const step = level === 'easy' ? 60 : level === 'medium' ? 15 : 5;
    const totalMinutes = (hour % 12) * 60 + minute; // 0-719, on a 12-hour wheel
    const timeAtOffset = (offsetSteps) => {
      const tm = (((totalMinutes + offsetSteps * step) % 720) + 720) % 720;
      const h = Math.floor(tm / 60) || 12;
      return formatTime(h, tm % 60);
    };
    const pool = new Set([1, -1, 2, -2, 3, -3].map(timeAtOffset).filter((t) => t !== correct));
    let distractors = shuffle([...pool]);
    while (distractors.length < 3) {
      const randMinute = level === 'easy' ? 0 : level === 'medium' ? shuffle([0, 15, 30, 45])[0] : randInt(0, 11) * 5;
      const candidate = formatTime(randInt(1, 12), randMinute);
      if (candidate !== correct && !distractors.includes(candidate)) distractors.push(candidate);
    }
    return shuffle([correct, ...distractors.slice(0, 3)]);
  }

  const { a, b, symbol } = problem;
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

function makeProblem(op, level) {
  if (isSkillConcept(op)) return buildSkillProblem(op, level);
  return buildProblem(op, level);
}

function makeOptions(problem) {
  if (problem.type === 'skill') return buildSkillOptions(problem);
  return buildOptions(problem);
}

function problemPromptText(problem) {
  if (problem.type === 'sentence') return problem.text;
  if (problem.type === 'clock') return 'What time is it?';
  if (problem.type === 'skill') {
    return problem.promptKind === 'compare' ? `${problem.compareLeft} ___ ${problem.compareRight}` : problem.prompt;
  }
  return `${problem.a} ${problem.symbol} ${problem.b}`;
}

function problemAnswerText(problem) {
  if (problem.type === 'sentence' || problem.type === 'clock') return `${problem.correct}`;
  if (problem.type === 'skill') return problem.answerLabel || `${problem.correct}`;
  return `${problem.a} ${problem.symbol} ${problem.b} = ${problem.correct}`;
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

function AppHeader({ level, onChangeLevel, onBack, showBack, onSettings }) {
  return (
    <>
      <div className="brand-row">
        {showBack ? (
          <button className="logo-btn" onClick={onBack}>
            <h1 className="logo">
              <span className="ink">Math</span>
              <span className="pop-blue">P</span>
              <span className="pop-purple">o</span>
              <span className="pop-green">p</span>
            </h1>
          </button>
        ) : (
          <h1 className="logo">
            <span className="ink">Math</span>
            <span className="pop-blue">P</span>
            <span className="pop-purple">o</span>
            <span className="pop-green">p</span>
          </h1>
        )}
        {!showBack && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="games-link-btn" onClick={onSettings} aria-label="Settings">
              ⚙️
            </button>
            <a className="games-link-btn" href="https://marikalam.github.io/apps/">
              Apps
            </a>
          </div>
        )}
      </div>
      {showBack ? (
        <div className="nav-row">
          <button className="back-link" onClick={onBack}>
            ← Back
          </button>
          <LevelSwitcher level={level} onChange={onChangeLevel} />
        </div>
      ) : (
        <LevelSwitcher level={level} onChange={onChangeLevel} />
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
  const [level, setLevel] = useState('medium');
  const [progress, setProgress] = useState(loadProgress);
  const [settings, setSettings] = useState(loadSettings);

  const [operation, setOperation] = useState('multiply');
  const [roundIndex, setRoundIndex] = useState(0);
  const [problem, setProblem] = useState(null);
  const [options, setOptions] = useState([]);
  const [answerCorrect, setAnswerCorrect] = useState(false);
  const [chosen, setChosen] = useState(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionResults, setSessionResults] = useState({});
  const [sessionLog, setSessionLog] = useState([]);
  const [firstAttempt, setFirstAttempt] = useState(true);

  useEffect(() => {
    prewarmVoices();
  }, []);

  useEffect(() => {
    if (view === 'question' && problem && problem.type !== 'sentence') speakProblem(problem);
  }, [view, problem]);

  useEffect(() => {
    if (view === 'complete') speakResults(sessionCorrect, SESSION_ROUNDS);
  }, [view]);

  function goHome() {
    setView('home');
  }

  function updateInputMethod(method) {
    const newSettings = { ...settings, inputMethod: method };
    setSettings(newSettings);
    saveSettings(newSettings);
  }

  function changeLevel(newLevel) {
    setLevel(newLevel);
    if (view === 'question' && problem) {
      const next = makeProblem(operation, newLevel);
      setProblem(next);
      setOptions(makeOptions(next));
      setChosen(null);
    }
  }

  function startOperation(op) {
    const first = makeProblem(op, level);
    setOperation(op);
    setRoundIndex(0);
    setSessionCorrect(0);
    setSessionResults({});
    setSessionLog([]);
    setFirstAttempt(true);
    setProblem(first);
    setOptions(makeOptions(first));
    setChosen(null);
    setTypedAnswer('');
    setView('question');
  }

  function chooseAnswer(value) {
    const correct = value === problem.correct;
    setChosen(value);
    setAnswerCorrect(correct);
    playFeedbackAndSpeak(correct, problem.speechAnswer ?? problem.correct);
    if (navigator.vibrate) navigator.vibrate(correct ? 20 : [20, 40, 20]);

    // Only the first attempt at a problem counts toward the score and log —
    // "Try again" lets a kid retry for practice without inflating the tally.
    if (firstAttempt) {
      if (correct) {
        setSessionCorrect((c) => c + 1);
      }

      setSessionResults((prev) => {
        const opStats = prev[problem.op] || { correct: 0, wrong: 0 };
        return {
          ...prev,
          [problem.op]: {
            correct: opStats.correct + (correct ? 1 : 0),
            wrong: opStats.wrong + (correct ? 0 : 1),
          },
        };
      });

      setSessionLog((prev) => [
        ...prev,
        {
          op: problem.op,
          correct,
          prompt: problemPromptText(problem),
          yourAnswer: value,
          answerText: problemAnswerText(problem),
        },
      ]);

      setProgress((prev) => {
        const p = prev[level] || { total: 0, correct: 0, byOp: {} };
        const opStats = p.byOp[problem.op] || { total: 0, correct: 0 };
        const next = {
          ...prev,
          [level]: {
            total: p.total + 1,
            correct: p.correct + (correct ? 1 : 0),
            byOp: {
              ...p.byOp,
              [problem.op]: { total: opStats.total + 1, correct: opStats.correct + (correct ? 1 : 0) },
            },
          },
        };
        saveProgress(next);
        return next;
      });

      setFirstAttempt(false);
    }

    setView('feedback');
  }

  function nextProblem() {
    if (roundIndex + 1 >= SESSION_ROUNDS) {
      setView('complete');
      return;
    }
    const next = makeProblem(operation, level);
    setRoundIndex((r) => r + 1);
    setProblem(next);
    setOptions(makeOptions(next));
    setChosen(null);
    setTypedAnswer('');
    setFirstAttempt(true);
    setView('question');
  }

  const modeLabel = isSkillConcept(operation)
    ? SKILL_META[operation].label.toLowerCase()
    : operation === 'random'
      ? 'random mix'
      : operation === 'sentence'
        ? 'word problem'
        : OPERATIONS[operation].label.toLowerCase();

  return (
    <div className="page">
      <div className="app">
        {view === 'home' && (
          <>
            <AppHeader level={level} onChangeLevel={changeLevel} showBack={false} onSettings={() => setView('settings')} />
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
              <button className="menu-card menu-card-mixed" onClick={() => startOperation('random')}>
                <span className="icon-badge" style={{ background: 'rgba(255,255,255,0.22)' }}>
                  <span className="op-symbol">🎲</span>
                </span>
                <span className="menu-text">
                  <span className="menu-title">Random Mix</span>
                  <span className="menu-sub">A bit of everything</span>
                </span>
              </button>
              <button className="menu-card menu-card-teal" onClick={() => startOperation('sentence')}>
                <span className="icon-badge" style={{ background: 'rgba(255,255,255,0.22)' }}>
                  <span className="op-symbol">📖</span>
                </span>
                <span className="menu-text">
                  <span className="menu-title">Word Problems</span>
                  <span className="menu-sub">Math in a story</span>
                </span>
              </button>
              <button className="menu-card menu-card-orange" onClick={() => startOperation('clock')}>
                <span className="icon-badge" style={{ background: 'rgba(255,255,255,0.22)' }}>
                  <span className="op-symbol">🕐</span>
                </span>
                <span className="menu-text">
                  <span className="menu-title">Tell Time</span>
                  <span className="menu-sub">Read the clock</span>
                </span>
              </button>
              <button className="menu-card menu-card-skills" onClick={() => setView('skills')}>
                <span className="icon-badge" style={{ background: 'rgba(255,255,255,0.22)' }}>
                  <span className="op-symbol">🏆</span>
                </span>
                <span className="menu-text">
                  <span className="menu-title">Skill Builders</span>
                  <span className="menu-sub">2nd-grade math concepts</span>
                </span>
              </button>
            </div>
          </>
        )}

        {view === 'skills' && (
          <>
            <AppHeader level={level} onChangeLevel={changeLevel} showBack onBack={goHome} />
            <h2 className="screen-title">Skill Builders</h2>
            <p className="screen-sub" style={{ marginBottom: '4px' }}>2nd-grade math concepts, unit by unit</p>
            <div className="skill-units">
              {SKILL_UNITS.map((unit) => (
                <div key={unit.id} className="skill-unit">
                  <p className="skill-unit-title">
                    Unit {unit.id}: {unit.title}
                  </p>
                  <div className="skill-card-grid">
                    {unit.concepts.map((concept) => (
                      <button
                        key={concept.id}
                        className="skill-card"
                        style={{ background: SKILL_META[concept.id].color }}
                        onClick={() => startOperation(concept.id)}
                      >
                        <span className="skill-card-symbol">{SKILL_META[concept.id].symbol}</span>
                        <span className="skill-card-text">
                          <span className="skill-card-title">{concept.title}</span>
                          <span className="skill-card-sub">{concept.sub}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {view === 'settings' && (
          <>
            <AppHeader level={level} onChangeLevel={changeLevel} showBack onBack={goHome} />
            <h2 className="screen-title">Settings</h2>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p className="screen-sub" style={{ marginBottom: '30px' }}>How do you want to answer?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px', margin: '0 auto' }}>
                <button
                  className={`pill-btn-${settings.inputMethod === 'type' ? 'primary' : 'secondary'} pill-btn-full`}
                  onClick={() => updateInputMethod('type')}
                  style={{ padding: '20px', fontSize: '16px', fontWeight: '600' }}
                >
                  {settings.inputMethod === 'type' ? '✓ ' : ''}Type the answer
                </button>
                <button
                  className={`pill-btn-${settings.inputMethod === 'choice' ? 'primary' : 'secondary'} pill-btn-full`}
                  onClick={() => updateInputMethod('choice')}
                  style={{ padding: '20px', fontSize: '16px', fontWeight: '600' }}
                >
                  {settings.inputMethod === 'choice' ? '✓ ' : ''}Pick from choices
                </button>
              </div>
            </div>
          </>
        )}

        {view === 'question' && problem && (
          <>
            <AppHeader level={level} onChangeLevel={changeLevel} showBack onBack={goHome} />
            <ProgressDots current={roundIndex + 1} total={SESSION_ROUNDS} />
            <h2 className="screen-title">
              {problem.questionTitle || (problem.type === 'clock' ? 'What time is it?' : "What's the answer?")}
            </h2>
            <button
              className="problem-card"
              style={{ background: ALL_META[problem.op].color }}
              onClick={() => speakProblem(problem)}
              aria-label={
                problem.type === 'sentence'
                  ? problem.text
                  : problem.type === 'clock'
                    ? 'Hear the question read aloud'
                    : problem.type === 'skill'
                      ? problem.speech || problem.prompt
                      : `Hear ${problem.a} ${problem.symbol} ${problem.b} read aloud`
              }
            >
              {problem.type === 'clock' ? (
                <ClockFace hour={problem.hour} minute={problem.minute} />
              ) : problem.type === 'skill' && problem.promptKind === 'compare' ? (
                <span className="problem-text compare-row">
                  <span>{problem.compareLeft}</span>
                  <span className="compare-blank">?</span>
                  <span>{problem.compareRight}</span>
                </span>
              ) : problem.type === 'skill' && problem.promptKind === 'stack' ? (
                <span className="stack-problem">
                  <span className="stack-row">{problem.stackTop}</span>
                  <span className="stack-row stack-row-op">
                    <span className="stack-op">{problem.stackSymbol}</span>
                    {problem.stackBottom}
                  </span>
                  <span className="stack-rule" />
                </span>
              ) : (
                <span
                  className={
                    problem.type === 'sentence' || (problem.type === 'skill' && problem.prompt.length > 24)
                      ? 'problem-text problem-text-sentence'
                      : 'problem-text'
                  }
                >
                  {problem.type === 'sentence'
                    ? problem.text
                    : problem.type === 'skill'
                      ? problem.prompt
                      : `${problem.a} ${problem.symbol} ${problem.b}`}
                </span>
              )}
            </button>
            {problem.type === 'skill' && problem.hint && <p className="screen-sub skill-hint">💡 {problem.hint}</p>}
            <p className="screen-sub tap-to-hear">Tap the problem to hear it</p>

            {settings.inputMethod === 'type' && problem.type !== 'clock' && problem.answerType !== 'choice' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(59, 111, 239, 0.2) 0%, rgba(47, 174, 107, 0.2) 100%)',
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderRadius: '10px',
                  padding: '12px',
                  textAlign: 'center',
                  minHeight: '45px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>
                    {typedAnswer || '0'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => setTypedAnswer(typedAnswer + num)}
                      style={{
                        padding: '12px 8px',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #5B8FFF 0%, #3B6FEF 100%)',
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'transform 0.1s, box-shadow 0.1s',
                        boxShadow: '0 4px 12px rgba(59, 111, 239, 0.3)',
                      }}
                      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(59, 111, 239, 0.3)'; }}
                      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 111, 239, 0.3)'; }}
                      onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(59, 111, 239, 0.3)'; }}
                      onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 111, 239, 0.3)'; }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  <button
                    onClick={() => setTypedAnswer(typedAnswer + '0')}
                    style={{
                      padding: '12px 8px',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #5B8FFF 0%, #3B6FEF 100%)',
                      color: '#fff',
                      cursor: 'pointer',
                      transition: 'transform 0.1s, box-shadow 0.1s',
                      boxShadow: '0 4px 12px rgba(59, 111, 239, 0.3)',
                    }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(59, 111, 239, 0.3)'; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 111, 239, 0.3)'; }}
                    onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(59, 111, 239, 0.3)'; }}
                    onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 111, 239, 0.3)'; }}
                  >
                    0
                  </button>
                  <button
                    onClick={() => setTypedAnswer(typedAnswer.slice(0, -1))}
                    style={{
                      padding: '12px 8px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A52 100%)',
                      color: '#fff',
                      cursor: 'pointer',
                      transition: 'transform 0.1s, box-shadow 0.1s',
                      boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                    }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(255, 107, 107, 0.3)'; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)'; }}
                    onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(255, 107, 107, 0.3)'; }}
                    onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)'; }}
                    title="Delete"
                  >
                    ←
                  </button>
                  <button
                    className="pill-btn-submit"
                    onClick={() => typedAnswer && chooseAnswer(parseInt(typedAnswer))}
                    disabled={!typedAnswer}
                    style={{ padding: '12px 8px', fontSize: '14px', fontWeight: '600', gridColumn: '3 / 5' }}
                  >
                    Submit
                  </button>
                </div>
              </div>
            ) : (
              <div className="options-grid">
                {options.map((value) => (
                  <button key={value} className="option-btn" onClick={() => chooseAnswer(value)}>
                    {value}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {view === 'feedback' && problem && (
          <>
            <AppHeader level={level} onChangeLevel={changeLevel} showBack onBack={goHome} />
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
            <div className="answer-card" style={{ background: ALL_META[problem.op].color }}>
              <div className="answer-equation">{problemAnswerText(problem)}</div>
            </div>
            {answerCorrect ? (
              <button className="pill-btn-primary pill-btn-full" onClick={nextProblem}>
                {roundIndex + 1 >= SESSION_ROUNDS ? 'Finish' : 'Next problem'} →
              </button>
            ) : (
              <button className="pill-btn-primary pill-btn-full" onClick={() => { setChosen(null); setTypedAnswer(''); setView('question'); }}>
                Try again →
              </button>
            )}
          </>
        )}

        {view === 'complete' && (
          <>
            <AppHeader level={level} onChangeLevel={changeLevel} showBack onBack={goHome} />
            <div className="complete-wrap">
              <div className="complete-emoji">🎉</div>
              <h2 className="screen-title">All done!</h2>
              <p className="screen-sub">
                You went through {SESSION_ROUNDS} {modeLabel} problems.
              </p>
              <div className="results-score-ring">
                <span className="results-score-number">{sessionCorrect}</span>
                <span className="results-score-total">/ {SESSION_ROUNDS}</span>
              </div>
              {Object.keys(sessionResults).length > 0 && (
                <div className="result-breakdown">
                  <p className="result-label">By operation:</p>
                  {Object.entries(sessionResults).map(([op, results]) => (
                    <div key={op} className="result-row">
                      <span className="result-op-symbol" style={{ background: ALL_META[op].color }}>
                        {ALL_META[op].symbol}
                      </span>
                      <span className="result-op-name">{ALL_META[op].label}</span>
                      <span className="result-numbers">
                        <span className="result-correct">✓ {results.correct}</span>
                        <span className="result-wrong">✗ {results.wrong}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {sessionLog.length > 0 && (
                <button className="pill-btn-secondary pill-btn-full" onClick={() => setView('review')}>
                  Review answers
                </button>
              )}
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

        {view === 'review' && (
          <>
            <AppHeader level={level} onChangeLevel={changeLevel} showBack onBack={() => setView('complete')} />
            <h2 className="screen-title">Review Answers</h2>
            <p className="screen-sub" style={{ marginBottom: '4px' }}>
              {sessionCorrect} / {sessionLog.length} correct
            </p>
            <div className="review-list">
              {sessionLog.map((entry, i) => (
                <div key={i} className={`review-row${entry.correct ? ' review-row-correct' : ' review-row-wrong'}`}>
                  <span className={`review-icon${entry.correct ? ' review-icon-correct' : ' review-icon-wrong'}`}>
                    {entry.correct ? <CheckIcon /> : <XIcon />}
                  </span>
                  <div className="review-body">
                    <p className="review-prompt">
                      {i + 1}. {entry.prompt}
                    </p>
                    {!entry.correct && <p className="review-your-answer">You answered: {String(entry.yourAnswer)}</p>}
                    <p className="review-correct-answer">{entry.answerText}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
