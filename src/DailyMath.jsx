import { useEffect, useRef, useState } from 'react';
import Pip from './Pip.jsx';
import WritePad from './WritePad.jsx';
import { NumPad } from './gameKit.jsx';
import { nearMisses } from './ops.js';
import { playCorrectChime, playIncorrectBuzz, playStickerStick, speak } from './sound.js';
import { SHEETS_A_DAY, STEPS, clock, dailyFor, finishSheet, goalSeconds, makeSheet, setStep, stepName } from './dailyMath.js';

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
    const line = {
      up: `Step mastered! On to step ${r.step + 1}: ${stepName(r.step)}!`,
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
    const titles = { up: 'Step mastered!', great: 'Great sheet!', slow: 'All right!', again: 'Good practice!', down: 'Back one step' };
    const done = d.done;
    return (
      <div className="game game-pz dm-sheet">
        <div className="dm-result">
          <Pip size={96} mood="wave" />
          <h2>{titles[result.result]}</h2>
          <p className="dm-score">
            {result.right} of {result.of} right the first time · {clock(result.secs)} <small>(goal {clock(result.goal)})</small>
          </p>
          <p className="dm-why">
            {result.result === 'up'
              ? `Next: step ${result.step + 1}, ${stepName(result.step)}.`
              : result.result === 'great'
                ? 'One more great sheet like this to move up a step.'
                : result.result === 'slow'
                  ? 'To move up: at most one miss, inside the goal time, twice in a row.'
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
  const over = secs > goal;
  return (
    <div className="game game-pz dm-sheet">
      <div className="dm-top">
        <span className="pz-level">Step {step + 1}</span>
        <span className="dm-name">{stepName(step)}</span>
      </div>
      <div className="dm-bar">
        <span>{phase === 'fix' ? `Fixing ${fixAt + 1} of ${missed.length}` : `${i + 1} of ${qs.length}`}</span>
        <span className="dm-progress">
          <i style={{ width: `${((phase === 'fix' ? qs.length : i) / qs.length) * 100}%` }} />
        </span>
        <span className={`dm-clock${over ? ' dm-over' : ''}`}>
          {clock(secs)} <small>/ {clock(goal)}</small>
        </span>
      </div>
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
          3 short sheets a day on a ladder of {STEPS.length} small steps. Two great sheets in a row (at most one miss, inside the goal time) move up a step;
          two rough ones move back a step. Missed questions are fixed at the end of each sheet.
        </p>
      </div>
      {players.map((p) => {
        const d = dailyFor(p.id, p.grade);
        return (
          <div key={p.id} className="pt-row">
            <div className="pt-who">
              <b>{p.name}</b>
              <small>
                Step {d.step + 1} of {STEPS.length}: {stepName(d.step)} · {Math.min(d.done, SHEETS_A_DAY)} of {SHEETS_A_DAY} today
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
                {STEPS.map((s, k) => (
                  <option key={k} value={k}>
                    {k + 1}. {s[0]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        );
      })}
    </section>
  );
}
