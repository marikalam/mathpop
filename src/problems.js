// The app's own games: adding, taking away, times and sharing problems,
// word problems and the clock. (The grade sections' other games live in
// topics.js, skillBuilders.js and preK.jsx.)
import { SentenceQuestionTemplates } from './types.js';
import { gradeInfo, gradeOperands, gradeOps, gradeTier } from './grades.js';

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

export function formatTime(hour, minute) {
  return `${hour}:${String(minute).padStart(2, '0')}`;
}

// Kindergarten reads the hour, Primary 1 and 2 to 5 minutes (sometimes
// the hour or half hour in Primary 1), Primary 3 and 4 to the minute.
function buildClockProblem(grade) {
  const g = gradeInfo(grade).id;
  const level = gradeTier(grade);
  const hour = randInt(1, 12);
  let minute;
  if (g === 'p' || g === 'k') minute = 0;
  else if (g === '1') minute = Math.random() < 0.4 ? shuffle([0, 30])[0] : randInt(0, 11) * 5;
  else if (g === '2') minute = randInt(0, 11) * 5;
  else minute = Math.random() < 0.5 ? randInt(0, 59) : randInt(0, 11) * 5;
  // How far apart the wrong answers are (buildOptions).
  const step = g === 'p' || g === 'k' ? 60 : 5;
  return { type: 'clock', op: 'clock', hour, minute, correct: formatTime(hour, minute), level, step };
}

export function buildProblem(mode, grade) {
  if (mode === 'sentence') {
    // Word problems are written for adding, taking away and multiplying.
    const op = shuffle(gradeOps(grade).filter((o) => SentenceQuestionTemplates[o]))[0];
    return buildSentenceQuestion(op, gradeTier(grade));
  }
  if (mode === 'clock') {
    return buildClockProblem(grade);
  }

  const op = mode === 'random' ? shuffle(gradeOps(grade))[0] : mode;
  let [a, b] = gradeOperands(grade, op);
  if (op === 'multiply') {
    if (Math.random() < 0.5) [a, b] = [b, a];
    return { a, b, op, symbol: '×', correct: a * b };
  }
  if (op === 'add') {
    return { a, b, op, symbol: '+', correct: a + b };
  }
  if (op === 'divide') {
    return { a, b, op, symbol: '÷', correct: a / b };
  }
  return { a, b, op, symbol: '−', correct: a - b };
}
