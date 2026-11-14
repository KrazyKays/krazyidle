# Historique des campagnes de tests et de simulation

Chaque campagne est rejouable à l'identique avec sa commande et son commit. Résultats : `lab/results/<id>/` (`summary.md` et `summary.json` versionnés, `runs.jsonl` régénérable). Références figées : `lab/baselines/`.

| ID | Date | Commit | Auteur | Commande | Parties | Objet | Résultat principal |
|---|---|---|---|---|---|---|---|
| C000 | 2026-11-14 | a53d1b5 | Lead | `npm run sim -- --profiles=experimente,debutant,occasionnel,optimiseur,mono-cultiver,mono-chasser,mono-commercer,mono-etudier,mono-mediter --seeds=1-200 --hours=6 --id=C000-reference-sans-evenements` | 1 800 (9 profils × 200 graines × 6 h, dt 0,5, sans événements) | Référence initiale avant audit | Voir `lab/results/C000-reference-sans-evenements/summary.md`. 0 anomalie (NaN/négatif). |
| C001 | 2026-11-14 | a53d1b5 | Lead | `npm run sim -- --profiles=experimente,optimiseur,occasionnel --seeds=1-200 --hours=6 --events --id=C001-reference-avec-evenements` | 600 (3 profils × 200 graines × 6 h, dt 0,5, avec événements) | Référence avec événements mondiaux | Voir `summary.md`. |

Convention : les agents ajoutent une ligne par campagne qu'ils lancent (ID `C1xx` QA, `C2xx` balancing, `C3xx` comportements, `C4xx` data, `C5xx` design).
