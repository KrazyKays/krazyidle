# ⏳ Échos de Lignée

**Un idle game dynastique où chaque vie devient un Écho éternel.**

🎮 **Jouer : https://krazykays.github.io/krazyidle/** (mobile et ordinateur, installable comme application)

Tu fondes une lignée. Chaque héros ne vit que quelques dizaines de secondes, pendant lesquelles tu choisis ses activités. À sa mort, sa vie est rejouée en boucle par un **Écho** qui continue de produire pour toi. Génération après génération, les boucles s'accumulent, les dons se transmettent dans le sang, et le Domaine doit rester en équilibre.

## Fonctionnalités

- 🌀 **Échos** : chaque vie enregistrée seconde par seconde est rejouée à l'infini.
- 🧬 **Génétique dynastique** : 24 traits et 5 raretés, mutations, vocations qui montent de rang de génération en génération.
- 🌳 **Écosystème vivant** : Flore, Gibier et Prédateurs (Lotka-Volterra). L'équilibre rapporte plus que la surexploitation.
- 🌠 **Événements mondiaux** toutes les 4 h, identiques pour tous les joueurs, avec export vers l'agenda.
- 🎲 **Destin du jour** : la même vie pour tout le monde et un score partageable **vérifiable par replay**.
- 👑 Arbre de Lignée (prestige), 7 bâtiments, Bazar céleste.
- 📱 PWA installable, jouable hors ligne, progression pendant l'absence, sauvegarde exportable.

## Développement

Node.js 24 ou plus récent.

```bash
npm install
npm run dev      # serveur de développement
npm test         # tests unitaires + bot d'équilibrage
npm run build    # build de production dans dist/
```

Chaque push sur `main` déclenche `.github/workflows/deploy.yml` (tests, build, déploiement sur GitHub Pages).

Conception détaillée et décisions du « conseil » de production : [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md).
