import { useEffect, useState } from 'react';
import Pip from './Pip.jsx';
import { speak } from './sound.js';
import { LIMITS, SESSION_MINUTES, SESSION_NOTES, clockText, dailyLeft, endSession, limitFor, minutesText, session, sessionLeft, setLimit, startSession, usedSeconds, usePlayTimes } from './playTime.js';

// Players & grades: a daily play time limit for each player. Every change
// goes through the parental gate (`gated`), so only a grown-up can set it.
export function PlayTimeCard({ players, gated, onAdd, onTimer }) {
  usePlayTimes();
  const s = session();
  const sLeft = sessionLeft();
  return (
    <section className="sgm-card pt-card" aria-labelledby="pt-title">
      <div className="sgm-head">
        <h3 id="pt-title">Play time</h3>
        <p>A daily limit for each player. Time counts while MathPop is open, and starts again each morning. Only a grown-up can change it.</p>
      </div>
      <div className="pt-row">
        <div className="pt-who">
          <b>Session timer</b>
          <small>{s.on ? (sLeft > 0 ? `${clockText(sLeft)} left, then: ${s.note}` : `Time's up: ${s.note}`) : 'Play for a set time, then a message like "Time for your worksheet!"'}</small>
        </div>
        <button type="button" className="pt-more" onClick={onTimer}>
          {s.on ? 'Change or stop the timer' : 'Start a timer'}
        </button>
      </div>
      {players.map((p) => {
        const lim = limitFor(p.id);
        const used = Math.floor(usedSeconds(p.id) / 60);
        const left = dailyLeft(p.id);
        return (
          <div key={p.id} className="pt-row">
            <div className="pt-who">
              <b>{p.name}</b>
              <small>{lim ? `${used} min played today · ${left > 0 ? `${minutesText(left)} left` : "time's up"}` : 'No limit'}</small>
            </div>
            <div className="pt-opts" role="group" aria-label={`Daily limit for ${p.name}`}>
              {LIMITS.map((m) => (
                <button key={m} type="button" className={`pt-opt${lim === m ? ' pt-on' : ''}`} aria-pressed={lim === m} onClick={() => lim !== m && gated(() => setLimit(p.id, m))}>
                  {m ? `${m} min` : 'Off'}
                </button>
              ))}
            </div>
            {lim > 0 && (
              <button type="button" className="pt-more" onClick={() => onAdd(p.id)}>
                + 15 minutes today
              </button>
            )}
          </div>
        );
      })}
    </section>
  );
}

// Shown when time is up: the session timer (with the grown-up's message,
// until a grown-up starts another timer) or today's limit (until tomorrow,
// or a grown-up adds 15 minutes).
export function TimesUp({ name, ja, onAdd, onTimer }) {
  const s = session();
  const timer = s.on && sessionLeft() <= 0;
  useEffect(() => {
    speak(timer ? `${s.note} Great playing, ${name}!` : ja ? `${name}、きょうは ここまで！` : `Time's up for today! Great playing, ${name}!`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="pt-back" role="dialog" aria-modal="true" aria-labelledby="pt-up-title">
      <div className="pt-up">
        <Pip size={110} mood="wave" />
        <h2 id="pt-up-title">{timer ? s.note : ja ? 'きょうは ここまで！' : "Time's up for today!"}</h2>
        <p>
          {timer
            ? `Great playing, ${name}! When you're done, a grown-up can start another timer.`
            : ja
              ? `${name}、たくさん あそんだね！ また あした あそぼう。`
              : `Great playing, ${name}! MathPop will be ready again tomorrow.`}
        </p>
        <button type="button" className="pt-grown" onClick={timer ? onTimer : onAdd}>
          {timer ? 'Grown-up: start another timer' : ja ? 'おとなの かた: 15ふん ふやす' : 'Grown-up: add 15 minutes'}
        </button>
      </div>
    </div>
  );
}

// The grown-up's timer sheet (opened after the parental gate): how long,
// and what to say when it's up.
export function TimerSheet({ onClose }) {
  const s = session();
  const [minutes, setMinutes] = useState(s.minutes || 15);
  const [note, setNote] = useState(s.note || SESSION_NOTES[0]);
  const running = s.on && sessionLeft() > 0;
  return (
    <div className="pt-back pt-sheet-back" role="dialog" aria-modal="true" aria-labelledby="pt-sheet-title">
      <div className="pt-up pt-sheet">
        <h2 id="pt-sheet-title">Session timer</h2>
        {running && <p className="pt-now">Running: {clockText(sessionLeft())} left</p>}
        <h4>Play for</h4>
        <div className="pt-opts">
          {SESSION_MINUTES.map((m) => (
            <button key={m} type="button" className={`pt-opt${minutes === m ? ' pt-on' : ''}`} aria-pressed={minutes === m} onClick={() => setMinutes(m)}>
              {m} min
            </button>
          ))}
        </div>
        <h4>Then show</h4>
        <div className="pt-opts">
          {SESSION_NOTES.map((t) => (
            <button key={t} type="button" className={`pt-opt${note === t ? ' pt-on' : ''}`} aria-pressed={note === t} onClick={() => setNote(t)}>
              {t}
            </button>
          ))}
        </div>
        <input className="pt-note" value={note} maxLength={60} onChange={(e) => setNote(e.target.value)} aria-label="Message when time is up" />
        <button
          type="button"
          className="mi-sail pt-go"
          onClick={() => {
            startSession(minutes, note.trim() || SESSION_NOTES[0]);
            onClose();
          }}
        >
          Start {minutes} minutes
        </button>
        {s.on && (
          <button
            type="button"
            className="pt-grown"
            onClick={() => {
              endSession();
              onClose();
            }}
          >
            Turn the timer off
          </button>
        )}
        <button type="button" className="hm-skip" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
