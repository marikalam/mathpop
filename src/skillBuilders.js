/**
 * "Skill Builders" — a second-grade math-concepts section covering place
 * value, comparing, addition/subtraction strategies, expressions,
 * measurement, odd/even numbers, big numbers, regrouping algorithms, and
 * multi-step word problems. Organized into four progressive units (A-D),
 * loosely following a typical rigorous 2nd-grade math scope & sequence.
 */

import { PREK_BUILDERS, PREK_CONCEPTS, PREK_SYMBOL } from './preK.jsx';
import { TOPIC_BUILDERS } from './topics.js';
import { storyName } from './storyNames.js';
import { TOPIC_ICONS, gradeSections } from './curriculum.js';
import { GRADES } from './grades.js';

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

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function nameA() {
  return storyName();
}

// Stories say "they" for everyone (storyNames.js); the verb ending comes
// with it ('they give', not 'they gives').
function pronoun() {
  return ['They', ''];
}

export const SKILL_UNITS = [
  {
    id: 'A',
    title: 'Place Value & Adding',
    concepts: [
      { id: 'placeValue', title: 'Place Value', sub: 'Ones, tens & hundreds' },
      { id: 'compare', title: 'Comparing Numbers', sub: 'Use <, > and =' },
      { id: 'addStrategy', title: 'Addition Strategies', sub: 'Make a ten & doubles' },
    ],
  },
  {
    id: 'B',
    title: 'Subtracting & Expressions',
    concepts: [
      { id: 'subStrategy', title: 'Subtraction Strategies', sub: 'Count back & break apart' },
      { id: 'expression', title: 'Expressions', sub: 'Parentheses & missing numbers' },
      { id: 'riddle', title: 'Number Riddles', sub: 'Use clues to find the number' },
    ],
  },
  {
    id: 'C',
    title: 'Measuring & Number Patterns',
    concepts: [
      { id: 'measurement', title: 'Measurement', sub: 'Inches, feet, cm & meters' },
      { id: 'shortcut', title: 'Smart Shortcuts', sub: 'Spot numbers that cancel' },
      { id: 'oddEven', title: 'Odd & Even', sub: 'Number properties' },
    ],
  },
  {
    id: 'D',
    title: 'Big Numbers & Algorithms',
    concepts: [
      { id: 'bigNumber', title: 'Big Numbers', sub: 'Place value into the millions' },
      { id: 'regroup', title: 'Stack & Solve', sub: 'Carrying & borrowing' },
      { id: 'multistep', title: 'Multi-Step Problems', sub: 'Two-step word problems' },
    ],
  },
];

// Singapore math topics the grades use outside the four units above
// (grades.js): number bonds, fractions, and factors & multiples.
export const SINGAPORE_CONCEPTS = [
  { id: 'numberBond', title: 'Number Bonds', sub: 'Part, part, whole' },
  { id: 'fraction', title: 'Fractions', sub: 'Parts of a whole' },
  { id: 'factors', title: 'Factors & Multiples', sub: 'What goes into what' },
];

const UNIT_COLOR = { A: '#4E8FF7', B: '#8B5CF6', C: '#F5A623', D: '#14B8A6', SG: '#E0577F', PK: '#F59E0B' };
const CONCEPT_SYMBOL = {
  placeValue: '🔢',
  compare: '⚖️',
  addStrategy: '➕',
  subStrategy: '➖',
  expression: '🧮',
  riddle: '🧠',
  measurement: '📏',
  shortcut: '⚡',
  oddEven: '🔀',
  bigNumber: '💯',
  regroup: '🧱',
  multistep: '🧩',
  numberBond: '🔗',
  fraction: '🍕',
  factors: '🧮',
};

export const SKILL_META = {};
for (const unit of [...SKILL_UNITS, { id: 'SG', concepts: SINGAPORE_CONCEPTS }, { id: 'PK', concepts: PREK_CONCEPTS }]) {
  for (const concept of unit.concepts) {
    SKILL_META[concept.id] = {
      label: concept.title,
      symbol: CONCEPT_SYMBOL[concept.id] || PREK_SYMBOL[concept.id],
      color: UNIT_COLOR[unit.id],
      unit: unit.id,
    };
  }
}
// The topics the grade sections add (topics.js), named and coloured as in
// the first section that has them.
for (const grade of GRADES) {
  for (const section of gradeSections(grade.id)) {
    for (const topic of section.topics) {
      if (TOPIC_BUILDERS[topic.id] && !SKILL_META[topic.id]) {
        SKILL_META[topic.id] = { label: topic.title, symbol: TOPIC_ICONS[topic.id] || section.icon, color: section.to, unit: section.id };
      }
    }
  }
}

function numericMCOptions(correct) {
  const scale = Math.max(1, Math.pow(10, Math.max(0, String(Math.abs(correct)).length - 2)));
  const pool = new Set();
  let attempts = 0;
  while (pool.size < 3 && attempts < 200) {
    attempts++;
    const delta = randInt(1, 9) * scale;
    const candidate = correct + (Math.random() < 0.5 ? -delta : delta);
    if (candidate >= 0 && candidate !== correct) pool.add(candidate);
  }
  let filler = correct + scale;
  while (pool.size < 3) {
    filler += scale;
    if (filler !== correct) pool.add(filler);
  }
  return shuffle([correct, ...pool]);
}

const PLACE_NAMES = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands', 'millions'];
const PLACE_ONE = ['one', 'ten', 'hundred', 'thousand', 'ten thousand', 'hundred thousand', 'million'];

// "Show me how" steps (explain.js) for adding two numbers under 100: the
// in-between steps a grown-up would say, ending with a question so the
// child finishes it. They never say the sum itself.
function addSteps(a, b) {
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  if (small < 10) {
    if (big % 10 === 0 || big % 10 + small < 10) {
      return big < 10
        ? [`Start at ${big} and count on ${small} more.`, 'What number do you land on?']
        : [`${big} has ${big % 10} ones. Add ${small} more ones, and the tens stay the same.`, `So what is ${big} plus ${small}?`];
    }
    const need = 10 - (big % 10);
    const nextTen = big + need;
    if (small === need) return [`${big} needs ${need} more to reach the next ten.`, `Adding ${small} lands right on it. Which ten is it?`];
    return [
      `${big} needs ${need} more to make ${nextTen}.`,
      `Break ${small} into ${need} and ${small - need}.`,
      `So what is ${nextTen} plus ${small - need}?`,
    ];
  }
  const ta = a - (a % 10);
  const tb = b - (b % 10);
  const ones = (a % 10) + (b % 10);
  const tens = (t) => `${t / 10} ten${t === 10 ? '' : 's'}`;
  if (!ones) return [`${a} is ${tens(ta)}, and ${b} is ${tens(tb)}.`, `${tens(ta)} and ${tens(tb)} make how many tens? What number is that?`];
  const steps = ['Split each number into tens and ones.', `Add the tens: ${ta} plus ${tb} is ${ta + tb}.`];
  if (a % 10 && b % 10) steps.push(`Add the ones: ${a % 10} plus ${b % 10} is ${ones}.`);
  steps.push(`So what is ${ta + tb} plus ${ones}?`);
  return steps;
}

// The same for taking away (a up to about 100), never saying a minus b.
function subSteps(a, b) {
  if (b >= 10) {
    const bt = b - (b % 10);
    const bo = b % 10;
    if (!bo) {
      return [
        `${a} has ${Math.floor(a / 10)} tens and ${a % 10} ones.`,
        `${b} is ${bt / 10} tens, so take away ${bt / 10} tens. The ones stay the same.`,
        `So what is ${a} minus ${b}?`,
      ];
    }
    if (a - b === bt) {
      return [`Take away the ones first: ${a} minus ${bo} is ${a - bo}.`, `Then take away ${bt / 10} tens.`, `So what is ${a - bo} take away ${bt / 10} tens?`];
    }
    return [`Take away the tens first: ${a} minus ${bt} is ${a - bt}.`, `Then take away the ${bo} ones.`, `So what is ${a - bt} minus ${bo}?`];
  }
  const ao = a % 10;
  if (a <= 10) return [`Start at ${a} and count back ${b}.`, 'Where do you land?'];
  if (ao >= b) return [`Look at the ones: ${ao} take away ${b} leaves ${ao - b} ones.`, `The tens stay the same. So what is ${a} minus ${b}?`];
  if (!ao) return [`Take the ${b} from one of the tens.`, `10 take away ${b} is ${10 - b}.`, `So what is ${a - 10} plus ${10 - b}?`];
  return [`Break ${b} into ${ao} and ${b - ao}.`, `${a} minus ${ao} is ${a - ao}.`, `So what is ${a - ao} minus ${b - ao}?`];
}

function placeValueProblem(level, big) {
  const digits = !big
    ? level === 'easy' ? 2 : level === 'medium' ? 3 : 4
    : level === 'easy' ? 4 : level === 'medium' ? 6 : 7;
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;

  let n, placeIndex, digit;
  for (let i = 0; i < 8; i++) {
    n = randInt(min, max);
    placeIndex = randInt(0, digits - 1);
    digit = Math.floor(n / 10 ** placeIndex) % 10;
    if (digit !== 0) break;
  }

  const value = digit * 10 ** placeIndex;
  const placeName = PLACE_NAMES[placeIndex];
  const nStr = n.toLocaleString();
  const unitWord = digit === 1 ? PLACE_ONE[placeIndex] : placeName;
  const explain = [
    `Let's look at ${n.toLocaleString('en-US')} together.`,
    placeIndex === 0
      ? 'The ones place is the digit all the way on the right.'
      : `Start on the right and name each place: ${PLACE_NAMES.slice(0, placeIndex + 1).join(', ')}.`,
    `The digit in the ${placeName} place is ${digit}.`,
    ...(placeIndex === 0
      ? ['In the ones place, a digit is worth just that many ones.']
      : [
          `That means ${digit} ${unitWord}.`,
          placeIndex === 1
            ? `To write it, put one zero after the ${digit}.`
            : `To write it, put ${placeIndex} zeros after the ${digit}, one for each place to its right.`,
        ]),
    `So what is the ${digit} worth?`,
  ];
  return {
    prompt: `In the number ${nStr}, what is the value of the digit in the ${placeName} place?`,
    correct: value,
    answerType: 'numeric',
    answerLabel: `${value}`,
    speech: `In the number ${n}, what is the value of the digit in the ${placeName} place?`,
    explain,
    explainAnswer: `So the ${digit} is worth ${value.toLocaleString('en-US')}.`,
  };
}

function compareProblem(level) {
  const range = level === 'easy' ? [1, 20] : level === 'medium' ? [10, 99] : [100, 999];
  const a = randInt(range[0], range[1]);
  const b = Math.random() < 0.15 ? a : randInt(range[0], range[1]);
  const correct = a < b ? '<' : a > b ? '>' : '=';
  const speechAnswer = correct === '<' ? 'less than' : correct === '>' ? 'greater than' : 'equal to';
  const sa = String(a);
  const sb = String(b);
  const explain = [`Let's compare ${a} and ${b}.`];
  if (a === b) {
    explain.push('Check each place, starting with the biggest one.', 'If every digit matches, the numbers are the same size.');
  } else if (sa.length !== sb.length) {
    const digits = (s) => `${s.length} digit${s.length === 1 ? '' : 's'}`;
    explain.push(`${a} has ${digits(sa)}, and ${b} has ${digits(sb)}.`, 'The number with more digits is the bigger number.');
  } else {
    let i = 0;
    while (sa[i] === sb[i]) i++;
    const place = sa.length - 1 - i;
    const say = (d) => `${d} ${d === '1' ? PLACE_ONE[place] : PLACE_NAMES[place]}`;
    explain.push(
      i === 0
        ? `Start with the biggest place, the ${PLACE_NAMES[place]}.`
        : `The ${PLACE_NAMES.slice(place + 1, sa.length).reverse().join(' and ')} are the same, so look at the ${PLACE_NAMES[place]}.`,
      `${a} has ${say(sa[i])}, and ${b} has ${say(sb[i])}.`,
      'Remember, the open side of the sign faces the bigger number.',
    );
  }
  explain.push(`So is ${a} less than, greater than, or equal to ${b}?`);
  return {
    promptKind: 'compare',
    compareLeft: a,
    compareRight: b,
    prompt: `Compare ${a} and ${b}`,
    correct,
    answerType: 'choice',
    choices: shuffle(['<', '>', '=']),
    answerLabel: `${a} ${correct} ${b}`,
    speech: `Is ${a} less than, greater than, or equal to ${b}?`,
    speechAnswer,
    questionTitle: 'Which sign is correct?',
    explain,
    explainAnswer: `So ${a} is ${speechAnswer} ${b}.`,
  };
}

function addStrategyProblem(level) {
  const subKind = pick(['double', 'makeTen']);
  let a, b, hint;

  if (subKind === 'double') {
    const base = level === 'easy' ? randInt(1, 9) : level === 'medium' ? randInt(6, 20) : randInt(10, 45);
    a = base;
    b = base;
    hint = `Doubles fact! ${a} + ${a}.`;
  } else {
    if (level === 'easy') {
      for (let i = 0; i < 10; i++) {
        a = randInt(6, 9);
        b = randInt(2, 9);
        if (a + b > 10 && a + b <= 18) break;
      }
      hint = `Make a ten: ${a} + ${10 - a} = 10, then add what's left of ${b}.`;
    } else if (level === 'medium') {
      for (let i = 0; i < 10; i++) {
        a = randInt(20, 89);
        b = randInt(2, 9);
        if ((a % 10) + b >= 10) break;
      }
      hint = `Round ${a} up to the next ten, then adjust.`;
    } else {
      for (let i = 0; i < 10; i++) {
        a = randInt(100, 889);
        b = randInt(2, 9);
        if ((a % 10) + b >= 10) break;
      }
      hint = `Round ${a} up to the next ten, then adjust.`;
    }
  }

  const correct = a + b;
  let explain;
  if (subKind === 'double') {
    const t = a - (a % 10);
    const o = a % 10;
    if (a <= 5) {
      explain = [`This is a doubles fact: ${a} plus ${a}.`, `Hold up ${a} finger${a === 1 ? '' : 's'} on each hand.`, 'How many fingers are up in all?'];
    } else if (a < 10) {
      explain = [
        `This is a doubles fact: two groups of ${a}.`,
        `Here's a trick. ${a} is 5 and ${a - 5}.`,
        `Double 5 is 10, and double ${a - 5} is ${2 * (a - 5)}.`,
        `So what is 10 plus ${2 * (a - 5)}?`,
      ];
    } else if (!o) {
      explain = [`Doubling ${a} means ${a} plus ${a}.`, `${a} is ${t / 10} tens.`, `Double ${t / 10} tens is ${t / 5} tens.`, `So what number is ${t / 5} tens?`];
    } else {
      explain = [
        `Doubling ${a} means two groups of ${a}.`,
        `Split ${a} into ${t} and ${o}.`,
        `Double ${t} is ${2 * t}, and double ${o} is ${2 * o}.`,
        `So what is ${2 * t} plus ${2 * o}?`,
      ];
    }
  } else {
    explain = [
      a < 10 ? "Let's make a ten. It makes adding easier!" : `Here's a trick: make the next ten after ${a}.`,
      ...addSteps(a, b),
    ];
  }
  return {
    prompt: `${a} + ${b}`,
    correct,
    answerType: 'numeric',
    answerLabel: `${a} + ${b} = ${correct}`,
    speech: `${a} plus ${b}`,
    hint,
    explain,
  };
}

function subStrategyProblem(level) {
  let a, b, hint;
  if (level === 'easy') {
    a = randInt(11, 20);
    b = randInt(1, 3);
    hint = `Count back ${b} from ${a}.`;
  } else if (level === 'medium') {
    a = randInt(20, 99);
    b = randInt(5, Math.min(40, a));
    hint = `Break apart ${b} to subtract in friendly steps.`;
  } else {
    const nines = [9, 19, 29, 39, 49, 59, 69, 79, 89];
    b = pick(nines);
    a = randInt(b + 10, b + 99);
    hint = `Try subtracting ${b + 1}, then add 1 back.`;
  }
  const correct = a - b;
  let explain;
  if (level === 'easy') {
    const back = Array.from({ length: b - 1 }, (_, i) => a - 1 - i);
    explain = [
      `We only take away ${b}, so let's count back.`,
      `Start at ${a} and take ${b} step${b === 1 ? '' : 's'} back.`,
      ...(back.length ? [`Count back with me: ${back.join(', ')}.`, 'Now one more step back.'] : [`Just go back one, to the number before ${a}.`]),
      'Where do you land?',
    ];
  } else if (level === 'medium') {
    explain = [`Let's break ${b} into friendly pieces.`, ...subSteps(a, b)];
  } else if (a - b === b + 1 && b > 9) {
    // The usual trick would say the answer (it's b + 1), so take away
    // the tens, then the 9.
    explain = [
      `Let's take away ${b} in two hops: ${b - 9}, then 9.`,
      `${a} minus ${b - 9} is ${a - b + 9}.`,
      'Taking away 9 is like taking away 10, then adding 1 back.',
      `So what is ${a - b + 9} minus 9?`,
    ];
  } else {
    explain = [
      `${b} is just 1 less than ${b + 1}, and tens are easy to take away.`,
      `So take away ${b + 1}: ${a} minus ${b + 1} is ${a - b - 1}.`,
      'Oops, we took away 1 too many. So add 1 back.',
      `So what is ${a - b - 1} plus 1?`,
    ];
  }
  return {
    explain,
    prompt: `${a} − ${b}`,
    correct,
    answerType: 'numeric',
    answerLabel: `${a} − ${b} = ${correct}`,
    speech: `${a} minus ${b}`,
    hint,
  };
}

function expressionProblem(level) {
  const range = level === 'easy' ? [1, 9] : level === 'medium' ? [1, 20] : [1, 50];
  const [lo, hi] = range;
  const isEval = Math.random() < 0.5;

  if (isEval) {
    const form = pick(['abc1', 'abc2']);
    let a, b, c, prompt, correct, explain;
    if (form === 'abc1') {
      a = randInt(lo, hi);
      b = randInt(lo, hi);
      c = randInt(lo, Math.min(hi, a + b));
      correct = a + b - c;
      prompt = `(${a} + ${b}) − ${c}`;
      explain = [
        'The parentheses are like a hug. Do the hugged part first.',
        `Inside, ${a} plus ${b} is ${a + b}.`,
        `Now take away the ${c}.`,
        `So what is ${a + b} minus ${c}?`,
      ];
    } else {
      a = randInt(lo, hi);
      b = randInt(lo, hi);
      c = randInt(lo, b);
      correct = a + (b - c);
      prompt = `${a} + (${b} − ${c})`;
      explain = [
        'Parentheses mean do that part first.',
        `Inside, ${b} minus ${c} is ${b - c}.`,
        `Now add that to the ${a}.`,
        `So what is ${a} plus ${b - c}?`,
      ];
    }
    return {
      explain,
      prompt,
      correct,
      answerType: 'numeric',
      answerLabel: `${prompt} = ${correct}`,
      speech: prompt.replace(/[()]/g, '').replace('+', 'plus').replace('−', 'minus'),
    };
  }

  const form = pick(['sumMissing', 'diffMissingLeft', 'diffMissingRight']);
  let a, b, sum, diff, prompt, correct, explain;
  if (form === 'sumMissing') {
    a = randInt(lo, hi);
    b = randInt(lo, hi);
    sum = a + b;
    correct = b;
    prompt = `${a} + ☐ = ${sum}`;
    explain = [
      `Think of a number bond. The whole is ${sum}.`,
      `One part is ${a}. The box is the other part.`,
      `To find a missing part, take the part we know from the whole.`,
      `So what is ${sum} minus ${a}?`,
    ];
  } else if (form === 'diffMissingLeft') {
    b = randInt(lo, hi);
    diff = randInt(lo, hi);
    correct = diff + b;
    prompt = `☐ − ${b} = ${diff}`;
    explain = [
      'The box is the number we started with.',
      `We took away ${b}, and ${diff} were left.`,
      `To get back to the start, put the ${b} back.`,
      `So what is ${diff} plus ${b}?`,
    ];
  } else {
    a = randInt(lo, hi);
    sum = randInt(a, a + hi);
    correct = sum - a;
    prompt = `${sum} − ☐ = ${a}`;
    explain = [
      `We start with ${sum} and take some away.`,
      `Then ${a} are left. The box is how many we took.`,
      `Count up from ${a} to ${sum} to find the jump.`,
      `So what is ${sum} minus ${a}?`,
    ];
  }
  return {
    explain,
    prompt,
    correct,
    answerType: 'numeric',
    answerLabel: prompt.replace('☐', String(correct)),
    speech: prompt.replace('☐', 'blank').replace('+', 'plus').replace('−', 'minus'),
  };
}

function riddleProblem(level) {
  const range = level === 'easy' ? [1, 20] : level === 'medium' ? [10, 60] : [10, 99];
  const [lo, hi] = range;

  for (let attempt = 0; attempt < 25; attempt++) {
    const n = randInt(lo, hi);
    const clues = [];
    // `say`: how "Show me how" talks the child through each clue.
    clues.push({
      text: `I am ${n % 2 === 0 ? 'an even' : 'an odd'} number.`,
      say: n % 2 === 0 ? 'Clue one: it is even, so its last digit is 0, 2, 4, 6 or 8.' : 'Clue one: it is odd, so its last digit is 1, 3, 5, 7 or 9.',
      test: (x) => x % 2 === n % 2,
    });
    const margin = level === 'easy' ? randInt(3, 6) : randInt(4, 10);
    const g = n - margin - randInt(0, 3);
    clues.push({ text: `I am greater than ${g}.`, say: `It's greater than ${g}, so it comes after ${g} when we count.`, test: (x) => x > g });
    const l = n + margin + randInt(0, 3);
    clues.push({ text: `I am less than ${l}.`, say: `It's less than ${l}, so it's somewhere between ${g} and ${l}.`, test: (x) => x < l });
    if (level !== 'easy' && n >= 10) {
      const digitSum = Math.floor(n / 10) + (n % 10);
      clues.push({
        text: `The sum of my digits is ${digitSum}.`,
        say: `Its two digits add up to ${digitSum}. Try each number that's left, and add its digits.`,
        test: (x) => x >= 10 && x < 100 && Math.floor(x / 10) + (x % 10) === digitSum,
      });
    }

    const used = [];
    for (const clue of clues) {
      used.push(clue);
      const matches = [];
      for (let x = lo; x <= hi; x++) {
        if (used.every((c) => c.test(x))) matches.push(x);
      }
      if (matches.length === 1 && matches[0] === n) {
        const text = `${used.map((c) => c.text).join(' ')} What number am I?`;
        return {
          prompt: text,
          correct: n,
          answerType: 'numeric',
          answerLabel: `${n}`,
          speech: text,
          explain: ["Let's be number detectives and use one clue at a time.", ...used.map((c) => c.say), 'Which number fits every clue?'],
        };
      }
    }
  }

  const n = randInt(lo, hi);
  const t = Math.floor(n / 10);
  const o = n % 10;
  const text =
    n >= 10
      ? `I am ${n % 2 === 0 ? 'an even' : 'an odd'} number. My tens digit is ${t} and my ones digit is ${o}. What number am I?`
      : `I am ${n % 2 === 0 ? 'an even' : 'an odd'} number less than 10 and greater than ${Math.max(0, n - 3)}. What number am I?`;
  const explain =
    n >= 10
      ? [
          "Let's be number detectives.",
          `The tens digit is ${t}, so it has ${t} ten${t === 1 ? '' : 's'}.`,
          `The ones digit is ${o}, so it has ${o} one${o === 1 ? '' : 's'}.`,
          `What number has ${t} ten${t === 1 ? '' : 's'} and ${o} one${o === 1 ? '' : 's'}?`,
        ]
      : [
          "Let's be number detectives.",
          `It's less than 10 and greater than ${Math.max(0, n - 3)}, so count up from ${Math.max(0, n - 3)} to 10.`,
          `Now keep only the ${n % 2 === 0 ? 'even' : 'odd'} ones.`,
          'Which number fits every clue?',
        ];
  return { prompt: text, correct: n, answerType: 'numeric', answerLabel: `${n}`, speech: text, explain };
}

// How big each unit is, said in "Show me how", smallest first.
const UNIT_SIZES = {
  millimeters: 'A millimeter is super tiny, about as thick as a coin.',
  centimeters: 'A centimeter is small, about as wide as your fingernail.',
  inches: 'An inch is small, about as long as a paper clip.',
  feet: 'A foot is about as long as a ruler.',
  yards: 'A yard is about one big grown-up step.',
  meters: 'A meter is about one big grown-up step.',
  miles: 'A mile is a long way, like a long walk.',
  kilometers: 'A kilometer is a long way, like a long walk.',
};
const UNIT_ORDER = Object.keys(UNIT_SIZES);

const UNIT_OBJECTS = [
  { obj: 'a pencil', good: 'inches', bad: ['feet', 'yards', 'miles'] },
  { obj: 'the width of your thumb', good: 'inches', bad: ['feet', 'yards', 'miles'] },
  { obj: 'a football field', good: 'yards', bad: ['inches', 'feet', 'miles'] },
  { obj: 'a school bus', good: 'feet', bad: ['inches', 'yards', 'miles'] },
  { obj: 'the height of a door', good: 'feet', bad: ['inches', 'yards', 'miles'] },
  { obj: 'the distance between two cities', good: 'miles', bad: ['inches', 'feet', 'yards'] },
];
const UNIT_OBJECTS_METRIC = [
  { obj: 'a crayon', good: 'centimeters', bad: ['meters', 'kilometers', 'millimeters'] },
  { obj: 'a soccer field', good: 'meters', bad: ['centimeters', 'kilometers', 'millimeters'] },
  { obj: 'the distance between two cities', good: 'kilometers', bad: ['centimeters', 'meters', 'millimeters'] },
  { obj: 'an ant', good: 'millimeters', bad: ['centimeters', 'meters', 'kilometers'] },
];

function measurementProblem(level) {
  const useUnitQuestion = Math.random() < (level === 'easy' ? 0.6 : 0.4);

  if (useUnitQuestion) {
    const pool = level === 'easy' ? UNIT_OBJECTS : [...UNIT_OBJECTS, ...UNIT_OBJECTS_METRIC];
    const item = pick(pool);
    return {
      prompt: `Which unit would you use to measure ${item.obj}?`,
      correct: item.good,
      answerType: 'choice',
      choices: shuffle([item.good, ...item.bad]),
      answerLabel: item.good,
      speech: `Which unit would you use to measure ${item.obj}?`,
      speechAnswer: item.good,
      questionTitle: 'Pick the best unit',
      explain: [
        `First, picture ${item.obj}. Is it small, or really big?`,
        ...[item.good, ...item.bad].sort((x, y) => UNIT_ORDER.indexOf(x) - UNIT_ORDER.indexOf(y)).map((u) => UNIT_SIZES[u]),
        `Which unit fits ${item.obj} best?`,
      ],
      explainAnswer: `We'd measure ${item.obj} in ${item.good}.`,
    };
  }

  const unit = level === 'hard' ? pick(['centimeters', 'inches', 'feet']) : pick(['inches', 'feet']);
  const range = level === 'easy' ? [2, 12] : level === 'medium' ? [5, 40] : [10, 80];
  const op = pick(['add', 'subtract']);
  let a, b, prompt, correct, explain, explainAnswer;
  const name = nameA();
  if (op === 'add') {
    a = randInt(range[0], range[1]);
    b = randInt(range[0], range[1]);
    correct = a + b;
    prompt = `One piece of ribbon is ${a} ${unit} long. Another piece is ${b} ${unit} long. If ${name} tapes them together end to end, how long are they in all?`;
    const steps = addSteps(a, b);
    explain = [`Putting the ribbons end to end makes one long ribbon, so we add ${a} and ${b}.`, ...steps];
    explainAnswer = `So the ribbon is ${correct} ${unit} long!`;
  } else {
    a = randInt(range[0] + 5, range[1] + 5);
    b = randInt(range[0], Math.min(a - 1, range[1]));
    correct = a - b;
    prompt = `A rope is ${a} ${unit} long. ${name} cuts off ${b} ${unit}. How long is the rope now?`;
    explain = [`Cutting some off makes the rope shorter, so we take away ${b} from ${a}.`, ...subSteps(a, b)];
    explainAnswer = `So the rope is ${correct} ${unit} long now.`;
  }
  return {
    prompt,
    correct,
    answerType: 'numeric',
    answerLabel: `${correct} ${unit}`,
    speech: prompt,
    explain,
    explainAnswer,
  };
}

function shortcutProblem(level) {
  const range = level === 'easy' ? [1, 20] : level === 'medium' ? [10, 60] : [10, 99];
  const hint = 'Look for numbers that get added and then subtracted right back out — they cancel!';

  if (level === 'hard' && Math.random() < 0.5) {
    const a = randInt(range[0], range[1]);
    const b = randInt(range[0], range[1]);
    const c = randInt(range[0], range[1]);
    const correct = a + c;
    const prompt = `${a} + ${b} + ${c} − ${b}`;
    return {
      explain: [
        `Look closely! We add ${b}, and later we take ${b} away.`,
        'Those cancel out, like they were never there.',
        `So we only need ${a} plus ${c}.`,
        ...addSteps(a, c),
      ],
      prompt,
      correct,
      answerType: 'numeric',
      answerLabel: `${prompt} = ${correct}`,
      speech: `${a} plus ${b} plus ${c} minus ${b}`,
      hint,
    };
  }

  const a = randInt(range[0], range[1]);
  const b = randInt(range[0], range[1]);
  const form = pick(['addThenSub', 'subThenAdd']);
  const prompt = form === 'addThenSub' ? `${a} + ${b} − ${b}` : `${a} − ${b} + ${b}`;
  const speech = form === 'addThenSub' ? `${a} plus ${b} minus ${b}` : `${a} minus ${b} plus ${b}`;
  return {
    explain:
      form === 'addThenSub'
        ? [
            `Here's a shortcut. We add ${b}, then take the same ${b} away.`,
            `It's like getting ${b} stickers and giving all ${b} right back.`,
            'Adding and taking away the same number cancel out.',
            `So what number do we end up with?`,
          ]
        : [
            `Here's a shortcut. We take ${b} away, then put the same ${b} back.`,
            `It's like lending ${b} crayons and getting all ${b} back.`,
            'Taking away and adding the same number cancel out.',
            `So what number do we end up with?`,
          ],
    explainAnswer: `So we're right back at ${a}!`,
    prompt,
    correct: a,
    answerType: 'numeric',
    answerLabel: `${prompt} = ${a}`,
    speech,
    hint,
  };
}

function oddEvenProblem(level) {
  const range = level === 'easy' ? [1, 20] : level === 'medium' ? [10, 99] : [100, 999];
  const target = pick(['even', 'odd']);
  const nums = new Set();
  const targetNum = (() => {
    let n;
    do {
      n = randInt(range[0], range[1]);
    } while ((n % 2 === 0 ? 'even' : 'odd') !== target);
    return n;
  })();
  nums.add(targetNum);
  while (nums.size < 4) {
    const n = randInt(range[0], range[1]);
    if ((n % 2 === 0 ? 'even' : 'odd') !== target && !nums.has(n)) nums.add(n);
  }
  const wrong = [...nums].find((x) => x !== targetNum);
  const other = target === 'even' ? 'odd' : 'even';
  return {
    explain: [
      target === 'even' ? 'Even numbers can make pairs with nobody left out.' : 'Odd numbers always have one left over when we make pairs.',
      'For big numbers, just look at the last digit, the ones.',
      target === 'even' ? 'Even numbers end in 0, 2, 4, 6 or 8.' : 'Odd numbers end in 1, 3, 5, 7 or 9.',
      wrong < 10 ? `For example, ${wrong} is ${other}, so it's not the one.` : `For example, ${wrong} ends in ${wrong % 10}, so it's ${other}.`,
      `Which number is ${target}?`,
    ],
    explainAnswer: targetNum < 10 ? `${targetNum} is ${target}!` : `${targetNum} ends in ${targetNum % 10}, so it's ${target}!`,
    prompt: `Which of these numbers is ${target}?`,
    correct: targetNum,
    answerType: 'choice',
    choices: shuffle([...nums]),
    answerLabel: `${targetNum} is ${target}.`,
    speech: `Which of these numbers is ${target}?`,
    speechAnswer: `${targetNum}`,
    questionTitle: `Which number is ${target}?`,
  };
}

function regroupProblem(level) {
  const range = level === 'easy' ? [10, 99] : level === 'medium' ? [100, 999] : [1000, 9999];
  const op = pick(['add', 'subtract']);
  let a, b, correct;

  if (op === 'add') {
    for (let i = 0; i < 25; i++) {
      a = randInt(range[0], range[1]);
      b = randInt(range[0], range[1]);
      if ((a % 10) + (b % 10) >= 10) break;
    }
    correct = a + b;
  } else {
    for (let i = 0; i < 25; i++) {
      a = randInt(range[0] + 1, range[1]);
      b = randInt(range[0], a - 1);
      if (a % 10 < b % 10) break;
    }
    correct = a - b;
  }

  const symbol = op === 'add' ? '+' : '−';
  const digitAt = (x, place) => Math.floor(x / 10 ** place) % 10;
  const [ao, bo, at, bt] = [digitAt(a, 0), digitAt(b, 0), digitAt(a, 1), digitAt(b, 1)];
  const longer = String(a).length > 2 ? 'Keep going left, one column at a time, the same way.' : null;
  let explain;
  if (op === 'add') {
    const carry = ao + bo >= 10;
    explain = [
      "Let's add one column at a time, starting with the ones on the right.",
      `Ones: ${ao} plus ${bo} is ${ao + bo}.`,
      carry ? `That's 10 or more! Write the ${ao + bo - 10}, and carry 1 ten over to the tens.` : `That's less than 10, so just write the ${ao + bo}.`,
      `Now the tens: ${at} plus ${bt}${carry ? ', plus the 1 we carried' : ''}.`,
      ...(longer ? [longer] : []),
      'What number do you get?',
    ];
  } else {
    const borrow = ao < bo;
    explain = [
      "Let's subtract one column at a time, starting with the ones on the right.",
      borrow ? `Ones: ${ao} take away ${bo}? We don't have enough ones!` : `Ones: ${ao} take away ${bo} is ${ao - bo}.`,
      ...(borrow
        ? [
            at > 0
              ? `So borrow 1 ten. The ${at} in the tens place becomes ${at - 1}, and we have ${ao + 10} ones.`
              : 'There are no tens, so borrow from the next place first. Then we have ' + (ao + 10) + ' ones.',
            `Now ${ao + 10} take away ${bo} is ${ao + 10 - bo}.`,
          ]
        : []),
      longer ? `Then do the tens, and keep going left the same way.` : `Then the tens: take away ${bt} tens.`,
      'What number do you get?',
    ];
  }
  return {
    explain,
    promptKind: 'stack',
    stackTop: a,
    stackBottom: b,
    stackSymbol: symbol,
    prompt: `${a} ${symbol} ${b}`,
    correct,
    answerType: 'numeric',
    answerLabel: `${a} ${symbol} ${b} = ${correct}`,
    speech: `${a} ${op === 'add' ? 'plus' : 'minus'} ${b}`,
    hint:
      op === 'add'
        ? 'Regroup: if the ones add up to 10 or more, carry a ten to the tens place!'
        : 'Regroup: if you need more ones, borrow a ten from the tens place!',
  };
}

const MULTISTEP_ITEMS = ['stickers', 'marbles', 'books', 'stamps', 'crayons', 'shells'];

function multistepProblem(level) {
  const range = level === 'easy' ? [1, 20] : level === 'medium' ? [10, 60] : [20, 150];
  const pattern = pick(['add-add', 'add-sub', 'sub-add', 'sub-sub']);
  const name = nameA();
  const [pron, s] = pronoun();
  const item = pick(MULTISTEP_ITEMS);

  let a = randInt(range[0], range[1]);
  let b, c, correct, prompt;

  if (pattern === 'add-add') {
    b = randInt(range[0], range[1]);
    c = randInt(range[0], range[1]);
    correct = a + b + c;
    prompt = `${name} has ${a} ${item}. ${pron} find${s} ${b} more, then find${s} ${c} more. How many ${item} does ${name} have now?`;
  } else if (pattern === 'add-sub') {
    b = randInt(range[0], range[1]);
    const intermediate = a + b;
    c = randInt(1, intermediate);
    correct = intermediate - c;
    prompt = `${name} has ${a} ${item}. ${pron} buy${s} ${b} more, then give${s} away ${c}. How many ${item} does ${name} have now?`;
  } else if (pattern === 'sub-add') {
    b = randInt(1, a);
    const intermediate = a - b;
    c = randInt(range[0], range[1]);
    correct = intermediate + c;
    prompt = `${name} has ${a} ${item}. ${pron} give${s} away ${b}, then find${s} ${c} more. How many ${item} does ${name} have now?`;
  } else {
    if (a < 3) a = 3;
    b = randInt(1, a - 2);
    const intermediate = a - b;
    c = randInt(1, intermediate - 1);
    correct = intermediate - c;
    prompt = `${name} has ${a} ${item}. ${pron} give${s} away ${b}, then give${s} away ${c} more. How many ${item} does ${name} have left?`;
  }

  const mid = pattern.startsWith('add') ? a + b : a - b;
  const first = pattern.startsWith('add')
    ? `First ${name} gets ${b} more, so we add: ${a} plus ${b} is ${mid}.`
    : `First ${name} gives away ${b}, so we take away: ${a} minus ${b} is ${mid}.`;
  const second = pattern.endsWith('add')
    ? [`Then ${name} finds ${c} more. Finding more means we add.`, `So what is ${mid} plus ${c}?`]
    : [`Then ${name} gives away ${c}. Giving away means we take away.`, `So what is ${mid} minus ${c}?`];
  return {
    prompt,
    correct,
    answerType: 'numeric',
    answerLabel: `${correct}`,
    speech: prompt,
    explain: [`This story has two steps. Let's do them one at a time.`, `${name} starts with ${a} ${item}.`, first, ...second],
  };
}

// Number bonds (Singapore math's part-part-whole): two parts and the
// whole they make, one of them missing. Kindergarten bonds go up to 10,
// Primary 1 up to 20.
function numberBondProblem(level, grade) {
  const whole = grade === 'k' ? randInt(3, 10) : randInt(8, 20);
  const left = randInt(1, whole - 1);
  const right = whole - left;
  const missing = Math.random() < 0.3 ? 'whole' : Math.random() < 0.5 ? 'left' : 'right';
  const show = (part) => (missing === part ? '?' : part === 'whole' ? whole : part === 'left' ? left : right);
  const correct = missing === 'whole' ? whole : missing === 'left' ? left : right;
  const known = missing === 'left' ? right : left;
  return {
    promptKind: 'bond',
    bondWhole: show('whole'),
    bondParts: [show('left'), show('right')],
    prompt:
      missing === 'whole'
        ? `${left} and ${right} make ?`
        : `${known} and ? make ${whole}`,
    correct,
    answerType: 'numeric',
    answerLabel: `${left} and ${right} make ${whole}`,
    speech:
      missing === 'whole'
        ? `${left} and ${right} make what number?`
        : `${known} and what number make ${whole}?`,
    questionTitle: 'Complete the number bond',
    explain:
      missing === 'whole'
        ? [
            `Look at the two bottom circles. Those are the parts, ${left} and ${right}.`,
            'The top circle is the whole. It is both parts put together.',
            ...addSteps(left, right),
          ]
        : [
            `Look at the top number. That's the whole, ${whole}.`,
            `One part is ${known}. We need the other part.`,
            ...(known < 10 && whole > 10
              ? [`From ${known} up to 10 is ${10 - known}.`, `From 10 up to ${whole} is ${whole - 10}.`, `So what is ${10 - known} plus ${whole - 10}?`]
              : [`Say ${known}, then count up to ${whole}. Put up a finger for each number.`, 'How many fingers are up?']),
          ],
  };
}

const FRACTION_WORDS = {
  2: ['half', 'halves'],
  3: ['third', 'thirds'],
  4: ['quarter', 'quarters'],
  5: ['fifth', 'fifths'],
  6: ['sixth', 'sixths'],
  7: ['seventh', 'sevenths'],
  8: ['eighth', 'eighths'],
  9: ['ninth', 'ninths'],
  10: ['tenth', 'tenths'],
  12: ['twelfth', 'twelfths'],
  15: ['fifteenth', 'fifteenths'],
  16: ['sixteenth', 'sixteenths'],
  20: ['twentieth', 'twentieths'],
};
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];

function fractionWords(a, b) {
  const [one, many] = FRACTION_WORDS[b] || [`${b}th`, `${b}ths`];
  return `${NUMBER_WORDS[a] || a} ${a === 1 ? one : many}`;
}

// Fractions, Singapore style: Primary 2 halves, thirds and quarters of a
// number; Primary 3 equivalent fractions and fractions of a set; Primary 4
// fractions of a set and mixed numbers.
function fractionProblem(level, grade) {
  const ofSet = (dens, maxGroups, numerator) => {
    const b = pick(dens);
    const a = numerator ? randInt(1, b - 1) : 1;
    const n = b * randInt(2, maxGroups);
    const part = n / b;
    return {
      explain:
        a === 1
          ? [
              `${fractionWords(1, b).replace(/^./, (c) => c.toUpperCase())} means 1 of ${b} equal parts.`,
              `Let's share ${n} into ${b} equal groups.`,
              `Think: ${b} times what number makes ${n}?`,
              `So how many are in 1 group?`,
            ]
          : [
              `Draw a bar for ${n}, and cut it into ${b} equal parts.`,
              `${b} times ${part} is ${n}, so each part is ${part}.`,
              `We want ${a} of those parts.`,
              `So what is ${a} times ${part}?`,
            ],
      explainAnswer: `So ${fractionWords(a, b)} of ${n} is ${(a * n) / b}.`,
      prompt: `What is ${a}/${b} of ${n}?`,
      correct: (a * n) / b,
      answerLabel: `${a}/${b} of ${n} = ${(a * n) / b}`,
      speech: `What is ${fractionWords(a, b)} of ${n}?`,
    };
  };
  let problem;
  if (grade === '3') {
    if (Math.random() < 0.5) {
      const b = pick([2, 3, 4, 5]);
      const a = randInt(1, b - 1);
      const m = randInt(2, 4);
      const big = FRACTION_WORDS[b * m]?.[1] || `${b * m}ths`;
      problem = {
        explain: [
          `We want ${big} instead of ${FRACTION_WORDS[b][1]}.`,
          `${b} times ${m} is ${b * m}, so cut each ${FRACTION_WORDS[b][0]} into ${m} smaller pieces.`,
          `Each of our ${a} piece${a === 1 ? '' : 's'} turns into ${m} small pieces.`,
          `So what is ${a} times ${m}?`,
        ],
        explainAnswer: `So ${fractionWords(a, b)} is the same as ${fractionWords(a * m, b * m)}.`,
        prompt: `${a}/${b} = ?/${b * m}`,
        correct: a * m,
        answerLabel: `${a}/${b} = ${a * m}/${b * m}`,
        speech: `${fractionWords(a, b)} is how many ${FRACTION_WORDS[b * m]?.[1] || `${b * m}ths`}?`,
        questionTitle: 'Make an equivalent fraction',
      };
    } else problem = ofSet([2, 3, 4, 5], 6, true);
  } else if (grade === '4') {
    const kind = pick(['set', 'toImproper', 'toMixed']);
    if (kind === 'set') problem = ofSet([3, 4, 5, 6, 8], 10, true);
    else {
      const b = pick([2, 3, 4, 5, 6, 8]);
      const a = randInt(1, b - 1);
      const w = randInt(1, 4);
      const improper = w * b + a;
      const many = FRACTION_WORDS[b][1];
      const wholes = `${w} whole${w === 1 ? '' : 's'}`;
      problem =
        kind === 'toImproper'
          ? {
              explain: [
                `Each whole is ${b} ${many}.`,
                `${wholes} is ${w} times ${b}, which is ${w * b} ${many}.`,
                `Then add the ${fractionWords(a, b)} more.`,
                `So what is ${w * b} plus ${a}?`,
              ],
              explainAnswer: `So ${w} and ${fractionWords(a, b)} is ${improper} ${many}.`,
              prompt: `${w} ${a}/${b} = ?/${b}`,
              correct: improper,
              answerLabel: `${w} ${a}/${b} = ${improper}/${b}`,
              speech: `${w} and ${fractionWords(a, b)} is how many ${FRACTION_WORDS[b][1]}?`,
              questionTitle: 'Mixed number to fraction',
            }
          : {
              explain: [
                `Each whole is ${b} ${many}.`,
                `${wholes} use up ${w} times ${b}, which is ${w * b} ${many}.`,
                `We started with ${improper} ${many}.`,
                `So how many ${many} are left over after ${w * b}?`,
              ],
              explainAnswer: `So ${improper} ${many} is ${w} and ${fractionWords(a, b)}.`,
              prompt: `${improper}/${b} = ${w} ?/${b}`,
              correct: a,
              answerLabel: `${improper}/${b} = ${w} ${a}/${b}`,
              speech: `${improper} ${FRACTION_WORDS[b][1]} is ${w} and how many ${FRACTION_WORDS[b][1]}?`,
              questionTitle: 'Fraction to mixed number',
            };
    }
  } else if (Math.random() < 0.25) {
    const b = pick([2, 3, 4]);
    const many = FRACTION_WORDS[b][1];
    problem = {
      explain: [
        `Picture a sandwich cut into ${many}.`,
        `${many.charAt(0).toUpperCase() + many.slice(1)} are equal pieces, all the same size.`,
        'Put every piece back together, and you get 1 whole sandwich.',
        `So how many ${many} did we cut it into?`,
      ],
      explainAnswer: `${NUMBER_WORDS[b].charAt(0).toUpperCase() + NUMBER_WORDS[b].slice(1)} ${many} make 1 whole!`,
      prompt: `How many ${FRACTION_WORDS[b][1]} make 1 whole?`,
      correct: b,
      answerLabel: `${b} ${FRACTION_WORDS[b][1]} make 1 whole`,
      speech: `How many ${FRACTION_WORDS[b][1]} make one whole?`,
    };
  } else problem = ofSet([2, 3, 4], 5, false);
  return { questionTitle: 'Fractions', answerType: 'numeric', ...problem };
}

// Factors and multiples (Primary 4): which of four numbers is a factor
// of, or a multiple of, the given number.
function factorsProblem() {
  if (Math.random() < 0.5) {
    const n = pick([12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 54, 56, 60, 64, 72, 84, 90, 96]);
    const factors = [];
    const others = [];
    for (let k = 2; k <= 12; k++) {
      if (n % k !== 0) others.push(k);
      else if (k < n) factors.push(k);
    }
    const correct = pick(factors);
    const wrong = pick(others);
    const k = Math.floor(n / wrong);
    const example = [wrong * k, wrong * (k + 1)].includes(correct)
      ? []
      : [`For example, ${wrong} times ${k} is ${wrong * k}, and ${wrong} times ${k + 1} is ${wrong * (k + 1)}.`, `${n} is in between, so ${wrong} is not a factor.`];
    return {
      explain: [
        `A factor of ${n} goes into ${n} evenly, with nothing left over.`,
        `For each choice, skip count by it. Do you land right on ${n}?`,
        ...example,
        `Which choice goes into ${n} evenly?`,
      ],
      explainAnswer: `${correct} is a factor, because ${correct} times ${n / correct} is ${n}.`,
      prompt: `Which number is a factor of ${n}?`,
      correct,
      answerType: 'choice',
      choices: shuffle([correct, ...shuffle(others).slice(0, 3)]),
      answerLabel: `${correct} × ${n / correct} = ${n}`,
      speech: `Which number is a factor of ${n}?`,
      questionTitle: 'Find the factor',
    };
  }
  const m = randInt(3, 12);
  const correct = m * randInt(3, 12);
  const pool = new Set();
  while (pool.size < 3) {
    const c = correct + randInt(-m + 1, m - 1);
    if (c > 0 && c % m !== 0) pool.add(c);
  }
  return {
    explain: [
      `Multiples of ${m} are the numbers we say when we skip count by ${m}.`,
      `Like ${m}, ${2 * m}, and on and on.`,
      `For each choice, ask: is it ${m} times some number?`,
      `Which choice is in the ${m} times table?`,
    ],
    explainAnswer: `${correct} is a multiple, because ${m} times ${correct / m} is ${correct}.`,
    prompt: `Which number is a multiple of ${m}?`,
    correct,
    answerType: 'choice',
    choices: shuffle([correct, ...pool]),
    answerLabel: `${m} × ${correct / m} = ${correct}`,
    speech: `Which number is a multiple of ${m}?`,
    questionTitle: 'Find the multiple',
  };
}

export const BUILDERS = {
  placeValue: (level) => placeValueProblem(level, false),
  compare: compareProblem,
  addStrategy: addStrategyProblem,
  subStrategy: subStrategyProblem,
  expression: expressionProblem,
  riddle: riddleProblem,
  measurement: measurementProblem,
  shortcut: shortcutProblem,
  oddEven: oddEvenProblem,
  bigNumber: (level) => placeValueProblem(level, true),
  regroup: regroupProblem,
  multistep: multistepProblem,
  numberBond: numberBondProblem,
  fraction: fractionProblem,
  factors: factorsProblem,
  ...PREK_BUILDERS,
  // Grade-aware versions of placeValue and compare, and the new topics.
  ...TOPIC_BUILDERS,
};

export function isSkillConcept(id) {
  return Object.prototype.hasOwnProperty.call(SKILL_META, id);
}

// `grade` (grades.js) lets the Singapore topics follow the school year.
export function buildSkillProblem(conceptId, level, grade) {
  const builder = BUILDERS[conceptId];
  const problem = builder(level, grade);
  return {
    type: 'skill',
    concept: conceptId,
    op: conceptId,
    level,
    ...problem,
  };
}

export function buildSkillOptions(problem) {
  if (problem.answerType === 'choice') return problem.choices;
  return numericMCOptions(problem.correct);
}
