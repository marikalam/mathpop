// Renders the Instagram launch posts (1080x1350) and profile picture into posts/.
// Run from the repo root after `npm install`: node marketing/instagram/build.mjs
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import { writeFileSync, rmSync } from 'node:fs'

// Uses the globally installed Playwright, so it isn't a project dependency.
const { chromium } = createRequire(import.meta.url)('playwright')

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')
const tmp = path.join(here, '.render.html')
const url = (p) => pathToFileURL(path.join(root, p)).href
const shot = (name) => url(`appstore/screenshots/6.9-inch/${name}.png`)
const font = (w) => url(`node_modules/@fontsource/fredoka/files/fredoka-latin-${w}-normal.woff2`)

const gradients = {
  teal: 'linear-gradient(135deg, #3cc07c 0%, #4a7ff0 100%)',
  orange: 'linear-gradient(160deg, #f5a623 0%, #e8743b 100%)',
  purple: 'linear-gradient(160deg, #8e4fd6 0%, #4a7ff0 100%)',
  pink: 'linear-gradient(160deg, #e5487a 0%, #8e4fd6 100%)',
}

const base = `
  @font-face { font-family: Fredoka; font-weight: 500; src: url(${font(500)}); }
  @font-face { font-family: Fredoka; font-weight: 700; src: url(${font(700)}); }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1080px; height: 1350px; font-family: Fredoka, sans-serif; color: #fff;
         display: flex; flex-direction: column; align-items: center; justify-content: center;
         text-align: center; padding: 90px; overflow: hidden; }
  h1 { font-size: 104px; font-weight: 700; line-height: 1.05; }
  p { font-size: 46px; font-weight: 500; opacity: .92; line-height: 1.3; }
  .icon { width: 260px; height: 260px; border-radius: 58px; box-shadow: 0 20px 60px rgba(0,0,0,.2); }
  .pill { background: rgba(255,255,255,.22); border-radius: 999px; padding: 18px 40px; font-size: 40px; font-weight: 500; }
  .handle { position: absolute; bottom: 56px; font-size: 34px; font-weight: 500; opacity: .85; }
`

// App Store screenshots already carry a headline and a phone; crop the top 4:5 of each.
const crop = (name) => `
  <style>body { padding: 0; background: url(${shot(name)}) top center / 1080px auto no-repeat; }</style>`

const posts = {
  '01-hello': `
    <style>body { background: ${gradients.teal}; gap: 56px; }</style>
    <img class="icon" src="${url('public/icon-512.png')}">
    <h1>Hi, we're<br>MathPop!</h1>
    <p>Math practice that reads every problem out loud, so kids can play before they can read.</p>
    <div class="pill">Pre-K to 4th grade · Free · No ads</div>
    <div class="handle">@playmathpop</div>`,
  '02-reads-aloud': crop('1-home'),
  '03-show-me-how': crop('2-explain'),
  '04-puzzle': `
    <style>body { background: ${gradients.purple}; gap: 60px; }
      .eq { font-size: 190px; font-weight: 700; white-space: nowrap; } </style>
    <p>Can your kid solve it in their head?</p>
    <div class="eq">19 + 9 = ?</div>
    <p>Hint: make a ten!<br>Answer and the trick in the next post →</p>
    <div class="handle">@playmathpop</div>`,
  '05-puzzle-answer': `
    <style>body { background: ${gradients.orange}; gap: 44px; }
      .step { font-size: 64px; font-weight: 700; } .big { font-size: 150px; font-weight: 700; }</style>
    <p>The make-a-ten trick</p>
    <div class="step">19 needs 1 more to make 20</div>
    <div class="step">Take 1 from the 9 → 8 left</div>
    <div class="big">20 + 8 = 28</div>
    <p>MathPop talks kids through tricks like this, step by step.</p>
    <div class="handle">@playmathpop</div>`,
  '06-alligators': crop('3-compare'),
  '07-toddler': crop('4-toddler'),
  '08-made-by-a-mom': `
    <style>body { background: ${gradients.pink}; gap: 56px; }</style>
    <img class="icon" src="${url('public/icon-512.png')}">
    <h1>Made by a mom,<br>for her own kids</h1>
    <p>No ads. No tracking. Just math practice that meets your child where they are.</p>
    <div class="handle">@playmathpop</div>`,
  '09-languages': crop('6-explore'),
  '10-pictures': crop('5-pictures'),
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } })
for (const [name, body] of Object.entries(posts)) {
  // Load from a file so the page may read the local fonts and screenshots.
  writeFileSync(tmp, `<!doctype html><meta charset="utf-8"><style>${base}</style>${body}`)
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(here, 'posts', `${name}.png`) })
}

// Profile picture: the app icon at Instagram's upload size.
await page.setViewportSize({ width: 1080, height: 1080 })
writeFileSync(tmp, `<style>*{margin:0}</style><img src="${url('public/icon-512.png')}" style="width:1080px;height:1080px">`)
await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' })
await page.screenshot({ path: path.join(here, 'profile-picture.png') })
await browser.close()
rmSync(tmp)
