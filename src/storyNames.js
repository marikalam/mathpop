// The names in word problems. Aurelia and Lumia are always in the mix,
// and when a family is signed in, the player who's playing shows up in the
// stories too (about one name in three), so kids see themselves in the
// math. Stories call the people in them "they", whoever they are.
const NAMES = ['Aurelia', 'Lumia', 'Julie', 'Marcus', 'Sarah', 'Alex', 'Emma', 'Jordan', 'Casey', 'Mia', 'Leo', 'Aisha', 'Ben', 'Wei', 'Zara', 'Omar', 'Ravi', 'Nora'];
// Aurelia and Lumia come up more often than the other names.
const FAVOURITES = ['Aurelia', 'Lumia'];

let player = null;

// The signed-in player's name, or null (guests, or a player still called
// "Player 1").
export function setStoryPlayer(name) {
  const clean = typeof name === 'string' ? name.trim() : '';
  player = clean && !/^player \d+$/i.test(clean) ? clean : null;
}

function pickOne(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// One name for a story.
export function storyName() {
  const r = Math.random();
  if (player) {
    if (r < 0.3) return player;
    if (r < 0.6) return pickOne(FAVOURITES);
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
