// QA — import de sauvegarde et réinitialisation, en vrai (Playwright, Chromium).
// Prérequis : npm run build && npx vite preview --port 4173 --strictPort
// Usage    : node tests/qa/e2e/import-reset.cjs [url]
// QA-10 : main.ts recharge la page après avoir écrit la sauvegarde importée (replaceState) ou effacé
// la sauvegarde (reset), mais le gestionnaire `pagehide` réécrit l'ancien état pendant le rechargement.
const { chromium } = require('playwright');

const URL = process.argv[2] || 'http://localhost:4173/';
const KEY = 'echos-de-lignee-save';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const log = (k, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${k}${info ? ' — ' + info : ''}`); };

async function founded(browser, houseName) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL);
  await page.click('.intro-s1 .intro-next');
  await page.fill('.intro-input', houseName);
  await page.click('.intro-s2 .intro-next');
  await page.click('.intro-s3 .intro-next');
  await sleep(800);
  return { ctx, page, errors };
}

(async () => {
  const browser = await chromium.launch();
  try {
    // 1. Appareil A : exporter
    const A = await founded(browser, 'Exportval');
    await A.page.evaluate(() => { window.krazy.state.res.or = 12345; });
    await A.page.click('[aria-label="Paramètres"]');
    await A.page.waitForSelector('.settings textarea[readonly]');
    const code = await A.page.inputValue('.settings textarea[readonly]');
    await A.ctx.close();

    // 2. Appareil B : partie neuve fondée, puis importer le code de A
    const B = await founded(browser, 'Neuveval');
    await B.page.click('[aria-label="Paramètres"]');
    await B.page.fill('.settings textarea:not([readonly])', code);
    await B.page.click('text=📥 Importer');
    await B.page.locator('.confirm button', { hasText: 'Importer' }).click();
    await B.page.waitForLoadState('load');
    await sleep(1500);
    const name = await B.page.evaluate(() => window.krazy.state.lineage.name);
    const stored = await B.page.evaluate((k) => JSON.parse(localStorage.getItem(k)).lineage.name, KEY);
    log('import : la maison importée est chargée après rechargement', name === 'Exportval', `chargée « ${name} », stockée « ${stored} »`);

    // 3. Réinitialisation
    await B.page.click('[aria-label="Paramètres"]');
    await B.page.click('text=🗑️ Réinitialiser la partie');
    await B.page.locator('.confirm button', { hasText: 'Tout effacer' }).click();
    await B.page.waitForLoadState('load');
    await sleep(1500);
    const intro = await B.page.locator('.intro-screen').count();
    const after = await B.page.evaluate(() => window.krazy.state.lineage.name);
    log('réinitialisation : la cérémonie d\'ouverture revient', intro > 0, `intro=${intro}, maison chargée « ${after} »`);
    log('aucune erreur JS', B.errors.length === 0, B.errors.join(' | '));
    await B.ctx.close();
  } finally {
    await browser.close();
  }
  console.log(fails ? `\n${fails} échec(s)` : '\nTout est OK');
  process.exitCode = fails ? 1 : 0;
})();
