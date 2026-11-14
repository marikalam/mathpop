import { useEffect, useRef, useState } from 'react';
import { Thing } from './Drawings.jsx';
import { Finale } from './Rewards.jsx';
import { shuffle } from './gameKit.jsx';
import { playCorrectChime, playStickerPick, playStickerStick, speak } from './sound.js';

// Go Fish (a memory match): the cards are face down; flip two at a time to
// find the matching pairs. It counts the pairs found, and the tries.
// What matches, by grade:
//   Pre-K  the same picture and number (2 ducks and 2 ducks), 6 pairs
//   K      dots and the number (●●● and 3), 6 pairs
//   1st    numbers that make 10 (3 and 7), 8 pairs
//   2nd    numbers that make 20 (6 and 14), 8 pairs
//   3rd/4th a times fact and its answer (3 × 4 and 12), 8 pairs

const COLORS = ['#ff6b9a', '#3b8cf0', '#ffb000', '#2fae6b', '#9b6bf2', '#ff8a3d', '#14b8a6', '#e5484d', '#6366f1', '#84cc16'];
const PICS = ['fish', 'duck', 'strawberry', 'star', 'ladybug', 'balloon'];

let cardId = 0;
const card = (key, face) => ({ id: ++cardId, key, face });

// The deck for a grade: pairs of cards that match (same `key`).
function makeDeck(grade) {
  const cards = [];
  if (grade === 'p') {
    for (let v = 1; v <= 6; v++) for (let k = 0; k < 2; k++) cards.push(card(v, { kind: 'pics', v, pic: PICS[v - 1] }));
  } else if (grade === 'k') {
    for (let v = 1; v <= 10; v++) cards.push(card(v, { kind: 'dots', v }), card(v, { kind: 'num', v }));
  } else if (grade === '1') {
    for (let a = 1; a <= 5; a++) for (let k = 0; k < 2; k++) cards.push(card(a, { kind: 'num', v: a, dots: true }), card(a, { kind: 'num', v: 10 - a, dots: true }));
  } else if (grade === '2') {
    for (let a = 1; a <= 10; a++) cards.push(card(a, { kind: 'num', v: a }), card(a, { kind: 'num', v: 20 - a }));
  } else {
    // Ten times facts with different answers.
    const hi = grade === '3' ? 10 : 12;
    const facts = [];
    const used = new Set();
    for (const [a, b] of shuffle(Array.from({ length: (hi - 1) * (hi - 1) }, (_, i) => [2 + (i % (hi - 1)), 2 + Math.floor(i / (hi - 1))]))) {
      if (a > b || used.has(a * b)) continue;
      used.add(a * b);
      facts.push([a, b]);
      if (facts.length === 10) break;
    }
    facts.forEach(([a, b], i) => cards.push(card(i, { kind: 'fact', a, b }), card(i, { kind: 'num', v: a * b })));
  }
  return shuffle(cards);
}

// How a card is said, and how to ask for its match.

function CardFace({ c, small = false, big = false }) {
  const f = c.face;
  // Matching cards share a color, so pairs look like pairs.
  const style = { '--card': COLORS[(f.kind === 'pics' ? f.v - 1 : c.key) % COLORS.length] };
  let body;
  if (f.kind === 'pics') {
    body = (
      <span className={`gf-pics gf-pics-${f.v}`}>
        {Array.from({ length: f.v }, (_, i) => (
          <Thing key={i} id={f.pic} size={small ? 14 : big ? (f.v > 4 ? 28 : f.v > 2 ? 34 : 44) : f.v > 3 ? 22 : 28} />
        ))}
      </span>
    );
  } else if (f.kind === 'dots') {
    body = (
      <span className="gf-dots">
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} className={i < f.v ? 'on' : ''} />
        ))}
      </span>
    );
  } else if (f.kind === 'fact') {
    body = (
      <span className="gf-fact">
        {f.a} × {f.b}
      </span>
    );
  } else {
    body = (
      <>
        <span className="gf-num">{f.v}</span>
        {f.dots && (
          <span className="gf-mini">
            {Array.from({ length: f.v }, (_, i) => (
              <i key={i} />
            ))}
          </span>
        )}
      </>
    );
  }
  return (
    <span className={`gf-card${small ? ' gf-card-small' : ''}`} style={style}>
      {f.kind === 'pics' && <b className="gf-corner">{f.v}</b>}
      {body}
    </span>
  );
}

// What a card shows, said out loud.
function sayCard(c) {
  const f = c.face;
  if (f.kind === 'pics') return f.v === 1 ? `1 ${f.pic}` : `${f.v} ${f.pic === 'fish' ? 'fish' : f.pic === 'strawberry' ? 'strawberries' : `${f.pic}s`}`;
  if (f.kind === 'dots') return `${f.v} ${f.v === 1 ? 'dot' : 'dots'}`;
  if (f.kind === 'fact') return `${f.a} times ${f.b}`;
  return `${f.v}`;
}
// Why two cards match, for the happy line.
function whyMatch(a, b, grade) {
  if (grade === '1') return `${a.face.v} and ${b.face.v} make 10!`;
  if (grade === '2') return `${a.face.v} and ${b.face.v} make 20!`;
  if (a.face.kind === 'fact' || b.face.kind === 'fact') {
    const f = a.face.kind === 'fact' ? a.face : b.face;
    return `${f.a} times ${f.b} is ${f.a * f.b}!`;
  }
  return `${sayCard(a)}!`;
}

// The board: pairs of cards (same `key`) from the grade's deck, shuffled.
function makeBoard(grade, pairs) {
  const byKey = {};
  for (const c of makeDeck(grade)) (byKey[c.key] = byKey[c.key] || []).push(c);
  const list = [];
  for (const k of shuffle(Object.keys(byKey))) {
    const cs = byKey[k];
    for (let i = 0; i + 1 < cs.length && list.length < pairs * 2; i += 2) list.push(cs[i], cs[i + 1]);
    if (list.length >= pairs * 2) break;
  }
  return shuffle(list);
}

// Memory match: all the cards face down; flip two at a time to find the
// matching pairs. It counts the pairs found (and the tries). A match jumps
// and sparkles; two that don't match turn back over. After 3 misses in a
// row, the partner of the card you just turned glows for a moment.
export default function GoFish({ grade, onEnd }) {
  const nPairs = grade === 'p' || grade === 'k' ? 6 : 8;
  const [cards] = useState(() => makeBoard(grade, nPairs));
  const [up, setUp] = useState([]);
  const [found, setFound] = useState([]);
  const [tries, setTries] = useState(0);
  const [busy, setBusy] = useState(false);
  const [missRun, setMissRun] = useState(0);
  const [glow, setGlow] = useState(null);
  const [justFound, setJustFound] = useState([]);
  const [note, setNote] = useState('Tap a card to turn it over!');
  const [party, setParty] = useState(false);
  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    speak('Turn over two cards. Can you find a match?');
  }, []);
  const pairsFound = found.length / 2;

  function flip(c) {
    if (busy || party || up.includes(c.id) || found.includes(c.id)) return;
    playStickerPick();
    if (up.length === 0) {
      setUp([c.id]);
      setNote(`${sayCard(c)}. Now find its match!`);
      speak(sayCard(c));
      // After a few misses, the partner glows for a moment.
      if (missRun >= 3) {
        const partner = cards.find((x) => x.id !== c.id && x.key === c.key && !found.includes(x.id));
        if (partner) {
          setGlow(partner.id);
          later(() => setGlow(null), 1800);
        }
      }
      return;
    }
    const first = cards.find((x) => x.id === up[0]);
    setUp([up[0], c.id]);
    setTries((t) => t + 1);
    setBusy(true);
    if (first.key === c.key) {
      const n = pairsFound + 1;
      later(() => {
        playCorrectChime();
        setFound((f) => [...f, first.id, c.id]);
        setJustFound([first.id, c.id]);
        setUp([]);
        setBusy(false);
        setMissRun(0);
        setGlow(null);
        setNote(`A match! ${whyMatch(first, c, grade)}`);
        speak(`A match! ${whyMatch(first, c, grade)} That's ${n} ${n === 1 ? 'pair' : 'pairs'}!`);
        if (n >= nPairs) {
          later(() => {
            playStickerStick();
            setParty(true);
            speak(`You found all ${nPairs} pairs! Great job!`);
          }, 1400);
        }
      }, 650);
    } else {
      speak(sayCard(c));
      later(() => {
        setNote('Not the same. They turn back over. Try again!');
        setUp([]);
        setBusy(false);
        setMissRun((m) => m + 1);
      }, 1500);
    }
  }

  const cols = nPairs === 6 ? 3 : 4;
  return (
    <div className="game game-memory">
      <div className="mem-count" aria-live="polite">
        <span className="mem-count-big" key={pairsFound}>
          {pairsFound}
        </span>
        <span className="mem-count-text">
          <strong>
            {pairsFound === 1 ? 'pair' : 'pairs'} found
          </strong>
          <small>
            of {nPairs} · {tries} {tries === 1 ? 'try' : 'tries'}
          </small>
        </span>
        <span className="mem-fishes" aria-hidden="true">
          {Array.from({ length: nPairs }, (_, i) => (
            <span key={i} className={i < pairsFound ? 'mem-fish-on' : ''}>
              <Thing id="fish" size={20} />
            </span>
          ))}
        </span>
      </div>
      <div className={`mem-grid mem-grid-${cols}`}>
        {cards.map((c, i) => {
          const isUp = up.includes(c.id) || found.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              className={`mem-card${isUp ? ' mem-up' : ''}${found.includes(c.id) ? ' mem-found' : ''}${justFound.includes(c.id) ? ' mem-just' : ''}${glow === c.id ? ' mem-glow' : ''}`}
              style={{ animationDelay: `${i * 0.04}s` }}
              onClick={() => flip(c)}
              aria-label={isUp ? sayCard(c) : 'A card, face down'}
            >
              <span className="mem-inner">
                <span className="mem-back" aria-hidden="true">
                  <Thing id="fish" size={cols === 3 ? 40 : 30} />
                </span>
                <span className="mem-front">
                  <CardFace c={c} big={cols === 3} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="bakery-note mem-note">{note}</p>
      {party && (
        <Finale title={`You found all ${nPairs} pairs!`} line={`In ${tries} tries. Great memory!`} button="Yay! →" onDone={() => onEnd(nPairs)}>
          <span className="gf-party">
                {Array.from({ length: nPairs }, (_, i) => {
              const a = cards.find((x) => found[i * 2] === x.id);
              const b = cards.find((x) => found[i * 2 + 1] === x.id);
              return a && b ? (
                <span key={i} className="finale-guest gf-pair" style={{ animationDelay: `${i * 0.1}s` }}>
                  <CardFace c={a} small />
                  <CardFace c={b} small />
                </span>
              ) : null;
            })}
          </span>
        </Finale>
      )}
    </div>
  );
}
