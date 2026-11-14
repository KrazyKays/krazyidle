#!/usr/bin/env bash
# Phase 2 (confrontation) — expériences du Game Balancer, 2 processus au plus. Surcharges en mémoire uniquement.
#   bash lab/balance/run-phase2.sh <dot50|vie|venerable|fixdt>
set -e
cd "$(dirname "$0")/../.."
R=lab/balance/results
N="node --import ./lab/balance/register.mjs"
case "$1" in
  dot50) # B2 : dot fixe à 50 Or (isole le coût de la dot)
    export BAL_PATCH='[{"file":"alliances.ts","from":"Math.max(50, Math.round(s.totalEver.or * 0.02))","to":"50"}]'
    for k in 0 1; do $N lab/balance/marriage.ts --seeds=1-40 --hours=12 --shard=$k/2 > $R/m50-$k.jsonl & done; wait
    cat $R/m50-0.jsonl $R/m50-1.jsonl > $R/marriage-dot50-runs.jsonl; rm $R/m50-0.jsonl $R/m50-1.jsonl
    unset BAL_PATCH
    cp $R/marriage.md $R/marriage-keep.md
    $N lab/balance/marriage.ts --summarize $R/marriage-dot50-runs.jsonl > /dev/null
    mv $R/marriage.md $R/marriage-dot50.md; mv $R/marriage-keep.md $R/marriage.md
    cat $R/marriage-dot50.md ;;
  vie) # B5 : Héritage × durée/60
    export BAL_PATCH='[{"file":"game.ts","from":"const legacyGain = legacyFor(life.value);","to":"const legacyGain = Math.floor(Math.cbrt(life.value / 20) * life.dur / 60);"}]'
    O=$R/traits-heritagexduree-runs.jsonl; rm -f $O
    ONLY=mono-commercer:,mono-commercer:robuste,mono-commercer:longevite,mono-commercer:centenaire,mono-commercer:eternel
    for k in 0 1; do $N lab/balance/traits.ts --seeds=1-30 --hours=4 --only=$ONLY --out=$O --shard=$k/2 & done; wait
    unset BAL_PATCH
    $N lab/balance/traits.ts --summarize --out=$O ;;
  venerable) # B10
    O=$R/venerable-runs.jsonl; rm -f $O
    for k in 0 1; do $N lab/balance/venerable.ts --tag=base --seeds=1-50 --hours=6 --shard=$k/2 >> $R/v-b$k.jsonl & done; wait
    export BAL_PATCH='[{"file":"game.ts","from":"vocTier: voc?.tier ?? 0,","to":"vocTier: (voc?.tier ?? 0) >= 10 && (hero.vocation?.tier ?? 0) >= 10 ? 9 : voc?.tier ?? 0,"}]'
    for k in 0 1; do $N lab/balance/venerable.ts --tag=fix --seeds=1-50 --hours=6 --shard=$k/2 >> $R/v-f$k.jsonl & done; wait
    unset BAL_PATCH
    cat $R/v-b0.jsonl $R/v-b1.jsonl $R/v-f0.jsonl $R/v-f1.jsonl > $O; rm $R/v-[bf][01].jsonl
    $N lab/balance/venerable.ts --summarize $O ;;
  fixdt) # B4 : fix1 (C207) revalidé à dt 0,1
    export BAL_OBJ='ACT.commercer.produce.or=1.1;ACT.mediter.produce.essence=0.15'
    P=mono-cultiver,mono-chasser,mono-commercer,mono-etudier,mono-mediter
    for k in 0 1; do $N lab/balance/batch.ts --profiles=$P --seeds=1-30 --hours=6 --dt=0.1 --shard=$k/2 --tag=fix1-dt01 > $R/fd-$k.jsonl & done; wait
    cat $R/fd-0.jsonl $R/fd-1.jsonl > $R/fix1-dt01-runs.jsonl; rm $R/fd-0.jsonl $R/fd-1.jsonl ;;
esac
