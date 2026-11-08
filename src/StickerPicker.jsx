import { useEffect, useState } from 'react';
import { stickerName } from './stickers.js';
import { addSticker, bookPage, pendingStickers, playerStickers } from './stickerStore.js';
import Sticker from './Sticker.jsx';
import { playStickerPick, playStickerStick } from './sound.js';
import Icon from './Icon.jsx';

// The sticker earned by finishing a round of ten problems (the "All done!"
// screen). The player picks one, and sticking it in opens the sticker book
// where it goes on (onStick). Every player keeps their stickers on this
// phone; a family account also keeps them on every device.
export default function StickerPicker({ playerId, signedIn, from, onStick, onSignIn }) {
  const [chosen, setChosen] = useState(null);
  const [pending, setPending] = useState(() => pendingStickers(playerId));

  useEffect(() => {
    const reload = () => setPending(pendingStickers(playerId));
    window.addEventListener('mathpop-stickers-changed', reload);
    return () => window.removeEventListener('mathpop-stickers-changed', reload);
  }, [playerId]);

  if (pending === 0) {
    const last = playerStickers(playerId).at(-1);
    return last ? (
      <p className="sticker-today">
        <Sticker index={last.index} size={28} /> It's in your sticker book!
      </p>
    ) : null;
  }

  const free = bookPage(playerStickers(playerId), true).free;

  function stick() {
    playStickerStick();
    addSticker(playerId, chosen, from);
    onStick(chosen);
  }

  return (
    <div className="sticker-pick">
      <p className="workon-title sticker-pick-title">
        {pending > 1 ? `You have ${pending} stickers! Pick one` : 'You earned a sticker! Pick one'}
      </p>
      <div className="sticker-pick-grid">
        {free.map((i) => (
          <button
            key={i}
            type="button"
            className={`sticker-pick-btn${chosen === i ? ' is-chosen' : ''}`}
            onClick={() => {
              playStickerPick();
              setChosen(i);
            }}
            aria-label={stickerName(i)}
            aria-pressed={chosen === i}
          >
            <Sticker index={i} size={40} />
          </button>
        ))}
      </div>
      <button className="pill-btn-primary sticker-pick-go" disabled={chosen === null} onClick={stick}>
        {chosen === null ? 'Tap a sticker' : <>Stick it in my book <Icon name="star" /></>}
      </button>
    </div>
  );
}
