import { useEffect, useState } from 'react';
import { DAILY_ROUNDS, bonusGivenToday, giveBonusIfDone, pathRoundsToday } from './todayPlan.js';
import Icon from './Icon.jsx';

// The home page's "Today's practice": three "Just for me" rounds a day
// (myPath.js), checked off as they're done, with a bonus sticker for all
// three. Each round is made from the player's history: mistakes to fix,
// practice a grown-up picked, the steps they're working on and a little
// review, so the day is just "do your rounds". It needs a family account:
// without one, the card asks a grown-up to sign in.
export default function TodayPlan({ playerId, signedIn, working, meter, onStart, onSignIn }) {
  const [, refresh] = useState(0);
  useEffect(() => {
    const update = () => refresh((n) => n + 1);
    const events = ['mathpop-today-changed', 'mathpop-stickers-changed'];
    events.forEach((e) => window.addEventListener(e, update));
    return () => events.forEach((e) => window.removeEventListener(e, update));
  }, []);

  const done = pathRoundsToday(playerId);
  const allDone = done >= DAILY_ROUNDS;

  useEffect(() => {
    if (signedIn) giveBonusIfDone(playerId, done);
  });

  if (!signedIn) {
    return (
      <section className="today today-locked" aria-labelledby="today-title">
        <div className="today-head">
          <h3 className="today-title" id="today-title">
            <Icon name="clipboard" /> Today's practice
          </h3>
          <Icon name="lock" />
        </div>
        <p className="today-locked-text">
          Three rounds a day made just for you, from your own answers. A grown-up signs in to turn it on.
        </p>
        <button className="pill-btn-primary pill-btn-full" onClick={onSignIn}>
          Grown-ups: sign in or sign up
        </button>
      </section>
    );
  }

  return (
    <section className={`today${allDone ? ' today-all-done' : ''}`} aria-labelledby="today-title">
      <div className="today-head">
        <h3 className="today-title" id="today-title">
          <Icon name="clipboard" /> Today's practice
        </h3>
        <span className="today-count">
          {Math.min(done, DAILY_ROUNDS)} / {DAILY_ROUNDS}
        </span>
      </div>
      <ol className="today-rounds" aria-label="Today's rounds">
        {Array.from({ length: DAILY_ROUNDS }, (_, i) => (
          <li key={i} className={i < done ? 'today-round-done' : i === done ? 'today-round-next' : ''}>
            {i < done ? <Icon name="tick" size="0.9em" /> : i + 1}
            <span>Round {i + 1}</span>
          </li>
        ))}
      </ol>
      <button className="path-btn" onClick={onStart}>
        <span className="path-btn-icon" aria-hidden="true">
          <Icon name="rocket" size="36px" />
        </span>
        <span className="path-btn-text">
          <span className="path-btn-title">{allDone ? 'One more, just for me' : `Round ${done + 1}: just for me`}</span>
          <span className="path-btn-sub">{working}</span>
          <span className="path-btn-meter" aria-label={meter.label}>
            <span style={{ width: `${meter.pct}%` }} />
          </span>
        </span>
        <span className="path-btn-go" aria-hidden="true">
          →
        </span>
      </button>
      <p className="today-note">
        {allDone || bonusGivenToday(playerId) ? (
          <>
            <Icon name="party" /> All done today! You earned a bonus sticker <Icon name="star" />
          </>
        ) : (
          <>
            Finish all {DAILY_ROUNDS} rounds for a bonus sticker <Icon name="star" />
          </>
        )}
      </p>
    </section>
  );
}
