import { useEffect, useState } from 'react';
import { DAILY_ROUNDS, bonusGivenToday, giveBonusIfDone, pathRoundsToday } from './todayPlan.js';
import Icon from './Icon.jsx';

// The home page's "Today's practice": three "Just for me" rounds a day
// (myPath.js), checked off as they're done, with a bonus sticker for all
// three. Each round is made from the player's history: mistakes to fix,
// practice a grown-up picked, the steps they're working on and a little
// review, so the day is just "do your rounds". It needs a family account:
// without one, the card asks a grown-up to sign in.
// A star that lights up (Toddler and K see three stars, not "Round 1, 2, 3").
function DayStar({ lit, next }) {
  return (
    <svg viewBox="0 0 40 40" className={`today-star${lit ? ' today-star-lit' : ''}${next ? ' today-star-next' : ''}`} aria-hidden="true">
      <path d="M20 3l5.2 10.6 11.7 1.7-8.5 8.2 2 11.6L20 29.6 9.6 35.1l2-11.6-8.5-8.2 11.7-1.7z" />
    </svg>
  );
}

// `little`: the youngest players (Toddler and K) get three stars to light
// up instead of numbered rounds, and plain words on the button.
export default function TodayPlan({ playerId, signedIn, working, meter, little = false, onStart, onSignIn }) {
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
        <p className="today-locked-text">Three rounds a day made just for you, from your own answers. A grown-up signs in to turn it on.</p>
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
        {little ? (
          <span className="today-stars" aria-label={`${Math.min(done, DAILY_ROUNDS)} of ${DAILY_ROUNDS} stars today`}>
            {Array.from({ length: DAILY_ROUNDS }, (_, i) => (
              <DayStar key={i} lit={i < done} next={i === done} />
            ))}
          </span>
        ) : (
          <span className="today-count">
            {Math.min(done, DAILY_ROUNDS)} / {DAILY_ROUNDS}
          </span>
        )}
      </div>
      {!little && (
        <ol className="today-rounds" aria-label="Today's rounds">
          {Array.from({ length: DAILY_ROUNDS }, (_, i) => (
            <li key={i} className={i < done ? 'today-round-done' : i === done ? 'today-round-next' : ''}>
              {i < done ? <Icon name="tick" size="0.9em" /> : i + 1}
              <span>Round {i + 1}</span>
            </li>
          ))}
        </ol>
      )}
      <button className="path-btn" onClick={onStart}>
        <span className="path-btn-icon" aria-hidden="true">
          <Icon name="rocket" size="36px" />
        </span>
        <span className="path-btn-text">
          <span className="path-btn-title">
            {little
              ? allDone
                ? 'Play some more!'
                : done
                  ? 'Get the next star!'
                  : 'Let’s play!'
              : allDone
                ? 'One more, just for me'
                : `Round ${done + 1}: just for me`}
          </span>
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
            <Icon name="party" /> All done today! You earned a bonus star <Icon name="star" />
          </>
        ) : (
          <>
            {little ? `Light up all ${DAILY_ROUNDS} stars for a bonus star` : `Finish all ${DAILY_ROUNDS} rounds for a bonus star`} <Icon name="star" />
          </>
        )}
      </p>
    </section>
  );
}

// The home page's one big button (layout A): today's round, with today's
// three stars on it. Signed in, it's the "Just for me" round (as above);
// without an account, a round of the grade's mix.
export function PlayButton({ playerId, signedIn, working, onStart, onGuestPlay }) {
  const [, refresh] = useState(0);
  useEffect(() => {
    const update = () => refresh((n) => n + 1);
    const events = ['mathpop-today-changed', 'mathpop-stickers-changed'];
    events.forEach((e) => window.addEventListener(e, update));
    return () => events.forEach((e) => window.removeEventListener(e, update));
  }, []);
  const done = signedIn ? pathRoundsToday(playerId) : 0;
  const allDone = done >= DAILY_ROUNDS;
  useEffect(() => {
    if (signedIn) giveBonusIfDone(playerId, done);
  });
  return (
    <button type="button" className="play-big" onClick={signedIn ? onStart : onGuestPlay}>
      <span className="play-big-text">
        <span className="play-big-title">{allDone ? 'Play one more' : done ? 'Play the next round' : 'Play today’s round'}</span>
        <span className="play-big-sub">{signedIn ? working : 'A mix of this grade’s math'}</span>
      </span>
      {signedIn && (
        <span className="play-big-stars" aria-label={`${Math.min(done, DAILY_ROUNDS)} of ${DAILY_ROUNDS} rounds today`}>
          {Array.from({ length: DAILY_ROUNDS }, (_, i) => (
            <svg key={i} viewBox="0 0 40 40" className={i < done ? 'on' : ''} aria-hidden="true">
              <path d="M20 3l5.2 10.6 11.7 1.7-8.5 8.2 2 11.6L20 29.6 9.6 35.1l2-11.6-8.5-8.2 11.7-1.7z" />
            </svg>
          ))}
        </span>
      )}
    </button>
  );
}
