R="node --import ./lab/sim/register.mjs lab/profiles/run.ts --workers=2"
P="opti-fort,opti-commerce,i-experimente,i-mono-commercer,i-mono-cultiver,i-mono-mediter,i-mono-etudier"
BAL_OBJ='ACT.commercer.produce.or=1.1' $R --profiles=$P --seeds=1-100 --hours=6 --id=C312-pba-bal01-seul-6h
BAL_OBJ='ACT.commercer.produce.or=1.1;ACT.mediter.produce.essence=0.15;BUILDING.sanctuaire.cost.savoir=0' $R --profiles=$P --seeds=1-100 --hours=6 --id=C313-pba-bal02-sanctuaire-6h
echo FINI3
