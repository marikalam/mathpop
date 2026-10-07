// The grade picker. Each grade sets its own number ranges for the core
// operations (Addition, Subtraction, Multiplication, Random Mix) and maps
// to one of the three difficulty tiers that Word Problems, Tell Time and
// Skill Builders are written for. Baby and Pre-K come before school starts:
// they get the tap-and-hear Explore screens and the little-kid games in
// littleLearners.js instead (`early`), and the picker calls them a level
// rather than a grade.
export const GRADES = [
  { id: 'baby', short: 'Baby', label: 'Baby & toddler', color: '#F5A623', tier: 'easy', early: true },
  { id: 'prek', short: 'Pre-K', label: 'Pre-K', color: '#14B8A6', tier: 'easy', early: true },
  { id: 'k', short: 'K', label: 'Kindergarten', color: '#F06F9A', tier: 'easy' },
  { id: '1', short: '1st', label: '1st grade', color: '#F0954F', tier: 'easy' },
  { id: '2', short: '2nd', label: '2nd grade', color: '#2FAE6B', tier: 'medium' },
  { id: '3', short: '3rd', label: '3rd grade', color: '#3B6FEF', tier: 'hard' },
  { id: '4', short: '4th', label: '4th grade', color: '#8E4FD6', tier: 'hard' },
];

export const DEFAULT_GRADE = '2';

export function gradeInfo(id) {
  return GRADES.find((g) => g.id === id) || GRADES.find((g) => g.id === DEFAULT_GRADE);
}

export function gradeTier(id) {
  return gradeInfo(id).tier;
}

// [min, max] for each operand. Subtraction's second number is also capped
// at the first, so answers are never negative.
export const GRADE_RANGES = {
  k: {
    add: [[1, 5], [0, 5]],
    subtract: [[1, 10], [0, 5]],
    multiply: [[1, 3], [1, 3]],
  },
  1: {
    add: [[1, 10], [1, 10]],
    subtract: [[5, 20], [1, 10]],
    multiply: [[1, 5], [1, 5]],
  },
  2: {
    add: [[10, 50], [10, 50]],
    subtract: [[20, 99], [1, 50]],
    multiply: [[2, 5], [1, 10]],
  },
  3: {
    add: [[100, 500], [10, 499]],
    subtract: [[100, 999], [10, 499]],
    multiply: [[2, 10], [2, 10]],
  },
  4: {
    add: [[100, 999], [100, 999]],
    subtract: [[200, 1000], [10, 199]],
    multiply: [[2, 12], [5, 20]],
  },
};

// Which operations each grade practices. Random Mix and Word Problems
// draw from these, so younger grades never see multiplication. Pre-K's
// Random Mix mixes its little-kid games; Baby has no quizzes at all.
export const GRADE_OPS = {
  baby: [],
  prek: ['count', 'shapes', 'colors', 'nextNumber', 'moreFewer'],
  k: ['add', 'subtract'],
  1: ['add', 'subtract'],
  2: ['add', 'subtract'],
  3: ['multiply', 'add', 'subtract'],
  4: ['multiply', 'add', 'subtract'],
};

// The Practice cards on the home page for each grade: core operations
// plus the Skill Builders concepts that fit that grade. Baby's cards are
// all tap-and-hear play, with no right or wrong answers.
export const GRADE_PRACTICE = {
  baby: ['exploreNumbers', 'exploreShapes', 'exploreColors', 'popCount'],
  prek: ['count', 'shapes', 'colors', 'nextNumber', 'moreFewer', 'popCount'],
  k: ['count', 'shapes', 'add', 'subtract', 'compare', 'addStrategy', 'placeValue', 'sentence'],
  1: ['add', 'subtract', 'addStrategy', 'placeValue', 'clock', 'sentence'],
  2: ['add', 'subtract', 'sentence', 'clock', 'measurement', 'skills'],
  3: ['multiply', 'add', 'subtract', 'regroup', 'clock', 'sentence'],
  4: ['multiply', 'bigNumber', 'regroup', 'multistep', 'sentence', 'clock'],
};

export function gradeOps(id) {
  return GRADE_OPS[gradeInfo(id).id];
}

export function gradePractice(id) {
  return GRADE_PRACTICE[gradeInfo(id).id];
}
