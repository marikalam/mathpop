// Practice games for the grade sections (curriculum.js), following the
// Singapore math syllabus (K2 to Primary 4) and Beast Academy (Levels 1 to
// 4). Each builder takes (tier, grade) and returns a problem like the ones
// in skillBuilders.js: a prompt, the correct answer, and either a numeric
// answer or a list of choices. `visual` is drawn above the prompt by
// TopicVisual.jsx (plain data, so worksheets can tell problems apart).

import { storyName, storyNames } from './storyNames.js';

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Only fractions less than 1 (no 2/1 or 3/3), for 'what fraction is…'.
const properFraction = (f) => {
  const [a, b] = f.split('/').map(Number);
  return a > 0 && a < b;
};

// The correct answer and up to three different wrong ones, shuffled.
function withChoices(correct, wrong) {
  const others = [...new Set(wrong.filter((w) => w !== correct))];
  return shuffle([correct, ...shuffle(others).slice(0, 3)]);
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

const fmt = (n) => n.toLocaleString('en-US');
const MINUS = '−';
const signed = (n) => (n < 0 ? `${MINUS}${-n}` : String(n));

// ---------------- Numbers ----------------

// Counting to 20 in ten frames, the Singapore way (K2).
function framesProblem() {
  const n = randInt(5, 20);
  const near = [n - 1, n + 1, n - 2, n + 2, n + 10, n - 10].filter((x) => x >= 1 && x <= 20);
  return {
    visual: { kind: 'tenFrames', n },
    prompt: 'How many dots?',
    correct: n,
    answerType: 'choice',
    choices: withChoices(n, near),
    answerLabel: `${n} dots`,
    speech: 'How many dots are there?',
    questionTitle: 'Count the dots',
  };
}

const ORDER_MAX = { k: 20, 1: 100, 2: 1000, 3: 10000, 4: 100000 };

// Before, after and between (K2, P1); 10, 100 or 1,000 more or less (P1-P4).
function numberOrderProblem(tier, grade) {
  const max = ORDER_MAX[grade] || 100;
  if (grade === 'k' || (grade === '1' && Math.random() < 0.5)) {
    const n = randInt(2, max - 1);
    const kind = pick(['before', 'after', 'between']);
    if (kind === 'between') {
      return {
        prompt: `What number is between ${n - 1} and ${n + 1}?`,
        correct: n,
        answerType: 'numeric',
        answerLabel: `${n - 1}, ${n}, ${n + 1}`,
        speech: `What number is between ${n - 1} and ${n + 1}?`,
        questionTitle: 'Number order',
      };
    }
    const correct = kind === 'before' ? n - 1 : n + 1;
    return {
      prompt: `What number comes just ${kind} ${n}?`,
      correct,
      answerType: 'numeric',
      answerLabel: kind === 'before' ? `${correct}, ${n}` : `${n}, ${correct}`,
      speech: `What number comes just ${kind} ${n}?`,
      questionTitle: 'Number order',
    };
  }
  const steps = { 1: [10], 2: [10, 100], 3: [10, 100, 1000], 4: [100, 1000, 10000] }[grade] || [10];
  const step = pick(steps);
  const more = Math.random() < 0.5;
  const n = more ? randInt(step, max - step - 1) : randInt(step, max - 1);
  const correct = more ? n + step : n - step;
  return {
    prompt: `What is ${fmt(step)} ${more ? 'more' : 'less'} than ${fmt(n)}?`,
    correct,
    answerType: 'numeric',
    answerLabel: `${fmt(n)} ${more ? '+' : MINUS} ${fmt(step)} = ${fmt(correct)}`,
    speech: `What is ${step} ${more ? 'more' : 'less'} than ${n}?`,
    questionTitle: `${fmt(step)} more, ${fmt(step)} less`,
  };
}

const SKIP_STEPS = { 1: [2, 5, 10], 2: [2, 3, 4, 5, 10, 100], 3: [6, 7, 8, 9, 25, 50], 4: [25, 250, 500, 1000] };

// Skip-counting patterns (P1-P3, Beast Academy 3A).
function skipCountProblem(tier, grade) {
  const step = pick(SKIP_STEPS[grade] || SKIP_STEPS[2]);
  const start = step * randInt(0, step >= 100 ? 8 : 6) + (Math.random() < 0.3 && step < 10 ? randInt(1, step - 1) : 0);
  const down = grade !== '1' && Math.random() < 0.3;
  const seq = Array.from({ length: 5 }, (_, i) => (down ? start + step * (4 - i) : start + step * i));
  const hole = randInt(1, 4);
  const correct = seq[hole];
  const shown = seq.map((n, i) => (i === hole ? '?' : fmt(n)));
  return {
    prompt: shown.join(', '),
    correct,
    answerType: 'numeric',
    answerLabel: seq.map(fmt).join(', '),
    speech: `Count by ${step}s. ${seq.map((n, i) => (i === hole ? 'what' : n)).join(', ')}`,
    hint: `Count ${down ? 'back' : 'on'} by ${fmt(step)}s.`,
    questionTitle: 'Find the missing number',
  };
}

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const ORDINAL_WORDS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];
const LINE_ANIMALS = ['🐶', '🐱', '🐰', '🐸', '🐵', '🐷', '🐔', '🐻', '🦊', '🐼'];

// First, second, third... in a line (P1).
function ordinalProblem() {
  const row = shuffle(LINE_ANIMALS).slice(0, 7);
  const i = randInt(0, 6);
  if (Math.random() < 0.5) {
    return {
      visual: { kind: 'line', items: row },
      prompt: `Which animal is ${ORDINALS[i]} from the left?`,
      correct: row[i],
      answerType: 'choice',
      choiceKind: 'emoji',
      choices: withChoices(row[i], row),
      answerLabel: `${row[i]} is ${ORDINALS[i]}`,
      speech: `Which animal is ${ORDINAL_WORDS[i]} from the left?`,
      questionTitle: 'Ordinal numbers',
    };
  }
  return {
    visual: { kind: 'line', items: row },
    prompt: `The ${row[i]} is in which place from the left?`,
    correct: ORDINALS[i],
    answerType: 'choice',
    choices: withChoices(ORDINALS[i], ORDINALS.slice(0, 7)),
    answerLabel: `${row[i]} is ${ORDINALS[i]}`,
    speech: 'This animal is in which place from the left?',
    speechAnswer: ORDINAL_WORDS[i],
    questionTitle: 'Ordinal numbers',
  };
}

// Place value by grade: tens and ones (K2, P1) up to ten thousands (P4).
function placeValueProblem(tier, grade) {
  const digits = { k: 2, 1: 2, 2: 3, 3: 4, 4: pick([5, 5, 6]) }[grade] || 3;
  const names = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands'];
  let n;
  let place;
  let digit;
  for (let i = 0; i < 10; i++) {
    n = grade === 'k' ? randInt(11, 20) : randInt(10 ** (digits - 1), 10 ** digits - 1);
    place = randInt(0, String(n).length - 1);
    digit = Math.floor(n / 10 ** place) % 10;
    if (digit !== 0) break;
  }
  const value = digit * 10 ** place;
  // 'The digit 2' only makes sense when there is just one 2.
  const unique = String(n).split('').filter((d) => d === String(digit)).length === 1;
  if (unique && Math.random() < 0.5) {
    return {
      prompt: `In ${fmt(n)}, what is the value of the digit ${digit}?`,
      correct: value,
      answerType: 'numeric',
      answerLabel: `The ${digit} is in the ${names[place]} place: ${fmt(value)}`,
      speech: `In ${n}, what is the value of the digit ${digit}?`,
      hint: grade === 'k' || grade === '1' ? `${n} is ${Math.floor(n / 10)} tens and ${n % 10} ones.` : undefined,
      questionTitle: 'Place value',
    };
  }
  return {
    prompt: `In ${fmt(n)}, which digit is in the ${names[place]} place?`,
    correct: digit,
    answerType: 'numeric',
    answerLabel: `${digit} is in the ${names[place]} place`,
    speech: `In ${n}, which digit is in the ${names[place]} place?`,
    questionTitle: 'Place value',
  };
}

const COMPARE_MAX = { k: 20, 1: 100, 2: 1000, 3: 10000, 4: 100000 };

function compareSigns(a, b, left, right, speechLeft, speechRight) {
  const correct = a < b ? '<' : a > b ? '>' : '=';
  return {
    promptKind: 'compare',
    compareLeft: left,
    compareRight: right,
    prompt: `Compare ${left} and ${right}`,
    correct,
    answerType: 'choice',
    choices: shuffle(['<', '>', '=']),
    answerLabel: `${left} ${correct} ${right}`,
    speech: `Is ${speechLeft ?? left} less than, greater than, or equal to ${speechRight ?? right}?`,
    speechAnswer: correct === '<' ? 'less than' : correct === '>' ? 'greater than' : 'equal to',
    questionTitle: 'Which sign is correct?',
  };
}

// Comparing numbers by grade (K2 to P4, Beast Academy 1A and 2A).
function compareProblem(tier, grade) {
  const max = COMPARE_MAX[grade] || 100;
  const a = randInt(1, max - 1);
  let b;
  if (Math.random() < 0.12) b = a;
  else if (a >= 100 && Math.random() < 0.6) {
    // Same leading digits, so the kid has to look past the first place.
    const s = String(a).split('');
    const i = randInt(1, s.length - 1);
    s[i] = String((Number(s[i]) + randInt(1, 9)) % 10);
    b = Number(s.join(''));
  } else b = randInt(1, max - 1);
  return compareSigns(a, b, fmt(a), fmt(b), a, b);
}

// Rounding (P4) and estimating (Beast Academy 3D).
function roundingProblem(tier, grade) {
  const to = grade === '3' ? pick([10, 100]) : pick([10, 100, 1000]);
  const n = grade === '3' ? randInt(to + 1, 9999) : randInt(1000, 99999);
  const correct = Math.round(n / to) * to;
  if (n % to === 0) return roundingProblem(tier, grade);
  return {
    prompt: `Round ${fmt(n)} to the nearest ${fmt(to)}.`,
    correct,
    answerType: 'numeric',
    answerLabel: `${fmt(n)} ≈ ${fmt(correct)}`,
    speech: `Round ${n} to the nearest ${to}.`,
    hint: `Look at the digit to the right of the ${to === 10 ? 'tens' : to === 100 ? 'hundreds' : 'thousands'} place: 5 or more rounds up.`,
    questionTitle: 'Rounding',
  };
}

function estimateProblem(tier, grade) {
  if (Math.random() < 0.5) return roundingProblem(tier, grade);
  const a = randInt(11, 89) * 10 + pick([-2, -1, 1, 2, 3]);
  const b = randInt(11, 89) * 10 + pick([-2, -1, 1, 2, 3]);
  const add = Math.random() < 0.6 || a === b;
  const [x, y] = add ? [a, b] : [Math.max(a, b), Math.min(a, b)];
  const rx = Math.round(x / 100) * 100;
  const ry = Math.round(y / 100) * 100;
  const correct = add ? rx + ry : rx - ry;
  if (!add && correct <= 0) return estimateProblem(tier, grade);
  return {
    prompt: `About how much is ${x} ${add ? '+' : MINUS} ${y}?`,
    correct,
    answerType: 'choice',
    choices: withChoices(correct, [correct + 100, correct - 100, correct + 200, correct + 1000].filter((v) => v > 0)),
    answerLabel: `${x} ≈ ${rx}, ${y} ≈ ${ry}, so about ${correct}`,
    speech: `About how much is ${x} ${add ? 'plus' : 'minus'} ${y}?`,
    hint: 'Round each number to the nearest hundred first.',
    questionTitle: 'Estimate',
  };
}

// Negative numbers (Beast Academy 4C: integers).
function negativeProblem() {
  const kind = pick(['line', 'colder', 'compare', 'subtract']);
  if (kind === 'line') {
    const n = randInt(-9, 9);
    return {
      visual: { kind: 'numberLine', from: -10, to: 10, mark: n },
      prompt: 'What number is the arrow pointing to?',
      correct: signed(n),
      answerType: 'choice',
      choices: withChoices(signed(n), [signed(-n), signed(n + 1), signed(n - 1), signed(n + 2)]),
      answerLabel: signed(n),
      speech: 'What number is the arrow pointing to?',
      speechAnswer: n < 0 ? `negative ${-n}` : String(n),
      questionTitle: 'Negative numbers',
    };
  }
  if (kind === 'compare') {
    const a = randInt(-12, 8);
    const b = randInt(-12, 8);
    return compareSigns(a, b, signed(a), signed(b), a < 0 ? `negative ${-a}` : a, b < 0 ? `negative ${-b}` : b);
  }
  const start = kind === 'colder' ? randInt(-3, 8) : randInt(1, 9);
  const drop = randInt(start + 1, start + 8);
  const correct = start - drop;
  if (kind === 'colder') {
    return {
      visual: { kind: 'numberLine', from: -10, to: 10 },
      prompt: `It is ${signed(start)}°C. It gets ${drop} degrees colder. What is the temperature now?`,
      correct: `${signed(correct)}°C`,
      answerType: 'choice',
      choices: withChoices(`${signed(correct)}°C`, [`${signed(-correct)}°C`, `${signed(correct + 1)}°C`, `${signed(correct - 1)}°C`, `${signed(start + drop)}°C`]),
      answerLabel: `${signed(start)} ${MINUS} ${drop} = ${signed(correct)}`,
      speech: `It is ${start < 0 ? `negative ${-start}` : start} degrees. It gets ${drop} degrees colder. What is the temperature now?`,
      speechAnswer: `negative ${-correct} degrees`,
      questionTitle: 'Negative numbers',
    };
  }
  return {
    visual: { kind: 'numberLine', from: -10, to: 10 },
    prompt: `${start} ${MINUS} ${drop} = ?`,
    correct: signed(correct),
    answerType: 'choice',
    choices: withChoices(signed(correct), [signed(-correct), signed(correct + 1), signed(correct - 1), signed(start + drop)]),
    answerLabel: `${start} ${MINUS} ${drop} = ${signed(correct)}`,
    speech: `${start} minus ${drop} equals what?`,
    speechAnswer: `negative ${-correct}`,
    hint: `Start at ${start} on the number line and jump ${drop} to the left.`,
    questionTitle: 'Negative numbers',
  };
}

const SUPER = { 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶' };

// Exponents (Beast Academy 4A).
function exponentsProblem() {
  const kind = pick(['power', 'power', 'ten', 'compare']);
  if (kind === 'compare') {
    const [a, b] = pick([[2, 5], [2, 3], [3, 4], [2, 6], [3, 5]]);
    return compareSigns(a ** b, b ** a, `${a}${SUPER[b]}`, `${b}${SUPER[a]}`, `${a} to the power of ${b}`, `${b} to the power of ${a}`);
  }
  if (kind === 'ten') {
    const e = randInt(2, 5);
    return {
      prompt: `10${SUPER[e]} = ?`,
      correct: 10 ** e,
      answerType: 'numeric',
      answerLabel: `10${SUPER[e]} = ${Array(e).fill(10).join(' × ')} = ${fmt(10 ** e)}`,
      speech: `What is 10 to the power of ${e}?`,
      hint: `10${SUPER[e]} is 1 followed by ${e} zeros.`,
      questionTitle: 'Exponents',
    };
  }
  const [base, e] = pick([[2, 2], [2, 3], [2, 4], [2, 5], [3, 2], [3, 3], [4, 2], [4, 3], [5, 2], [5, 3], [6, 2], [7, 2], [8, 2], [9, 2]]);
  return {
    prompt: `${base}${SUPER[e]} = ?`,
    correct: base ** e,
    answerType: 'numeric',
    answerLabel: `${base}${SUPER[e]} = ${Array(e).fill(base).join(' × ')} = ${base ** e}`,
    speech: `What is ${base} to the power of ${e}?`,
    hint: `${base}${SUPER[e]} means ${Array(e).fill(base).join(' × ')}.`,
    questionTitle: 'Exponents',
  };
}

const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
const isPrime = (n) => PRIMES.includes(n);

// Primes (Beast Academy 4C: factors).
function primesProblem() {
  if (Math.random() < 0.6) {
    const correct = pick(PRIMES.filter((p) => p > 5));
    const composites = [];
    while (composites.length < 3) {
      const c = randInt(9, 99);
      if (!isPrime(c) && c % 2 === 1 && !composites.includes(c)) composites.push(c);
    }
    return {
      prompt: 'Which number is prime?',
      correct,
      answerType: 'choice',
      choices: shuffle([correct, ...composites]),
      answerLabel: `${correct} is prime: only 1 × ${correct} makes it`,
      speech: 'Which number is prime?',
      hint: 'A prime number has exactly two factors: 1 and itself.',
      questionTitle: 'Prime numbers',
    };
  }
  const i = randInt(2, PRIMES.length - 2);
  const after = randInt(PRIMES[i], PRIMES[i + 1] - 1);
  return {
    prompt: `What is the first prime number after ${after}?`,
    correct: PRIMES[i + 1],
    answerType: 'numeric',
    answerLabel: `${PRIMES[i + 1]}`,
    speech: `What is the first prime number after ${after}?`,
    questionTitle: 'Prime numbers',
  };
}

// ---------------- Adding, subtracting, multiplying, dividing ----------------

// Missing digits, a first taste of Beast Academy's cryptarithms (2D).
function missingDigitProblem() {
  const a = randInt(12, 79);
  const b = randInt(12, 99 - a);
  const sum = a + b;
  const hideIn = pick(['a', 'b']);
  const n = hideIn === 'a' ? a : b;
  const place = randInt(0, 1);
  const digit = place === 0 ? n % 10 : Math.floor(n / 10);
  const s = String(n).split('');
  s[1 - place] = '□';
  const shownA = hideIn === 'a' ? s.join('') : a;
  const shownB = hideIn === 'b' ? s.join('') : b;
  return {
    prompt: `${shownA} + ${shownB} = ${sum}`,
    correct: digit,
    answerType: 'numeric',
    answerLabel: `${a} + ${b} = ${sum}`,
    speech: 'What digit goes in the box?',
    hint: 'Check the ones first, then the tens.',
    questionTitle: 'Missing digit',
  };
}

const GROUP_EMOJI = ['🍪', '🍎', '🌸', '⭐', '🐟', '🍓', '🧁', '⚽'];

// Equal groups, multiplying as adding the same number (P1, P2).
function equalGroupsProblem(tier, grade) {
  const groups = randInt(2, grade === '1' ? 4 : 5);
  const each = randInt(2, grade === '1' ? 5 : 6);
  const emoji = pick(GROUP_EMOJI);
  const correct = groups * each;
  return {
    visual: { kind: 'groups', groups, each, emoji },
    prompt: `${groups} groups of ${each}. How many in all?`,
    correct,
    answerType: 'numeric',
    answerLabel: `${Array(groups).fill(each).join(' + ')} = ${correct}   (${groups} × ${each})`,
    speech: `${groups} groups of ${each}. How many in all?`,
    hint: `Add ${each} again and again: ${Array(groups).fill(each).join(' + ')}`,
    questionTitle: 'Equal groups',
  };
}

// Sharing equally, a first look at dividing (P1, P2).
function sharingProblem(tier, grade) {
  const kids = randInt(2, grade === '1' ? 4 : 5);
  const each = randInt(2, 5);
  const total = kids * each;
  const emoji = pick(GROUP_EMOJI);
  return {
    visual: { kind: 'pile', n: total, emoji },
    prompt: `Share ${total} equally among ${kids} friends. How many does each friend get?`,
    correct: each,
    answerType: 'numeric',
    answerLabel: `${total} ÷ ${kids} = ${each}`,
    speech: `Share ${total} equally among ${kids} friends. How many does each friend get?`,
    hint: `Give one to each friend, again and again, until they're all gone.`,
    questionTitle: 'Share equally',
  };
}

// Division with remainders (P3, P4, Beast Academy 4B).
function remainderProblem(tier, grade) {
  const d = randInt(2, 9);
  const q = grade === '4' ? randInt(12, 99) : randInt(2, 12);
  const r = randInt(1, d - 1);
  const n = d * q + r;
  const askR = Math.random() < 0.6;
  return {
    prompt: askR ? `${n} ÷ ${d} = ${q} R ?` : `${n} ÷ ${d} = ? R ${r}`,
    correct: askR ? r : q,
    answerType: 'numeric',
    answerLabel: `${n} ÷ ${d} = ${q} R ${r}   (${d} × ${q} + ${r} = ${n})`,
    speech: askR ? `${n} divided by ${d} is ${q}, remainder what?` : `${n} divided by ${d} is what, remainder ${r}?`,
    hint: `Find the biggest ${d}s fact that fits in ${n}.`,
    questionTitle: 'Remainders',
  };
}

// Perfect squares (Beast Academy 3B).
function squaresProblem() {
  const n = randInt(2, 12);
  const kind = pick(['square', 'root', 'which']);
  if (kind === 'square') {
    return {
      visual: n <= 6 ? { kind: 'square', n } : undefined,
      prompt: `${n} × ${n} = ?`,
      correct: n * n,
      answerType: 'numeric',
      answerLabel: `${n} × ${n} = ${n * n}`,
      speech: `${n} times ${n} equals what?`,
      questionTitle: 'Perfect squares',
    };
  }
  if (kind === 'root') {
    return {
      prompt: `? × ? = ${n * n}`,
      correct: n,
      answerType: 'numeric',
      answerLabel: `${n} × ${n} = ${n * n}`,
      speech: `What number times itself equals ${n * n}?`,
      hint: 'Both numbers are the same.',
      questionTitle: 'Perfect squares',
    };
  }
  const others = [];
  while (others.length < 3) {
    const c = randInt(5, 140);
    if (!Number.isInteger(Math.sqrt(c)) && !others.includes(c)) others.push(c);
  }
  return {
    prompt: 'Which number is a perfect square?',
    correct: n * n,
    answerType: 'choice',
    choices: shuffle([n * n, ...others]),
    answerLabel: `${n * n} = ${n} × ${n}`,
    speech: 'Which number is a perfect square?',
    hint: 'A perfect square is a number times itself.',
    questionTitle: 'Perfect squares',
  };
}

// Breaking numbers apart to multiply (Beast Academy 3B: distributive property).
function distributiveProblem() {
  const a = randInt(3, 9);
  const b = randInt(11, 19);
  const ones = b - 10;
  if (Math.random() < 0.5) {
    return {
      prompt: `${a} × ${b} = ${a} × 10 + ${a} × ?`,
      correct: ones,
      answerType: 'numeric',
      answerLabel: `${a} × ${b} = ${a} × 10 + ${a} × ${ones} = ${a * b}`,
      speech: `${a} times ${b} equals ${a} times 10, plus ${a} times what?`,
      hint: `Break ${b} into 10 and ${ones}.`,
      questionTitle: 'Break it apart',
    };
  }
  return {
    prompt: `${a} × ${b} = ?`,
    correct: a * b,
    answerType: 'numeric',
    answerLabel: `${a} × 10 = ${a * 10}, ${a} × ${ones} = ${a * ones}, ${a * 10} + ${a * ones} = ${a * b}`,
    speech: `${a} times ${b} equals what?`,
    hint: `${a} × 10 + ${a} × ${ones}`,
    questionTitle: 'Break it apart',
  };
}

// Order of operations (Beast Academy 2B expressions, P4/P5).
function orderOpsProblem() {
  const kind = randInt(0, 3);
  let text;
  let value;
  let hint;
  if (kind === 0) {
    const [a, b, c] = [randInt(2, 20), randInt(2, 9), randInt(2, 9)];
    text = `${a} + ${b} × ${c}`;
    value = a + b * c;
    hint = 'Multiply before you add.';
  } else if (kind === 1) {
    const [b, c] = [randInt(2, 9), randInt(2, 9)];
    const a = b * c + randInt(1, 30);
    text = `${a} ${MINUS} ${b} × ${c}`;
    value = a - b * c;
    hint = 'Multiply before you subtract.';
  } else if (kind === 2) {
    const [a, b, c] = [randInt(2, 12), randInt(2, 9), randInt(2, 6)];
    text = `(${a} + ${b}) × ${c}`;
    value = (a + b) * c;
    hint = 'Do what is in the parentheses first.';
  } else {
    const c = randInt(2, 9);
    const q = randInt(2, 9);
    const a = randInt(q + 1, 40);
    text = `${a} ${MINUS} ${c * q} ÷ ${c}`;
    value = a - q;
    hint = 'Divide before you subtract.';
  }
  return {
    prompt: `${text} = ?`,
    correct: value,
    answerType: 'numeric',
    answerLabel: `${text} = ${value}`,
    speech: `${text.replace(/×/g, 'times').replace(/÷/g, 'divided by').replace(new RegExp(MINUS, 'g'), 'minus').replace(/[()]/g, '')} equals what?`,
    hint,
    questionTitle: 'Order of operations',
  };
}

// Letters for unknown numbers (Beast Academy 3C: variables).
function variablesProblem(tier, grade) {
  const letter = pick(['n', 'x', 'a', 'b', 'k']);
  const kind = grade === '4' ? randInt(0, 3) : randInt(0, 2);
  if (kind === 0) {
    const n = randInt(3, 40);
    const b = randInt(5, 40);
    return {
      prompt: `${letter} + ${b} = ${n + b}.  ${letter} = ?`,
      correct: n,
      answerType: 'numeric',
      answerLabel: `${letter} = ${n + b} ${MINUS} ${b} = ${n}`,
      speech: `${letter} plus ${b} equals ${n + b}. What is ${letter}?`,
      questionTitle: 'Find the unknown',
    };
  }
  if (kind === 1) {
    const n = randInt(2, 12);
    const b = randInt(2, 9);
    return {
      prompt: `${b} × ${letter} = ${n * b}.  ${letter} = ?`,
      correct: n,
      answerType: 'numeric',
      answerLabel: `${letter} = ${n * b} ÷ ${b} = ${n}`,
      speech: `${b} times ${letter} equals ${n * b}. What is ${letter}?`,
      questionTitle: 'Find the unknown',
    };
  }
  if (kind === 2) {
    const v = randInt(2, 9);
    const c = randInt(1, 15);
    return {
      prompt: `If ${letter} = ${v}, what is ${letter} + ${letter} + ${c}?`,
      correct: v + v + c,
      answerType: 'numeric',
      answerLabel: `${v} + ${v} + ${c} = ${v + v + c}`,
      speech: `If ${letter} equals ${v}, what is ${letter} plus ${letter} plus ${c}?`,
      questionTitle: 'Find the value',
    };
  }
  const n = randInt(2, 12);
  const m = randInt(2, 6);
  const c = randInt(1, 20);
  return {
    prompt: `${m} × ${letter} + ${c} = ${m * n + c}.  ${letter} = ?`,
    correct: n,
    answerType: 'numeric',
    answerLabel: `${m} × ${letter} = ${m * n}, so ${letter} = ${n}`,
    speech: `${m} times ${letter} plus ${c} equals ${m * n + c}. What is ${letter}?`,
    hint: `First take away ${c}.`,
    questionTitle: 'Find the unknown',
  };
}

// ---------------- Fractions and decimals ----------------

function simplify(a, b) {
  const g = gcd(a, b);
  return [a / g, b / g];
}

function fracText(a, b) {
  if (a === 0) return '0';
  const [n, d] = simplify(a, b);
  if (d === 1) return String(n);
  if (n > d) return `${Math.floor(n / d)} ${n % d}/${d}`;
  return `${n}/${d}`;
}

// What fraction is shaded? (P2, P3, Beast Academy 3D).
function fractionPictureProblem(tier, grade) {
  const b = grade === '2' ? pick([2, 3, 4]) : pick([3, 4, 5, 6, 8, 10]);
  const a = grade === '2' && Math.random() < 0.5 ? 1 : randInt(1, b - 1);
  const shape = b <= 8 && Math.random() < 0.5 ? 'circle' : 'bar';
  const correct = `${a}/${b}`;
  return {
    visual: { kind: 'fraction', shape, parts: b, shaded: a },
    prompt: 'What fraction is shaded?',
    correct,
    answerType: 'choice',
    choices: withChoices(correct, [`${b - a}/${b}`, `${a}/${b + 1}`, `${b}/${a}`, `${a + 1}/${b}`, `${a}/${b - a}`, `${a}/${b + 2}`, `${b - 1}/${b}`].filter(properFraction)),
    answerLabel: `${a} out of ${b} equal parts: ${correct}`,
    speech: 'What fraction is shaded?',
    questionTitle: 'Fractions',
  };
}

// Comparing fractions: unit fractions (P2), like or equivalent (P3),
// related denominators (P4).
function compareFractionsProblem(tier, grade) {
  let a, b, c, d;
  if (grade === '2') {
    [b, d] = shuffle([2, 3, 4, 5, 6, 8, 10]).slice(0, 2);
    a = 1;
    c = 1;
  } else if (grade === '3') {
    if (Math.random() < 0.5) {
      b = pick([5, 6, 7, 8, 9, 10, 12]);
      d = b;
      a = randInt(1, b - 1);
      c = randInt(1, b - 1);
    } else {
      b = pick([2, 3, 4, 5]);
      a = randInt(1, b - 1);
      const m = randInt(2, 3);
      d = b * m;
      c = a * m + pick([-1, 0, 0, 1]);
      if (c <= 0 || c >= d) c = a * m;
    }
  } else {
    b = pick([2, 3, 4, 5]);
    d = b * pick([2, 3]);
    a = randInt(1, b - 1);
    c = randInt(1, d - 1);
  }
  if (Math.random() < 0.5) [a, b, c, d] = [c, d, a, b];
  return {
    ...compareSigns(a * d, c * b, `${a}/${b}`, `${c}/${d}`),
    hint: b === d ? 'Same size parts: more parts is bigger.' : a === 1 && c === 1 ? 'Cut into more pieces means smaller pieces.' : 'Make the bottoms the same first.',
  };
}

// Adding and subtracting fractions: like denominators (P3), related
// denominators (P4).
function addFractionsProblem(tier, grade) {
  let a, b, c, d;
  if (grade === '3') {
    b = pick([4, 5, 6, 7, 8, 9, 10, 12]);
    d = b;
    a = randInt(1, b - 2);
    c = randInt(1, b - a);
  } else {
    b = pick([2, 3, 4, 5]);
    d = b * pick([2, 3]);
    a = randInt(1, b - 1);
    c = randInt(1, d - 1);
  }
  const add = Math.random() < 0.6 || a * d === c * b;
  const den = Math.max(b, d);
  const na = a * (den / b);
  const nc = c * (den / d);
  let top;
  let left = `${a}/${b}`;
  let right = `${c}/${d}`;
  if (add) top = na + nc;
  else if (na >= nc) top = na - nc;
  else {
    [left, right] = [right, left];
    top = nc - na;
  }
  const correct = fracText(top, den);
  const wrong = [fracText(top + 1, den), fracText(Math.max(1, top - 1), den), `${add ? a + c : Math.abs(a - c)}/${b + d}`, `${top}/${den * 2}`];
  return {
    prompt: `${left} ${add ? '+' : MINUS} ${right} = ?`,
    correct,
    answerType: 'choice',
    choiceKind: 'frac',
    choices: withChoices(correct, wrong.filter((w) => !w.endsWith('/0') && w !== '0')),
    answerLabel: `${left} ${add ? '+' : MINUS} ${right} = ${top}/${den}${correct !== `${top}/${den}` ? ` = ${correct}` : ''}`,
    speech: `${left.replace('/', ' over ')} ${add ? 'plus' : 'minus'} ${right.replace('/', ' over ')}`,
    hint: b === d ? 'Same bottoms: add or take away the tops.' : `Change to ${den}ths first.`,
    questionTitle: add ? 'Add fractions' : 'Subtract fractions',
  };
}

const dec = (n, places = 2) => String(Number(n.toFixed(places)));

// Decimal place value (P4, Beast Academy 4D).
function decimalPlaceProblem() {
  const kind = pick(['digit', 'tenths', 'hundredths', 'compare']);
  if (kind === 'digit') {
    const w = randInt(1, 99);
    const t = randInt(1, 9);
    const h = randInt(1, 9);
    const asTenths = Math.random() < 0.5;
    return {
      prompt: `In ${w}.${t}${h}, which digit is in the ${asTenths ? 'tenths' : 'hundredths'} place?`,
      correct: asTenths ? t : h,
      answerType: 'numeric',
      answerLabel: `${w}.${t}${h}: ${t} tenths, ${h} hundredths`,
      speech: `In ${w} point ${t} ${h}, which digit is in the ${asTenths ? 'tenths' : 'hundredths'} place?`,
      questionTitle: 'Decimal place value',
    };
  }
  if (kind === 'tenths') {
    const t = randInt(1, 9);
    return {
      prompt: `0.${t} = ?/10`,
      correct: t,
      answerType: 'numeric',
      answerLabel: `0.${t} = ${t}/10`,
      speech: `Zero point ${t} is how many tenths?`,
      questionTitle: 'Decimals and fractions',
    };
  }
  if (kind === 'hundredths') {
    const h = randInt(1, 99);
    const shown = (h / 100).toFixed(2);
    return {
      prompt: `${shown} = ?/100`,
      correct: h,
      answerType: 'numeric',
      answerLabel: `${shown} = ${h}/100`,
      speech: `${shown} is how many hundredths?`,
      questionTitle: 'Decimals and fractions',
    };
  }
  const a = randInt(1, 9) / 10;
  const b = randInt(10, 99) / 100;
  const [x, y] = shuffle([a, b]);
  return {
    ...compareSigns(x, y, dec(x), dec(y)),
    hint: `Write both with 2 decimal places: ${x.toFixed(2)} and ${y.toFixed(2)}.`,
  };
}

// Fractions as decimals and decimals as fractions (P4, Beast Academy 4D).
function decimalConvertProblem() {
  const pairs = [
    [1, 2, 0.5], [1, 4, 0.25], [3, 4, 0.75], [1, 5, 0.2], [2, 5, 0.4], [3, 5, 0.6], [4, 5, 0.8],
    [1, 10, 0.1], [3, 10, 0.3], [7, 10, 0.7], [9, 10, 0.9], [7, 100, 0.07], [23, 100, 0.23], [9, 100, 0.09], [1, 20, 0.05],
  ];
  const [a, b, v] = pick(pairs);
  const correct = dec(v);
  if (Math.random() < 0.6) {
    return {
      prompt: `${a}/${b} = ?`,
      correct,
      answerType: 'choice',
      choices: withChoices(correct, [dec(v / 10, 3), dec(v * 10), `${a}.${b}`, dec(a / 10), dec(v + 0.1)]),
      answerLabel: `${a}/${b} = ${correct}`,
      speech: `${a} over ${b} as a decimal is what?`,
      hint: b === 10 || b === 100 ? undefined : `Make the bottom 10 or 100 first.`,
      questionTitle: 'Fraction to decimal',
    };
  }
  const frac = `${a}/${b}`;
  return {
    prompt: `${correct} = ?`,
    correct: frac,
    answerType: 'choice',
    choiceKind: 'frac',
    choices: withChoices(frac, [`${a}/${b * 10}`, `1/${a + 1}`, `${b}/${a}`, `${a + 1}/${b}`]),
    answerLabel: `${correct} = ${frac}`,
    speech: `${correct} as a fraction is what?`,
    questionTitle: 'Decimal to fraction',
  };
}

// Adding and subtracting decimals (P4).
function decimalAddSubProblem() {
  const places = pick([1, 1, 2]);
  const scale = 10 ** places;
  const a = randInt(scale + 1, 20 * scale);
  const b = randInt(1, 9 * scale);
  const add = Math.random() < 0.55 || a <= b;
  const [x, y] = add ? [a, b] : [a, b];
  const value = (add ? x + y : x - y) / scale;
  const show = (n) => (n / scale).toFixed(places);
  const correct = value.toFixed(places);
  const wrong = [
    (value + 1 / scale).toFixed(places),
    (value - 1 / scale).toFixed(places),
    (value + 1).toFixed(places),
    (value + (add ? 0.1 : -0.1)).toFixed(places),
  ].filter((w) => Number(w) >= 0);
  return {
    prompt: `${show(x)} ${add ? '+' : MINUS} ${show(y)} = ?`,
    correct,
    answerType: 'choice',
    choices: withChoices(correct, wrong),
    answerLabel: `${show(x)} ${add ? '+' : MINUS} ${show(y)} = ${correct}`,
    speech: `${show(x)} ${add ? 'plus' : 'minus'} ${show(y)} equals what?`,
    hint: 'Line up the decimal points.',
    questionTitle: add ? 'Add decimals' : 'Subtract decimals',
  };
}

// ---------------- Measurement ----------------

// Singapore coins and notes, in cents.
const COINS = [5, 10, 20, 50, 100];
const NOTES = [200, 500, 1000];
const money = (c) => (c < 100 ? `${c}¢` : `$${(c / 100).toFixed(2)}`);
const dollars = (c) => `$${(c / 100).toFixed(2)}`;

function moneyProblem(tier, grade) {
  if (grade === '1') {
    if (Math.random() < 0.6) {
      const items = [];
      let total = 0;
      for (let i = 0; i < randInt(2, 5); i++) {
        const c = pick(COINS.slice(0, 4));
        if (total + c > 100) break;
        items.push(c);
        total += c;
      }
      return {
        visual: { kind: 'money', items: items.sort((x, y) => y - x) },
        prompt: 'How many cents in all?',
        correct: total,
        answerType: 'numeric',
        answerLabel: `${items.join('¢ + ')}¢ = ${total}¢`,
        speech: 'How many cents are there in all?',
        hint: 'Start with the biggest coin and count on.',
        questionTitle: 'Money',
      };
    }
    const items = Array.from({ length: randInt(2, 4) }, () => pick([200, 500, 1000, 100]));
    const total = items.reduce((s, c) => s + c, 0) / 100;
    return {
      visual: { kind: 'money', items: items.sort((x, y) => y - x) },
      prompt: 'How many dollars in all?',
      correct: total,
      answerType: 'numeric',
      answerLabel: `$${items.map((c) => c / 100).join(' + $')} = $${total}`,
      speech: 'How many dollars are there in all?',
      questionTitle: 'Money',
    };
  }
  if (grade === '2') {
    if (Math.random() < 0.5) {
      const cents = randInt(1, 9) * 100 + randInt(1, 19) * 5;
      return {
        prompt: `${dollars(cents)} = ? ¢`,
        correct: cents,
        answerType: 'numeric',
        answerLabel: `${dollars(cents)} = ${cents}¢`,
        speech: `${dollars(cents)} is how many cents?`,
        hint: '$1 = 100¢',
        questionTitle: 'Dollars and cents',
      };
    }
    const items = [pick(NOTES), pick([100, 200, 500]), ...Array.from({ length: randInt(1, 3) }, () => pick(COINS.slice(0, 4)))];
    const total = items.reduce((s, c) => s + c, 0);
    return {
      visual: { kind: 'money', items: items.sort((x, y) => y - x) },
      prompt: 'How much money is there?',
      correct: dollars(total),
      answerType: 'choice',
      choices: withChoices(dollars(total), [dollars(total + 10), dollars(total - 5), dollars(total + 100), dollars(total - 100), dollars(total + 50)]),
      answerLabel: items.map(money).join(' + ') + ` = ${dollars(total)}`,
      speech: 'How much money is there?',
      questionTitle: 'Money',
    };
  }
  const name = storyName();
  const a = randInt(3, 40) * 5 + randInt(1, 9) * 100;
  const b = randInt(3, 40) * 5 + randInt(1, 5) * 100;
  const kind = pick(['total', 'change']);
  if (kind === 'total') {
    const correct = a + b;
    return {
      prompt: `${name} buys a book for ${dollars(a)} and a pen for ${dollars(b)}. How much is that altogether?`,
      correct: dollars(correct),
      answerType: 'choice',
      choices: withChoices(dollars(correct), [dollars(correct + 100), dollars(correct - 10), dollars(correct + 5), dollars(Math.abs(a - b))]),
      answerLabel: `${dollars(a)} + ${dollars(b)} = ${dollars(correct)}`,
      speech: `${name} buys a book for ${dollars(a)} and a pen for ${dollars(b)}. How much is that altogether?`,
      questionTitle: 'Money',
    };
  }
  const paid = Math.ceil((a + 1) / 1000) * 1000 >= 2000 ? 2000 : 1000;
  const correct = paid - a;
  if (correct <= 0) return moneyProblem(tier, grade);
  return {
    prompt: `${name} pays ${dollars(paid)} for a toy that costs ${dollars(a)}. How much change does ${name} get?`,
    correct: dollars(correct),
    answerType: 'choice',
    choices: withChoices(dollars(correct), [dollars(correct + 100), dollars(correct - 10), dollars(correct + 10), dollars(paid + a)]),
    answerLabel: `${dollars(paid)} ${MINUS} ${dollars(a)} = ${dollars(correct)}`,
    speech: `${name} pays ${dollars(paid)} for a toy that costs ${dollars(a)}. How much change?`,
    questionTitle: 'Money',
  };
}

const RULER_THINGS = [
  ['ribbon', '#E0577F'],
  ['pencil', '#F5A623'],
  ['crayon', '#4E8FF7'],
  ['worm', '#2FAE6B'],
  ['straw', '#8B5CF6'],
];

// Measuring length with a ruler, in centimetres (P1, P2, Beast Academy 1D).
function rulerProblem(tier, grade) {
  const len = randInt(2, 11);
  const start = grade === '2' && Math.random() < 0.5 ? randInt(1, 3) : 0;
  const [thing, color] = pick(RULER_THINGS);
  return {
    visual: { kind: 'ruler', start, len, color },
    prompt: `How long is the ${thing}? (cm)`,
    correct: len,
    answerType: 'numeric',
    answerLabel: start ? `${start + len} ${MINUS} ${start} = ${len} cm` : `${len} cm`,
    speech: `How long is the ${thing}, in centimetres?`,
    hint: start ? `It starts at ${start}, not at 0.` : undefined,
    questionTitle: 'Measure it',
  };
}

const MASS_THINGS = [['a watermelon', 'kg'], ['a bag of rice', 'kg'], ['a dog', 'kg'], ['a grape', 'g'], ['a paper clip', 'g'], ['a pencil', 'g'], ['a coin', 'g'], ['a child', 'kg']];
const VOLUME_THINGS = [['a bathtub', 'L'], ['a bucket', 'L'], ['a fish tank', 'L'], ['a spoon', 'mL'], ['a cup of tea', 'mL'], ['a bottle cap', 'mL'], ['a swimming pool', 'L']];

// Mass and volume: choosing units (P2) and converting compound units (P3).
function massVolumeProblem(tier, grade) {
  if (grade === '2' && Math.random() < 0.6) {
    const mass = Math.random() < 0.5;
    const [thing, unit] = pick(mass ? MASS_THINGS : VOLUME_THINGS);
    return {
      prompt: mass ? `Which unit would you use for the mass of ${thing}?` : `Which unit would you use for how much water ${thing} holds?`,
      correct: unit,
      answerType: 'choice',
      choiceKind: 'word',
      choices: mass ? ['kg', 'g'] : ['L', 'mL'],
      answerLabel: `${thing}: ${unit}`,
      speech: mass ? `Kilograms or grams, for the mass of ${thing}?` : `Litres or millilitres, for ${thing}?`,
      questionTitle: 'Choose the unit',
    };
  }
  const [big, small, k] = pick([['kg', 'g', 1000], ['L', 'mL', 1000], ['km', 'm', 1000], ['m', 'cm', 100]]);
  const whole = randInt(1, grade === '2' ? 5 : 9);
  if (grade === '2') {
    return {
      prompt: `${whole} ${big} = ? ${small}`,
      correct: whole * k,
      answerType: 'numeric',
      answerLabel: `${whole} ${big} = ${fmt(whole * k)} ${small}`,
      speech: `${whole} ${big} is how many ${small}?`,
      hint: `1 ${big} = ${fmt(k)} ${small}`,
      questionTitle: 'Change the unit',
    };
  }
  const part = k === 100 ? randInt(1, 99) : randInt(1, 19) * 50 + (Math.random() < 0.3 ? randInt(1, 49) : 0);
  const total = whole * k + part;
  if (Math.random() < 0.5) {
    return {
      prompt: `${whole} ${big} ${part} ${small} = ? ${small}`,
      correct: total,
      answerType: 'numeric',
      answerLabel: `${whole} ${big} ${part} ${small} = ${fmt(total)} ${small}`,
      speech: `${whole} ${big} ${part} ${small} is how many ${small}?`,
      hint: `1 ${big} = ${fmt(k)} ${small}`,
      questionTitle: 'Change the unit',
    };
  }
  return {
    prompt: `${fmt(total)} ${small} = ${whole} ${big} ? ${small}`,
    correct: part,
    answerType: 'numeric',
    answerLabel: `${fmt(total)} ${small} = ${whole} ${big} ${part} ${small}`,
    speech: `${total} ${small} is ${whole} ${big} and how many ${small}?`,
    hint: `1 ${big} = ${fmt(k)} ${small}`,
    questionTitle: 'Change the unit',
  };
}

const pad = (m) => String(m).padStart(2, '0');
const clockText = (mins) => `${((Math.floor(mins / 60) + 11) % 12) + 1}:${pad(mins % 60)}`;

// How long? Durations within an hour (P2) and across the hour (P3).
function durationProblem(tier, grade) {
  const name = storyName();
  const activity = pick(['reads', 'plays football', 'practises piano', 'swims', 'paints', 'bakes']);
  if (grade === '2') {
    if (Math.random() < 0.4) {
      const h = randInt(1, 9);
      const len = randInt(1, 3);
      return {
        prompt: `${name} ${activity} from ${h}:00 to ${h + len}:00. How many hours is that?`,
        correct: len,
        answerType: 'numeric',
        answerLabel: `${h}:00 to ${h + len}:00 is ${len} hour${len > 1 ? 's' : ''}`,
        speech: `${name} ${activity} from ${h} o'clock to ${h + len} o'clock. How many hours is that?`,
        questionTitle: 'How long?',
      };
    }
    const h = randInt(1, 11);
    const s = randInt(0, 6) * 5;
    const len = randInt(2, (55 - s) / 5) * 5;
    return {
      prompt: `${name} ${activity} from ${h}:${pad(s)} to ${h}:${pad(s + len)}. How many minutes is that?`,
      correct: len,
      answerType: 'numeric',
      answerLabel: `${h}:${pad(s)} to ${h}:${pad(s + len)} is ${len} minutes`,
      speech: `${name} ${activity} from ${h} ${s ? s : "o'clock"} to ${h} ${s + len}. How many minutes is that?`,
      questionTitle: 'How long?',
    };
  }
  if (Math.random() < 0.35) {
    const h = randInt(1, 3);
    const m = randInt(1, 11) * 5;
    return {
      prompt: `${h} h ${m} min = ? min`,
      correct: h * 60 + m,
      answerType: 'numeric',
      answerLabel: `${h} h ${m} min = ${h * 60} + ${m} = ${h * 60 + m} min`,
      speech: `${h} hours ${m} minutes is how many minutes?`,
      hint: '1 hour = 60 minutes',
      questionTitle: 'Hours and minutes',
    };
  }
  const start = randInt(7, 18) * 60 + randInt(6, 11) * 5;
  const len = randInt(3, 15) * 5;
  const end = start + len;
  return {
    prompt: `${name} ${activity} from ${clockText(start)} to ${clockText(end)}. How many minutes is that?`,
    correct: len,
    answerType: 'numeric',
    answerLabel: `${clockText(start)} to ${clockText(end)} is ${len} minutes`,
    speech: `${name} ${activity} from ${clockText(start)} to ${clockText(end)}. How many minutes is that?`,
    hint: `Count on to the next hour first.`,
    questionTitle: 'How long?',
  };
}

// The 24-hour clock (P4).
function clock24Problem() {
  const h = randInt(0, 23);
  const m = randInt(0, 11) * 5;
  const h12 = ((h + 11) % 12) + 1;
  const ampm = h < 12 ? 'a.m.' : 'p.m.';
  const t12 = `${h12}:${pad(m)} ${ampm}`;
  const t24 = `${pad(h)}:${pad(m)}`;
  if (Math.random() < 0.5) {
    return {
      prompt: `${t12} in 24-hour time is…`,
      correct: t24,
      answerType: 'choice',
      choiceKind: 'word',
      choices: withChoices(t24, [`${pad((h + 12) % 24)}:${pad(m)}`, `${pad(h12)}:${pad(m)}`, `${pad(h)}:${pad((m + 30) % 60)}`, `${pad((h + 2) % 24)}:${pad(m)}`]),
      answerLabel: `${t12} = ${t24}`,
      speech: `What is ${h12} ${m ? m : "o'clock"} ${ampm === 'a.m.' ? 'A M' : 'P M'} in 24-hour time?`,
      hint: 'After 12 noon, add 12 to the hour.',
      questionTitle: '24-hour clock',
    };
  }
  const other = `${h12}:${pad(m)} ${ampm === 'a.m.' ? 'p.m.' : 'a.m.'}`;
  return {
    prompt: `${t24} is…`,
    correct: t12,
    answerType: 'choice',
    choiceKind: 'word',
    choices: withChoices(t12, [other, `${((h + 1) % 12) + 1}:${pad(m)} ${ampm}`, `${h12}:${pad((m + 30) % 60)} ${ampm}`]),
    answerLabel: `${t24} = ${t12}`,
    speech: `What is ${h} ${m ? m : 'hundred'} in 12-hour time?`,
    hint: 'Hours after 12 are p.m.: take away 12.',
    questionTitle: '24-hour clock',
  };
}

// Perimeter (P3, P4, Beast Academy 3A).
function perimeterProblem(tier, grade) {
  if (grade === '4' && Math.random() < 0.5) {
    const w = randInt(6, 12);
    const h = randInt(5, 10);
    const cw = randInt(2, w - 3);
    const ch = randInt(2, h - 3);
    return {
      visual: { kind: 'lshape', w, h, cw, ch },
      prompt: 'What is the perimeter? (cm)',
      correct: 2 * (w + h),
      answerType: 'numeric',
      answerLabel: `${w} + ${h} + ${w} + ${h} = ${2 * (w + h)} cm (the cut corner doesn't change it)`,
      speech: 'What is the perimeter of the shape, in centimetres?',
      hint: 'Find the missing sides first.',
      questionTitle: 'Perimeter',
    };
  }
  const w = randInt(3, 12);
  const h = randInt(2, 9);
  if (Math.random() < 0.3) {
    const p = 2 * (w + h);
    return {
      visual: { kind: 'rect', w, h, hideH: true },
      prompt: `The perimeter is ${p} cm. What is the missing side? (cm)`,
      correct: h,
      answerType: 'numeric',
      answerLabel: `${p} ÷ 2 = ${w + h}, ${w + h} ${MINUS} ${w} = ${h} cm`,
      speech: `The perimeter is ${p} centimetres. What is the missing side?`,
      hint: 'Half the perimeter is one long side plus one short side.',
      questionTitle: 'Perimeter',
    };
  }
  return {
    visual: { kind: 'rect', w, h },
    prompt: 'What is the perimeter? (cm)',
    correct: 2 * (w + h),
    answerType: 'numeric',
    answerLabel: `${w} + ${h} + ${w} + ${h} = ${2 * (w + h)} cm`,
    speech: 'What is the perimeter of the rectangle, in centimetres?',
    hint: 'Add up all four sides.',
    questionTitle: 'Perimeter',
  };
}

// Area: counting squares (P3, Beast Academy 3A), length × width (P4).
function areaProblem(tier, grade) {
  if (grade === '3' && Math.random() < 0.6) {
    const cols = 6;
    const rows = 5;
    const cells = [];
    const w = randInt(2, 5);
    const h = randInt(2, 4);
    const x0 = randInt(0, cols - w);
    const y0 = randInt(0, rows - h);
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) cells.push(y * cols + x);
    // Sometimes a bump on top, so it isn't always a rectangle.
    if (Math.random() < 0.5 && y0 > 0) cells.push((y0 - 1) * cols + x0);
    return {
      visual: { kind: 'grid', cols, rows, cells },
      prompt: 'What is the area? (square units)',
      correct: cells.length,
      answerType: 'numeric',
      answerLabel: `${cells.length} squares`,
      speech: 'What is the area, in square units?',
      hint: 'Count the shaded squares.',
      questionTitle: 'Area',
    };
  }
  if (grade === '4' && Math.random() < 0.5) {
    const w = randInt(6, 12);
    const h = randInt(5, 10);
    const cw = randInt(2, w - 3);
    const ch = randInt(2, h - 3);
    const area = w * h - cw * ch;
    return {
      visual: { kind: 'lshape', w, h, cw, ch },
      prompt: 'What is the area? (cm²)',
      correct: area,
      answerType: 'numeric',
      answerLabel: `${w} × ${h} ${MINUS} ${cw} × ${ch} = ${area} cm²`,
      speech: 'What is the area of the shape, in square centimetres?',
      hint: 'Take the cut-out corner away from the big rectangle.',
      questionTitle: 'Area',
    };
  }
  const w = randInt(3, 12);
  const h = randInt(2, 9);
  return {
    visual: { kind: 'rect', w, h },
    prompt: 'What is the area? (cm²)',
    correct: w * h,
    answerType: 'numeric',
    answerLabel: `${w} × ${h} = ${w * h} cm²`,
    speech: 'What is the area of the rectangle, in square centimetres?',
    hint: 'Area = length × width',
    questionTitle: 'Area',
  };
}

const COMPASS = ['North', 'North-east', 'East', 'South-east', 'South', 'South-west', 'West', 'North-west'];

// Angles: compared with a right angle (P3), degrees, turns and the
// 8-point compass (P4).
function anglesProblem(tier, grade) {
  if (grade === '3') {
    if (Math.random() < 0.3) {
      const [shape, n] = pick([['square', 4], ['rectangle', 4], ['right triangle', 1], ['equilateral triangle', 0]]);
      return {
        prompt: `How many right angles does a ${shape} have?`,
        correct: n,
        answerType: 'numeric',
        answerLabel: `A ${shape} has ${n} right angle${n === 1 ? '' : 's'}`,
        speech: `How many right angles does a ${shape} have?`,
        questionTitle: 'Right angles',
      };
    }
    const deg = pick([30, 45, 60, 90, 90, 120, 135, 150]);
    const correct = deg < 90 ? 'Smaller' : deg > 90 ? 'Bigger' : 'Right angle';
    return {
      visual: { kind: 'angle', deg },
      prompt: 'Compare this angle with a right angle.',
      correct,
      answerType: 'choice',
      choiceKind: 'word',
      choices: ['Smaller', 'Right angle', 'Bigger'],
      answerLabel: deg === 90 ? 'It is a right angle' : `It is ${correct.toLowerCase()} than a right angle`,
      speech: 'Is this angle smaller than a right angle, a right angle, or bigger?',
      hint: 'A right angle is the corner of a square.',
      questionTitle: 'Angles',
    };
  }
  const kind = pick(['turn', 'compass', 'missing', 'missing']);
  if (kind === 'turn') {
    const [name, deg] = pick([['a quarter turn', 90], ['a half turn', 180], ['a three-quarter turn', 270], ['a full turn', 360]]);
    return {
      prompt: `How many degrees is ${name}?`,
      correct: deg,
      answerType: 'numeric',
      answerLabel: `${name} = ${deg}°`,
      speech: `How many degrees is ${name}?`,
      hint: 'A full turn is 360°.',
      questionTitle: 'Turns',
    };
  }
  if (kind === 'compass') {
    const from = randInt(0, 7);
    const steps = pick([1, 2, 2, 4, 6]);
    const clockwise = Math.random() < 0.5;
    const to = (from + (clockwise ? steps : -steps) + 8) % 8;
    return {
      visual: { kind: 'compass' },
      prompt: `You face ${COMPASS[from]} and turn ${steps * 45}° ${clockwise ? 'clockwise' : 'anticlockwise'}. Which way do you face now?`,
      correct: COMPASS[to],
      answerType: 'choice',
      choiceKind: 'word',
      choices: withChoices(COMPASS[to], [COMPASS[(to + 4) % 8], COMPASS[(to + 2) % 8], COMPASS[(to + 6) % 8], COMPASS[(to + 1) % 8]]),
      answerLabel: `${COMPASS[from]} → ${COMPASS[to]}`,
      speech: `You face ${COMPASS[from]} and turn ${steps * 45} degrees ${clockwise ? 'clockwise' : 'anticlockwise'}. Which way do you face now?`,
      hint: 'Each step around the compass is 45°.',
      questionTitle: '8-point compass',
    };
  }
  const total = pick([90, 180]);
  const known = randInt(2, total / 5 - 2) * 5;
  return {
    visual: { kind: 'angleSplit', total, known },
    prompt: `What is the missing angle? (°)`,
    correct: total - known,
    answerType: 'numeric',
    answerLabel: `${total}° ${MINUS} ${known}° = ${total - known}°`,
    speech: `The angles make ${total === 90 ? 'a right angle' : 'a straight line'}. One is ${known} degrees. What is the other?`,
    hint: total === 90 ? 'Together they make a right angle: 90°.' : 'A straight line is 180°.',
    questionTitle: 'Missing angle',
  };
}

// ---------------- Shapes, position and patterns ----------------

const POLYGON_NAMES = { 3: 'triangle', 4: 'square', 5: 'pentagon', 6: 'hexagon', 8: 'octagon' };
const SOLIDS = [['cube', 6], ['cuboid', 6], ['square pyramid', 5], ['triangular prism', 5], ['cylinder', 2], ['cone', 1]];

// Sides and corners (P1), 2D and 3D shapes (P2, Beast Academy 1A and 3A).
function shapeSidesProblem(tier, grade) {
  const kind = grade === '2' ? pick(['sides', 'name', 'solid']) : pick(['sides', 'sides', 'name']);
  if (kind === 'solid') {
    const [solid, faces] = pick(SOLIDS);
    return {
      prompt: `How many flat faces does a ${solid} have?`,
      correct: faces,
      answerType: 'numeric',
      answerLabel: `A ${solid} has ${faces} flat face${faces === 1 ? '' : 's'}`,
      speech: `How many flat faces does a ${solid} have?`,
      questionTitle: '3D shapes',
    };
  }
  const n = pick([3, 4, 5, 6, 8]);
  if (kind === 'name') {
    const correct = POLYGON_NAMES[n];
    return {
      visual: { kind: 'polygon', sides: n },
      prompt: 'What is this shape called?',
      correct,
      answerType: 'choice',
      choiceKind: 'word',
      choices: withChoices(correct, Object.values(POLYGON_NAMES)),
      answerLabel: `It has ${n} sides: ${correct === 'octagon' ? 'an' : 'a'} ${correct}`,
      speech: 'What is this shape called?',
      questionTitle: 'Shapes',
    };
  }
  const corners = Math.random() < 0.4;
  return {
    visual: { kind: 'polygon', sides: n },
    prompt: `How many ${corners ? 'corners' : 'sides'} does it have?`,
    correct: n,
    answerType: 'numeric',
    answerLabel: `${n === 8 ? 'An' : 'A'} ${POLYGON_NAMES[n]} has ${n} sides and ${n} corners`,
    speech: `How many ${corners ? 'corners' : 'sides'} does this shape have?`,
    questionTitle: 'Sides & corners',
  };
}

const QUADS = [
  ['square', 'I have 4 equal sides and 4 right angles.'],
  ['rectangle', 'I have 4 right angles, and my long sides are longer than my short sides.'],
  ['rhombus', 'I have 4 equal sides but no right angles.'],
  ['trapezoid', 'I have exactly one pair of parallel sides.'],
  ['parallelogram', 'I have 2 pairs of parallel sides but no right angles, and not all my sides are equal.'],
];
const TRIANGLES = [
  ['equilateral', 'All 3 of my sides are equal.'],
  ['isosceles', 'Exactly 2 of my sides are equal.'],
  ['right', 'One of my angles is a right angle.'],
];

// Classifying shapes (Beast Academy 3A, 4A; P4 squares and rectangles).
function shapeClassProblem() {
  if (Math.random() < 0.65) {
    const [correct, clue] = pick(QUADS);
    return {
      visual: { kind: 'quad', shape: Math.random() < 0.5 ? correct : null },
      prompt: clue,
      correct,
      answerType: 'choice',
      choiceKind: 'word',
      choices: withChoices(correct, QUADS.map((q) => q[0])),
      answerLabel: `A ${correct}`,
      speech: `${clue} What shape am I?`,
      questionTitle: 'What shape am I?',
    };
  }
  const [correct, clue] = pick(TRIANGLES);
  return {
    visual: { kind: 'triangle', type: correct },
    prompt: `${clue} What kind of triangle am I?`,
    correct,
    answerType: 'choice',
    choiceKind: 'word',
    choices: TRIANGLES.map((t) => t[0]),
    answerLabel: `A ${correct} triangle`,
    speech: `${clue} What kind of triangle am I?`,
    questionTitle: 'Triangles',
  };
}

// Parallel and perpendicular lines (P3).
function linesProblem() {
  const correct = pick(['Parallel', 'Perpendicular', 'Neither']);
  return {
    visual: { kind: 'lines', type: correct.toLowerCase(), rot: randInt(-40, 40) },
    prompt: 'These two lines are…',
    correct,
    answerType: 'choice',
    choiceKind: 'word',
    choices: ['Parallel', 'Perpendicular', 'Neither'],
    answerLabel: correct === 'Parallel' ? 'Parallel: they never meet' : correct === 'Perpendicular' ? 'Perpendicular: they meet at a right angle' : 'Neither',
    speech: 'Are these lines parallel, perpendicular, or neither?',
    hint: 'Parallel lines never meet. Perpendicular lines make a right angle.',
    questionTitle: 'Lines',
  };
}

const SYMMETRY = [
  ['square', 4, { kind: 'polygon', sides: 4 }],
  ['regular pentagon', 5, { kind: 'polygon', sides: 5 }],
  ['regular hexagon', 6, { kind: 'polygon', sides: 6 }],
  ['equilateral triangle', 3, { kind: 'polygon', sides: 3 }],
  ['rectangle', 2, { kind: 'quad', shape: 'rectangle' }],
  ['parallelogram', 0, { kind: 'quad', shape: 'parallelogram' }],
  ['letter A', 1, { kind: 'letter', letter: 'A' }],
  ['letter H', 2, { kind: 'letter', letter: 'H' }],
  ['letter M', 1, { kind: 'letter', letter: 'M' }],
  ['letter F', 0, { kind: 'letter', letter: 'F' }],
  ['letter X', 2, { kind: 'letter', letter: 'X' }],
  ['letter E', 1, { kind: 'letter', letter: 'E' }],
];

// Lines of symmetry (P4).
function symmetryProblem() {
  const [name, n, visual] = pick(SYMMETRY);
  return {
    visual,
    prompt: `How many lines of symmetry does this ${name} have?`,
    correct: n,
    answerType: 'numeric',
    answerLabel: `A ${name} has ${n} line${n === 1 ? '' : 's'} of symmetry`,
    speech: `How many lines of symmetry does this ${name} have?`,
    hint: 'A line of symmetry folds the shape into two matching halves.',
    questionTitle: 'Symmetry',
  };
}

const GRID_THINGS = ['🍎', '🐱', '⭐', '🚗', '🎈', '🌸', '🐟', '🍩', '⚽', '🦋', '🍓', '🐢'];

// Rows and columns (Beast Academy 1D: position).
function positionProblem() {
  const rows = 3;
  const cols = 4;
  const items = shuffle(GRID_THINGS).slice(0, rows * cols);
  const r = randInt(1, rows);
  const c = randInt(1, cols);
  const correct = items[(r - 1) * cols + (c - 1)];
  return {
    visual: { kind: 'table', rows, cols, items },
    prompt: `What is in row ${r}, column ${c}?`,
    correct,
    answerType: 'choice',
    choiceKind: 'emoji',
    choices: withChoices(correct, [items[(r - 1) * cols + ((c % cols))], items[((r % rows)) * cols + (c - 1)], items[(c - 1) * 1], ...items]),
    answerLabel: `Row ${r}, column ${c}: ${correct}`,
    speech: `What is in row ${r}, column ${c}? Rows go across from the top, columns go down from the left.`,
    hint: 'Rows go across (count from the top). Columns go down (count from the left).',
    questionTitle: 'Rows & columns',
  };
}

// ---------------- Graphs ----------------

const GRAPH_SETS = [
  { title: 'Favourite fruit', items: [['🍎', 'apples'], ['🍌', 'bananas'], ['🍇', 'grapes'], ['🍊', 'oranges']] },
  { title: 'Pets in class', items: [['🐶', 'dogs'], ['🐱', 'cats'], ['🐟', 'fish'], ['🐰', 'rabbits']] },
  { title: 'Ways to school', items: [['🚌', 'bus'], ['🚗', 'car'], ['🚶', 'walk'], ['🚲', 'bike']] },
];

function graphQuestion(rows, unitWord) {
  const kind = pick(['count', 'more', 'most', 'total']);
  const [a, b] = shuffle(rows).slice(0, 2);
  if (kind === 'most') {
    const most = Math.random() < 0.5;
    const best = rows.reduce((x, y) => ((most ? y.value > x.value : y.value < x.value) ? y : x));
    if (rows.filter((r) => r.value === best.value).length > 1) return graphQuestion(rows, unitWord);
    return {
      prompt: `Which has the ${most ? 'most' : 'fewest'}?`,
      correct: best.emoji,
      answerType: 'choice',
      choiceKind: 'emoji',
      choices: shuffle(rows.map((r) => r.emoji)),
      answerLabel: `${best.emoji} ${best.name}: ${best.value}`,
      speech: `Which has the ${most ? 'most' : 'fewest'}?`,
    };
  }
  if (kind === 'more' && a.value !== b.value) {
    const [hi, lo] = a.value > b.value ? [a, b] : [b, a];
    return {
      prompt: `How many more ${hi.emoji} than ${lo.emoji}?`,
      correct: hi.value - lo.value,
      answerType: 'numeric',
      answerLabel: `${hi.value} ${MINUS} ${lo.value} = ${hi.value - lo.value}`,
      speech: `How many more ${hi.name} than ${lo.name}?`,
    };
  }
  if (kind === 'total') {
    return {
      prompt: `How many ${a.emoji} and ${b.emoji} altogether?`,
      correct: a.value + b.value,
      answerType: 'numeric',
      answerLabel: `${a.value} + ${b.value} = ${a.value + b.value}`,
      speech: `How many ${a.name} and ${b.name} altogether?`,
    };
  }
  return {
    prompt: `How many ${a.emoji}?`,
    correct: a.value,
    answerType: 'numeric',
    answerLabel: `${a.emoji} ${a.value}`,
    speech: `How many ${a.name} ${unitWord}?`,
  };
}

// Picture graphs (P1; P2 with a key where one picture stands for 2).
function pictureGraphProblem(tier, grade) {
  const set = pick(GRAPH_SETS);
  const per = grade === '2' && Math.random() < 0.6 ? 2 : 1;
  const rows = set.items.slice(0, grade === '1' ? 3 : 4).map(([emoji, name]) => ({ emoji, name, value: randInt(1, 6) * per }));
  return {
    visual: { kind: 'pictograph', title: set.title, rows, per },
    questionTitle: 'Picture graph',
    hint: per > 1 ? `Each picture stands for ${per}.` : undefined,
    ...graphQuestion(rows, 'are there'),
  };
}

// Bar graphs (P3, P4).
function barGraphProblem(tier, grade) {
  const set = pick(GRAPH_SETS);
  const step = grade === '4' ? pick([5, 10, 50]) : pick([1, 2, 5]);
  const rows = set.items.map(([emoji, name]) => ({ emoji, name, value: randInt(1, 9) * step + (step % 2 === 0 && Math.random() < 0.3 ? step / 2 : 0) }));
  return {
    visual: { kind: 'bars', title: set.title, rows, step },
    questionTitle: 'Bar graph',
    ...graphQuestion(rows, 'are there'),
  };
}

// ---------------- Puzzles (Beast Academy) ----------------

// Ordering logic (Beast Academy 4B).
function logicProblem() {
  const people = storyNames(3);
  const [quality, most, least] = pick([['taller', 'tallest', 'shortest'], ['older', 'oldest', 'youngest'], ['faster', 'fastest', 'slowest']]);
  // people[0] > people[1] > people[2]
  const clues = shuffle([`${people[0]} is ${quality} than ${people[1]}.`, `${people[1]} is ${quality} than ${people[2]}.`]);
  const askMost = Math.random() < 0.5;
  const correct = askMost ? people[0] : people[2];
  return {
    prompt: `${clues.join(' ')} Who is the ${askMost ? most : least}?`,
    correct,
    answerType: 'choice',
    choiceKind: 'word',
    choices: shuffle(people),
    answerLabel: `${people[0]} > ${people[1]} > ${people[2]}`,
    speech: `${clues.join(' ')} Who is the ${askMost ? most : least}?`,
    hint: 'Put them in order, one clue at a time.',
    questionTitle: 'Logic',
  };
}

// Counting (Beast Academy 4B): outfits, numbers in a list, handshakes.
function countingProblem() {
  const kind = pick(['outfits', 'list', 'handshakes']);
  if (kind === 'outfits') {
    const shirts = randInt(2, 6);
    const pants = randInt(2, 5);
    return {
      prompt: `You have ${shirts} shirts and ${pants} pairs of shorts. How many different outfits can you make?`,
      correct: shirts * pants,
      answerType: 'numeric',
      answerLabel: `${shirts} × ${pants} = ${shirts * pants} outfits`,
      speech: `You have ${shirts} shirts and ${pants} pairs of shorts. How many different outfits can you make?`,
      hint: 'Each shirt goes with every pair of shorts.',
      questionTitle: 'Counting',
    };
  }
  if (kind === 'list') {
    const a = randInt(5, 40);
    const b = a + randInt(8, 40);
    return {
      prompt: `How many numbers are there from ${a} to ${b}, counting both?`,
      correct: b - a + 1,
      answerType: 'numeric',
      answerLabel: `${b} ${MINUS} ${a} + 1 = ${b - a + 1}`,
      speech: `How many numbers are there from ${a} to ${b}, counting both ${a} and ${b}?`,
      hint: `${b} ${MINUS} ${a} is one too few!`,
      questionTitle: 'Counting',
    };
  }
  const n = randInt(3, 6);
  return {
    prompt: `${n} friends meet. Each one shakes hands with every other friend once. How many handshakes?`,
    correct: (n * (n - 1)) / 2,
    answerType: 'numeric',
    answerLabel: Array.from({ length: n - 1 }, (_, i) => n - 1 - i).join(' + ') + ` = ${(n * (n - 1)) / 2}`,
    speech: `${n} friends meet. Each one shakes hands with every other friend once. How many handshakes?`,
    hint: `The first friend shakes ${n - 1} hands, the next ${n - 2} new ones…`,
    questionTitle: 'Counting',
  };
}

const MARBLES = [['🔴', 'red'], ['🔵', 'blue'], ['🟢', 'green'], ['🟡', 'yellow']];

// Probability (Beast Academy 4D).
function probabilityProblem() {
  const colors = shuffle(MARBLES).slice(0, 3);
  const counts = shuffle([randInt(1, 2), randInt(3, 4), randInt(5, 7)]);
  const bag = colors.map(([emoji, name], i) => ({ emoji, name, n: counts[i] }));
  const total = counts.reduce((s, n) => s + n, 0);
  const kind = pick(['likely', 'chance', 'words']);
  if (kind === 'likely') {
    const most = Math.random() < 0.5;
    const best = bag.reduce((x, y) => ((most ? y.n > x.n : y.n < x.n) ? y : x));
    return {
      visual: { kind: 'bag', bag },
      prompt: `You pick one marble without looking. Which colour is ${most ? 'most' : 'least'} likely?`,
      correct: best.emoji,
      answerType: 'choice',
      choiceKind: 'emoji',
      choices: shuffle(bag.map((b) => b.emoji)),
      answerLabel: `${best.n} ${best.name} out of ${total}`,
      speech: `You pick one marble without looking. Which colour is ${most ? 'most' : 'least'} likely?`,
      questionTitle: 'Probability',
    };
  }
  if (kind === 'chance') {
    const one = pick(bag);
    return {
      visual: { kind: 'bag', bag },
      prompt: `What is the chance of picking ${one.emoji}?`,
      correct: `${one.n}/${total}`,
      answerType: 'choice',
      choiceKind: 'frac',
      choices: withChoices(`${one.n}/${total}`, [`1/${total}`, `${one.n}/${total - one.n}`, `${total - one.n}/${total}`, `1/${one.n}`, `${one.n + 1}/${total}`].filter(properFraction)),
      answerLabel: `${one.n} ${one.name} out of ${total} marbles: ${one.n}/${total}`,
      speech: `What is the chance of picking a ${one.name} marble?`,
      questionTitle: 'Probability',
    };
  }
  const [word, make] = pick([
    ['certain', () => `picking a marble from this bag`],
    ['impossible', () => `picking a ⚫ marble`],
    ['likely', () => `picking a marble that isn't ${bag.reduce((x, y) => (y.n < x.n ? y : x)).emoji}`],
    ['unlikely', () => `picking ${bag.reduce((x, y) => (y.n < x.n ? y : x)).emoji}`],
  ]);
  return {
    visual: { kind: 'bag', bag },
    prompt: `How likely is ${make()}?`,
    correct: word,
    answerType: 'choice',
    choiceKind: 'word',
    choices: ['impossible', 'unlikely', 'likely', 'certain'],
    answerLabel: `It is ${word}`,
    speech: `How likely is ${make().replace(/[⚫🔴🔵🟢🟡]/gu, 'that colour')}?`,
    questionTitle: 'Probability',
  };
}

// ---------------- The list ----------------

export const TOPIC_BUILDERS = {
  frames: framesProblem,
  numberOrder: numberOrderProblem,
  skipCount: skipCountProblem,
  ordinal: ordinalProblem,
  placeValue: placeValueProblem,
  compare: compareProblem,
  rounding: roundingProblem,
  estimate: estimateProblem,
  negative: negativeProblem,
  exponents: exponentsProblem,
  primes: primesProblem,
  missingDigit: missingDigitProblem,
  equalGroups: equalGroupsProblem,
  sharing: sharingProblem,
  remainder: remainderProblem,
  squares: squaresProblem,
  distributive: distributiveProblem,
  orderOps: orderOpsProblem,
  variables: variablesProblem,
  fractionPicture: fractionPictureProblem,
  compareFractions: compareFractionsProblem,
  addFractions: addFractionsProblem,
  decimalPlace: decimalPlaceProblem,
  decimalConvert: decimalConvertProblem,
  decimalAddSub: decimalAddSubProblem,
  money: moneyProblem,
  ruler: rulerProblem,
  massVolume: massVolumeProblem,
  duration: durationProblem,
  clock24: clock24Problem,
  perimeter: perimeterProblem,
  area: areaProblem,
  angles: anglesProblem,
  shapeSides: shapeSidesProblem,
  shapeClass: shapeClassProblem,
  lines: linesProblem,
  symmetry: symmetryProblem,
  position: positionProblem,
  pictureGraph: pictureGraphProblem,
  barGraph: barGraphProblem,
  logic: logicProblem,
  counting: countingProblem,
  probability: probabilityProblem,
};
