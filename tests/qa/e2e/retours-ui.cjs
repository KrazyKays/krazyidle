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

/** Fin de la première vie et succession : un premier Écho. */
async function toGen2(page) {
  await st(page, '(s.life.t = s.life.dur - 0.5, 1)');
  await page.waitForFunction(() => !!window.krazy.state.succession, null, { timeout: 5000 });
  if (await page.locator('.succession').count() === 0) await page.locator('.life-pill').click();
  await page.waitForSelector('.succession');
  await page.click('text=Perpétuer la lignée');
  await page.waitForFunction(() => window.krazy.state.hero.gen === 2 && !!window.krazy.state.life, null, { timeout: 3000 });
}

async function gotoTab(page, label) {
  const tab = page.locator('nav.tabbar .tab', { hasText: label });
  if (await tab.count()) { await tab.click(); await sleep(250); }
}

async function lock(page, name) {
  await gotoTab(page, 'Échos');
  const card = page.locator('.echo-card').first();
  const btn = card.locator('.lock-btn');
  const off = await btn.evaluate((el) => ({ txt: el.textContent, op: getComputedStyle(el).opacity, bg: getComputedStyle(el).backgroundImage }));
  await btn.click();
  await sleep(200);
  const on = await page.locator('.echo-card').first().evaluate((el) => {
    const b = el.querySelector('.lock-btn');
    return { txt: b.textContent, pressed: b.getAttribute('aria-pressed'), op: getComputedStyle(b).opacity, bg: getComputedStyle(b).backgroundImage, badge: !!el.querySelector('.badge-lock'), border: getComputedStyle(el).borderTopColor };
  });
  log(`${name} : Écho protégé → 🔒 doré plein, libre → 🔓 estompé`, off.txt === '🔓' && on.txt === '🔒' && on.pressed === 'true' && Number(off.op) < 0.7 && Number(on.op) === 1 && off.bg === 'none' && on.bg.includes('gradient'));
  log(`${name} : étiquette « Protégé » et cadre doré vif`, on.badge && on.border === 'rgb(242, 196, 90)', on.border);
  log(`${name} : la protection est enregistrée`, await st(page, 's.echoes[0].pinned') === true);
  await page.locator('.echo-card').first().screenshot({ path: path.join(OUT, `retours-${name}-echo-protege.png`) });
}

async function legacyUnlock(page, name) {
  await gotoTab(page, 'Lignée');
  const cards = page.locator('.card.build', { has: page.locator('.badge-new') });
  const n = await cards.count();
  const txt = n ? await cards.first().innerText() : '';
  log(`${name} : déblocages signalés « Nouvelle fonctionnalité »`, n >= 2, `${n} cartes`);
  log(`${name} : ni jauge d'épargne ni montant possédé dans la carte`, !/épargne|Tu peux le débloquer|\//.test(txt), txt.replace(/\s+/g, ' '));
  await cards.first().screenshot({ path: path.join(OUT, `retours-${name}-deblocage.png`) });
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
    await toGen2(page);
    await lock(page, name);
    await legacyUnlock(page, name);
    log(`${name} : aucune erreur JavaScript`, errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  await browser.close();
  const ko = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - ko}/${results.length} vérifications passées`);
  process.exit(ko ? 1 : 0);
})();
