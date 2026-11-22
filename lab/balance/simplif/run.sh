#!/usr/bin/env bash
# bash lab/balance/simplif/run.sh <V0|V1|V2|V3> "<clé=valeur …>" <id> [arguments de npm run sim]
# ex. bash lab/balance/simplif/run.sh V2 "H=1.2" S-V2-sans --profiles=experimente --seeds=1-200 --hours=6
set -euo pipefail
cd "$(dirname "$0")/../../.."
V=$1; KV=$2; ID=$3; shift 3
export SIMPLIF_VARIANT="$V $KV"
export BAL_PATCH="$(node lab/balance/simplif/variants.mjs "$V" $KV)"
node --import ./lab/balance/register.mjs lab/balance/simplif/cli.ts --id="$ID" "$@" > /dev/null
echo "$ID ($V $KV) : $(wc -l < lab/results/$ID/runs.jsonl) parties"
