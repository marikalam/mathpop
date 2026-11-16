import { useEffect, useState } from 'react';
import Pip from './Pip.jsx';
import { speak } from './sound.js';
import { sgSettings } from './sgMode.js';

// The think card (Singapore Math Mode): an action game stops at a new
// question and shows it here until the kid taps I'm ready. Hints go one
// step at a time, concrete → pictorial → abstract: counters, then a model
// (ten frame, number bond, bar model, place value disks, an array), then
// the number sentence that makes it easy. Which models show follows the
// grown-up settings.

const Dot = ({ c = '#3b8cf0', out, empty }) => <i className={`tk-dot${out ? ' tk-out' : ''}${empty ? ' tk-empty' : ''}`} style={{ '--c': c }} />;
const BLUE = '#3b8cf0';
const ORANGE = '#ff8a3d';

export function TenFrames({ a, b = 0, frames }) {
  const n = frames || Math.max(1, Math.ceil((a + b) / 10));
  return (
    <span className="tk-frames">
      {Array.from({ length: n }, (_, f) => (
        <span key={f} className="tk-frame">
          {Array.from({ length: 10 }, (_, k) => {
            const i = f * 10 + k;
            return i < a ? <Dot key={k} c={BLUE} /> : i < a + b ? <Dot key={k} c={ORANGE} /> : <Dot key={k} empty />;
          })}
        </span>
      ))}
    </span>
  );
}
function Counters({ a, b = 0, cross = 0 }) {
  return (
    <span className="tk-counters">
      {Array.from({ length: a }, (_, k) => (
        <Dot key={`a${k}`} c={BLUE} out={k >= a - cross} />
      ))}
      {Array.from({ length: b }, (_, k) => (
        <Dot key={`b${k}`} c={ORANGE} />
      ))}
    </span>
  );
}
export function Bond({ whole, parts }) {
  const P = ({ v, x, y, r = 19, top }) => (
    <g>
      <circle cx={x} cy={y} r={r} fill={top ? '#ffd23f' : v === '?' ? '#e8f4ff' : '#fff'} stroke={v === '?' ? '#3b6fef' : '#173a66'} strokeWidth="3" strokeDasharray={v === '?' ? '6 4' : undefined} />
      <text x={x} y={y + 7} textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize={String(v).length > 3 ? 13 : String(v).length > 2 ? 16 : 19} fill={v === '?' ? '#3b6fef' : '#173a66'}>
        {v}
      </text>
    </g>
  );
  return (
    <svg className="tk-bond" viewBox="0 0 132 104" role="img" aria-label={`Number bond: ${whole} is ${parts.join(' and ')}`}>
      <path d="M66 30 L28 76 M66 30 L104 76" stroke="#173a66" strokeWidth="4" />
      <P v={whole} x={66} y={26} r={22} top />
      <P v={parts[0]} x={28} y={80} />
      <P v={parts[1]} x={104} y={80} />
    </svg>
  );
}
export function Bar({ parts, total, label }) {
  const sum = parts.reduce((s, p) => s + (typeof p === 'number' ? p : 0), 0) || 1;
  const colors = ['#ff8fb1', '#c4a1ff', '#ffd23f', '#7dd3fc', '#a7e8c0', '#fdba74'];
  return (
    <span className="tk-barwrap">
      <span className="tk-bar">
        {parts.map((p, i) => (
          <span key={i} style={{ flex: typeof p === 'number' ? p / sum : 0.3, background: p === '?' ? '#e8f4ff' : colors[i % colors.length] }}>
            {p}
          </span>
        ))}
      </span>
      <span className="tk-brace">{total}</span>
      {label && <small>{label}</small>}
    </span>
  );
}
function Disks({ n }) {
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;
  return (
    <span className="tk-disks">
      {h > 0 && (
        <span className="tk-col tk-h">
          {Array.from({ length: h }, (_, k) => (
            <b key={k}>100</b>
          ))}
        </span>
      )}
      <span className="tk-col tk-t">
        {Array.from({ length: t }, (_, k) => (
          <b key={k}>10</b>
        ))}
      </span>
      <span className="tk-col tk-o">
        {Array.from({ length: o }, (_, k) => (
          <b key={k}>1</b>
        ))}
      </span>
    </span>
  );
}
function ArrayDots({ rows, cols }) {
  return (
    <span className="tk-array" style={{ '--cols': cols }}>
      {Array.from({ length: rows * cols }, (_, k) => (
        <Dot key={k} c={Math.floor(k / cols) % 2 ? ORANGE : BLUE} />
      ))}
    </span>
  );
}

// The hint steps for a question's text: [{ tag, line, pic }].
export function hintSteps(text) {
  const s = sgSettings();
  let t = String(text || '')
    .trim()
    .replace(/(\d),(\d)/g, '$1$2')
    .replace(/\s*=\s*\?$/, '');
  // "4 + ? = 10" and "? + 4 = 10" are number bonds.
  const missing = t.match(/^(\d+) \+ \? = (\d+)$/) || t.match(/^\? \+ (\d+) = (\d+)$/);
  if (missing) t = `${missing[2]} = ${missing[1]} + ?`;
  const steps = [];
  const add = (on, tag, line, pic) => on && steps.push({ tag, line, pic });
  let m;
  if (/^●+$/.test(t)) {
    const n = t.length;
    add(true, 'Count', `Touch each dot and count: ${Array.from({ length: n }, (_, i) => i + 1).join(', ')}`, <Counters a={n} />);
    return steps;
  }
  if ((m = t.match(/^(\d+) = (\d+) \+ \?$/))) {
    const [whole, part] = [+m[1], +m[2]];
    add(whole <= 20 && s.tenFrames, 'Ten frame', `${part} are here. Count the empty spots up to ${whole}.`, <TenFrames a={part} frames={Math.ceil(whole / 10)} />);
    add(s.bonds, 'Number bond', `${whole} is ${part} and a missing part.`, <Bond whole={whole} parts={[part, '?']} />);
    add(true, 'Numbers', `${part} + ? = ${whole}. Count on from ${part}.`, null);
    return steps;
  }
  m = t.match(/^(\d+)\s*([+−×÷-])\s*(\d+)$/);
  if (!m) return steps;
  const a = +m[1];
  const op = m[2] === '-' ? '−' : m[2];
  const b = +m[3];
  if (op === '+') {
    if (a + b <= 20) {
      add(true, 'Counters', `${a} blue and ${b} orange. Count them all.`, <Counters a={a} b={b} />);
      if (a + b > 10 && a < 10 && b < 10) {
        add(s.tenFrames, 'Ten frame', `Fill the ten first: ${a} and ${10 - a} make 10, and ${b - (10 - a)} more.`, <TenFrames a={a} b={b} frames={2} />);
        add(true, 'Numbers', `${a} + ${10 - a} = 10, then 10 + ${b - (10 - a)} = ?`, null);
      } else {
        add(s.tenFrames, 'Ten frame', `${a} and ${b} in a ten frame.`, <TenFrames a={a} b={b} />);
        add(true, 'Numbers', `Start at ${Math.max(a, b)} and count on ${Math.min(a, b)}.`, null);
      }
    } else {
      add(s.disks && a + b < 1000, 'Place value', `${a} and ${b} as hundreds, tens and ones.`, (
        <span className="tk-row">
          <Disks n={a} />
          <b className="tk-op">+</b>
          <Disks n={b} />
        </span>
      ));
      const up = Math.ceil(a / 10) * 10;
      if (b < 10 && up - a < b && up !== a) add(true, 'Numbers', `Make the next ten: ${a} + ${up - a} = ${up}, then ${up} + ${b - (up - a)} = ?`, null);
      else add(true, 'Numbers', `Tens first: ${Math.floor(a / 10) * 10} + ${Math.floor(b / 10) * 10}, then the ones: ${a % 10} + ${b % 10}.`, null);
    }
  } else if (op === '−') {
    if (a <= 20) {
      add(true, 'Counters', `${a} counters. Take away ${b}. How many are left?`, <Counters a={a} cross={b} />);
      add(s.bonds, 'Number bond', `${a} is ${b} and what?`, <Bond whole={a} parts={[b, '?']} />);
      add(true, 'Numbers', `Think: ${b} + ? = ${a}`, null);
    } else {
      add(s.bars, 'Bar model', `The whole bar is ${a}. Take away the ${b} part.`, <Bar parts={[b, '?']} total={a} />);
      add(true, 'Numbers', b % 10 ? `Take away ${Math.floor(b / 10) * 10}, then ${b % 10}: ${a} − ${Math.floor(b / 10) * 10} = ${a - Math.floor(b / 10) * 10}, then − ${b % 10}.` : `${a} − ${b}: take away ${b / 10} tens.`, null);
    }
  } else if (op === '×') {
    add(a * b <= 60, 'Array', `${a} rows of ${b}.`, <ArrayDots rows={a} cols={b} />);
    add(s.bars && a <= 6, 'Bar model', `${a} groups of ${b}.`, <Bar parts={Array(a).fill(b)} total="?" />);
    add(true, 'Numbers', `Skip count by ${b}: ${Array.from({ length: Math.min(a, 6) }, (_, i) => b * (i + 1)).join(', ')}${a > 6 ? ', …' : ''}`, null);
  } else if (op === '÷') {
    const q = b ? a / b : 0;
    add(a <= 60 && Number.isInteger(q), 'Groups', `${a} shared into ${b} equal rows.`, <ArrayDots rows={b} cols={q} />);
    add(s.bars && b <= 6 && Number.isInteger(q), 'Bar model', `${a} cut into ${b} equal parts.`, <Bar parts={Array(b).fill('?')} total={a} />);
    add(true, 'Numbers', `Think: ${b} × ? = ${a}`, null);
  }
  return steps;
}

const say = (t) =>
  String(t || '')
    .replace(/−/g, ' minus ')
    .replace(/×/g, ' times ')
    .replace(/÷/g, ' divided by ')
    .replace(/= \?/g, 'equals what?')
    .replace(/\?/g, ' what');

// The card. `start`: how many hint steps to show at first (1 after a miss).
export default function ThinkCard({ text, title, onReady, start = 0 }) {
  title = title || 'The game is waiting for you';
  const steps = hintSteps(text);
  const [shown, setShown] = useState(Math.min(start, steps.length));
  useEffect(() => {
    setShown(Math.min(start, steps.length));
    if (start && steps[0]) speak(steps[0].line);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, start]);
  const cur = steps[shown - 1];
  function next() {
    const n = Math.min(steps.length, shown + 1);
    setShown(n);
    speak(steps[n - 1].line);
  }
  return (
    <div className="tk-wrap">
      <div className="tk-card" role="dialog" aria-label="Think time">
        <div className="tk-head">
          <Pip size={40} />
          <span>
            <b>{title}</b>
            <small>No rush. Think, then tap I'm ready.</small>
          </span>
        </div>
        {text ? (
          <button type="button" className="tk-q" onClick={() => speak(say(text))}>
            {/^●+$/.test(text) ? <Counters a={text.length} /> : text}
          </button>
        ) : (
          <p className="tk-line">Paused. Take a breath!</p>
        )}
        {cur && (
          <div className="tk-hint">
            <span className="tk-tag">
              Hint {shown} of {steps.length} · {cur.tag}
            </span>
            {cur.pic && <div className="tk-pic">{cur.pic}</div>}
            <span className="tk-line">{cur.line}</span>
          </div>
        )}
        {steps.length > 0 && (
          <div className="tk-chips">
            {steps.map((s2, i) => (
              <span key={s2.tag} className={i < shown ? 'tk-on' : ''}>
                {i + 1} {s2.tag}
              </span>
            ))}
          </div>
        )}
        <div className="tk-btns">
          {shown < steps.length && (
            <button type="button" className="tk-next" onClick={next}>
              {shown ? 'Next hint' : 'Show me a hint'}
            </button>
          )}
          <button type="button" className="tk-ready" onClick={onReady}>
            I'm ready!
          </button>
        </div>
      </div>
    </div>
  );
}

// The pause button in the action games: stops the game on the think card
// (the question, and hints) until I'm ready.
export function PauseButton({ onClick }) {
  return (
    <button type="button" className="tk-pause" onClick={onClick} aria-label="Pause and think">
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
        <rect x="4" y="3" width="4" height="14" rx="1.5" fill="currentColor" />
        <rect x="12" y="3" width="4" height="14" rx="1.5" fill="currentColor" />
      </svg>
      Think
    </button>
  );
}
