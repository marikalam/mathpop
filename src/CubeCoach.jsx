import { useEffect, useRef, useState } from 'react';
import Pip from './Pip.jsx';
import { playCorrectChime, playStickerPick, playStickerStick, speak, stopSpeaking } from './sound.js';
import { setBackHandler } from './backButton.js';
import { ARROW, COLORS, SAY, apply, invert, moves, moving, parseMove, solved, turn } from './cube.js';

// Cube Coach: how to solve a 3 × 3 color cube, for kids who can't read
// yet. Ten short lessons (the beginner's method: daisy, white cross, white
// corners, middle edges, yellow cross, yellow edges, yellow corners),
// every page said out loud, with a 3D cube that shows each turn: watch it
// all, or one turn at a time to copy on a real cube. Pieces that don't
// matter yet are grey.

// Which pieces are in color (by their home: white is up when solved).
const FOCUS = {
  all: () => true,
  whiteEdges: (h) => h.y === 1 && Math.abs(h.x) + Math.abs(h.z) === 1,
  whiteLayer: (h) => h.y === 1,
  twoLayers: (h) => h.y >= 0,
};
const DAISY = 'x2 F2 R2 B2 L2';
const MAGIC = "R U R' U'";
const RIGHT_TRICK = "U R U' R' U' F' U F";
const LEFT_TRICK = "U' L' U L U F U' F'";
const YELLOW_CROSS = "F R U R' U' F'";
const YELLOW_EDGES = "R U R' U R U2 R' U";
const CORNER_HOMES = "U R U' L' U R' U' L";
const TWIST = "R' D' R D R' D' R D U R' D' R D R' D' R D R' D' R D R' D' R D U'";

// [title, color, pages]; a page: { say, start (turns from solved, white
// up), play (turns to show), focus, view ('top' or 'bottom') }.
export const LESSONS = [
  [
    'Meet your cube',
    '#3b82f6',
    [
      { say: 'This is your cube! It has six sides. Each side has its own color: white, yellow, red, orange, blue and green. Tap the green button to spin it.', play: 'y y y y' },
      { say: 'Look at the middle square on each side. The middle squares never move! They tell you what color that side will be.', play: "x2 x2" },
      { say: 'White is always across from yellow. Our goal: make every side all one color. Let’s learn how, one little step at a time!', start: "R U F' L D2 B2 U' R2 F" },
    ],
  ],
  [
    'Learn the turns',
    '#8b5cf6',
    [
      { say: 'Hold your cube with white on top and green in front. Right side UP: push the right side up, away from you. Tap the green button to watch.', play: 'R' },
      { say: 'Right side DOWN: pull the right side down, toward you.', play: "R'" },
      { say: 'Top turns LEFT: turn the top row to the left.', play: 'U' },
      { say: 'Top turns RIGHT: turn the top row to the right.', play: "U'" },
      { say: 'Left side DOWN: pull the left side down, toward you.', play: 'L' },
      { say: 'Left side UP: push the left side up, away from you.', play: "L'" },
      { say: 'Front turns like a clock: turn the side facing you the way clock hands go.', play: 'F' },
      { say: 'Bottom turns RIGHT, and bottom turns LEFT.', play: "D D'" },
      { say: 'Great job! Now you know the turns. Try each one on your own cube!', play: "R U R' U'" },
    ],
  ],
  [
    'Make a daisy',
    '#f59e0b',
    [
      { say: 'Hold your cube with the YELLOW middle on top. First we make a daisy: a yellow middle with four white petals around it. Like this!', start: DAISY, focus: 'whiteEdges' },
      { say: 'Find a white edge. An edge has two colors. If it is on the side, turn that side to bring the white up next to the yellow. Watch!', start: `${DAISY} F`, play: "F'", focus: 'whiteEdges' },
      { say: 'If the top spot already has a white petal, turn the top first to make room. Then bring the white up.', start: `${DAISY} F U`, play: "U' F'", focus: 'whiteEdges' },
      { say: 'Keep going until all four white petals are around the yellow. You made a daisy!', start: DAISY, play: 'y y y y', focus: 'whiteEdges' },
    ],
  ],
  [
    'The white cross',
    '#ef4444',
    [
      { say: 'Look at a white petal. What is its other color? Turn the top until that color sits right above the middle square that matches.', start: `${DAISY} U`, play: "U'", focus: 'whiteEdges' },
      { say: 'Now turn that side two times! The white piece goes down to the bottom.', start: DAISY, play: 'F2', focus: 'whiteEdges' },
      { say: 'Do the same for every petal: match the color, then turn that side two times.', start: `${DAISY} F2`, play: 'y F2 y F2 y F2', focus: 'whiteEdges' },
      { say: 'Flip your cube over. A white cross! Each white edge matches the middle next to it.', start: 'x2', play: 'x2', focus: 'whiteEdges' },
    ],
  ],
  [
    'White corners',
    '#10b981',
    [
      { say: 'Turn your cube so white is on the BOTTOM. Now we put in the white corners. Here is the magic four moves: right side up, top left, right side down, top right.', start: 'x2', play: MAGIC, focus: 'whiteLayer' },
      { say: 'Find a corner on top with white on it. Turn the top until it sits right above its home, between its two colors. Then do the magic four moves again and again, until the corner goes home with white on the bottom!', start: `x2 ${MAGIC} ${MAGIC} ${MAGIC}`, play: `${MAGIC} ${MAGIC} ${MAGIC}`, focus: 'whiteLayer' },
      { say: 'Do this for all four corners. Then the whole white side is done!', start: 'x2', play: 'y y y y', focus: 'whiteLayer' },
    ],
  ],
  [
    'Middle edges',
    '#06b6d4',
    [
      { say: 'Now the middle row. Find an edge on top with no yellow on it. Turn the top until its front color matches the middle square under it. It makes an upside down T!', start: `x2 ${invert(RIGHT_TRICK)}`, focus: 'twoLayers' },
      { say: 'If its top color matches the RIGHT side, it goes to the right. Do the right trick. Watch!', start: `x2 ${invert(RIGHT_TRICK)}`, play: RIGHT_TRICK, focus: 'twoLayers' },
      { say: 'If its top color matches the LEFT side, it goes to the left. Do the left trick.', start: `x2 ${invert(LEFT_TRICK)}`, play: LEFT_TRICK, focus: 'twoLayers' },
      { say: 'Do this for all four middle edges. Two rows done! Only the yellow top is left.', start: 'x2', play: 'y y y y', focus: 'twoLayers' },
    ],
  ],
  [
    'Yellow cross',
    '#eab308',
    [
      { say: 'Look at the yellow top. You might see a yellow dot, an L, or a line. We want a yellow cross.', start: `x2 ${invert(YELLOW_CROSS)}` },
      { say: 'Hold a line across, or the L at the back left. Then: front like a clock, right side up, top left, right side down, top right, front back. Watch!', start: `x2 ${invert(YELLOW_CROSS)}`, play: YELLOW_CROSS },
      { say: 'No cross yet? Do it again! Dot, then L, then line, then cross.', start: 'x2', play: 'y y' },
    ],
  ],
  [
    'Match the yellow edges',
    '#f97316',
    [
      { say: 'Now make each yellow edge match its side. Turn the top until two edges match.', start: `x2 ${invert(YELLOW_EDGES)}` },
      { say: 'Hold the two that don’t match in front and on the left. Then: right up, top left, right down, top left, right up, top left two times, right down, top left. Watch!', start: `x2 ${invert(YELLOW_EDGES)}`, play: YELLOW_EDGES },
      { say: 'If they still don’t match, turn the cube and try again. All four edges match? Great!', start: 'x2', play: 'y y y y' },
    ],
  ],
  [
    'Corners to their homes',
    '#ec4899',
    [
      { say: 'Find a yellow corner that is in its right home: its colors match the sides next to it, even if it is twisted.', start: `x2 ${invert(CORNER_HOMES)}` },
      { say: 'Hold that corner at the front right, on top. Then do this, and repeat until all four corners are home. Watch!', start: `x2 ${invert(CORNER_HOMES)}`, play: CORNER_HOMES },
    ],
  ],
  [
    'Twist the last corners',
    '#6366f1',
    [
      { say: 'Last step! Hold a twisted corner at the front right, on top. Do: right side down, bottom left, right side up, bottom right. Again and again until yellow is on top. The bottom gets messy. Don’t worry! It fixes itself.', start: `x2 ${invert(TWIST)}`, play: "R' D' R D R' D' R D" },
      { say: 'Then turn ONLY the top to bring the next twisted corner to the front right, and do it again. Watch the whole thing!', start: `x2 ${invert(TWIST)}`, play: TWIST },
      { say: 'You solved the cube! Hooray! Mix it up and try again!', start: 'x2', play: 'y y y y' },
    ],
  ],
];

// The 2 × 2 cube: only corners, no middle squares. Three tricks the 3 × 3
// lessons use too: the magic four moves, corners home, the twist.
export const LESSONS_2 = [
  [
    'Meet the 2\u00a0×\u00a02',
    '#3b82f6',
    [
      { say: 'This little cube is a two by two. It has only eight corners, and each corner has three colors. Tap the green button to spin it.', play: 'y y y y' },
      { say: 'There are no middle squares to help, so the corners tell you the colors. White is across from yellow, like on the big cube.', play: 'x2 x2' },
      { say: 'Our goal: make every side one color. It takes just three tricks!', start: "R U F' R U' F2 R' U2" },
    ],
  ],
  [
    'The turns',
    '#8b5cf6',
    [
      { say: 'Hold the cube with white on top. Right side UP, then right side DOWN.', play: "R R'" },
      { say: 'Top turns LEFT, then top turns RIGHT.', play: "U U'" },
      { say: 'Bottom turns RIGHT, then bottom turns LEFT.', play: "D D'" },
      { say: 'Left side DOWN, then left side UP. Try them all on your cube!', play: "L L'" },
    ],
  ],
  [
    'The white side',
    '#10b981',
    [
      { say: 'Hold your cube with white on the BOTTOM. We will make the whole bottom white, with the colors on the sides matching.', start: 'x2', focus: 'whiteLayer' },
      { say: 'Find a corner on top with white on it. Turn the top until it is right above where it goes. Then do the magic four moves: right side up, top left, right side down, top right. Again and again, until the white is on the bottom!', start: `x2 ${MAGIC} ${MAGIC} ${MAGIC}`, play: `${MAGIC} ${MAGIC} ${MAGIC}`, focus: 'whiteLayer' },
      { say: 'Each new corner must match its neighbors: the side colors next to each other are the same. Then do the next corner the same way.', start: 'x2', play: 'y y y y', focus: 'whiteLayer' },
    ],
  ],
  [
    'Corners to their homes',
    '#ec4899',
    [
      { say: 'Now the top. A corner is home when its colors match the sides under it, even if it is twisted. Find one that is home.', start: `x2 ${invert(CORNER_HOMES)}` },
      { say: 'Hold that corner at the front right, on top. Then do this trick, and repeat until all four corners are home. Watch!', start: `x2 ${invert(CORNER_HOMES)}`, play: CORNER_HOMES },
    ],
  ],
  [
    'Twist the last corners',
    '#6366f1',
    [
      { say: 'Last step! Hold a twisted corner at the front right, on top. Do: right side down, bottom left, right side up, bottom right. Again and again until yellow is on top. The bottom gets messy. Don’t worry! It fixes itself.', start: `x2 ${invert(TWIST)}`, play: "R' D' R D R' D' R D" },
      { say: 'Then turn ONLY the top to bring the next twisted corner to the front right, and do it again. Watch the whole thing!', start: `x2 ${invert(TWIST)}`, play: TWIST },
      { say: 'Turn the top until the sides match. You solved the two by two! Hooray!', start: 'x2', play: 'y y y y' },
    ],
  ],
];
const SETS = {
  3: { n: 3, lessons: LESSONS, name: '3 × 3 cube', done: '' },
  2: { n: 2, lessons: LESSONS_2, name: '2 × 2 cube', done: ':2' },
};

const DONE_KEY = 'mathpop-cube-done-v1';
function readDone(id) {
  try {
    return (JSON.parse(localStorage.getItem(DONE_KEY)) || {})[id] || [];
  } catch {
    return [];
  }
}
function markDone(id, k) {
  try {
    const all = JSON.parse(localStorage.getItem(DONE_KEY)) || {};
    all[id] = [...new Set([...(all[id] || []), k])];
    localStorage.setItem(DONE_KEY, JSON.stringify(all));
  } catch {
    /* private mode */
  }
}

// The 3D cube. `turning`: { m, go } animates one turn's layer.
const CSS_AXIS = { x: ['rotateX', -1], y: ['rotateY', 1], z: ['rotateZ', -1] };
const FACE_TF = {
  pz: 'translateZ(var(--h))',
  nz: 'rotateY(180deg) translateZ(var(--h))',
  px: 'rotateY(90deg) translateZ(var(--h))',
  nx: 'rotateY(-90deg) translateZ(var(--h))',
  py: 'rotateX(90deg) translateZ(var(--h))',
  ny: 'rotateX(-90deg) translateZ(var(--h))',
};
export function CubeView({ cubies, turning, focus = 'all', view = 'top', speed = 600, size = 54, n = 3 }) {
  // A 2 × 2's pieces sit at ±1: half a piece from the middle.
  const step = n === 2 ? size / 2 : size;
  const show = FOCUS[focus] || FOCUS.all;
  let anim = null;
  if (turning) {
    const { axis, q, times } = parseMove(turning.m);
    const [fn, sign] = CSS_AXIS[axis];
    anim = { fn, deg: turning.go ? sign * q * 90 * times : 0 };
  }
  return (
    <div className="cc-scene" style={{ '--s': `${size}px`, '--h': `${size / 2}px`, height: n === 2 ? size * 3.6 : undefined }}>
      <div className={`cc-cube cc-view-${view}`}>
        {cubies.map((c) => {
          const [hx, hy, hz] = c.id.match(/-?\d/g).map(Number);
          const home = { x: hx, y: hy, z: hz };
          const center = n === 3 && Math.abs(hx) + Math.abs(hy) + Math.abs(hz) === 1;
          const lit = center || show(home);
          const turningThis = turning && moving(c, turning.m);
          const tf = `${turningThis ? `${anim.fn}(${anim.deg}deg) ` : ''}translate3d(${c.x * step}px, ${-c.y * step}px, ${c.z * step}px)`;
          return (
            <div
              key={c.id}
              className="cc-cubie"
              style={{ transform: tf, transition: turningThis && turning.go ? `transform ${speed}ms ease-in-out` : 'none' }}
            >
              {Object.keys(FACE_TF).map((k) => (
                <span
                  key={k}
                  className="cc-face"
                  style={{ transform: FACE_TF[k], '--c': c.colors[k] ? (lit ? COLORS[c.colors[k]] : '#9aa3b2') : '#14161c' }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// A badge for a turn: a little cube face with an arrow, and its name.
function MoveBadge({ m, big }) {
  const [side, way] = ARROW[m] || ['all', 'left'];
  const rot = { up: 0, right: 90, down: 180, left: 270 }[way];
  const spot = { right: [26, 14, 10, 28], left: [4, 14, 10, 28], top: [4, 4, 32, 10], bottom: [4, 24, 32, 10], front: [4, 4, 32, 30], all: [4, 4, 32, 30] }[side];
  return (
    <span className={`cc-badge${big ? ' cc-badge-big' : ''}`}>
      <svg viewBox="0 0 40 40" width={big ? 44 : 26} height={big ? 44 : 26} aria-hidden="true">
        <rect x="2" y="2" width="36" height="36" rx="6" fill="#e2e8f0" />
        <rect x={spot[0]} y={spot[1]} width={spot[2]} height={spot[3]} rx="3" fill="#fbbf24" />
        {way === 'cw' || way === 'ccw' ? (
          <path d={way === 'cw' ? 'M12 14 A9 9 0 1 1 11 26 M12 14 l-1 -6 M12 14 l5 -2' : 'M28 14 A9 9 0 1 0 29 26 M28 14 l1 -6 M28 14 l-5 -2'} stroke="#173a66" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        ) : (
          <g transform={`rotate(${rot} 20 20)`}>
            <path d="M20 31 V10 M12 17 L20 9 L28 17" stroke="#173a66" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </svg>
      {big && <b>{SAY[m] || m}</b>}
    </span>
  );
}

function Lesson({ k, set, onDone }) {
  const [title, color, pages] = set.lessons[k];
  const [p, setP] = useState(0);
  const page = pages[p];
  const startState = () => apply(solved(set.n), page.start || '');
  const [cubies, setCubies] = useState(startState);
  const [turning, setTurning] = useState(null);
  const [at, setAt] = useState(-1); // the turn shown (one at a time)
  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(false);
  const run = useRef(0);
  const list = moves(page.play || '');
  const speed = slow ? 1100 : 600;

  useEffect(() => {
    run.current += 1;
    setCubies(startState());
    setTurning(null);
    setAt(-1);
    setPlaying(false);
    speak(page.say);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, p]);
  useEffect(() => () => {
    run.current += 1;
    stopSpeaking();
  }, []);

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function doTurn(m, id, say = true) {
    if (say) speak(SAY[m] || '');
    setTurning({ m, go: false });
    await wait(30);
    if (run.current !== id) return false;
    setTurning({ m, go: true });
    await wait(speed + 40);
    if (run.current !== id) return false;
    setCubies((c) => turn(c, m));
    setTurning(null);
    return true;
  }
  async function watch() {
    run.current += 1;
    const id = run.current;
    setCubies(startState());
    setTurning(null);
    setPlaying(true);
    playStickerPick();
    await wait(250);
    for (let i = 0; i < list.length; i++) {
      setAt(i);
      if (!(await doTurn(list[i], id, list.length <= 12 || i < 1 || list[i] !== list[i - 1]))) return;
      await wait(slow ? 700 : 350);
    }
    if (run.current === id) setPlaying(false);
  }
  async function step() {
    if (playing) return;
    const i = at + 1 >= list.length ? 0 : at + 1;
    run.current += 1;
    const id = run.current;
    if (i === 0) setCubies(startState());
    setAt(i);
    setPlaying(true);
    await wait(i === 0 ? 150 : 0);
    await doTurn(list[i], id);
    if (run.current === id) setPlaying(false);
  }
  function next() {
    playStickerPick();
    if (p + 1 < pages.length) setP(p + 1);
    else {
      playStickerStick();
      onDone();
    }
  }

  return (
    <div className="game game-pz cc-lesson">
      <div className="cc-head" style={{ '--lc': color }}>
        <span className="cc-num">{k + 1}</span>
        <b>{title}</b>
        <span className="cc-pages">
          {pages.map((_, i) => (
            <i key={i} className={i <= p ? 'cc-on' : ''} />
          ))}
        </span>
      </div>
      <CubeView cubies={cubies} turning={turning} focus={page.focus} view={page.view} speed={speed} n={set.n} size={set.n === 2 ? 80 : 54} />
      {list.length > 0 && (
        <div className="cc-moves" aria-label="The turns">
          {list.map((m, i) => (
            <span key={i} className={i === at ? 'cc-now' : i < at ? 'cc-past' : ''}>
              <MoveBadge m={m} />
            </span>
          ))}
        </div>
      )}
      <div className="cc-now-row">{at >= 0 && list[at] ? <MoveBadge m={list[at]} big /> : null}</div>
      <button type="button" className="cc-say" onClick={() => speak(page.say)}>
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
          <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
        <span>{page.say}</span>
      </button>
      <div className="cc-controls">
        <button type="button" className="cc-btn" onClick={() => (p > 0 ? setP(p - 1) : null)} disabled={p === 0} aria-label="Back">
          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {list.length > 0 && (
          <>
            <button type="button" className="cc-btn cc-play" onClick={watch} aria-label="Watch">
              <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            </button>
            <button type="button" className="cc-btn cc-step" onClick={step} disabled={playing} aria-label="One turn">
              <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
                <path d="M6 5v14l9-7z" fill="currentColor" />
                <rect x="16" y="5" width="3" height="14" rx="1" fill="currentColor" />
              </svg>
              <small>1 turn</small>
            </button>
          </>
        )}
        <button type="button" className="cc-btn cc-next" onClick={next} aria-label="Next">
          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
            <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {list.length > 0 && (
        <label className="cc-slow">
          <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} /> Slow motion
        </label>
      )}
    </div>
  );
}

export default function CubeCoach({ onEnd, playerId = 'guest' }) {
  const [size, setSize] = useState(() => {
    try {
      return localStorage.getItem('mathpop-cube-size-v1') === '2' ? 2 : 3;
    } catch {
      return 3;
    }
  });
  const set = SETS[size];
  const lessons = set.lessons;
  const [lesson, setLesson] = useState(null);
  const [done, setDone] = useState(() => readDone(playerId + set.done));
  const [party, setParty] = useState(false);
  useEffect(() => setDone(readDone(playerId + set.done)), [size]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (lesson === null) {
      speak('Cube Coach! Pick your cube: the big three by three, or the little two by two. Then tap lesson one to start.');
      return undefined;
    }
    setBackHandler(() => {
      stopSpeaking();
      setLesson(null);
      return true;
    });
    return () => setBackHandler(null);
  }, [lesson]);
  function pickSize(n) {
    playStickerPick();
    setSize(n);
    setLesson(null);
    try {
      localStorage.setItem('mathpop-cube-size-v1', String(n));
    } catch {
      /* private mode */
    }
    speak(n === 2 ? 'The little two by two cube. Five lessons!' : 'The big three by three cube. Ten lessons!');
  }

  if (party) {
    return (
      <div className="game game-pz cc-party">
        <Pip size={120} mood="cheer" />
        <h2>You learned the whole {set.name}!</h2>
        <p>Mix it up and solve it again. Every time gets easier!</p>
        <button type="button" className="mi-sail" onClick={() => onEnd(done.length)}>
          Done
        </button>
      </div>
    );
  }
  if (lesson !== null) {
    return (
      <Lesson
        key={`${size}-${lesson}`}
        k={lesson}
        set={set}
        onDone={() => {
          markDone(playerId + set.done, lesson);
          setDone(readDone(playerId + set.done));
          playCorrectChime();
          if (lesson + 1 < lessons.length) {
            speak(`Lesson ${lesson + 1} done! On to lesson ${lesson + 2}: ${lessons[lesson + 1][0]}.`);
            setLesson(lesson + 1);
          } else {
            setLesson(null);
            setParty(true);
            speak(`You learned the whole ${size === 2 ? 'two by two' : 'three by three'} cube! Hooray!`);
          }
        }}
      />
    );
  }
  return (
    <div className="game game-pz cc-menu">
      <div className="cc-sizes" role="group" aria-label="Which cube">
        {[3, 2].map((n) => (
          <button key={n} type="button" className={`cc-size${size === n ? ' cc-size-on' : ''}`} aria-pressed={size === n} onClick={() => pickSize(n)}>
            <CubeView cubies={apply(solved(n), n === 2 ? "R U'" : "R U R' U'")} size={n === 2 ? 30 : 20} n={n} />
            <b>{n} × {n}</b>
            <small>{n === 2 ? 'Little cube · 5 lessons' : 'Big cube · 10 lessons'}</small>
          </button>
        ))}
      </div>
      <div className="cc-list">
        {lessons.map(([title, color], k) => (
          <button
            key={title}
            type="button"
            className={`cc-item${done.includes(k) ? ' cc-done' : ''}`}
            style={{ '--lc': color }}
            onClick={() => {
              playStickerPick();
              setLesson(k);
            }}
          >
            <span className="cc-num">{done.includes(k) ? '✓' : k + 1}</span>
            <b>{title}</b>
          </button>
        ))}
      </div>
    </div>
  );
}
