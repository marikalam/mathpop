/**
 * @typedef {Object} ArithmeticProblem
 * @property {number} a - First operand
 * @property {number} b - Second operand
 * @property {'multiply' | 'add' | 'subtract'} op - Operation type
 * @property {string} symbol - Display symbol (×, +, −)
 * @property {number} correct - Expected answer
 */

/**
 * @typedef {Object} SentenceQuestion
 * @property {'sentence'} type - Question type identifier
 * @property {string} text - Full word problem text (e.g., "Julie counts 23 fish in one pond...")
 * @property {number} correct - Expected answer
 * @property {'add' | 'multiply' | 'subtract'} op - Operation required to solve
 * @property {string[]} numbers - Numbers mentioned in the problem (for parsing/hints)
 * @property {'easy' | 'medium' | 'hard'} level - Difficulty level
 */

/**
 * @typedef {ArithmeticProblem | SentenceQuestion} Problem
 */

export const SentenceQuestionTemplates = {
  add: {
    easy: [
      (a, b) => {
        const name = nameA();
        const pron = pronoun();
        return `${name} counts ${a} fish in one pond. ${pron} counts ${b} more fish in another pond. How many fish does ${name} count altogether?`;
      },
      (a, b) => `There are ${a} apples in one basket. There are ${b} apples in another basket. How many apples are there in total?`,
      (a, b) => {
        const name1 = nameA();
        const name2 = nameB();
        return `${name1} has ${a} stickers. ${name2} gives ${name1} ${b} more stickers. How many stickers does ${name1} have now?`;
      },
    ],
    medium: [
      (a, b) => `A store had ${a} items on Monday. On Tuesday, ${b} more items arrived. How many items does the store have now?`,
      (a, b) => {
        const name = nameA();
        const pron = pronoun();
        return `${name} read ${a} pages yesterday. Today, ${pron} read ${b} pages. How many pages has ${name} read in total?`;
      },
      (a, b) => `A garden has ${a} flowers. A gardener plants ${b} more flowers. How many flowers are in the garden now?`,
    ],
    hard: [
      (a, b) => `An auditorium had ${a} seats occupied. After a break, ${b} more people arrived. What is the total number of occupied seats?`,
      (a, b) => `A factory produced ${a} units in the first shift. In the second shift, they produced ${b} units. What is the total production?`,
    ],
  },
  multiply: {
    easy: [
      (a, b) => {
        const name = nameA();
        return `${name} has ${a} packs of stickers. Each pack has ${b} stickers. How many stickers does ${name} have altogether?`;
      },
      (a, b) => `A store has ${a} shelves. Each shelf has ${b} books. How many books are on all the shelves?`,
      (a, b) => `There are ${a} groups of children. Each group has ${b} children. How many children are there in total?`,
    ],
    medium: [
      (a, b) => `A restaurant has ${a} tables. Each table seats ${b} people. How many people can eat at the restaurant?`,
      (a, b) => `A bakery makes ${a} batches of cookies. Each batch has ${b} cookies. How many cookies does the bakery make?`,
      (a, b) => {
        const name = nameA();
        return `${name} buys ${a} boxes of crayons. Each box has ${b} crayons. How many crayons does ${name} have?`;
      },
    ],
    hard: [
      (a, b) => `A warehouse has ${a} shelves. Each shelf holds ${b} boxes. How many boxes can the warehouse store?`,
      (a, b) => `A company has ${a} departments. Each department has ${b} employees. What is the total number of employees?`,
    ],
  },
  subtract: {
    easy: [
      (a, b) => {
        const name = nameA();
        const pron = pronoun();
        return `${name} has ${a} candies. ${pron} eats ${b} candies. How many candies does ${name} have left?`;
      },
      (a, b) => `A tree has ${a} apples. ${b} apples fall off. How many apples are still on the tree?`,
      (a, b) => {
        const name = nameA();
        const pron = pronoun();
        return `${name} had ${a} toys. ${pron} gave away ${b} toys. How many toys does ${name} have now?`;
      },
    ],
    medium: [
      (a, b) => `A store has ${a} items in stock. They sell ${b} items. How many items are left?`,
      (a, b) => `A farmer has ${a} animals. ${b} animals run away. How many animals does the farmer have?`,
      (a, b) => {
        const name = nameA();
        const pron = pronoun();
        return `${name} had ${a} dollars. ${pron} spent ${b} dollars. How much money does ${name} have left?`;
      },
    ],
    hard: [
      (a, b) => `A stadium has ${a} seats. ${b} seats are already taken. How many empty seats are there?`,
      (a, b) => `A library has ${a} books. After lending out ${b} books, how many books remain?`,
    ],
  },
};

function nameA() {
  const names = ['Julie', 'Marcus', 'Sarah', 'Alex', 'Emma', 'Jordan', 'Casey'];
  return names[Math.floor(Math.random() * names.length)];
}

function nameB() {
  const names = ['Julie', 'Marcus', 'Sarah', 'Alex', 'Emma', 'Jordan', 'Casey'];
  return names[Math.floor(Math.random() * names.length)];
}

function pronoun() {
  const pronouns = ['They', 'He', 'She'];
  return pronouns[Math.floor(Math.random() * pronouns.length)];
}
