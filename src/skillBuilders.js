/**
 * "Skill Builders" — a second-grade math-concepts section covering place
 * value, comparing, addition/subtraction strategies, expressions,
 * measurement, odd/even numbers, big numbers, regrouping algorithms, and
 * multi-step word problems. Organized into four progressive units (A-D),
 * loosely following a typical rigorous 2nd-grade math scope & sequence.
 */

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
  return pick(['Julie', 'Marcus', 'Sarah', 'Alex', 'Emma', 'Jordan', 'Casey']);
}

function pronoun() {
  return pick(['They', 'He', 'She']);
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

const UNIT_COLOR = { A: '#4E8FF7', B: '#8B5CF6', C: '#F5A623', D: '#14B8A6' };
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
};

export const SKILL_META = {};
for (const unit of SKILL_UNITS) {
  for (const concept of unit.concepts) {
    SKILL_META[concept.id] = {
      label: concept.title,
      symbol: CONCEPT_SYMBOL[concept.id],
      color: UNIT_COLOR[unit.id],
      unit: unit.id,
    };
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
  return {
    prompt: `In the number ${nStr}, what is the value of the digit in the ${placeName} place?`,
    correct: value,
    answerType: 'numeric',
    answerLabel: `${value}`,
    speech: `In the number ${n}, what is the value of the digit in the ${placeName} place?`,
  };
}

function compareProblem(level) {
  const range = level === 'easy' ? [1, 20] : level === 'medium' ? [10, 99] : [100, 999];
  const a = randInt(range[0], range[1]);
  const b = Math.random() < 0.15 ? a : randInt(range[0], range[1]);
  const correct = a < b ? '<' : a > b ? '>' : '=';
  const speechAnswer = correct === '<' ? 'less than' : correct === '>' ? 'greater than' : 'equal to';
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
  return {
    prompt: `${a} + ${b}`,
    correct,
    answerType: 'numeric',
    answerLabel: `${a} + ${b} = ${correct}`,
    speech: `${a} plus ${b}`,
    hint,
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
  return {
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
    let a, b, c, prompt, correct;
    if (form === 'abc1') {
      a = randInt(lo, hi);
      b = randInt(lo, hi);
      c = randInt(lo, Math.min(hi, a + b));
      correct = a + b - c;
      prompt = `(${a} + ${b}) − ${c}`;
    } else {
      a = randInt(lo, hi);
      b = randInt(lo, hi);
      c = randInt(lo, b);
      correct = a + (b - c);
      prompt = `${a} + (${b} − ${c})`;
    }
    return {
      prompt,
      correct,
      answerType: 'numeric',
      answerLabel: `${prompt} = ${correct}`,
      speech: prompt.replace(/[()]/g, '').replace('+', 'plus').replace('−', 'minus'),
    };
  }

  const form = pick(['sumMissing', 'diffMissingLeft', 'diffMissingRight']);
  let a, b, sum, diff, prompt, correct;
  if (form === 'sumMissing') {
    a = randInt(lo, hi);
    b = randInt(lo, hi);
    sum = a + b;
    correct = b;
    prompt = `${a} + ☐ = ${sum}`;
  } else if (form === 'diffMissingLeft') {
    b = randInt(lo, hi);
    diff = randInt(lo, hi);
    correct = diff + b;
    prompt = `☐ − ${b} = ${diff}`;
  } else {
    a = randInt(lo, hi);
    sum = randInt(a, a + hi);
    correct = sum - a;
    prompt = `${sum} − ☐ = ${a}`;
  }
  return {
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
    clues.push({
      text: `I am ${n % 2 === 0 ? 'an even' : 'an odd'} number.`,
      test: (x) => x % 2 === n % 2,
    });
    const margin = level === 'easy' ? randInt(3, 6) : randInt(4, 10);
    const g = n - margin - randInt(0, 3);
    clues.push({ text: `I am greater than ${g}.`, test: (x) => x > g });
    const l = n + margin + randInt(0, 3);
    clues.push({ text: `I am less than ${l}.`, test: (x) => x < l });
    if (level !== 'easy' && n >= 10) {
      const digitSum = Math.floor(n / 10) + (n % 10);
      clues.push({
        text: `The sum of my digits is ${digitSum}.`,
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
  return { prompt: text, correct: n, answerType: 'numeric', answerLabel: `${n}`, speech: text };
}

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
    };
  }

  const unit = level === 'hard' ? pick(['centimeters', 'inches', 'feet']) : pick(['inches', 'feet']);
  const range = level === 'easy' ? [2, 12] : level === 'medium' ? [5, 40] : [10, 80];
  const op = pick(['add', 'subtract']);
  let a, b, prompt, correct;
  const name = nameA();
  if (op === 'add') {
    a = randInt(range[0], range[1]);
    b = randInt(range[0], range[1]);
    correct = a + b;
    prompt = `One piece of ribbon is ${a} ${unit} long. Another piece is ${b} ${unit} long. If ${name} tapes them together end to end, how long are they in all?`;
  } else {
    a = randInt(range[0] + 5, range[1] + 5);
    b = randInt(range[0], Math.min(a - 1, range[1]));
    correct = a - b;
    prompt = `A rope is ${a} ${unit} long. ${name} cuts off ${b} ${unit}. How long is the rope now?`;
  }
  return {
    prompt,
    correct,
    answerType: 'numeric',
    answerLabel: `${correct} ${unit}`,
    speech: prompt,
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
  return {
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
  return {
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
  const pron = pronoun();
  const item = pick(MULTISTEP_ITEMS);

  let a = randInt(range[0], range[1]);
  let b, c, correct, prompt;

  if (pattern === 'add-add') {
    b = randInt(range[0], range[1]);
    c = randInt(range[0], range[1]);
    correct = a + b + c;
    prompt = `${name} has ${a} ${item}. ${pron} finds ${b} more, then finds ${c} more. How many ${item} does ${name} have now?`;
  } else if (pattern === 'add-sub') {
    b = randInt(range[0], range[1]);
    const intermediate = a + b;
    c = randInt(1, intermediate);
    correct = intermediate - c;
    prompt = `${name} has ${a} ${item}. ${pron} buys ${b} more, then gives away ${c}. How many ${item} does ${name} have now?`;
  } else if (pattern === 'sub-add') {
    b = randInt(1, a);
    const intermediate = a - b;
    c = randInt(range[0], range[1]);
    correct = intermediate + c;
    prompt = `${name} has ${a} ${item}. ${pron} gives away ${b}, then finds ${c} more. How many ${item} does ${name} have now?`;
  } else {
    b = randInt(1, a);
    const intermediate = a - b;
    c = randInt(0, intermediate);
    correct = intermediate - c;
    prompt = `${name} has ${a} ${item}. ${pron} gives away ${b}, then gives away ${c} more. How many ${item} does ${name} have left?`;
  }

  return {
    prompt,
    correct,
    answerType: 'numeric',
    answerLabel: `${correct}`,
    speech: prompt,
  };
}

const BUILDERS = {
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
};

export function isSkillConcept(id) {
  return Object.prototype.hasOwnProperty.call(SKILL_META, id);
}

export function buildSkillProblem(conceptId, level) {
  const builder = BUILDERS[conceptId];
  const problem = builder(level);
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
