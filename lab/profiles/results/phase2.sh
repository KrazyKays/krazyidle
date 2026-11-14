R="node --import ./lab/sim/register.mjs lab/profiles/run.ts --workers=2"
FIX1='ACT.commercer.produce.or=1.1;ACT.mediter.produce.essence=0.15'
PRUD='ACT.commercer.produce.or=1.3;ACT.mediter.produce.essence=0.1'
REF="i-experimente,i-optimiseur,i-debutant,i-mono-cultiver,i-mono-chasser,i-mono-commercer,i-mono-etudier,i-mono-mediter"
$R --profiles=opti-epargne,ep-recent,ep-vraie-force,ep-sans-mariage,ep-mariage-max --seeds=1-100 --hours=6 --id=C305-pba-echos-mariages-6h
$R --profiles=opti-epargne,ep-sans-mariage,ep-mariage-max --seeds=1-50 --hours=12 --id=C306-pba-mariages-12h
$R --profiles=i-mono-etudier,i-mono-mediter --seeds=1-100 --hours=6 --id=C308-pba-ref-mono-6h
BAL_OBJ=$FIX1 $R --profiles=$REF,opti-fort,opti-commerce,opti-epargne,sans-vocation-piege --seeds=1-100 --hours=6 --id=C307-pba-bal02-fix1-6h
BAL_OBJ=$PRUD $R --profiles=$REF,opti-fort,opti-commerce --seeds=1-100 --hours=6 --id=C309-pba-bal02-prudent-6h
echo FINI
