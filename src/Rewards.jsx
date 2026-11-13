import { useEffect, useState } from 'react';
import { Confetti } from './Celebrate.jsx';
import { Thing } from './Drawings.jsx';

// Rewards that build up while a game is played, so a hard game still ends
// with something big:
//   - PartyCake: Pip's Bakery adds one piece of a party cake per order
//     (the whole cake shows faintly from the start, so kids can see what
//     they're building). After the last order the candles light up.
//   - ShopDecor: every finished cake adds something to the bakery for
//     good (balloons, a flower, a shop cat...), kept per player.
//   - TreasureChest: Logic Lock knocks one padlock off a chest per lock;
//     after the last one the lid flies open and a treasure pops out.
//   - Finale: the big party at the end of a game.

// ---- Kept on this phone, per player ----
const KEY = 'mathpop-rewards-v1';
function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}
export function rewardCount(playerId, what) {
  return readAll()[`${playerId}:${what}`] || 0;
}
// Adds one and returns the new count.
export function addReward(playerId, what) {
  const all = readAll();
  const k = `${playerId}:${what}`;
  all[k] = (all[k] || 0) + 1;
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* private mode: the party still happens, it just isn't kept */
  }
  return all[k];
}

// ---- The party cake ----
// Six pieces, one per order: three layers, frosting, strawberries, candles.
const CAKE_PIECES = [
  // Bottom layer (chocolate) on the plate.
  <g key="0">
    <rect x="12" y="66" width="76" height="24" rx="5" fill="#a0673f" />
    <rect x="12" y="64" width="76" height="5" rx="2.5" fill="#fff4e0" />
    <circle cx="24" cy="78" r="1.6" fill="#ffd23f" />
    <circle cx="44" cy="82" r="1.6" fill="#7ab8ff" />
    <circle cx="64" cy="76" r="1.6" fill="#ff6b9a" />
    <circle cx="78" cy="83" r="1.6" fill="#2fae6b" />
  </g>,
  // Middle layer (strawberry).
  <g key="1">
    <rect x="20" y="45" width="60" height="21" rx="5" fill="#ff9ec4" />
    <rect x="20" y="43" width="60" height="5" rx="2.5" fill="#fff4e0" />
  </g>,
  // Top layer (vanilla).
  <g key="2">
    <rect x="28" y="28" width="44" height="17" rx="5" fill="#ffe1a8" />
  </g>,
  // Frosting dripping over the top, with sprinkles.
  <g key="3">
    <path d="M27 31q0-6 6-6h34q6 0 6 6v3q-3 6-6 0q-3 7-7 0q-3 6-7 0q-3 7-7 0q-3 6-7 0q-3 7-6 0z" fill="#fff" />
    <rect x="34" y="27" width="4" height="1.6" rx="0.8" fill="#ff6b9a" transform="rotate(-20 36 28)" />
    <rect x="46" y="28" width="4" height="1.6" rx="0.8" fill="#3b8cf0" transform="rotate(25 48 29)" />
    <rect x="58" y="27" width="4" height="1.6" rx="0.8" fill="#2fae6b" transform="rotate(-35 60 28)" />
    <rect x="64" y="29" width="4" height="1.6" rx="0.8" fill="#ffb000" transform="rotate(15 66 30)" />
  </g>,
  // Strawberries on top.
  <g key="4">
    {[36, 50, 64].map((x) => (
      <g key={x}>
        <path d={`M${x - 4.5} ${20}q4.5 10 9 0q-4.5-3-9 0z`} fill="#e5484d" />
        <path d={`M${x - 3} ${19.5}l3 2 3-2-3-1.5z`} fill="#2fae6b" />
      </g>
    ))}
  </g>,
  // Candles (their flames light at the party).
  <g key="5">
    {[42, 50, 58].map((x, i) => (
      <rect key={x} x={x - 1.8} y="4" width="3.6" height="13" rx="1.2" fill={['#7ab8ff', '#ff9ec4', '#a8e6a3'][i]} />
    ))}
  </g>,
];
export const CAKE_SIZE = CAKE_PIECES.length;

export function PartyCake({ pieces, lit = false, size = 96 }) {
  return (
    <span className="cake" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <ellipse cx="50" cy="92" rx="45" ry="5.5" fill="#dfe6f2" />
        {CAKE_PIECES.map((piece, i) => (
          <g key={i} className={i < pieces ? (i === pieces - 1 ? 'cake-piece cake-piece-new' : 'cake-piece') : 'cake-ghost'}>
            {piece}
          </g>
        ))}
        {lit &&
          [42, 50, 58].map((x, i) => (
            <g key={x} className="cake-flame" style={{ animationDelay: `${0.3 + i * 0.35}s` }}>
              <ellipse cx={x} cy="1.5" rx="2.6" ry="4" fill="#ffb000" />
              <ellipse cx={x} cy="2.5" rx="1.2" ry="2" fill="#fff3b0" />
            </g>
          ))}
      </svg>
      {/* A little burst of sparkles each time a piece lands. */}
      {pieces > 0 && (
        <span key={pieces} className="cake-sparkles" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} style={{ '--a': `${i * 45}deg` }} />
          ))}
        </span>
      )}
    </span>
  );
}

// ---- The bakery's decorations (one more per finished cake) ----
export const SHOP_DECOR = [
  { id: 'balloons', en: 'balloons', ja: 'ふうせん' },
  { id: 'flower', en: 'a flower pot', ja: 'おはな' },
  { id: 'cat', en: 'a shop cat', ja: 'おみせの ねこ' },
  { id: 'lights', en: 'twinkle lights', ja: 'キラキラ ライト' },
  { id: 'star', en: 'a gold star sign', ja: 'きんの ほし' },
];
export function ShopDecor({ count }) {
  const has = (id) => SHOP_DECOR.findIndex((d) => d.id === id) < count;
  return (
    <span className="shop-decor" aria-hidden="true">
      {has('lights') && (
        <span className="decor-lights">
          {Array.from({ length: 14 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${(i % 4) * 0.35}s` }} />
          ))}
        </span>
      )}
      {has('balloons') && (
        <>
          <span className="decor decor-balloon-l">
            <Thing id="balloon" size={34} />
          </span>
          <span className="decor decor-balloon-r">
            <Thing id="balloon" size={30} />
          </span>
        </>
      )}
      {has('star') && (
        <span className="decor decor-star">
          <Thing id="star" size={26} />
        </span>
      )}
      {has('flower') && (
        <span className="decor decor-flower">
          <Thing id="flower" size={34} />
        </span>
      )}
      {has('cat') && (
        <span className="decor decor-cat">
          <Thing id="cat" size={44} />
        </span>
      )}
    </span>
  );
}

// ---- The treasure chest ----
export const TREASURES = [
  { id: 'crown', en: 'a golden crown' },
  { id: 'trophy', en: 'a shiny trophy' },
  { id: 'gem', en: 'a giant diamond' },
];
function TreasureArt({ id, size = 90 }) {
  if (id === 'trophy') {
    return (
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <path d="M30 14h40v22a20 20 0 0 1-40 0z" fill="#ffc72c" stroke="#d99a00" strokeWidth="3" />
        <path d="M30 20h-10a10 10 0 0 0 12 18M70 20h10a10 10 0 0 1-12 18" fill="none" stroke="#d99a00" strokeWidth="4" />
        <rect x="44" y="55" width="12" height="16" fill="#e0a100" />
        <rect x="30" y="70" width="40" height="12" rx="3" fill="#7a4a24" />
        <path d="M44 24l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#fff6c8" />
      </svg>
    );
  }
  if (id === 'gem') {
    return (
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <path d="M28 22h44l16 20-38 44-38-44z" fill="#7fd8ff" stroke="#2f9ad6" strokeWidth="3" strokeLinejoin="round" />
        <path d="M12 42h76M28 22l10 20 12-20 12 20 10-20M38 42l12 44 12-44" fill="none" stroke="#2f9ad6" strokeWidth="2" />
        <path d="M32 28l5 9" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <path d="M14 72l-4-44 22 18 18-28 18 28 22-18-4 44z" fill="#ffc72c" stroke="#d99a00" strokeWidth="3" strokeLinejoin="round" />
      <rect x="14" y="70" width="72" height="14" rx="3" fill="#ffb000" stroke="#d99a00" strokeWidth="3" />
      <circle cx="50" cy="56" r="6" fill="#e5484d" />
      <circle cx="30" cy="60" r="4" fill="#3b8cf0" />
      <circle cx="70" cy="60" r="4" fill="#2fae6b" />
      <circle cx="10" cy="28" r="4" fill="#ffc72c" />
      <circle cx="50" cy="18" r="4" fill="#ffc72c" />
      <circle cx="90" cy="28" r="4" fill="#ffc72c" />
    </svg>
  );
}

// `opened` padlocks are off (they drop off as each is opened); `open`
// throws the lid open and shows the treasure.
export function TreasureChest({ total, opened, open = false, treasure = 'crown', size = 150 }) {
  return (
    <span className={`chest${open ? ' chest-open' : ''}`} style={{ width: size }}>
      {open && <span className="chest-rays" aria-hidden="true" />}
      {open && (
        <span className="chest-treasure">
          <TreasureArt id={treasure} size={size * 0.62} />
        </span>
      )}
      <svg viewBox="0 0 120 92" width={size} height={size * (92 / 120)} aria-hidden="true">
        <g className="chest-lid">
          <path d="M10 40v-12a18 18 0 0 1 18-18h64a18 18 0 0 1 18 18v12z" fill="#b8733a" />
          <path d="M10 34h100v6H10z" fill="#e0a100" />
          <path d="M28 10v30M92 10v30" stroke="#e0a100" strokeWidth="6" />
        </g>
        <rect x="10" y="40" width="100" height="46" rx="5" fill="#a0612f" />
        <rect x="10" y="40" width="100" height="6" fill="#e0a100" />
        <rect x="10" y="80" width="100" height="6" rx="3" fill="#e0a100" />
        <path d="M28 40v46M92 40v46" stroke="#e0a100" strokeWidth="6" />
        {Array.from({ length: total }, (_, i) => {
          const x = 18 + (i * 84) / Math.max(1, total - 1);
          const off = i < opened;
          return (
            <g key={i} className={off ? 'chest-lock chest-lock-off' : 'chest-lock'} style={{ transformOrigin: `${x}px 62px` }}>
              <path d={`M${x - 4} 60v-4a4 4 0 0 1 8 0v4`} fill="none" stroke="#8a93a8" strokeWidth="2.4" />
              <rect x={x - 6} y="59" width="12" height="11" rx="2" fill="#c9d1e0" stroke="#8a93a8" strokeWidth="1.5" />
              <circle cx={x} cy="64" r="1.6" fill="#5b6478" />
            </g>
          );
        })}
      </svg>
    </span>
  );
}

// ---- The big party at the end ----
export function Finale({ title, line, button, onDone, children }) {
  const [ready, setReady] = useState(false);
  // The button shows after a moment, so a happy tap doesn't skip the party.
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 1400);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="finale" role="dialog" aria-modal="true" aria-label={title}>
      <Confetti pieces={60} />
      <div className="finale-card">
        <div className="finale-show">{children}</div>
        <h2 className="finale-title">{title}</h2>
        {line && <p className="finale-line">{line}</p>}
        <button type="button" className={`pill-btn-primary pill-btn-full finale-btn${ready ? '' : ' finale-btn-wait'}`} disabled={!ready} onClick={onDone}>
          {button}
        </button>
      </div>
    </div>
  );
}
