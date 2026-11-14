# Référentiel des indicateurs d'équilibrage (v0, Technical Lead)

Version initiale posée avant l'audit. Le Game Data Analyst la complète (définitions, plages cibles, garde-fous).
Source : champs de `RunResult` (`lab/sim/runner.ts`), agrégés par `lab/sim/stats.ts`. Toutes les valeurs sont **[SIMULÉES]**.

| KPI | Champ | Définition | Pourquoi (GDD) | Plage cible / garde-fou |
|---|---|---|---|---|
| Générations | `gen` | Génération du héros en fin de partie | Tempo dynastique | à définir |
| Héritage total | `legacyTotal` | ⚜️ gagnés au total | Boucle longue | à définir |
| Valeur produite | `log10Value` | log10 Σ (totalEver × valeur de la ressource) | Puissance économique | à définir |
| Valeur par heure | `hourly[].log10Value` | Courbe de progression | Rythme, plateaux | croissance monotone, sans mur |
| Part des Échos | `echoShare` | Part de la production (valeur) venant des Échos (approximation) | Pilier 1 « chaque vie compte » | à définir |
| Harmonie moyenne / min | `harmonyAvg`, `harmonyMin` | ecoHealth moyen et minimal | « l'optimum n'est pas le maximum » | à définir |
| Délais de déblocage | `unlockAt.*` | Secondes avant Commercer / Étudier / Méditer | Onboarding | à définir |
| Achat d'Alliances / Chroniques | `upgradeAt.alliances`, `upgradeAt.chroniques` | Secondes avant l'achat | Accès aux systèmes de fin de partie | à définir |
| Répartition des activités | `heroActShare.*`, `echoActShare.*` | Temps héros / secondes d'Échos par activité | Viabilité de chaque vocation | aucune activité dominante écrasante |
| Écart entre stratégies | ratio de `log10Value` entre profils mono-activité | Comparaison des vocations | « Chasseur viable » (GDD 2.4) | à définir |
| Diversité génétique | `traitCombos60`, `traitFreq60` | Combinaisons distinctes chez les 60 derniers ancêtres | Budget génétique (GDD 2.3 : 27–30 mesurés) | à définir |
| Surnoms | `epithetsFound`, `epithetLives` | Surnoms découverts / vies surnommées | Chroniques (GDD 2.6 : ~50 % des vies) | à définir |
| Événements | `eventsDone`, `eclatsEnd` | Événements complétés, Éclats restants | Boucle sociale | à définir |
| Pause | `pausedShare` | Part du temps de vie en pause | Mécanique de pause | à définir |
| Anomalies | `anomalies` | NaN, Infinity, valeurs négatives | Robustesse | **0 obligatoire** |
