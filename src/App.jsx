import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import LevelSwitcher from './LevelSwitcher.jsx';
import { CheckIcon, ClockFace, XIcon } from './icons.jsx';
import { getVoiceQuality, playFeedbackAndSpeak, prewarmVoices, speakInLanguage, speakProblem, speakResults, unlockAudio } from './sound.js';
import { SentenceQuestionTemplates } from './types.js';
import { SKILL_UNITS, SKILL_META, buildSkillProblem, buildSkillOptions, isSkillConcept } from './skillBuilders.js';
import WritePad from './WritePad.jsx';
import { loadDigitModel } from './digitModel.js';
import { DEFAULT_GRADE, GRADE_RANGES, gradeInfo, gradeOps, gradePractice, gradeTier } from './grades.js';
import AdditionHelp from './AdditionHelp.jsx';
import PrintSheet from './PrintSheet.jsx';

const SESSION_ROUNDS = 10;
// The iPhone app has no link out to the other apps' website.
const IS_NATIVE = Capacitor.isNativePlatform();
// The four operation tiles across the top of the home page.
const HERO_OPS = [
  { symbol: '+', color: '#2fae6b' },
  { symbol: '−', color: '#8e4fd6' },
  { symbol: '×', color: '#3b6fef' },
  { symbol: '÷', color: '#f0954f' },
];
// Every card the home page's Practice grid can show; each grade picks six
// of them (GRADE_PRACTICE in grades.js). Random Mix and Explore Numbers
// have their own Quick play card above.
const PRACTICE_CARDS = {
  multiply: { icon: '×', title: 'Multiplication', sub: 'Times tables practice', from: '#4a7cf5', to: '#3660e0' },
  add: { icon: '+', title: 'Addition', sub: 'Add it up', from: '#38c07f', to: '#2a9e60' },
  subtract: { icon: '−', title: 'Subtraction', sub: 'Take it away', from: '#a065e6', to: '#7c3fc4' },
  sentence: { icon: '📖', title: 'Word Problems', sub: 'Math in a story', from: '#1fb6ba', to: '#14898c' },
  clock: { icon: '🕐', title: 'Tell Time', sub: 'Read the clock', from: '#f0954f', to: '#e0793a' },
  skills: { icon: '🏆', title: 'Skill Builders', sub: 'All 2nd-grade concepts', from: '#f06f9a', to: '#d94f7e' },
  compare: { icon: '⚖️', title: 'Comparing', sub: 'Bigger, smaller, equal', from: '#f06f9a', to: '#d94f7e' },
  addStrategy: { icon: '🔟', title: 'Make a Ten', sub: 'Doubles & tens', from: '#f5a524', to: '#e08a12' },
  placeValue: { icon: '🔢', title: 'Place Value', sub: 'Tens and ones', from: '#4e8ff7', to: '#3a6fd8' },
  measurement: { icon: '📏', title: 'Measurement', sub: 'Inches, feet & cm', from: '#f5a524', to: '#e08a12' },
  regroup: { icon: '🧱', title: 'Stack & Solve', sub: 'Carrying & borrowing', from: '#f06f9a', to: '#d94f7e' },
  bigNumber: { icon: '💯', title: 'Big Numbers', sub: 'Into the millions', from: '#14b8a6', to: '#0f9384' },
  multistep: { icon: '🧩', title: 'Multi-Step', sub: 'Two-step stories', from: '#f5a524', to: '#e08a12' },
};
const PROGRESS_KEY = 'mathpop-progress-v2';
const SETTINGS_KEY = 'mathpop-settings-v1';
const GRADE_KEY = 'mathpop-grade-v1';
// The loading screen when the app opens (see `opening`).
const OPENING_MIN_MS = 700;
const OPENING_MAX_MS = 4000;
const EXPLORE_SESSION_TAPS = 20;
const EXPLORE_SESSION_KEY = 'mathpop-baby-session-v1';
const EXPLORE_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
// `say` is what the voice is given (kana for Japanese so 4 and 7 come out
// as よん/なな rather than し/しち); `show` is the small label under the digit.
const EXPLORE_LANGUAGES = [
  { key: 'en', label: 'English', lang: 'en-US' },
  {
    key: 'ja',
    label: '日本語',
    lang: 'ja-JP',
    say: ['ゼロ', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう', 'じゅう'],
    show: ['ゼロ', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'],
  },
  {
    key: 'yue',
    label: '廣東話',
    lang: 'zh-HK',
    say: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'],
    show: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'],
  },
  {
    key: 'zh',
    label: '普通话',
    lang: 'zh-CN',
    say: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'],
    show: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'],
  },
];
const EXPLORE_COLORS = ['#3B6FEF', '#2FAE6B', '#8E4FD6', '#E0793A', '#14B8A6', '#EF4444', '#F5A623', '#EC4899', '#4E8FF7', '#A855F7', '#0EA5E9'];

function loadExploreSession() {
  try {
    return JSON.parse(localStorage.getItem(EXPLORE_SESSION_KEY)) || { taps: 0, counts: {} };
  } catch {
    return { taps: 0, counts: {} };
  }
}

function saveExploreSession(data) {
  try {
    localStorage.setItem(EXPLORE_SESSION_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : { inputMethod: 'write' };
  } catch {
    return { inputMethod: 'write' };
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

function buildProblem(mode, grade) {
  if (mode === 'sentence') {
    const op = shuffle(gradeOps(grade))[0];
    return buildSentenceQuestion(op, gradeTier(grade));
  }
  if (mode === 'clock') {
    return buildClockProblem(gradeTier(grade));
  }

  const op = mode === 'random' ? shuffle(gradeOps(grade))[0] : mode;
  const [[aMin, aMax], [bMin, bMax]] = (GRADE_RANGES[grade] || GRADE_RANGES[DEFAULT_GRADE])[op];
  let a = randInt(aMin, aMax);
  let b = randInt(bMin, bMax);
  if (op === 'multiply') {
    if (Math.random() < 0.5) [a, b] = [b, a];
    return { a, b, op, symbol: '×', correct: a * b };
  }
  if (op === 'add') {
    return { a, b, op, symbol: '+', correct: a + b };
  }
  b = Math.min(b, a);
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

function makeProblem(op, grade) {
  if (isSkillConcept(op)) return buildSkillProblem(op, gradeTier(grade));
  return buildProblem(op, grade);
}

// A worksheet's worth of problems, skipping exact repeats where it can
// (easy levels have few possible problems, so some repeats are allowed).
function makeWorksheet(op, level, count) {
  const seen = new Set();
  const problems = [];
  for (let tries = 0; problems.length < count && tries < count * 20; tries++) {
    const p = makeProblem(op, level);
    const key = JSON.stringify(p);
    if (seen.has(key) && tries < count * 10) continue;
    seen.add(key);
    problems.push(p);
  }
  return problems;
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

function voiceUpgradeTip() {
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isMac = /Macintosh/.test(ua) && !isIOS;
  const isWindows = /Windows/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isEdge = /Edg\//.test(ua);
  if (isEdge) return null;
  if (isIOS || isMac) {
    return 'Tip: For a more natural voice, go to Settings → Accessibility → Spoken Content → Voices, and download an Enhanced or Premium English voice — MathPop will use it automatically.';
  }
  if (isWindows) {
    return 'Tip: For the best free voice, open MathPop in Microsoft Edge — it comes with a natural-sounding voice built in, no setup needed.';
  }
  if (isAndroid) {
    return 'Tip: For a more natural voice, go to Settings → Accessibility → Text-to-speech output, and install higher-quality voice data.';
  }
  return null;
}

// Progress is kept per grade. Older saves were kept per Easy/Medium/Hard
// level; those carry over to the grade that matches them.
const OLD_LEVEL_GRADES = { easy: '1', medium: '2', hard: '4' };

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
    for (const [oldLevel, grade] of Object.entries(OLD_LEVEL_GRADES)) {
      if (saved[oldLevel] && !saved[grade]) saved[grade] = saved[oldLevel];
      delete saved[oldLevel];
    }
    return saved;
  } catch {
    return {};
  }
}

function loadGrade() {
  try {
    const saved = localStorage.getItem(GRADE_KEY);
    return saved && gradeInfo(saved).id === saved ? saved : DEFAULT_GRADE;
  } catch {
    return DEFAULT_GRADE;
  }
}

function saveGrade(grade) {
  try {
    localStorage.setItem(GRADE_KEY, grade);
  } catch {
    /* ignore */
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
              <img className="logo-mark" src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" />
              <span className="ink">Math</span>
              <span className="pop-blue">P</span>
              <span className="pop-purple">o</span>
              <span className="pop-green">p</span>
            </h1>
          </button>
        ) : (
          <h1 className="logo">
            <img className="logo-mark" src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" />
            <span className="ink">Math</span>
            <span className="pop-blue">P</span>
            <span className="pop-purple">o</span>
            <span className="pop-green">p</span>
          </h1>
        )}
        {!showBack && (
          <div className="brand-actions">
            <LevelSwitcher level={level} onChange={onChangeLevel} />
            <button className="settings-btn" onClick={onSettings} aria-label="Settings">
              ⚙️
            </button>
          </div>
        )}
      </div>
      {showBack && (
        <div className="nav-row">
          <button className="back-link" onClick={onBack}>
            ← Back
          </button>
          <LevelSwitcher level={level} onChange={onChangeLevel} />
        </div>
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
  const [returnView, setReturnView] = useState('home');
  const [level, setLevel] = useState(loadGrade);
  const [progress, setProgress] = useState(loadProgress);
  // The loading screen shown as the app opens, while the fonts and the
  // handwriting reader get ready. At least OPENING_MIN_MS so it doesn't
  // just flicker, and at most OPENING_MAX_MS (e.g. on a slow connection).
  const [opening, setOpening] = useState(true);
  useEffect(() => {
    const started = performance.now();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setOpening(false);
    };
    const cap = setTimeout(finish, OPENING_MAX_MS);
    let wait;
    Promise.all([document.fonts?.ready, loadDigitModel()].map((p) => Promise.resolve(p).catch(() => {}))).then(() => {
      wait = setTimeout(finish, Math.max(0, OPENING_MIN_MS - (performance.now() - started)));
    });
    return () => {
      clearTimeout(cap);
      clearTimeout(wait);
    };
  }, []);
  const [settings, setSettings] = useState(loadSettings);
  const levelStats = progress[level] || { total: 0, correct: 0 };

  const [operation, setOperation] = useState('multiply');
  const [roundIndex, setRoundIndex] = useState(0);
  const [problem, setProblem] = useState(null);
  // Print worksheet: the options panel, and the sheet being printed.
  const [printPanel, setPrintPanel] = useState(false);
  const [printCount, setPrintCount] = useState(10);
  const [printKey, setPrintKey] = useState(true);
  const [printSet, setPrintSet] = useState(null);
  const [options, setOptions] = useState([]);
  const [answerCorrect, setAnswerCorrect] = useState(false);
  const [chosen, setChosen] = useState(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionResults, setSessionResults] = useState({});
  const [sessionLog, setSessionLog] = useState([]);
  const [firstAttempt, setFirstAttempt] = useState(true);

  const [exploreSession, setExploreSession] = useState(loadExploreSession);
  const [explorePlayed, setExplorePlayed] = useState(null);
  const [voiceQuality, setVoiceQuality] = useState('piper');

  useEffect(() => {
    prewarmVoices();
    getVoiceQuality().then(setVoiceQuality);

    // Mobile browsers only allow audio to start playing when it's tied to
    // a real tap. Speech is generated asynchronously, so by the time it's
    // ready the tap that triggered it may no longer count — priming a
    // silent clip on the very first tap anywhere unlocks audio for the
    // rest of the session.
    const unlock = () => {
      unlockAudio();
      document.removeEventListener('pointerdown', unlock);
    };
    document.addEventListener('pointerdown', unlock, { once: true });
    return () => document.removeEventListener('pointerdown', unlock);
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

  function sessionBack() {
    setView(returnView);
  }

  const exploreLang = EXPLORE_LANGUAGES.find((l) => l.key === settings.exploreLang) || EXPLORE_LANGUAGES[0];

  function exploreTap(n) {
    if (exploreSession.taps >= EXPLORE_SESSION_TAPS) return;
    speakInLanguage(exploreLang.say ? exploreLang.say[n] : String(n), exploreLang.lang);
    setExplorePlayed(n);
    if (navigator.vibrate) navigator.vibrate(15);
    setExploreSession((prev) => {
      const next = {
        taps: prev.taps + 1,
        counts: { ...prev.counts, [n]: (prev.counts[n] || 0) + 1 },
      };
      saveExploreSession(next);
      return next;
    });
  }

  function explorePlayAgain() {
    const next = { taps: 0, counts: {} };
    setExploreSession(next);
    saveExploreSession(next);
    setExplorePlayed(null);
  }

  function updateExploreLang(key) {
    const newSettings = { ...settings, exploreLang: key };
    setSettings(newSettings);
    saveSettings(newSettings);
  }

  function updateInputMethod(method) {
    const newSettings = { ...settings, inputMethod: method };
    setSettings(newSettings);
    saveSettings(newSettings);
  }

  function changeLevel(newLevel) {
    setLevel(newLevel);
    saveGrade(newLevel);
    if (view === 'question' && problem) {
      const next = makeProblem(operation, newLevel);
      setProblem(next);
      setOptions(makeOptions(next));
      setChosen(null);
    }
  }

  // `from` is the screen Back returns to; Play again keeps the last one.
  function startOperation(op, from) {
    if (from) setReturnView(from);
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

  // Once the worksheet is on the page, open the print dialog.
  useEffect(() => {
    if (!printSet) return;
    const id = setTimeout(() => window.print(), 50);
    return () => clearTimeout(id);
  }, [printSet]);

  function printWorksheet() {
    setPrintPanel(false);
    setPrintSet({ problems: makeWorksheet(operation, level, printCount), withKey: printKey, id: Date.now() });
  }

  const modeLabel = isSkillConcept(operation)
    ? SKILL_META[operation].label.toLowerCase()
    : operation === 'random'
      ? 'random mix'
      : operation === 'sentence'
        ? 'word problem'
        : OPERATIONS[operation].label.toLowerCase();

  if (opening) {
    return (
      <div className="opening" role="status" aria-label="MathPop is opening">
        <img className="opening-mark" src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" />
        <span className="logo opening-word">
          <span className="ink">Math</span>
          <span className="pop-blue">P</span>
          <span className="pop-purple">o</span>
          <span className="pop-green">p</span>
        </span>
        <span className="opening-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </div>
    );
  }

  return (
    // The home page fits one phone screen, no scrolling.
    <div className={view === 'home' ? 'page page-fit' : 'page'}>
      <div className={view === 'home' ? 'app home-fit' : 'app'}>
        {view === 'home' && (
          <>
            <AppHeader level={level} onChangeLevel={changeLevel} showBack={false} onSettings={() => setView('settings')} />
            <section className="home-hero">
              <div className="home-hero-ops" aria-hidden="true">
                {HERO_OPS.map((op) => (
                  <span key={op.symbol} className="home-hero-op" style={{ background: op.color }}>
                    {op.symbol}
                  </span>
                ))}
              </div>
              <h2 className="home-hello">Ready to pop some math?</h2>
              <p className="home-tagline">Pick a game, answer ten problems, and watch your score grow.</p>
              <div className="home-stats">
                {levelStats.total ? (
                  <>
                    <span className="home-stat">✅ {levelStats.total} solved</span>
                    <span className="home-stat">🎯 {Math.round((levelStats.correct / levelStats.total) * 100)}% right</span>
                  </>
                ) : (
                  <span className="home-stat">⭐ Start your first round</span>
                )}
              </div>
            </section>

            <section className="quick-set" aria-label="Quick play">
              <button className="home-cta" onClick={() => startOperation('random', 'home')}>
                <span className="home-cta-icon" aria-hidden="true">
                  🎲
                </span>
                <span className="home-cta-text">
                  <span className="home-cta-title">Random Mix</span>
                  <span className="home-cta-sub">A bit of everything</span>
                </span>
                <span className="home-cta-arrow" aria-hidden="true">
                  →
                </span>
              </button>
              <button className="quick-explore" onClick={() => setView('explore')}>
                <span className="quick-explore-icon" aria-hidden="true">
                  🔢
                </span>
                <span className="home-cta-text">
                  <span className="quick-explore-title">Explore Numbers</span>
                  <span className="quick-explore-sub">Tap a number, hear it out loud</span>
                </span>
                <span className="quick-explore-arrow" aria-hidden="true">
                  →
                </span>
              </button>
            </section>

            <h3 className="home-section-title">Practice</h3>
            <div className="home-grid">
              {gradePractice(level).map((id) => {
                const card = PRACTICE_CARDS[id];
                return (
                  <button
                    key={id}
                    className="home-card"
                    style={{ '--card-from': card.from, '--card-to': card.to }}
                    onClick={() => (id === 'skills' ? setView('skills') : startOperation(id, 'home'))}
                  >
                    <span className="home-card-icon" aria-hidden="true">
                      {card.icon}
                    </span>
                    <span className="home-card-text">
                      <span className="home-card-title">{card.title}</span>
                      <span className="home-card-sub">{card.sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {!IS_NATIVE && (
              <a className="all-apps-link" href="https://marikalam.github.io/apps/">
                ← More apps
              </a>
            )}
          </>
        )}

        {view === 'explore' && (
          <>
            <AppHeader level={level} onChangeLevel={changeLevel} showBack onBack={goHome} />
            {exploreSession.taps >= EXPLORE_SESSION_TAPS ? (
              <div className="complete-wrap">
                <div className="complete-emoji">🌟</div>
                <h2 className="screen-title">All done!</h2>
                <p className="screen-sub">You tapped {EXPLORE_SESSION_TAPS} numbers.</p>
                <div className="explore-tally">
                  {EXPLORE_NUMBERS.filter((n) => exploreSession.counts[n]).map((n) => (
                    <div key={n} className="explore-tally-chip" style={{ background: EXPLORE_COLORS[n] }}>
                      {n}: {exploreSession.counts[n]}
                    </div>
                  ))}
                </div>
                <div className="feedback-actions">
                  <button className="pill-btn-primary" onClick={explorePlayAgain}>
                    Play again →
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="explore-lang-row" role="radiogroup" aria-label="Language">
                  {EXPLORE_LANGUAGES.map((l) => (
                    <button
                      key={l.key}
                      role="radio"
                      aria-checked={l.key === exploreLang.key}
                      className={`explore-lang-btn${l.key === exploreLang.key ? ' explore-lang-btn-active' : ''}`}
                      onClick={() => updateExploreLang(l.key)}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
                <div className="explore-counter">
                  {exploreSession.taps} / {EXPLORE_SESSION_TAPS}
                </div>
                <div className="explore-grid">
                  {EXPLORE_NUMBERS.map((n) => (
                    <button
                      key={n}
                      className={`explore-btn${n === 10 ? ' explore-btn-wide' : ''}${explorePlayed === n ? ' explore-btn-played' : ''}`}
                      style={{ background: EXPLORE_COLORS[n] }}
                      aria-label={`Say the number ${n}`}
                      onClick={() => exploreTap(n)}
                    >
                      <span className="explore-digit">{n}</span>
                      {exploreLang.show && <span className="explore-word">{exploreLang.show[n]}</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
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
                        onClick={() => startOperation(concept.id, 'skills')}
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
                <button
                  className={`pill-btn-${settings.inputMethod === 'write' ? 'primary' : 'secondary'} pill-btn-full`}
                  onClick={() => updateInputMethod('write')}
                  style={{ padding: '20px', fontSize: '16px', fontWeight: '600' }}
                >
                  {settings.inputMethod === 'write' ? '✓ ' : ''}Write the answer
                </button>
              </div>
              {voiceQuality === 'basic-system' && voiceUpgradeTip() && (
                <p className="screen-sub voice-tip">{voiceUpgradeTip()}</p>
              )}
            </div>
          </>
        )}

        {view === 'question' && problem && (
          <>
            <AppHeader level={level} onChangeLevel={changeLevel} showBack onBack={sessionBack} />
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
            {problem.op === 'add' && problem.type !== 'sentence' && problem.type !== 'skill' && (
              <button className="help-btn" onClick={() => setView('help')}>
                🤔 Need help?
              </button>
            )}
            <button className="print-open-btn" onClick={() => setPrintPanel(true)}>
              🖨️ Print worksheet
            </button>

            <div className="answer-area">
            {settings.inputMethod === 'write' && problem.type !== 'clock' && problem.answerType !== 'choice' ? (
              <WritePad onSubmit={chooseAnswer} />
            ) : settings.inputMethod === 'type' && problem.type !== 'clock' && problem.answerType !== 'choice' ? (
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
            </div>
          </>
        )}

        {view === 'help' && problem && (
          <>
            <AppHeader level={level} onChangeLevel={changeLevel} showBack onBack={() => setView('question')} />
            <AdditionHelp a={problem.a} b={problem.b} onClose={() => setView('question')} />
          </>
        )}

        {view === 'feedback' && problem && (
          <>
            <AppHeader level={level} onChangeLevel={changeLevel} showBack onBack={sessionBack} />
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
            <AppHeader level={level} onChangeLevel={changeLevel} showBack onBack={sessionBack} />
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

        {printPanel && (
          <div className="print-panel-backdrop" onClick={() => setPrintPanel(false)}>
            <div
              className="print-panel"
              role="dialog"
              aria-label="Print a worksheet"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="print-panel-title">🖨️ Print a worksheet</h2>
              <p className="print-panel-sub">
                New {modeLabel} problems at this level, to do on paper.
              </p>
              <div className="print-count" role="radiogroup" aria-label="How many questions">
                {[10, 20].map((n) => (
                  <button
                    key={n}
                    role="radio"
                    aria-checked={printCount === n}
                    className={`print-count-btn${printCount === n ? ' print-count-btn-active' : ''}`}
                    onClick={() => setPrintCount(n)}
                  >
                    {n} questions
                  </button>
                ))}
              </div>
              <label className="print-key-toggle">
                <input type="checkbox" checked={printKey} onChange={(e) => setPrintKey(e.target.checked)} />
                Include an answer key (on its own page)
              </label>
              <button className="pill-btn-primary print-go" onClick={printWorksheet}>
                Print
              </button>
              <button className="print-cancel" onClick={() => setPrintPanel(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {printSet && (
          <PrintSheet
            key={printSet.id}
            problems={printSet.problems}
            title={modeLabel.charAt(0).toUpperCase() + modeLabel.slice(1)}
            levelLabel={gradeInfo(level).label}
            withKey={printSet.withKey}
          />
        )}
      </div>
    </div>
  );
}
