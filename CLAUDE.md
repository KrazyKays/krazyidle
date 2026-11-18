# Échos de Lignée — guide pour les sessions Claude

Idle game dynastique (PWA) en TypeScript + Vite, sans framework. Tout le contenu, le code commenté, les commits et la documentation sont **en français**.

## Architecture

- `src/engine/` : moteur **pur et déterministe** (aucun DOM). `data.ts` centralise l'équilibrage ; `game.ts` (tick, Échos, succession, achats, hors-ligne, événements) ; `sim.ts` (activité, vie) ; `ecosystem.ts` (Domaine) ; `daily.ts` (Destin du jour : Commande du comté) ; `epithets.ts` (Chroniques) ; `alliances.ts` ; `save.ts`.
- `src/ui/` : DOM natif ; `nav.ts` (onglets, sous-onglets, pastilles) est pur et testé. `src/main.ts` : boucle (pas fixe de 0,1 s), sauvegarde, rattrapage du temps.
- `docs/GAME_DESIGN.md` : la spécification. La garder en accord avec le code (chiffres mesurés, pas supposés).
- `tests/` : Vitest (unitaires + bot d'équilibrage) ; `tests/qa/` : invariants, déterminisme, sauvegarde, hors-ligne, codes, et **régressions de chaque correction** (`regressions.test.ts`) ; `tests/qa/e2e/` : parcours Playwright, lancés à la main.
- `lab/` : outillage d'analyse (simulation, garde-fous, rapports). Voir `lab/PROTOCOLE.md`.
- `audits/<date>/` : rapports d'audit, confrontation, synthèse et feuille de route.

## Commandes

```bash
npm test                 # Vitest (tous les tests, dont tests/qa) — doit rester vert
npm run typecheck        # tsc (src + tests ; lab/ n'est pas vérifié)
npm run build            # build de production (dist/)
npm run sim -- --list    # profils de joueurs simulés
npm run sim -- --profiles=experimente,optimiseur --seeds=1-200 --hours=6 [--events] [--dt=0.1] --id=<ID>
npm run sim:guard -- <id-référence> <id-candidat>   # décision avant/après : code 1 = garde-fou rouge
# e2e (Chromium préinstallé) :
npm run build && npx vite preview --port 4173 --strictPort &
NODE_PATH=$(npm root -g) node tests/qa/e2e/parcours.cjs http://localhost:4173/   # aussi import-reset.cjs, onglet-masque.cjs, retours-ui.cjs
```

Les scripts TypeScript de `lab/` s'exécutent sous Node avec `node --import ./lab/sim/register.mjs <script.ts>` (ou `./lab/balance/register.mjs` pour les surcharges en mémoire `BAL_PATCH` / `BAL_OBJ`, qui ne touchent jamais les fichiers du jeu).

## Règles de travail sur le gameplay et l'équilibrage

1. **Une modification logique par commit**, avec son test de régression dans `tests/qa/regressions.test.ts`.
2. Tout changement qui touche la simulation : campagne sur les mêmes graines que la référence, puis `npm run sim:guard`. Un rouge = retour arrière (`git revert`) ou correction suivante explicitement motivée.
3. Fixer les critères de décision **avant** de regarder les résultats ; comparer plusieurs variantes en mémoire (`lab/balance/<réf>/`) avant de toucher au jeu.
4. Revalider à `--dt=0.1` (le pas réel du jeu) tout ce qui touche Chasse, Affût, Harmonie, vocations ou l'équilibre entre activités.
5. Consigner chaque modification dans `lab/CHANGELOG-EQUILIBRAGE.md` et chaque campagne dans `lab/campaigns/CAMPAIGNS.md`.
6. Étiqueter toute affirmation : [MESURÉ], [SIMULÉ] (profils automatiques, pas de vrais joueurs), [CODE], [HYPOTHÈSE].

## Pièges connus

- **Destin du jour (Commande du comté)** : rendements = `ACT` de base (sans bonus de progression). Toucher à `ACT`, à l'écosystème ou au moteur de vie change les commandes, les paliers et invalide les codes `EL2` déjà partagés : le dire, et recalibrer avec `lab/balance/commande/calibrage.ts`. La commande et l'Or sont calculés par un solveur au premier affichage du jour (~0,3 s sous Node, mis en cache). Les anciens codes `EL1` (Destin à points) sont refusés.
- **Sauvegardes** : ajouter un champ = le rendre optionnel ou le compléter dans `migrate()` (`save.ts`). L'import refuse une sauvegarde injouable (`isPlayable`), la sauvegarde locale n'est jamais écartée.
- `state.lastTick` n'est avancé que par `tick` : ne pas le toucher dans `save()` (sinon le temps passé onglet masqué est perdu).
- Les événements gardent l'ancienne règle de progression pour une fenêtre ouverte avant une mise à jour (`EventProgress.v`).
- Les données brutes de simulation (`lab/**/*.jsonl`) ne sont pas versionnées ; seuls les résumés le sont.

## Équipe d'analyse (sous-agents)

Cinq agents dans `.claude/agents/` : `qa-engineer`, `game-designer`, `game-balancer`, `player-behavior-analyst`, `game-data-analyst`. Protocole commun et gabarit de rapport : `lab/PROTOCOLE.md`.

Pour une nouvelle campagne d'audit : créer `.claude/AUDIT_LOCK` (le hook `.claude/hooks/audit-lock.mjs` interdit alors toute écriture sur `src/`, `public/`, configs et GDD), lancer les agents en parallèle sur un dossier `audits/<date>/`, confronter les divergences, synthétiser, puis supprimer le verrou après validation du propriétaire.

## Références de simulation actuelles (0.2.2 + prénoms + surnoms, 2026-11-17)

- Sans événements : `C092-reference-v4-sans-evenements` (9 profils × 200 graines × 6 h, dt 0,5).
- Avec événements : `C093-reference-v4-avec-evenements` (4 profils dont `evenementiel`).
- Résumés figés dans `lab/baselines/`. Les `runs.jsonl` nécessaires à `sim:guard` se régénèrent avec la commande consignée dans `CAMPAIGNS.md`. C090/C091 (0.2.2) ne correspondent plus au jeu depuis NOM-1 (prénoms) et GD-SURNOMS A.

Points ouverts (fin de l'audit du 2026-11-14) : `audits/2026-11-14/SYNTHESE.md`, § 10.
