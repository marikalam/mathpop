// Builds many problems of every practice game and checks each one's
// spoken "Show me how" walkthrough (explain.js): present, short enough,
// free of symbols the voice can't read, and not giving the answer away
// before the child has tried.
//   node scripts/check-explain.mjs [conceptId ...]
import { build } from 'esbuild';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Inside node_modules so the bundle can still import react.
mkdirSync('node_modules/.cache', { recursive: true });
const dir = mkdtempSync(join('node_modules/.cache', 'explain-'));
const out = join(dir, 'bundle.mjs');
await build({
  stdin: {
    contents: `
      export { BUILDERS as BUILDERS_FOR_CHECK, buildSkillProblem } from './src/skillBuilders.js';
      export { explainSteps } from './src/explain.js';
      export { buildProblem } from './src/problems.js';
    `,
    resolveDir: process.cwd(),
    loader: 'js',
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  jsx: 'automatic',
  loader: { '.js': 'jsx' },
  external: ['react', 'react/jsx-runtime', '@capacitor/core'],
  logLevel: 'error',
});
const m = await import(pathToFileURL(resolve(out)).href);
rmSync(dir, { recursive: true, force: true });

const only = process.argv.slice(2);
const GRADES = ['p', 'k', '1', '2', '3', '4'];
const TIERS = ['easy', 'medium', 'hard'];
// Symbols the voice reads badly or not at all. Spell them out instead.
const BAD = /[×÷−<>=²³⁴⁵⁶√°%/*^_#@&|{}[\]]|\p{Extended_Pictographic}/u;
const errors = new Map();
const note = (id, msg) => {
  if (!errors.has(id)) errors.set(id, new Set());
  if (errors.get(id).size < 4) errors.get(id).add(msg);
};

function check(id, problem) {
  if (problem.type === 'skill' && !Array.isArray(problem.explain)) return note(id, 'no explain steps');
  const steps = m.explainSteps(problem, false);
  const after = m.explainSteps(problem, true);
  if (!Array.isArray(steps) || steps.length < 2) return note(id, `needs at least 2 steps: ${JSON.stringify(steps)}`);
  if (steps.length > 8) note(id, `too many steps (${steps.length})`);
  for (const s of [...steps, ...after]) {
    if (typeof s !== 'string' || !s.trim()) note(id, `empty step`);
    else {
      if (BAD.test(s)) note(id, `symbol in: "${s}"`);
      if (s.split(/\s+/).length > 28) note(id, `long sentence: "${s}"`);
      if (/undefined|NaN|\[object/.test(s)) note(id, `broken text: "${s}"`);
    }
  }
  if (after.length <= steps.length) note(id, 'after-answer version adds nothing');
  // Giving the answer away before the child tries (only checked for
  // bigger numbers that aren't in the question itself).
  const ans = problem.correct;
  const asked = `${problem.prompt || ''} ${problem.speech || ''} ${problem.text || ''}`;
  if (typeof ans === 'number' && Math.abs(ans) >= 11) {
    const words = [String(ans), ans.toLocaleString('en-US')];
    const re = new RegExp(`(^|[^0-9.,])(${words.map((w) => w.replace(/[.,]/g, '\\$&')).join('|')})(?![0-9]|[.,][0-9])`);
    if (!re.test(asked) && steps.some((s) => re.test(s))) note(id, `gives away the answer ${ans}: ${JSON.stringify(steps)}`);
  }
  const last = steps[steps.length - 1];
  if (!/\?\s*$/.test(last)) note(id, `last step should ask the child: "${last}"`);
}

const ids = Object.keys(m.BUILDERS_FOR_CHECK).filter((id) => !only.length || only.includes(id));
for (const id of ids) {
  for (const grade of GRADES) for (const tier of TIERS) for (let i = 0; i < 15; i++) {
    let p;
    try {
      p = m.buildSkillProblem(id, tier, grade);
    } catch (e) {
      note(id, `builder threw (${grade}/${tier}): ${e.message}`);
      continue;
    }
    check(id, p);
  }
}
for (const mode of ['add', 'subtract', 'multiply', 'divide', 'clock', 'sentence']) {
  if (only.length && !only.includes(mode)) continue;
  for (const grade of GRADES) for (let i = 0; i < 40; i++) {
    let p;
    try {
      p = m.buildProblem(mode, grade);
    } catch {
      continue; // that grade doesn't play this operation
    }
    check(mode, p);
  }
}

for (const [id, msgs] of errors) console.log(`✗ ${id}\n  ${[...msgs].join('\n  ')}`);
console.log(errors.size ? `\n${errors.size} game(s) need work` : `All ${ids.length} games' walkthroughs look good`);
process.exit(errors.size ? 1 : 0);
