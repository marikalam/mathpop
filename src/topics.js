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

// ---- Words for "Show me how" (explain.js): these steps are spoken aloud,
// so numbers, fractions, money and times are written the way we say them.

const sayNum = (n) => (n < 0 ? `negative ${-n}` : String(n));
const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const ORDINAL_PARTS = {
  2: 'half', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth',
  11: 'eleventh', 12: 'twelfth', 13: 'thirteenth', 14: 'fourteenth', 15: 'fifteenth', 16: 'sixteenth', 18: 'eighteenth',
  20: 'twentieth', 24: 'twenty-fourth', 100: 'hundredth',
};
// 'halves', 'thirds'...: the name of the pieces when a whole is cut into d.
const partsName = (d) => (d === 2 ? 'halves' : `${ORDINAL_PARTS[d] || `${d}th`}s`);
// 3, 4 -> '3 fourths'; 1, 2 -> '1 half'.
const fracWords = (a, d) => (a === 1 ? `1 ${ORDINAL_PARTS[d] || `${d}th`}` : `${a} ${partsName(d)}`);
// '3/4', '1 1/2' or '2' -> words.
function fracStringWords(s) {
  const [whole, frac] = s.includes(' ') ? s.split(' ') : s.includes('/') ? [null, s] : [s, null];
  const part = frac ? fracWords(...frac.split('/').map(Number)) : '';
  if (whole && part) return `${whole} and ${part}`;
  return part || (whole === '1' ? '1 whole' : `${whole} wholes`);
}

// 1250 cents -> '12 dollars and 50 cents'.
function moneyWords(c) {
  const d = Math.floor(c / 100);
  const cents = c % 100;
  if (d && cents) return `${plural(d, 'dollar')} and ${plural(cents, 'cent')}`;
  return d ? plural(d, 'dollar') : plural(cents, 'cent');
}

// 4, 5 -> '4 oh 5'; 4, 0 -> '4 o'clock'.
const timeWords = (h, m) => (m === 0 ? `${h} o'clock` : m < 10 ? `${h} oh ${m}` : `${h} ${m}`);
const clockWords = (mins) => timeWords(((Math.floor(mins / 60) + 11) % 12) + 1, mins % 60);

// The last step of every comparing walkthrough, and the answer after it.
const compareAsk = (l, r) => `So is ${l} less than, greater than, or equal to ${r}?`;
const compareSay = (a, b, l, r) => `So ${l} is ${a < b ? 'less than' : a > b ? 'greater than' : 'equal to'} ${r}.`;

// ---------------- Numbers ----------------

// Counting to 20 in ten frames, the Singapore way (K2).
function framesProblem() {
  const n = randInt(5, 20);
  const near = [n - 1, n + 1, n - 2, n + 2, n + 10, n - 10].filter((x) => x >= 1 && x <= 20);
  let explain;
  if (n > 10) {
    explain = [
      'Let’s count the dots together.',
      'Each ten frame has 10 boxes, in 2 rows of 5.',
      'The first frame is full, so that’s 10 dots. No need to count them one by one!',
      'Now count on from 10 with the dots in the next frame.',
      'How many dots are there in all?',
    ];
  } else if (n === 10) {
    explain = [
      'Let’s look at the ten frame together.',
      'A ten frame has 2 rows of 5 boxes.',
      'Is every box filled with a dot?',
      'So how many dots is a full frame?',
    ];
  } else {
    explain = n === 5
      ? ['Let’s count the dots together.', 'Look at the bottom row first. It’s empty!', 'Now touch each dot in the top row as you count.', 'How many dots are there?']
      : [
        'Let’s count the dots together.',
        'The top row is full, and a full row has 5 dots.',
        'Now count on from 5 with the dots in the bottom row.',
        'How many dots are there in all?',
      ];
  }
  return {
    explain,
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
        explain: [
          'Let’s say the numbers in order, like counting.',
          `Start at ${n - 1}.`,
          `The number in between comes right after ${n - 1} and right before ${n + 1}.`,
          `So what number comes after ${n - 1}?`,
        ],
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
      explain: kind === 'before'
        ? ['Just before means one less.', `Picture counting backward from ${n}.`, 'Take just one step back.', `What is 1 less than ${n}?`]
        : ['Just after means one more.', `Picture counting up from ${n}.`, 'Take just one step forward.', `What is 1 more than ${n}?`],
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
  const placeName = { 10: 'tens', 100: 'hundreds', 1000: 'thousands', 10000: 'ten thousands' }[step];
  const one = { 10: 'ten', 100: 'hundred', 1000: 'thousand', 10000: 'ten thousand' }[step];
  const d = Math.floor(n / step) % 10;
  const trade = more ? d === 9 : d === 0;
  return {
    explain: [
      `${fmt(step)} ${more ? 'more' : 'less'} means one ${more ? 'more' : 'less'} ${one}.`,
      `Look at the ${placeName} place in ${fmt(n)}. It has a ${d}.`,
      trade
        ? `${d} can’t go ${more ? 'up' : 'down'} one in that place, so we trade with the next place over.`
        : `Change that ${d} to ${more ? d + 1 : d - 1}. All the other digits stay the same.`,
      trade ? `Try counting ${more ? 'on' : 'back'} ${fmt(step)} from ${fmt(n)}. What number do you land on?` : 'So what number is that?',
    ],
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
  const prev = seq[hole - 1];
  return {
    explain: [
      `These numbers count ${down ? 'back' : 'up'} by ${fmt(step)}s.`,
      `Each jump ${down ? 'takes away' : 'adds'} ${fmt(step)}.`,
      `The number just before the gap is ${fmt(prev)}.`,
      hole < 4 ? `You can check your answer with the number after the gap, ${fmt(seq[hole + 1])}.` : 'Make one more jump from there.',
      `So what is ${fmt(prev)} ${down ? 'take away' : 'plus'} ${fmt(step)}?`,
    ],
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
const ANIMAL_NAMES = { '🐶': 'dog', '🐱': 'cat', '🐰': 'bunny', '🐸': 'frog', '🐵': 'monkey', '🐷': 'pig', '🐔': 'chicken', '🐻': 'bear', '🦊': 'fox', '🐼': 'panda' };

// First, second, third... in a line (P1).
function ordinalProblem() {
  const row = shuffle(LINE_ANIMALS).slice(0, 7);
  const i = randInt(0, 6);
  const animal = ANIMAL_NAMES[row[i]];
  if (Math.random() < 0.5) {
    return {
      explain: [
        'Find the left side of the line. It says left there.',
        'Put your finger on the first animal and count each one: first, second, third, and so on.',
        `Stop when you say ${ORDINAL_WORDS[i]}.`,
        'Which animal is your finger on?',
      ],
      explainAnswer: `It’s the ${animal}!`,
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
    explain: [
      `First, find the ${animal} in the line.`,
      'Now start at the left side, where it says left.',
      `Count each animal as you go: first, second, third, until you reach the ${animal}.`,
      `Which place is the ${animal} in?`,
    ],
    explainAnswer: `The ${animal} is ${ORDINAL_WORDS[i]}!`,
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
  const len = String(n).length;
  const placeList = `Start at the right and move left: ${names.slice(0, len).join(', ')}.`;
  if (unique && Math.random() < 0.5) {
    return {
      explain: [
        `Let’s name the place of each digit in ${fmt(n)}.`,
        placeList,
        `The ${digit} is in the ${names[place]} place.`,
        place === 0
          ? 'Digits in the ones place are worth just that many ones.'
          : digit === 1
            ? `So it stands for 1 of the ${names[place]}.`
            : `So it stands for ${digit} ${names[place]}. Count by ${fmt(10 ** place)}s, ${digit} times.`,
        `So how much is the ${digit} really worth?`,
      ],
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
    explain: [
      `Let’s find each place in ${fmt(n)}.`,
      'The digit at the far right is in the ones place.',
      placeList,
      `Slide your finger over to the ${names[place]} place.`,
      'Which digit is sitting there?',
    ],
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
  const [sa, sb] = [String(a), String(b)];
  const PLACES = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands'];
  let explain;
  if (sa.length !== sb.length) {
    explain = [
      `Let’s compare ${fmt(a)} and ${fmt(b)}.`,
      `${fmt(a)} has ${plural(sa.length, 'digit')}, and ${fmt(b)} has ${plural(sb.length, 'digit')}.`,
      'The number with more digits is the bigger number.',
      compareAsk(fmt(a), fmt(b)),
    ];
  } else if (sa.length === 1) {
    explain = [
      'Think about counting: 1, 2, 3, 4, and on.',
      'The number you say later is the bigger one.',
      a === b ? 'Are these two numbers the same?' : `Do you say ${a} or ${b} later?`,
      compareAsk(a, b),
    ];
  } else {
    const i = [...sa].findIndex((ch, k) => ch !== sb[k]);
    const placeOf = (k) => PLACES[sa.length - 1 - k];
    explain = [`Let’s compare ${fmt(a)} and ${fmt(b)}, starting with the biggest place.`];
    if (i === -1) {
      explain.push('Check each place, one by one. Do all the digits match?');
    } else {
      if (i > 0) explain.push(`The ${i === 1 ? `${placeOf(0)} digits are` : 'first digits are'} the same, so keep going.`);
      explain.push(`In the ${placeOf(i)} place, ${fmt(a)} has ${sa[i]}, and ${fmt(b)} has ${sb[i]}.`);
      explain.push(`Which is bigger, ${sa[i]} or ${sb[i]}?`);
    }
    explain.push(compareAsk(fmt(a), fmt(b)));
  }
  return { ...compareSigns(a, b, fmt(a), fmt(b), a, b), explain, explainAnswer: compareSay(a, b, fmt(a), fmt(b)) };
}

// Rounding (P4) and estimating (Beast Academy 3D).
function roundingProblem(tier, grade) {
  const to = grade === '3' ? pick([10, 100]) : pick([10, 100, 1000]);
  const n = grade === '3' ? randInt(to + 1, 9999) : randInt(1000, 99999);
  const correct = Math.round(n / to) * to;
  if (n % to === 0) return roundingProblem(tier, grade);
  const placeName = { 10: 'tens', 100: 'hundreds', 1000: 'thousands' }[to];
  const next = Math.floor(n / (to / 10)) % 10;
  return {
    explain: [
      `We want the nearest ${fmt(to)}, so find the ${placeName} place in ${fmt(n)}.`,
      `Now look at the digit just to its right. It’s a ${next}.`,
      next >= 5
        ? `${next} is 5 or more, so we round up. The ${placeName} digit goes up by one.`
        : `${next} is less than 5, so we round down. The ${placeName} digit stays the same.`,
      `Then every digit after the ${placeName} place turns into a zero.`,
      'So what number do you get?',
    ],
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
  if (!add && (correct <= 0 || correct === ry)) return estimateProblem(tier, grade);
  return {
    explain: [
      'To estimate, we round each number to the nearest hundred.',
      `${x} is close to ${rx}.`,
      `${y} is close to ${ry}.`,
      `Those are much easier to ${add ? 'add' : 'take away'}. So what is ${rx} ${add ? 'plus' : 'take away'} ${ry}?`,
    ],
    explainAnswer: `So it’s about ${fmt(correct)}.`,
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
      explain: [
        'Look at the number line. Zero is in the middle.',
        'Numbers to the right of zero are positive. Numbers to the left of zero are negative.',
        n === 0 ? 'Is the arrow right on zero?' : 'Start at zero and count the marks over to the arrow.',
        n === 0 ? 'So what number is that?' : 'Is the arrow left or right of zero? So what number is it pointing to?',
      ],
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
    return {
      ...compareSigns(a, b, signed(a), signed(b), sayNum(a), sayNum(b)),
      explain: [
        'Picture the number line. Numbers get bigger as you go to the right.',
        'Negative numbers sit to the left of zero.',
        ...(a < 0 && b < 0 && a !== b ? ['Here’s a trick: the farther a negative number is from zero, the smaller it is.'] : []),
        a === b ? 'Do they sit on the very same spot?' : `Which one is farther to the right, ${sayNum(a)} or ${sayNum(b)}?`,
        compareAsk(sayNum(a), sayNum(b)),
      ],
      explainAnswer: compareSay(a, b, sayNum(a), sayNum(b)),
    };
  }
  const start = kind === 'colder' ? randInt(-3, 8) : randInt(1, 9);
  const drop = randInt(Math.max(start + 1, 2), start + 8);
  const correct = start - drop;
  const jumps = start > 0
    ? [`${cap(plural(start, 'jump'))} to the left ${start === 1 ? 'takes' : 'take'} you down to zero.`, `Then you still have ${plural(drop - start, 'jump')} to go, below zero.`]
    : start === 0 ? [`You’re already at zero, so all ${drop} jumps go below zero.`] : [`Make ${drop} jumps to the left, counting as you go.`];
  if (kind === 'colder') {
    return {
      explain: [
        `Start at ${sayNum(start)} degrees on the number line.`,
        'Colder means the temperature goes down, so we jump to the left.',
        ...jumps,
        'Where do you land? What is the temperature now?',
      ],
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
    explain: [
      `Start at ${start} on the number line.`,
      `Taking away ${drop} means ${drop} jumps to the left.`,
      ...jumps,
      'Where do you land?',
    ],
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
    const [l, r] = [`${a} to the power of ${b}`, `${b} to the power of ${a}`];
    return {
      ...compareSigns(a ** b, b ** a, `${a}${SUPER[b]}`, `${b}${SUPER[a]}`, l, r),
      explain: [
        `${cap(l)} means ${b} ${a}s multiplied together.`,
        `${Array(b).fill(a).join(' times ')} makes ${a ** b}.`,
        `${cap(r)} means ${a} ${b}s multiplied together.`,
        `${Array(a).fill(b).join(' times ')} makes ${b ** a}.`,
        compareAsk(l, r),
      ],
      explainAnswer: compareSay(a ** b, b ** a, l, r),
    };
  }
  if (kind === 'ten') {
    const e = randInt(2, 5);
    return {
      explain: [
        `10 to the power of ${e} means ${e} tens multiplied together.`,
        'Here’s a trick: each time you multiply by 10, you stick one more zero on the end.',
        `So it’s a 1 with ${e} zeros after it.`,
        'What number is that?',
      ],
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
  const partial = [];
  for (let k = 2; k < e; k++) partial.push(`${base ** (k - 1)} times ${base} is ${base ** k}.`);
  return {
    explain: [
      `${base} to the power of ${e} means ${e} ${base}s multiplied together.`,
      `That’s ${Array(e).fill(base).join(' times ')}.`,
      ...(partial.length === 1 ? ['Let’s multiply one at a time.'] : []),
      ...partial,
      `So what is ${base ** (e - 1)} times ${base}?`,
    ],
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
      explain: [
        'A prime number can only be made as 1 times itself.',
        'Other numbers can be split into equal groups, so they are not prime.',
        'Try splitting each number into equal groups of 3, 5, or 7.',
        'The number that won’t split evenly is the prime one.',
        'Which one do you think it is?',
      ],
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
    explain: [
      'A prime number can only be made as 1 times itself.',
      `Let’s check the numbers after ${after}, one at a time.`,
      'Skip the even ones. They split into groups of 2.',
      'Also skip any number that splits into equal groups of 3, 5, or 7.',
      `What is the first number after ${after} that won’t split?`,
    ],
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
  const other = hideIn === 'a' ? b : a;
  const onesSum = (a % 10) + (b % 10);
  const explain = place === 0
    ? [
      'Let’s start with the ones place.',
      `The other number has ${other % 10} ones, and the answer has ${sum % 10} ones.`,
      `So ${other % 10} plus the missing digit must end in ${sum % 10}.`,
      `What digit plus ${other % 10} ends in ${sum % 10}?`,
    ]
    : [
      `First add the ones: ${a % 10} plus ${b % 10} is ${onesSum}.`,
      onesSum >= 10 ? 'That makes a new ten, so carry 1 ten over to the tens.' : 'No new ten there, so nothing to carry.',
      `The answer has ${plural(Math.floor(sum / 10), 'ten')}. The other number gives ${plural(Math.floor(other / 10), 'ten')}${onesSum >= 10 ? ', plus the 1 we carried' : ''}.`,
      `How many more tens do you need to make ${plural(Math.floor(sum / 10), 'ten')}?`,
    ];
  return {
    explain,
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
const GROUP_NAMES = { '🍪': 'cookies', '🍎': 'apples', '🌸': 'flowers', '⭐': 'stars', '🐟': 'fish', '🍓': 'strawberries', '🧁': 'cupcakes', '⚽': 'balls' };

// Equal groups, multiplying as adding the same number (P1, P2).
function equalGroupsProblem(tier, grade) {
  const groups = randInt(2, grade === '1' ? 4 : 5);
  const each = randInt(2, grade === '1' ? 5 : 6);
  const emoji = pick(GROUP_EMOJI);
  const correct = groups * each;
  const counted = Array.from({ length: groups - 1 }, (_, i) => each * (i + 1));
  return {
    explain: [
      `Look, there are ${groups} groups, with ${each} ${GROUP_NAMES[emoji]} in each group.`,
      `Let’s skip count by ${each}s, one group at a time.`,
      `Point to each group and count with me: ${counted.join(', ')}.`,
      `Now one more group of ${each}. How many in all?`,
    ],
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
    explain: [
      `We have ${total} ${GROUP_NAMES[emoji]} to share with ${kids} friends.`,
      'Sharing equally means everyone gets the same number.',
      `Give one to each friend, round and round. Each time round uses up ${kids}.`,
      `Keep going until all ${total} are gone. How many does each friend get?`,
    ],
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
    explain: askR
      ? [
        `${n} divided by ${d} is ${q}, with some left over.`,
        `${q} groups of ${d} is ${d * q}.`,
        `Now see how much is left: take ${d * q} away from ${n}.`,
        'How many are left over?',
      ]
      : [
        `There are ${r} left over, so take those away first.`,
        `${n} take away ${r} is ${n - r}.`,
        `Now ${n - r} splits evenly into groups of ${d}.`,
        `So ${d} times what makes ${n - r}?`,
      ],
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
      explain: [
        `${n} times ${n} means ${n} groups of ${n}.`,
        n <= 6 ? `Look at the square. It has ${n} rows, with ${n} in each row.` : `Picture a square with ${n} rows of ${n}.`,
        `${cap(plural(n - 1, 'group'))} of ${n} is ${n * (n - 1)}.`,
        `Add one more group of ${n}. What is ${n * (n - 1)} plus ${n}?`,
      ],
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
    const t = n > 3 ? n - 1 : n + 1;
    return {
      explain: [
        `We need one number that, times itself, makes ${n * n}.`,
        'Let’s try a number and see.',
        `${t} times ${t} is ${t * t}. That’s too ${t < n ? 'small' : 'big'}.`,
        `So try a ${t < n ? 'bigger' : 'smaller'} number. Which number times itself makes ${n * n}?`,
      ],
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
  const ex = n === 3 ? 4 : 3;
  return {
    explain: [
      `A perfect square is a number times itself, like ${ex} times ${ex} is ${ex * ex}.`,
      'It makes a perfect square shape out of dots!',
      'Check each choice. Can you make it from a number times the same number?',
      'Which one do you think it is?',
    ],
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
      explain: [
        `Here’s a trick: break ${b} into a ten and some ones.`,
        `Then ${a} times ${b} is ${a} times 10, plus ${a} times the ones.`,
        `${b} is 10 and how many more?`,
        'That number goes in the box. What is it?',
      ],
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
    explain: [
      `Here’s a trick: break ${b} into 10 and ${ones}.`,
      `${a} times 10 is ${a * 10}.`,
      `${a} times ${ones} is ${a * ones}.`,
      `Now put them back together. What is ${a * 10} plus ${a * ones}?`,
    ],
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
  let explain;
  if (kind === 0) {
    const [a, b, c] = [randInt(2, 20), randInt(2, 9), randInt(2, 9)];
    text = `${a} + ${b} × ${c}`;
    value = a + b * c;
    hint = 'Multiply before you add.';
    explain = ['Here’s the rule: we multiply before we add.', `So do ${b} times ${c} first. That’s ${b * c}.`, `Now what is ${a} plus ${b * c}?`];
  } else if (kind === 1) {
    const [b, c] = [randInt(2, 9), randInt(2, 9)];
    const a = b * c + randInt(1, 30);
    text = `${a} ${MINUS} ${b} × ${c}`;
    value = a - b * c;
    hint = 'Multiply before you subtract.';
    explain = value === b * c
      ? ['Here’s the rule: we multiply before we take away.', `So do ${b} times ${c} first.`, `Now take that away from ${a}. What do you get?`]
      : ['Here’s the rule: we multiply before we take away.', `So do ${b} times ${c} first. That’s ${b * c}.`, `Now what is ${a} take away ${b * c}?`];
  } else if (kind === 2) {
    const [a, b, c] = [randInt(2, 12), randInt(2, 9), randInt(2, 6)];
    text = `(${a} + ${b}) × ${c}`;
    value = (a + b) * c;
    hint = 'Do what is in the parentheses first.';
    explain = ['See the brackets? The part inside them always goes first.', `${a} plus ${b} is ${a + b}.`, `Now what is ${a + b} times ${c}?`];
  } else {
    const c = randInt(2, 9);
    const q = randInt(2, 9);
    const a = randInt(q + 1, 40);
    text = `${a} ${MINUS} ${c * q} ÷ ${c}`;
    value = a - q;
    hint = 'Divide before you subtract.';
    explain = value === q
      ? ['Here’s the rule: we divide before we take away.', `So do ${c * q} divided by ${c} first.`, `Now take that away from ${a}. What do you get?`]
      : ['Here’s the rule: we divide before we take away.', `So do ${c * q} divided by ${c} first. That’s ${q}.`, `Now what is ${a} take away ${q}?`];
  }
  return {
    explain,
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
      explain: [
        `The letter ${letter} stands for a mystery number.`,
        `The mystery number plus ${b} makes ${n + b}.`,
        `To undo adding ${b}, we take ${b} away.`,
        `So what is ${n + b} take away ${b}?`,
      ],
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
      explain: [
        `The letter ${letter} stands for a mystery number.`,
        `${b} groups of the mystery number make ${n * b}.`,
        'To undo times, we divide.',
        `So what is ${n * b} divided by ${b}?`,
      ],
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
      explain: [
        `${letter} is ${v}, so put a ${v} everywhere you see ${letter}.`,
        `That makes ${v} plus ${v} plus ${c}.`,
        `${v} plus ${v} is ${v + v}.`,
        `So what is ${v + v} plus ${c}?`,
      ],
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
    explain: [
      'Let’s undo it, one step at a time.',
      `First take away the ${c}. ${m * n + c} take away ${c} is ${m * n}.`,
      `So ${m} times ${letter} is ${m * n}.`,
      `Now what is ${m * n} divided by ${m}?`,
    ],
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
    explain: [
      `First, count all the equal parts in the ${shape}.`,
      `There are ${b} equal parts, so each part is 1 ${ORDINAL_PARTS[b]}.`,
      'Now count just the shaded parts.',
      `So how many ${partsName(b)} are shaded?`,
    ],
    explainAnswer: `It’s ${fracWords(a, b)}!`,
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
  const [l, r] = [fracWords(a, b), fracWords(c, d)];
  let explain;
  if (b === d) {
    explain = [
      `Both fractions are in ${partsName(b)}, so the pieces are the same size.`,
      'When the pieces are the same size, more pieces means more.',
      a === c ? 'Do they have the same number of pieces?' : `Which is more pieces, ${a} or ${c}?`,
    ];
  } else if (a === 1 && c === 1) {
    explain = [
      'Picture two pizzas, the very same size.',
      `One is cut into ${b} slices, and the other into ${d} slices.`,
      'Cutting into more slices makes each slice smaller.',
      `Which slice is bigger, 1 out of ${b} or 1 out of ${d}?`,
    ];
  } else {
    const [sa, sb, big] = b < d ? [a, b, d] : [c, d, b];
    const m = big / sb;
    explain = [
      'The bottoms are different, so let’s make them the same.',
      `Multiply the top and bottom of ${fracWords(sa, sb)} by ${m}.`,
      `${cap(fracWords(sa, sb))} is the same as ${fracWords(sa * m, big)}.`,
      `Now both are in ${partsName(big)}. Which has more pieces?`,
    ];
  }
  return {
    ...compareSigns(a * d, c * b, `${a}/${b}`, `${c}/${d}`, l, r),
    explain: [...explain, compareAsk(l, r)],
    explainAnswer: compareSay(a * d, c * b, l, r),
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
  const op = add ? 'plus' : 'take away';
  const [lb, rb] = [Number(left.split('/')[1]), Number(right.split('/')[1])];
  const [nl, nr] = left === `${a}/${b}` ? [na, nc] : [nc, na];
  const explain = [];
  if (b === d) {
    explain.push(`Both fractions are in ${partsName(den)}, so the pieces are the same size.`);
    explain.push(`We just ${add ? 'add' : 'take away'} the tops. The bottom stays the same.`);
  } else {
    const [x, xb] = lb < rb ? left.split('/').map(Number) : right.split('/').map(Number);
    explain.push('The bottoms are different, so let’s make them the same first.');
    explain.push(`${cap(fracWords(x, xb))} is the same as ${fracWords(x * (den / xb), den)}.`);
    explain.push(`Now both are in ${partsName(den)}, so we ${add ? 'add' : 'take away'} the tops.`);
  }
  if (top > den) explain.push('If you get more than a whole, see how many wholes you can make.');
  else if (correct !== `${top}/${den}`) explain.push('Then see if you can write it in a simpler way.');
  explain.push(`So what is ${fracWords(nl, den)} ${op} ${fracWords(nr, den)}?`);
  const wrong = [fracText(top + 1, den), fracText(Math.max(1, top - 1), den), `${add ? a + c : Math.abs(a - c)}/${b + d}`, `${top}/${den * 2}`];
  return {
    explain,
    explainAnswer: `It’s ${fracStringWords(correct)}!`,
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
      explain: [
        `In ${w}.${t}${h}, the little dot is called the decimal point.`,
        'The first digit after the point is in the tenths place.',
        'The next digit after that is in the hundredths place.',
        `Find the ${asTenths ? 'tenths' : 'hundredths'} place. Which digit is there?`,
      ],
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
      explain: [
        'The first place after the decimal point is the tenths place.',
        `In 0.${t}, look at the digit right after the point.`,
        'That digit tells you how many tenths there are.',
        `So how many tenths is 0.${t}?`,
      ],
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
      explain: [
        'Two places after the decimal point is the hundredths place.',
        `In ${shown}, read the two digits after the point together, like a whole number.`,
        ...(h < 10 ? ['A zero at the front doesn’t add anything.'] : []),
        `So how many hundredths is ${shown}?`,
      ],
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
    explain: [
      'Let’s write both numbers with 2 digits after the point.',
      `That gives ${x.toFixed(2)} and ${y.toFixed(2)}.`,
      `Now it’s ${Math.round(x * 100)} hundredths and ${Math.round(y * 100)} hundredths. Which is more?`,
      compareAsk(dec(x), dec(y)),
    ],
    explainAnswer: compareSay(x, y, dec(x), dec(y)),
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
    let explain;
    if (b === 10) explain = [`${cap(fracWords(a, b))} goes right in the tenths place.`, 'The tenths place is the first place after the decimal point.'];
    else if (b === 100) explain = [`${cap(fracWords(a, b))} fills the tenths and hundredths places.`, 'Those are the two places after the decimal point.'];
    else {
      const to = 10 % b === 0 ? 10 : 100;
      explain = [
        `Let’s make the bottom ${to}. Multiply the top and bottom by ${to / b}.`,
        `${cap(fracWords(a, b))} is the same as ${fracWords(a * (to / b), to)}.`,
        to === 10 ? 'Tenths go in the first place after the decimal point.' : 'Hundredths fill the two places after the decimal point.',
      ];
    }
    return {
      explain: [...explain, `So how do you write ${fracWords(a, b)} as a decimal?`],
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
  const places = correct.split('.')[1].length;
  const asParts = Math.round(v * 10 ** places);
  return {
    explain: [
      `${correct} has ${plural(places, 'digit')} after the decimal point, so the bottom number is ${places === 1 ? 10 : 100}.`,
      'The digits after the point tell you the top number.',
      ...(gcd(asParts, 10 ** places) > 1 ? ['Then make it simpler. Divide the top and bottom by the same number.'] : []),
      `Which fraction is the same as ${correct}?`,
    ],
    explainAnswer: `So ${correct} is ${fracWords(a, b)}!`,
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
  const unit = places === 1 ? 'tenths' : 'hundredths';
  return {
    explain: [
      'First, line up the decimal points, one on top of the other.',
      `Here’s a trick: think of both numbers in ${unit}.`,
      `${show(x)} is ${x} ${unit}, and ${show(y)} is ${y} ${unit}.`,
      `Work out ${x} ${add ? 'plus' : 'take away'} ${y}, then put the point back in.`,
      `So what is ${show(x)} ${add ? 'plus' : 'take away'} ${show(y)}?`,
    ],
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
      items.sort((x, y) => y - x);
      const sums = items.map((_, i) => items.slice(0, i + 1).reduce((t, c) => t + c, 0));
      return {
        explain: items.length === 1
          ? ['Look at the coin. What number is written on it?', 'That number tells you how many cents it is worth.', 'So how many cents is that?']
          : [
            'Start with the biggest coin, then count on.',
            `The biggest coin is ${items[0]} cents.`,
            ...(items.length > 2 ? [`Count on with the next coins: ${sums.slice(0, -1).join(', ')}.`] : []),
            `Now count on ${items[items.length - 1]} more from ${sums[sums.length - 2]}. How many cents in all?`,
          ],
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
    items.sort((x, y) => y - x);
    const sums = items.map((_, i) => items.slice(0, i + 1).reduce((t, c) => t + c, 0) / 100);
    return {
      explain: [
        'Start with the biggest one, then count on.',
        `The biggest is ${plural(items[0] / 100, 'dollar')}.`,
        ...(items.length > 2 ? [`Count on with the next ones: ${sums.slice(0, -1).join(', ')}.`] : []),
        `Now count on ${items[items.length - 1] / 100} more from ${sums[sums.length - 2]}. How many dollars in all?`,
      ],
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
      const d = Math.floor(cents / 100);
      return {
        explain: [
          'One dollar is worth 100 cents.',
          `So ${plural(d, 'dollar')} is ${d * 100} cents.`,
          `Then there are ${cents % 100} more cents.`,
          `So what is ${d * 100} plus ${cents % 100}?`,
        ],
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
    const notes = items.filter((c) => c >= 100).sort((x, y) => y - x);
    const coins = items.filter((c) => c < 100).sort((x, y) => y - x);
    const coinTotal = coins.reduce((s, c) => s + c, 0);
    return {
      explain: [
        'Let’s count the dollars first, then the cents.',
        `The dollars: ${notes.map((c) => c / 100).join(' plus ')} makes ${plural(notes.reduce((s, c) => s + c, 0) / 100, 'dollar')}.`,
        `The coins: ${coins.join(' plus ')} makes ${coinTotal} cents.`,
        ...(coinTotal >= 100 ? ['Remember, 100 cents makes 1 more dollar.'] : []),
        'So how much money is that in all?',
      ],
      explainAnswer: `It’s ${moneyWords(total)}!`,
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
    const cents = (a % 100) + (b % 100);
    return {
      explain: [
        'Let’s add the dollars first, then the cents.',
        `Dollars: ${Math.floor(a / 100)} plus ${Math.floor(b / 100)} is ${Math.floor(a / 100) + Math.floor(b / 100)}.`,
        `Cents: ${a % 100} plus ${b % 100} is ${cents}.`,
        ...(cents >= 100 ? ['That’s more than 100 cents, so trade 100 cents for 1 more dollar.'] : []),
        'So how much is that altogether?',
      ],
      explainAnswer: `It’s ${moneyWords(correct)} altogether.`,
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
  const nextDollar = Math.ceil(a / 100);
  return {
    explain: [
      'Change is the money you get back.',
      `Here’s a trick: count up from ${moneyWords(a)} to ${moneyWords(paid)}.`,
      ...(a % 100 ? [`First, ${100 - (a % 100)} cents gets you up to ${plural(nextDollar, 'dollar')}.`] : []),
      ...(paid / 100 > nextDollar ? [`Then ${plural(paid / 100 - nextDollar, 'more dollar')} gets you to ${moneyWords(paid)}.`] : []),
      'So how much did you count up in all?',
    ],
    explainAnswer: `${name} gets ${moneyWords(correct)} back.`,
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
    explain: start
      ? [
        `Look closely! The ${thing} starts at ${start}, not at 0.`,
        `Find where it ends. It ends at ${start + len}.`,
        `So count the spaces from ${start} to ${start + len}. Each space is 1 centimetre.`,
        `What is ${start + len} take away ${start}?`,
      ]
      : [
        `Look at the left end of the ${thing}. It starts right at 0.`,
        'Each space between the numbers is 1 centimetre.',
        `Now slide your eyes to the other end of the ${thing}.`,
        'Which number on the ruler is it lined up with?',
      ],
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
const UNIT_WORDS = { kg: 'kilograms', g: 'grams', L: 'litres', mL: 'millilitres', km: 'kilometres', m: 'metres', cm: 'centimetres' };
const UNIT_WORD = { kg: 'kilogram', g: 'gram', L: 'litre', mL: 'millilitre', km: 'kilometre', m: 'metre', cm: 'centimetre' };
const unitWords = (n, u) => `${fmt(n)} ${n === 1 ? UNIT_WORD[u] : UNIT_WORDS[u]}`;
// What the front of the small unit's name tells you, for 1 big = ? small.
const UNIT_PREFIX = {
  g: 'Kilo means a thousand.',
  mL: 'Milli means one thousandth. A millilitre is tiny, like a few drops of water.',
  m: 'Kilo means a thousand.',
  cm: 'Centi means one hundredth. A centimetre is about as wide as your fingertip.',
};

// Mass and volume: choosing units (P2) and converting compound units (P3).
function massVolumeProblem(tier, grade) {
  if (grade === '2' && Math.random() < 0.6) {
    const mass = Math.random() < 0.5;
    const [thing, unit] = pick(mass ? MASS_THINGS : VOLUME_THINGS);
    const big = unit === 'kg' || unit === 'L';
    return {
      explain: mass
        ? ['Grams are for light things, like a feather.', 'Kilograms are for heavy things, like a big suitcase.', `Is ${thing} light or heavy?`, 'So which unit would you use?']
        : ['Millilitres are for tiny amounts, like a few drops.', 'Litres are for big amounts, like a big bottle of water.', `Does ${thing} hold a little or a lot?`, 'So which unit fits best?'],
      explainAnswer: mass
        ? `${cap(UNIT_WORDS[unit])}, because ${thing} is ${big ? 'heavy' : 'light'}.`
        : `${cap(UNIT_WORDS[unit])}, because ${thing} holds ${big ? 'a lot' : 'just a little'}.`,
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
  const fact = `1 ${UNIT_WORD[big]} is ${unitWords(k, small)}.`;
  if (grade === '2') {
    return {
      explain: whole === 1
        ? [UNIT_PREFIX[small], `So how many ${UNIT_WORDS[small]} make 1 ${UNIT_WORD[big]}?`]
        : [fact, `So ${unitWords(whole, big)} is ${whole} groups of ${fmt(k)}.`, `What is ${whole} times ${fmt(k)}?`],
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
      explain: [
        fact,
        ...(whole > 1 ? [`So ${unitWords(whole, big)} is ${unitWords(whole * k, small)}.`] : []),
        `Then add ${unitWords(part, small)} more.`,
        `What is ${fmt(whole * k)} plus ${part}?`,
      ],
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
    explain: [
      fact,
      ...(whole > 1 ? [`So ${unitWords(whole, big)} uses up ${unitWords(whole * k, small)}.`] : []),
      `How many are left over? What is ${fmt(total)} take away ${fmt(whole * k)}?`,
    ],
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
        explain: [
          `Start at ${h} o'clock.`,
          'Each time the clock gets to the next o’clock, that’s 1 hour.',
          `Count the hours, one jump at a time, until you reach ${h + len} o'clock.`,
          'How many jumps did you make?',
        ],
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
      explain: s
        ? [
          'Both times are in the same hour, so just look at the minutes.',
          `It starts at ${s} minutes past and ends at ${s + len} minutes past.`,
          `Count on by fives from ${s} up to ${s + len}.`,
          'How many minutes did you count?',
        ]
        : [
          `It starts right at ${h} o'clock, when the minutes are zero.`,
          'Both times are in the same hour, so just look at the minutes.',
          `How many minutes past ${h} is ${timeWords(h, s + len)}?`,
        ],
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
      explain: [
        '1 hour is 60 minutes.',
        ...(h > 1 ? [`So ${h} hours is ${h} sixties. That’s ${h * 60} minutes.`] : []),
        `Then add the ${m} extra minutes.`,
        `What is ${h * 60} plus ${m}?`,
      ],
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
  const jumps = [];
  let at = start;
  while (at < end) {
    const to = Math.min(end, Math.floor(at / 60) * 60 + 60);
    jumps.push([at, to]);
    at = to;
  }
  return {
    explain: jumps.length === 1
      ? [
        'Both times are in the same hour, so just look at the minutes.',
        `Count on by fives from ${start % 60} minutes to ${end % 60} minutes.`,
        'How many minutes did you count?',
      ]
      : [
        'Here’s a trick: count on to the next hour first.',
        ...jumps.map(([f, t], i) => `${i ? 'Then from' : 'From'} ${clockWords(f)} to ${clockWords(t)} is ${t - f} minutes.`),
        `So what is ${jumps.map(([f, t]) => t - f).join(' plus ')}?`,
      ],
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
  const am = ampm === 'a.m.';
  const say24 = `${h === 0 ? 'zero zero' : h < 10 ? `oh ${h}` : h} ${m === 0 ? 'hundred' : m < 10 ? `oh ${m}` : m}`;
  const say12 = `${timeWords(h12, m)} ${am ? 'A M' : 'P M'}`;
  if (Math.random() < 0.5) {
    let rule;
    if (h === 0) rule = ['In 24-hour time, the day starts at midnight with hour zero.', '12 A M is just after midnight, so the hour is written 0 0.'];
    else if (am) rule = ['A M means the morning, before noon.', 'Morning hours stay the same in 24-hour time, with a zero in front if needed.'];
    else if (h === 12) rule = ['12 P M is noon, the middle of the day.', 'Noon stays 12 in 24-hour time.'];
    else rule = ['P M means after noon.', `For P M times, add 12 to the hour. So add 12 to ${h12}.`];
    return {
      explain: [...rule, 'The minutes stay just the same.', 'Which one shows that time?'],
      explainAnswer: `It’s ${say24}.`,
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
  let rule;
  if (h === 0) rule = ['Hour zero is midnight.', 'On a 12-hour clock, midnight is 12 A M.'];
  else if (am) rule = [`The hour is ${h}, which is less than 12.`, 'So it’s the morning, A M, and the hour stays the same.'];
  else if (h === 12) rule = ['Hour 12 is noon, the middle of the day.', 'So it’s P M, and the hour stays 12.'];
  else rule = [`The hour is ${h}, which is more than 12.`, `So it’s P M, after noon. Take 12 away from ${h} to get the hour.`];
  return {
    explain: [...rule, 'The minutes stay just the same.', 'Which one shows that time?'],
    explainAnswer: `It’s ${say12}.`,
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
      explain: [
        'Perimeter is the distance all the way around the edge.',
        'This shape has a corner cut out of it.',
        'Here’s a trick: push the cut-out sides back out, and you get a whole rectangle with the same perimeter.',
        `So it’s just like a rectangle ${w} across and ${h} up.`,
        `${w} plus ${h} is ${w + h}. That gets you halfway around.`,
        `So what is ${w + h} plus ${w + h}?`,
      ],
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
      explain: [
        'The perimeter goes all the way around: 2 sides across and 2 sides going up.',
        'So half the perimeter is the side across the bottom plus the side going up.',
        `Half of ${p} is ${w + h}.`,
        `The side across is ${w} centimetres.`,
        `So what is ${w + h} take away ${w}?`,
      ],
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
    explain: [
      'Perimeter means the distance all the way around.',
      `Trace around the rectangle: it has 2 sides of ${w} and 2 sides of ${h}.`,
      `${w} plus ${h} is ${w + h}. That gets you halfway around.`,
      `So what is ${w + h} plus ${w + h}?`,
    ],
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
    const bump = Math.random() < 0.5 && y0 > 0;
    if (bump) cells.push((y0 - 1) * cols + x0);
    return {
      explain: [
        'Area is how many squares cover the shape.',
        `Look at the big shaded block. It has ${h} rows, with ${w} squares in each row.`,
        `Skip count by ${w}s, one row at a time.`,
        ...(bump ? ['Don’t forget the 1 square sticking out on top!'] : []),
        'So how many squares are shaded in all?',
      ],
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
      explain: [
        `Imagine the corner wasn’t cut out. Then it’s a big rectangle, ${w} by ${h}.`,
        `${w} times ${h} is ${w * h} square centimetres.`,
        `The cut-out corner is ${cw} by ${ch}. That’s ${cw * ch} square centimetres.`,
        `So what is ${w * h} take away ${cw * ch}?`,
      ],
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
    explain: [
      'Area means how many squares, each 1 centimetre wide, fit inside.',
      `Picture ${h} rows, with ${w} squares in each row.`,
      `That’s ${h} groups of ${w}.`,
      `So what is ${h} times ${w}?`,
    ],
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
      const tip = {
        square: 'A square has 4 corners. Check each one. Is it a square corner?',
        rectangle: 'A rectangle has 4 corners. Check each one. Is it a square corner?',
        'right triangle': 'The name is a big clue: it’s called a right triangle because of its corner.',
        'equilateral triangle': 'All 3 corners of this triangle are the same, and they are pointy, not square.',
      }[shape];
      return {
        explain: [
          'A right angle is a square corner, like the corner of a book.',
          `Picture a ${shape}, and look at each corner.`,
          tip,
          `So how many right angles does a ${shape} have?`,
        ],
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
      explain: [
        'A right angle is a square corner, like the corner of a piece of paper.',
        'Imagine fitting a paper corner into this angle.',
        'If the angle is narrower than the paper, it’s smaller. If it opens wider, it’s bigger.',
        'Which one do you think it is?',
      ],
      explainAnswer: deg === 90 ? 'It’s a right angle!' : `It’s ${correct.toLowerCase()} than a right angle.`,
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
    const steps = {
      90: ['A full turn, all the way around, is 360 degrees.', 'A quarter turn is 1 of 4 equal parts of a full turn.', 'So what is 360 divided by 4?'],
      180: ['A quarter turn makes a square corner. That’s 90 degrees.', 'A half turn is 2 quarter turns.', 'So what is 90 plus 90?'],
      270: ['A quarter turn makes a square corner. That’s 90 degrees.', 'Three quarters means 3 quarter turns.', 'So what is 90 plus 90 plus 90?'],
      360: ['Picture spinning all the way around until you face the front again.', 'A quarter turn is 90 degrees, and a full turn is 4 quarter turns.', 'So what is 4 times 90?'],
    }[deg];
    return {
      explain: steps,
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
      explain: [
        clockwise ? 'Clockwise means turning the same way a clock’s hands go.' : 'Anticlockwise means turning the opposite way to a clock’s hands.',
        'On the compass, each step to the next direction is 45 degrees.',
        `So ${steps * 45} degrees is ${plural(steps, 'step')}.`,
        `Put your finger on ${COMPASS[from]} and move ${plural(steps, 'step')} ${clockwise ? 'clockwise' : 'anticlockwise'}.`,
        'Which way are you facing now?',
      ],
      explainAnswer: `You face ${COMPASS[to]} now!`,
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
    explain: [
      total === 90 ? 'The two angles fit together to make a right angle. That’s 90 degrees.' : 'The two angles fit together to make a straight line. That’s 180 degrees.',
      `One angle is ${known} degrees.`,
      `The other angle is what’s left. Count up from ${known} to ${total}.`,
      `So what is ${total} take away ${known}?`,
    ],
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
const SOLID_TIPS = {
  cube: ['Think of a dice.', 'Count the top, the bottom, and the sides all the way around.'],
  cuboid: ['Think of a cereal box.', 'Count the top, the bottom, and the sides all the way around.'],
  'square pyramid': ['It has a square on the bottom.', 'Then triangles lean in from each side of the square, up to the point.'],
  'triangular prism': ['It has a triangle at each end, like a tent.', 'Then rectangles go around the sides, one for each side of the triangle.'],
  cylinder: ['Think of a can of soup.', 'The top and the bottom are flat. The side all around is curved.'],
  cone: ['Think of an ice cream cone, turned upside down.', 'The round bottom is flat. The rest is curved up to a point.'],
};

// Sides and corners (P1), 2D and 3D shapes (P2, Beast Academy 1A and 3A).
function shapeSidesProblem(tier, grade) {
  const kind = grade === '2' ? pick(['sides', 'name', 'solid']) : pick(['sides', 'sides', 'name']);
  if (kind === 'solid') {
    const [solid, faces] = pick(SOLIDS);
    return {
      explain: [
        'A flat face is a flat side you could stand the shape on.',
        ...SOLID_TIPS[solid],
        `So how many flat faces does a ${solid} have?`,
      ],
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
      explain: [
        'First, count the sides with your finger, all the way around.',
        'A triangle has 3 sides, and a square has 4.',
        'A pentagon has 5, a hexagon has 6, and an octagon has 8.',
        'Which name matches the number of sides you counted?',
      ],
      explainAnswer: `It’s ${correct === 'octagon' ? 'an' : 'a'} ${correct}! It has ${n} sides.`,
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
  const what = corners ? 'corner' : 'side';
  return {
    explain: [
      corners ? 'A corner is a pointy spot where two sides meet.' : 'A side is a straight line on the edge of the shape.',
      `Put your finger on one ${what} and count it as 1.`,
      `Then go around, touching each ${what} as you count, until you get back to the start.`,
      `How many ${what}s did you count?`,
    ],
    visual: { kind: 'polygon', sides: n },
    prompt: `How many ${corners ? 'corners' : 'sides'} does it have?`,
    correct: n,
    answerType: 'numeric',
    answerLabel: `${n === 8 ? 'An' : 'A'} ${POLYGON_NAMES[n]} has ${n} sides and ${n} corners`,
    speech: `How many ${corners ? 'corners' : 'sides'} does this shape have?`,
    questionTitle: 'Sides & corners',
  };
}

const QUAD_STEPS = {
  square: ['It has 4 equal sides AND 4 right angles.', 'A rhombus has equal sides, but no square corners.', 'A rectangle has square corners, but not all its sides are equal.', 'Which shape has both?'],
  rectangle: ['Right angles are square corners.', 'A square has 4 square corners too, but all its sides are equal.', 'This shape has long sides and short sides.', 'Which shape is that?'],
  rhombus: ['Its sides are all equal, like a square.', 'But it has no right angles, so its corners are slanted.', 'It looks like a square that got pushed over.', 'Which shape is that?'],
  trapezoid: ['Parallel sides go the same way and never meet, like train tracks.', 'Lots of four-sided shapes have 2 pairs of parallel sides.', 'This one has only 1 pair.', 'Which shape is that?'],
  parallelogram: ['It has 2 pairs of parallel sides, like two sets of train tracks.', 'But it has no right angles, so it leans over.', 'And its sides aren’t all equal, so it isn’t a rhombus.', 'Which shape is that?'],
};
const TRIANGLE_STEPS = {
  equilateral: ['Equi means equal, and lateral means side.', 'Which triangle name means equal sides?'],
  isosceles: ['An equilateral triangle has all 3 sides equal.', 'A right triangle has a square corner.', 'The triangle with just 2 equal sides has its own special name.', 'Which one do you think it is?'],
  right: ['A right angle is a square corner, like the corner of a book.', 'One kind of triangle is named after that corner.', 'Which one do you think it is?'],
};
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
      explain: ['Let’s listen to the clues one at a time.', ...QUAD_STEPS[correct]],
      explainAnswer: `It’s a ${correct}!`,
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
    explain: ['Let’s think about what the triangle names mean.', ...TRIANGLE_STEPS[correct]],
    explainAnswer: `It’s ${correct === 'right' ? 'a' : 'an'} ${correct} triangle!`,
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
    explain: [
      'Parallel lines go the same way, like train tracks. They never meet.',
      'Perpendicular lines cross to make a square corner, like a plus sign.',
      'If they meet, but not at a square corner, the answer is neither.',
      'Look at the two lines. Which one do you think it is?',
    ],
    explainAnswer: {
      Parallel: 'They’re parallel. They never meet!',
      Perpendicular: 'They’re perpendicular. They make a square corner!',
      Neither: 'It’s neither. They meet, but not at a square corner.',
    }[correct],
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
  const tip = {
    square: 'Try folding it top to bottom, side to side, and corner to corner.',
    'regular pentagon': 'Try a fold from each corner to the middle of the side across from it.',
    'regular hexagon': 'Try folds from corner to corner, and from the middle of one side to the middle of the opposite side.',
    'equilateral triangle': 'Try a fold from each corner to the middle of the side across from it.',
    rectangle: 'Try folding it top to bottom, side to side, and corner to corner. Which folds really match?',
    parallelogram: 'Try every fold you can think of. Do the two halves ever match?',
  }[name] || `Picture the ${name}. Try a fold straight down the middle, then straight across.`;
  return {
    explain: [
      'A line of symmetry folds a shape into two halves that match exactly.',
      tip,
      `How many ways can you fold the ${name} so the halves match?`,
    ],
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
const GRID_NAMES = { '🍎': 'apple', '🐱': 'cat', '⭐': 'star', '🚗': 'car', '🎈': 'balloon', '🌸': 'flower', '🐟': 'fish', '🍩': 'donut', '⚽': 'ball', '🦋': 'butterfly', '🍓': 'strawberry', '🐢': 'turtle' };

// Rows and columns (Beast Academy 1D: position).
function positionProblem() {
  const rows = 3;
  const cols = 4;
  const items = shuffle(GRID_THINGS).slice(0, rows * cols);
  const r = randInt(1, rows);
  const c = randInt(1, cols);
  const correct = items[(r - 1) * cols + (c - 1)];
  return {
    explain: [
      'Rows go across, side by side. Columns go up and down.',
      `Start at the top row and count down to row ${r}.`,
      `Now stay in that row, and count from the left to column ${c}.`,
      'What’s in that box?',
    ],
    explainAnswer: `It’s the ${GRID_NAMES[correct]}!`,
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

// `how` says how the graph is drawn, for the spoken walkthrough:
// { per } for a picture graph, { step } for a bar graph.
function graphQuestion(rows, unitWord, how) {
  const kind = pick(['count', 'more', 'most', 'total']);
  const [a, b] = shuffle(rows).slice(0, 2);
  const bars = how.step !== undefined;
  const read = (row) => {
    if (bars) {
      const half = row.value % how.step !== 0 ? ' It may stop halfway between two lines.' : '';
      return `Find the bar for ${row.name}. Slide your finger from its top across to the numbers.${half}`;
    }
    return how.per > 1
      ? `Find the row for ${row.name}. Each picture stands for ${how.per}, so count by ${how.per}s.`
      : `Find the row for ${row.name}, and count the pictures.`;
  };
  const shows = (row) => `The ${bars ? 'bar' : 'row'} for ${row.name} shows ${row.value}.`;
  if (kind === 'most') {
    const most = Math.random() < 0.5;
    const best = rows.reduce((x, y) => ((most ? y.value > x.value : y.value < x.value) ? y : x));
    if (rows.filter((r) => r.value === best.value).length > 1) return graphQuestion(rows, unitWord, how);
    return {
      explain: bars
        ? ['Look at all the bars.', `The ${most ? 'tallest' : 'shortest'} bar shows the ${most ? 'most' : 'fewest'}.`, 'Which one do you think it is?']
        : ['Look at all the rows.', `The row with the ${most ? 'most' : 'fewest'} pictures has the ${most ? 'most' : 'fewest'}.`, 'Which one do you think it is?'],
      explainAnswer: `It’s ${best.name}, with ${best.value}.`,
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
    const clash = lo.value === hi.value - lo.value;
    return {
      explain: [
        read(hi),
        shows(hi),
        read(lo),
        clash ? `Now count up from that number to ${hi.value}. How many did you count?` : `${shows(lo)} Now count up from ${lo.value} to ${hi.value}. How many did you count?`,
      ],
      prompt: `How many more ${hi.emoji} than ${lo.emoji}?`,
      correct: hi.value - lo.value,
      answerType: 'numeric',
      answerLabel: `${hi.value} ${MINUS} ${lo.value} = ${hi.value - lo.value}`,
      speech: `How many more ${hi.name} than ${lo.name}?`,
    };
  }
  if (kind === 'total') {
    return {
      explain: [read(a), shows(a), read(b), shows(b), `So what is ${a.value} plus ${b.value}?`],
      prompt: `How many ${a.emoji} and ${b.emoji} altogether?`,
      correct: a.value + b.value,
      answerType: 'numeric',
      answerLabel: `${a.value} + ${b.value} = ${a.value + b.value}`,
      speech: `How many ${a.name} and ${b.name} altogether?`,
    };
  }
  return {
    explain: [`Let’s read the ${bars ? 'bar graph' : 'picture graph'} together.`, read(a), 'What number is that?'],
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
    ...graphQuestion(rows, 'are there', { per }),
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
    ...graphQuestion(rows, 'are there', { step }),
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
    explain: [
      'Let’s put them in order, one clue at a time.',
      `${people[0]} is ${quality} than ${people[1]}.`,
      `And ${people[1]} is ${quality} than ${people[2]}.`,
      `So ${people[1]} is in the middle.`,
      `Who is the ${askMost ? most : least}?`,
    ],
    explainAnswer: `So ${correct} is the ${askMost ? most : least}!`,
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
      explain: [
        `Pick just one shirt. It can go with each of the ${pants} pairs of shorts.`,
        `So every shirt makes ${pants} outfits.`,
        `There are ${shirts} shirts, so that’s ${shirts} groups of ${pants}.`,
        `What is ${shirts} times ${pants}?`,
      ],
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
      explain: [
        'Here’s a trick: take away, then add 1.',
        'Try a small one first. From 1 to 3 is 1, 2, 3. That’s 3 numbers.',
        'But 3 take away 1 is only 2. Taking away misses one end!',
        `So ${b} take away ${a} is ${b - a}, and we add 1 more for the end we missed.`,
        `So what is ${b - a} plus 1?`,
      ],
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
  const shakes = Array.from({ length: n - 1 }, (_, i) => n - 1 - i);
  return {
    explain: [
      `The first friend shakes hands with the ${n - 1} others.`,
      `The next friend already shook with the first, so only ${plural(n - 2, 'new handshake')}.`,
      'Each friend after that has one fewer new handshake.',
      `So what is ${shakes.join(' plus ')}?`,
    ],
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
  const countAll = `Count each colour: ${bag.map((b) => `${b.n} ${b.name}`).join(', ')}.`;
  if (kind === 'likely') {
    const most = Math.random() < 0.5;
    const best = bag.reduce((x, y) => ((most ? y.n > x.n : y.n < x.n) ? y : x));
    return {
      explain: [
        `The colour with the ${most ? 'most' : 'fewest'} marbles is the ${most ? 'most' : 'least'} likely to come out.`,
        countAll,
        'Which colour do you think it is?',
      ],
      explainAnswer: `${cap(best.name)}! There ${best.n === 1 ? 'is' : 'are'} ${plural(best.n, `${best.name} marble`)}.`,
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
      explain: [
        `First count all the marbles: ${counts.join(' plus ')} is ${total}.`,
        `Now count just the ${one.name} ones.`,
        `The chance is how many ${one.name} marbles out of all ${total}.`,
        'Which fraction shows that?',
      ],
      explainAnswer: `It’s ${one.n} out of ${total}, or ${fracWords(one.n, total)}.`,
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
  const fewest = bag.reduce((x, y) => (y.n < x.n ? y : x));
  const look = {
    certain: 'Look in the bag. Is every single thing in there a marble?',
    impossible: 'Look in the bag. Are there any black marbles at all?',
    likely: `Count the marbles that aren’t ${fewest.name}. Is that most of them?`,
    unlikely: `How many ${fewest.name} marbles are there? Is that a lot, or just a few?`,
  }[word];
  return {
    explain: [
      'Impossible means it can never happen. Certain means it will always happen.',
      'Likely means it will probably happen. Unlikely means it probably won’t.',
      look,
      'Which word fits best?',
    ],
    explainAnswer: `It’s ${word}.`,
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
