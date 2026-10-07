// The grades a player can be set to. Each grade sets its own number
// ranges for the core operations (Addition, Subtraction, Multiplication,
// Division, Random Mix) and maps to one of the three difficulty tiers that
// Word Problems, Tell Time and the skill games are written for. `sg` is
// the matching Singapore school year.
export const GRADES = [
  { id: 'p', short: 'Pre-K', label: 'Pre-K (ages 2–5)', color: '#F59E0B', tier: 'easy', sg: 'Nursery' },
  { id: 'k', short: 'K', label: 'Kindergarten', color: '#F06F9A', tier: 'easy', sg: 'K2' },
  { id: '1', short: '1st', label: '1st grade', color: '#F0954F', tier: 'easy', sg: 'Primary 1' },
  { id: '2', short: '2nd', label: '2nd grade', color: '#2FAE6B', tier: 'medium', sg: 'Primary 2' },
  { id: '3', short: '3rd', label: '3rd grade', color: '#3B6FEF', tier: 'hard', sg: 'Primary 3' },
  { id: '4', short: '4th', label: '4th grade', color: '#8E4FD6', tier: 'hard', sg: 'Primary 4' },
];

export const DEFAULT_GRADE = '2';

export function gradeInfo(id) {
  return GRADES.find((g) => g.id === id) || GRADES.find((g) => g.id === DEFAULT_GRADE);
}

export function gradeTier(id) {
  return gradeInfo(id).tier;
}

// What each grade practices follows Singapore math (the Primary
// Mathematics syllabus): Pre-K (nursery, ages 2-5) counting, numbers,
// shapes, sizes and patterns (preK.jsx); Kindergarten (K2) number bonds and adding and
// taking away within 10; Primary 1 number bonds to 20, making ten, and
// adding and subtracting within 100; Primary 2 numbers to 1,000, the 2, 3,
// 4, 5 and 10 times tables with multiplying and dividing, and halves,
// thirds and quarters; Primary 3 numbers to 10,000, the 6, 7, 8 and 9
// times tables, multiplying and dividing by one digit, and equivalent
// fractions; Primary 4 numbers to 100,000, factors and multiples,
// multiplying by two digits, and fractions of a set and mixed numbers.
// Word problems (the stories Singapore math draws as bar models) come in
// every grade.

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// The two numbers for one problem of `op` at a grade: [a, b] for a + b,
// a − b (never negative), a × b and a ÷ b (always comes out even).
export function gradeOperands(id, op) {
  const g = gradeInfo(id).id;
  if (op === 'add') {
    if (g === 'p') return [randInt(1, 3), randInt(1, 2)];
    if (g === 'k') return [randInt(1, 5), randInt(0, 5)];
    if (g === '1') return [randInt(2, 60), randInt(1, 39)];
    if (g === '2') return [randInt(100, 700), randInt(10, 299)];
    if (g === '3') return [randInt(1000, 7999), randInt(100, 1999)];
    return [randInt(10000, 79999), randInt(1000, 19999)];
  }
  if (op === 'subtract') {
    let a;
    let b;
    if (g === 'p' || g === 'k') [a, b] = [randInt(2, 10), randInt(0, 5)];
    else if (g === '1') [a, b] = [randInt(11, 99), randInt(1, 40)];
    else if (g === '2') [a, b] = [randInt(100, 999), randInt(10, 499)];
    else if (g === '3') [a, b] = [randInt(1000, 9999), randInt(100, 3999)];
    else [a, b] = [randInt(10000, 99999), randInt(1000, 39999)];
    return [a, Math.min(a, b)];
  }
  if (op === 'multiply') {
    if (g === 'p' || g === 'k' || g === '1') return [randInt(1, 3), randInt(1, 3)];
    if (g === '2') return [pick([2, 3, 4, 5, 10]), randInt(1, 10)];
    if (g === '3') return Math.random() < 0.6 ? [pick([6, 7, 8, 9]), randInt(1, 10)] : [randInt(12, 99), randInt(2, 9)];
    return Math.random() < 0.5 ? [randInt(100, 999), randInt(2, 9)] : [randInt(11, 99), randInt(11, 39)];
  }
  // divide: the dividend is a times-table answer, so it comes out even.
  if (g === 'p' || g === 'k' || g === '1') {
    const d = randInt(1, 3);
    return [d * randInt(1, 3), d];
  }
  if (g === '2') {
    const d = pick([2, 3, 4, 5, 10]);
    return [d * randInt(1, 10), d];
  }
  if (g === '3') {
    const d = randInt(2, 9);
    return [d * randInt(2, 12), d];
  }
  const d = randInt(2, 9);
  return [d * randInt(12, 120), d];
}

// Which operations each grade practices. Random Mix draws from these, so
// younger grades never see times tables they haven't learned.
export const GRADE_OPS = {
  // Pre-K's Random Mix mixes its picture games instead (App.jsx).
  p: ['add'],
  k: ['add', 'subtract'],
  1: ['add', 'subtract'],
  2: ['add', 'subtract', 'multiply', 'divide'],
  3: ['multiply', 'divide', 'add', 'subtract'],
  4: ['multiply', 'divide', 'add', 'subtract'],
};

// The six Practice cards on the home page for each grade.
export const GRADE_PRACTICE = {
  p: ['count', 'findNumber', 'shapes', 'bigSmall', 'moreFewer', 'pattern'],
  k: ['numberBond', 'add', 'subtract', 'compare', 'placeValue', 'sentence'],
  1: ['numberBond', 'addStrategy', 'add', 'subtract', 'clock', 'sentence'],
  2: ['add', 'subtract', 'multiply', 'divide', 'fraction', 'sentence'],
  3: ['multiply', 'divide', 'regroup', 'fraction', 'clock', 'sentence'],
  4: ['multiply', 'divide', 'factors', 'fraction', 'bigNumber', 'multistep'],
};

export function gradeOps(id) {
  return GRADE_OPS[gradeInfo(id).id];
}

export function gradePractice(id) {
  return GRADE_PRACTICE[gradeInfo(id).id];
}
