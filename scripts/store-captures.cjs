// Captures the raw app screens for the App Store screenshots (run with the
// dev server on :5179): node scripts/store-captures.cjs <outDir> [width height]
// Then scripts/store-frames.cjs puts them in frames with captions.
const { chromium } = require('playwright');
const out = process.argv[2];
const W = +(process.argv[3] || 440);
const H = +(process.argv[4] || 956);
const URL = 'http://localhost:5179/';
const ID = 'player-store-1';
const ISLAND = ['flag', 'palm', 'turtle', 'fire', 'hut', 'dock', 'garden', 'boat', 'light', 'tree'];

async function page(br, grade) {
  const pg = await br.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 3 });
  await pg.addInitScript(
    ({ grade, ID, ISLAND }) => {
      window.speechSynthesis = { speak() {}, cancel() {}, getVoices() { return []; }, pause() {}, resume() {}, speaking: false, addEventListener() {} };
      window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
      localStorage.setItem('mathpop-signup-later-v1', String(Date.now()));
      set('mathpop-welcomed-v1', true);
      localStorage.setItem('mathpop-grade-v1', grade);
      set('mathpop-guest-players-v1', [{ id: ID, name: 'Maya', grade }]);
      set('mathpop-active-player-v1', { guest: ID });
      set('mathpop-island-v1', { [ID]: { shells: 14, items: ISLAND } });
      set('mathpop-howto-seen-v1', { chess: true, checkers: true, reversi: true });
    },
    { grade, ID, ISLAND },
  );
  await pg.goto(URL);
  await pg.waitForTimeout(1500);
  return pg;
}
const open = async (pg, title) => {
  await pg.locator('.home-game-title', { hasText: new RegExp(`^${title}$`) }).first().click();
  await pg.waitForTimeout(900);
};
const shot = (pg, name) => pg.screenshot({ path: `${out}/${name}.png` });

(async () => {
  const br = await chromium.launch();
  // 1. Home.
  let pg = await page(br, '2');
  await shot(pg, '1-home');
  await pg.close();
  // 2. Number Snake, paused on the think card with a hint.
  pg = await page(br, '1');
  await open(pg, 'Number Snake');
  const start = pg.locator('button', { hasText: /^Start/ });
  if (await start.count()) await start.first().click();
  await pg.waitForTimeout(4800);
  await pg.locator('.tk-pause').first().click({ force: true });
  await pg.waitForTimeout(500);
  const hint = pg.locator('.tk-next');
  if (await hint.count()) await hint.click();
  await pg.waitForTimeout(500);
  await shot(pg, '2-think');
  await pg.close();
  // 3. Chess with Help me.
  pg = await page(br, '2');
  await open(pg, 'Chess');
  await pg.locator('button', { hasText: /^Full chess/ }).first().click();
  await pg.waitForTimeout(300);
  await pg.locator('button', { hasText: /^Play / }).first().click();
  await pg.waitForTimeout(800);
  await pg.locator('.bg-help').first().click();
  await pg.waitForTimeout(600);
  await shot(pg, '3-chess');
  await pg.close();
  // 4. Lava Run, on a question.
  pg = await page(br, '1');
  await open(pg, 'Lava Run');
  for (let t = 0; t < 40; t++) {
    if (await pg.locator('.lr-choice').count()) break;
    const roll = pg.locator('.lr-roll');
    if ((await roll.count()) && (await roll.isEnabled())) await roll.click();
    await pg.waitForTimeout(500);
  }
  await pg.waitForTimeout(400);
  await shot(pg, '4-lava');
  await pg.close();
  // 5. Island Builder.
  pg = await page(br, '1');
  await open(pg, 'Island Builder');
  await pg.locator('.mi-buy', { hasText: 'Big palm' }).click();
  await pg.waitForTimeout(800);
  await shot(pg, '5-island');
  await pg.close();
  // 6. Shape Fit, with a piece on its way in.
  pg = await page(br, '3');
  await open(pg, 'Shape Fit');
  await shot(pg, '6-shapes');
  await pg.close();
  await br.close();
})();
