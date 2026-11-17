import { useEffect, useRef, useState } from 'react';
import { playCorrectChime, playIncorrectBuzz, playStickerPick, playStickerStick, speak } from './sound.js';
import { PuzzleTop, useSkill } from './puzzleKit.jsx';

// Ship Hunt: find Pip's hidden ships before Pip finds yours. Tap a square
// on Pip's sea to call it ("B, 4"): a hit or a splash. The math is
// coordinates (a letter for the column, a number for the row, like a map)
// and counting what's left. Boards grow with the grade; Pip plays smarter
// as a player keeps winning (useSkill): random guesses at first, then it
// follows up its hits and searches in a checkerboard.

const SIZES = { p: [5, [2, 2, 3]], k: [5, [2, 2, 3]], 1: [6, [2, 3, 3, 4]], 2: [6, [2, 3, 3, 4]], 3: [8, [2, 3, 3, 4, 5]], 4: [8, [2, 3, 3, 4, 5]] };
const NAMES = { 2: 'little boat', 3: 'sailboat', 4: 'big ship', 5: 'giant ship' };
const COLS = 'ABCDEFGH';
const rand = (n) => Math.floor(Math.random() * n);
const say = (n, i) => `${COLS[i % n]}, ${Math.floor(i / n) + 1}`;

// Ships placed at random, not touching (when it fits): [{ cells, size }].
function place(n, sizes) {
  for (let t = 0; t < 400; t++) {
    const taken = new Set();
    const ships = [];
    let ok = true;
    for (const size of sizes) {
      let done = false;
      for (let k = 0; k < 200 && !done; k++) {
        const h = Math.random() < 0.5;
        const r = rand(h ? n : n - size + 1);
        const c = rand(h ? n - size + 1 : n);
        const cells = Array.from({ length: size }, (_, j) => (h ? r * n + c + j : (r + j) * n + c));
        const near = (i) => {
          const rr = Math.floor(i / n);
          const cc = i % n;
          for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
              const r2 = rr + dr;
              const c2 = cc + dc;
              if (r2 >= 0 && r2 < n && c2 >= 0 && c2 < n && taken.has(r2 * n + c2)) return true;
            }
          return false;
        };
        if (cells.some((i) => (t < 300 ? near(i) : taken.has(i)))) continue;
        cells.forEach((i) => taken.add(i));
        ships.push({ cells, size, h });
        done = true;
      }
      if (!done) {
        ok = false;
        break;
      }
    }
    if (ok) return ships;
  }
  return [];
}
const sunk = (ship, shots) => ship.cells.every((i) => shots.has(i));
const shipAt = (ships, i) => ships.find((s) => s.cells.includes(i));

// A good next shot on a board: next to a hit that isn't sunk yet (in line
// with two hits when there are), else a hunting square. `smart` 0 to 2.
function nextShot(n, ships, shots, smart) {
  const free = [];
  for (let i = 0; i < n * n; i++) if (!shots.has(i)) free.push(i);
  const open = [...shots].filter((i) => {
    const s = shipAt(ships, i);
    return s && !sunk(s, shots);
  });
  const nb = (i) => {
    const r = Math.floor(i / n);
    const c = i % n;
    return [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ]
      .filter(([a, b]) => a >= 0 && a < n && b >= 0 && b < n)
      .map(([a, b]) => a * n + b)
      .filter((j) => !shots.has(j));
  };
  if (open.length && smart > 0) {
    if (smart > 1 && open.length > 1) {
      const sameRow = open.every((i) => Math.floor(i / n) === Math.floor(open[0] / n));
      const sameCol = open.every((i) => i % n === open[0] % n);
      const line = open.flatMap(nb).filter((j) => (sameRow ? Math.floor(j / n) === Math.floor(open[0] / n) : sameCol ? j % n === open[0] % n : true));
      if (line.length) return line[rand(line.length)];
    }
    const around = open.flatMap(nb);
    if (around.length) return around[rand(around.length)];
  }
  if (smart > 1) {
    const even = free.filter((i) => (Math.floor(i / n) + (i % n)) % 2 === 0);
    if (even.length) return even[rand(even.length)];
  }
  return free[rand(free.length)];
}

function Board({ n, ships, shots, show, onTap, hint, last, label }) {
  return (
    <div className="sh-wrap" style={{ '--n': n }}>
      <span className="sh-label">{label}</span>
      <div className="sh-grid">
        <span />
        {Array.from({ length: n }, (_, c) => (
          <b key={`c${c}`} className="sh-head">
            {COLS[c]}
          </b>
        ))}
        {Array.from({ length: n }, (_, r) => [
          <b key={`r${r}`} className="sh-head">
            {r + 1}
          </b>,
          ...Array.from({ length: n }, (_, c) => {
            const i = r * n + c;
            const ship = shipAt(ships, i);
            const shot = shots.has(i);
            const isSunk = ship && sunk(ship, shots);
            const cls = [
              'sh-cell',
              (show || isSunk) && ship ? 'sh-ship' : '',
              isSunk ? 'sh-sunk' : '',
              shot && ship ? 'sh-hit' : '',
              shot && !ship ? 'sh-miss' : '',
              hint === i ? 'sh-hint' : '',
              last === i ? 'sh-last' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return onTap ? (
              <button key={i} type="button" className={cls} disabled={shot} onClick={() => onTap(i)} aria-label={`${say(n, i)}${shot ? (ship ? ', hit' : ', miss') : ''}`} />
            ) : (
              <span key={i} className={cls} />
            );
          }),
        ])}
      </div>
    </div>
  );
}

export default function ShipHunt({ grade, onEnd, playerId }) {
  const [n, sizes] = SIZES[grade] || SIZES[2];
  const [level, record] = useSkill(playerId, 'shipHunt');
  const smart = level <= 1 ? 0 : level <= 3 ? 1 : 2;
  const [mine, setMine] = useState(() => place(n, sizes));
  const [pips] = useState(() => place(n, sizes));
  const [myShots, setMyShots] = useState(new Set());
  const [pipShots, setPipShots] = useState(new Set());
  const [phase, setPhase] = useState('setup'); // setup | you | pip | over
  const [note, setNote] = useState(null);
  const [hint, setHint] = useState(null);
  const [last, setLast] = useState({ you: null, pip: null });
  const [result, setResult] = useState(null);
  const pipRef = useRef(pipShots);
  pipRef.current = pipShots;

  useEffect(() => {
    speak(`Ship Hunt! Hide your ships, then find Pip's ${sizes.length} ships before Pip finds yours. Tap Shuffle for new spots, then Start!`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const left = (ships, shots) => ships.filter((s) => !sunk(s, shots)).length;
  function talk(line) {
    setNote(line);
    speak(line);
  }

  function fire(i) {
    if (phase !== 'you' || myShots.has(i)) return;
    const shots = new Set(myShots).add(i);
    setMyShots(shots);
    setHint(null);
    setLast((l) => ({ ...l, you: i }));
    const ship = shipAt(pips, i);
    let line;
    if (!ship) {
      playStickerPick();
      line = `${say(n, i)}. Splash! A miss.`;
    } else if (sunk(ship, shots)) {
      playCorrectChime();
      const l = left(pips, shots);
      line = `${say(n, i)}. Hit! You sank Pip's ${NAMES[ship.size]}! ${l ? `${l} ${l === 1 ? 'ship' : 'ships'} left.` : ''}`;
    } else {
      playCorrectChime();
      line = `${say(n, i)}. Hit! Try the squares next to it.`;
    }
    talk(line);
    if (!left(pips, shots)) return finish(true, shots);
    setPhase('pip');
    setTimeout(() => pipTurn(), 1500);
  }
  function pipTurn() {
    const prev = pipRef.current;
    const i = nextShot(n, mine, prev, smart);
    const shots = new Set(prev).add(i);
    pipRef.current = shots;
    setPipShots(shots);
    setLast((l) => ({ ...l, pip: i }));
    const ship = shipAt(mine, i);
    if (!ship) talk(`Pip calls ${say(n, i)}. Splash! Pip missed.`);
    else {
      playIncorrectBuzz();
      talk(sunk(ship, shots) ? `Pip calls ${say(n, i)}. Pip sank your ${NAMES[ship.size]}!` : `Pip calls ${say(n, i)}. Pip hit your ship!`);
    }
    if (!left(mine, shots)) setTimeout(() => finish(false), 400);
    else setTimeout(() => setPhase('you'), 700);
  }
  function finish(won, shots = myShots) {
    setPhase('over');
    const sunkCount = pips.filter((s) => sunk(s, shots)).length;
    if (won) {
      playStickerStick();
      const { lv } = record(1);
      setResult(`You found all of Pip's ships! Pip plays smarter now: level ${lv}.`);
      speak(`You found all of Pip's ships! You win!`);
    } else {
      const { lv } = record(-1);
      setResult(`Pip found all your ships first. You sank ${sunkCount}.${lv < level ? ' Pip will go a bit easier next time.' : ''}`);
      speak(`Pip found all your ships first. Good hunting! You sank ${sunkCount}.`);
    }
  }
  function help() {
    if (phase !== 'you') return;
    const i = nextShot(n, pips, myShots, 2);
    setHint(i);
    const open = [...myShots].some((j) => {
      const s = shipAt(pips, j);
      return s && !sunk(s, myShots);
    });
    talk(open ? `Try ${say(n, i)}, next to your hit. Ships go straight across or straight down.` : `Try ${say(n, i)}. Spread your shots out to find a ship.`);
  }

  if (phase === 'setup') {
    return (
      <div className="game game-pz sh-game">
        <PuzzleTop level={level} score={sizes.length} label="ships each" />
        <p className="game-ask">Here are your ships. Pip can't see them!</p>
        <Board n={n} ships={mine} shots={new Set()} show label="Your sea" />
        <div className="bakery-actions">
          <button type="button" className="bakery-btn" onClick={() => setMine(place(n, sizes))}>
            Shuffle my ships
          </button>
          <button
            type="button"
            className="mi-sail sh-start"
            onClick={() => {
              setPhase('you');
              talk(`Your turn! Tap a square on Pip's sea. The letter is the column, the number is the row.`);
            }}
          >
            Start!
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="game game-pz sh-game">
      <PuzzleTop level={level} score={pips.filter((s) => sunk(s, myShots)).length} label={`of ${sizes.length} found`} />
      <div className="sh-bar">
        <p className="sh-turn">{phase === 'over' ? 'Game over' : phase === 'you' ? 'Your turn!' : 'Pip is choosing…'}</p>
        {phase !== 'over' && (
          <button type="button" className="bg-help sh-help" disabled={phase !== 'you'} onClick={help}>
            Help me
          </button>
        )}
      </div>
      <Board n={n} ships={pips} shots={myShots} show={phase === 'over'} onTap={phase === 'you' ? fire : null} hint={hint} last={last.you} label={`Pip's sea · ${left(pips, myShots)} ${left(pips, myShots) === 1 ? 'ship' : 'ships'} left`} />
      {note && (
        <button type="button" className="mi-note" onClick={() => speak(note)}>
          {note}
        </button>
      )}
      {phase === 'over' ? (
        <div className="sh-over">
          <p>{result}</p>
          <button type="button" className="mi-sail" onClick={() => onEnd(pips.filter((s) => sunk(s, myShots)).length)}>
            Done
          </button>
        </div>
      ) : null}
      <div className="sh-mine">
        <Board n={n} ships={mine} shots={pipShots} show last={last.pip} label={`Your sea · ${left(mine, pipShots)} ${left(mine, pipShots) === 1 ? 'ship' : 'ships'} left`} />
      </div>
    </div>
  );
}
