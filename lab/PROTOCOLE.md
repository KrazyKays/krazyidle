# Protocole de l'équipe d'analyse — Échos de Lignée

Document commun aux cinq agents (`.claude/agents/`) et au Technical Lead. Chaque agent le lit **avant** de commencer.

## 1. Organisation

| Rôle | Fichier | Domaine | Écrit dans |
|---|---|---|---|
| Technical Lead (session principale) | — | Coordination, outillage partagé, synthèse, feuille de route, application des corrections validées | partout (après validation) |
| QA Engineer | `.claude/agents/qa-engineer.md` | Bugs, cas limites, régression, tests automatisés | `tests/qa/`, `audits/` |
| Game Designer | `.claude/agents/game-designer.md` | Mécaniques, rythme, UX, plaisir, frustrations | `audits/`, `lab/design/` |
| Game Balancer | `.claude/agents/game-balancer.md` | Chiffres, ratios, probabilités, stratégies dominantes, sensibilité | `lab/balance/`, `audits/` |
| Player Behavior Analyst | `.claude/agents/player-behavior-analyst.md` | Profils de joueurs, exploits, abus, comportements inattendus | `lab/profiles/`, `audits/` |
| Game Data Analyst | `.claude/agents/game-data-analyst.md` | Indicateurs, campagnes, comparaisons, tableaux de bord | `lab/metrics/`, `lab/reports/`, `audits/` |

## 2. Règles absolues

1. **Lecture seule pendant l'audit.** Tant que `.claude/AUDIT_LOCK` existe, le hook `.claude/hooks/audit-lock.mjs` bloque toute écriture sur `src/`, `public/`, `index.html`, les configurations, la CI et `docs/GAME_DESIGN.md`. Ne pas chercher à le contourner. Les agents ne font **aucun commit** : c'est le rôle du Lead.
2. **Ne jamais prétendre avoir testé ce qui n'a pas été exécuté.** Toute affirmation porte une étiquette :
   - **[MESURÉ]** : observé en exécutant le vrai code (test, script, capture), avec la commande exacte.
   - **[SIMULÉ]** : issu d'un profil automatique (`lab/sim`) — dépend des hypothèses du profil, qu'il faut citer.
   - **[CODE]** : déduit de la lecture du code, avec `fichier:ligne`.
   - **[HYPOTHÈSE]** : raisonnement non vérifié. À transformer en mesure dès que possible.
3. **Reproductibilité.** Toute mesure cite la commande, les graines, la durée, le pas `dt`, et le commit (`git rev-parse --short HEAD`).
4. **Problème objectif ≠ préférence.** Un problème de design se justifie par un critère vérifiable (mécanique jamais utilisée par aucun profil, écart de rentabilité ×10, contradiction avec le GDD, décision sans information, blocage…). Une préférence de goût est rangée en « Amélioration facultative » et marquée comme telle.
5. **Indépendance.** En phase 1, ne pas lire les rapports des autres agents (`audits/<date>/*.md` sauf le sien).

## 3. Outillage disponible

| Commande | Usage |
|---|---|
| `npm test` | Suite Vitest complète (tests unitaires, `tests/qa`, régressions). Doit rester verte. |
| `npx vitest run tests/qa` | Tests ajoutés par la QA. |
| `npm run typecheck` | Vérification TypeScript. |
| `npm run sim -- --list` | Liste des profils de joueurs. |
| `npm run sim -- --profiles=a,b --seeds=1-200 --hours=6 [--dt=0.1] [--events] --id=<nom>` | Campagne parallèle → `lab/results/<id>/` (`runs.jsonl`, `summary.json`, `summary.md`). |
| `npm run sim:guard -- <id-réf> <id-cand>` | **Décision avant/après** (`lab/metrics/guardrails.ts`) : refuse les campagnes incomparables (code 2), ROUGE = écart au-delà du seuil **et** \|z\| ≥ 3 (code 1). |
| `npm run sim:compare -- <ref.json> <cand.json>` | Affichage descriptif des écarts (aucun test de significativité) : ne pas l'utiliser pour décider. |
| `node --import ./lab/sim/register.mjs <script.ts>` | Exécuter un script TypeScript qui importe le moteur (`src/engine`) directement. |
| Playwright (`require('playwright')`, Chromium préinstallé) | Parcours navigateur sur `npm run dev` ou `npm run build && npm run preview`. |

Performances mesurées : 1 h de jeu ≈ 75–90 ms (dt 0,5 s, un cœur), 4 cœurs. 1 800 parties de 6 h ≈ 3–4 min.

**Limites connues de la simulation** (à citer dans les rapports) :
- `dt` par défaut 0,5 s (le jeu réel tourne à 0,1 s). Vérifier toute conclusion sensible avec `--dt=0.1`.
- Les profils sont des heuristiques, pas des joueurs réels ni des optimums prouvés.
- Sans `--events`, aucun événement mondial (ni Éclats d'événement).
- `echoShare` est une approximation (moyenne glissante du moteur) ; hors ligne, la part des Échos n'est pas mesurée.

Pour créer un nouveau profil ou une expérience, **ne pas modifier** `lab/sim/profiles.ts` en phase 1 : créer un script dans son propre dossier (`lab/profiles/`, `lab/balance/`…) qui importe `runGame` / `PROFILES` et ajoute ses profils (`PROFILES['mon-profil'] = …`).

## 4. Modèle de constat (obligatoire)

Chaque constat d'un rapport suit ce gabarit :

```markdown
### [ID] Titre court
- **Priorité** : Critique | Élevée | Moyenne | Faible | Amélioration facultative
- **Domaine** : …
- **Description** : …
- **Preuve / observation** : [MESURÉ|SIMULÉ|CODE|HYPOTHÈSE] … (commande, graines, fichier:ligne, chiffres)
- **Gravité** : … (ce qui casse ou se dégrade)
- **Impact sur l'expérience** : …
- **Probabilité que le problème soit réel** : Certaine | Forte | Moyenne | Faible — justification
- **Correction proposée** : …
- **Effets secondaires potentiels** : …
- **Méthode de vérification** : test ou campagne qui prouvera la correction (commande, seuil attendu)
```

Identifiants : `QA-01`, `GD-01`, `BAL-01`, `PBA-01`, `DATA-01`…

Grille de priorité :
- **Critique** : perte de sauvegarde, plantage, blocage de progression, triche qui casse le jeu partagé (Destin du jour, codes).
- **Élevée** : stratégie dominante qui rend une mécanique majeure inutile, bug fonctionnel visible, frustration systématique.
- **Moyenne** : déséquilibre net mais contournable, mécanique peu lisible, incohérence avec le GDD.
- **Faible** : cas limite rare, détail d'interface, texte.
- **Amélioration facultative** : idée sans problème objectif sous-jacent.

## 5. Structure d'un rapport

`audits/<AAAA-MM-JJ>/<agent>.md` :
1. Résumé (5 lignes max) et verdict global du domaine.
2. Périmètre et méthode (ce qui a été exécuté, ce qui ne l'a pas été).
3. Constats, triés par priorité.
4. Points forts (ce qui fonctionne et ne doit pas être cassé).
5. Questions ouvertes / mesures à faire.
6. Annexes : commandes, chemins des résultats.

## 6. Après validation (phase 4)

- Une seule modification logique par commit, sur sa propre branche de travail.
- `npm test` + `npx vitest run tests/qa` + campagne de référence relancée sur les mêmes graines.
- `npm run sim:guard` contre la référence en vigueur (voir `CLAUDE.md`) ; résultat consigné dans `lab/campaigns/CAMPAIGNS.md` et `lab/CHANGELOG-EQUILIBRAGE.md`.
- Retour arrière (`git revert`) si un indicateur de garde-fou sort de sa plage (voir `lab/metrics/KPIS.md`).
