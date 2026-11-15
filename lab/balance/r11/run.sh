#!/usr/bin/env bash
# R11 — départage des formules de dot (BAL_PATCH en mémoire sur alliances.ts), mêmes graines.
# Critère fixé à l'avance : se marier (ep-mariage-force, ep-mariage-metier) ne fait pas perdre de valeur
# face à ep-sans-mariage, à 6 h et à 12 h (ratio apparié >= ×1,00, ou écart non significatif |z| < 2).
set -e; cd "$(dirname "$0")/../../.."
FROM='const base = Math.max(50, Math.round(s.totalEver.or * 0.02));'
R="node --import ./lab/balance/register.mjs lab/profiles/run.ts --workers=4"
P=oc-sans-mariage,oc-mariage-force,oc-mariage-metier
run() { # id formule
  if [ -n "$2" ]; then PATCH="[{\"file\":\"alliances.ts\",\"from\":\"$FROM\",\"to\":\"const base = $2;\"}]"; else PATCH='[]'; fi
  BAL_PATCH="$PATCH" $R --profiles=$P --seeds=1-200 --hours=6 --id=$1-6h >/dev/null 2>&1
  BAL_PATCH="$PATCH" $R --profiles=$P --seeds=1-100 --hours=12 --id=$1-12h >/dev/null 2>&1
  for h in 6h 12h; do for m in oc-mariage-force oc-mariage-metier; do
    echo "$1 $h : $(node lab/profiles/paired.mjs lab/profiles/results/$1-$h oc-sans-mariage lab/profiles/results/$1-$h $m)"; done; done
}
# Tour 1 (profils ep-*, C050–C053) : 84 % des graines sans mariage, n trop petit. Tour 2 : profils marchands.
run C054-r11-D0-actuelle ''
run C055-r11-D1-fixe50 '50'
run C056-r11-D3-stock5 'Math.max(50, Math.round(s.res.or * 0.05))'
