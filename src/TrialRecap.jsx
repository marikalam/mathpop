import { weekSummary } from './todayPlan.js';
import Pip from './Pip.jsx';

// Near the end of the 7-day free trial (its last two days), once a day on
// the home page: what each child did this week (rounds, days played, how
// many right, mistakes fixed, the games played most), so a grown-up sees
// the progress just before deciding whether to keep MathPop. "Keep
// MathPop" opens Plus.
export default function TrialRecap({ players, daysLeft, topicName, onKeep, onLater }) {
  const weeks = players.map((p) => ({ player: p, week: weekSummary(p.id) })).filter((w) => w.week.rounds > 0);
  const names = weeks.map((w) => w.player.name);
  const who = names.length === 1 ? names[0] : names.length === 2 ? `${names[0]} and ${names[1]}` : 'your kids';
  const ends = daysLeft <= 1 ? 'ends today' : `ends in ${daysLeft} days`;
  return (
    <div className="handoff-backdrop" role="dialog" aria-modal="true" aria-labelledby="recap-title">
      <div className="handoff-card recap-card">
        <Pip size={84} mood="cheer" />
        <p className="recap-eyebrow">For grown-ups</p>
        <h2 id="recap-title" className="handoff-title">
          Look what {who} did this week!
        </h2>
        <div className="recap-players">
          {weeks.map(({ player, week }) => {
            const pct = week.total ? Math.round((week.correct / week.total) * 100) : 0;
            return (
              <section key={player.id} className="recap-player">
                {weeks.length > 1 && <h3 className="recap-name">{player.name}</h3>}
                <div className="recap-stats">
                  <span>
                    <strong>{week.rounds}</strong> {week.rounds === 1 ? 'round' : 'rounds'}
                  </span>
                  <span>
                    <strong>{week.total}</strong> problems
                  </span>
                  <span>
                    <strong>{pct}%</strong> right
                  </span>
                  <span>
                    <strong>{week.fixed}</strong> {week.fixed === 1 ? 'mistake' : 'mistakes'} fixed
                  </span>
                </div>
                {week.topGames.length > 0 && (
                  <p className="recap-games">Practiced: {week.topGames.map((g) => topicName(g.mode)).join(', ')}</p>
                )}
              </section>
            );
          })}
        </div>
        <p className="handoff-text">
          The free trial {ends}. Keep MathPop going with Plus: every game, as many rounds as they like, for the whole family, in
          MathPop and PitchPop.
        </p>
        <button type="button" className="pill-btn-primary pill-btn-full" onClick={onKeep}>
          Keep MathPop going
        </button>
        <button type="button" className="handoff-stay" onClick={onLater}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
