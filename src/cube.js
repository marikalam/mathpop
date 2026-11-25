// A 3 × 3 cube puzzle for Cube Coach: 26 small cubes ("cubies"), each with
// a home position (its id) and the colors on its sides. Axes: x to the
// right, y up, z toward you. A turn moves one layer a quarter turn; a
// whole-cube turn (x, y, z) moves all three layers.

export const COLORS = { W: '#ffffff', Y: '#ffd500', G: '#009b48', B: '#0046ad', R: '#d10f1f', O: '#ff6a00' };
// Sides: [direction, key]. Solved: white up, yellow down, green front,
// blue back, red right, orange left.
const SIDE_COLORS = { py: 'W', ny: 'Y', pz: 'G', nz: 'B', px: 'R', nx: 'O' };
const dirKey = (x, y, z) => (x ? (x > 0 ? 'px' : 'nx') : y ? (y > 0 ? 'py' : 'ny') : z > 0 ? 'pz' : 'nz');
const keyDir = { px: [1, 0, 0], nx: [-1, 0, 0], py: [0, 1, 0], ny: [0, -1, 0], pz: [0, 0, 1], nz: [0, 0, -1] };

// n = 3 (26 cubies) or 2 (the 8 corners: a 2 × 2 cube; its pieces sit at
// ±1, and turns move the same layers).
export function solved(n = 3) {
  const out = [];
  const at = n === 2 ? [-1, 1] : [-1, 0, 1];
  for (const x of at)
    for (const y of at)
      for (const z of at) {
        if (!x && !y && !z) continue;
        const colors = {};
        if (x) colors[dirKey(x, 0, 0)] = SIDE_COLORS[dirKey(x, 0, 0)];
        if (y) colors[dirKey(0, y, 0)] = SIDE_COLORS[dirKey(0, y, 0)];
        if (z) colors[dirKey(0, 0, z)] = SIDE_COLORS[dirKey(0, 0, z)];
        out.push({ id: `${x}${y}${z}`, x, y, z, colors });
      }
  return out;
}

// A quarter turn (q = +1 counterclockwise looking from the + end of the
// axis, -1 clockwise) of a point.
function rot([x, y, z], axis, q) {
  if (axis === 'x') return [x, -q * z, q * y];
  if (axis === 'y') return [q * z, y, -q * x];
  return [-q * y, q * x, z];
}
// The layer and turn for each face: clockwise looking at that face.
const FACES = {
  R: ['x', 1, -1],
  L: ['x', -1, 1],
  U: ['y', 1, -1],
  D: ['y', -1, 1],
  F: ['z', 1, -1],
  B: ['z', -1, 1],
  x: ['x', null, -1],
  y: ['y', null, -1],
  z: ['z', null, -1],
};
// "R'" → { axis, layer, q, times }
export function parseMove(m) {
  const [axis, layer, q] = FACES[m[0]];
  const prime = m.includes("'");
  const times = m.includes('2') ? 2 : 1;
  return { axis, layer, q: prime ? -q : q, times };
}
const inLayer = (c, axis, layer) => layer === null || c[axis] === layer;
export function turn(cubies, m) {
  const { axis, layer, q, times } = parseMove(m);
  let out = cubies;
  for (let t = 0; t < times; t++) {
    out = out.map((c) => {
      if (!inLayer(c, axis, layer)) return c;
      const [x, y, z] = rot([c.x, c.y, c.z], axis, q).map((v) => v || 0);
      const colors = {};
      for (const [k, v] of Object.entries(c.colors)) colors[dirKey(...rot(keyDir[k], axis, q))] = v;
      return { ...c, x, y, z, colors };
    });
  }
  return out;
}
export const moves = (alg) => alg.split(/\s+/).filter(Boolean);
export const apply = (cubies, alg) => moves(alg).reduce(turn, cubies);
export const invert = (alg) =>
  moves(alg)
    .reverse()
    .map((m) => (m.includes('2') ? m : m.includes("'") ? m[0] : `${m}'`))
    .join(' ');
// Which cubies move in a turn (for the animation).
export const moving = (c, m) => {
  const { axis, layer } = parseMove(m);
  return inLayer(c, axis, layer);
};
export const isSolved = (cubies) =>
  ['px', 'nx', 'py', 'ny', 'pz', 'nz'].every((k) => new Set(cubies.filter((c) => c.colors[k]).map((c) => c.colors[k])).size === 1);

// What each turn is called, the way Cube Coach says it.
export const SAY = {
  R: 'Right side UP',
  "R'": 'Right side DOWN',
  R2: 'Right side two times',
  L: 'Left side DOWN',
  "L'": 'Left side UP',
  L2: 'Left side two times',
  U: 'Top turns LEFT',
  "U'": 'Top turns RIGHT',
  U2: 'Top turns two times',
  D: 'Bottom turns RIGHT',
  "D'": 'Bottom turns LEFT',
  D2: 'Bottom turns two times',
  F: 'Front turns like a clock',
  "F'": 'Front turns back, the other way',
  F2: 'Front turns two times',
  B2: 'Back turns two times',
  x2: 'Flip the whole cube over',
  y: 'Turn the whole cube to the left',
  "y'": 'Turn the whole cube to the right',
  y2: 'Turn the whole cube around',
};
// The arrow for each turn's badge: which side moves, and which way.
export const ARROW = {
  R: ['right', 'up'],
  "R'": ['right', 'down'],
  R2: ['right', 'up'],
  L: ['left', 'down'],
  "L'": ['left', 'up'],
  L2: ['left', 'down'],
  U: ['top', 'left'],
  "U'": ['top', 'right'],
  U2: ['top', 'left'],
  D: ['bottom', 'right'],
  "D'": ['bottom', 'left'],
  D2: ['bottom', 'right'],
  F: ['front', 'cw'],
  "F'": ['front', 'ccw'],
  F2: ['front', 'cw'],
  B2: ['front', 'cw'],
  x2: ['all', 'up'],
  y: ['all', 'left'],
  "y'": ['all', 'right'],
  y2: ['all', 'left'],
};
