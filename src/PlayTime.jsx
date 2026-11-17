import Pip from './Pip.jsx';
import { LIMITS, limitFor, minutesText, secondsLeft, setLimit, usedSeconds, usePlayTimes } from './playTime.js';

// Players & grades: a daily play time limit for each player. Every change
// goes through the parental gate (`gated`), so only a grown-up can set it.
export function PlayTimeCard({ players, gated, onAdd }) {
  usePlayTimes();
  return (
    <section className="sgm-card pt-card" aria-labelledby="pt-title">
      <div className="sgm-head">
        <h3 id="pt-title">Play time</h3>
        <p>A daily limit for each player. Time counts while MathPop is open, and starts again each morning. Only a grown-up can change it.</p>
      </div>
      {players.map((p) => {
        const lim = limitFor(p.id);
        const used = Math.floor(usedSeconds(p.id) / 60);
        const left = secondsLeft(p.id);
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

// Shown when today's time is up. Games stay closed until tomorrow, unless a
// grown-up (through the gate) adds 15 minutes.
export function TimesUp({ name, ja, onAdd }) {
  return (
    <div className="pt-back" role="dialog" aria-modal="true" aria-labelledby="pt-up-title">
      <div className="pt-up">
        <Pip size={110} mood="wave" />
        <h2 id="pt-up-title">{ja ? 'きょうは ここまで！' : "Time's up for today!"}</h2>
        <p>{ja ? `${name}、たくさん あそんだね！ また あした あそぼう。` : `Great playing, ${name}! MathPop will be ready again tomorrow.`}</p>
        <button type="button" className="pt-grown" onClick={onAdd}>
          {ja ? 'おとなの かた: 15ふん ふやす' : 'Grown-up: add 15 minutes'}
        </button>
      </div>
    </div>
  );
}
