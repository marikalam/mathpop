import { useState } from 'react';
import Pip from './Pip.jsx';
import { CLOSET_ITEMS, CLOSET_KINDS, buyItem, closetFor, itemById, nextItem, starsLeft, toggleWear } from './pipCloset.js';
import { playCorrectChime, playStickerPick, speak } from './sound.js';

// Pip's Closet (pipCloset.js): dress Pip up with hats, glasses and capes
// bought with ★ from playing. Tap something you have to put it on (tap
// again to take it off); tap something new to get it, if there are
// enough ★, and Pip says what they're wearing.
const a = (name) => (/^[aeiou]/.test(name) ? 'an' : 'a');

export default function PipCloset({ playerId }) {
  const [closet, setCloset] = useState(() => closetFor(playerId));
  const [kind, setKind] = useState('hat');
  const [note, setNote] = useState(null);
  const [cheer, setCheer] = useState(0);
  const stars = starsLeft(closet);
  const next = nextItem(closet);

  function tap(item) {
    if (closet.owned.includes(item.id)) {
      playStickerPick();
      const after = toggleWear(playerId, item.id);
      setCloset(after);
      if (after.wear[item.kind] === item.id) {
        setNote(`Do you like my ${item.name}?`);
        speak(`Do you like my ${item.name}?`);
      } else setNote(null);
      return;
    }
    const after = buyItem(playerId, item.id);
    if (after) {
      playCorrectChime();
      setCloset(after);
      setCheer((n) => n + 1);
      setNote(`Ta-da! Thank you for my ${item.name}!`);
      speak(`Ta-da! Thank you for my ${item.name}!`);
      return;
    }
    const more = item.price - stars;
    setNote(`${more} more ★ for ${a(item.name)} ${item.name}. Play a round to earn ★!`);
    speak(`${more} more stars for ${a(item.name)} ${item.name}. Play a round to earn stars!`);
  }

  return (
    <div className="closet">
      <div className="closet-stars" aria-label={`${stars} stars to spend`}>
        <span className="closet-star">★</span> {stars}
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
          const owned = closet.owned.includes(item.id);
          const on = closet.wear[item.kind] === item.id;
          const canBuy = !owned && stars >= item.price;
          return (
            <button
              key={item.id}
              type="button"
              className={`closet-item${on ? ' closet-item-on' : ''}${owned ? '' : canBuy ? ' closet-item-ready' : ' closet-item-locked'}`}
              onClick={() => tap(item)}
              aria-label={owned ? `${item.name}${on ? ', wearing' : ''}` : `${item.name}, ${item.price} stars`}
            >
              <Pip size={62} wear={{ [item.kind]: item.id }} />
              {!owned && (
                <span className="closet-price">
                  <span className="closet-star">★</span> {item.price}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {next && (
        <div className="closet-goal">
          <div className="closet-bar">
            <i style={{ width: `${Math.min(100, (stars / Math.max(1, next.price)) * 100)}%` }} />
          </div>
          <span>
            {stars >= next.price
              ? `You have enough ★ for ${a(next.name)} ${next.name}! Tap it to get it.`
              : `${next.price - stars} more ★ for ${a(next.name)} ${next.name}. Every round you finish earns ★.`}
          </span>
        </div>
      )}
    </div>
  );
}

// The ★ a finished round earns (shown on the "All done!" screen).
export function roundStars(operation) {
  return operation === 'path' ? 2 : 1;
}

export { itemById };
