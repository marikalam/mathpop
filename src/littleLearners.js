/**
 * Games for the littlest learners (Pre-K and Kindergarten): counting
 * objects, finding shapes and colors, what number comes next, and which
 * group has more. Every answer is picked from big choices, so nobody has
 * to read or write. Problems use the same shape as Skill Builders
 * (`type: 'skill'`), so the question, feedback and review screens all
 * work the same way.
 *
 * Also holds the shapes and colors for the Explore screen, with their
 * names in each Explore language.
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

// `ja`/`yue`/`zh` are [what the voice says, the label shown]; kana for
// Japanese so the voice reads them the way a little kid would hear them.
export const SHAPES = [
  { id: 'circle', en: 'circle', ja: ['まる', 'まる'], yue: ['圓形', '圓形'], zh: ['圆形', '圆形'] },
  { id: 'square', en: 'square', ja: ['しかく', 'しかく'], yue: ['正方形', '正方形'], zh: ['正方形', '正方形'] },
  { id: 'triangle', en: 'triangle', ja: ['さんかく', 'さんかく'], yue: ['三角形', '三角形'], zh: ['三角形', '三角形'] },
  { id: 'rectangle', en: 'rectangle', ja: ['ちょうほうけい', '長方形'], yue: ['長方形', '長方形'], zh: ['长方形', '长方形'] },
  { id: 'star', en: 'star', ja: ['ほし', 'ほし'], yue: ['星形', '星形'], zh: ['星形', '星形'] },
  { id: 'heart', en: 'heart', ja: ['ハート', 'ハート'], yue: ['心形', '心形'], zh: ['心形', '心形'] },
  { id: 'oval', en: 'oval', ja: ['だえん', 'だえん'], yue: ['橢圓形', '橢圓形'], zh: ['椭圆形', '椭圆形'] },
  { id: 'diamond', en: 'diamond', ja: ['ひしがた', 'ひしがた'], yue: ['菱形', '菱形'], zh: ['菱形', '菱形'] },
];

// Kindergarten also learns the hexagon (quiz only, not on Explore).
const HEXAGON = { id: 'hexagon', en: 'hexagon' };

export const COLORS = [
  { id: 'red', hex: '#EF4444', en: 'red', ja: ['あか', 'あか'], yue: ['紅色', '紅色'], zh: ['红色', '红色'] },
  { id: 'orange', hex: '#F97316', en: 'orange', ja: ['オレンジ', 'オレンジ'], yue: ['橙色', '橙色'], zh: ['橙色', '橙色'] },
  { id: 'yellow', hex: '#FACC15', en: 'yellow', ja: ['きいろ', 'きいろ'], yue: ['黃色', '黃色'], zh: ['黄色', '黄色'], dark: true },
  { id: 'green', hex: '#22C55E', en: 'green', ja: ['みどり', 'みどり'], yue: ['綠色', '綠色'], zh: ['绿色', '绿色'] },
  { id: 'blue', hex: '#3B82F6', en: 'blue', ja: ['あお', 'あお'], yue: ['藍色', '藍色'], zh: ['蓝色', '蓝色'] },
  { id: 'purple', hex: '#8B5CF6', en: 'purple', ja: ['むらさき', 'むらさき'], yue: ['紫色', '紫色'], zh: ['紫色', '紫色'] },
  { id: 'pink', hex: '#EC4899', en: 'pink', ja: ['ピンク', 'ピンク'], yue: ['粉紅色', '粉紅色'], zh: ['粉红色', '粉红色'] },
  { id: 'brown', hex: '#92400E', en: 'brown', ja: ['ちゃいろ', 'ちゃいろ'], yue: ['啡色', '啡色'], zh: ['棕色', '棕色'] },
  { id: 'black', hex: '#1F2937', en: 'black', ja: ['くろ', 'くろ'], yue: ['黑色', '黑色'], zh: ['黑色', '黑色'] },
  { id: 'white', hex: '#FFFFFF', en: 'white', ja: ['しろ', 'しろ'], yue: ['白色', '白色'], zh: ['白色', '白色'], dark: true },
];

// What to say and show for a shape or color in an Explore language.
export function wordIn(item, langKey) {
  const word = langKey === 'en' ? null : item[langKey];
  return word ? { say: word[0], show: word[1] } : { say: item.en, show: item.en };
}

// Things to count, with the word for "How many ___?".
const COUNTABLES = [
  { emoji: '🍎', name: 'apples' },
  { emoji: '🐶', name: 'puppies' },
  { emoji: '⭐', name: 'stars' },
  { emoji: '🎈', name: 'balloons' },
  { emoji: '🐟', name: 'fish' },
  { emoji: '🚗', name: 'cars' },
  { emoji: '🌸', name: 'flowers' },
  { emoji: '🦆', name: 'ducks' },
  { emoji: '🍓', name: 'strawberries' },
  { emoji: '🐞', name: 'ladybugs' },
];

export const LITTLE_META = {
  count: { label: 'Counting', symbol: '🍎', color: '#EF6A5A' },
  shapes: { label: 'Shapes', symbol: '🔺', color: '#14A3B8' },
  colors: { label: 'Colors', symbol: '🎨', color: '#8B5CF6' },
  nextNumber: { label: 'What Comes Next', symbol: '➡️', color: '#3B6FEF' },
  moreFewer: { label: 'More or Fewer', symbol: '⚖️', color: '#2FAE6B' },
};

export function isLittleConcept(id) {
  return Object.prototype.hasOwnProperty.call(LITTLE_META, id);
}

// A few nearby numbers to pick from, never below 1.
function nearbyNumbers(correct, max) {
  const pool = new Set();
  for (const d of shuffle([-2, -1, 1, 2, 3])) {
    const v = correct + d;
    if (v >= 1 && v <= max + 2) pool.add(v);
    if (pool.size === 3) break;
  }
  return shuffle([correct, ...pool]);
}

function countProblem(grade) {
  const max = grade === 'k' ? 20 : 10;
  const n = randInt(1, max);
  const thing = pick(COUNTABLES);
  return {
    promptKind: 'count',
    countEmoji: thing.emoji,
    countN: n,
    prompt: thing.emoji.repeat(n),
    correct: n,
    answerType: 'choice',
    choices: nearbyNumbers(n, max),
    answerLabel: `${n} ${thing.name}`,
    speech: `How many ${thing.name}?`,
    speechAnswer: `${n}`,
    questionTitle: `How many ${thing.name}?`,
  };
}

function shapesProblem(grade) {
  const all = grade === 'k' ? [...SHAPES, HEXAGON] : SHAPES;
  const [target, ...others] = shuffle(all);
  // Every choice gets its own color, so it's the shape that counts.
  const colors = shuffle(COLORS.filter((c) => c.id !== 'white' && c.id !== 'black'));
  const choices = shuffle([target, ...others.slice(0, 3)]);
  return {
    promptKind: 'find',
    optionKind: 'shape',
    prompt: `Find the ${target.en}`,
    correct: target.id,
    answerType: 'choice',
    choices: choices.map((s) => s.id),
    choiceColors: Object.fromEntries(choices.map((s, i) => [s.id, colors[i].hex])),
    choiceLabels: Object.fromEntries(choices.map((s) => [s.id, `the ${s.en}`])),
    answerLabel: `That's the ${target.en}`,
    speech: `Find the ${target.en}!`,
    speechAnswer: `the ${target.en}`,
    questionTitle: 'Find the shape!',
  };
}

function colorsProblem() {
  const [target, ...others] = shuffle(COLORS);
  const choices = shuffle([target, ...others.slice(0, 3)]);
  return {
    promptKind: 'find',
    optionKind: 'color',
    prompt: `Find ${target.en}`,
    correct: target.id,
    answerType: 'choice',
    choices: choices.map((c) => c.id),
    choiceLabels: Object.fromEntries(choices.map((c) => [c.id, c.en])),
    answerLabel: `That's ${target.en}`,
    speech: `Find ${target.en}!`,
    speechAnswer: target.en,
    questionTitle: 'Find the color!',
  };
}

function nextNumberProblem(grade) {
  const max = grade === 'k' ? 20 : 10;
  const start = randInt(1, max - 3);
  const shown = [start, start + 1, start + 2];
  const correct = start + 3;
  return {
    promptKind: 'sequence',
    sequence: shown,
    prompt: `${shown.join(', ')}, ?`,
    correct,
    answerType: 'choice',
    choices: nearbyNumbers(correct, max),
    answerLabel: `${shown.join(', ')}, ${correct}`,
    speech: `${shown.join(', ')}... what comes next?`,
    speechAnswer: `${correct}`,
    questionTitle: 'What comes next?',
  };
}

function moreFewerProblem(grade) {
  // Pre-K compares groups that are easy to tell apart; Kindergarten gets
  // closer counts and "fewer" questions too.
  const max = grade === 'k' ? 10 : 6;
  const minGap = grade === 'k' ? 1 : 2;
  const a = randInt(1, max - minGap);
  const b = randInt(a + minGap, max);
  const askFewer = grade === 'k' && Math.random() < 0.5;
  const thing = pick(COUNTABLES);
  const groups = shuffle([a, b]).map((n) => thing.emoji.repeat(n));
  const answerN = askFewer ? a : b;
  const word = askFewer ? 'fewer' : 'more';
  return {
    promptKind: 'find',
    optionKind: 'group',
    prompt: `Which has ${word}?`,
    correct: thing.emoji.repeat(answerN),
    answerType: 'choice',
    choices: groups,
    answerLabel: `${answerN} ${thing.name} is ${word}`,
    speech: `Which group has ${word} ${thing.name}?`,
    speechAnswer: `the group of ${answerN}`,
    questionTitle: `Which has ${word}?`,
  };
}

const BUILDERS = {
  count: countProblem,
  shapes: shapesProblem,
  colors: colorsProblem,
  nextNumber: nextNumberProblem,
  moreFewer: moreFewerProblem,
};

export function buildLittleProblem(conceptId, grade) {
  return {
    type: 'skill',
    concept: conceptId,
    op: conceptId,
    level: grade,
    ...BUILDERS[conceptId](grade),
  };
}
