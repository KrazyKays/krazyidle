# Backlog — Compagnonnage (double vocation)

> Statut : **conçu, non implémenté, non chiffré**. La refacto « vie active » qui devait la précéder est faite (0.7, `lab/design/REFACTO-vie-active.md`) : le Compagnonnage peut être chiffré. Rien ici n'a été simulé : toute valeur chiffrée reste à fixer à ce moment-là, selon le protocole habituel (`lab/PROTOCOLE.md`, critères fixés avant les mesures, `sim:guard`).
>
> Origine : discussion de design avec le propriétaire, 2026-11-26. Ce document consigne les décisions prises pour ne pas avoir à les réexpliquer.

## 1. Intention

Récompenser le **joueur actif**, celui qui pilote le personnage vivant et planifie sa vie, sans retirer le côté idle (le jeu continue de tourner en son absence). La double vocation est un **objectif de vie** que l'on vise : une vocation principale complète **et** un second métier pratiqué sérieusement.

Elle s'inscrit dans la refacto prévue : les Échos rapporteront moins, la vie en cours davantage. La récompense principale est donc **immédiate et pendant la vie**, l'Écho n'en garde qu'une trace.

## 2. Règles décidées [DÉCISION DU PROPRIÉTAIRE]

1. **Déblocage** : une amélioration d'Héritage ⚜️ de type « nouvelle fonctionnalité » (comme Alliances et Chroniques), placée en **milieu ou fin de partie**. Nom de travail : **Compagnonnage** (« Second métier » en alternative).
2. **Condition** : au cours d'une même vie, **50 % de la vie dans une activité** (la vocation, mécanique centrale, inchangée) **et 30 % dans une autre**.
   - Le seuil de **30 %** (et non 20 %) rend impossible d'avoir deux secondes vocations à la fois : 50 + 30 + 30 > 100. La vie se découpe en **50 / 30 / 20** (les 20 % restants sont libres : stocks, déblocages, ajustements).
   - **Pas de récompense à 30 % + 30 %** : elle ferait croire qu'une troisième activité à 30 % rapporte aussi quelque chose, et pourrait détourner le joueur des 50 % qui font monter sa vocation. La vocation reste la condition première.
   - Les pourcentages sont rapportés à la **durée de la vie** (comme `VOCATION_SHARE` aujourd'hui), le temps ne s'écoulant que pendant une activité.
3. **Symétrie** : la combinaison Vocation A + seconde vocation B produit **le même effet** que Vocation B + seconde vocation A. Avec 4 activités, il n'existe que **6 paires**.
4. **Récompense immédiate** : dès que la condition 50 % + 30 % est remplie, le héros reçoit **d'un coup une grosse quantité de ressources**, celles des **deux activités de la paire**. Une seule fois par vie.
5. **Hors ligne** : si la condition est atteinte pendant l'absence du joueur (rattrapage, `rt.offline`), la récompense est **accordée au retour** (récapitulatif de retour, pas d'annonce plein écran pendant le rattrapage).
6. **Boost passif** : ensuite, seul **l'Écho de ce héros** bénéficie d'un boost passif lié à la paire (piste : ses deux activités rejouées plus fort).
7. **Pas d'évolution, pas de transmission** : la seconde vocation n'a pas de rang, ne monte pas, ne se transmet pas aux héritiers (ni par une union ni par un code d'alliance). Seule la vocation principale garde ses règles actuelles (rang, transmission, déclin).

## 3. Les six paires (noms de travail)

Les noms servent à l'annonce (« Jehan devient Colporteur ! »), aux fiches du Codex et au titre affiché sur l'Écho. Aucun effet propre à une paire n'est retenu à ce stade : toutes suivent la même règle (ressources des deux activités, puis boost de l'Écho).

| Paire | Ressources | Nom de travail |
|---|---|---|
| Récolter + Commercer | 🌾 + 🪙 | Colporteur·euse |
| Commercer + Étudier | 🪙 + 📜 | Notaire |
| Récolter + Étudier | 🌾 + 📜 | Agronome |
| Récolter + Méditer | 🌾 + ✨ | Rebouteux·se |
| Commercer + Méditer | 🪙 + ✨ | Pèlerin·e |
| Étudier + Méditer | 📜 + ✨ | Alchimiste |

## 4. À calculer après la refacto (rien n'est fixé)

- **Prix** de l'amélioration d'Héritage. Repère indicatif : au-dessus d'Alliances (45 ⚜️) et de Chroniques (90 ⚜️) ; l'Héritage cumulé en 6 h vaut aujourd'hui ~2 000 à 4 000 ⚜️ selon le profil [SIMULÉ, T05], chiffre qui changera avec la refacto.
- **Montant de la récompense immédiate**. Pistes discutées, non retenues définitivement :
  - à l'échelle de l'économie du joueur (≈ N minutes de production habituelle), sur le modèle des paliers d'événements, plutôt qu'un montant fixe (les coûts sont exponentiels) ;
  - **hors multiplicateur d'événement** ou sur une fenêtre plus longue que les 60 s de `RATE_MEMORY_SEC` [CODE] : sinon former la paire pendant une Marée d'or (×3) triple le gain ;
  - **égal en valeur** entre paires (valeurs `RES_INFO` : Vivres 1, Or 2, Savoir 8, Essence 20), pas en quantité ;
  - éventuellement croissant avec le rang de la vocation principale, pour garder de l'intérêt en fin de partie.
- **Nature et force du boost passif de l'Écho** (et s'il se cumule entre plusieurs Échos de paires).
- **Faisabilité comparée des paires** [HYPOTHÈSE] : avec des Échos plus faibles, les stocks seront moins alimentés et les chaînes de consommation (Commercer consomme des Vivres, Étudier de l'Or) plus contraignantes. Une paire comme Étudier + Méditer dépend de l'Or en stock. À mesurer ; piste préférée : laisser les 20 % libres servir à préparer les stocks (habileté) plutôt que compenser les paires difficiles.
- **Part des vies qui remplissent déjà 50 % + 30 %** sans le viser, par profil (si elle est élevée, la récompense devient passive et le seuil est à revoir).

## 4 bis. Calibrage en cours (2026-11-26)

Mesures : `lab/balance/compagnonnage/RESULTATS.md` (C0 à C3), `lab/balance/etudier/RESULTATS.md` (E0).
- [SIMULÉ] Former une paire coûte −4 à −14 % d'Héritage à un joueur concentré : un lot de ressources ne le compense pas (l'Héritage
  vient de la production du héros), l'échange d'expérience (50 + 30 = 80 s pour les deux métiers) non plus (+0,3 à +1 point).
  Seul levier efficace mesuré : **Héritage de la vie ×k** (k ≈ 1,2), gain de la vie en cours. Le lot de ressources et l'échange
  d'expérience peuvent rester comme saveur de l'annonce.
- [DÉCISION DU PROPRIÉTAIRE] Étudier garde son identité (meilleur jeu ≈ 55 % Étudier / 45 % Commercer), sans avertissement :
  le **Notaire** (Commercer + Étudier) est la paire naturelle de l'Érudit et se forme presque sans effort. Son traitement (k réduit
  ou nul) reste à fixer.

## 5. Points de vigilance pour l'implémentation [CODE]

- **Sauvegarde** : champs optionnels (paire formée dans `LifeState`, paire de l'`Echo`), complétés ou ignorés dans `migrate()` (`save.ts`).
- **Vie en cours** : la condition est testée en continu pendant la vie (pas seulement à la mort) ; le drapeau « récompense déjà versée » est stocké dans la vie pour qu'un rechargement ne la redonne pas.
- **Hors ligne** : file de récompense à afficher au retour ; distinguer `rt.offline` (rattrapage) de `rt.online` (présence).
- **Interface** : second repère à 30 % sur la jauge de vocation (visible seulement une fois le Compagnonnage acheté) ; annonce à la formation ; fiche Codex à la première formation de chaque paire. Piste : un haut fait « Les six compagnonnages ».
- **Codes d'alliance** : la seconde vocation n'y figure pas (non transmise).
- **Destin du jour** (en réserve) : sans effet, il ne doit pas en dépendre.
- **Règles de travail** : une modification logique par commit, test de régression dans `tests/qa/regressions.test.ts`, revalidation à `--dt=0.1` (touche aux vocations et à l'équilibre entre activités), mise à jour de `docs/GAME_DESIGN.md` et de `lab/CHANGELOG-EQUILIBRAGE.md`.
