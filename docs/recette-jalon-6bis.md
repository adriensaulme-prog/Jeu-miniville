# Recette — Jalon 6bis : « Le rendu 3D »

À jouer par Adrien. Objectif : juger si le rendu 3D tient sa promesse —
« pas assez réaliste » était le verdict sur les essais 2D qui ont mené
à ce chantier, donc le vrai test ici, c'est ton œil.

Aucun réglage préalable : tout est déjà en place, y compris les 24
villes de test chargées au Jalon 6.

```bash
npm run dev
```

Ouvre `http://localhost:3000/ville` (ta ville, "Bonneuil-Matours").

## Ce qu'il faut juger

1. **Premier regard** — est-ce que ça ressemble à une vraie ville
   miniature (maisons, arbres, rues) ou est-ce que ça reste basique ?
   Comparé aux essais 2D précédents, est-ce le saut de réalisme espéré ?
2. **Glisse sur l'image** pour tourner la caméra, **Maj+glisse** pour la
   déplacer, **molette** (ou pincement sur tactile) pour zoomer — est-ce
   naturel et fluide ?
3. **L'heure réelle** — ta ville est en France : à l'heure où tu
   regardes, le ciel doit correspondre à l'heure qu'il est vraiment à
   Paris (jour, crépuscule doré, ou nuit avec fenêtres éclairées). Est-ce
   que ça se remarque, et est-ce que ça ajoute quelque chose ?
4. **Recharge la page plusieurs fois** — la ville doit être rigoureusement
   identique à chaque fois (mêmes maisons, mêmes arbres, au même endroit).
   C'est voulu : l'identité de ta ville ne doit jamais changer au hasard.
5. **Avec une ville plus grande** (demande-moi de te connecter avec un
   compte de test — par exemple Belval-sur-Loire, niveau Métropole,
   114 000 habitants) — les immeubles et le gratte-ciel en construction
   doivent apparaître. Est-ce que la progression Hameau → Métropole se
   sent satisfaisante à observer ?
6. **Performance** — est-ce fluide sur ton PC ? Et sur ton téléphone si
   tu peux tester (⚠ point ouvert ci-dessous, pas encore vérifié) ?

## ⚠ Points à trancher / encore ouverts

- **Fluidité sur mobile** (`DECISIONS.md` §10 point 13) — pas encore
  vérifiée. Teste sur ton téléphone si tu peux, et dis-moi si c'est
  laggy ou correct.
- **Pas de vue 3D des autres villes depuis `/villes`** — ce jalon
  couvrait explicitement "la page de ville affiche la ville en 3D" (la
  tienne). Voir la ville d'un autre joueur en 3D serait un ajout
  possible plus tard, pas oublié, juste pas fait ici — dis-moi si c'est
  quelque chose que tu veux prioriser.
- **Repli France si le pays n'a pas de géo renseignée** — concerne 3
  pays sur 250 seulement (territoires rares), la ville s'affiche quand
  même, juste sans l'heure réelle de son propre pays.

## Tests automatisés couvrant ce jalon

```bash
npm test          # tests unitaires, dont le rendu 3D
npm run test:e2e  # playwright.config.ts limite maintenant à 2 workers
                   # en parallèle (voir DECISIONS.md §4, Jalon 6bis) :
                   # /ville pèse ~150 Ko de JS rien que pour Three.js,
                   # et trop de requêtes simultanées dessus au premier
                   # chargement faisaient échouer les tests par pure
                   # charge, pas un vrai bug.
```
