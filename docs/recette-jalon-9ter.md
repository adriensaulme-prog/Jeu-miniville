# Recette — Jalon 9 ter : « La carte du pays »

À jouer par Adrien. Objectif : juger si la carte remplace bien la ville
3D sur la page Pays, et si son style te plaît.

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Va sur `/pays`** : la ville en 3D a disparu, remplacée par une
   carte du pays découpée en régions, colorées plus ou moins fort selon
   leur population.
2. **Repère les pastilles** : un anneau rouge pour ta ville (si tu es
   dans ce pays), un cercle or pour la présidente, un petit cercle brun
   pour la ville la plus peuplée de chaque région.
3. **Clique une pastille** : ça doit t'emmener sur la ville
   correspondante (la tienne va directement sur Ma ville).
4. **Change de pays** avec le sélecteur : Allemagne, Suisse, Canada,
   États-Unis, Belgique ont aussi leurs régions réelles dessinées. Les
   autres pays (essaie un petit pays comme le Luxembourg) n'ont que
   leur contour, une seule couleur.
5. **Un tout petit territoire** (essaie Kiribati ou la Guadeloupe) :
   pas de carte du tout, juste le nom du pays affiché en grand — prévu
   ainsi pour les territoires trop petits pour une vraie carte.
6. **Toutes les autres pages** (Ma ville, Villes, Classement,
   Palmarès, Jumelages) gardent la ville en 3D comme avant, aucun
   changement.

## ⚠ Points laissés de côté, à trancher ou pas

- **Pas de scintillement nocturne** des grandes villes (prévu par ta
  proposition, mais pas fait ici — faute de temps, pas de blocage).
- **Pas de repères de jumelages** en bord de carte.
- **Cliquer une région** ne fait encore rien (seules les pastilles de
  villes sont cliquables).
- **5 régions d'outre-mer françaises et 2 États américains** (Rhode
  Island, Washington DC) n'apparaissent pas sur la carte — données
  sources incomplètes ou perdues en simplifiant. Les classements/votes
  de ces régions restent corrects, seule la carte ne les montre pas.
- **Titre de "gouverneur de région"** toujours pas tranché (point
  ouvert depuis le Jalon 8) — la pastille existe déjà (petit cercle
  brun), juste sans ce nom.

Tous ces points sont notés dans `DECISIONS.md` §10 point 28 — dis-moi
lesquels valent une seconde passe.

## Tests automatisés couvrant ce jalon

```bash
npm test          # dont tests/unit/couleurRegion.test.ts
npm run test:e2e  # dont tests/e2e/jalon9ter-carte-du-pays.spec.ts
```

Sur cette machine, la suite complète est plus fiable avec
`npx playwright test --workers=1` qu'avec les 2 workers par défaut.
