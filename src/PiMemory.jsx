import { useEffect, useRef, useState } from 'react';
import Pip from './Pip.jsx';
import { Confetti } from './Celebrate.jsx';
import { playCorrectChime, playIncorrectBuzz, playStickerPick, playStickerStick, speak } from './sound.js';

// Pi Memory: what pi is (a circle's way around is a bit more than 3 times
// its way across), then remembering its digits. Climb: watch the digits,
// then type them from memory; each round adds one digit; 3 hearts. Test:
// type as far as you can with nothing shown. The best of each is kept for
// each player, with badges along the way. Digits come in groups of 5 (like
// a phone number), each digit with its own color.

export const PI = '14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196';
const BADGES = [5, 10, 20, 30, 50, 100];
const DIGIT_COLORS = ['#64748b', '#e5484d', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];
const KEY = 'mathpop-pi-v1';
function readBest(id) {
  try {
    return (JSON.parse(localStorage.getItem(KEY)) || {})[id] || { climb: 0, test: 0, seen: false };
  } catch {
    return { climb: 0, test: 0, seen: false };
  }
}
function saveBest(id, patch) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY)) || {};
    all[id] = { ...readBest(id), ...patch };
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* private mode */
  }
}
const sayDigits = (n) => `3 point ${PI.slice(0, n).split('').join(' ')}`;

// "3 . 14159 26535 8…": groups of five; `hide` hides digits from that
// index on; `mark` colors one digit (new or wrong).
function Digits({ n, typed, hide = Infinity, mark, wrongAt }) {
  const shown = typed !== undefined ? typed : PI.slice(0, n);
  const groups = [];
  for (let i = 0; i < Math.max(n, shown.length); i += 5) groups.push(i);
  return (
    <div className="pi-digits" aria-label={sayDigits(shown.length)}>
      <span className="pi-three">3.</span>
      {groups.map((g) => (
        <span key={g} className="pi-group">
          {Array.from({ length: Math.min(5, Math.max(n, shown.length) - g) }, (_, k) => {
            const i = g + k;
            const d = shown[i];
            const blank = d === undefined || i >= hide;
            return (
              <i
                key={i}
                className={`pi-d${blank ? ' pi-blank' : ''}${mark === i ? ' pi-new' : ''}${wrongAt === i ? ' pi-wrong' : ''}`}
                style={{ '--dc': blank ? undefined : DIGIT_COLORS[Number(d)] }}
              >
                {blank ? '' : d}
              </i>
            );
          })}
        </span>
      ))}
    </div>
  );
}

// A phone-style number pad: 1 2 3 / 4 5 6 / 7 8 9 / delete 0 check.
function Pad({ onDigit, onDelete, onCheck, canDelete, canCheck, disabled }) {
  return (
    <div className="pi-pad">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
        <button key={d} type="button" className="pi-key" style={{ '--dc': DIGIT_COLORS[d] }} disabled={disabled} onClick={() => onDigit(String(d))}>
          {d}
        </button>
      ))}
      <button type="button" className="pi-key pi-key-del" disabled={disabled || !canDelete} onClick={onDelete} aria-label="Delete">
        <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
          <path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M12 9l5 6M17 9l-5 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>
      <button type="button" className="pi-key" style={{ '--dc': DIGIT_COLORS[0] }} disabled={disabled} onClick={() => onDigit('0')}>
        0
      </button>
      <button type="button" className="pi-key pi-key-check" disabled={disabled || !canCheck} onClick={onCheck} aria-label="Check">
        <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

// What pi is, for little kids: four spoken pictures.
const INTRO = [
  'This is a circle, like a yummy round pizza!',
  'This line goes straight across the middle. It is the circle’s width.',
  'Now walk all the way around the edge of the circle. It is as long as three widths, and a little bit more!',
  'That number is called pi. It is three point one four one five nine, and it goes on forever and never repeats! Let’s see how much of pi you can remember!',
];
function Intro({ onDone }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    speak(INTRO[p]);
  }, [p]);
  const R = 62;
  const C = 2 * Math.PI * R;
  return (
    <div className="game game-pz pi-intro">
      <svg viewBox="0 0 320 250" className="pi-pic" role="img" aria-label={INTRO[p]}>
        <circle cx="160" cy="88" r={R} fill="#fde68a" stroke="#f59e0b" strokeWidth="8" />
        {[[-24, -20], [20, -30], [-10, 22], [28, 18], [0, -2]].map(([x, y], k) => (
          <circle key={k} cx={160 + x} cy={88 + y} r="7" fill="#e5484d" opacity={p >= 0 ? 0.85 : 0} />
        ))}
        {p >= 1 && <line x1={160 - R} y1="88" x2={160 + R} y2="88" stroke="#2563eb" strokeWidth="7" strokeLinecap="round" className="pi-draw" />}
        {p >= 2 && (
          <circle cx="160" cy="88" r={R} fill="none" stroke="#16a34a" strokeWidth="8" strokeDasharray={C} strokeDashoffset="0" className="pi-around" style={{ '--len': C }} />
        )}
        {p >= 2 && (
          <g className="pi-unroll">
            <rect x={160 - (C * 0.62) / 2} y="196" width={C * 0.62} height="10" rx="5" fill="#16a34a" />
            {[0, 1, 2].map((k) => (
              <g key={k}>
                <rect x={160 - (C * 0.62) / 2 + k * 2 * R * 0.62} y="214" width={2 * R * 0.62 - 3} height="10" rx="5" fill="#2563eb" />
                <text x={160 - (C * 0.62) / 2 + k * 2 * R * 0.62 + R * 0.62} y="244" textAnchor="middle" className="pi-n">
                  {k + 1}
                </text>
              </g>
            ))}
            <rect x={160 - (C * 0.62) / 2 + 6 * R * 0.62} y="214" width={(C - 6 * R) * 0.62} height="10" rx="5" fill="#f97316" />
            <text x={160 + (C * 0.62) / 2 + 4} y="244" textAnchor="end" className="pi-n pi-bit">
              a bit
            </text>
          </g>
        )}
      </svg>
      {p >= 3 && <div className="pi-big">π = 3.14159…</div>}
      <button type="button" className="cc-say" onClick={() => speak(INTRO[p])}>
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
          <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
        <span>{INTRO[p]}</span>
      </button>
      <div className="cc-controls">
        <button type="button" className="cc-btn" disabled={p === 0} onClick={() => setP(p - 1)} aria-label="Back">
          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          className="cc-btn cc-next"
          onClick={() => {
            playStickerPick();
            if (p + 1 < INTRO.length) setP(p + 1);
            else onDone();
          }}
          aria-label="Next"
        >
          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
            <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Climb: watch, then type from memory; one more digit each round.
function Climb({ start, onOver }) {
  const [n, setN] = useState(start);
  const [phase, setPhase] = useState('watch'); // watch | type | wrong | good
  const [typed, setTyped] = useState('');
  const [hearts, setHearts] = useState(3);
  const [wrongAt, setWrongAt] = useState(null);
  const [badge, setBadge] = useState(null);
  const best = useRef(start - 1);
  useEffect(() => {
    if (phase !== 'watch') return;
    speak(n === start ? `Remember these! ${sayDigits(n)}. Then tap I remember!` : `One more! ${sayDigits(n)}`);
  }, [phase, n]); // eslint-disable-line react-hooks/exhaustive-deps

  // Type freely (a wrong digit can be deleted), then check with the ✓.
  function digit(d) {
    if (phase !== 'type' || typed.length >= n) return;
    playStickerPick();
    setTyped(typed + d);
  }
  function del() {
    if (phase !== 'type' || !typed) return;
    playStickerPick();
    setTyped(typed.slice(0, -1));
  }
  function check() {
    if (phase !== 'type' || typed.length < n) return;
    const i = [...typed].findIndex((d, k) => d !== PI[k]);
    if (i < 0) {
      best.current = Math.max(best.current, n);
      playCorrectChime();
      const got = BADGES.find((b) => b === n);
      setBadge(got || null);
      setPhase('good');
      if (got) {
        playStickerStick();
        speak(`Wow! ${n} digits of pi! You earned the ${n} badge!`);
      } else speak(`Yes! ${n} digits!`);
      setTimeout(() => {
        setBadge(null);
        setTyped('');
        setN(n + 1);
        setPhase('watch');
      }, got ? 2600 : 1300);
      return;
    }
    playIncorrectBuzz();
    setWrongAt(i);
    setTyped(typed.slice(0, i) + PI[i]);
    const h = hearts - 1;
    setHearts(h);
    setPhase('wrong');
    speak(h ? `Oops! That one is ${PI[i]}. Let's look again.` : `Oops! That one is ${PI[i]}. Great climbing!`);
    setTimeout(() => {
      if (!h) {
        onOver(best.current);
        return;
      }
      setWrongAt(null);
      setTyped('');
      setPhase('watch');
    }, 2200);
  }

  return (
    <div className="game game-pz pi-game">
      {badge && <Confetti pieces={70} />}
      <div className="pi-top">
        <span className="pi-hearts" aria-label={`${hearts} hearts`}>
          {[0, 1, 2].map((k) => (
            <svg key={k} viewBox="0 0 24 22" width="26" height="24" className={k < hearts ? '' : 'pi-heart-off'} aria-hidden="true">
              <path d="M12 21s-9-5.6-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.4-9 12-9 12z" fill="#e5484d" />
            </svg>
          ))}
        </span>
        <span className="pi-count">
          <b>{n}</b> digits
        </span>
      </div>
      <Digits n={n} typed={phase === 'watch' ? undefined : typed} hide={phase === 'watch' ? Infinity : typed.length} mark={phase === 'watch' ? n - 1 : null} wrongAt={wrongAt} />
      {badge ? (
        <div className="pi-badge-big">
          <PiBadge n={badge} big />
          <b>{badge} digits!</b>
        </div>
      ) : phase === 'watch' ? (
        <button
          type="button"
          className="mi-sail pi-ready"
          onClick={() => {
            playStickerPick();
            setTyped('');
            setPhase('type');
            speak('Now type it! Start after the 3. Then tap the green check.');
          }}
        >
          I remember!
        </button>
      ) : (
        <>
          <p className="pi-hint">
            {phase === 'wrong' ? 'Oops! The orange one is the right digit.' : phase === 'good' ? 'Yes!' : typed.length < n ? 'Type it from memory' : 'Tap the green check!'}
          </p>
          <Pad onDigit={digit} onDelete={del} onCheck={check} canDelete={typed.length > 0} canCheck={typed.length === n} disabled={phase !== 'type'} />
        </>
      )}
    </div>
  );
}

// Test: type as far as you can, nothing shown.
function Test({ onOver }) {
  const [typed, setTyped] = useState('');
  const [wrongAt, setWrongAt] = useState(null);
  useEffect(() => {
    speak('Pi test! Type all the digits you remember, after the 3. Go as far as you can!');
  }, []);
  function digit(d) {
    if (wrongAt !== null || typed.length >= PI.length) return;
    playStickerPick();
    setTyped(typed + d);
  }
  function del() {
    if (wrongAt !== null || !typed) return;
    playStickerPick();
    setTyped(typed.slice(0, -1));
  }
  // Check: count the right digits from the start; show the first wrong one.
  function check() {
    if (wrongAt !== null || !typed) return;
    const i = [...typed].findIndex((d, k) => d !== PI[k]);
    if (i < 0) {
      playStickerStick();
      speak(`All right! You got ${typed.length} digits!`);
      setWrongAt(-1);
      setTimeout(() => onOver(typed.length), 1800);
      return;
    }
    playIncorrectBuzz();
    setWrongAt(i);
    setTyped(typed.slice(0, i) + PI[i]);
    speak(`That one is ${PI[i]}. You got ${i} digits!`);
    setTimeout(() => onOver(i), 2400);
  }
  return (
    <div className="game game-pz pi-game">
      <div className="pi-top">
        <span className="pi-count">Pi test</span>
        <span className="pi-count">
          <b>{wrongAt === null || wrongAt === -1 ? typed.length : wrongAt}</b> digits
        </span>
      </div>
      <Digits n={Math.max(5, typed.length + (wrongAt === null ? 1 : 0))} typed={typed} wrongAt={wrongAt === -1 ? null : wrongAt} />
      <p className="pi-hint">
        {wrongAt === null ? 'Type all you remember, then tap the green check' : wrongAt === -1 ? 'All right!' : 'The orange one was the right digit.'}
      </p>
      <Pad onDigit={digit} onDelete={del} onCheck={check} canDelete={typed.length > 0} canCheck={typed.length > 0} disabled={wrongAt !== null} />
    </div>
  );
}

function PiBadge({ n, big, off }) {
  return (
    <span className={`pi-badge${big ? ' pi-badge-lg' : ''}${off ? ' pi-badge-off' : ''}`}>
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="18" fill={off ? '#e2e8f0' : '#fbbf24'} stroke={off ? '#cbd5e1' : '#d97706'} strokeWidth="2.5" />
        <path d="M11 14h18M16 14v14M24 14v11q0 3 3 3" stroke={off ? '#94a3b8' : '#7c2d12'} strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
      <b>{n}</b>
    </span>
  );
}

export default function PiMemory({ onEnd, playerId = 'guest' }) {
  const [rec, setRec] = useState(() => readBest(playerId));
  const [view, setView] = useState(() => (readBest(playerId).seen ? 'home' : 'intro'));
  const [run, setRun] = useState(0);
  const [last, setLast] = useState(null);
  const top = Math.max(rec.climb, rec.test);
  useEffect(() => {
    if (view === 'home') speak(last ? `You remembered ${last.n} digits of pi!` : 'Pi Memory! How many digits of pi can you remember?');
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  function over(kind, n) {
    const isBest = n > (rec[kind] || 0);
    if (isBest) saveBest(playerId, { [kind]: n });
    setRec(readBest(playerId));
    setLast({ kind, n, isBest });
    setView('home');
  }

  if (view === 'intro')
    return (
      <Intro
        onDone={() => {
          saveBest(playerId, { seen: true });
          setView('home');
        }}
      />
    );
  if (view === 'climb') return <Climb key={run} start={3} onOver={(n) => over('climb', n)} />;
  if (view === 'test') return <Test key={run} onOver={(n) => over('test', n)} />;
  return (
    <div className="game game-pz pi-home">
      {last?.isBest && last.n > 0 && <Confetti pieces={60} />}
      <div className="pi-hero">
        <span className="pi-symbol">π</span>
        <div>
          <b>{last ? `${last.n} digits!${last.isBest ? ' New best!' : ''}` : 'How much pi can you remember?'}</b>
          <small>Best: {top} digits</small>
        </div>
      </div>
      <Digits n={Math.max(10, Math.min(top + 5, 40))} hide={top} />
      <div className="pi-badges">
        {BADGES.map((b) => (
          <PiBadge key={b} n={b} off={top < b} />
        ))}
      </div>
      <button
        type="button"
        className="mi-sail pi-go"
        onClick={() => {
          setRun((r) => r + 1);
          setView('climb');
        }}
      >
        Pi Climb
        <small>Watch, then remember one more each time</small>
      </button>
      <button
        type="button"
        className="mi-sail pi-go pi-go-test"
        onClick={() => {
          setRun((r) => r + 1);
          setView('test');
        }}
      >
        Pi Test
        <small>Type as far as you can, from memory</small>
      </button>
      <div className="dm-actions">
        <button type="button" className="bakery-btn" onClick={() => setView('intro')}>
          What is pi?
        </button>
        <button type="button" className="bakery-btn" onClick={() => onEnd(top)}>
          Done
        </button>
      </div>
      {!top && <Pip size={70} mood="wave" />}
    </div>
  );
}
