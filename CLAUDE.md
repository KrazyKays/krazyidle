# Échos de Lignée — guide pour les sessions Claude

Idle game dynastique (PWA) en TypeScript + Vite, sans framework. Tout le contenu, le code commenté, les commits et la documentation sont **en français**.

## Architecture

- `src/engine/` : moteur **pur et déterministe** (aucun DOM). `data.ts` centralise l'équilibrage ; `game.ts` (tick, Échos, succession, achats, hors-ligne, événements) ; `sim.ts` (activité, vie) ; `daily.ts` (Destin du jour : Commande du comté, **en réserve depuis la 0.6**, sans interface) ; `codex.ts` (nouveautés du Codex) ; `maison.ts` (titres de famille, blason gagné) ; `veillee.ts` (Veillée des ancêtres, appelée par l'UI seulement) ; `epithets.ts` (Chroniques) ; `evolution.ts` (dons qui mûrissent) ; `feats.ts` (Hauts faits) ; `alliances.ts` ; `save.ts`.
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

- **Destin du jour en réserve (0.6)** : plus de carte, d'astuce ni de pastille ; le Destin n'a qu'une page « Événements » (événement, Veillée, calendrier). Si on le reprend, ce qui suit s'applique.
- **Destin du jour (Commande du comté)** : rendements = `ACT` de base (sans bonus de progression). Toucher à `ACT`, aux modificateurs du jour ou au moteur de vie change les commandes et les paliers : recalibrer avec `lab/balance/commande/calibrage.ts`. Il n'y a plus de vérification de code (0.4) : le code `EL4` ne sert qu'au fantôme du record, stocké en local (les `EL1` à `EL3` ne se rejouent plus). Choix des codes : 0–3 = activités. **Depuis la 0.7** (consommation proportionnelle, Commercer et Étudier recalibrés), les commandes ne sont plus calibrées : recalibrer avant toute reprise. La commande et l'Or sont calculés par un solveur au premier affichage du jour (~0,3 s sous Node, mis en cache).
- **Plus de Domaine (0.5)** : Flore, Gibier, Harmonie, Garde forestier et consignes de Récolter sont retirés (SIMPLIF-1 à 5) ; l'identifiant de Récolter reste `cultiver` (sauvegardes). `migrate()` efface `eco`, `posture`, `life.post`, les statistiques d'Harmonie et rembourse le Garde forestier. Les conditions de dons et de surnoms lisent la lignée (usure du sang, parent, record), jamais la production. Ne pas confondre `rt.online` (présence, événements : coupé par le simulateur sans événements) et `rt.offline` (rattrapage).
- **Archives de la maison retirées** : plus de bâtiment ni de sous-onglet Archives ; `migrate()` rembourse leurs niveaux (`refundArchives`). La Mémoire n'a que les Échos (en 3 colonnes, elle quitte la barre d'onglets). `minGen` / `buildingOpen` restent disponibles pour un futur bâtiment. L'information de lignée (transmission, budget, usure exacte, seuils de record) reste réservée à des titres futurs : ne pas l'afficher d'office.
- **Codes d'alliance** : `AL2`, traits et vocation par identifiant (les `AL1` désignaient les rangs de la 0.3 et sont refusés). Retirer un trait ou une activité ne décale plus rien ; la migration des sauvegardes 0.3 est `mergeLandV04` (`save.ts`, sauvegarde v3).
- **Identité de la maison (0.6)** : tout est cosmétique et gagné (titres, partitions, écartelé d'alliance, bordures et devises de la Veillée) ; rien ne s'achète en Éclats sauf le changement d'emblème ou de couleur. La Veillée ne touche ni à la production ni à l'événement : le simulateur ne l'appelle pas. `codexSeen` est rempli à la migration pour qu'une ancienne sauvegarde ne signale pas tout son Codex. Thèmes de couleur : `THEMES` (`maison.ts`) + un bloc `:root[data-theme="…"]` par thème en fin de `style.css` ; toute nouvelle couleur d'interface passe par une variable (pas de `rgba(20, 17, 31, …)` en dur : un test le vérifie). `eventGolds` compte les ors par type d'événement (cosmétique).
- **Tutoriel (0.6)** : `src/ui/tuto.ts` (pur, testé) remplace les astuces d'`app.ts`. La première vie démarre en pause (`main.ts`) et le reste après rechargement tant que `flags.hint_start` n'est pas posé (`lifeWaitsForPlayer`). Le halo vise des sélecteurs (`data-act`, `data-tab`, `data-sub`, `data-bld`) : renommer une classe ou un attribut casse le halo sans erreur. Les e2e touchent Récolter après la cérémonie.
- **Vie active (0.7)** : le héros vivant fait 55 à 60 % de la production en ligne ; hors ligne, seuls les Échos produisent une fois le héros mort. Ne pas regonfler la Crypte (force de rejeu `ECHO_BASE`, plafonds de Mémoire du sang et de Crypte : 3 niveaux depuis la 0.7.2, part du héros 0,51–0,55) sans remesurer le débit actif / hors ligne (cible ×2 à ×3). La consommation est proportionnelle à la puissance (`consumeScaleFor`) : un bonus réservé à la production (bâtiment, surnom d'Écho via `prodBonus`) ne doit jamais multiplier la consommation, sinon une vie rejouée se déséquilibre.
- **Compagnonnage (0.7.1)** : `checkCompagnon` (appelé par `tick` après `lifeTick`) forme la paire une seule fois par vie (`life.comp`) ; l'Héritage ×k est appliqué dans `endLife`. Paires naturelles (Colporteur, Notaire) ×1,2, autres ×1,3 (`COMPAGNON_LEGACY*`, `data.ts`). Le boost de l'Écho passe par `echoActMult` (production seule). Les profils du simulateur **ne visent pas de paire** : les campagnes `sim:guard` mesurent l'effet sur un joueur qui ne s'en sert pas ; l'effet de la visée se mesure avec `lab/balance/compagnonnage/reel.ts`. Toucher aux rendements ou à `VOCATION_SHARE` : remesurer C5.
- **Sauvegardes** : ajouter un champ = le rendre optionnel ou le compléter dans `migrate()` (`save.ts`). L'import refuse une sauvegarde injouable (`isPlayable`), la sauvegarde locale n'est jamais écartée.
- `state.lastTick` n'est avancé que par `tick` : ne pas le toucher dans `save()` (sinon le temps passé onglet masqué est perdu).
- Les événements gardent l'ancienne règle de progression pour une fenêtre ouverte avant une mise à jour (`EventProgress.v`).
- Les données brutes de simulation (`lab/**/*.jsonl`) ne sont pas versionnées ; seuls les résumés le sont.

## Équipe d'analyse (sous-agents)

Cinq agents dans `.claude/agents/` : `qa-engineer`, `game-designer`, `game-balancer`, `player-behavior-analyst`, `game-data-analyst`. Protocole commun et gabarit de rapport : `lab/PROTOCOLE.md`.

Pour une nouvelle campagne d'audit : créer `.claude/AUDIT_LOCK` (le hook `.claude/hooks/audit-lock.mjs` interdit alors toute écriture sur `src/`, `public/`, configs et GDD), lancer les agents en parallèle sur un dossier `audits/<date>/`, confronter les divergences, synthétiser, puis supprimer le verrou après validation du propriétaire.

## Références de simulation actuelles (0.7.1 « Compagnonnage », 2026-11-26)

- 0.7.2 (Crypte à 3 niveaux) : `V072-crypte3-sans`, `V072-crypte3-avec`, `V072-crypte3-dt01` (références V071-ref-*). 0.7.1 : `V071-comp-sans`, `V071-comp-avec`, `V071-comp-dt01` (mêmes commandes que les V07-lot-*, `lab/campaigns/CAMPAIGNS.md`) ; résumés dans `lab/baselines/`. Les références V07 restent valables pour comparer la 0.7.

### 0.7 « La Vie active »

- Sans événements : `V07-lot-sans` (8 profils × 200 graines × 6 h, dt 0,5).
- Avec événements : `V07-lot-avec` (4 profils dont `evenementiel`). Pas fin : `V07-lot-dt01` (4 profils × 100 graines, dt 0,1).
- Résumés figés dans `lab/baselines/`. Les `runs.jsonl` nécessaires à `sim:guard` se régénèrent avec la commande consignée dans `CAMPAIGNS.md`. Les références T05-lot-* (0.5 et 0.6) ne correspondent plus au jeu (Échos affaiblis, consommation proportionnelle).
- Refacto « vie active » : `lab/design/REFACTO-vie-active.md` (décisions), `lab/balance/vie-active/RESULTATS.md` (variantes, critères). Indicateurs de décision : `lab/balance/vie-active/mesure.ts` (part du héros, débit actif / hors ligne).
- Simplification de la 0.5 : `lab/balance/simplif/RESULTATS.md` (compensation des rendements) ; inventaire des seuils et remplacements : `lab/design/SEUILS-inventaire.md` (§ 4 : mesures à lancer, § 5 : places réservées au contenu futur). Destin : `lab/balance/commande/resultats.md`.
- Indicateurs de rareté des traits : `node lab/balance/evo/kpi.mjs <runs.jsonl>` ; résultats du lot : `lab/balance/evo/RESULTATS.md`.

Points ouverts (fin de l'audit du 2026-11-14) : `audits/2026-11-14/SYNTHESE.md`, § 10.

Compagnonnage livré en 0.7.1 (`lab/design/BACKLOG-compagnonnage.md`, calibrage `lab/balance/compagnonnage/RESULTATS.md`). Chantier ouvert : **Récolter**, vocation AFK et dominante (`lab/design/CHANTIER-recolter.md`, aucune piste retenue).
