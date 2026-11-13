import { useEffect, useRef, useState } from 'react';
import Pip from './Pip.jsx';
import { Confetti, CountUp } from './Celebrate.jsx';
import { Thing } from './Drawings.jsx';
import { ShapeIcon } from './preK.jsx';
import { madMinuteFact } from './MadMinute.jsx';
import { playCorrectChime, playIncorrectBuzz, playStickerPick, playStickerStick, speak, speakInLanguage, stopSpeaking } from './sound.js';
import { CAKE_SIZE, Finale, PartyCake, SHOP_DECOR, ShopDecor, addReward, rewardCount } from './Rewards.jsx';
import { TimerBar, rand, shuffle, useCountdown } from './gameKit.jsx';
import { BarModel, BondPop, EqualDiff, LogicLock, MakeTen, PatternStreak, PizzaShop, SumGridRush, TimesTiles } from './GamesSG.jsx';
import { PatternShape } from './TopicVisual.jsx';
import NumberSnake from './NumberSnake.jsx';
import { Coin, SetClock, ToyShop } from './LifeGames.jsx';
import GoFish from './GoFish.jsx';
import { useDragDrop } from './dragDrop.js';

// Games: quick, replayable games with a best score to beat, like Mad
// Minute. Each one follows the player's grade.
//   - bubbles: Pop the Bubbles. Pop the bubble with the answer.
//   - make10: Make 10. Tap two tiles that add up to 10 (5 for toddlers,
//     20 from 2nd grade) to clear the board.
//   - bakery: Pip's Bakery. Fill each order with boxes of cupcakes.
//   - shapes: Speed Shapes. Pip says a shape: tap it, fast.
// A finished game earns a star (onDone), and each player's best per game
// and grade is kept on this phone.

export const GAMES = [
  { id: 'bubbles', title: 'Pop the Bubbles', sub: 'Pop the right answer', how: 'Pop the bubble with the answer!', seconds: 60, color: ['#4e8ff7', '#3a6fd8'] },
  { id: 'make10', title: 'Make 10', sub: 'Tap two that make 10', how: 'Tap two numbers that make the target!', seconds: 60, color: ['#38c07f', '#2a9e60'] },
  {
    id: 'bakery',
    title: "Pip's Bakery",
    sub: 'Pack the cupcake orders',
    how: 'Pack the boxes to fill each order!',
    seconds: 0,
    color: ['#f5a524', '#e08a12'],
    // Played in Japanese when the player's language is 日本語.
    ja: { title: 'ピップの ケーキやさん', sub: 'カップケーキを はこに つめよう', how: 'はこに つめて、ちゅうもんを とどけよう！' },
  },
  { id: 'snake', title: 'Number Snake', sub: 'Eat the right answer', how: 'Tap the fruit with the answer, and your snake goes to eat it!', seconds: 60, color: ['#2fae6b', '#1f8a51'] },
  { id: 'goFish', title: 'Go Fish!', sub: 'Find the matching cards', how: 'Find the matches! Ask Pip for a card, or go fish!', seconds: 0, color: ['#06b6d4', '#0e7490'] },
  { id: 'toyShop', title: "Pip's Toy Shop", sub: 'Pay with coins', how: 'Pay for each toy with the right coins!', seconds: 0, color: ['#0ea5e9', '#0284c7'] },
  { id: 'clock', title: 'Set the Clock', sub: 'Turn the hands to the time', how: 'Set the clock to the right time!', seconds: 0, color: ['#6366f1', '#4f46e5'] },
  { id: 'shapes', title: 'Speed Shapes', sub: 'Find the shape, fast', how: 'Listen to Pip, and tap the right shape, fast!', seconds: 45, color: ['#e0577f', '#c43c66'] },
  // Singapore math and Beast Academy games (GamesSG.jsx), for the grades
  // that learn them.
  { id: 'bondPop', title: 'Number Bond Pop', sub: 'Find the missing part', how: 'Find the missing part of the number bond!', color: ['#ffb000', '#e08a00'], grades: ['k', '1', '2'] },
  { id: 'makeTen', title: 'Make a Ten Race', sub: '8 + 5 = 10 + 3', how: 'Make a ten first, then add the rest!', color: ['#14b8a6', '#0f9384'], grades: ['1', '2'] },
  { id: 'barModel', title: 'Bar Model Builder', sub: 'Pick the model, then solve', how: 'Read the story, pick the bar model, then solve it!', color: ['#3b6fef', '#2a54c4'], grades: ['k', '1', '2', '3', '4'] },
  { id: 'sumGridRush', title: 'Sum Grid Rush', sub: 'Columns 10, rows 20', how: 'Fill the sum grids: columns make 10, rows make 20!', color: ['#8e4fd6', '#6f35b8'], grades: ['1', '2', '3'] },
  { id: 'patternStreak', title: 'Pattern Streak', sub: 'What comes next?', how: 'What comes next? See how many you get in a row!', color: ['#e5484d', '#c23237'], grades: ['k', '1', '2', '3', '4'] },
  { id: 'equalDiff', title: 'Equal Differences', sub: 'Slide, then subtract', how: 'Slide both numbers to make it easy, then subtract!', color: ['#2fae6b', '#238a54'], grades: ['1', '2', '3', '4'] },
  { id: 'timesTiles', title: 'Times Table Tiles', sub: 'Match facts to answers', how: 'Match each times fact to its answer!', color: ['#a065e6', '#7c3fc4'], grades: ['2', '3', '4'] },
  { id: 'pizza', title: 'Fraction Pizza Shop', sub: 'Cut and serve fractions', how: 'Cut the pizza, then serve the right fraction!', color: ['#f0954f', '#e0793a'], grades: ['2', '3', '4'] },
  { id: 'logicLock', title: 'Logic Lock', sub: 'Crack the code', how: 'Use the clues to crack the code!', color: ['#475569', '#334155'] },
];

// Says a line in the player's language: Japanese goes to the device's
// Japanese voice (MathPop's own voice only speaks English).
const sayIn = (lang) => (text) => (lang === 'ja' ? speakInLanguage(text, 'ja-JP') : speak(text));
// Whether a game can be played in Japanese.
export const hasJa = (id) => Boolean(GAMES.find((g) => g.id === id)?.ja);

// The games a grade plays.
export const gamesFor = (grade) => GAMES.filter((g) => !g.grades || g.grades.includes(grade));

const BEST_KEY = 'mathpop-games-best-v1';
function readBest() {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY)) || {};
  } catch {
    return {};
  }
}
// A game's name (Make 10 is Make 5 for toddlers and Make 20 from 2nd grade).
export function gameTitle(id, grade, lang) {
  const g = GAMES.find((x) => x.id === id);
  if (lang === 'ja' && g?.ja) return g.ja.title;
  const t = g?.title || '';
  return t.replace('Make 10', `Make ${targetFor(grade)}`);
}

export function gameBest(playerId, grade, game) {
  return readBest()[`${playerId}:${grade}:${game}`] || 0;
}
function saveBest(playerId, grade, game, score) {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ ...readBest(), [`${playerId}:${grade}:${game}`]: score }));
  } catch {
    /* private mode */
  }
}

// ---- Pop the Bubbles ----
function bubbleRound(grade) {
  if (grade === 'p') {
    const n = rand(1, 10);
    return { text: `Pop ${n}!`, say: `Pop the number ${n}!`, answer: n, others: shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((x) => x !== n)).slice(0, 4) };
  }
  const f = madMinuteFact(grade);
  const near = shuffle([1, 2, 3, -1, -2, 10, -10].map((d) => f.answer + d).filter((x) => x >= 0 && x !== f.answer));
  return { text: `${f.text} = ?`, say: null, answer: f.answer, others: [...new Set(near)].slice(0, 4) };
}

let bubbleId = 0;
// New bubbles start part way up (a negative delay), so the tank is never
// empty; one that floated off comes back from the bottom.
const newBubble = (value, slot, fromBottom = false) => {
  const speed = rand(60, 90) / 10;
  return { id: ++bubbleId, value, slot, speed, delay: fromBottom ? rand(0, 8) / 10 : -rand(15, 55) / 100 * speed };
};

function Bubbles({ grade, onEnd }) {
  const seconds = 60;
  const left = useCountdown(seconds, true);
  const [round, setRound] = useState(() => bubbleRound(grade));
  const [bubbles, setBubbles] = useState(() => makeBubbles(round));
  const [score, setScore] = useState(0);
  const [popped, setPopped] = useState(null);
  const [wobble, setWobble] = useState(null);

  function makeBubbles(r) {
    return shuffle([r.answer, ...r.others]).map((v, i) => newBubble(v, i));
  }
  useEffect(() => {
    if (round.say) speak(round.say);
  }, [round]);
  useEffect(() => {
    if (left === 0) onEnd(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  function tap(b) {
    if (left === 0 || popped) return;
    if (b.value === round.answer) {
      playCorrectChime();
      setPopped(b.id);
      setScore((s) => s + 1);
      setTimeout(() => {
        const next = bubbleRound(grade);
        setRound(next);
        setBubbles(makeBubbles(next));
        setPopped(null);
      }, 280);
    } else {
      playIncorrectBuzz();
      setWobble(b.id);
      setTimeout(() => setWobble(null), 400);
    }
  }
  // A bubble that floats off the top comes back from the bottom.
  function again(b) {
    setBubbles((list) => list.map((x) => (x.id === b.id ? newBubble(b.value, b.slot, true) : x)));
  }

  return (
    <div className="game game-bubbles">
      <TimerBar left={left} seconds={seconds} score={score} label="popped" />
      <div className="game-question">{round.text}</div>
      <div className="bubble-tank">
        {bubbles.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`bubble${popped === b.id ? ' bubble-pop' : ''}${wobble === b.id ? ' bubble-wobble' : ''}`}
            style={{ left: `${4 + b.slot * 19}%`, animationDuration: `${b.speed}s`, animationDelay: `${b.delay}s` }}
            onClick={() => tap(b)}
            onAnimationEnd={(e) => e.animationName === 'bubble-rise' && again(b)}
          >
            {b.value}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- Make 10 ----
const targetFor = (grade) => (grade === 'p' ? 5 : ['k', '1'].includes(grade) ? 10 : 20);
function makeBoard(target) {
  const tiles = [];
  for (let i = 0; i < 6; i++) {
    const a = rand(1, target - 1);
    tiles.push(a, target - a);
  }
  return shuffle(tiles).map((n, i) => ({ id: `${Date.now()}-${i}`, n, gone: false }));
}

function Make10({ grade, onEnd }) {
  const seconds = 60;
  const target = targetFor(grade);
  const left = useCountdown(seconds, true);
  const [tiles, setTiles] = useState(() => makeBoard(target));
  const [picked, setPicked] = useState(null);
  const [bad, setBad] = useState([]);
  const [score, setScore] = useState(0);
  useEffect(() => {
    speak(`Tap two numbers that make ${target}!`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (left === 0) onEnd(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  function tap(t) {
    if (left === 0 || t.gone) return;
    if (!picked) {
      playStickerPick();
      setPicked(t.id);
      return;
    }
    if (picked === t.id) {
      setPicked(null);
      return;
    }
    const first = tiles.find((x) => x.id === picked);
    if (first.n + t.n === target) {
      playCorrectChime();
      setScore((s) => s + 1);
      const next = tiles.map((x) => (x.id === t.id || x.id === picked ? { ...x, gone: true } : x));
      setTiles(next);
      setPicked(null);
      // A cleared board: a new one.
      if (next.every((x) => x.gone)) setTimeout(() => setTiles(makeBoard(target)), 350);
    } else {
      playIncorrectBuzz();
      setBad([picked, t.id]);
      setPicked(null);
      setTimeout(() => setBad([]), 450);
    }
  }

  return (
    <div className="game game-make10">
      <TimerBar left={left} seconds={seconds} score={score} label="pairs" />
      <div className="game-question">Make {target}!</div>
      <div className="make10-grid">
        {tiles.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={t.gone}
            className={`make10-tile${t.gone ? ' make10-gone' : ''}${picked === t.id ? ' make10-picked' : ''}${bad.includes(t.id) ? ' make10-bad' : ''}`}
            onClick={() => tap(t)}
          >
            {t.gone ? '' : t.n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- Pip's Bakery ----
// Six orders build a party cake, one piece per order. A miss is never a
// dead end: Pip helps a little more each time (count along, then dotted
// spots to fill, then Pip packs it and the kid serves it), so every game
// ends with the candles lit. Each finished cake decorates the shop.
const ORDERS = CAKE_SIZE;
function bakeryOrder(grade) {
  const sizes = { p: [1], k: [1, 2], 1: [2, 5, 10], 2: [2, 3, 4, 5, 10], 3: [3, 4, 6, 7, 8, 9], 4: [4, 6, 7, 8, 9, 12] }[grade] || [2, 5, 10];
  const size = sizes[rand(0, sizes.length - 1)];
  const boxes = grade === 'p' ? rand(1, 5) : rand(2, size === 1 ? 6 : size >= 10 ? 5 : 6);
  const who = ['Bunny', 'Bear', 'Fox', 'Panda', 'Frog', 'Duck'][rand(0, 5)];
  return { size, boxes, want: size * boxes, who };
}
const WHO_THING = { Bunny: 'bunny', Bear: 'bear', Fox: 'fox', Panda: 'panda', Frog: 'frog', Duck: 'duck' };
const WHO_JA = { Bunny: 'うさぎさん', Bear: 'くまさん', Fox: 'きつねさん', Panda: 'パンダさん', Frog: 'かえるさん', Duck: 'あひるさん' };

function Bakery({ grade, onEnd, lang, playerId }) {
  const ja = lang === 'ja';
  const talk = sayIn(lang);
  const [order, setOrder] = useState(() => bakeryOrder(grade));
  const [boxes, setBoxes] = useState(0);
  const [done, setDone] = useState(0);
  const [coins, setCoins] = useState(0);
  const [tries, setTries] = useState(0);
  const [note, setNote] = useState(null);
  const [happy, setHappy] = useState(false);
  const [lit, setLit] = useState(-1);
  // Pip packing the order to show how (taps wait until Pip is done).
  const [demo, setDemo] = useState(false);
  const [served, setServed] = useState([]);
  const [party, setParty] = useState(null);
  const [cakes] = useState(() => rewardCount(playerId, 'cakes'));
  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const seqTo = (n) => Array.from({ length: n }, (_, k) => (k + 1) * order.size).join(ja ? '、' : ', ');
  const say = (o) =>
    ja
      ? o.size === 1
        ? `${WHO_JA[o.who]}は カップケーキが ${o.want}こ ほしいって！`
        : `${WHO_JA[o.who]}は カップケーキが ${o.want}こ ほしいって。ひとはこに ${o.size}こ はいるよ。なんはこ いるかな？`
      : o.size === 1
        ? `${o.who} wants ${o.want} cupcakes!`
        : `${o.who} wants ${o.want} cupcakes. Each box holds ${o.size}. How many boxes?`;
  useEffect(() => {
    talk(say(order));
    setNote(null);
    setHappy(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  // Adding a box counts on out loud: 5, 10, 15...
  function add() {
    if (boxes >= 12 || demo) return;
    playStickerPick();
    const n = boxes + 1;
    setBoxes(n);
    setLit(n - 1);
    talk(String(n * order.size));
  }
  function takeOut() {
    if (!boxes || demo) return;
    playStickerPick();
    const n = boxes - 1;
    setBoxes(n);
    setLit(n - 1);
    if (n) talk(String(n * order.size));
  }
  // Tapping a box counts up to it: 5, 10, 15.
  function countTo(i) {
    if (demo) return;
    setLit(i);
    talk(seqTo(i + 1));
  }
  // Boxes are dragged from the stack onto the counter (a tap on the stack
  // works too); a box dragged off the counter goes back.
  const { drag, start } = useDragDrop({
    onDrop: (item, zone) => {
      if (happy || demo) return;
      if (item === 'new') {
        if (zone === 'counter') add();
      } else if (zone !== 'counter') takeOut();
    },
    onTap: (item) => {
      if (happy || demo) return;
      if (item === 'new') add();
      else countTo(item);
    },
  });

  // Pip packs the order, one box at a time, then the kid serves it.
  function showHow() {
    setDemo(true);
    setBoxes(0);
    setLit(-1);
    const n = order.boxes;
    setNote(ja ? 'ピップが やってみるね。みてて！' : 'Watch Pip pack it!');
    talk(
      ja
        ? `みてて！ ${seqTo(n)}。${n}はこで ${order.want}こ だよ！`
        : `Watch me! ${seqTo(n)}. ${n} ${n === 1 ? 'box' : 'boxes'} make ${order.want}!`,
    );
    for (let k = 1; k <= n; k++) {
      later(() => {
        playStickerPick();
        setBoxes(k);
        setLit(k - 1);
      }, 650 * k);
    }
    later(() => {
      setDemo(false);
      setNote(ja ? 'こんどは 「どうぞ！」を タップしてね' : 'Now you tap “Serve it!”');
    }, 650 * n + 500);
  }

  function serve() {
    if (demo) return;
    const have = boxes * order.size;
    if (have === order.want) {
      playCorrectChime();
      const earned = tries === 0 ? 3 : tries === 1 ? 2 : 1;
      const nextCoins = coins + earned;
      const nextDone = done + 1;
      setCoins(nextCoins);
      setHappy(true);
      setDone(nextDone);
      setServed((list) => [...list, order.who]);
      if (ja) {
        setNote(`おいしい！ ありがとう！ +${earned}コイン`);
        talk(`${order.size}こいりが ${boxes}はこで ${have}こ。おいしい！ ありがとう！`);
      } else {
        setNote(`Yum! Thank you! +${earned} coins`);
        talk(`${boxes} ${boxes === 1 ? 'box' : 'boxes'} of ${order.size} is ${have}. Yum! Thank you!`);
      }
      later(() => {
        if (nextDone >= ORDERS) {
          // The cake is done: light the candles and have a party.
          const made = addReward(playerId, 'cakes');
          const decor = SHOP_DECOR[made - 1];
          setParty({ made, decor, coins: nextCoins });
          playStickerStick();
          talk(
            ja
              ? `やったね！ パーティー ケーキの できあがり！ おめでとう！${decor ? ` おみせに ${decor.ja}が ふえたよ！` : ''}`
              : `You did it! You built the party cake! Happy party!${decor ? ` Your shop got ${decor.en}!` : ''}`,
          );
        } else {
          setBoxes(0);
          setLit(-1);
          setTries(0);
          setOrder(bakeryOrder(grade));
        }
      }, 1800);
      return;
    }
    playIncorrectBuzz();
    const t = tries + 1;
    setTries(t);
    const line = ja
      ? `${have > order.want ? 'おおすぎるよ！' : 'たりないよ！'} それだと ${have}こ。${order.want}こ ほしいな。`
      : have > order.want
        ? `Too many! That's ${have}. I want ${order.want}.`
        : `Not enough! That's ${have}. I want ${order.want}.`;
    if (t === 1) {
      // 1st miss: count the boxes together.
      setNote(line);
      talk(ja ? `${line} いっしょに かぞえよう。${seqTo(boxes)}。` : `${line} Let's count: ${seqTo(boxes)}.`);
    } else if (t === 2) {
      // 2nd miss: dotted spots show how many boxes fit the order.
      const tip = ja ? 'ヒント！ てんてんの ところに はこを いれてね。' : 'Tip: fill the dotted spots!';
      setNote(`${line} ${tip}`);
      talk(`${line} ${tip}`);
    } else {
      // 3rd miss: Pip shows how.
      later(showHow, 900);
      setNote(line);
      talk(line);
    }
  }

  const boxFace = (total) => (
    <>
      {total !== null && <span className="bake-total">{total}</span>}
      <span className="bake-lid" aria-hidden="true" />
      <span className={`bake-window${order.size > 6 ? ' bake-window-small' : ''}`}>
        {Array.from({ length: Math.min(order.size, 12) }, (_, j) => (
          <span key={j} className="bake-cup" style={{ animationDelay: `${0.05 * j}s` }}>
            <Thing id="cupcake" size={order.size > 6 ? 17 : order.size > 4 ? 23 : order.size > 1 ? 28 : 36} />
          </span>
        ))}
      </span>
    </>
  );
  const dragNew = drag && drag.item === 'new';
  const dragOff = drag && drag.item !== 'new' && drag.over !== 'counter';
  const hint = tries >= 2;
  const slots = hint ? Math.max(boxes, order.boxes) : boxes;
  return (
    <div className="game game-bakery">
      <div className="mm-top">
        <span className="mm-time">{ja ? `ちゅうもん ${Math.min(done + 1, ORDERS)} / ${ORDERS}` : `Order ${Math.min(done + 1, ORDERS)} of ${ORDERS}`}</span>
        <span className="mm-right">
          <span className="bake-coin" aria-hidden="true" /> {coins}
        </span>
      </div>
      <div className="bake-shop">
        <div className="bake-awning" aria-hidden="true" />
        <ShopDecor count={cakes} />
        <div className="bake-sign">{ja ? 'ピップの ケーキやさん' : "Pip's Bakery"}</div>
        <div className="bake-shelf" aria-hidden="true">
          <span className="bake-shelf-side">
            <Thing id="cupcake" size={30} />
            <Thing id="donut" size={30} />
          </span>
          <PartyCake pieces={done} />
          <span className="bake-shelf-side">
            <Thing id="cookie" size={30} />
            <Thing id="cupcake" size={30} />
          </span>
        </div>
        <button type="button" className="bake-customer" onClick={() => talk(say(order))}>
          <span key={done} className={`bake-who${happy ? ' bake-who-happy' : ' bake-who-in'}`}>
            <Thing id={WHO_THING[order.who]} size={70} />
          </span>
          <span className="bake-bubble">
            <strong>{ja ? `カップケーキ ${order.want}こ ちょうだい！` : `I want ${order.want} cupcakes!`}</strong>
            {order.size > 1 && <small>{ja ? `ひとはこに ${order.size}こ` : `A box holds ${order.size}.`}</small>}
          </span>
        </button>
        <div className={`bake-counter${dragNew && drag.over === 'counter' ? ' bake-counter-over' : ''}${dragNew ? ' bake-counter-ready' : ''}`} data-drop="counter">
          {slots === 0 && (
            <span className="bake-empty">
              <span className="bake-empty-hand" aria-hidden="true">
                👇
              </span>
              {ja ? 'ここに はこを おいてね' : 'Drag a box here!'}
            </span>
          )}
          {Array.from({ length: slots }, (_, i) =>
            i < boxes ? (
              <button
                key={i}
                type="button"
                className={`bake-box${lit === i ? ' bake-box-lit' : ''}${hint && i >= order.boxes ? ' bake-box-extra' : ''}${drag && drag.item === i ? ' bake-box-dragging' : ''}`}
                onPointerDown={start(i)}
                onKeyDown={(e) => e.key === 'Enter' && countTo(i)}
                aria-label={`${(i + 1) * order.size}`}
              >
                {boxFace((i + 1) * order.size)}
              </button>
            ) : (
              <span key={i} className="bake-slot" aria-hidden="true">
                <span className="bake-total">{(i + 1) * order.size}</span>
              </span>
            ),
          )}
        </div>
      </div>
      <p className="bakery-count">
        {boxes ? seqTo(boxes) : '0'} {ja ? 'こ' : 'cupcakes'}
      </p>
      {note && (
        <p className={`bakery-note${happy ? ' bakery-note-good' : ''}${tries >= 2 && !happy ? ' bakery-note-pip' : ''}`}>
          {tries >= 2 && !happy && <Pip size={34} mood="wave" />}
          <span>{note}</span>
        </p>
      )}
      {/* The stack of boxes: drag one to the counter, or drag one back here. */}
      <div className={`bake-stack-row${dragOff ? ' bake-stack-takeback' : ''}`} data-drop="stack">
        <button
          type="button"
          className="bake-stack"
          onPointerDown={start('new')}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          disabled={demo || happy || boxes >= 12}
          aria-label={ja ? 'はこを たす' : 'Add a box'}
        >
          {[2, 1, 0].map((k) => (
            <span key={k} className="bake-stack-box" style={{ '--k': k }}>
              <span className="bake-stack-lid" />
              <Thing id="cupcake" size={22} />
              <b>×{order.size}</b>
            </span>
          ))}
        </button>
        <span className="bake-stack-text">
          {dragOff ? (
            <strong>{ja ? 'ここで はなすと もどせるよ' : 'Let go to put it back'}</strong>
          ) : (
            <>
              <strong>{ja ? 'はこを ドラッグ' : 'Drag a box to the counter'}</strong>
              <small>{ja ? 'タップでも OK。もどすときは カウンターから ドラッグ' : 'or tap the boxes. Drag one off the counter to take it back.'}</small>
            </>
          )}
        </span>
      </div>
      {drag && (
        <div className={`bake-ghost${drag.item !== 'new' && drag.over !== 'counter' ? ' bake-ghost-away' : ''}`} style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <span className="bake-box">{boxFace(null)}</span>
        </div>
      )}
      <button
        type="button"
        className={`bake-serve${tries >= 3 && !demo && !happy && boxes === order.boxes ? ' bake-serve-pulse' : ''}`}
        disabled={!boxes || happy || demo}
        onClick={serve}
      >
        {ja ? 'どうぞ！' : 'Serve it!'}
      </button>
      {party && (
        <Finale
          title={ja ? 'パーティー ケーキ かんせい！' : 'You built the party cake!'}
          line={
            party.decor
              ? ja
                ? `おみせに ${party.decor.ja}が ふえたよ！`
                : `New for your shop: ${party.decor.en}!`
              : ja
                ? `ケーキ ${party.made}こめ！`
                : `Cake number ${party.made}!`
          }
          button={ja ? 'やったね！ →' : 'Yay! →'}
          onDone={() => onEnd(party.coins)}
        >
          <PartyCake pieces={ORDERS} lit size={170} />
          <span className="finale-guests">
            {served.map((who, i) => (
              <span key={i} className="finale-guest" style={{ animationDelay: `${i * 0.12}s` }}>
                <Thing id={WHO_THING[who]} size={40} />
              </span>
            ))}
          </span>
        </Finale>
      )}
    </div>
  );
}

// ---- Speed Shapes ----
// Toddler and K: find the circle, star, heart... 1st grade: polygon names
// (pentagon, hexagon, octagon). 2nd grade: count sides and corners on
// lopsided shapes, and name them. 3rd and 4th: quadrilaterals (rhombus,
// trapezoid, parallelogram, kite) and the shape with a right angle.
const SHAPE_SET = ['circle', 'square', 'triangle', 'rectangle', 'star', 'heart', 'oval', 'diamond'];
const SHAPE_COLORS = ['#EF4444', '#3B6FEF', '#2FAE6B', '#F5A623', '#8E4FD6', '#EC4899'];
const POLY_NAMES = { 3: 'triangle', 4: 'quadrilateral', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon' };
const QUADS = {
  square: [[20, 20], [80, 20], [80, 80], [20, 80]],
  rectangle: [[8, 30], [92, 30], [92, 70], [8, 70]],
  rhombus: [[50, 6], [84, 50], [50, 94], [16, 50]],
  parallelogram: [[28, 28], [96, 28], [72, 72], [4, 72]],
  trapezoid: [[32, 24], [68, 24], [94, 76], [6, 76]],
  kite: [[50, 6], [80, 38], [50, 94], [20, 38]],
};
const RIGHT = { 'right triangle': [[14, 14], [14, 86], [86, 86]], rectangle: QUADS.rectangle, square: QUADS.square };
const NOT_RIGHT = {
  triangle: [[50, 10], [92, 84], [8, 84]],
  rhombus: QUADS.rhombus,
  parallelogram: QUADS.parallelogram,
  trapezoid: QUADS.trapezoid,
  kite: QUADS.kite,
};
const regular = (n) => Array.from({ length: n }, (_, i) => {
  const t = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return [50 + 42 * Math.cos(t), 52 + 42 * Math.sin(t)];
});
// A lopsided shape with n sides (so the sides have to be counted).
const lopsided = (n) => Array.from({ length: n }, (_, i) => {
  const t = (i * 2 * Math.PI) / n + ((Math.random() - 0.5) * Math.PI) / (n * 1.6);
  const r = 34 + Math.random() * 10;
  return [50 + r * Math.cos(t), 50 + r * Math.sin(t)];
});
const poly = (points, name, extra = {}) => ({ points, name, rot: rand(0, 3) * 90 + rand(-20, 20), ...extra });

function shapeRound(grade) {
  const colors = shuffle(SHAPE_COLORS);
  const finish = (clue, say, opts, correct) => ({
    clue,
    say,
    opts: opts.map((o, i) => ({ ...o, key: `${i}`, c: colors[i] })),
    correct: `${opts.indexOf(correct)}`,
    id: Math.random(),
  });
  if (grade === 'p' || grade === 'k') {
    const pool = grade === 'p' ? SHAPE_SET.slice(0, 6) : SHAPE_SET;
    const opts = shuffle(pool).slice(0, 4).map((icon) => ({ icon, name: icon }));
    const want = opts[rand(0, 3)];
    return finish(`Find the ${want.name}!`, `${want.name}!`, opts, want);
  }
  if (grade === '1') {
    const names = shuffle(['triangle', 'square', 'rectangle', 'pentagon', 'hexagon', 'octagon', 'circle']).slice(0, 4);
    const opts = names.map((name) => {
      if (name === 'circle') return { icon: 'circle', name };
      if (name === 'square') return poly(QUADS.square, name, { rot: 0 });
      if (name === 'rectangle') return poly(QUADS.rectangle, name, { rot: 0 });
      const n = { triangle: 3, pentagon: 5, hexagon: 6, octagon: 8 }[name];
      return poly(regular(n), name, { rot: 0 });
    });
    const want = opts[rand(0, 3)];
    return finish(`Find the ${want.name}!`, `${want.name}!`, opts, want);
  }
  const kind = grade === '2' ? (Math.random() < 0.6 ? 'count' : 'name') : pick3(['count', 'quad', 'quad', 'right']);
  if (kind === 'count' || kind === 'name') {
    const sides = shuffle(grade === '2' ? [3, 4, 5, 6, 8] : [3, 4, 5, 6, 7, 8]).slice(0, 4);
    const opts = sides.map((n) => poly(lopsided(n), POLY_NAMES[n], { sides: n }));
    const want = opts[rand(0, 3)];
    if (kind === 'name') return finish(`Find the ${want.name}!`, `${want.name}!`, opts, want);
    const corners = Math.random() < 0.4;
    const clue = `Find the shape with ${want.sides} ${corners ? 'corners' : 'sides'}!`;
    return finish(clue, clue, opts, want);
  }
  if (kind === 'quad') {
    const names = shuffle(Object.keys(QUADS)).slice(0, 4);
    const opts = names.map((name) => poly(QUADS[name], name));
    const want = opts[rand(0, 3)];
    return finish(`Find the ${want.name}!`, `${want.name}!`, opts, want);
  }
  const [rName, rPts] = pick3(Object.entries(RIGHT));
  const others = shuffle(Object.entries(NOT_RIGHT)).slice(0, 3);
  const want = poly(rPts, rName);
  const opts = shuffle([want, ...others.map(([n, pts]) => poly(pts, n))]);
  return finish('Find the shape with a right angle!', 'Find the shape with a right angle!', opts, want);
}
function pick3(list) {
  return list[rand(0, list.length - 1)];
}

function ShapePic({ o }) {
  if (o.icon) return <ShapeIcon shape={o.icon} color={o.c} size={110} />;
  return (
    <svg viewBox="0 0 100 100" width={110} height={110} aria-hidden="true">
      <polygon
        points={o.points.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}
        transform={`rotate(${o.rot} 50 50)`}
        fill={o.c}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Shapes({ grade, onEnd }) {
  const seconds = 45;
  const left = useCountdown(seconds, true);
  const [round, setRound] = useState(() => shapeRound(grade));
  const [score, setScore] = useState(0);
  const [bad, setBad] = useState(null);
  const busy = useRef(false);
  useEffect(() => {
    speak(round.say);
  }, [round]);
  useEffect(() => {
    if (left === 0) onEnd(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  function tap(o) {
    if (left === 0 || busy.current) return;
    if (o.key === round.correct) {
      playCorrectChime();
      setScore((s) => s + 1);
      busy.current = true;
      setTimeout(() => {
        busy.current = false;
        setRound(shapeRound(grade));
      }, 200);
    } else {
      playIncorrectBuzz();
      setBad(o.key);
      setTimeout(() => setBad(null), 400);
    }
  }

  return (
    <div className="game game-shapes">
      <TimerBar left={left} seconds={seconds} score={score} label="found" />
      <button type="button" className={`game-question${round.clue.length > 22 ? ' game-question-long' : ''}`} onClick={() => speak(round.say)}>
        {round.clue}
      </button>
      <div className="shapes-grid">
        {round.opts.map((o) => (
          <button key={`${round.id}-${o.key}`} type="button" className={`shapes-btn${bad === o.key ? ' make10-bad' : ''}`} onClick={() => tap(o)} aria-label={o.name}>
            <ShapePic o={o} />
          </button>
        ))}
      </div>
    </div>
  );
}

const PLAY = {
  bubbles: Bubbles,
  make10: Make10,
  bakery: Bakery,
  snake: (props) => <NumberSnake {...props} makeRound={bubbleRound} />,
  goFish: GoFish,
  toyShop: ToyShop,
  clock: SetClock,
  shapes: Shapes,
  barModel: BarModel,
  bondPop: BondPop,
  makeTen: MakeTen,
  sumGridRush: SumGridRush,
  patternStreak: PatternStreak,
  equalDiff: EqualDiff,
  timesTiles: TimesTiles,
  pizza: PizzaShop,
  logicLock: LogicLock,
};
const SCORE_WORD = {
  bubbles: 'popped',
  make10: 'pairs',
  bakery: 'coins',
  snake: 'answers',
  goFish: 'pairs',
  toyShop: 'stars',
  clock: 'stars',
  shapes: 'shapes found',
  barModel: 'stars',
  bondPop: 'bonds',
  makeTen: 'done',
  sumGridRush: 'grids',
  patternStreak: 'in a row',
  equalDiff: 'stars',
  timesTiles: 'matches',
  pizza: 'coins',
  logicLock: 'stars',
};
// The games that end with Time's up (the others end their own way).
const TIMED = ['bubbles', 'snake', 'make10', 'shapes', 'bondPop', 'makeTen', 'sumGridRush', 'timesTiles'];

// One game: how to play (said out loud), 3-2-1, play, and the result.
export function Game({ game, playerId, grade, onDone, stickerSlot, onExit, lang }) {
  const info = GAMES.find((g) => g.id === game);
  // Japanese only for the games that have it (the rest stay in English).
  const ja = lang === 'ja' && Boolean(info.ja);
  const talk = sayIn(ja ? 'ja' : 'en');
  const scoreWord = ja ? 'コイン' : SCORE_WORD[game];
  const [phase, setPhase] = useState('ready');
  const [count, setCount] = useState(3);
  const [result, setResult] = useState(null);
  const [run, setRun] = useState(0);
  const best = gameBest(playerId, grade, game);
  // Leaving the game (Back, home, another screen) stops Pip mid-sentence.
  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    if (phase !== 'ready') return undefined;
    talk(ja ? `${info.ja.how} よーい、3、2、1、スタート！` : `${info.how} Ready? 3, 2, 1, go!`);
    setCount(3);
    const id = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(id);
          setPhase('play');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, run]);

  function end(score) {
    const isBest = score > best;
    if (isBest) saveBest(playerId, grade, game, score);
    setResult({ score, isBest, before: best });
    setPhase('done');
    if (ja) talk(isBest && best ? `しんきろく！ ${score}コイン！` : `よく できました！ ${score}コイン！`);
    else talk(isBest && best ? `New best! ${score}!` : `Great game! ${score} ${SCORE_WORD[game]}!`);
    onDone?.(game, score);
  }

  if (phase === 'ready') {
    return (
      <div className="mm mm-ready">
        <p className="mm-how">{ja ? info.ja.how : info.how}</p>
        <div className="mm-count" key={count}>
          {count || (ja ? 'スタート！' : 'Go!')}
        </div>
        <p className="mm-best">{ja ? (best ? `さいこう: ${best}` : 'はじめての ゲーム！') : best ? `Your best: ${best}` : 'Your first game!'}</p>
      </div>
    );
  }
  if (phase === 'done' && result) {
    return (
      <div className="mm mm-done">
        <Confetti />
        <span className="complete-pip">
          <Pip size={96} mood="cheer" />
        </span>
        <h2 className="screen-title">{ja ? 'よく できました！' : TIMED.includes(game) ? "Time's up!" : 'Great game!'}</h2>
        <div className="mm-score">
          <span>
            <CountUp to={result.score} />
          </span>{' '}
          {scoreWord}
        </div>
        <p className="mm-best">
          {ja ? (
            result.isBest && result.before ? <strong>しんきろく！（まえは {result.before}）</strong> : result.isBest ? 'はじめての きろく！ つぎは こえられるかな？' : `さいこう: ${result.before}`
          ) : result.isBest && result.before ? (
            <strong>New best! (was {result.before})</strong>
          ) : result.isBest ? (
            'Your first best score. Try to beat it!'
          ) : (
            `Your best: ${result.before}`
          )}
        </p>
        {stickerSlot}
        <button
          className="pill-btn-primary pill-btn-full"
          onClick={() => {
            setResult(null);
            setRun((r) => r + 1);
            setPhase('ready');
          }}
        >
          {ja ? 'もう いっかい →' : 'Play again →'}
        </button>
        <button type="button" className="back-link back-link-center" onClick={onExit}>
          {ja ? 'ホームに もどる' : 'Back home'}
        </button>
      </div>
    );
  }
  const Play = PLAY[game];
  return <Play key={run} grade={grade} onEnd={end} lang={ja ? 'ja' : 'en'} playerId={playerId} />;
}

// Each game's little picture (the games list and the home page).
export function GameArt({ id }) {
  if (id === 'bubbles') return <span className="games-art-bubble">7</span>;
  if (id === 'make10') {
    return (
      <span className="games-art-tiles">
        <i>3</i>
        <i>7</i>
      </span>
    );
  }
  if (id === 'bakery') return <Thing id="cupcake" size={48} />;
  if (id === 'goFish') {
    return (
      <span className="games-art-gofish">
        <span className="gf-art-card">3</span>
        <Thing id="fish" size={30} />
      </span>
    );
  }
  if (id === 'toyShop') {
    return (
      <span className="games-art-coins">
        <Coin value={25} size={40} />
        <Coin value={10} size={30} />
      </span>
    );
  }
  if (id === 'clock') {
    return (
      <svg viewBox="0 0 50 50" width="46" height="46">
        <circle cx="25" cy="25" r="21" fill="#fff" stroke="#ffd23f" strokeWidth="4" />
        <path d="M25 25V12M25 25l8 5" stroke="#173a66" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="25" cy="25" r="2.5" fill="#173a66" />
      </svg>
    );
  }
  if (id === 'snake') {
    return (
      <svg viewBox="0 0 50 50" width="48" height="48">
        <path d="M8 40c6-10 14 2 20-8s-2-16 8-20" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
        <circle cx="38" cy="12" r="7" fill="#fff" />
        <circle cx="40" cy="10" r="2" fill="#1f8a51" />
        <circle cx="12" cy="20" r="6" fill="#ffd23f" />
        <text x="12" y="23.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#7a4a00">7</text>
      </svg>
    );
  }
  if (id === 'shapes') return <ShapeIcon shape="star" color="#ffd23f" size={50} />;
  if (id === 'patternStreak') return <PatternShape id="triangle:90:0" color="#fff" size={44} />;
  if (id === 'pizza') {
    return (
      <svg viewBox="0 0 50 50" width="46" height="46">
        <circle cx="25" cy="25" r="22" fill="#ffe08a" stroke="#fff" strokeWidth="3" />
        <path d="M25 25 L25 3 A22 22 0 0 1 47 25 Z" fill="#e5484d" stroke="#fff" strokeWidth="3" />
      </svg>
    );
  }
  if (id === 'logicLock') {
    return (
      <svg viewBox="0 0 50 50" width="44" height="44">
        <path d="M15 22v-6a10 10 0 0 1 20 0v6" fill="none" stroke="#fff" strokeWidth="5" />
        <rect x="9" y="22" width="32" height="24" rx="6" fill="#ffd23f" />
        <circle cx="25" cy="33" r="4" fill="#334155" />
      </svg>
    );
  }
  if (id === 'barModel') {
    return (
      <span className="games-art-bars">
        <i style={{ width: '70%' }} />
        <i style={{ width: '45%', background: '#ffb84d' }} />
      </span>
    );
  }
  if (id === 'bondPop') {
    return (
      <svg viewBox="0 0 50 50" width="46" height="46">
        <path d="M25 14 L12 36 M25 14 L38 36" stroke="#fff" strokeWidth="3" />
        <circle cx="25" cy="13" r="9" fill="#fff" />
        <circle cx="12" cy="37" r="8" fill="#fff" />
        <circle cx="38" cy="37" r="8" fill="#ffd23f" />
      </svg>
    );
  }
  const TEXT = { makeTen: '8+2', sumGridRush: '10', equalDiff: '−', timesTiles: '3×4' };
  return <span className="games-art-text">{TEXT[id] || '?'}</span>;
}

// The list of games.
export default function GamesMenu({ playerId, grade, onPick, lang }) {
  useEffect(() => {
    speak('Pick a game!');
  }, []);
  return (
    <div className="games-menu">
      {gamesFor(grade).map((g) => (
        <button
          key={g.id}
          type="button"
          className="games-card"
          style={{ background: `linear-gradient(135deg, ${g.color[0]}, ${g.color[1]})` }}
          onClick={() => onPick(g.id)}
        >
          <span className="games-card-art" aria-hidden="true">
            <GameArt id={g.id} />
          </span>
          <span className="games-card-text">
            {gameTitle(g.id, grade, lang)}
            <small>
              {gameBest(playerId, grade, g.id)
                ? `${lang === 'ja' && g.ja ? 'さいこう' : 'Best'}: ${gameBest(playerId, grade, g.id)}`
                : lang === 'ja' && g.ja
                  ? g.ja.sub
                  : g.sub.replace('make 10', `make ${targetFor(grade)}`)}
            </small>
          </span>
        </button>
      ))}
    </div>
  );
}
