// The names in word problems. The player who's playing is in most of the
// stories (about one name in two), so kids see and hear themselves in the
// math; Aurelia and Lumia come up often too. Stories call the people in
// them "they", whoever they are.
const NAMES = ['Aurelia', 'Lumia', 'Julie', 'Marcus', 'Sarah', 'Alex', 'Emma', 'Jordan', 'Casey', 'Mia', 'Leo', 'Aisha', 'Ben', 'Wei', 'Zara', 'Omar', 'Ravi', 'Nora'];
// Aurelia and Lumia come up more often than the other names.
const FAVOURITES = ['Aurelia', 'Lumia'];

let player = null;

// The playing player's name, or null (a player still called "Player 1").
export function setStoryPlayer(name) {
  const clean = typeof name === 'string' ? name.trim() : '';
  player = clean && !/^player \d+$/i.test(clean) ? clean : null;
}

function pickOne(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// One name for a story.
// The playing player's name, if they have one (null otherwise): MathPop
// also calls them by it when it reads a question out (sound.js).
export function playerName() {
  return player;
}

export function storyName() {
  const r = Math.random();
  if (player) {
    if (r < 0.55) return player;
    if (r < 0.7) return pickOne(FAVOURITES);
  } else if (r < 0.35) return pickOne(FAVOURITES);
  return pickOne(NAMES);
}

// `n` different names, for stories with more than one person.
export function storyNames(n) {
  const chosen = [];
  for (let tries = 0; chosen.length < n && tries < 50; tries++) {
    const name = storyName();
    if (!chosen.includes(name)) chosen.push(name);
  }
  for (const name of NAMES) if (chosen.length < n && !chosen.includes(name)) chosen.push(name);
  return chosen;
}
