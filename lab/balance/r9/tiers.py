#!/usr/bin/env python3
"""R9 — distribution des paliers d'événement par fenêtre (Bronze/Argent/Or), par profil.
Cibles fixées AVANT la calibration :
  experimente (ne change pas d'activité) : Bronze >= 80 %, Or <= 15 %
  evenementiel (joue l'activité dopée)  : Bronze >= 95 %, Or entre 30 et 70 %
Usage : python3 lab/balance/r9/tiers.py <id-campagne> [...]"""
import json, sys, os
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'results')
CIB = {'experimente': (0.80, 0, 0.15), 'evenementiel': (0.95, 0.30, 0.70)}
for cid in sys.argv[1:]:
    by = {}
    for l in open(os.path.join(ROOT, cid, 'runs.jsonl')):
        r = json.loads(l); by.setdefault(r['profile'], []).extend(r.get('eventTiers', []))
    print(f'### {cid}\n\n| profil | fenêtres | ≥ Bronze | ≥ Argent | Or | cible |\n|---|---|---|---|---|---|')
    for p, t in sorted(by.items()):
        n = len(t) or 1
        b, a, o = (sum(1 for x in t if x >= k) / n for k in (1, 2, 3))
        c = CIB.get(p); ok = ''
        if c: ok = '✅' if b >= c[0] and c[1] <= o <= c[2] else '❌'
        print(f'| {p} | {len(t)} | {b*100:.0f} % | {a*100:.0f} % | {o*100:.0f} % | {ok} |')
    print()
