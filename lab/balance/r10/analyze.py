#!/usr/bin/env python3
"""R10 — tableau de décision des variantes (critères fixés AVANT de lire les résultats).

Critères (PBA B7, DATA B7, protocole) :
  C1 opti-fort : graines piégées (log10 < 8,1) <= 25 sur 100
  C2 écart meilleure/pire vocation mono (valeur) <= x10
  C3 i-experimente : unlock.mediter p90 <= 300 s
  C4 i-experimente : perte de valeur <= 10 % vs V0 (même graines)
  C5 aucune activité mono ne domine les autres de plus de x3 (valeur moyenne)
Usage : python3 lab/balance/r10/analyze.py [suffixe]
"""
import json, sys, math, os
X = sys.argv[1] if len(sys.argv) > 1 else ''
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'profiles', 'results')
V = ['0-r10-V0-reference', '1-r10-Va-c406', '2-r10-Vb-c314', '3-r10-Vd', '4-r10-Ve', '5-r10-Vf', '6-r10-Vg', '7-r10-Vh']
MONO = ['cultiver', 'chasser', 'commercer', 'etudier', 'mediter']
def load(v):
    p = os.path.join(ROOT, f'C02{v}{X}', 'runs.jsonl')
    return [json.loads(l) for l in open(p)] if os.path.exists(p) else None
def p90(xs):
    xs = sorted(xs); return xs[min(len(xs) - 1, round(0.9 * (len(xs) - 1)))] if xs else float('nan')
base = None
print('| variante | exp. log10 | Δ val. exp. | opti-fort log10 · piégées | opti-commerce log10 | mono cult/chas/comm/étud/médi | écart mono | Méditer p90 (exp., jamais) | C1 | C2 | C3 | C4 | C5 |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
for v in V:
    rs = load(v)
    if rs is None: print(f'| {v} | (absente) |'); continue
    by = {}
    for r in rs: by.setdefault(r['profile'], []).append(r)
    m = lambda p: sum(r['log10Value'] for r in by[p]) / len(by[p])
    exp = {r['seed']: r['log10Value'] for r in by['i-experimente']}
    if base is None: base = exp
    dv = sum(10 ** (exp[k] - base[k]) for k in exp) / len(exp) - 1
    trapped = sum(1 for r in by['opti-fort'] if r['log10Value'] < 8.1)
    mono = {a: m('i-mono-' + a) for a in MONO}
    gap = 10 ** (max(mono.values()) - min(mono.values()))
    srt = sorted(mono.values(), reverse=True); dom = 10 ** (srt[0] - srt[1])
    um = [r['unlockAt']['mediter'] for r in by['i-experimente']]
    never = sum(1 for x in um if x < 0); up = p90([x for x in um if x >= 0])
    ok = lambda b: '✅' if b else '❌'
    print(f"| {v} | {m('i-experimente'):.3f} | {dv*100:+.1f} % | {m('opti-fort'):.2f} · {trapped} | {m('opti-commerce'):.2f} | "
          + ' / '.join(f'{mono[a]:.2f}' for a in MONO) + f" | ×{gap:.1f} | {up:.0f} s, {never} | {ok(trapped <= 25)} | {ok(gap <= 10)} | {ok(up <= 300 and never == 0)} | {ok(dv >= -0.10)} | {ok(dom <= 3)} |")
