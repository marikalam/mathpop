// The top bar's Back inside a game: a game showing one of its own screens
// (like a chess lesson) can take Back to go to its menu first. The game
// sets a handler while that screen shows; Back calls it, and goes home
// only when no game took it.
let handler = null;
export function setBackHandler(fn) {
  handler = fn;
}
export function handleBack() {
  if (!handler) return false;
  const fn = handler;
  return fn() === true;
}
