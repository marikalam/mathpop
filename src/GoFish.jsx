import { useEffect, useRef, useState } from 'react';
import { Thing } from './Drawings.jsx';
import Pip from './Pip.jsx';
import { Finale } from './Rewards.jsx';
import { shuffle } from './gameKit.jsx';
import { playCorrectChime, playIncorrectBuzz, playStickerPick, playStickerStick, speak } from './sound.js';

// Go Fish with Pip. On your turn, tap a card to ask Pip for its match;
// if Pip doesn't have it, Pip says "Go fish!" and you tap the pond to
// catch a card. On Pip's turn, Pip shows a card and you find its match in
// your hand (or tap Go fish if you don't have one). Matches make pairs;
// when every fish is caught, there's a party.
// What matches, by grade:
//   Pre-K  the same number of pictures, 1 to 5 (two pairs of each)
//   K      dots and the number (●●● and 3), 1 to 10
//   1st    numbers that make 10 (3 and 7)
//   2nd    numbers that make 20 (6 and 14)
//   3rd/4th a times fact and its answer (3 × 4 and 12)
// Help: a wrong card says what to look for, then the right card glows.

const COLORS = ['#ff6b9a', '#3b8cf0', '#ffb000', '#2fae6b', '#9b6bf2', '#ff8a3d', '#14b8a6', '#e5484d', '#6366f1', '#84cc16'];
const PICS = ['fish', 'duck', 'strawberry', 'star', 'ladybug'];

let cardId = 0;
const card = (key, face) => ({ id: ++cardId, key, face });

// The deck for a grade: pairs of cards that match (same `key`).
function makeDeck(grade) {
  const cards = [];
  if (grade === 'p') {
    for (let v = 1; v <= 5; v++) for (let k = 0; k < 4; k++) cards.push(card(v, { kind: 'pics', v, pic: PICS[v - 1] }));
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
const said = (c) => (c.face.kind === 'fact' ? `${c.face.a} times ${c.face.b}` : `${c.face.v}`);
function askFor(c, grade, who) {
  const f = c.face;
  if (grade === 'p' || grade === 'k') return who === 'me' ? `Pip, do you have a ${f.v}?` : `Do you have a ${f.v}?`;
  if (grade === '1' || grade === '2') {
    const t = grade === '1' ? 10 : 20;
    return who === 'me' ? `Pip, do you have the number that makes ${t} with ${f.v}?` : `I have ${f.v}. Do you have the number that makes ${t} with it?`;
  }
  if (f.kind === 'fact') return who === 'me' ? `Pip, do you have the answer to ${f.a} times ${f.b}?` : `Do you have the answer to ${f.a} times ${f.b}?`;
  return who === 'me' ? `Pip, do you have a fact that makes ${f.v}?` : `Do you have a times fact that makes ${f.v}?`;
}
// What to look for, for the hint on Pip's turn.
function lookFor(c, grade) {
  const f = c.face;
  if (grade === 'p') return `Look for ${f.v} ${f.v === 1 ? f.pic : `${f.pic}s`}.`.replace('strawberrys', 'strawberries').replace('fishs', 'fish');
  if (grade === 'k') return `Look for ${f.v}. Count the dots!`;
  if (grade === '1') return `${f.v} and what make 10? Count up from ${f.v}.`;
  if (grade === '2') return `${f.v} and what make 20? Count up from ${f.v}.`;
  return f.kind === 'fact' ? `What is ${f.a} times ${f.b}?` : `Which fact makes ${f.v}?`;
}

function CardFace({ c, small = false }) {
  const f = c.face;
  // Matching cards share a color, so pairs look like pairs.
  const style = { '--card': COLORS[(f.kind === 'pics' ? f.v - 1 : c.key) % COLORS.length] };
  let body;
  if (f.kind === 'pics') {
    body = (
      <span className={`gf-pics gf-pics-${f.v}`}>
        {Array.from({ length: f.v }, (_, i) => (
          <Thing key={i} id={f.pic} size={small ? 14 : f.v > 3 ? 22 : 28} />
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

const findMatch = (hand, c) => hand.find((x) => x.id !== c.id && x.key === c.key);
// Lay down any pairs already in a hand.
function takePairs(hand) {
  const left = [];
  const pairs = [];
  for (const c of hand) {
    const i = left.findIndex((x) => x.key === c.key);
    if (i >= 0) pairs.push([left.splice(i, 1)[0], c]);
    else left.push(c);
  }
  return { hand: left, pairs };
}

export default function GoFish({ grade, onEnd }) {
  const start = useRef(null);
  if (!start.current) {
    const d = makeDeck(grade);
    const me = takePairs(d.slice(0, 5));
    const pip = takePairs(d.slice(5, 10));
    start.current = { deck: d.slice(10), me, pip, size: d.length };
  }
  const deckSize = start.current.size;
  const [deck, setDeck] = useState(start.current.deck);
  const [hand, setHand] = useState(start.current.me.hand);
  const [pipHand, setPipHand] = useState(start.current.pip.hand);
  const [myPairs, setMyPairs] = useState(start.current.me.pairs);
  const [pipPairs, setPipPairs] = useState(start.current.pip.pairs);
  // 'you': tap a card to ask · 'fish': tap the pond · 'pip': find Pip's card · 'busy' · 'done'
  const [phase, setPhase] = useState('you');
  const [ask, setAsk] = useState(null);
  const [note, setNote] = useState('Your turn! Tap a card to ask Pip.');
  const [misses, setMisses] = useState(0);
  const [newId, setNewId] = useState(null);
  const [pairFlash, setPairFlash] = useState(null);
  const [splash, setSplash] = useState(0);
  const [party, setParty] = useState(false);
  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  // The latest hands, for the turns that run on timers.
  const S = useRef({});
  S.current = { deck, hand, pipHand, myPairs, pipPairs };

  useEffect(() => {
    speak("Let's play Go Fish! Your turn. Tap a card to ask Pip for its match.");
  }, []);

  const total = deckSize / 2;
  function over(mp = S.current.myPairs, pp = S.current.pipPairs) {
    if (mp.length + pp.length < total) return false;
    setPhase('done');
    later(() => {
      playStickerStick();
      setParty(true);
      speak(`All the fish are caught! You made ${mp.length} ${mp.length === 1 ? 'pair' : 'pairs'}! Great game!`);
    }, 900);
    return true;
  }
  function showPair(a, b, mine) {
    setPairFlash({ a, b, mine, n: Math.random() });
    later(() => setPairFlash(null), 1300);
  }

  // ---- Your turn ----
  function myTurn() {
    let { hand: h, deck: d } = S.current;
    if (!h.length) {
      if (d.length) {
        // An empty hand takes a card from the pond.
        h = [d[0]];
        d = d.slice(1);
        setHand(h);
        setDeck(d);
        setNewId(h[0].id);
      } else {
        pipTurn();
        return;
      }
    }
    setPhase('you');
    setNote('Your turn! Tap a card to ask Pip.');
    speak('Your turn!');
  }
  function iAsk(c) {
    if (phase !== 'you') return;
    playStickerPick();
    setPhase('busy');
    setAsk(c);
    speak(askFor(c, grade, 'me'));
    setNote(askFor(c, grade, 'me'));
    later(() => {
      const { pipHand: ph, hand: h, myPairs: mp } = S.current;
      const m = findMatch(ph, c);
      if (m) {
        playCorrectChime();
        const nmp = [...mp, [c, m]];
        setPipHand(ph.filter((x) => x.id !== m.id));
        setHand(h.filter((x) => x.id !== c.id));
        setMyPairs(nmp);
        showPair(c, m, true);
        setAsk(null);
        setNote('Pip had it! You made a pair!');
        speak('Yes! Here you go. You made a pair!');
        later(() => over(nmp) || myTurn(), 1500);
      } else {
        setAsk(null);
        setNote('Pip says: Go fish! Tap the pond.');
        speak('Nope! Go fish!');
        setPhase('fish');
      }
    }, 1600);
  }
  function goFish() {
    if (phase !== 'fish') return;
    const { deck: d, hand: h, myPairs: mp } = S.current;
    if (!d.length) {
      pipTurn();
      return;
    }
    playStickerPick();
    setSplash((x) => x + 1);
    const c = d[0];
    setDeck(d.slice(1));
    setPhase('busy');
    later(() => {
      setNewId(c.id);
      const m = findMatch(h, c);
      if (m) {
        playCorrectChime();
        const nmp = [...mp, [m, c]];
        setHand(h.filter((x) => x.id !== m.id));
        setMyPairs(nmp);
        showPair(m, c, true);
        setNote(`You caught a ${said(c)}! It's a match!`);
        speak(`You caught a ${said(c)}! It's a match! Go again!`);
        later(() => over(nmp) || myTurn(), 1600);
      } else {
        setHand([...h, c]);
        setNote(`You caught a ${said(c)}. Pip's turn!`);
        speak(`You caught a ${said(c)}.`);
        later(pipTurn, 1500);
      }
    }, 700);
  }

  // ---- Pip's turn ----
  function pipTurn() {
    let { pipHand: ph, deck: d } = S.current;
    if (!ph.length) {
      if (d.length) {
        ph = [d[0]];
        setPipHand(ph);
        setDeck(d.slice(1));
      } else {
        if (!over()) myTurn();
        return;
      }
    }
    const c = ph[Math.floor(Math.random() * ph.length)];
    setAsk(c);
    setMisses(0);
    setPhase('pip');
    setNote("Pip's turn! Find the match, or tap Go fish.");
    speak(askFor(c, grade, 'pip'));
  }
  function iGive(c) {
    if (phase !== 'pip') return;
    if (c.key === ask.key) {
      playCorrectChime();
      const { pipHand: ph, hand: h, pipPairs: pp } = S.current;
      const npp = [...pp, [ask, c]];
      setHand(h.filter((x) => x.id !== c.id));
      setPipHand(ph.filter((x) => x.id !== ask.id));
      setPipPairs(npp);
      showPair(ask, c, false);
      setAsk(null);
      setPhase('busy');
      setNote('You found it! Thank you!');
      speak('You found it! Thank you! My turn again.');
      later(() => over(undefined, npp) || pipTurn(), 1700);
    } else {
      playIncorrectBuzz();
      const m = misses + 1;
      setMisses(m);
      const line = m >= 2 ? `Try the glowing card! ${lookFor(ask, grade)}` : `Not that one. ${lookFor(ask, grade)}`;
      setNote(line);
      speak(line);
    }
  }
  function tellGoFish() {
    if (phase !== 'pip') return;
    if (findMatch(S.current.hand, ask)) {
      playIncorrectBuzz();
      const m = misses + 1;
      setMisses(m);
      const line = m >= 2 ? 'You have one! Tap the glowing card.' : `Look again! You have one. ${lookFor(ask, grade)}`;
      setNote(line);
      speak(line);
      return;
    }
    playStickerPick();
    setPhase('busy');
    setNote('Pip goes fishing…');
    speak('Oh no! I have to go fish!');
    const want = ask;
    setAsk(null);
    later(() => {
      const { deck: d, pipHand: ph, pipPairs: pp } = S.current;
      if (!d.length) {
        myTurn();
        return;
      }
      setSplash((x) => x + 1);
      const c = d[0];
      setDeck(d.slice(1));
      const m = findMatch(ph, c);
      if (m) {
        const npp = [...pp, [m, c]];
        setPipHand(ph.filter((x) => x.id !== m.id));
        setPipPairs(npp);
        showPair(m, c, false);
        setNote(c.key === want.key ? 'Pip caught the one Pip wanted!' : 'Pip caught a match!');
        speak('I caught a match!');
        later(() => over(undefined, npp) || myTurn(), 1600);
      } else {
        setPipHand([...ph, c]);
        later(myTurn, 900);
      }
    }, 1200);
  }

  const glowId = phase === 'pip' && misses >= 2 && ask ? findMatch(hand, ask)?.id : null;
  const glowFish = phase === 'pip' && misses >= 2 && ask && !findMatch(hand, ask);
  return (
    <div className="game game-gofish">
      <div className="mm-top">
        <span className="mm-time">You: {myPairs.length} {myPairs.length === 1 ? 'pair' : 'pairs'}</span>
        <span className="mm-right">Pip: {pipPairs.length}</span>
      </div>

      {/* Pip and Pip's cards (face down). */}
      <div className="gf-pip">
        <span className={`gf-pip-face${phase === 'pip' ? ' gf-pip-asking' : ''}`}>
          <Pip size={64} mood={phase === 'pip' || pairFlash ? 'cheer' : 'wave'} />
        </span>
        <span className="gf-pip-hand">
          {pipHand.map((c, i) => (
            <span key={c.id} className={`gf-back${ask && phase === 'pip' && c.id === ask.id ? ' gf-back-up' : ''}`} style={{ '--i': i, '--n': pipHand.length }}>
              {ask && phase === 'pip' && c.id === ask.id ? <CardFace c={c} /> : <span className="gf-back-fish" />}
            </span>
          ))}
        </span>
      </div>

      {/* The pond: one fish per card left. */}
      <button type="button" className={`gf-pond${phase === 'fish' ? ' gf-pond-on' : ''}`} onClick={goFish} disabled={phase !== 'fish'} aria-label={`The pond, ${deck.length} cards`}>
        {Array.from({ length: Math.min(deck.length, 7) }, (_, i) => (
          <span key={i} className="gf-swim" style={{ '--i': i, top: `${18 + ((i * 37) % 55)}%`, animationDelay: `${-i * 1.3}s` }}>
            <Thing id="fish" size={26} />
          </span>
        ))}
        {splash > 0 && <span key={splash} className="gf-splash" aria-hidden="true" />}
        <span className="gf-pond-label">{phase === 'fish' ? 'Tap to fish!' : `${deck.length} left`}</span>
      </button>

      {pairFlash && (
        <div key={pairFlash.n} className={`gf-pairflash${pairFlash.mine ? '' : ' gf-pairflash-pip'}`} aria-hidden="true">
          <CardFace c={pairFlash.a} />
          <CardFace c={pairFlash.b} />
        </div>
      )}

      <p className={`bakery-note gf-note${misses >= 1 && phase === 'pip' ? ' bakery-note-pip' : ''}`}>{note}</p>

      {/* Your hand. */}
      <div className={`gf-hand${phase === 'you' ? ' gf-hand-ask' : ''}`}>
        {hand.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`gf-hand-card${c.id === newId ? ' gf-new' : ''}${c.id === glowId ? ' toy-glow' : ''}`}
            onClick={() => (phase === 'you' ? iAsk(c) : iGive(c))}
            disabled={phase !== 'you' && phase !== 'pip'}
            aria-label={said(c)}
          >
            <CardFace c={c} />
          </button>
        ))}
      </div>
      {phase === 'pip' && (
        <button type="button" className={`bake-serve gf-gofish-btn${glowFish ? ' bake-serve-pulse' : ''}`} onClick={tellGoFish}>
          🎣 Go fish!
        </button>
      )}

      {/* Your pairs. */}
      {myPairs.length > 0 && (
        <div className="gf-pairs" aria-label="Your pairs">
          {myPairs.map(([a, b]) => (
            <span key={a.id} className="gf-pair">
              <CardFace c={a} small />
              <CardFace c={b} small />
            </span>
          ))}
        </div>
      )}

      {party && (
        <Finale
          title="All the fish are caught!"
          line={`You made ${myPairs.length} ${myPairs.length === 1 ? 'pair' : 'pairs'}${pipPairs.length ? `, Pip made ${pipPairs.length}` : ''}!`}
          button="Yay! →"
          onDone={() => onEnd(myPairs.length)}
        >
          <span className="gf-party">
            {myPairs.map(([a, b], i) => (
              <span key={a.id} className="finale-guest gf-pair" style={{ animationDelay: `${i * 0.1}s` }}>
                <CardFace c={a} small />
                <CardFace c={b} small />
              </span>
            ))}
          </span>
        </Finale>
      )}
    </div>
  );
}
