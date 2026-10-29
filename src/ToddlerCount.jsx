import { useState } from 'react';
import { Hand, Speaker, Thing } from './Drawings.jsx';
import { JA_NUMBERS, NUMBER_WORDS } from './preK.jsx';
import { playCorrectChime, speak, speakInLanguage } from './sound.js';

// The toddler counting game (preK.jsx's "count"): tap each thing to count
// it - it hops, gets its number and the number is said out loud - and the
// answers open once every one is counted. A right answer ends with the
// things counting themselves and a hand holding up that many fingers.

// The things in rows, like dots on a dice: 5 is 3 and 2, 8 is 4 and 4.
function rows(n) {
  if (n <= 3) return [n];
  const top = Math.ceil(n / 2);
  return [top, n - top];
}

function thingSize(n) {
  const across = rows(n)[0];
  return across <= 2 ? 104 : across === 3 ? 88 : across === 4 ? 70 : 58;
}

function sayNumber(k, lang) {
  if (lang === 'ja') speakInLanguage(JA_NUMBERS[k], 'ja-JP');
  else speak(NUMBER_WORDS[k]);
}

function thingOf(problem) {
  // A problem saved before the drawings (a mistake to fix) has an emoji.
  return problem.countThing || problem.countEmoji;
}

function Rows({ n, render }) {
  let i = 0;
  return rows(n).map((count, r) => (
    <span className="toddler-row" key={r}>
      {Array.from({ length: count }, () => render(i++))}
    </span>
  ));
}

export function CountBoard({ problem, color, onCounted, onHear }) {
  const n = problem.countN;
  // The number each thing got, in the order they were tapped.
  const [numbers, setNumbers] = useState({});
  const counted = Object.keys(numbers).length;
  const size = thingSize(n);

  function tap(i) {
    if (numbers[i]) {
      sayNumber(numbers[i], problem.lang);
      return;
    }
    const k = counted + 1;
    setNumbers((prev) => ({ ...prev, [i]: k }));
    sayNumber(k, problem.lang);
    if (navigator.vibrate) navigator.vibrate(12);
    if (k === n) onCounted();
  }

  return (
    <div
      className="problem-card toddler-board"
      style={{ background: color }}
      role="group"
      aria-label={problem.speech || problem.prompt}
      onClick={(e) => {
        if (!e.target.closest('button')) onHear();
      }}
    >
      <span className="toddler-rows" style={{ '--across': rows(n)[0] }}>
        <Rows
          n={n}
          render={(i) => (
            <button
              key={`${i}-${numbers[i] || 0}`}
              className={`toddler-thing${numbers[i] ? ' toddler-thing-counted' : ''}`}
              style={{ '--size': `${size}px` }}
              onClick={() => tap(i)}
              aria-label={numbers[i] ? String(numbers[i]) : problem.lang === 'ja' ? 'かぞえる' : 'Count this one'}
            >
              <Thing id={thingOf(problem)} size={size} />
              {numbers[i] && <span className="toddler-badge">{numbers[i]}</span>}
            </button>
          )}
        />
      </span>
      <span className="toddler-chip">
        <Speaker size={20} color="#3b6fef" />
        {counted === n
          ? problem.lang === 'ja'
            ? `${JA_NUMBERS[n]}！ いくつ かな？`
            : `${NUMBER_WORDS[n][0].toUpperCase()}${NUMBER_WORDS[n].slice(1)}! Now tap the number.`
          : problem.lang === 'ja'
            ? 'ひとつずつ タップして かぞえよう'
            : 'Tap each one to count'}
      </span>
    </div>
  );
}

// Said with the chime when the count is right: "One, two, three! Three
// strawberries! Can you hold up three fingers?"
export function sayCountCelebration(problem) {
  playCorrectChime();
  const n = problem.countN;
  setTimeout(() => {
    if (problem.lang === 'ja') {
      speakInLanguage(`${JA_NUMBERS.slice(1, n + 1).join('、')}！ ${problem.speechAnswer}！ ゆびで ${JA_NUMBERS[n]}、みせてくれる？`, 'ja-JP');
      return;
    }
    const [one, many] = problem.countName || ['', ''];
    const counting = NUMBER_WORDS.slice(1, n + 1).join(', ');
    const word = NUMBER_WORDS[n];
    speak(`${counting}! ${word[0].toUpperCase()}${word.slice(1)} ${n === 1 ? one : many}! Can you hold up ${word} ${n === 1 ? 'finger' : 'fingers'}?`);
  }, 300);
}

export function CountCelebration({ problem, color }) {
  const n = problem.countN;
  const size = thingSize(n);
  const hands = n <= 5 ? [n] : [5, n - 5];
  return (
    <>
      <div className="problem-card toddler-board toddler-celebrate" style={{ background: color }}>
        <span className="toddler-confetti" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} />
          ))}
        </span>
        <span className="toddler-rows" style={{ '--across': rows(n)[0] }}>
          <Rows
            n={n}
            render={(i) => (
              <span key={i} className="toddler-thing toddler-thing-dance" style={{ '--size': `${size}px`, '--i': i }}>
                <Thing id={thingOf(problem)} size={size} />
                <span className="toddler-badge toddler-badge-below">{i + 1}</span>
              </span>
            )}
          />
        </span>
      </div>
      <div className="toddler-fingers">
        <span className="toddler-fingers-number">{n}</span>
        <span className="toddler-hands">
          {hands.map((f, i) => (
            <Hand key={i} fingers={f} size={hands.length > 1 ? 76 : 96} />
          ))}
        </span>
        <span className="toddler-fingers-text">
          {problem.lang === 'ja' ? `ゆびで ${n}、みせて！` : `Show me ${n} ${n === 1 ? 'finger' : 'fingers'}!`}
        </span>
      </div>
    </>
  );
}
