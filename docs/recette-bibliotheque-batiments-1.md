# Recette — Bibliothèque de bâtiments (catalogue, bâtiments et mobilier urbain)

À jouer par Adrien. **Pas de migration cette fois** : purement
front-end/génération 3D, `npm run dev` suffit.

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Variété visible dans une vraie ville** : sur `/ville`, `/villes`
   ou l'accueil, les maisons/immeubles/tours ne se ressemblent plus
   toutes — 12 modèles de maisons, 9 d'immeubles, 5 de tours, tirés au
   hasard (mais toujours les mêmes pour une parcelle donnée). Les
   tours ont surtout besoin d'une grande ville pour se voir
   (`population_max` ≥ 15 000) — les villes de test ou une ville
   avancée les montrent déjà.
2. **Le showroom** (`localhost:3000/dev/showroom`, outil de dev, pas
   dans le jeu publié) : affiche tous les modèles côte à côte, avec un
   bouton jour/nuit. Rendu volontairement simplifié (pas les ombres ni
   les couleurs exactes du jeu) — juste pour juger les formes.
3. **Mobilier urbain** : un banc (ou deux) dans presque tous les parcs,
   un kiosque de temps en temps à la place ; la fontaine des cours
   intérieures a maintenant un petit jet d'eau ; un abribus apparaît
   parfois sur un trottoir. Petits éléments, pas toujours faciles à
   repérer sur une vue d'ensemble — zoomer sur un parc ou une cour aide.
4. **Portée proche de l'objectif du document** (`docs/BATIMENTS-ET-PACKS.md`
   §3 visait ~30 modèles de bâtiments) : 12+9+5 = 26 modèles de
   bâtiments. L'infrastructure (catalogue, showroom, tests) est prête :
   ajouter un modèle de plus est maintenant rapide.
5. **Rien d'autre ne change** : pas de thème/pack à choisir pour
   l'instant (ça viendra dans une prochaine passe), pas de nouveau
   bonus de jeu, les emplacements/tailles de parcelles sont identiques
   à avant.

## ⚠ Point technique à connaître

Contrairement à ce que demandait le document ("un nouveau modèle ne
doit jamais changer une ville déjà construite"), le choix retenu (tirage
par hachage stable, sans nouvelle table en base) n'offre pas une
garantie à 100 % : ajouter beaucoup de nouveaux modèles au catalogue
peut, rarement, faire changer l'apparence d'une parcelle déjà
construite. Tu avais confirmé que c'était acceptable (une ville peut
déjà changer d'apparence via les packs de thèmes) — détail complet
dans `docs/DECISIONS.md` §4.

## Tests automatisés couvrant ce jalon

```bash
npm test  # dont tests/unit/catalogue.test.ts et tests/unit/mobilierUrbain.test.ts
```

Pas de suite e2e dédiée (aucune donnée/action serveur nouvelle à
tester) — la suite e2e complète a été relancée pour confirmer l'absence
de régression sur le reste du jeu.
