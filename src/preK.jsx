// Pre-K (ages 2-5; Singapore nursery and K1): short, picture-first games
// with big buttons, everything read aloud, and no typing or writing -
// always three (or two) things to tap. Counting, finding a number,
// shapes, big and small, more or fewer, and patterns. The problems go
// through the same game screens as the other grades (skillBuilders.js).

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

const THINGS = [
  ['🍎', 'apple', 'apples'],
  ['🐶', 'puppy', 'puppies'],
  ['⭐', 'star', 'stars'],
  ['🦆', 'duck', 'ducks'],
  ['🚗', 'car', 'cars'],
  ['🌸', 'flower', 'flowers'],
  ['🐟', 'fish', 'fish'],
  ['🍓', 'strawberry', 'strawberries'],
  ['🎈', 'balloon', 'balloons'],
  ['🐞', 'ladybug', 'ladybugs'],
];

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

// Small numbers most of the time: a 2-3 year old counts to about 5.
function smallNumber() {
  return Math.random() < 0.7 ? randInt(1, 5) : randInt(6, 10);
}

// Three different numbers from 0-10, one of them `n`, close to it.
function nearbyChoices(n, min = 1) {
  const pool = new Set([n]);
  for (const d of shuffle([1, -1, 2, -2, 3])) {
    if (pool.size === 3) break;
    if (n + d >= min && n + d <= 10) pool.add(n + d);
  }
  return shuffle([...pool]);
}

function countProblem() {
  const [emoji, one, many] = pick(THINGS);
  const n = smallNumber();
  return {
    promptKind: 'count',
    countEmoji: emoji,
    countN: n,
    prompt: `How many ${many}?`,
    correct: n,
    answerType: 'choice',
    choices: nearbyChoices(n),
    answerLabel: `${n} ${n === 1 ? one : many}`,
    speech: `How many ${many}? Let's count them!`,
    speechAnswer: `${n} ${n === 1 ? one : many}`,
    questionTitle: 'Count them!',
  };
}

function findNumberProblem() {
  const n = Math.random() < 0.7 ? randInt(1, 5) : randInt(0, 10);
  return {
    promptKind: 'say',
    sayText: `Which one is ${NUMBER_WORDS[n]}?`,
    prompt: `Find the number ${n}`,
    correct: n,
    answerType: 'choice',
    choices: nearbyChoices(n, 0),
    answerLabel: `${n} is ${NUMBER_WORDS[n]}`,
    speech: `Can you find the number ${NUMBER_WORDS[n]}?`,
    speechAnswer: NUMBER_WORDS[n],
    questionTitle: 'Find the number',
  };
}

export const SHAPES = {
  circle: 'circle',
  square: 'square',
  triangle: 'triangle',
  rectangle: 'rectangle',
  star: 'star',
  heart: 'heart',
  oval: 'oval',
  diamond: 'diamond',
};
const FIRST_SHAPES = ['circle', 'square', 'triangle', 'star', 'heart'];
const SHAPE_COLORS = ['#EF4444', '#3B6FEF', '#2FAE6B', '#F5A623', '#8E4FD6', '#EC4899', '#14B8A6'];

function shapesProblem() {
  // The first shapes most of the time; rectangles, ovals and diamonds too.
  const pool = Math.random() < 0.7 ? FIRST_SHAPES : Object.keys(SHAPES);
  const choices = shuffle(pool).slice(0, 3);
  const correct = pick(choices);
  const colors = shuffle(SHAPE_COLORS);
  return {
    promptKind: 'say',
    sayText: `Find the ${correct}!`,
    prompt: `Find the ${correct}`,
    correct,
    answerType: 'choice',
    choiceKind: 'shape',
    shapeColors: Object.fromEntries(choices.map((s, i) => [s, colors[i]])),
    choices,
    answerLabel: correct.charAt(0).toUpperCase() + correct.slice(1),
    speech: `Can you find the ${correct}?`,
    speechAnswer: `the ${correct}`,
    questionTitle: 'Shapes',
  };
}

const BIG_SMALL = [
  ['🐘', 'elephant'],
  ['🐻', 'bear'],
  ['🐳', 'whale'],
  ['🏠', 'house'],
  ['🌳', 'tree'],
  ['🐶', 'puppy'],
  ['🍎', 'apple'],
  ['🚌', 'bus'],
];

function bigSmallProblem() {
  const [emoji, name] = pick(BIG_SMALL);
  const correct = Math.random() < 0.5 ? 'big' : 'small';
  return {
    promptKind: 'say',
    sayText: `Which ${name} is ${correct.toUpperCase()}?`,
    prompt: `Which ${name} is ${correct}?`,
    correct,
    answerType: 'choice',
    choiceKind: 'size',
    sizeEmoji: emoji,
    choices: shuffle(['big', 'small']),
    answerLabel: `The ${correct} ${name}`,
    speech: `Which ${name} is ${correct}?`,
    speechAnswer: `the ${correct} ${name}`,
    questionTitle: 'Big and small',
  };
}

function moreFewerProblem() {
  const [emoji, , many] = pick(THINGS);
  let a = randInt(1, 6);
  let b = randInt(1, 6);
  // Easy to see: at least two apart.
  while (Math.abs(a - b) < 2) b = randInt(1, 6);
  const more = Math.random() < 0.7;
  const groupA = emoji.repeat(a);
  const groupB = emoji.repeat(b);
  const wantA = more ? a > b : a < b;
  const n = wantA ? a : b;
  return {
    promptKind: 'say',
    sayText: more ? 'Which has MORE?' : 'Which has FEWER?',
    prompt: more ? `Which has more ${many}?` : `Which has fewer ${many}?`,
    correct: wantA ? groupA : groupB,
    answerType: 'choice',
    choiceKind: 'group',
    choices: shuffle([groupA, groupB]),
    answerLabel: `${n} ${many} is ${more ? 'more' : 'fewer'}`,
    speech: more ? `Which has more ${many}?` : `Which has fewer ${many}?`,
    speechAnswer: `${n} ${many}`,
    questionTitle: more ? 'More' : 'Fewer',
  };
}

const PATTERN_SETS = [
  ['🔴', '🔵', '🟡', '🟢'],
  ['🐶', '🐱', '🐰', '🐸'],
  ['🍎', '🍌', '🍇', '🍊'],
  ['⭐', '🌙', '☀️', '☁️'],
];
const PATTERN_KINDS = [
  [0, 1],
  [0, 0, 1],
  [0, 1, 1],
  [0, 1, 2],
];

function patternProblem() {
  const items = shuffle(pick(PATTERN_SETS));
  // AB patterns most of the time, the longer ones for older children.
  const kind = Math.random() < 0.5 ? PATTERN_KINDS[0] : pick(PATTERN_KINDS);
  const length = kind.length * 2 + randInt(0, kind.length - 1);
  const seq = Array.from({ length: length + 1 }, (_, i) => items[kind[i % kind.length]]);
  const correct = seq.pop();
  const used = [...new Set(kind.map((k) => items[k]))];
  const extra = items.find((x) => !used.includes(x));
  const choices = shuffle([...new Set([correct, ...used, extra])]).slice(0, 3);
  if (!choices.includes(correct)) choices[0] = correct;
  return {
    promptKind: 'pattern',
    patternItems: seq,
    prompt: `${seq.join(' ')} ?`,
    correct,
    answerType: 'choice',
    choices: shuffle(choices),
    answerLabel: `${seq.join(' ')} ${correct}`,
    speech: 'What comes next?',
    speechAnswer: 'that one',
    questionTitle: 'What comes next?',
  };
}

export const PREK_CONCEPTS = [
  { id: 'count', title: 'Count It', sub: 'How many?' },
  { id: 'findNumber', title: 'Find the Number', sub: 'Hear it, tap it' },
  { id: 'shapes', title: 'Shapes', sub: 'Circle, square, star' },
  { id: 'bigSmall', title: 'Big & Small', sub: 'Which is bigger?' },
  { id: 'moreFewer', title: 'More or Fewer', sub: 'Which group has more?' },
  { id: 'pattern', title: 'Patterns', sub: 'What comes next?' },
];

export const PREK_SYMBOL = {
  count: '🍎',
  findNumber: '🔢',
  shapes: '🔺',
  bigSmall: '🐘',
  moreFewer: '⚖️',
  pattern: '🔴',
};

export const PREK_BUILDERS = {
  count: countProblem,
  findNumber: findNumberProblem,
  shapes: shapesProblem,
  bigSmall: bigSmallProblem,
  moreFewer: moreFewerProblem,
  pattern: patternProblem,
};

// A shape to tap: big and colorful.
export function ShapeIcon({ shape, color = '#3B6FEF', size = 72 }) {
  const common = { fill: color, stroke: 'rgba(0,0,0,0.12)', strokeWidth: 2 };
  const paths = {
    circle: <circle cx="50" cy="50" r="38" {...common} />,
    square: <rect x="14" y="14" width="72" height="72" rx="6" {...common} />,
    triangle: <path d="M50 10 L90 86 L10 86 Z" {...common} strokeLinejoin="round" />,
    rectangle: <rect x="6" y="26" width="88" height="48" rx="6" {...common} />,
    star: (
      <path
        d="M50 8 L61 38 L93 38 L67 57 L77 89 L50 70 L23 89 L33 57 L7 38 L39 38 Z"
        {...common}
        strokeLinejoin="round"
      />
    ),
    heart: <path d="M50 88 C15 62 6 42 18 26 C30 12 46 18 50 32 C54 18 70 12 82 26 C94 42 85 62 50 88 Z" {...common} />,
    oval: <ellipse cx="50" cy="50" rx="44" ry="28" {...common} />,
    diamond: <path d="M50 6 L90 50 L50 94 L10 50 Z" {...common} strokeLinejoin="round" />,
  };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {paths[shape]}
    </svg>
  );
}
