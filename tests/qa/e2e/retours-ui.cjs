// QA — retours d'interface du 2026-11-17 (Playwright, Chromium). Exécuté à part, pas par `npm test`.
// Prérequis : npm run build && npx vite preview --port 4173 --strictPort
// Usage    : NODE_PATH=$(npm root -g) node tests/qa/e2e/retours-ui.cjs [url] [dossier-captures]
const { chromium, devices } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const URL = process.argv[2] || 'http://localhost:4173/';
const OUT = process.argv[3] || path.join(__dirname, 'captures');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const log = (k, ok, info = '') => { results.push({ k, ok }); console.log(`${ok ? 'OK  ' : 'FAIL'} ${k}${info ? ' — ' + info : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const st = (page, expr) => page.evaluate(`(() => { const s = window.krazy.state; return ${expr}; })()`);

async function ceremony(page) {
  await page.goto(URL);
  await page.waitForSelector('.intro-s1 .intro-next');
  await page.click('.intro-s1 .intro-next');
  await page.waitForSelector('.intro-s2');
  await page.fill('.intro-input', 'Testeval');
  await page.click('.intro-s2 .intro-next');
  await page.waitForSelector('.intro-s3');
  await page.click('.intro-s3 .intro-next');
  await page.waitForSelector('.intro-screen', { state: 'detached' });
}

/** Affiche une notification (clic sur un trait du héros). */
async function showToast(page) {
  await page.locator('.panel-life .trait').first().click();
  await page.waitForSelector('#toasts .toast.show');
  await sleep(300);
}

async function toasts(page, name) {
  await showToast(page);
  const top = await page.locator('.topbar').boundingBox();
  const t = await page.locator('#toasts .toast').first().boundingBox();
  log(`${name} : la notification ne recouvre pas la barre du haut`, t.y >= top.y + top.height - 1, `toast y=${t.y.toFixed(0)}, barre bas=${(top.y + top.height).toFixed(0)}`);
  await page.screenshot({ path: path.join(OUT, `retours-${name}-toast.png`) });
  for (let i = 0; i < 5; i++) await page.locator('.panel-life .trait').first().click();
  log(`${name} : trois notifications au plus`, (await page.locator('#toasts .toast').count()) <= 3);
  await page.locator('#toasts .toast').last().click();
  await sleep(400);
  log(`${name} : un toucher ferme la notification`, (await page.locator('#toasts .toast').count()) <= 2);
}

(async () => {
  const browser = await chromium.launch();
  for (const [name, opts] of [['mobile', devices['Pixel 7']], ['ordinateur', { viewport: { width: 1440, height: 900 } }]]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await ceremony(page);
    await toasts(page, name);
    log(`${name} : aucune erreur JavaScript`, errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  await browser.close();
  const ko = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - ko}/${results.length} vérifications passées`);
  process.exit(ko ? 1 : 0);
})();
