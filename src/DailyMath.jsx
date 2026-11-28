import { useEffect, useRef, useState } from 'react';
import Pip from './Pip.jsx';
import { Confetti } from './Celebrate.jsx';
import WritePad from './WritePad.jsx';
import { NumPad } from './gameKit.jsx';
import { nearMisses } from './ops.js';
import { playCorrectChime, playIncorrectBuzz, playStickerPick, playStickerStick, speak } from './sound.js';
import { LEVELS, SHEETS_A_DAY, STEPS, clock, dailyFor, finishSheet, goalSeconds, levelOf, makeSheet, setStep, stepName } from './dailyMath.js';

// Daily Math (dailyMath.js): the sheet, the home page card and the
// grown-ups' card.

const isDots = (t) => /^●+$/.test(t);
const sayQ = (q) => (isDots(q.text) ? 'How many dots?' : q.text.includes('?') ? q.text.replace('?', 'what') : `${q.text} equals what?`);
const showQ = (q) => (q.text.includes('?') ? q.text : `${q.text} = ?`);

function useDaily(id, grade) {
  const [d, setD] = useState(() => dailyFor(id, grade));
  useEffect(() => {
    const f = () => setD(dailyFor(id, grade));
    f();
    window.addEventListener('mathpop-daily-changed', f);
    return () => window.removeEventListener('mathpop-daily-changed', f);
  }, [id, grade]);
  return d;
}

function Dots({ done }) {
  return (
    <span className="dm-dots" aria-label={`${done} of ${SHEETS_A_DAY} sheets today`}>
      {Array.from({ length: SHEETS_A_DAY }, (_, i) => (
        <i key={i} className={i < done ? 'dm-dot-on' : ''} />
      ))}
    </span>
  );
}

// The home page card: the step, today's sheets, Start.
export function DailyHomeCard({ playerId, grade, onStart }) {
  const d = useDaily(playerId, grade);
  const finished = d.done >= SHEETS_A_DAY;
  return (
    <button type="button" className={`dm-home${finished ? ' dm-home-done' : ''}`} onClick={onStart}>
      <span className="dm-home-top">
        <b>Daily Math</b>
        <Dots done={Math.min(d.done, SHEETS_A_DAY)} />
      </span>
      <span className="dm-home-level">
        Level {levelOf(d.step).n}: {levelOf(d.step).name}
      </span>
      <span className="dm-home-step">
        Step {d.step + 1}: {stepName(d.step)}
      </span>
      <span className="dm-home-go">{finished ? 'All 3 done today! Tap for an extra sheet' : `Sheet ${d.done + 1} of ${SHEETS_A_DAY} today · Start`}</span>
    </button>
  );
}

// One sheet: the questions one at a time (typed, written or picked, as the
// player answers everywhere), a clock against the goal time, then fixing
// the ones missed, then the result.
export function DailySheet({ playerId, grade, answerMode, onExit, onDone }) {
  const d = useDaily(playerId, grade);
  const [step] = useState(d.step);
  const [qs] = useState(() => makeSheet(step));
  const [i, setI] = useState(0);
  const [value, setValue] = useState('');
  const [tries, setTries] = useState(0);
  const [missed, setMissedState] = useState([]);
  const missedRef = useRef([]);
  const setMissed = (list) => {
    missedRef.current = list;
    setMissedState(list);
  };
  const [show, setShow] = useState(null);
  const [phase, setPhase] = useState('go'); // go | fix | result
  const [fixAt, setFixAt] = useState(0);
  const [result, setResult] = useState(null);
  const [secs, setSecs] = useState(0);
  const startRef = useRef(Date.now());
  const goal = goalSeconds(step);
  const little = grade === 'p' || grade === 'k';
  const q = phase === 'fix' ? missed[fixAt] : qs[i];
  const pickMode = answerMode === 'choice' || isDots(q?.text || '');
  const [choices, setChoices] = useState([]);

  useEffect(() => {
    if (phase !== 'go') return undefined;
    const t = setInterval(() => setSecs((Date.now() - startRef.current) / 1000), 250);
    return () => clearInterval(t);
  }, [phase]);
  useEffect(() => {
    if (!q) return;
    setChoices([q.answer, ...nearMisses(q.answer, 3)].sort(() => Math.random() - 0.5));
    if (little || isDots(q.text)) speak(sayQ(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, fixAt, phase]);

  function next() {
    setValue('');
    setTries(0);
    setShow(null);
    if (phase === 'fix') {
      if (fixAt + 1 < missedRef.current.length) setFixAt(fixAt + 1);
      else end();
      return;
    }
    if (i + 1 < qs.length) setI(i + 1);
    else {
      const took = (Date.now() - startRef.current) / 1000;
      setSecs(took);
      const m = missedRef.current;
      if (m.length) {
        setPhase('fix');
        setFixAt(0);
        speak(`Now let's fix the ${m.length === 1 ? 'one' : m.length} you missed.`);
      } else end(took);
    }
  }
  function end(took = secs) {
    const right = qs.length - missedRef.current.length;
    const r = finishSheet(playerId, grade, { right, of: qs.length, secs: took });
    setResult({ ...r, right, of: qs.length, secs: took, from: step });
    setPhase('result');
    onDone?.(right, qs.length);
    playStickerStick();
    // A passed step gets a fanfare: chimes, then the sticker sound.
    if (r.result === 'up') {
      setTimeout(playCorrectChime, 250);
      setTimeout(playCorrectChime, 550);
      setTimeout(playStickerPick, 900);
      setTimeout(playStickerStick, 1200);
    } else if (r.result === 'great') setTimeout(playCorrectChime, 250);
    const line = {
      up: r.newLevel ? `New level! Level ${levelOf(r.step).n}: ${levelOf(r.step).name}! First up: ${stepName(r.step)}.` : `Step mastered! On to step ${r.step + 1}: ${stepName(r.step)}!`,
      great: 'Great sheet! One more great sheet to move up a step.',
      slow: `All right! Next time a little faster to move up. The goal is ${clock(r.goal)}.`,
      again: "Good practice! Let's do this step again.",
      down: "Let's go back one step and make it easy again.",
    }[r.result];
    speak(line);
  }
  function answer(n) {
    if (show || !q) return;
    if (Number(n) === q.answer) {
      playCorrectChime();
      next();
      return;
    }
    playIncorrectBuzz();
    if (phase === 'fix') {
      setValue('');
      setShow(`${showQ(q).replace('?', String(q.answer))}`);
      speak(`${sayQ(q).replace(' what', '')} ${q.answer}. Try it!`.replace('equals', 'is'));
      setTimeout(() => setShow(null), 1800);
      return;
    }
    if (tries === 0) {
      setTries(1);
      setValue('');
      speak('Try again!');
      return;
    }
    if (!missedRef.current.includes(q)) setMissed([...missedRef.current, q]);
    setShow(showQ(q).replace('?', String(q.answer)));
    setTimeout(next, 1800);
  }

  if (phase === 'result' && result) {
    const titles = { up: result.newLevel ? `New level: ${levelOf(result.step).name}!` : 'Step mastered!', great: 'Great sheet!', slow: 'All right!', again: 'Good practice!', down: 'Back one step' };
    const done = d.done;
    return (
      <div className="game game-pz dm-sheet">
        {result.result === 'up' && <Confetti pieces={result.newLevel ? 140 : 90} />}
        {result.result === 'up' && result.newLevel && <DelayedConfetti />}
        {result.result === 'great' && <Confetti pieces={30} />}
        <div className={`dm-result${result.result === 'up' ? ' dm-win' : ''}${result.newLevel ? ' dm-win-level' : ''}`}>
          {result.result === 'up' ? (
            <>
              {result.newLevel ? <Trophy /> : null}
              <div className="dm-stamp">
                <b>PASSED!</b>
                <span>
                  Step {result.from + 1}: {stepName(result.from)}
                </span>
              </div>
              <div className="dm-stars" aria-hidden="true">
                {[0, 1, 2].map((k) => (
                  <Star key={k} delay={0.35 + k * 0.25} />
                ))}
              </div>
              {!result.newLevel && <Pip size={88} mood="cheer" className="dm-pip-dance" />}
            </>
          ) : (
            <Pip size={96} mood="wave" />
          )}
          <h2>{titles[result.result]}</h2>
          {result.result === 'great' && (
            <div className="dm-toward" aria-label="1 of 2 great sheets to pass this step">
              <span className="dm-toward-on">
                <StarIcon />
              </span>
              <span>
                <StarIcon />
              </span>
              <small>1 of 2 great sheets to pass</small>
            </div>
          )}
          <p className="dm-score">
            {result.right} of {result.of} right the first time · {clock(result.secs)} <small>(goal {clock(result.goal)})</small>
          </p>
          <p className="dm-why">
            {result.result === 'up'
              ? result.newLevel
                ? `You finished level ${levelOf(result.from).n}, ${levelOf(result.from).name}. Level ${levelOf(result.step).n} starts with ${stepName(result.step)}.`
                : `Next: step ${result.step + 1}, ${stepName(result.step)}.`
              : result.result === 'great'
                ? 'One more great sheet like this to move up a step.'
                : result.result === 'slow'
                  ? 'To move up: 18 or more right, inside the goal time, twice in a row.'
                  : result.result === 'down'
                    ? `Step ${result.step + 1}: ${stepName(result.step)}. Easy wins, then up again!`
                    : 'Same step next time. Every sheet makes it easier.'}
          </p>
          <Dots done={Math.min(done, SHEETS_A_DAY)} />
          <p className="dm-why">{done >= SHEETS_A_DAY ? 'All 3 sheets done today! See you tomorrow.' : `${done} of ${SHEETS_A_DAY} sheets today.`}</p>
          <div className="dm-actions">
            {done < SHEETS_A_DAY && (
              <button type="button" className="mi-sail" onClick={() => onExit('again')}>
                Next sheet
              </button>
            )}
            <button type="button" className="bakery-btn" onClick={() => onExit('home')}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (!q) return null;
  return (
    <div className="game game-pz dm-sheet">
      <div className="dm-top">
        <span className="pz-level">
          Level {levelOf(step).n} · Step {step + 1}
        </span>
        <span className="dm-name">{stepName(step)}</span>
      </div>
      <div className="dm-bar">
        <span>{phase === 'fix' ? `Fixing ${fixAt + 1} of ${missed.length}` : `${i + 1} of ${qs.length}`}</span>
        <span className="dm-progress">
          <i style={{ width: `${((phase === 'fix' ? qs.length : i) / qs.length) * 100}%` }} />
        </span>
      </div>
      {phase === 'go' ? (
        <BigTimer secs={secs} goal={goal} />
      ) : (
        <p className="dm-fixnote">Fixing time: no clock. Take your time!</p>
      )}
      {q.review && !show && <span className="dm-review">Review</span>}
      <button type="button" className={`dm-q${isDots(q.text) ? ' dm-q-dots' : ''}`} onClick={() => speak(sayQ(q))}>
        {show || (isDots(q.text) ? q.text : showQ(q))}
      </button>
      {tries > 0 && !show && phase === 'go' && <p className="dm-note">Not quite. Try again!</p>}
      {pickMode ? (
        <div className="mi-choices">
          {choices.map((n) => (
            <button key={n} type="button" className="mi-choice dm-choice" disabled={Boolean(show)} onClick={() => answer(n)}>
              {n}
            </button>
          ))}
        </div>
      ) : answerMode === 'write' ? (
        <WritePad key={`${phase}-${i}-${fixAt}-${tries}`} onSubmit={(n) => answer(n)} />
      ) : (
        <NumPad value={value} onChange={setValue} onSubmit={() => answer(value)} max={5} disabled={Boolean(show)} />
      )}
    </div>
  );
}

// Players & grades: each player's step, today's sheets and the last few
// sheets; a grown-up (through the gate) can move a player to another step.
export function DailyParentCard({ players, gated }) {
  const [, setN] = useState(0);
  useEffect(() => {
    const f = () => setN((n) => n + 1);
    window.addEventListener('mathpop-daily-changed', f);
    return () => window.removeEventListener('mathpop-daily-changed', f);
  }, []);
  return (
    <section className="sgm-card dm-card" aria-labelledby="dm-title">
      <div className="sgm-head">
        <h3 id="dm-title">Daily Math</h3>
        <p>
          3 sheets of 20 a day, on {STEPS.length} small steps in {LEVELS.length} levels (counting, adding, taking away, bigger numbers, times tables, dividing,
          big multiplying and dividing). Two great sheets in a row (18 of 20 right, inside the goal time) move up a step; two rough ones move back a step.
          Times tables start after adding and taking away with bigger numbers. Each sheet has 2 review questions, and missed questions are fixed at the end.
        </p>
      </div>
      {players.map((p) => {
        const d = dailyFor(p.id, p.grade);
        return (
          <div key={p.id} className="pt-row">
            <div className="pt-who">
              <b>{p.name}</b>
              <small>
                Level {levelOf(d.step).n} ({levelOf(d.step).name}) · Step {d.step + 1} of {STEPS.length}: {stepName(d.step)} · {Math.min(d.done, SHEETS_A_DAY)} of{' '}
                {SHEETS_A_DAY} today
              </small>
            </div>
            {d.log.length > 0 && (
              <div className="dm-log">
                {d.log.slice(-5).reverse().map((s, k) => (
                  <span key={k} className={s.right >= s.of - 1 && s.secs <= s.goal ? 'dm-log-good' : ''}>
                    {s.right}/{s.of} · {clock(s.secs)}
                  </span>
                ))}
              </div>
            )}
            <label className="dm-move">
              <span>Move to step</span>
              <select
                value={d.step}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  gated(() => setStep(p.id, p.grade, v));
                }}
              >
                {LEVELS.map(([first, name], li) => (
                  <optgroup key={name} label={`Level ${li + 1}: ${name}`}>
                    {STEPS.slice(first, LEVELS[li + 1]?.[0] ?? STEPS.length).map((st, j) => (
                      <option key={first + j} value={first + j}>
                        {first + j + 1}. {st[0]}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>
        );
      })}
    </section>
  );
}

// The clock on a sheet: big numbers and a bar that fills toward the goal
// time, green, then yellow, then orange near the goal, red when over.
function BigTimer({ secs, goal }) {
  const k = secs / goal;
  const state = k >= 1 ? 'over' : k >= 0.85 ? 'close' : k >= 0.6 ? 'mid' : 'ok';
  const left = Math.max(0, goal - secs);
  return (
    <div className={`dm-timer dm-t-${state}`} role="timer" aria-label={`Time ${clock(secs)}, goal ${clock(goal)}`}>
      <svg className="dm-timer-icon" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
        <circle cx="12" cy="13" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
        <path d="M12 13V8.5M12 13l3 2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M9.5 2.5h5M12 2.5v2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <div className="dm-timer-main">
        <div className="dm-timer-row">
          <b>{clock(secs)}</b>
          <span>{state === 'over' ? 'Over the goal. Keep going!' : `${clock(left)} left to beat ${clock(goal)}`}</span>
        </div>
        <div className="dm-timer-bar">
          <i style={{ width: `${Math.min(100, k * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}
function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <path d="M12 2.5l2.9 6.2 6.8.7-5.1 4.6 1.4 6.7L12 17.3l-6 3.4 1.4-6.7-5.1-4.6 6.8-.7z" fill="currentColor" />
    </svg>
  );
}
function Star({ delay }) {
  return (
    <span className="dm-star" style={{ animationDelay: `${delay}s` }}>
      <StarIcon />
    </span>
  );
}
function Trophy() {
  return (
    <svg className="dm-trophy" viewBox="0 0 64 64" width="96" height="96" aria-hidden="true">
      <path d="M18 8h28v14a14 14 0 0 1-28 0z" fill="#fbbf24" stroke="#b45309" strokeWidth="2.5" />
      <path d="M18 12H9a9 9 0 0 0 10 12M46 12h9a9 9 0 0 1-10 12" fill="none" stroke="#b45309" strokeWidth="3" />
      <rect x="28" y="35" width="8" height="10" fill="#f59e0b" />
      <rect x="20" y="45" width="24" height="7" rx="2" fill="#b45309" />
      <path d="M26 15l4 3-1 5 3-2 3 2-1-5 4-3h-5l-1-4-1 4z" fill="#fff7dc" />
    </svg>
  );
}
// A second burst of confetti, a moment later (for a new level).
function DelayedConfetti() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 1300);
    return () => clearTimeout(t);
  }, []);
  return on ? <Confetti pieces={110} /> : null;
}

// Shown in place of the games when they're locked (gameLock.js): what to
// do, with today's sheets, and a button to the next sheet.
export function GamesLocked({ playerId, grade, mode, onSheet }) {
  const d = useDaily(playerId, grade);
  const done = Math.min(d.done, SHEETS_A_DAY);
  const left = SHEETS_A_DAY - done;
  const line =
    mode === 'sheets'
      ? `The games are locked. Finish ${left === 1 ? 'one more Daily Math sheet' : `${left} more Daily Math sheets`} today to unlock them!`
      : 'The games are locked right now. Your Daily Math sheets are ready!';
  useEffect(() => {
    speak(line);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <section className="gl-card" aria-label="Games are locked">
      <svg className="gl-lock" viewBox="0 0 48 48" width="64" height="64" aria-hidden="true">
        <path d="M15 21v-6a9 9 0 0 1 18 0v6" fill="none" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
        <rect x="9" y="20" width="30" height="22" rx="6" fill="#fbbf24" stroke="#b45309" strokeWidth="2.5" />
        <circle cx="24" cy="29" r="3.2" fill="#7c2d12" />
        <path d="M24 31v5" stroke="#7c2d12" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <h3>Games are locked</h3>
      <button type="button" className="gl-say" onClick={() => speak(line)}>
        {mode === 'sheets' ? `Finish today’s ${SHEETS_A_DAY} Daily Math sheets to unlock the games!` : 'Daily Math sheets only, for now.'}
      </button>
      {mode === 'sheets' && (
        <div className="gl-progress">
          <Dots done={done} />
          <span>
            {done} of {SHEETS_A_DAY} sheets done
          </span>
        </div>
      )}
      <button type="button" className="mi-sail gl-go" onClick={onSheet}>
        {d.done >= SHEETS_A_DAY ? 'Do an extra sheet' : `Do sheet ${done + 1}`}
      </button>
    </section>
  );
}
