# Recette — Jalon 17 : « Système de développement des villes (1/4) — choix d'activité et jauges »

À jouer par Adrien. Objectif : confirmer que le choix d'activité, les
jauges et la recommandation du maire fonctionnent — **sans encore
aucun effet de jeu dessus** (pas de bonus, de malus, de manifestation :
ça viendra au Jalon 18).

```bash
npm run dev
```

## Ce qu'il faut juger

1. **La visite reste automatique** : ouvrir une ville (la tienne ou
   celle d'un autre joueur) compte toujours la population toute seule,
   sans rien cliquer, comme depuis le Jalon 13 ter.
2. **Après la visite** (le temps qu'elle se déclenche et que la page se
   rafraîchisse), un message reste affiché : "Activité choisie : 🏠
   Résidentiel" (ou une autre, tirée au sort). Un bouton "Changer"
   permet de la remplacer par une autre parmi celles débloquées pour le
   niveau de la ville (🏠 Résidentiel, 🌳 Loisirs pour un Hameau ; plus
   d'activités débloquées à mesure que la ville grandit —
   Commerce/Services dès 1 000 habitants, Industrie/Énergie dès 5 000,
   Recherche dès 15 000). Ce message reste affiché tant que la fenêtre
   de 5 minutes n'est pas passée, même après plusieurs rafraîchissements
   de la page.
3. **Les 7 jauges** s'affichent sur la page d'une ville (la tienne et
   celles des autres) avec un pourcentage et un état (Crise, Fragile,
   Équilibré, Point fort) — une ville neuve doit afficher toutes ses
   jauges à 100 % (équilibré).
4. **Sur "Ma ville"**, tu peux choisir une recommandation ("Le maire
   recommande : ...") dans un petit menu — elle doit s'afficher aux
   visiteurs quand ils regardent ta ville depuis `/villes`.
5. **Aucun effet visible sur le jeu** : pousser une jauge en crise ou
   en point fort ne doit rien changer d'autre que son propre affichage
   pour l'instant (pas de manifestation, pas de bonus/malus) — c'est
   normal, prévu pour le Jalon 18.

## ⚠ Points à trancher

- **Deux contradictions du document initial tranchées par toi** le
  27/09 (visite automatique + choix séparé plutôt que bloquant ;
  auto-visite normale plutôt qu'une "contribution de maire" séparée).
- **Fenêtre pour changer d'activité après coup** : 5 minutes après la
  visite, affichée en continu (pas un message qui disparaît tout
  seul). Dis-moi si 5 minutes te semble trop court ou trop long.

## Tests automatisés couvrant ce jalon

```bash
npm test
npm run test:e2e  # dont tests/e2e/jalon17-choisir-activite.spec.ts
```

Sur cette machine, la suite complète est plus fiable avec
`npx playwright test --workers=1` qu'avec les 2 workers par défaut.
