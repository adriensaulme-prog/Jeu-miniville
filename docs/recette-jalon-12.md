# Recette — Jalon 12 : « Décider à l'international »

À jouer par Adrien. Objectif : juger si la proposition présidentielle
et le soutien citoyen sont clairs.

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Si ta ville n'est pas présidente de ton pays**, va sur `/pays` :
   pas de formulaire de proposition (seule la présidente en exercice
   peut proposer), mais tu peux voir et soutenir une proposition déjà
   faite si elle existe.
2. **Si ta ville est présidente** (rare en conditions réelles — utilise
   une ville de test boostée pour tester), un formulaire apparaît sous
   « Décision diplomatique » : choisis un pays cible et une catégorie
   (Alliance / Paix / Rivalité / Embargo), clique Proposer.
3. **Une fois proposée**, la carte montre la catégorie et le pays
   cible, avec le nombre de soutiens. Un bouton « Soutenir » permet à
   n'importe quel citoyen (toi y compris) de la soutenir, une fois par
   semaine.
4. **Change de pays** avec le sélecteur : tu peux voir la proposition
   des autres pays (en lecture seule), mais pas la soutenir — on ne
   soutient que la proposition de son propre pays.

## ⚠ Points à trancher

- **Aucun effet de gameplay codé pour ces décisions.** Soutenir une
  « Rivalité » avec l'Allemagne ne change rien de concret dans le jeu
  pour l'instant — ce jalon construit juste la proposition et le
  soutien. Le Jalon 13 (« France contre Allemagne ») est prévu pour
  donner un sens réel à ces catégories.
- **Pas de vote de rejet** — soutenir est le seul acte possible, il n'y
  a pas de bouton « je suis contre ». Dis-le si tu veux un moyen de
  s'opposer explicitement.
- **Une seule proposition par semaine et par pays**, choisie
  uniquement par la présidente en exercice — comme convenu ensemble
  avant de coder ce jalon.

## Tests automatisés couvrant ce jalon

```bash
npm test
npm run test:e2e  # dont tests/e2e/jalon12-decider-a-linternational.spec.ts
```

Sur cette machine, la suite complète est plus fiable avec
`npx playwright test --workers=1` qu'avec les 2 workers par défaut.
