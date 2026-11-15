#!/usr/bin/env bash
# R12 — coût d'accès aux Alliances et aux Chroniques (BAL_OBJ en mémoire sur LEGACY), mêmes graines.
# Critère fixé à l'avance : experimente achète Alliances en p50 <= 90 min ; aucune régression ROUGE (sim:guard).
set -e; cd "$(dirname "$0")/../../.."
R="node --import ./lab/balance/register.mjs lab/sim/cli.ts --profiles=experimente,debutant,optimiseur,occasionnel,mono-cultiver,mono-commercer --seeds=1-100 --hours=6"
run() { BAL_OBJ="$2" $R --id=$1 >/dev/null 2>&1; echo "$1 ok"; }
run C060-r12-ref ''
run C061-r12-a60-c120 'LEGACY.alliances.base=60;LEGACY.chroniques.base=120'
run C062-r12-a45-c90 'LEGACY.alliances.base=45;LEGACY.chroniques.base=90'
run C063-r12-a30-c60 'LEGACY.alliances.base=30;LEGACY.chroniques.base=60'
