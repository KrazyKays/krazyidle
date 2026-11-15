#!/usr/bin/env bash
# R9 — calibration des paliers d'événement (BAL_PATCH en mémoire sur les constantes de game.ts).
# Usage : ./lab/balance/r9/sweep.sh <id> <poids> <bronze_s> "<paliers>"   ex. : C031 3 600 "1, 2.5, 5"
set -e; cd "$(dirname "$0")/../../.."
ID=$1; W=$2; B=$3; T=$4
P="[{\"file\":\"game.ts\",\"from\":\"EVENT_GOAL_WEIGHT = 3;\",\"to\":\"EVENT_GOAL_WEIGHT = $W;\"},{\"file\":\"game.ts\",\"from\":\"EVENT_BASE_SEC = 1200;\",\"to\":\"EVENT_BASE_SEC = $B;\"},{\"file\":\"game.ts\",\"from\":\"EVENT_TIERS = [1, 3, 8];\",\"to\":\"EVENT_TIERS = [$T];\"}]"
BAL_PATCH="$P" node --import ./lab/balance/register.mjs lab/sim/cli.ts --profiles=experimente,evenementiel,optimiseur --seeds=1-50 --hours=24 --events --id=$ID-r9-w$W-b$B >/dev/null 2>&1
python3 lab/balance/r9/tiers.py $ID-r9-w$W-b$B | tail -4
