import { useEffect, useRef, useState } from 'react';
import { JA_SHAPES, SHAPE_LOOKS, ShapeIcon } from './preK.jsx';
import { Thing } from './Drawings.jsx';
import { playCorrectChime, playStickerPick, speak, speakInLanguage } from './sound.js';

// Tap-and-hear boards for the youngest players (Toddler and K): big,
// bright buttons for shapes, colors and animals. Tap one and it bounces
// and says its name (and a little more: what a shape looks like, what's
// that color, what the animal says). "Find it!" turns the board into a
// game: MathPop asks for one ("Find the triangle!") and cheers when it's
// tapped; a wrong tap just says what that one is and asks again.

const SHAPE_ORDER = ['circle', 'square', 'triangle', 'star', 'heart', 'rectangle', 'oval', 'diamond'];
const SHAPE_COLORS = {
  circle: '#EF4444',
  square: '#3B6FEF',
  triangle: '#2FAE6B',
  star: '#F5A623',
  heart: '#EC4899',
  rectangle: '#8E4FD6',
  oval: '#14B8A6',
  diamond: '#F0954F',
};

// [id, hex, something that color (a drawing), English, Japanese color, Japanese thing]
const COLORS = [
  ['red', '#EF4444', 'apple', 'an apple', 'あか', 'りんご'],
  ['orange', '#FF9F43', 'orange', 'an orange', 'オレンジ', 'オレンジ'],
  ['yellow', '#FFD23F', 'banana', 'a banana', 'きいろ', 'バナナ'],
  ['green', '#2FAE6B', 'frog', 'a frog', 'みどり', 'かえる'],
  ['blue', '#3B8CF0', 'fish', 'a fish', 'あお', 'さかな'],
  ['purple', '#9B6BF2', 'grapes', 'grapes', 'むらさき', 'ぶどう'],
  ['pink', '#FF8FB1', 'pig', 'a pig', 'ピンク', 'ぶた'],
  ['brown', '#A0673D', 'bear', 'a bear', 'ちゃいろ', 'くま'],
  ['black', '#2B2D42', 'panda', "a panda's ears", 'くろ', 'パンダ'],
  ['white', '#FFFFFF', 'cloud', 'a cloud', 'しろ', 'くも'],
];

// [id, English sound, Japanese name, Japanese sound]
const ANIMALS = [
  ['dog', 'Woof woof!', 'いぬ', 'わんわん！'],
  ['cat', 'Meow!', 'ねこ', 'にゃー！'],
  ['frog', 'Ribbit ribbit!', 'かえる', 'けろけろ！'],
  ['pig', 'Oink oink!', 'ぶた', 'ぶーぶー！'],
  ['chicken', 'Cluck cluck!', 'にわとり', 'こけこっこー！'],
  ['duck', 'Quack quack!', 'あひる', 'がーがー！'],
  ['bear', 'Grrr!', 'くま', 'がおー！'],
  ['monkey', 'Ooh ooh, ah ah!', 'さる', 'うきうき！'],
  ['bunny', 'Hop hop hop!', 'うさぎ', 'ぴょんぴょん！'],
  ['fish', 'Blub blub!', 'さかな', 'すいすい！'],
];

const cap = (s) => s[0].toUpperCase() + s.slice(1);

// Every board as a list of items: { id, name (shown), say (on a tap),
// find (the "Find the ..." name), look (what's on the button), bg }.
function boardItems(board, ja) {
  if (board === 'shapes') {
    return SHAPE_ORDER.map((id) => ({
      id,
      name: ja ? JA_SHAPES[id][0] : cap(id),
      say: ja ? `${JA_SHAPES[id][0]}！ ${JA_SHAPES[id][1]}` : `${cap(id)}! ${SHAPE_LOOKS[id]}`,
      find: ja ? JA_SHAPES[id][0] : `the ${id}`,
      look: <ShapeIcon shape={id} color={SHAPE_COLORS[id]} size={88} />,
      bg: '#fff',
    }));
  }
  if (board === 'colors') {
    return COLORS.map(([id, hex, thing, like, jaName, jaThing]) => ({
      id,
      name: ja ? jaName : cap(id),
      say: ja ? `${jaName}！ ${jaThing}の ${jaName}！` : `${cap(id)}! ${cap(id)}, like ${like}!`,
      find: ja ? jaName : id,
      look: (
        <span className="tap-color-look">
          <Thing id={thing} size={64} />
        </span>
      ),
      bg: hex,
      light: ['yellow', 'white'].includes(id),
    }));
  }
  return ANIMALS.map(([id, sound, jaName, jaSound]) => ({
    id,
    name: ja ? jaName : cap(id),
    say: ja ? `${jaName}！ ${jaSound}` : `${cap(id)}! ${sound}`,
    find: ja ? jaName : `the ${id}`,
    look: <Thing id={id} size={84} />,
    bg: '#fff',
  }));
}

function pickOther(items, notId) {
  const rest = items.filter((i) => i.id !== notId);
  return rest[Math.floor(Math.random() * rest.length)];
}

export default function TapBoard({ board, lang = 'en' }) {
  const ja = lang === 'ja';
  const say = (text) => (ja ? speakInLanguage(text, 'ja-JP') : speak(text));
  const items = boardItems(board, ja);
  const [played, setPlayed] = useState(null);
  const [tapKey, setTapKey] = useState(0);
  const [mode, setMode] = useState('tap');
  const [target, setTarget] = useState(null);
  const [cheer, setCheer] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const ask = (item) => say(ja ? `${item.find}は どれかな？` : `Find ${item.find}!`);

  function startFind() {
    setMode('find');
    const first = pickOther(items, null);
    setTarget(first);
    setCheer(null);
    ask(first);
  }

  function tap(item) {
    playStickerPick();
    setPlayed(item.id);
    setTapKey((k) => k + 1);
    if (navigator.vibrate) navigator.vibrate(15);
    if (mode !== 'find' || !target) {
      say(item.say);
      return;
    }
    if (item.id === target.id) {
      playCorrectChime();
      setCheer(item.id);
      say(ja ? `やったね！ ${item.name}だね！` : `Yes! That's ${item.find}!`);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const next = pickOther(items, item.id);
        setTarget(next);
        setCheer(null);
        ask(next);
      }, 2200);
    } else {
      say(ja ? `それは ${item.name}。 ${target.find}は どれかな？` : `That's ${item.find}. Can you find ${target.find}?`);
    }
  }

  return (
    <div className={`tap-board tap-board-${board}`}>
      <div className="tap-modes" role="radiogroup" aria-label="How to play">
        <button
          role="radio"
          aria-checked={mode === 'tap'}
          className={`tap-mode${mode === 'tap' ? ' tap-mode-on' : ''}`}
          onClick={() => {
            setMode('tap');
            setTarget(null);
            setCheer(null);
          }}
        >
          {ja ? 'タップして きこう' : 'Tap & hear'}
        </button>
        <button role="radio" aria-checked={mode === 'find'} className={`tap-mode${mode === 'find' ? ' tap-mode-on' : ''}`} onClick={startFind}>
          {ja ? 'さがそう！' : 'Find it!'}
        </button>
      </div>
      {mode === 'find' && target && (
        <button className="tap-ask" onClick={() => ask(target)}>
          {ja ? `${target.name}は どれ？` : `Find ${target.find}!`}
          <span className="tap-ask-hint">{ja ? 'タップで もういちど' : 'Tap to hear again'}</span>
        </button>
      )}
      <div className="tap-grid">
        {items.map((item) => (
          <button
            key={played === item.id ? `${item.id}-${tapKey}` : item.id}
            className={`tap-btn${played === item.id ? ' tap-btn-played' : ''}${cheer === item.id ? ' tap-btn-cheer' : ''}${item.light ? ' tap-btn-light' : ''}`}
            style={{ '--tap-bg': item.bg }}
            onClick={() => tap(item)}
            aria-label={item.name}
          >
            <span className="tap-look">{item.look}</span>
            <span className="tap-name">{item.name}</span>
            {cheer === item.id && (
              <span className="tap-confetti" aria-hidden="true">
                {Array.from({ length: 8 }, (_, i) => (
                  <i key={i} />
                ))}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
