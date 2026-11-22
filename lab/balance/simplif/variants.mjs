// Variantes du chantier A (simplification de Récolter et du Domaine), en surcharges BAL_PATCH.
//   node lab/balance/simplif/variants.mjs <V0|V1|V2|V3> [clé=valeur ...]  → JSON sur stdout
// Clés : H (Harmonie figée, V2), HF (santé lue par les Chroniques/évolutions/hauts faits, V2/V3 ; défaut 1),
//        kc (×cultiver), kg (×toutes les activités, V3), yc/yo/ys/ye (rendements absolus de Récolter, Commercer,
//        Étudier, Méditer ; prioritaires sur kc/kg), garde (1 = garder le Garde forestier ; défaut 0),
//        instr (0 = sans instrumentation ; défaut 1).
// Rien n'est écrit sur disque : patch-loader.mjs remplace les littéraux au chargement (motif unique exigé).

const P = (file, from, to) => ({ file, from, to });

/** Instrumentation (n'altère pas la simulation) : Harmonie pondérée par la valeur produite, facteur de Récolter. */
function instr() {
  return [
    P('game.ts', 's.totalEver[r] += amt;',
      's.totalEver[r] += amt; { const I = (globalThis as any).__I; if (I) { const v = amt * RES_INFO[r].value; const h = harmonyMult(s.eco); I.w += v; I.hw += v * h; I.lhw += v * Math.log(h); if (fromLife) { I.hl += v; I.hlw += v * h; } } }'),
    P('sim.ts', 'const mult = ctx.prodMult(act) * power * frac * dt * ecoFactor(act, ctx.eco, post);',
      "const mult = ctx.prodMult(act) * power * frac * dt * ecoFactor(act, ctx.eco, post); if (act === 'cultiver') { const I = (globalThis as any).__I; if (I) { const ef = ecoFactor(act, ctx.eco, post); if (ef > 0) { I.cb += mult / ef; I.ce += mult; } } }"),
  ];
}

/** V1 : plus de consigne, le héros récolte toujours en Équilibre. */
function noPosture() {
  return [P('game.ts', "posture: rt.offline ? 'equilibre' : s.posture ?? 'equilibre',", "posture: 'equilibre',")];
}

/** Domaine retiré : populations figées à l'équilibre, Récolter ne dépend plus de rien, Harmonie constante. */
function noDomain({ H, HF, garde }) {
  const out = [
    P('ecosystem.ts', 'export function ecoStep(e: Eco, dt: number) {', 'export function ecoStep(e: Eco, dt: number) { return;'),
    P('ecosystem.ts', "export function ecoImpact(e: Eco, act: ActId, strength: number, dt: number, posture: Posture = 'equilibre') {",
      "export function ecoImpact(e: Eco, act: ActId, strength: number, dt: number, posture: Posture = 'equilibre') { return;"),
    P('ecosystem.ts', "export function ecoFactor(act: ActId, e: Eco, posture: Posture = 'equilibre'): number {",
      "export function ecoFactor(act: ActId, e: Eco, posture: Posture = 'equilibre'): number { return 1;"),
    P('ecosystem.ts', 'export function harmonyMult(e: Eco): number {', `export function harmonyMult(e: Eco): number { return ${H};`),
    P('game.ts', "if (rt.online && rt.event?.def.id === 'migration') s.eco.G", 'if (false) s.eco.G'),
    // Santé lue par les Chroniques, les évolutions (Longévité, Centenaire, Éternel) et « Récolte raisonnée » :
    // neutralisée à une constante documentée (1 = conditions toujours remplies, 0,5 = jamais).
    P('game.ts', 'harmonyAvg: st.hn > 0 ? st.hs / st.hn : ecoHealth(s.eco), harmonyMin: st.hn > 0 ? st.hm : ecoHealth(s.eco),',
      `harmonyAvg: ${HF}, harmonyMin: ${HF},`),
  ];
  if (!garde) out.push(P('data.ts', "];\nexport const BUILDING: Record<string, BuildingDef>", "].filter((b) => b.id !== 'garde');\nexport const BUILDING: Record<string, BuildingDef>"));
  return out;
}

/** Rendements de base (V3). */
function yields({ kc, kg, yc, yo, ys, ye }) {
  const f = (x) => Number((x).toPrecision(6));
  return [
    P('data.ts', 'produce: { vivres: 1.2 }', `produce: { vivres: ${yc ?? f(1.2 * kc * kg)} }`),
    P('data.ts', 'produce: { or: 1.25 }', `produce: { or: ${yo ?? f(1.25 * kg)} }`),
    P('data.ts', 'produce: { savoir: 0.6 }', `produce: { savoir: ${ys ?? f(0.6 * kg)} }`),
    P('data.ts', 'produce: { essence: 0.1 }', `produce: { essence: ${ye ?? f(0.1 * kg)} }`),
  ];
}

export function patches(v, o = {}) {
  const opt = { H: 1.2, HF: 1, kc: 1, kg: 1, garde: 0, instr: 1, ...o };
  const out = opt.instr ? instr() : [];
  if (v === 'V0') return out;
  out.push(...noPosture());
  if (v === 'V1') return out;
  if (v === 'V2') return [...out, ...noDomain(opt), ...(opt.kc !== 1 || opt.kg !== 1 ? yields(opt) : [])];
  if (v === 'V3') return [...out, ...noDomain({ ...opt, H: 1 }), ...yields(opt)];
  throw new Error('variante inconnue : ' + v);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [v, ...kv] = process.argv.slice(2);
  const o = Object.fromEntries(kv.map((x) => { const [k, y] = x.split('='); return [k, Number(y)]; }));
  process.stdout.write(JSON.stringify(patches(v, o)));
}
