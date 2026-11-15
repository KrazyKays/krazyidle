# Historique des modifications de gameplay et d'équilibrage

Une entrée par modification appliquée (phase 4). Chaque entrée renvoie au constat d'audit, au commit, à la campagne de vérification et à la décision. Une modification rejetée par les garde-fous reste consignée avec son retour arrière.

| Date | Réf. feuille de route | Commit | Changement | Campagne réf. → cand. | `sim:guard` | Décision |
|---|---|---|---|---|---|---|
| 2026-11-15 | R1 (P1 : PBA-01, QA-06) | 880ef88 | `save()` n'avance plus `lastTick` ; tout écart > 5 s entre l'horloge et le dernier pas simulé est rattrapé par `simulateOffline(…, minSec = 5)` (sans événements) ; horloge de boucle recalée après rattrapage ; temps de la cérémonie d'ouverture exclu. Bilan hors ligne affiché seulement au-delà de 30 s. | Moteur inchangé avec les paramètres par défaut (simulation non concernée) | — | ✅ Gardé. [MESURÉ] `onglet-masque.cjs` : masqué +41,5 s / 42,1 s réelles (avant : +1,6 s / 47,1 s), gel +41,5 s / 41,5 s (avant : +6,6 s / 46,5 s) ; `parcours.cjs` 31/31 ; `npm test` 147 + 7 échecs attendus. |
| 2026-11-15 | R2 (P2 : QA-10) | *ce commit* | Drapeau `replacing` posé avant le rechargement dans `reset` et `replaceState` : `save()` (pagehide, visibilitychange, minuterie) ne réécrit plus l'ancienne partie. | Interface seule (simulation non concernée) | — | ✅ Gardé. [MESURÉ] `import-reset.cjs` : maison importée « Exportval » chargée, cérémonie d'ouverture après réinitialisation, 0 erreur JS (avant : échec) ; `parcours.cjs` 31/31 ; `npm test` vert. |
