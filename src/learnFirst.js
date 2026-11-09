// "Learn it first": before a question in a topic the player has never
// done, or after they've got this topic wrong twice in a row, MathPop
// talks them through it (ExplainPanel) before they answer. They can skip
// it. Kept on this phone, per player: { seen: { topic: 1 }, wrong: { topic: n } }.
const KEY = 'mathpop-learn-first-v1';
const AGAIN_AFTER = 2;

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function update(playerId, fn) {
  const all = read();
  const mine = all[playerId] || { seen: {}, wrong: {} };
  fn(mine);
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...all, [playerId]: mine }));
  } catch {
    /* private mode */
  }
}

// 'new' (never tried this topic), 'again' (wrong twice in a row) or null.
// `progress` is the player's progress by grade (App.jsx), so topics done
// before this came in don't count as new.
export function teachKind(playerId, topic, progress = {}) {
  if (!playerId || !topic) return null;
  const mine = read()[playerId] || {};
  if ((mine.wrong?.[topic] || 0) >= AGAIN_AFTER) return 'again';
  const done = Object.values(progress).some((g) => g?.byOp?.[topic]?.total > 0);
  if (!done && !mine.seen?.[topic]) return 'new';
  return null;
}

export function markTaught(playerId, topic) {
  update(playerId, (m) => {
    m.seen = { ...m.seen, [topic]: 1 };
    m.wrong = { ...m.wrong, [topic]: 0 };
  });
}

// Each first answer: wrong ones in a row add up, a right one starts over.
export function recordTeachAnswer(playerId, topic, correct) {
  if (!playerId || !topic) return;
  update(playerId, (m) => {
    m.seen = { ...m.seen, [topic]: 1 };
    m.wrong = { ...m.wrong, [topic]: correct ? 0 : (m.wrong?.[topic] || 0) + 1 };
  });
}
