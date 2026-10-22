import { useState } from 'react';
import { MAX_ASSIGNED, assignedTopics, gradeTopicList, loadMistakes, problemText, setAssignedTopics, weeklyRounds } from './todayPlan.js';

// MathPop Plus: one child's full progress report, for grown-ups. Each topic
// at their grade with how often it's right (the tricky ones first), four
// weeks of practice, the mistakes still to fix, and practice to assign
// (it shows up first in their Today's practice).
const TRICKY = 0.7;

export default function ReportScreen({ player, grade, gradeName, progress }) {
  const [, refresh] = useState(0);
  const byOp = progress?.byOp || {};
  const topics = gradeTopicList(grade);
  const played = topics
    .filter((t) => byOp[t.id]?.total)
    .map((t) => ({ ...t, total: byOp[t.id].total, pct: byOp[t.id].correct / byOp[t.id].total }))
    .sort((a, b) => a.pct - b.pct);
  const notYet = topics.filter((t) => !byOp[t.id]?.total);
  const weeks = weeklyRounds(player.id, 4);
  const maxRounds = Math.max(1, ...weeks.map((w) => w.rounds));
  const mistakes = [...loadMistakes(player.id, grade)].reverse().slice(0, 10);
  const assigned = assignedTopics(player.id, grade).map((t) => t.id);

  function toggleAssigned(id) {
    const next = assigned.includes(id) ? assigned.filter((x) => x !== id) : [...assigned, id];
    if (next.length > MAX_ASSIGNED) return;
    setAssignedTopics(player.id, next);
    refresh((n) => n + 1);
  }

  return (
    <div className="report">
      <p className="screen-sub">
        {player.name} · {gradeName}
      </p>

      <section className="stats-card">
        <h3 className="stats-card-title">Topics</h3>
        {played.length === 0 ? (
          <p className="stats-empty">No rounds at this grade yet.</p>
        ) : (
          <ul className="stats-bars">
            {played.map((t) => (
              <li key={t.id} className="stats-bar-row">
                <span className="stats-bar-label">
                  {t.pct < TRICKY && t.total >= 5 ? '⚠️ ' : ''}
                  {t.title}
                </span>
                <span className="stats-bar-track">
                  <span className={`stats-bar-fill${t.pct < TRICKY ? ' report-bar-low' : ''}`} style={{ width: `${Math.round(t.pct * 100)}%` }} />
                </span>
                <span className="stats-bar-value">
                  {Math.round(t.pct * 100)}%<span className="stats-bar-note"> · {t.total}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {notYet.length > 0 && <p className="stats-empty report-not-yet">Not tried yet: {notYet.map((t) => t.title).join(', ')}</p>}
      </section>

      <section className="stats-card">
        <h3 className="stats-card-title">Rounds each week</h3>
        <ul className="stats-bars">
          {weeks.map((w, i) => (
            <li key={w.from} className="stats-bar-row">
              <span className="stats-bar-label">{i === weeks.length - 1 ? 'This week' : `${weeks.length - 1 - i} wk ago`}</span>
              <span className="stats-bar-track">
                <span className="stats-bar-fill" style={{ width: `${(w.rounds / maxRounds) * 100}%` }} />
              </span>
              <span className="stats-bar-value">
                {w.rounds}
                {w.total > 0 && <span className="stats-bar-note"> · {Math.round((w.correct / w.total) * 100)}%</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="stats-card">
        <h3 className="stats-card-title">Mistakes still to fix</h3>
        {mistakes.length === 0 ? (
          <p className="stats-empty">None right now 🎉</p>
        ) : (
          <ul className="report-mistakes">
            {mistakes.map((m) => (
              <li key={m.key}>{problemText(m.problem)}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="stats-card">
        <h3 className="stats-card-title">Assign practice</h3>
        <p className="stats-empty">
          Pick up to {MAX_ASSIGNED} topics. They show up first in {player.name}’s Today’s practice.
        </p>
        <div className="report-assign">
          {topics.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={assigned.includes(t.id)}
              className={`report-assign-chip${assigned.includes(t.id) ? ' report-assign-chip-on' : ''}`}
              onClick={() => toggleAssigned(t.id)}
            >
              {t.icon} {t.title}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
