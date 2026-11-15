import { useEffect, useRef, useState } from 'react';
import Pip from './Pip.jsx';
import { Heart } from './arcade/kit.jsx';
import { madMinuteFact } from './MadMinute.jsx';
import { pick, rand, shuffle } from './gameKit.jsx';
import { playCorrectChime, playIncorrectBuzz, playStickerPick, playStickerStick, speak } from './sound.js';
import { PuzzleTop, VALUE_COLORS, dots, labelSize, sayValue, useLevel, valueKeys, waysOf, writeValue } from './puzzleKit.jsx';

// Games against the board or against Pip, with levels inside:
//   TapMatch     tap tiles into the tray; three worth the same clear away
//   FourInRow    answer to drop a piece; four in a row beats Pip
//   DominoMatch  play dominoes end to end: the touching ends are worth the same

// -------------------------------------------------------------- Tap Match
// Two layers of tiles: a tile with one on top of it can't be tapped yet.
function matchBoard(grade, level) {
  const kinds = Math.min(grade === 'p' ? 4 : 6, 3 + Math.floor(level / 2));
  const keys = valueKeys(grade, kinds);
  const sets = level >= 3 && grade !== 'p' ? 2 : 1;
  let id = 0;
  const tiles = keys.flatMap((key, ki) => Array.from({ length: sets }, () => waysOf(grade, key, 3)).flat().map((label) => ({ key, label, c: ki })));
  // Spots in half-tile steps: a bottom layer, and a top layer between.
  const cols = 4;
  const bottom = [];
  for (let r = 0; bottom.length < Math.ceil(tiles.length * 0.62); r++) for (let c = 0; c < cols; c++) bottom.push({ x: c * 2, y: r * 2, z: 0 });
  const top = [];
  const rows = Math.ceil(bottom.length / cols);
  for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) top.push({ x: c * 2 + 1, y: r * 2 + 1, z: 1 });
  const spots = [...bottom.slice(0, tiles.length), ...shuffle(top)].slice(0, tiles.length);
  return shuffle(tiles).map((t, i) => ({ ...t, ...spots[i], id: ++id }));
}
const covered = (t, all) => all.some((o) => o.z > t.z && Math.abs(o.x - t.x) < 2 && Math.abs(o.y - t.y) < 2);

export function TapMatch({ grade, onEnd, playerId }) {
  const [level, levelUp] = useLevel(playerId, grade, 'tapMatch');
  const [tiles, setTiles] = useState(() => matchBoard(grade, level));
  const [tray, setTray] = useState([]);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [banner, setBanner] = useState(null);
  const [boards, setBoards] = useState(0);
  const [clearing, setClearing] = useState([]);
  const colored = grade === 'p';
  const SLOTS = 7;
  useEffect(() => {
    speak('Tap tiles to put them in the tray. Three worth the same clear away! Don\'t fill the tray.');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  function show(text, ms, then) {
    setBanner(text);
    setTimeout(() => {
      setBanner(null);
      then?.();
    }, ms);
  }
  function tap(t) {
    if (banner || clearing.length || covered(t, tiles)) return;
    playStickerPick();
    speak(sayValue(t.label));
    const rest = tiles.filter((x) => x.id !== t.id);
    // It goes next to the ones worth the same.
    const at = tray.map((x) => x.key).lastIndexOf(t.key);
    const next = at === -1 ? [...tray, t] : [...tray.slice(0, at + 1), t, ...tray.slice(at + 1)];
    setTiles(rest);
    setTray(next);
    const same = next.filter((x) => x.key === t.key);
    if (same.length === 3) {
      setClearing(same.map((x) => x.id));
      setTimeout(() => {
        playCorrectChime();
        setClearing([]);
        const left = next.filter((x) => x.key !== t.key);
        setTray(left);
        const total = score + 1;
        setScore(total);
        speak(`${same.map((x) => sayValue(x.label)).join(', ')}. All the same!`);
        if (!rest.length) {
          playStickerStick();
          const lv = levelUp();
          const nb = boards + 1;
          setBoards(nb);
          if (nb >= 3) show('You did it!', 1500, () => onEnd(total + 3));
          else
            show(`Level ${lv}!`, 1400, () => {
              setTiles(matchBoard(grade, lv));
              setTray([]);
            });
          setScore(total + 3);
        }
      }, 420);
      return;
    }
    if (next.length >= SLOTS) {
      playIncorrectBuzz();
      const h = hearts - 1;
      setHearts(h);
      if (h <= 0) {
        speak('The tray is full! Out of hearts.');
        show('Tray full!', 1500, () => onEnd(score));
      } else {
        speak('The tray is full! Let\'s try that board again.');
        show('Tray full! Try again', 1500, () => {
          setTiles(matchBoard(grade, level));
          setTray([]);
        });
      }
    }
  }
  const maxX = Math.max(8, ...tiles.map((t) => t.x + 2));
  const maxY = Math.max(2, ...tiles.map((t) => t.y + 2));
  return (
    <div className="game game-pz">
      <PuzzleTop level={level} score={score} label="matches">
        <span className="snake-hearts">
          {Array.from({ length: hearts }, (_, i) => (
            <span key={i} className="snake-heart">
              <Heart />
            </span>
          ))}
        </span>
      </PuzzleTop>
      <p className="game-ask">Three worth the same clear away</p>
      <div className="tm-pile" style={{ '--mx': maxX, '--my': maxY }}>
        {[...tiles].sort((a, b) => a.z - b.z).map((t) => {
          const off = covered(t, tiles);
          return (
            <button key={t.id} type="button" className={`tm-tile${off ? ' tm-off' : ''}`} style={{ '--x': t.x, '--y': t.y, '--z': t.z, '--tc': colored ? VALUE_COLORS[t.c % VALUE_COLORS.length] : '#fff', '--fs': labelSize(t.label), color: colored ? '#fff' : '#173a66' }} onClick={() => tap(t)}>
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="tm-tray" style={{ '--slots': SLOTS }}>
        {Array.from({ length: SLOTS }, (_, i) => {
          const t = tray[i];
          return (
            <span key={t ? t.id : `s${i}`} className={`tm-slot${t ? ' tm-in' : ''}${t && clearing.includes(t.id) ? ' tm-clear' : ''}`} style={t ? { '--tc': colored ? VALUE_COLORS[t.c % VALUE_COLORS.length] : '#fff', '--fs': labelSize(t.label) * 0.85, color: colored ? '#fff' : '#173a66' } : undefined}>
              {t ? t.label : ''}
            </span>
          );
        })}
      </div>
      {banner && <div className="pz-banner">{banner}</div>}
    </div>
  );
}

// ------------------------------------------------------------ Four in a Row
// A question for the grade, with three answers to pick from.
function question(grade) {
  if (grade === 'p') {
    const v = rand(1, 5);
    return { text: dots(v), say: 'How many dots?', answer: v, opts: shuffle([v, ...shuffle([1, 2, 3, 4, 5].filter((x) => x !== v)).slice(0, 2)]) };
  }
  const f = madMinuteFact(grade);
  const a = f.answer;
  const wrong = shuffle([a + 1, a - 1, a + 2, a - 2, a + 10].filter((x) => x >= 0 && x !== a)).slice(0, 2);
  return { text: f.text, say: sayValue(f.text), answer: a, opts: shuffle([a, ...wrong]) };
}
const FOUR = { p: [5, 4, 3], k: [6, 5, 4] };
function winLine(board, rows, cols, need, who) {
  const at = (r, c) => (r >= 0 && r < rows && c >= 0 && c < cols ? board[r * cols + c] : null);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      for (const [dr, dc] of [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1],
      ]) {
        const line = Array.from({ length: need }, (_, k) => [r + dr * k, c + dc * k]);
        if (line.every(([y, x]) => at(y, x) === who)) return line.map(([y, x]) => y * cols + x);
      }
  return null;
}
const dropRow = (board, rows, cols, c) => {
  for (let r = rows - 1; r >= 0; r--) if (!board[r * cols + c]) return r;
  return -1;
};

export function FourInRow({ grade, onEnd, playerId }) {
  const [level, levelUp] = useLevel(playerId, grade, 'fourInRow');
  const [cols, rows, need] = FOUR[grade] || [7, 6, 4];
  const [board, setBoard] = useState(() => Array(rows * cols).fill(null));
  const [phase, setPhase] = useState('ask'); // ask, drop, pip, over
  const [q, setQ] = useState(() => question(grade));
  const [bad, setBad] = useState(null);
  const [line, setLine] = useState(null);
  const [result, setResult] = useState(null);
  const [last, setLast] = useState(null);
  const timer = useRef([]);
  useEffect(() => () => timer.current.forEach(clearTimeout), []);
  const later = (fn, ms) => timer.current.push(setTimeout(fn, ms));
  useEffect(() => {
    speak(`Get ${need} in a row before Pip! Answer to drop your piece.`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (phase === 'ask') later(() => speak(q.say), 300);
  }, [q, phase]); // eslint-disable-line react-hooks/exhaustive-deps
  function finish(who, b, ln) {
    setLine(ln);
    setPhase('over');
    if (who === 'you') {
      playStickerStick();
      const lv = levelUp();
      setResult(`You win! Level ${lv} next.`);
      speak(`${need} in a row! You beat Pip!`);
      later(() => onEnd(3), 2200);
    } else if (who === 'pip') {
      setResult('Pip wins this time!');
      speak('Pip got four in a row! Try again!');
      later(() => onEnd(0), 2200);
    } else {
      setResult('A tie!');
      speak("It's a tie!");
      later(() => onEnd(1), 2000);
    }
    return b;
  }
  function pipMove(b) {
    const open = Array.from({ length: cols }, (_, c) => c).filter((c) => dropRow(b, rows, cols, c) !== -1);
    const tryAt = (c, who) => {
      const t = [...b];
      t[dropRow(b, rows, cols, c) * cols + c] = who;
      return winLine(t, rows, cols, need, who);
    };
    // Smarter as the levels go: win, then block, then the middle.
    let c = open.find((x) => tryAt(x, 'pip'));
    if (c === undefined && level >= 2) c = open.find((x) => tryAt(x, 'you'));
    if (c === undefined) {
      const mid = (cols - 1) / 2;
      c = level >= 3 && Math.random() < 0.7 ? [...open].sort((a, z) => Math.abs(a - mid) - Math.abs(z - mid))[0] : pick(open);
    }
    const r = dropRow(b, rows, cols, c);
    const nb = [...b];
    nb[r * cols + c] = 'pip';
    playStickerPick();
    setBoard(nb);
    setLast(r * cols + c);
    const w = winLine(nb, rows, cols, need, 'pip');
    if (w) return finish('pip', nb, w);
    if (!nb.includes(null)) return finish('tie', nb, null);
    setQ(question(grade));
    setPhase('ask');
    return nb;
  }
  function answer(v) {
    if (phase !== 'ask') return;
    if (v === q.answer) {
      playCorrectChime();
      speak('Yes! Pick where your piece goes.');
      setPhase('drop');
    } else {
      playIncorrectBuzz();
      setBad(v);
      speak(`Oops, it's ${q.answer}. Pip's turn!`);
      setPhase('pip');
      later(() => {
        setBad(null);
        pipMove(board);
      }, 1300);
    }
  }
  function drop(c) {
    if (phase !== 'drop') return;
    const r = dropRow(board, rows, cols, c);
    if (r === -1) return;
    playStickerPick();
    const nb = [...board];
    nb[r * cols + c] = 'you';
    setBoard(nb);
    setLast(r * cols + c);
    const w = winLine(nb, rows, cols, need, 'you');
    if (w) return finish('you', nb, w);
    if (!nb.includes(null)) return finish('tie', nb, null);
    setPhase('pip');
    later(() => pipMove(nb), 800);
    return undefined;
  }
  return (
    <div className="game game-pz">
      <PuzzleTop level={level} score={need} label="in a row wins" />
      {phase === 'ask' || (phase === 'pip' && bad !== null) ? (
        <div className="fr-ask">
          <div className="game-question">{q.text}</div>
          <div className="fr-opts">
            {q.opts.map((v) => (
              <button key={v} type="button" className={`choice-big${bad === v ? ' make10-bad' : ''}`} onClick={() => answer(v)}>
                {v}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="game-ask fr-turn">
          {phase === 'drop' ? 'Tap a column to drop your piece' : phase === 'pip' ? (
            <>
              <Pip size={28} /> Pip's turn…
            </>
          ) : (
            result
          )}
        </p>
      )}
      <div className={`fr-board${phase === 'drop' ? ' fr-live' : ''}`} style={{ '--cols': cols }}>
        {board.map((v, i) => (
          <button key={i} type="button" className="fr-cell" onClick={() => drop(i % cols)} aria-label={`Column ${(i % cols) + 1}`}>
            {v && <span className={`fr-piece fr-${v}${i === last ? ' fr-drop' : ''}${line && line.includes(i) ? ' fr-win' : ''}`} style={{ '--fall': Math.floor(i / cols) + 1 }} />}
          </button>
        ))}
      </div>
      <p className="fr-key">
        <span className="fr-piece fr-you fr-mini" /> You · <span className="fr-piece fr-pip fr-mini" /> Pip
      </p>
    </div>
  );
}

// ------------------------------------------------------------ Domino Match
// A set of dominoes from 7 values (like double-six), each end written a
// different way: dots, a number, a fact. Touching ends are worth the same.
function dominoValues(grade) {
  if (grade === 'p') return [1, 2, 3, 4];
  if (grade === 'k') return [0, 1, 2, 3, 4, 5, 6];
  if (grade === '1') return shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 7);
  if (grade === '2') return shuffle(Array.from({ length: 15 }, (_, i) => i + 6)).slice(0, 7);
  return shuffle([6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 24, 25, 27, 28, 30, 32, 35, 36]).slice(0, 7);
}
function endLabel(grade, v) {
  if (grade === 'p') return dots(v);
  if (grade === 'k') return v === 0 ? '0' : Math.random() < 0.5 ? dots(v) : String(v);
  if (grade === '3' || grade === '4') return writeValue('3', String(v));
  return v <= 1 ? String(v) : writeValue(grade === '1' ? 'k' : '1', String(v));
}
let domId = 0;
function dominoSet(grade) {
  const vals = dominoValues(grade);
  const set = [];
  for (let i = 0; i < vals.length; i++) for (let j = i; j < vals.length; j++) set.push({ id: ++domId, a: vals[i], b: vals[j], la: endLabel(grade, vals[i]), lb: endLabel(grade, vals[j]) });
  const s = shuffle(set);
  const hand = grade === 'p' ? 4 : 6;
  return { you: s.slice(0, hand), pip: s.slice(hand, hand * 2), pile: s.slice(hand * 2 + 1), chain: [s[hand * 2]] };
}
const ends = (chain) => ({ L: chain[0].a, R: chain[chain.length - 1].b });
// Put a domino on an end (turned around if needed); null if it doesn't fit.
function attach(chain, d) {
  const { L, R } = ends(chain);
  if (d.a === R) return [...chain, d];
  if (d.b === R) return [...chain, { ...d, a: d.b, b: d.a, la: d.lb, lb: d.la }];
  if (d.b === L) return [d, ...chain];
  if (d.a === L) return [{ ...d, a: d.b, b: d.a, la: d.lb, lb: d.la }, ...chain];
  return null;
}
function Domino({ d, small, onClick, glow, bad }) {
  const Half = ({ s }) => <span className="dm-half" style={{ '--fs': (s.includes('●') ? (s.length > 4 ? 0.62 : 0.8) : labelSize(s)) * (small ? 0.75 : 1) }}>{s}</span>;
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag type={onClick ? 'button' : undefined} className={`dm${small ? ' dm-small' : ''}${glow ? ' dm-glow' : ''}${bad ? ' make10-bad' : ''}`} onClick={onClick}>
      <Half s={d.la} />
      <i className="dm-line" />
      <Half s={d.lb} />
    </Tag>
  );
}

export function DominoMatch({ grade, onEnd, playerId }) {
  const [level, levelUp] = useLevel(playerId, grade, 'domino');
  const [g, setG] = useState(() => dominoSet(grade));
  const [turn, setTurn] = useState('you');
  const [bad, setBad] = useState(null);
  const [note, setNote] = useState(null);
  const [over, setOver] = useState(null);
  const [helped, setHelped] = useState(false);
  const timer = useRef([]);
  const stripRef = useRef(null);
  useEffect(() => () => timer.current.forEach(clearTimeout), []);
  const later = (fn, ms) => timer.current.push(setTimeout(fn, ms));
  useEffect(() => {
    speak('Play a domino on either end. The ends that touch have to be worth the same! Play all yours before Pip.');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = stripRef.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [g.chain.length]);
  const { L, R } = ends(g.chain);
  const playable = (d) => attach(g.chain, d) !== null;
  function done(who, state) {
    setOver(who);
    if (who === 'you') {
      playStickerStick();
      const lv = levelUp();
      speak(`You played all your dominoes! You win! Level ${lv} next.`);
      later(() => onEnd(3), 2200);
    } else {
      speak('Pip played all of theirs first! Good try!');
      later(() => onEnd(Math.max(0, 6 - state.you.length) > 3 ? 1 : 0), 2200);
    }
  }
  function pipTurn(state) {
    const d = state.pip.find((x) => attach(state.chain, x));
    let next;
    if (d) {
      next = { ...state, chain: attach(state.chain, d), pip: state.pip.filter((x) => x.id !== d.id) };
      speak('Pip played one!');
    } else if (state.pile.length) {
      next = { ...state, pip: [...state.pip, state.pile[0]], pile: state.pile.slice(1) };
      speak('Pip had to take one.');
    } else {
      next = state;
      speak('Pip passes.');
    }
    playStickerPick();
    setG(next);
    if (!next.pip.length) return done('pip', next);
    setTurn('you');
    return next;
  }
  function play(d) {
    if (turn !== 'you' || over) return;
    const chain = attach(g.chain, d);
    if (!chain) {
      playIncorrectBuzz();
      setBad(d.id);
      later(() => setBad(null), 450);
      const line = `${d.la} and ${d.lb} aren't worth the same as an end. Look for a ${L} or a ${R}.`;
      setNote(line);
      speak(`${sayValue(d.la)} and ${sayValue(d.lb)} aren't worth the same as an end. Look for one worth ${L} or ${R}.`);
      return;
    }
    playCorrectChime();
    setNote(null);
    setHelped(false);
    const next = { ...g, chain, you: g.you.filter((x) => x.id !== d.id) };
    setG(next);
    if (!next.you.length) {
      done('you', next);
      return;
    }
    setTurn('pip');
    later(() => pipTurn(next), 1000);
  }
  function draw() {
    if (turn !== 'you' || over) return;
    if (g.you.some(playable)) {
      setHelped(true);
      speak('You have one that fits! Look for the glowing one.');
      return;
    }
    playStickerPick();
    if (!g.pile.length) {
      speak('No more to take. Pip goes.');
      setTurn('pip');
      later(() => pipTurn(g), 900);
      return;
    }
    const next = { ...g, you: [...g.you, g.pile[0]], pile: g.pile.slice(1) };
    setG(next);
    speak('You took one.');
  }
  return (
    <div className="game game-pz">
      <PuzzleTop level={level} score={g.pip.length} label="left for Pip">
        <span className="dm-count">{g.you.length} left for you</span>
      </PuzzleTop>
      <p className="game-ask">
        Match an end: <b className="dm-end">{g.chain[0].la}</b> or <b className="dm-end">{g.chain[g.chain.length - 1].lb}</b>
      </p>
      <div className="dm-strip" ref={stripRef}>
        <div className="dm-chain">
          {g.chain.map((d) => (
            <Domino key={d.id} d={d} small />
          ))}
        </div>
      </div>
      <p className="fr-turn game-ask">{over ? (over === 'you' ? 'You win!' : 'Pip wins this time!') : turn === 'you' ? 'Your turn: tap a domino' : "Pip's turn…"}</p>
      <div className="dm-hand">
        {g.you.map((d) => (
          <Domino key={d.id} d={d} onClick={() => play(d)} glow={helped && playable(d)} bad={bad === d.id} />
        ))}
      </div>
      {note && <p className="bakery-note">{note}</p>}
      <div className="bakery-actions">
        <button type="button" className="bakery-btn" disabled={turn !== 'you' || !!over} onClick={draw}>
          Take a domino ({g.pile.length})
        </button>
      </div>
    </div>
  );
}
