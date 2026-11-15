#!/usr/bin/env bash
# R13 — Héritage selon la durée de vie : aucune, √(durée/60), durée/60 (BAL_PATCH en mémoire sur game.ts).
# Critères fixés à l'avance : (1) traits de durée (Robuste, Longévité, Centenaire) >= ×1,00 de valeur ;
# (2) inflation de l'Héritage total <= ×1,5 sur les profils de référence ; (3) aucun ROUGE économique.
set -e; cd "$(dirname "$0")/../../.."
FROM='const legacyGain = legacyFor(life.value);'
var() { case $1 in
  aucune) echo '[]';;
  racine) echo "[{\"file\":\"game.ts\",\"from\":\"$FROM\",\"to\":\"const legacyGain = Math.floor(Math.cbrt(life.value / 20) * Math.sqrt(life.dur / 60));\"}]";;
  lineaire) echo "[{\"file\":\"game.ts\",\"from\":\"$FROM\",\"to\":\"const legacyGain = Math.floor(Math.cbrt(life.value / 20) * (life.dur / 60));\"}]";;
  racine-rel) echo "[{\"file\":\"game.ts\",\"from\":\"$FROM\",\"to\":\"const legacyGain = Math.floor(Math.cbrt(life.value / 20) * Math.sqrt(life.dur / lifeDuration(s, { ...hero, traits: [] })));\"}]";;
  lineaire-rel) echo "[{\"file\":\"game.ts\",\"from\":\"$FROM\",\"to\":\"const legacyGain = Math.floor(Math.cbrt(life.value / 20) * (life.dur / lifeDuration(s, { ...hero, traits: [] })));\"}]";;
esac; }
# Tour 2 : durée rapportée à la durée normale de la lignée (sans traits), car le tour 1 gonflait l'Héritage de tous.
for v in ${VARIANTS:-aucune racine lineaire}; do
  BAL_PATCH="$(var $v)" node --import ./lab/balance/register.mjs lab/balance/traits.ts --seeds=1-30 --hours=4 --only=mono-commercer:,mono-commercer:robuste,mono-commercer:longevite,mono-commercer:centenaire,mono-commercer:eternel --out=lab/balance/r13/traits-$v.jsonl >/dev/null 2>&1
  BAL_PATCH="$(var $v)" node --import ./lab/balance/register.mjs lab/sim/cli.ts --profiles=experimente,debutant,optimiseur,mono-cultiver,mono-commercer,mono-mediter --seeds=1-100 --hours=6 --id=C07$(case $v in aucune) echo 0;; racine) echo 1;; lineaire) echo 2;; racine-rel) echo 3;; lineaire-rel) echo 4;; esac)-r13-$v >/dev/null 2>&1
  echo "$v ok"
done
