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
  return `The answer is ${problem.speechAnswer ?? problem.correct}.`;
}

function baseSteps(problem) {
  if (Array.isArray(problem.explain) && problem.explain.length) return problem.explain;
  return ['Let’s look at this one together.', 'Read it with me, nice and slow.', 'What do you think the answer is?'];
}
