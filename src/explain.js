// "Show me how": what MathPop says, step by step, to talk a child through
// one problem, the way a grown-up sitting next to them would. Every step
// is spoken (many kids can't read yet) and shown big on screen.
//
// The grade sections' games write their own steps when they build a
// problem (`explain`, in topics.js, skillBuilders.js and preK.jsx), using
// that problem's numbers. The app's own games (adding, taking away,
// times, sharing, the clock and word problems) are explained here.
//
// Before the child answers, the steps stop at a question so they get to
// finish it themselves. After a wrong answer, they end with the answer.

export function explainSteps(problem, withAnswer) {
  const steps = baseSteps(problem);
  if (!withAnswer) return steps;
  return [...steps, answerStep(problem), 'Now you try it!'];
}

function answerStep(problem) {
  if (problem.explainAnswer) return problem.explainAnswer;
  if (problem.type === 'clock') {
    const { hour, minute } = problem;
    return minute === 0 ? `It's ${hour} o'clock!` : `It's ${hour} ${minute < 10 ? `oh ${minute}` : minute}!`;
  }
  const answer = problem.speechAnswer ?? problem.correct;
  return `The answer is ${typeof answer === 'number' ? fmt(answer) : answer}.`;
}

function baseSteps(problem) {
  if (Array.isArray(problem.explain) && problem.explain.length) return problem.explain;
  if (problem.type === 'sentence') return wordProblemSteps(problem);
  if (problem.type === 'clock') return clockSteps(problem);
  if (problem.op === 'add') return addSteps(problem.a, problem.b);
  if (problem.op === 'subtract') return subtractSteps(problem.a, problem.b);
  if (problem.op === 'multiply') return multiplySteps(problem.a, problem.b);
  if (problem.op === 'divide') return divideSteps(problem.a, problem.b);
  return ['Let’s look at this one together.', 'Read it with me, nice and slow.', 'What do you think the answer is?'];
}

const fmt = (n) => n.toLocaleString('en-US');
const PLACES = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands'];

// Counting along out loud: "5, 6, 7" (never the last number, which is
// the answer).
function countAlong(from, step, times) {
  return Array.from({ length: times }, (_, i) => fmt(from + step * (i + 1))).join(', ');
}

function digitsOf(n) {
  return String(n).split('').reverse().map(Number);
}

// ---------------- Adding ----------------

function addSteps(a, b) {
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  if (small === 0) {
    return [`We're adding zero to ${big}.`, 'Adding zero means adding nothing at all.', `So what is ${big} plus 0?`];
  }
  if (a + b <= 10) {
    return [
      `Let's put ${a} and ${b} together.`,
      a === b ? `Start with ${big}. Keep it in your head.` : `Start with the bigger number, ${big}. Keep it in your head.`,
      small === 1
        ? `Now count up 1 more. What comes right after ${big}?`
        : `Now hold up ${small} fingers and count up one for each finger.`,
      ...(small === 1 ? [] : [`What number do you land on?`]),
    ];
  }
  if (a + b < 20 || (big < 100 && small < 10)) {
    // Make a ten with the first number, like the blocks (AdditionHelp.jsx).
    const onesA = a % 10;
    const need = 10 - onesA;
    if (onesA !== 0 && b % 10 !== 0 && onesA + (b % 10) >= 10) {
      const rest = b - need;
      const ten = a + need;
      if (rest === 0) {
        return [`Here's a trick. ${a} needs ${need} more to make the next ten.`, `And we're adding exactly ${need}!`, 'So which ten do we land on?'];
      }
      return [
        `Here's a trick. Let's make a ten!`,
        `${a} needs ${need} more to get to ${ten}.`,
        `Take ${need} from the ${b}. That leaves ${rest}.`,
        `Now it's an easy one. What is ${ten} plus ${rest}?`,
      ];
    }
    return [
      `Let's start with the bigger number, ${big}.`,
      `Now count up ${small} more on your fingers.`,
      'What number do you land on?',
    ];
  }
  if (big < 100 && a % 10 === 0 && b % 10 === 0) {
    return [`${a} is ${a / 10} tens, and ${b} is ${b / 10} tens.`, `${a / 10} tens plus ${b / 10} tens is ${a / 10 + b / 10} tens.`, `What number is ${a / 10 + b / 10} tens?`];
  }
  if (big < 100 && (a % 10 === 0 || b % 10 === 0)) {
    const round = a % 10 === 0 ? a : b;
    const other = round === a ? b : a;
    const otherTens = Math.floor(other / 10) * 10;
    return [
      `${other} is ${otherTens / 10} ${otherTens === 10 ? 'ten' : 'tens'} and ${other % 10} ones.`,
      `Add the tens first. ${round} plus ${otherTens} is ${round + otherTens}.`,
      `Now put on the ${other % 10} ones. What number is that?`,
    ];
  }
  if (big < 100) {
    const tens = Math.floor(a / 10) * 10 + Math.floor(b / 10) * 10;
    const ones = (a % 10) + (b % 10);
    return [
      `Let's split each number into tens and ones.`,
      `Add the tens first. ${Math.floor(a / 10) * 10} plus ${Math.floor(b / 10) * 10} is ${tens}.`,
      `Now the ones. ${a % 10} plus ${b % 10} is ${ones}.`,
      `Put them back together. What is ${tens} plus ${ones}?`,
    ];
  }
  return columnAddSteps(a, b);
}

// Bigger numbers: stack them and add place by place, starting with the
// ones, carrying a ten to the next place when a place makes 10 or more.
function columnAddSteps(a, b) {
  const da = digitsOf(a);
  const db = digitsOf(b);
  const steps = [`Let's stack ${fmt(a)} on top of ${fmt(b)}, lining up the ones. We start with the ones, on the right.`];
  let carry = 0;
  for (let i = 0; i < 2; i++) {
    const x = da[i] || 0;
    const y = db[i] || 0;
    const sum = x + y + carry;
    const carried = carry ? ' plus the 1 we carried' : '';
    if (sum >= 10) {
      steps.push(`${PLACES[i][0].toUpperCase()}${PLACES[i].slice(1)}: ${x} plus ${y}${carried} is ${sum}. Write the ${sum % 10} and carry the 1.`);
      carry = 1;
    } else {
      steps.push(`${PLACES[i][0].toUpperCase()}${PLACES[i].slice(1)}: ${x} plus ${y}${carried} is ${sum}. Write the ${sum}.`);
      carry = 0;
    }
  }
  steps.push(`Keep going the same way with the ${PLACES[2]}${da.length > 3 ? ' and the rest' : ''}.`);
  steps.push('What number did you make?');
  return steps;
}

// ---------------- Taking away ----------------

function subtractSteps(a, b) {
  if (b === 0) return [`We're taking away zero from ${a}.`, 'Taking away nothing leaves everything still there.', `So what is ${a} take away 0?`];
  if (a === b) return [`We have ${a}, and we take away all ${b} of them.`, 'If you take away everything, how many are left?'];
  if (a <= 10) {
    return b <= 3
      ? [`Let's start at ${a}.`, `Now count back ${b}, one for each finger.`, 'What number do you land on?']
      : [
          `Here's a trick. Think of adding instead.`,
          `Start at ${b} and count up to ${a}. Hold up a finger for each number you say.`,
          'How many fingers are up?',
        ];
  }
  if (a < 100) {
    const onesA = a % 10;
    const tensB = Math.floor(b / 10) * 10;
    const onesB = b % 10;
    if (tensB === 0 && onesB > onesA) {
      const down = a - onesA;
      return [
        `Let's take away ${b} in two little jumps.`,
        `First take away ${onesA}. That gets us to ${down}.`,
        `We still need to take away ${onesB - onesA} more.`,
        `So what is ${down} take away ${onesB - onesA}?`,
      ];
    }
    if (tensB === 0) {
      return [
        `Look at the ones. ${a} has ${onesA} ones.`,
        `Take away ${onesB} ones. ${onesA} take away ${onesB} is ${onesA - onesB}.`,
        `The tens stay the same. So what number is left?`,
      ];
    }
    const afterTens = a - tensB;
    if (onesB === onesA) {
      return [
        `Look at the ones first. Both numbers have ${onesA} ones, so all the ones go away.`,
        `Now the tens. ${Math.floor(a / 10)} tens take away ${tensB / 10} tens.`,
        'How many tens are left, and what number is that?',
      ];
    }
    if (onesB === 0) {
      return [`${b} is ${tensB / 10} tens.`, `Take away ${tensB / 10} tens from ${a}. The ones stay the same.`, 'What number is left?'];
    }
    return [
      `Let's take away ${b} in two parts: the tens, then the ones.`,
      `First take away ${tensB}. ${a} take away ${tensB} is ${afterTens}.`,
      `Now take away the ${onesB} ones.`,
      `What is ${afterTens} take away ${onesB}?`,
    ];
  }
  return columnSubtractSteps(a, b);
}

function columnSubtractSteps(a, b) {
  const da = digitsOf(a);
  const db = digitsOf(b);
  const steps = [`Let's stack ${fmt(a)} on top and ${fmt(b)} underneath, lining up the ones. Start with the ones, on the right.`];
  let borrowed = 0;
  for (let i = 0; i < 2; i++) {
    const place = `${PLACES[i][0].toUpperCase()}${PLACES[i].slice(1)}`;
    const x = da[i] - borrowed;
    const y = db[i] || 0;
    const top = borrowed ? `${da[i]}, now ${x} after we borrowed,` : `${x}`;
    if (x >= y) {
      steps.push(`${place}: ${top} take away ${y} is ${x - y}.`);
      borrowed = 0;
    } else {
      steps.push(`${place}: ${top} is too small to take away ${y}. Borrow 1 from the next place, so it's ${x + 10}.`);
      steps.push(`${x + 10} take away ${y} is ${x + 10 - y}.`);
      borrowed = 1;
    }
  }
  steps.push(`Keep going the same way with the ${PLACES[2]}${da.length > 3 ? ' and the rest' : ''}.`);
  steps.push('What number is left?');
  return steps;
}

// ---------------- Times ----------------

function multiplySteps(a, b) {
  if (a === 0 || b === 0) {
    const other = a === 0 ? b : a;
    return [`Times zero means zero groups, or groups with nothing in them.`, `${other} groups of nothing. How many is that altogether?`];
  }
  if (a === 1 || b === 1) {
    const other = a === 1 ? b : a;
    return [`Times 1 means just one group.`, `One group of ${other}. How many is that?`];
  }
  if (a >= 100 || (a >= 11 && b >= 11)) return bigMultiplySteps(a, b);
  if (a >= 11 || b >= 11) {
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    const tens = Math.floor(big / 10) * 10;
    const ones = big % 10;
    if (ones === 0) {
      return [`${big} is ${big / 10} tens.`, `${small} times ${big / 10} tens. What is ${small} times ${big / 10}, then add a zero?`];
    }
    return [
      `Let's break ${big} into ${tens} and ${ones}.`,
      `${small} times ${tens} is ${small * tens}.`,
      `${small} times ${ones} is ${small * ones}.`,
      `Now put them together. What is ${small * tens} plus ${small * ones}?`,
    ];
  }
  const [g, n] = a <= b ? [a, b] : [b, a]; // fewer groups, more in each
  const intro = `${a} times ${b} means ${a} groups of ${b}.`;
  if (g === 2) return [intro, `Two groups is the same as doubling!`, `What is ${n} plus ${n}?`];
  if (n === 10 || g === 10) {
    const other = n === 10 ? g : n;
    return [intro, `Here's a trick for times 10. Count by tens!`, `Count ${other} tens: ${countAlong(0, 10, Math.min(other - 1, 4))}${other - 1 > 4 ? ', and keep going' : ''}.`, `What do you get after ${other} tens?`];
  }
  if (n === 5 || g === 5) {
    const other = n === 5 ? g : n;
    return [intro, `Let's count by fives. Hold up a finger each time.`, `${countAlong(0, 5, Math.min(other - 1, 5))}${other - 1 > 5 ? ', and keep going' : ''}.`, `What do you say on finger number ${other}?`];
  }
  if (g === 9 || n === 9) {
    const other = g === 9 ? n : g;
    return [intro, `Here's a nine trick. ${other} times 10 is ${other * 10}.`, `Nine is one less than ten, so take away one ${other}.`, `What is ${other * 10} take away ${other}?`];
  }
  if (g <= 4) {
    return [intro, ...(a === g ? [] : [`That's the same as ${g} groups of ${n}.`]), `Let's skip count by ${n}s, ${g} times.`, `${countAlong(0, n, g - 1)}, and one more ${n}.`, `What comes next?`];
  }
  // A fact they know (5 groups) plus the rest.
  const rest = g - 5;
  return [
    intro,
    ...(a === g ? [] : [`That's the same as ${g} groups of ${n}.`]),
    `Let's split it. 5 groups of ${n} is ${5 * n}.`,
    `That leaves ${rest} more ${rest === 1 ? 'group' : 'groups'} of ${n}, which is ${rest * n}.`,
    `What is ${5 * n} plus ${rest * n}?`,
  ];
}

function bigMultiplySteps(a, b) {
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  if (small < 10) {
    const hundreds = Math.floor(big / 100) * 100;
    const tens = Math.floor((big % 100) / 10) * 10;
    const ones = big % 10;
    const parts = [hundreds, tens, ones].filter(Boolean);
    if (parts.length === 1) {
      const unit = hundreds ? 100 : 10;
      const word = hundreds ? 'hundreds' : 'tens';
      return [`${fmt(big)} is ${big / unit} ${word}.`, `${small} times ${big / unit} is ${small * (big / unit)}.`, `So ${small} times ${big / unit} ${word} makes ${small * (big / unit)} ${word}. What number is that?`];
    }
    return [
      `Let's break ${fmt(big)} into parts: ${parts.join(', ')}.`,
      ...parts.map((p) => `${small} times ${p} is ${fmt(small * p)}.`),
      `Now add all the parts together. What do you get?`,
    ];
  }
  const tens = Math.floor(small / 10) * 10;
  const ones = small % 10;
  if (!ones) {
    return [`Here's a trick for times ${small}. Times ${small / 10}, then times 10.`, `${big} times ${small / 10} is ${fmt(big * (small / 10))}.`, `Times 10 puts a zero on the end. What number is that?`];
  }
  return [
    `Let's break ${small} into ${tens} and ${ones}.`,
    `${big} times ${tens} is ${fmt(big * tens)}.`,
    ...(ones ? [`${big} times ${ones} is ${fmt(big * ones)}.`, `What is ${fmt(big * tens)} plus ${fmt(big * ones)}?`] : [`So what is ${big} times ${tens}?`]),
  ];
}

// ---------------- Sharing ----------------

function divideSteps(a, b) {
  if (b === 1) return [`Divided by 1 means one group gets everything.`, `So how many are in that one group?`];
  if (a === 0) return [`We have nothing to share.`, `So how many does each group get?`];
  if (a === b) return [`We share ${a} into ${b} groups.`, `Each group gets one at a time, and they all run out together.`, 'How many does each group get?'];
  const q = a / b;
  return [
    `${a} divided by ${b} means sharing ${a} into ${b} equal groups.`,
    `Here's a trick. Think about times! How many ${b}s make ${a}?`,
    q <= 6 ? `Count by ${b}s: ${countAlong(0, b, q - 1)}, and then ${a}.` : `Count by ${b}s until you get to ${a}. Put up a finger for each one.`,
    `How many ${b}s did you count?`,
  ];
}

// ---------------- The clock ----------------

const CLOCK_MARK = (m) => (m === 0 ? 12 : m / 5);

function clockSteps({ hour, minute }) {
  const next = hour === 12 ? 1 : hour + 1;
  if (minute === 0) {
    return [
      'A clock has a short hand and a long hand.',
      `The short hand tells the hour. It points right at the ${hour}.`,
      `The long hand points straight up at the 12. That means o'clock.`,
      'So what time is it?',
    ];
  }
  const steps = [
    `The short hand tells the hour. It's between the ${hour} and the ${next}.`,
    `It hasn't reached the ${next} yet, so the hour is still ${hour}.`,
  ];
  if (minute % 5 === 0) {
    const mark = CLOCK_MARK(minute);
    steps.push(`The long hand tells the minutes. It points at the ${mark}.`);
    steps.push(mark === 1 ? 'Each number on the clock is 5 minutes.' : `Count by fives up to the ${mark}: ${countAlong(0, 5, mark - 1)}, and one more five.`);
  } else {
    const before = minute - (minute % 5);
    const mark = CLOCK_MARK(before);
    steps.push(`The long hand is ${minute % 5} little ${minute % 5 === 1 ? 'mark' : 'marks'} past the ${mark}.`);
    steps.push(`Counting by fives to the ${mark} gives ${before}. Then count on ${minute % 5} more.`);
  }
  steps.push('So what time is it?');
  return steps;
}

// ---------------- Word problems ----------------

function wordProblemSteps({ op, numbers: [a, b] }) {
  if (op === 'add') {
    return [
      `The story has ${a} and ${b}, and asks how many in all. Putting together is adding!`,
      ...addSteps(a, b),
    ];
  }
  if (op === 'subtract') {
    return [
      `The story starts with ${a}, and then ${b} go away. That's taking away!`,
      ...subtractSteps(a, b),
    ];
  }
  return [
    `The story has ${a} groups, with ${b} in each group. Same-size groups means times!`,
      ...multiplySteps(a, b).slice(1),
  ];
}
