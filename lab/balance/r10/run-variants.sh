#!/usr/bin/env bash
# R10 — départage des variantes de rééquilibrage des convertisseurs (surcharges en mémoire, mêmes graines).
set -e
cd "$(dirname "$0")/../../.."
R="node --import ./lab/sim/register.mjs lab/profiles/run.ts --workers=4"
P=i-experimente,i-optimiseur,i-debutant,i-mono-cultiver,i-mono-chasser,i-mono-commercer,i-mono-etudier,i-mono-mediter,opti-fort,opti-commerce
S=${SEEDS:-1-100}; H=${HOURS:-6}; DT=${DT:-0.5}; X=${SUFFIX:-}
run() { BAL_OBJ="$2" $R --profiles=$P --seeds=$S --hours=$H --dt=$DT --id=C02$1$X >/dev/null 2>&1; echo "C02$1$X ok"; }
run 0-r10-V0-reference ''
run 1-r10-Va-c406 'ACT.commercer.produce.or=1.25;ACT.mediter.produce.essence=0.15;ACT_UNLOCK.mediter.amount=20'
run 2-r10-Vb-c314 'ACT.commercer.produce.or=1.1;ACT.mediter.produce.essence=0.10;BUILDING.sanctuaire.cost.savoir=0'
run 3-r10-Vd 'ACT.commercer.produce.or=1.25;ACT.mediter.produce.essence=0.10;BUILDING.sanctuaire.cost.savoir=0;ACT_UNLOCK.mediter.amount=20'
run 4-r10-Ve 'ACT.commercer.produce.or=1.25;ACT.mediter.produce.essence=0.12;BUILDING.sanctuaire.cost.savoir=0;ACT_UNLOCK.mediter.amount=20'
run 5-r10-Vf 'ACT.commercer.produce.or=1.3;ACT.mediter.produce.essence=0.10;BUILDING.sanctuaire.cost.savoir=0;ACT_UNLOCK.mediter.amount=20'
