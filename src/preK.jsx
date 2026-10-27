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

// [picture (a drawing in Drawings.jsx), one, many, Japanese]
const THINGS = [
  ['apple', 'apple', 'apples', 'りんご'],
  ['star', 'star', 'stars', 'ほし'],
  ['duck', 'duck', 'ducks', 'あひる'],
  ['car', 'car', 'cars', 'くるま'],
  ['flower', 'flower', 'flowers', 'おはな'],
  ['fish', 'fish', 'fish', 'おさかな'],
  ['strawberry', 'strawberry', 'strawberries', 'いちご'],
  ['balloon', 'balloon', 'balloons', 'ふうせん'],
  ['ladybug', 'ladybug', 'ladybugs', 'てんとうむし'],
  ['bunny', 'bunny', 'bunnies', 'うさぎ'],
];

export const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

// Japanese (`lang: 'ja'`, a player's language in Players & grades): the
// same games, asked and explained in Japanese, in hiragana a little one
// hears and (later) reads. Numbers as said when counting (いち, に, さん)
// and as a count of things (ひとつ, ふたつ, みっつ).
export const JA_NUMBERS = ['ゼロ', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう', 'じゅう'];
const JA_COUNTS = ['ゼロ', 'ひとつ', 'ふたつ', 'みっつ', 'よっつ', 'いつつ', 'むっつ', 'ななつ', 'やっつ', 'ここのつ', 'とお'];

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

function countProblem(lang) {
  const [thing, one, many, ja] = pick(THINGS);
  const n = smallNumber();
  const problem = {
    promptKind: 'count',
    countThing: thing,
    countName: [one, many],
    countN: n,
    correct: n,
    answerType: 'choice',
    choices: nearbyChoices(n),
  };
  if (lang === 'ja') {
    return {
      ...problem,
      lang,
      prompt: `${ja}は いくつ？`,
      answerLabel: `${n}（${JA_COUNTS[n]}）`,
      speech: `${ja}は いくつ かな？ いっしょに かぞえよう！`,
      speechAnswer: JA_COUNTS[n],
      questionTitle: 'かぞえよう！',
      explain: [
        `${ja}を いっしょに かぞえよう。`,
        'ひとつずつ ゆびで さわりながら かぞえてね。',
        ...(n >= 3 ? ['いくよ。いち、に、それから つづけて！'] : []),
        'とばさないでね。おなじのを 2かい かぞえないでね。',
        `${ja}は いくつ あったかな？`,
      ],
      explainAnswer: `${ja}は ${JA_COUNTS[n]}！`,
    };
  }
  return {
    ...problem,
    prompt: `How many ${many}?`,
    answerLabel: `${n} ${n === 1 ? one : many}`,
    speech: `How many ${many}? Let's count them!`,
    speechAnswer: `${n} ${n === 1 ? one : many}`,
    questionTitle: 'Count them!',
    explain: [
      `Let's count the ${many} together.`,
      `Touch each ${one} as we count. One number for each ${one}.`,
      ...(n >= 3 ? ['Ready? One, two, and keep going!'] : []),
      "Don't skip any, and don't count any twice.",
      `How many ${many} did we count?`,
    ],
    explainAnswer: `We counted ${n} ${n === 1 ? one : many}!`,
  };
}

// What each number looks like, to help find it.
const DIGIT_LOOKS = [
  'Zero is round, like an egg.',
  'One is a tall, straight line, like a stick.',
  'Two has a curvy top and a flat bottom, like a swan.',
  'Three has two round bumps.',
  'Four has a pointy corner and a line going down.',
  'Five has a flat hat on top and a round tummy.',
  'Six has a curvy line that rolls into a circle at the bottom.',
  'Seven has a flat top and a slide going down.',
  'Eight looks like a snowman, two circles stacked up.',
  'Nine has a little circle on top and a line going down.',
  'Ten has two numbers, a one and a zero, like a stick and an egg.',
];
const JA_DIGIT_LOOKS = [
  'ゼロは たまごみたいに まるいよ。',
  'いちは まっすぐな ぼうみたいだよ。',
  'には うえが くるんと まがって、したが たいらだよ。はくちょうみたいだね。',
  'さんは まるい おやまが ふたつ あるよ。',
  'よんは とがった かどと、したに おりる せんが あるよ。',
  'ごは うえに たいらな ぼうし、したに まるい おなかが あるよ。',
  'ろくは くるっと まわって、したで まるに なるよ。',
  'ななは うえが たいらで、すべりだいみたいに おりるよ。',
  'はちは ゆきだるまみたい。まるが ふたつ かさなっているよ。',
  'きゅうは うえに ちいさな まると、したに おりる せんが あるよ。',
  'じゅうは いちと ゼロ、ふたつの すうじで できているよ。ぼうと たまごだね。',
];

function findNumberProblem(lang) {
  const n = Math.random() < 0.7 ? randInt(1, 5) : randInt(0, 10);
  const problem = { promptKind: 'say', correct: n, answerType: 'choice', choices: nearbyChoices(n, 0) };
  if (lang === 'ja') {
    const word = JA_NUMBERS[n];
    return {
      ...problem,
      lang,
      sayText: `${word}は どれ？`,
      prompt: `${n}を さがそう`,
      answerLabel: `${n}は ${word}`,
      speech: `${word}は どれかな？`,
      speechAnswer: word,
      questionTitle: 'すうじを さがそう',
      explain: [`${word}を さがしているよ。`, JA_DIGIT_LOOKS[n], 'ひとつずつ、ゆっくり みてね。', `${word}は どれかな？`],
      explainAnswer: `これが ${word}だよ！`,
    };
  }
  return {
    ...problem,
    sayText: `Which one is ${NUMBER_WORDS[n]}?`,
    prompt: `Find the number ${n}`,
    answerLabel: `${n} is ${NUMBER_WORDS[n]}`,
    speech: `Can you find the number ${NUMBER_WORDS[n]}?`,
    speechAnswer: NUMBER_WORDS[n],
    questionTitle: 'Find the number',
    explain: [`We're looking for ${NUMBER_WORDS[n]}.`, DIGIT_LOOKS[n], 'Look at each number, nice and slow.', `Which one is ${NUMBER_WORDS[n]}?`],
    explainAnswer: `That's the number ${NUMBER_WORDS[n]}!`,
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
// What each shape looks like, said in "Show me how".
const SHAPE_LOOKS = {
  circle: 'A circle is round, like a ball. It has no corners at all.',
  square: 'A square has 4 sides, all the same size, and 4 corners.',
  triangle: 'A triangle has 3 sides and 3 pointy corners.',
  rectangle: 'A rectangle has 4 sides, 2 long ones and 2 short ones, like a door.',
  star: 'A star has 5 pointy tips, like a star in the sky.',
  heart: 'A heart has 2 round bumps on top and a point at the bottom.',
  oval: 'An oval is round but stretched out, like an egg.',
  diamond: 'A diamond has 4 sides and stands up on a point, like a kite.',
};
// [name, what it looks like] in Japanese.
const JA_SHAPES = {
  circle: ['まる', 'まるは ボールみたいに まるいよ。かどは ひとつも ないよ。'],
  square: ['しかく', 'しかくは おなじ ながさの へんが 4つ、かどが 4つ あるよ。'],
  triangle: ['さんかく', 'さんかくは へんが 3つ、とがった かどが 3つ あるよ。'],
  rectangle: ['ながしかく', 'ながしかくは へんが 4つ。ながい へんが 2つ、みじかい へんが 2つ。ドアみたいだね。'],
  star: ['ほし', 'ほしは とがった さきが 5つ あるよ。おそらの ほしみたいだね。'],
  heart: ['ハート', 'ハートは うえに まるい やまが 2つ、したが とがっているよ。'],
  oval: ['たまごがた', 'たまごがたは まるいけど、ながく のびているよ。たまごみたいだね。'],
  diamond: ['ひしがた', 'ひしがたは へんが 4つ。かどで たっているよ。たこみたいだね。'],
};
const FIRST_SHAPES = ['circle', 'square', 'triangle', 'star', 'heart'];
const SHAPE_COLORS = ['#EF4444', '#3B6FEF', '#2FAE6B', '#F5A623', '#8E4FD6', '#EC4899', '#14B8A6'];

function shapesProblem(lang) {
  // The first shapes most of the time; rectangles, ovals and diamonds too.
  const pool = Math.random() < 0.7 ? FIRST_SHAPES : Object.keys(SHAPES);
  const choices = shuffle(pool).slice(0, 3);
  const correct = pick(choices);
  const colors = shuffle(SHAPE_COLORS);
  const problem = {
    promptKind: 'say',
    correct,
    answerType: 'choice',
    choiceKind: 'shape',
    shapeColors: Object.fromEntries(choices.map((s, i) => [s, colors[i]])),
    choices,
  };
  if (lang === 'ja') {
    const [name, looks] = JA_SHAPES[correct];
    return {
      ...problem,
      lang,
      sayText: `${name}を さがそう！`,
      prompt: `${name}を さがそう`,
      answerLabel: name,
      speech: `${name}は どれかな？`,
      speechAnswer: name,
      questionTitle: 'かたち',
      explain: [`${name}を さがそう。`, looks, 'ひとつずつ みてね。どれが にているかな？'],
      explainAnswer: `${name}は これ！`,
    };
  }
  return {
    ...problem,
    sayText: `Find the ${correct}!`,
    prompt: `Find the ${correct}`,
    answerLabel: correct.charAt(0).toUpperCase() + correct.slice(1),
    speech: `Can you find the ${correct}?`,
    speechAnswer: `the ${correct}`,
    questionTitle: 'Shapes',
    explain: [`Let's find the ${correct}.`, SHAPE_LOOKS[correct], 'Look at each shape. Which one looks like that?'],
    explainAnswer: `It's the ${correct}!`,
  };
}

// [picture (Drawings.jsx), one, many, Japanese]
const BIG_SMALL = [
  ['bunny', 'bunny', 'bunnies', 'うさぎ'],
  ['duck', 'duck', 'ducks', 'あひる'],
  ['fish', 'fish', 'fish', 'おさかな'],
  ['car', 'car', 'cars', 'くるま'],
  ['balloon', 'balloon', 'balloons', 'ふうせん'],
  ['apple', 'apple', 'apples', 'りんご'],
  ['star', 'star', 'stars', 'ほし'],
  ['ladybug', 'ladybug', 'ladybugs', 'てんとうむし'],
];

function bigSmallProblem(lang) {
  const [thing, name, names, ja] = pick(BIG_SMALL);
  const correct = Math.random() < 0.5 ? 'big' : 'small';
  const problem = { promptKind: 'say', correct, answerType: 'choice', choiceKind: 'size', sizeThing: thing, choices: shuffle(['big', 'small']) };
  if (lang === 'ja') {
    const size = correct === 'big' ? 'おおきい' : 'ちいさい';
    return {
      ...problem,
      lang,
      sayText: `${size} ${ja}は どれ？`,
      prompt: `${size} ${ja}は どれ？`,
      answerLabel: `${size} ${ja}`,
      speech: `${size} ${ja}は どれかな？`,
      speechAnswer: `${size} ${ja}`,
      questionTitle: 'おおきい・ちいさい',
      explain: [
        `${ja}が ふたつ あるね。`,
        'ひとつは おおきくて、ひとつは ちいさいよ。',
        correct === 'big' ? 'おおきいほうは、ばしょを たくさん とるよ。' : 'ちいさいほうは、ちょっとだけ ばしょを とるよ。',
        `${size} ${ja}は どれかな？`,
      ],
      explainAnswer: `${size} ${ja}は これ！`,
    };
  }
  return {
    ...problem,
    sayText: `Which ${name} is ${correct.toUpperCase()}?`,
    prompt: `Which ${name} is ${correct}?`,
    answerLabel: `The ${correct} ${name}`,
    speech: `Which ${name} is ${correct}?`,
    speechAnswer: `the ${correct} ${name}`,
    questionTitle: 'Big and small',
    explain: [
      `Look at the two ${names}.`,
      'One is big, and one is small.',
      correct === 'big' ? 'The big one takes up lots of room.' : 'The small one is little. It takes up just a tiny bit of room.',
      `Which ${name} is ${correct}?`,
    ],
    explainAnswer: `It's the ${correct} ${name}!`,
  };
}

function moreFewerProblem(lang) {
  const [thing, one, many, ja] = pick(THINGS);
  let a = randInt(1, 6);
  let b = randInt(1, 6);
  // Easy to see: at least two apart.
  while (Math.abs(a - b) < 2) b = randInt(1, 6);
  const more = Math.random() < 0.7;
  // Each answer is a group of things: its value says how many ("3 ducks").
  const label = (k) => `${k} ${k === 1 ? one : many}`;
  const groupA = label(a);
  const groupB = label(b);
  const wantA = more ? a > b : a < b;
  const n = wantA ? a : b;
  const problem = {
    promptKind: 'say',
    correct: wantA ? groupA : groupB,
    answerType: 'choice',
    choiceKind: 'group',
    groups: { [groupA]: { thing, n: a }, [groupB]: { thing, n: b } },
    choices: shuffle([groupA, groupB]),
  };
  if (lang === 'ja') {
    const word = more ? 'おおい' : 'すくない';
    return {
      ...problem,
      lang,
      sayText: `${word}のは どっち？`,
      prompt: `${ja}が ${word}のは どっち？`,
      answerLabel: `${JA_COUNTS[n]}の ほうが ${word}`,
      speech: `${ja}が ${word}のは どっちかな？`,
      speechAnswer: `${JA_COUNTS[n]}の ほう`,
      questionTitle: word,
      explain: [
        `${ja}の グループを ふたつとも みてみよう。`,
        'ひとつずつ さわりながら、それぞれ かぞえてね。',
        more ? 'おおいって、たくさん あるほうの ことだよ。' : 'すくないって、あまり ないほうの ことだよ。',
        more
          ? 'ひとつずつ ならべて、ペアに してもいいよ。あまったほうが おおいよ。'
          : 'ひとつずつ ならべて、ペアに してもいいよ。さきに なくなったほうが すくないよ。',
        `${word}のは どっちかな？`,
      ],
      explainAnswer: `${JA_COUNTS[n]}の ほうが ${word}よ！`,
    };
  }
  return {
    ...problem,
    sayText: more ? 'Which has MORE?' : 'Which has FEWER?',
    prompt: more ? `Which has more ${many}?` : `Which has fewer ${many}?`,
    answerLabel: `${n} ${many} is ${more ? 'more' : 'fewer'}`,
    speech: more ? `Which has more ${many}?` : `Which has fewer ${many}?`,
    speechAnswer: `${n} ${many}`,
    questionTitle: more ? 'More' : 'Fewer',
    explain: [
      `Let's look at both groups of ${many}.`,
      `Count each group. Touch each ${one} as you go.`,
      more ? 'More means the group that has lots.' : 'Fewer means the group that has not as many.',
      more ? 'Or match them up, one and one. The group with some left over has more.' : 'Or match them up, one and one. The group that runs out first has fewer.',
      `Which group has ${more ? 'more' : 'fewer'}?`,
    ],
    explainAnswer: `The group with ${n} ${n === 1 ? one : many} has ${more ? 'more' : 'fewer'}!`,
  };
}

// Pictures from Drawings.jsx.
const PATTERN_SETS = [
  ['red', 'blue', 'yellow', 'green'],
  ['duck', 'fish', 'bunny', 'ladybug'],
  ['apple', 'strawberry', 'flower', 'balloon'],
  ['star', 'moon', 'sun', 'cloud'],
];
// What to call each pattern picture out loud: in a list, as the answer,
// and in Japanese.
const PATTERN_NAMES = {
  red: ['red', 'the red one', 'あか'],
  blue: ['blue', 'the blue one', 'あお'],
  yellow: ['yellow', 'the yellow one', 'きいろ'],
  green: ['green', 'the green one', 'みどり'],
  duck: ['duck', 'the duck', 'あひる'],
  fish: ['fish', 'the fish', 'おさかな'],
  bunny: ['bunny', 'the bunny', 'うさぎ'],
  ladybug: ['ladybug', 'the ladybug', 'てんとうむし'],
  apple: ['apple', 'the apple', 'りんご'],
  strawberry: ['strawberry', 'the strawberry', 'いちご'],
  flower: ['flower', 'the flower', 'おはな'],
  balloon: ['balloon', 'the balloon', 'ふうせん'],
  star: ['star', 'the star', 'ほし'],
  moon: ['moon', 'the moon', 'つき'],
  sun: ['sun', 'the sun', 'たいよう'],
  cloud: ['cloud', 'the cloud', 'くも'],
};
const PATTERN_KINDS = [
  [0, 1],
  [0, 0, 1],
  [0, 1, 1],
  [0, 1, 2],
];

function patternProblem(lang) {
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
  const problem = {
    promptKind: 'pattern',
    patternItems: seq,
    prompt: `${seq.map((x) => PATTERN_NAMES[x][0]).join(', ')}, ?`,
    correct,
    answerType: 'choice',
    choiceKind: 'thing',
    choices: shuffle(choices),
    answerLabel: `Next comes ${PATTERN_NAMES[correct][1]}`,
  };
  if (lang === 'ja') {
    const ja = (x) => PATTERN_NAMES[x][2];
    return {
      ...problem,
      lang,
      prompt: `${seq.map(ja).join('、')}、？`,
      answerLabel: `つぎは ${ja(correct)}`,
      speech: 'つぎは なにかな？',
      speechAnswer: ja(correct),
      questionTitle: 'つぎは なに？',
      explain: [
        'いっしょに こえに だして いってみよう。',
        `${seq.map(ja).join('、')}。`,
        `${kind.map((k) => ja(items[k])).join('、')}、それから また はじめに もどるよ。`,
        'もういちど いって、つづけてみよう。つぎは なにかな？',
      ],
      explainAnswer: `つぎは ${ja(correct)}！`,
    };
  }
  return {
    ...problem,
    speech: 'What comes next?',
    speechAnswer: 'that one',
    questionTitle: 'What comes next?',
    explain: [
      "Let's say the pattern out loud together.",
      `${seq.map((x) => PATTERN_NAMES[x][0]).join(', ').replace(/^./, (c) => c.toUpperCase())}.`,
      `It goes ${kind.map((k) => PATTERN_NAMES[items[k]][0]).join(', ')}, and then it starts again.`,
      'Say it again and keep going. What comes next?',
    ],
    explainAnswer: `Next comes ${PATTERN_NAMES[correct][1]}!`,
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
  count: 'apple',
  findNumber: 'keypad',
  shapes: 'shapes',
  bigSmall: 'bear',
  moreFewer: 'scale',
  pattern: 'pattern',
};

// Built as (level, grade, lang), like the other games; only the
// language matters here.
// `toddler` marks them for the toddler screens (App.jsx): the question
// fills the screen, and counting is tap-each-one.
const toddler = (build) => (level, grade, lang) => ({ ...build(lang), toddler: true });
export const PREK_BUILDERS = {
  count: toddler(countProblem),
  findNumber: toddler(findNumberProblem),
  shapes: toddler(shapesProblem),
  bigSmall: toddler(bigSmallProblem),
  moreFewer: toddler(moreFewerProblem),
  pattern: toddler(patternProblem),
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
