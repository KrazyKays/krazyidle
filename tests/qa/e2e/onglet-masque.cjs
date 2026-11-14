// QA phase 2 — PBA-01 / QA-06 : production perdue quand le moteur ne tourne pas, onglet masqué ou fil gelé.
// Prérequis : npm run build && npx vite preview --port 4173 --strictPort
// Usage    : NODE_PATH=$(npm root -g) node tests/qa/e2e/onglet-masque.cjs [url] [secondes]
// Régression : tous les cas doivent afficher OK (temps de jeu rattrapé ≥ 90 % du temps réel écoulé).
const { chromium } = require('playwright');

const URL = process.argv[2] || 'http://localhost:4173/';
const SEC = Number(process.argv[3] || 45);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const log = (k, ok, info) => { if (!ok) fails++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${k} — ${info}`); };

async function founded(ctx) {
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.click('.intro-s1 .intro-next');
  await page.click('.intro-s2 .intro-next');
  await page.click('.intro-s3 .intro-next');
  await sleep(1000);
  // Héros en pause : seule la production des Échos/le temps de jeu compte, la vie ne s'achève pas pendant la mesure.
  return page;
}
const snap = (page) => page.evaluate(() => ({ play: window.krazy.state.stats.playTime, last: window.krazy.state.lastTick, vis: document.visibilityState, now: Date.now() }));

(async () => {
  const browser = await chromium.launch();
  try {
    // Cas 1 : onglet masqué (un autre onglet passe au premier plan), > 30 s.
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await founded(ctx);
      const a = await snap(page);
      const other = await ctx.newPage();
      await other.goto('about:blank');
      await other.bringToFront();
      await sleep(500);
      const hidden = await snap(page);
      await sleep(SEC * 1000);
      const during = await snap(page);
      await page.bringToFront();
      await sleep(1500);
      const b = await snap(page);
      const wall = (b.now - a.now) / 1000;
      console.log(`  visibilité pendant : ${hidden.vis} ; lastTick avancé pendant le masquage de ${((during.last - hidden.last) / 1000).toFixed(1)} s ; temps de jeu pendant : +${(during.play - hidden.play).toFixed(1)} s`);
      log('onglet masqué', b.play - a.play >= 0.9 * wall, `jeu +${(b.play - a.play).toFixed(1)} s pour ${wall.toFixed(1)} s réelles`);
      await ctx.close();
    }
    // Cas 2 : fil principal gelé, onglet visible (veille, débogueur) — QA-06.
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await founded(ctx);
      const a = await snap(page);
      await page.evaluate((ms) => { const t = Date.now(); while (Date.now() - t < ms) { /* gel */ } }, SEC * 1000);
      await sleep(1500);
      const b = await snap(page);
      const wall = (b.now - a.now) / 1000;
      log('fil gelé, onglet visible', b.play - a.play >= 0.9 * wall, `jeu +${(b.play - a.play).toFixed(1)} s pour ${wall.toFixed(1)} s réelles`);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  process.exitCode = fails ? 1 : 0;
})();
