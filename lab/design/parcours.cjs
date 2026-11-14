// Parcours Playwright du Game Designer : 5 premières minutes, 1re succession, 1er achat d'Héritage, milieu de partie.
// Prérequis : npx vite --port 5180 --strictPort (serveur de dev). Usage : node lab/design/parcours.cjs
// Horloge simulée (page.clock) pour avancer le temps de jeu sans modifier le code.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const URL = 'http://localhost:5180/';
const OUT = path.join(__dirname, 'captures');
const KEY = 'echos-de-lignee-save';
const log = [];
const note = (x) => { log.push(x); console.log(x); };

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false });
  note('  capture ' + name + '.png');
}
async function txt(page) {
  return (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' ⏎ ').slice(0, 1800);
}

async function newPlayer(browser, ctxOpts, tag) {
  const ctx = await browser.newContext({ ...ctxOpts, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date('2026-11-16T02:00:00Z') }); // hors événement
  await page.goto(URL);
  await page.waitForTimeout(500);
  await shot(page, `${tag}-01-intro-sablier`);
  await page.getByText('Ouvrir le registre').click();
  await page.waitForTimeout(400);
  await shot(page, `${tag}-02-intro-blason`);
  await page.getByText('Fonder la lignée').click();
  await page.waitForTimeout(400);
  await shot(page, `${tag}-03-intro-premier`);
  await page.getByText('Commencer sa vie').click();
  await page.clock.runFor(1500);
  await shot(page, `${tag}-04-vie-t0`);
  note(`[${tag}] t=0 : ${await txt(page)}`);
  await page.clock.runFor(20_000);
  await shot(page, `${tag}-05-vie-t20`);
  note(`[${tag}] t=20 s : ${await txt(page)}`);
  await page.clock.runFor(45_000);
  await shot(page, `${tag}-06-mort-1re-vie`);
  note(`[${tag}] t=65 s : ${await txt(page)}`);
  // 1re succession
  const btn = page.getByText('Choisir la relève');
  if (await btn.count()) await btn.first().click();
  else await page.getByText('Succession en attente').first().click();
  await page.waitForTimeout(400);
  await shot(page, `${tag}-07-succession-1`);
  note(`[${tag}] succession 1 : ${await txt(page)}`);
  await page.getByText('Perpétuer la lignée').click();
  await page.clock.runFor(1000);
  await shot(page, `${tag}-08-gen2`);
  note(`[${tag}] gén. 2 : ${await txt(page)}`);
  // Jusqu'à 5 minutes : on laisse vivre, on valide les successions.
  for (let i = 0; i < 6; i++) {
    await page.clock.runFor(40_000);
    const pend = page.getByText('Succession en attente');
    if (await pend.count()) { await pend.first().click(); await page.waitForTimeout(300); await page.getByText('Perpétuer la lignée').click(); }
  }
  await shot(page, `${tag}-09-vie-5min`);
  note(`[${tag}] ~5 min : ${await txt(page)}`);
  // Onglet Lignée : 1er achat d'Héritage
  if (tag === 'mobile') await page.locator('nav .tab', { hasText: 'Lignée' }).click();
  else await page.locator('.tab', { hasText: 'Lignée' }).click();
  await page.waitForTimeout(400);
  await shot(page, `${tag}-10-lignee-heritage`);
  note(`[${tag}] Lignée : ${await txt(page)}`);
  if (tag === 'mobile') await page.locator('nav .tab', { hasText: 'Domaine' }).click();
  else await page.locator('.tab', { hasText: 'Domaine' }).click();
  await page.waitForTimeout(400);
  await shot(page, `${tag}-11-domaine`);
  note(`[${tag}] Domaine : ${await txt(page)}`);
  if (tag === 'mobile') await page.locator('nav .tab', { hasText: 'Destin' }).click();
  else await page.locator('.tab', { hasText: 'Destin' }).click();
  await page.waitForTimeout(400);
  await shot(page, `${tag}-12-destin`);
  await ctx.close();
}

async function midGame(browser, ctxOpts, tag, file, label) {
  const ctx = await browser.newContext({ ...ctxOpts, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const now = new Date('2026-11-16T02:00:00Z').getTime();
  const st = JSON.parse(fs.readFileSync(path.join(OUT, file), 'utf8'));
  st.lastTick = now;
  await page.clock.install({ time: new Date(now) });
  await page.addInitScript(([k, v]) => { if (!sessionStorage.getItem('inj')) { localStorage.setItem(k, v); sessionStorage.setItem('inj', '1'); } }, [KEY, JSON.stringify(st)]);
  await page.goto(URL);
  await page.clock.runFor(1000);
  await page.getByText('Succession en attente').first().click();
  await page.waitForTimeout(400);
  await shot(page, `${tag}-${label}-succession`);
  note(`[${tag}/${label}] succession : ${await txt(page)}`);
  await page.getByText('Perpétuer la lignée').click();
  await page.clock.runFor(1000);
  if (tag === 'mobile') await page.locator('nav .tab', { hasText: 'Lignée' }).click();
  else await page.locator('.tab', { hasText: 'Lignée' }).click();
  await page.waitForTimeout(400);
  await shot(page, `${tag}-${label}-lignee`);
  await page.evaluate(() => { const el = document.querySelector('.panel-tab') || document.scrollingElement; el.scrollTop = el.scrollHeight; window.scrollTo(0, document.body.scrollHeight); });
  await page.waitForTimeout(300);
  await shot(page, `${tag}-${label}-lignee-bas`);
  note(`[${tag}/${label}] Lignée : ${await txt(page)}`);
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  const mobile = { ...devices['iPhone 13'] };
  const desktop = { viewport: { width: 1440, height: 900 } };
  await newPlayer(browser, mobile, 'mobile');
  await newPlayer(browser, desktop, 'desktop');
  await midGame(browser, desktop, 'desktop', 'state-econome-2h.json', 'econome2h');
  await midGame(browser, mobile, 'mobile', 'state-econome-2h.json', 'econome2h');
  await midGame(browser, desktop, 'desktop', 'state-experimente-2h.json', 'glouton2h');
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'parcours-log.txt'), log.join('\n'));
})().catch((e) => { console.error(e); process.exit(1); });
