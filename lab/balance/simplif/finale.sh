#!/usr/bin/env bash
# Campagnes à 200 graines de la variante finaliste (V3, rendements arrondis) et contrôles.
set -euo pipefail
cd "$(dirname "$0")/../../.."
P8=experimente,debutant,occasionnel,optimiseur,mono-cultiver,mono-commercer,mono-etudier,mono-mediter
F="yc=1.92 yo=1.58 ys=0.76 ye=0.127"
R=lab/balance/simplif/run.sh
bash $R V3 "$F" S-V3-sans --profiles=$P8 --seeds=1-200 --hours=6 2>/dev/null
bash $R V3 "$F" S-V3-avec --profiles=experimente,optimiseur,occasionnel,evenementiel --seeds=1-200 --hours=6 --events 2>/dev/null
bash $R V0 "" S-V0-dt01 --profiles=experimente,optimiseur --seeds=1-50 --hours=6 --dt=0.1 2>/dev/null
bash $R V3 "$F" S-V3-dt01 --profiles=experimente,optimiseur --seeds=1-50 --hours=6 --dt=0.1 2>/dev/null
bash $R V3 "$F HF=0.5" S-V3-HF05-sans --profiles=$P8 --seeds=1-200 --hours=6 2>/dev/null
