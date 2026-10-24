// How MathPop looks: 'forest' (the forest-school look: a woodland map
// home, earthy colors, pinecones and acorns to count) or 'classic' (the
// original bright look). Saved on this device and switched in Players &
// grades, so it's easy to go back. forest.css holds the forest layer,
// which only applies under <html data-look="forest">.
const LOOK_KEY = 'mathpop-look-v1';
export const DEFAULT_LOOK = 'forest';

export function loadLook() {
  try {
    const saved = localStorage.getItem(LOOK_KEY);
    return saved === 'forest' || saved === 'classic' ? saved : DEFAULT_LOOK;
  } catch {
    return DEFAULT_LOOK;
  }
}

export function applyLook(look) {
  document.documentElement.dataset.look = look;
}

export function saveLook(look) {
  try {
    localStorage.setItem(LOOK_KEY, look);
  } catch {
    /* ignore */
  }
  applyLook(look);
}

export function isForest() {
  return document.documentElement.dataset.look === 'forest';
}
