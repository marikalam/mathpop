import { weekSummary } from './todayPlan.js';

// A player's last 7 days, for grown-ups (Players & grades): rounds, days
// played, how many right, mistakes fixed, the streak and the games played
// most. `onShare` (after the grown-ups check) shares it as a message.
export function weekText(name, week) {
  const pct = week.total ? Math.round((week.correct / week.total) * 100) : 0;
  const parts = [`${week.rounds} ${week.rounds === 1 ? 'round' : 'rounds'} on ${week.days} ${week.days === 1 ? 'day' : 'days'}`, `${pct}% right`];
  if (week.fixed) parts.push(`fixed ${week.fixed} ${week.fixed === 1 ? 'mistake' : 'mistakes'}`);
  return `${name}'s math week on MathPop: ${parts.join(', ')}${week.streak >= 2 ? `, and a ${week.streak}-day streak` : ''}! 🎉`;
}

export default function WeekCard({ player, topicName, onShare, onReport }) {
  const week = weekSummary(player.id);
  const pct = week.total ? Math.round((week.correct / week.total) * 100) : null;
  return (
    <section className="week-card">
      <div className="week-card-head">
        <h3 className="week-card-title">{player.name}’s week</h3>
        {week.streak >= 1 && <span className="week-streak">🔥 {week.streak} {week.streak === 1 ? 'day' : 'days in a row'}</span>}
      </div>
      {week.rounds === 0 ? (
        <p className="week-empty">No rounds in the last 7 days yet.</p>
      ) : (
        <>
          <div className="week-stats">
            <span>
              <strong>{week.rounds}</strong> {week.rounds === 1 ? 'round' : 'rounds'}
            </span>
            <span>
              <strong>{week.days}</strong> of 7 days
            </span>
            <span>
              <strong>{pct}%</strong> right
            </span>
            <span>
              <strong>{week.fixed}</strong> {week.fixed === 1 ? 'mistake' : 'mistakes'} fixed
            </span>
          </div>
          <p className="week-games">Played most: {week.topGames.map((g) => topicName(g.mode)).join(', ')}</p>
          <div className="week-actions">
            {onReport && (
              <button className="week-share" onClick={() => onReport(player)}>
                ✨ Full report
              </button>
            )}
            {onShare && (
              <button className="week-share" onClick={() => onShare(weekText(player.name, week))}>
                Share {player.name}’s week
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
