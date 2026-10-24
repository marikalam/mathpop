import { useEffect, useState } from 'react';
import { RARE, TREASURE_SETS, markTreasuresSeen, ownedTreasureIds, playerTreasures, withArticle } from './treasures.js';
import { playStickerPick, playStickerStick, speak } from './sound.js';

// The forest look's treasures (treasures.js): the chest at the end of a
// round, and the treasure box where they're kept.

function say(t) {
  speak(`${t.name[0].toUpperCase()}${t.name.slice(1)}. ${t.fact}`);
}

function Chest({ open }) {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" aria-hidden="true" className={`treasure-chest${open ? ' treasure-chest-open' : ''}`}>
      <g stroke="#3a3428" strokeWidth="3" strokeLinejoin="round">
        <rect x="12" y="44" width="96" height="46" rx="6" fill="#8b5e3c" />
        <path d="M12 58h96" fill="none" />
        <g className="treasure-chest-lid">
          <path d="M12 46V36q48-34 96 0v10z" fill="#a0683e" />
          <path d="M12 46h96" fill="none" />
        </g>
        <rect x="52" y="50" width="16" height="18" rx="3" fill="#e0a83e" />
        <path d="M30 44v46M90 44v46" fill="none" stroke="#e0a83e" strokeWidth="5" />
      </g>
    </svg>
  );
}

// "All done!": tap the chest to see what's inside.
export function TreasureChest({ treasure, onOpenBox }) {
  const [open, setOpen] = useState(false);
  if (!treasure) return null;
  function openChest() {
    if (open) return;
    setOpen(true);
    playStickerPick();
    setTimeout(() => {
      playStickerStick();
      const finished = treasure.finished ? ` You finished the ${treasure.finished.title} set! ${withArticle(treasure.finished.animal.name).replace(/^a/, 'A')} moved into your forest!` : '';
      speak(`You found ${withArticle(treasure.name)}! ${treasure.fact}${finished}`);
    }, 350);
  }
  return (
    <div className="treasure-found">
      {!open ? (
        <button className="treasure-chest-btn" onClick={openChest} aria-label="Open the treasure chest">
          <Chest />
          <span className="treasure-tap">Tap the chest!</span>
        </button>
      ) : (
        <>
          <div className="treasure-reveal">
            <Chest open />
            <span className="treasure-reveal-item" aria-hidden="true">
              {treasure.emoji}
            </span>
          </div>
          <p className="treasure-found-title">You found {withArticle(treasure.name)}!</p>
          <p className="treasure-found-fact">{treasure.fact}</p>
          {treasure.finished && (
            <div className="forest-moved-in">
              <span className="forest-moved-in-animal" aria-hidden="true">
                {treasure.finished.animal.emoji}
              </span>
              <span>
                <strong>{treasure.finished.title} set done!</strong>
                {withArticle(treasure.finished.animal.name).replace(/^a/, 'A')} moved into your forest.
              </span>
            </div>
          )}
          <button className="treasure-box-btn" onClick={onOpenBox}>
            🧺 Put it in your treasure box
          </button>
        </>
      )}
    </div>
  );
}

// The treasure box: a compartment for every treasure, set by set; the ones
// not found yet are empty. Tap one to hear about it.
export default function TreasureBox({ player }) {
  const [, refresh] = useState(0);
  useEffect(() => {
    markTreasuresSeen(player.id);
    const update = () => refresh((n) => n + 1);
    window.addEventListener('mathpop-stickers-changed', update);
    window.addEventListener('mathpop-stickers-synced', update);
    return () => {
      window.removeEventListener('mathpop-stickers-changed', update);
      window.removeEventListener('mathpop-stickers-synced', update);
    };
  }, [player.id]);

  const owned = ownedTreasureIds(player.id);
  const count = playerTreasures(player.id).length;
  const total = TREASURE_SETS.reduce((n, s) => n + s.items.length, 0) + RARE.length;
  const rows = [...TREASURE_SETS, { id: 'rare', title: 'Rare finds', items: RARE }];

  return (
    <section className="treasure-box" aria-label={`${player.name}'s treasure box`}>
      <h2 className="screen-title">🧺 {player.name}'s treasures</h2>
      <p className="screen-sub">
        {owned.size} of {total} found{count > owned.size ? ` · ${count} treasures in all` : ''}. Finish a set and an animal moves into your forest!
      </p>
      <div className="treasure-sets">
        {rows.map((set) => {
          const done = set.items.every((t) => owned.has(t.id));
          return (
            <div key={set.id} className={`treasure-set${done ? ' treasure-set-done' : ''}`}>
              <div className="treasure-set-head">
                <span>{set.title}</span>
                {set.animal && (
                  <span className={`treasure-set-animal${done ? ' treasure-set-animal-on' : ''}`} aria-label={done ? `${set.animal.name} moved in` : `Finish to meet the ${set.animal.name}`}>
                    {set.animal.emoji}
                  </span>
                )}
              </div>
              <div className="treasure-slots">
                {set.items.map((t) =>
                  owned.has(t.id) ? (
                    <button key={t.id} className="treasure-slot treasure-slot-full" onClick={() => say(t)} aria-label={t.name}>
                      {t.emoji}
                    </button>
                  ) : (
                    <span key={t.id} className="treasure-slot" aria-label="Not found yet">
                      ?
                    </span>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
