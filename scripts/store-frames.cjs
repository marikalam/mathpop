// Puts the captures (scripts/store-captures.cjs) in a device frame with a
// caption, at an App Store screenshot size:
//   node scripts/store-frames.cjs <capsDir> <outDir> <width> <height> [ipad]
const { chromium } = require('playwright');
const { readdirSync, readFileSync } = require('fs');
const [caps, out, w, h, ipad] = process.argv.slice(2);
const W = +w;
const H = +h;
const SLIDES = {
  '1-home': ['Math games kids ask to play', 'Pre-K to 4th grade, every question read out loud', '#5b6cff', '#7c3aed'],
  '2-think': ['Time to think, with hints that show how', 'Ten frames, number bonds and place value, Singapore style', '#f59e0b', '#ea580c'],
  '3-chess': ['Chess and checkers, taught step by step', 'Help me shows a good move and says why', '#10b981', '#0f766e'],
  '4-lava': ['Roll, solve, race to the volcano', 'Adding and taking away on a number line', '#f43f5e', '#c2410c'],
  '5-island': ['Earn shells, build your own island', 'Every purchase is a little subtraction', '#0ea5e9', '#2563eb'],
  '6-shapes': ['Puzzles that grow with your child', 'Levels get harder as they play', '#8b5cf6', '#db2777'],
};
(async () => {
  const br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  for (const file of readdirSync(caps).filter((f) => f.endsWith('.png')).sort()) {
    const key = file.replace('.png', '');
    const [title, sub, c1, c2] = SLIDES[key];
    const img = `data:image/png;base64,${readFileSync(`${caps}/${file}`).toString('base64')}`;
    const s = W / 1320;
    const frameW = ipad ? W * 0.8 : W * 0.78;
    const radius = ipad ? 60 * s : 110 * s;
    await pg.setContent(`<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=IBM+Plex+Sans:wght@500;600&display=swap" rel="stylesheet">
<style>
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
body{background:linear-gradient(160deg,${c1},${c2});display:flex;flex-direction:column;align-items:center;font-family:Fredoka,sans-serif;color:#fff}
h1{margin:${150 * s}px ${70 * s}px 0;font-size:${118 * s}px;line-height:1.08;text-align:center;font-weight:700;text-wrap:balance}
p{margin:${36 * s}px ${90 * s}px 0;font:500 ${54 * s}px/1.3 'IBM Plex Sans',sans-serif;text-align:center;opacity:.95;text-wrap:balance}
.dev{margin-top:${90 * s}px;width:${frameW}px;padding:${22 * s}px;border-radius:${radius + 22 * s}px;background:#111827;box-shadow:0 ${40 * s}px ${90 * s}px rgba(0,0,0,.35)}
.dev img{display:block;width:100%;border-radius:${radius}px}
</style></head><body><h1>${title}</h1><p>${sub}</p><div class="dev"><img src="${img}"></div></body></html>`);
    await pg.waitForTimeout(600);
    await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: `${out}/${file}`, clip: { x: 0, y: 0, width: W, height: H } });
  }
  await br.close();
})();
