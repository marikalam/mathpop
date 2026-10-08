// The sections on each grade's home page, and the topics in each. They
// gather the main concepts of Singapore math (the MOE Primary Mathematics
// syllabus: K2 to Primary 4) and Beast Academy (Levels 1 to 4) for that
// grade. `from` says where a topic comes from: Singapore's school year
// (K2, P1...) and/or the Beast Academy book (1A, 2C...).
//
// A topic id is a practice game: topics.js, skillBuilders.js and preK.jsx
// for most, or the app's own add / subtract / multiply / divide / clock /
// sentence (word problems).

// `short` is the name on the home page's card.
const SECTION_STYLE = {
  numbers: { icon: '🔢', short: 'Numbers', from: '#4e8ff7', to: '#3a6fd8' },
  addsub: { icon: '➕', short: 'Add & Subtract', from: '#38c07f', to: '#2a9e60' },
  muldiv: { icon: '✖️', short: 'Multiply & Divide', from: '#a065e6', to: '#7c3fc4' },
  fractions: { icon: '🍕', short: 'Fractions', from: '#14b8a6', to: '#0f9384' },
  decimals: { icon: '🔟', short: 'Decimals', from: '#1fb6ba', to: '#14898c' },
  measure: { icon: '📏', short: 'Measurement', from: '#f5a524', to: '#e08a12' },
  shapes: { icon: '🔺', short: 'Shapes', from: '#e0577f', to: '#c43c66' },
  data: { icon: '📊', short: 'Graphs', from: '#f0954f', to: '#e0793a' },
  puzzles: { icon: '🧠', short: 'Puzzles', from: '#8e4fd6', to: '#6f35b8' },
};

// Each topic's picture on its card.
export const TOPIC_ICONS = {
  count: '🍎', findNumber: '🔍', moreFewer: '⚖️', shapes: '🔺', bigSmall: '🐘', pattern: '🔴',
  frames: '🔟', numberOrder: '➡️', compare: '⚖️', numberBond: '🔗', add: '+', subtract: '−',
  multiply: '×', divide: '÷', sentence: '📖', clock: '🕐', placeValue: '🔢', skipCount: '🦘',
  ordinal: '🥇', addStrategy: '🔟', equalGroups: '🍪', sharing: '🤝', ruler: '📏', money: '💰',
  shapeSides: '🛑', position: '🗺️', pictureGraph: '📊', oddEven: '🔀', subStrategy: '🧠',
  regroup: '🧱', missingDigit: '❓', fractionPicture: '🍕', fraction: '🥧', compareFractions: '⚖️',
  measurement: '📐', massVolume: '⚖️', duration: '⏱️', expression: '🧮', riddle: '🕵️',
  shortcut: '⚡', estimate: '🎯', remainder: '🍬', squares: '⬛', distributive: '✂️',
  addFractions: '➕', perimeter: '🔲', area: '🟦', shapeClass: '🔷', angles: '📐', lines: '🛤️',
  barGraph: '📊', variables: '🔤', multistep: '🧩', rounding: '🎯', factors: '🧮', primes: '💎',
  exponents: '🚀', negative: '🌡️', orderOps: '🧭', decimalPlace: '🔟', decimalConvert: '🔁',
  decimalAddSub: '➕', clock24: '🕒', symmetry: '🦋', logic: '🧩', counting: '🔢', probability: '🎲',
};

const t = (id, title, sub, from) => ({ id, title, sub, from });

const SECTIONS = {
  p: [
    {
      id: 'numbers',
      title: 'Numbers',
      sub: 'Count, find & compare',
      topics: [
        t('count', 'Count It', 'How many?', 'Nursery'),
        t('findNumber', 'Find the Number', 'Hear it, tap it', 'Nursery'),
        t('moreFewer', 'More or Fewer', 'Which has more?', 'Nursery'),
      ],
    },
    {
      id: 'shapes',
      title: 'Shapes, Sizes & Patterns',
      sub: 'Look closely',
      topics: [
        t('shapes', 'Shapes', 'Circle, square, star', 'Nursery'),
        t('bigSmall', 'Big & Small', 'Which is bigger?', 'Nursery'),
        t('pattern', 'Patterns', 'What comes next?', 'Nursery'),
      ],
    },
  ],
  k: [
    {
      id: 'numbers',
      title: 'Numbers to 20',
      sub: 'Count, order & compare',
      topics: [
        t('frames', 'Count to 20', 'Ten frames', 'K2 · BA 1A'),
        t('numberOrder', 'Before & After', 'Number order', 'K2'),
        t('compare', 'Comparing', 'Bigger, smaller, equal', 'K2 · BA 1A'),
        t('numberBond', 'Number Bonds', 'Part, part, whole', 'K2'),
      ],
    },
    {
      id: 'addsub',
      title: 'Add & Subtract',
      sub: 'Within 10',
      topics: [
        t('add', 'Addition', 'Put together', 'K2'),
        t('subtract', 'Subtraction', 'Take away', 'K2'),
        t('sentence', 'Word Problems', 'Math in a story', 'K2'),
      ],
    },
    {
      id: 'shapes',
      title: 'Shapes & Patterns',
      sub: 'Shapes, sizes, patterns',
      topics: [
        t('shapes', 'Shapes', 'Name the shape', 'K2 · BA 1A'),
        t('bigSmall', 'Big & Small', 'Compare sizes', 'K2'),
        t('pattern', 'Patterns', 'What comes next?', 'K2'),
      ],
    },
  ],
  1: [
    {
      id: 'numbers',
      title: 'Numbers to 100',
      sub: 'Tens, ones & order',
      topics: [
        t('placeValue', 'Tens & Ones', 'Place value', 'P1 · BA 1D'),
        t('compare', 'Comparing', 'Use <, > and =', 'P1 · BA 1A'),
        t('numberOrder', 'Number Order', 'Before, after, 10 more', 'P1'),
        t('skipCount', 'Skip Counting', 'By 2s, 5s & 10s', 'P1 · BA 1C'),
        t('ordinal', '1st, 2nd, 3rd', 'Ordinal numbers', 'P1'),
      ],
    },
    {
      id: 'addsub',
      title: 'Add & Subtract',
      sub: 'Within 100',
      topics: [
        t('numberBond', 'Number Bonds', 'Up to 20', 'P1'),
        t('addStrategy', 'Make a Ten', 'Doubles & tens', 'P1 · BA 1B'),
        t('add', 'Addition', 'Within 100', 'P1 · BA 1B'),
        t('subtract', 'Subtraction', 'Within 100', 'P1 · BA 1B'),
        t('sentence', 'Word Problems', 'Math in a story', 'P1'),
      ],
    },
    {
      id: 'muldiv',
      title: 'Multiply & Divide',
      sub: 'Groups & sharing',
      topics: [
        t('equalGroups', 'Equal Groups', 'Groups of the same', 'P1'),
        t('sharing', 'Share Equally', 'Fair shares', 'P1'),
      ],
    },
    {
      id: 'measure',
      title: 'Measurement',
      sub: 'Length, time & money',
      topics: [
        t('ruler', 'Length', 'Measure in cm', 'P1 · BA 1D'),
        t('clock', 'Tell Time', 'To 5 minutes', 'P1 · BA 1D'),
        t('money', 'Money', 'Coins & notes', 'P1'),
      ],
    },
    {
      id: 'shapes',
      title: 'Shapes & Position',
      sub: 'Sides, patterns, grids',
      topics: [
        t('shapeSides', 'Sides & Corners', 'Name the shape', 'P1 · BA 1A'),
        t('pattern', 'Patterns', 'What comes next?', 'P1 · BA 1C'),
        t('position', 'Rows & Columns', 'Where is it?', 'BA 1D'),
      ],
    },
    {
      id: 'data',
      title: 'Graphs',
      sub: 'Picture graphs',
      topics: [t('pictureGraph', 'Picture Graphs', 'Read the graph', 'P1 · BA 1B')],
    },
  ],
  2: [
    {
      id: 'numbers',
      title: 'Numbers to 1,000',
      sub: 'Hundreds, tens & ones',
      topics: [
        t('placeValue', 'Place Value', 'Hundreds, tens, ones', 'P2 · BA 2A'),
        t('compare', 'Comparing', 'Use <, > and =', 'P2 · BA 2A'),
        t('numberOrder', '10 & 100 More', 'Number order', 'P2'),
        t('skipCount', 'Skip Counting', 'By 2s to 100s', 'P2'),
        t('oddEven', 'Odd & Even', 'Number properties', 'BA 2C'),
      ],
    },
    {
      id: 'addsub',
      title: 'Add & Subtract',
      sub: 'Within 1,000',
      topics: [
        t('add', 'Addition', 'Within 1,000', 'P2 · BA 2A'),
        t('subtract', 'Subtraction', 'Within 1,000', 'P2 · BA 2B'),
        t('subStrategy', 'Mental Math', 'Smart strategies', 'P2 · BA 2C'),
        t('regroup', 'Stack & Solve', 'Carrying & borrowing', 'P2 · BA 2D'),
        t('missingDigit', 'Missing Digits', 'Digit puzzles', 'BA 2D'),
        t('sentence', 'Word Problems', 'Math in a story', 'P2'),
      ],
    },
    {
      id: 'muldiv',
      title: 'Multiply & Divide',
      sub: '2, 3, 4, 5 & 10 tables',
      topics: [
        t('equalGroups', 'Equal Groups', 'Groups of the same', 'P2'),
        t('multiply', 'Times Tables', '2, 3, 4, 5 & 10', 'P2'),
        t('divide', 'Division', 'Share it equally', 'P2'),
      ],
    },
    {
      id: 'fractions',
      title: 'Fractions',
      sub: 'Halves, thirds, quarters',
      topics: [
        t('fractionPicture', 'Name the Fraction', 'What is shaded?', 'P2'),
        t('fraction', 'Fraction Of', 'Half of, a third of', 'P2'),
        t('compareFractions', 'Compare Fractions', 'Which is bigger?', 'P2'),
      ],
    },
    {
      id: 'measure',
      title: 'Measurement',
      sub: 'Length, mass, money, time',
      topics: [
        t('ruler', 'Use a Ruler', 'Measure in cm', 'P2 · BA 2C'),
        t('measurement', 'Length Units', 'm, cm, ft, in', 'P2 · BA 2C'),
        t('massVolume', 'Mass & Volume', 'kg, g, L, mL', 'P2'),
        t('money', 'Money', 'Dollars & cents', 'P2'),
        t('clock', 'Tell Time', 'To 5 minutes', 'P2'),
        t('duration', 'How Long?', 'Hours & minutes', 'P2'),
      ],
    },
    {
      id: 'shapes',
      title: 'Shapes',
      sub: '2D & 3D shapes',
      topics: [t('shapeSides', 'Shapes', 'Sides, corners, faces', 'P2')],
    },
    {
      id: 'data',
      title: 'Graphs',
      sub: 'Picture graphs',
      topics: [t('pictureGraph', 'Picture Graphs', 'With a key', 'P2')],
    },
    {
      id: 'puzzles',
      title: 'Puzzles',
      sub: 'Think it through',
      topics: [
        t('expression', 'Expressions', 'Parentheses & unknowns', 'BA 2B'),
        t('riddle', 'Number Riddles', 'Use the clues', 'BA 2B'),
        t('shortcut', 'Smart Shortcuts', 'Spot what cancels', 'BA 2C'),
      ],
    },
  ],
  3: [
    {
      id: 'numbers',
      title: 'Numbers to 10,000',
      sub: 'Place value & estimating',
      topics: [
        t('placeValue', 'Place Value', 'Up to thousands', 'P3'),
        t('compare', 'Comparing', 'Use <, > and =', 'P3'),
        t('numberOrder', '100 & 1,000 More', 'Number order', 'P3'),
        t('skipCount', 'Skip Counting', 'By 6s to 50s', 'BA 3A'),
        t('estimate', 'Estimation', 'Round & estimate', 'BA 3D'),
      ],
    },
    {
      id: 'addsub',
      title: 'Add & Subtract',
      sub: 'Within 10,000',
      topics: [
        t('add', 'Addition', 'Within 10,000', 'P3'),
        t('subtract', 'Subtraction', 'Within 10,000', 'P3'),
        t('regroup', 'Stack & Solve', 'Carrying & borrowing', 'P3'),
        t('sentence', 'Word Problems', 'Math in a story', 'P3'),
      ],
    },
    {
      id: 'muldiv',
      title: 'Multiply & Divide',
      sub: '6, 7, 8 & 9 tables and more',
      topics: [
        t('multiply', 'Times Tables', '6, 7, 8, 9 & 1-digit', 'P3 · BA 3B'),
        t('divide', 'Division', 'By 1 digit', 'P3 · BA 3C'),
        t('remainder', 'Remainders', 'What is left over', 'P3 · BA 3C'),
        t('squares', 'Perfect Squares', '1×1, 2×2, 3×3…', 'BA 3B'),
        t('distributive', 'Break It Apart', 'Distributive property', 'BA 3B'),
      ],
    },
    {
      id: 'fractions',
      title: 'Fractions',
      sub: 'Equivalent, compare, add',
      topics: [
        t('fractionPicture', 'Name the Fraction', 'What is shaded?', 'P3 · BA 3D'),
        t('fraction', 'Equivalent Fractions', 'Same amount', 'P3 · BA 3D'),
        t('compareFractions', 'Compare Fractions', 'Which is bigger?', 'P3 · BA 3D'),
        t('addFractions', 'Add & Subtract', 'Same bottoms', 'P3'),
      ],
    },
    {
      id: 'measure',
      title: 'Measurement',
      sub: 'Money, units, time, area',
      topics: [
        t('money', 'Money', 'Totals & change', 'P3'),
        t('massVolume', 'Change Units', 'km, kg, L & more', 'P3 · BA 3C'),
        t('duration', 'How Long?', 'Across the hour', 'P3'),
        t('perimeter', 'Perimeter', 'All the way around', 'P3 · BA 3A'),
        t('area', 'Area', 'Square units', 'P3 · BA 3A'),
      ],
    },
    {
      id: 'shapes',
      title: 'Shapes & Angles',
      sub: 'Classify, angles, lines',
      topics: [
        t('shapeClass', 'What Shape Am I?', 'Classify shapes', 'BA 3A'),
        t('angles', 'Angles', 'Right angles', 'P3'),
        t('lines', 'Lines', 'Parallel & perpendicular', 'P3'),
      ],
    },
    {
      id: 'data',
      title: 'Graphs',
      sub: 'Bar graphs',
      topics: [t('barGraph', 'Bar Graphs', 'Read the graph', 'P3')],
    },
    {
      id: 'puzzles',
      title: 'Puzzles',
      sub: 'Think it through',
      topics: [
        t('variables', 'Find the Unknown', 'Letters for numbers', 'BA 3C'),
        t('multistep', 'Multi-Step', 'Two-step stories', 'P3'),
        t('riddle', 'Number Riddles', 'Use the clues', 'BA 3B'),
      ],
    },
  ],
  4: [
    {
      id: 'numbers',
      title: 'Numbers to 100,000',
      sub: 'Big numbers & factors',
      topics: [
        t('placeValue', 'Place Value', 'Up to 100,000', 'P4'),
        t('rounding', 'Rounding', 'Nearest 10, 100, 1,000', 'P4'),
        t('factors', 'Factors & Multiples', 'What goes into what', 'P4 · BA 4C'),
        t('primes', 'Prime Numbers', 'Only two factors', 'BA 4C'),
        t('exponents', 'Exponents', 'Powers like 2³', 'BA 4A'),
        t('negative', 'Negative Numbers', 'Below zero', 'BA 4C'),
      ],
    },
    {
      id: 'muldiv',
      title: 'Multiply & Divide',
      sub: 'Bigger numbers',
      topics: [
        t('multiply', 'Multiplication', 'By 1 and 2 digits', 'P4 · BA 4A'),
        t('divide', 'Division', 'By 1 digit', 'P4 · BA 4B'),
        t('remainder', 'Remainders', 'What is left over', 'P4 · BA 4B'),
        t('orderOps', 'Order of Operations', '× and ÷ first', 'P4 · BA 4A'),
      ],
    },
    {
      id: 'fractions',
      title: 'Fractions',
      sub: 'Mixed numbers & more',
      topics: [
        t('fraction', 'Mixed Numbers', 'And fractions of a set', 'P4 · BA 4C'),
        t('compareFractions', 'Compare Fractions', 'Related bottoms', 'P4 · BA 4C'),
        t('addFractions', 'Add & Subtract', 'Related bottoms', 'P4 · BA 4D'),
      ],
    },
    {
      id: 'decimals',
      title: 'Decimals',
      sub: 'Tenths & hundredths',
      topics: [
        t('decimalPlace', 'Decimal Place Value', 'Tenths & hundredths', 'P4 · BA 4D'),
        t('decimalConvert', 'Fractions ↔ Decimals', 'Same amount', 'P4 · BA 4D'),
        t('decimalAddSub', 'Add & Subtract', 'Line up the points', 'P4'),
      ],
    },
    {
      id: 'measure',
      title: 'Measurement',
      sub: 'Time, area & angles',
      topics: [
        t('clock24', '24-Hour Clock', 'a.m. and p.m.', 'P4'),
        t('perimeter', 'Perimeter', 'Rectangles & L-shapes', 'P4'),
        t('area', 'Area', 'Length × width', 'P4'),
        t('angles', 'Angles', 'Degrees, turns, compass', 'P4 · BA 4A'),
      ],
    },
    {
      id: 'shapes',
      title: 'Geometry',
      sub: 'Shapes & symmetry',
      topics: [
        t('shapeClass', 'What Shape Am I?', 'Squares, rectangles…', 'P4 · BA 4A'),
        t('symmetry', 'Symmetry', 'Lines of symmetry', 'P4'),
      ],
    },
    {
      id: 'data',
      title: 'Graphs',
      sub: 'Bar graphs',
      topics: [t('barGraph', 'Bar Graphs', 'Bigger scales', 'P4')],
    },
    {
      id: 'puzzles',
      title: 'Puzzles & Logic',
      sub: 'Think it through',
      topics: [
        t('logic', 'Logic', 'Use the clues', 'BA 4B'),
        t('counting', 'Counting', 'How many ways?', 'BA 4B'),
        t('probability', 'Probability', 'How likely?', 'BA 4D'),
        t('multistep', 'Multi-Step', 'Two-step stories', 'P4'),
      ],
    },
  ],
};

export function gradeSections(grade) {
  return (SECTIONS[grade] || SECTIONS[2]).map((s) => ({ ...SECTION_STYLE[s.id], ...s }));
}

export function gradeSection(grade, id) {
  return gradeSections(grade).find((s) => s.id === id);
}

// Every topic a grade practises, for Random Mix.
export function gradeTopics(grade) {
  return [...new Set(gradeSections(grade).flatMap((s) => s.topics.map((x) => x.id)))];
}
