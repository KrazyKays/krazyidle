R="node --import ./lab/sim/register.mjs lab/profiles/run.ts --workers=2"
until grep -q FINI lab/profiles/results/phase2.log; do sleep 5; done
$R --profiles=ep-mariage-force,ep-mariage-metier --seeds=1-100 --hours=6 --id=C310-pba-mariages-forces-6h
$R --profiles=ep-mariage-force,ep-mariage-metier --seeds=1-50 --hours=12 --id=C311-pba-mariages-forces-12h
echo FINI2
