// QA — parcours navigateur (Playwright, Chromium). Exécuté à part, pas par `npm test`.
// Prérequis : npm run build && npx vite preview --port 4173 --strictPort
// Usage    : node tests/qa/e2e/parcours.cjs [url] [dossier-captures]
const { chromium, devices } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const URL = process.argv[2] || 'http://localhost:4173/';
const OUT = process.argv[3] || path.join(__dirname, 'captures');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const log = (k, ok, info = '') => { results.push({ k, ok, info }); console.log(`${ok ? 'OK  ' : 'FAIL'} ${k}${info ? ' — ' + info : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function newPage(browser, name, opts) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return { ctx, page, errors, name };
}

const st = (page, expr) => page.evaluate(`(() => { const s = window.krazy.state; return ${expr}; })()`);
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

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

async function journey(browser, name, opts) {
  const { ctx, page, errors } = await newPage(browser, name, opts);
  await ceremony(page);
  log(`${name} : cérémonie d'ouverture`, (await st(page, 's.flags.started && s.lineage.name')) === 'Testeval');
  await page.screenshot({ path: path.join(OUT, `${name}-1-vie.png`) });
  await sleep(3000);
  const t = await st(page, 's.life.t');
  log(`${name} : la première vie s'écoule`, t > 2 && t < 4.5, `t=${t.toFixed(2)} s après 3 s`);
  const recOk = await st(page, 's.life.rec.length === Math.floor(s.life.t + 1e-6)');
  log(`${name} : une entrée par seconde`, recOk);
  log(`${name} : pas de défilement horizontal`, await noHScroll(page));

  // Succession : on avance la vie jusqu'à sa fin.
  await st(page, '(s.life.t = s.life.dur - 0.5, 1)');
  await page.waitForFunction(() => !!window.krazy.state.succession, null, { timeout: 5000 });
  log(`${name} : mort → succession en attente`, true);
  const pill = page.locator('.life-pill');
  if (await page.locator('.succession').count() === 0) await pill.click();
  await page.waitForSelector('.succession');
  await page.screenshot({ path: path.join(OUT, `${name}-2-succession.png`) });
  log(`${name} : modale de succession sans défilement horizontal`, await noHScroll(page));
  await page.click('text=Perpétuer la lignée');
  await page.waitForFunction(() => window.krazy.state.hero.gen === 2 && !!window.krazy.state.life, null, { timeout: 3000 });
  log(`${name} : génération II, un Écho`, (await st(page, 's.echoes.length')) === 1);

  // Onglets
  const tabs = page.locator('nav.tabbar .tab');
  const n = await tabs.count();
  for (let i = 0; i < n; i++) {
    await tabs.nth(i).click();
    await sleep(250);
    const label = (await tabs.nth(i).innerText()).replace(/\s+/g, ' ').trim();
    await page.screenshot({ path: path.join(OUT, `${name}-3-onglet-${i}.png`) });
    log(`${name} : onglet « ${label} » sans défilement horizontal`, await noHScroll(page));
    const subs = page.locator('.subtab');
    for (let j = 1; j < await subs.count(); j++) {
      await subs.nth(j).click();
      await sleep(200);
      const sl = (await subs.nth(j).innerText()).replace(/\s+/g, ' ').trim();
      log(`${name} : sous-onglet « ${label} › ${sl} » sans défilement horizontal`, await noHScroll(page));
    }
  }

  // Export de sauvegarde
  await page.click('[aria-label="Paramètres"]');
  await page.waitForSelector('.settings textarea[readonly]');
  const code = await page.inputValue('.settings textarea[readonly]');
  const parsed = await page.evaluate((c) => { try { return JSON.parse(decodeURIComponent(escape(atob(c)))); } catch { return null; } }, code);
  log(`${name} : export de sauvegarde lisible`, !!parsed && parsed.hero && parsed.hero.gen === 2, `${code.length} caractères`);
  await page.keyboard.press('Escape');

  log(`${name} : aucune erreur console`, errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

/** QA-01 en vrai : Bénédiction achetée pendant la succession en attente. */
async function blessingDuringSuccession(browser) {
  const { ctx, page, errors } = await newPage(browser, 'qa01', { viewport: { width: 1440, height: 900 } });
  await ceremony(page);
  await st(page, '(s.life.t = s.life.dur - 0.5, 1)');
  await page.waitForFunction(() => !!window.krazy.state.succession);
  await page.keyboard.press('Escape');
  await st(page, '(s.eclats = 12, 1)');
  // Le Bazar céleste est dans Améliorer › Bazar.
  await page.locator('nav.tabbar .tab', { hasText: 'Améliorer' }).click();
  await sleep(300);
  await page.locator('.subtab', { hasText: 'Bazar' }).click();
  await sleep(300);
  const item = page.locator('.shop-item', { hasText: /Élu/ }).first();
  const visible = await item.count();
  if (!visible) { log('QA-01 navigateur : Bazar accessible pendant la succession', false, 'article Élu introuvable'); await ctx.close(); return; }
  await item.click();
  await sleep(200);
  const after = await st(page, '({ e: s.eclats, b: s.blessings.slice(), succ: !!s.succession })');
  log('QA-01 navigateur : achat accepté pendant la succession', after.succ && after.e === 0 && after.b.includes('elu'), JSON.stringify(after));
  await page.locator('.life-pill').click();
  await page.waitForSelector('.succession');
  await page.click('text=Perpétuer la lignée');
  await sleep(300);
  const end = await st(page, '({ traits: s.hero.traits, b: s.blessings, e: s.eclats })');
  log('QA-01 navigateur : la Bénédiction achetée pendant la succession est portée par l\'héritier (R4)', end.traits.includes('elu') && end.b.length === 0 && end.e === 0, JSON.stringify(end));
  await ctx.close();
  return errors;
}

/**
 * QA-02 : depuis R3, l'import refuse une sauvegarde au héros incomplet (tests/qa/save.test.ts). Ce parcours
 * écrit une sauvegarde corrompue directement dans localStorage, ce qu'aucun chemin du jeu ne fait plus :
 * il documente le risque résiduel (sauvegarde locale corrompue par un tiers → plantage au lancement),
 * volontairement non traité pour ne jamais écarter la partie d'un joueur.
 */
async function malformedSave(browser) {
  const { ctx, page, errors } = await newPage(browser, 'qa02', { viewport: { width: 1440, height: 900 } });
  const bad = JSON.stringify({ v: 2, hero: { name: 'X' }, flags: { started: true } });
  await ctx.addInitScript((b) => { if (!sessionStorage.getItem('qa')) { localStorage.setItem('echos-de-lignee-save', b); sessionStorage.setItem('qa', '1'); } }, bad);
  await page.goto(URL);
  await sleep(1500);
  const boot = await page.evaluate(() => ({ hasKrazy: !!window.krazy, tabs: document.querySelectorAll('nav.tabbar .tab').length, text: document.body.innerText.slice(0, 80) }));
  log('QA-02 résiduel : sauvegarde locale corrompue (hors import) → plantage au lancement (comportement documenté si OK)', errors.some((e) => /not iterable/.test(e)), `${JSON.stringify(boot)} · ${errors.slice(0, 1).join(' | ')}`);
  await page.reload();
  await sleep(1000);
  log('QA-02 résiduel : le plantage persiste au rechargement (documenté)', errors.filter((e) => /not iterable/.test(e)).length >= 2);
  await page.screenshot({ path: path.join(OUT, 'qa02-lancement.png') });
  await ctx.close();
}

/** QA-06 : fil principal gelé 20 s, onglet visible (veille, débogueur…) → progression perdue. */
async function frozenThread(browser) {
  const { ctx, page } = await newPage(browser, 'qa06', { viewport: { width: 1440, height: 900 } });
  await ceremony(page);
  await sleep(1500);
  const p0 = await st(page, 's.stats.playTime');
  const w0 = Date.now();
  await page.evaluate(() => { const t = Date.now(); while (Date.now() - t < 20000) { /* gel */ } });
  await sleep(2000);
  const p1 = await st(page, 's.stats.playTime');
  const wall = (Date.now() - w0) / 1000;
  log('QA-06 navigateur : après 20 s de gel visible, temps de jeu rattrapé (bug reproduit si FAIL)', p1 - p0 > wall - 3, `jeu +${(p1 - p0).toFixed(1)} s pour ${wall.toFixed(1)} s réelles`);
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  try {
    await journey(browser, 'mobile', { ...devices['iPhone 13'] });
    await journey(browser, 'desktop', { viewport: { width: 1440, height: 900 } });
    await blessingDuringSuccession(browser);
    await malformedSave(browser);
    await frozenThread(browser);
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(OUT, 'resultats.json'), JSON.stringify(results, null, 2));
  console.log(`\n${results.filter((r) => r.ok).length}/${results.length} vérifications OK`);
})();
