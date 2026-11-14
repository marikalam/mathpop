import { Capacitor } from '@capacitor/core';
import { sendStatEvents } from './cloud.js';

// MathPop's own usage stats (supabase/mathpop_stats.sql): anonymous counts
// for the grown-up who runs MathPop. Nothing identifies a child, a family
// or a device - there's no id at all. The app says that it was opened
// (and whether that's the first time today, or the first time ever, on
// this device, so the server can count devices without knowing which),
// and when a round is finished: the grade, game, language and score.
// The "opened" is only sent once a round is finished, so a player is
// someone who played: link previews, bots and quick bounces (which open
// the page and leave) aren't counted as players.
// Events that can't be sent (offline) wait here and go with the next one.
const DAY_KEY = 'mathpop-stats-day-v1';
const INSTALLED_KEY = 'mathpop-stats-installed-v1';
const QUEUE_KEY = 'mathpop-stats-queue-v1';
const MAX_QUEUED = 100;

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function platform() {
  if (!Capacitor.isNativePlatform()) return 'web';
  return Math.min(window.screen.width, window.screen.height) >= 600 ? 'ipad' : 'iphone';
}

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

// No stats from test copies: a local development server, or a browser
// driven by a test (automated browsers say so in navigator.webdriver).
// Otherwise every test run counts as a new player.
const IS_TEST =
  import.meta.env.DEV ||
  (typeof navigator !== 'undefined' && navigator.webdriver) ||
  // (The iPhone app's own page is capacitor://localhost: that one counts.)
  (!Capacitor.isNativePlatform() && typeof location !== 'undefined' && ['localhost', '127.0.0.1'].includes(location.hostname));

let sending = false;
async function send(...events) {
  if (IS_TEST) return;
  let queue = [];
  try {
    queue = JSON.parse(read(QUEUE_KEY) || '[]');
  } catch {
    /* start over */
  }
  // Old events the server would turn away (more than two days old) are dropped.
  const oldest = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
  queue = [...queue.filter((e) => e.day >= oldest), ...events.map((event) => ({ ...event, day: today(), platform: platform() }))].slice(-MAX_QUEUED);
  write(QUEUE_KEY, JSON.stringify(queue));
  if (sending) return;
  sending = true;
  if (await sendStatEvents(queue)) {
    // Keep anything added while these were on their way.
    let now = [];
    try {
      now = JSON.parse(read(QUEUE_KEY) || '[]');
    } catch {
      /* ignore */
    }
    write(QUEUE_KEY, JSON.stringify(now.slice(queue.length)));
  }
  sending = false;
}

// Once each time the app starts: noted, and sent with the first finished
// round (so only players who play are counted).
let openedPending = false;
export function statAppOpened() {
  openedPending = true;
}
function openEvent() {
  const day = today();
  const firstToday = read(DAY_KEY) !== day;
  const newInstall = !read(INSTALLED_KEY);
  write(DAY_KEY, day);
  write(INSTALLED_KEY, '1');
  return { event: 'open', first_today: firstToday, new_install: newInstall };
}

// A finished round of practice (or a game).
export function statRoundDone({ grade, topic, lang, correct, total }) {
  const round = { event: 'round', grade, topic: String(topic).slice(0, 40), lang, correct, total };
  if (openedPending) {
    openedPending = false;
    send(openEvent(), round);
  } else send(round);
}
