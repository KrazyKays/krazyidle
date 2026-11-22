#!/usr/bin/env bash
# Crible à 50 graines (8 profils de T04-lot-sans, 6 h, dt 0,5) : bash lab/balance/simplif/crible.sh "<V> <clés>" …
set -euo pipefail
cd "$(dirname "$0")/../../.."
P8=experimente,debutant,occasionnel,optimiseur,mono-cultiver,mono-commercer,mono-etudier,mono-mediter
for spec in "$@"; do
  V=${spec%% *}; KV=${spec#* }; [ "$KV" = "$V" ] && KV=""
  ID="S50-$V-$(echo "$KV" | tr ' =' '_')"; ID=${ID%-}
  bash lab/balance/simplif/run.sh "$V" "$KV" "$ID" --profiles=$P8 --seeds=1-50 --hours=6 2>/dev/null
done
