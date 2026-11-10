import { useEffect, useState } from 'react';
import Pip from './Pip.jsx';
import { CLOSET_ITEMS, CLOSET_KINDS, anItem, closetFor, nextItem, rememberUnlocks, stickerCount, tryOn, unlockedSet } from './pipCloset.js';
import { playCorrectChime, playStickerPick, speak, speakInLanguage } from './sound.js';

// Pip's Closet (pipCloset.js): hats, glasses and capes for Pip that unlock
// as the player earns stars. Tap one that's unlocked to put
// it on (tap again to take it off); the first time, Pip cheers. A locked
// one says how many more stars it needs.
export default function PipCloset({ playerId, lang = 'en' }) {
  // Japanese (the player's language is 日本語): words, item names and voice.
  const ja = lang === 'ja';
  const say = (text) => (ja ? speakInLanguage(text, 'ja-JP') : speak(text));
  const nameOf = (item) => (ja ? item.ja : item.name);
  const [closet, setCloset] = useState(() => closetFor(playerId));
  const [count, setCount] = useState(() => stickerCount(playerId));
  const [kind, setKind] = useState('hat');
  const [note, setNote] = useState(null);
  const [cheer, setCheer] = useState(0);
  // Pip says hello when the closet opens (in Japanese in Japanese mode).
  useEffect(() => {
    say(ja ? 'ピップの クローゼットだよ！ ふくを タップして、きせかえしてね！' : "Welcome to my closet! Tap an outfit to dress me up!");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
        const line = ja ? `じゃーん！ あたらしい ${item.ja}！` : `Ta-da! My new ${item.name}!`;
        setNote(line);
        say(line);
      } else {
        playStickerPick();
        const on = after.wear[item.kind] === item.id;
        const line = ja ? `${item.ja}、にあう？` : `Do you like my ${item.name}?`;
        setNote(on ? line : null);
        if (on) say(line);
      }
      return;
    }
    const more = item.need - count;
    const line = ja
      ? `あと ほし ${more}こで ${item.ja}！ 1かい おわると ほしが 1こ もらえるよ。`
      : `${more} more ${more === 1 ? 'star' : 'stars'} for ${anItem(item.name)}. Finish a round to get a star!`;
    setNote(line);
    say(line);
  }

  return (
    <div className="closet">
      <div className="closet-stars" aria-label={ja ? `ほし ${count}こ` : `${count} stars`}>
        <span className="closet-star">★</span> {count}
      </div>
      <div className="closet-stage">
        {note && <div className="closet-bubble">{note}</div>}
        <span key={cheer} className={cheer ? 'closet-pip closet-pip-pop' : 'closet-pip'}>
          <Pip size={150} mood={cheer ? 'cheer' : 'wave'} wear={closet.wear} />
        </span>
      </div>
      <div className="closet-tabs" role="tablist">
        {CLOSET_KINDS.map(([id, label, jaLabel]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={kind === id}
            className={`closet-tab${kind === id ? ' closet-tab-on' : ''}`}
            onClick={() => setKind(id)}
          >
            {ja ? jaLabel : label}
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
              aria-label={isOpen ? `${nameOf(item)}${on ? (ja ? '、きている' : ', wearing') : ''}` : ja ? `${item.ja}、ほし ${item.need}こ` : `${item.name}, unlocks at ${item.need} stars`}
            >
              <Pip size={62} wear={{ [item.kind]: item.id }} />
              {!isOpen && (
                <span className="closet-price">
                  <span className="closet-star">★</span> {item.need}
                </span>
              )}
              {isOpen && unseen.has(item.id) && <span className="closet-new">{ja ? 'あたらしい' : 'NEW'}</span>}
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
            {ja
              ? `あと ほし ${next.need - count}こで ${next.ja}！ 1かい おわるごとに ほしが 1こ もらえるよ。`
              : `${next.need - count} more ${next.need - count === 1 ? 'star' : 'stars'} for ${anItem(next.name)}. Every round you finish gets a star!`}
          </span>
        </div>
      )}
    </div>
  );
}
