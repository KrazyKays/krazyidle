// Chargeur Node « en mémoire » pour les tests de sensibilité du Game Balancer.
// Il remplace des littéraux du moteur AU CHARGEMENT (variable d'environnement BAL_PATCH),
// sans jamais écrire sur disque : les fichiers du moteur restent intacts.
//   BAL_PATCH='[{"file":"game.ts","from":"0.4 * (1 + 0.15","to":"0.5 * (1 + 0.15"}]'
// Chaque motif doit apparaître exactement une fois, sinon le chargement échoue (garde-fou).
const patches = JSON.parse(process.env.BAL_PATCH || '[]');
export async function load(url, context, next) {
  const r = await next(url, context);
  const mine = patches.filter((p) => url.endsWith('/engine/' + p.file));
  if (!mine.length) return r;
  let text = typeof r.source === 'string' ? r.source : Buffer.from(r.source).toString('utf8');
  for (const p of mine) {
    const n = text.split(p.from).length - 1;
    if (n !== 1) throw new Error(`BAL_PATCH : motif ${JSON.stringify(p.from)} trouvé ${n} fois dans ${p.file}`);
    text = text.replace(p.from, p.to);
  }
  return { ...r, source: text };
}
