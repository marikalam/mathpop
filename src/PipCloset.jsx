import { useEffect, useState } from 'react';
import Pip from './Pip.jsx';
import Sticker from './Sticker.jsx';
import { CLOSET_ITEMS, CLOSET_KINDS, anItem, closetFor, nextItem, rememberUnlocks, stickerCount, tryOn, unlockedSet } from './pipCloset.js';
import { playCorrectChime, playStickerPick, speak } from './sound.js';

// Pip's Closet (pipCloset.js): hats, glasses and capes for Pip that unlock
// as the player's sticker book fills up. Tap one that's unlocked to put
// it on (tap again to take it off); the first time, Pip cheers. A locked
// one says how many more stickers it needs.
export default function PipCloset({ playerId }) {
  const [closet, setCloset] = useState(() => closetFor(playerId));
  const [count, setCount] = useState(() => stickerCount(playerId));
  const [kind, setKind] = useState('hat');
  const [note, setNote] = useState(null);
  const [cheer, setCheer] = useState(0);
  useEffect(() => {
    // Whatever the stickers have unlocked is saved for good (and synced).
    rememberUnlocks(playerId);
    const reload = () => {
      setCount(stickerCount(playerId));
      setCloset(closetFor(playerId));
    };
    window.addEventListener('mathpop-closet-changed', reload);
    window.addEventListener('mathpop-stickers-changed', reload);
    return () => {
      window.removeEventListener('mathpop-stickers-changed', reload);
      window.removeEventListener('mathpop-closet-changed', reload);
    };
  }, [playerId]);
  const next = nextItem(playerId);
  const open = unlockedSet(playerId);
  const unseen = new Set(CLOSET_ITEMS.filter((i) => open.has(i.id) && !closet.seen.includes(i.id)).map((i) => i.id));

  function tap(item) {
    if (open.has(item.id)) {
      const { closet: after, isNew } = tryOn(playerId, item.id);
      setCloset(after);
      if (isNew) {
        playCorrectChime();
        setCheer((n) => n + 1);
        setNote(`Ta-da! My new ${item.name}!`);
        speak(`Ta-da! My new ${item.name}!`);
      } else {
        playStickerPick();
        const on = after.wear[item.kind] === item.id;
        setNote(on ? `Do you like my ${item.name}?` : null);
        if (on) speak(`Do you like my ${item.name}?`);
      }
      return;
    }
    const more = item.need - count;
    const line = `${more} more ${more === 1 ? 'sticker' : 'stickers'} for ${anItem(item.name)}. Finish a round to get a sticker!`;
    setNote(line);
    speak(line);
  }

  return (
    <div className="closet">
      <div className="closet-stars" aria-label={`${count} stickers`}>
        <Sticker index={0} size={22} /> {count}
      </div>
      <div className="closet-stage">
        {note && <div className="closet-bubble">{note}</div>}
        <span key={cheer} className={cheer ? 'closet-pip closet-pip-pop' : 'closet-pip'}>
          <Pip size={150} mood={cheer ? 'cheer' : 'wave'} wear={closet.wear} />
        </span>
      </div>
      <div className="closet-tabs" role="tablist">
        {CLOSET_KINDS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={kind === id}
            className={`closet-tab${kind === id ? ' closet-tab-on' : ''}`}
            onClick={() => setKind(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="closet-grid">
        {CLOSET_ITEMS.filter((i) => i.kind === kind).map((item) => {
          const isOpen = open.has(item.id);
          const on = closet.wear[item.kind] === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`closet-item${on ? ' closet-item-on' : ''}${isOpen ? (unseen.has(item.id) ? ' closet-item-ready' : '') : ' closet-item-locked'}`}
              onClick={() => tap(item)}
              aria-label={isOpen ? `${item.name}${on ? ', wearing' : ''}` : `${item.name}, unlocks at ${item.need} stickers`}
            >
              <Pip size={62} wear={{ [item.kind]: item.id }} />
              {!isOpen && (
                <span className="closet-price">
                  <Sticker index={0} size={14} /> {item.need}
                </span>
              )}
              {isOpen && unseen.has(item.id) && <span className="closet-new">NEW</span>}
            </button>
          );
        })}
      </div>
      {next && (
        <div className="closet-goal">
          <div className="closet-bar">
            <i style={{ width: `${Math.min(100, (count / next.need) * 100)}%` }} />
          </div>
          <span>
            {next.need - count} more {next.need - count === 1 ? 'sticker' : 'stickers'} for {anItem(next.name)}. Every round you finish gets a sticker!
          </span>
        </div>
      )}
    </div>
  );
}
