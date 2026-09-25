# Recette — Jalon 11 : « Le président malgré lui »

À jouer par Adrien. Objectif : juger si le président et son historique
sont clairs.

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Va sur `/pays`** (ton pays). Si ta ville est n°1 (rare, sauf sur
   une ville de test boostée), tu verras « Président · [ta ville] ·
   depuis [date] » juste sous le sélecteur de pays.
2. **Regarde l'historique** en bas de page — « Historique des
   présidents ». La ville actuellement en tête porte un badge
   « en cours » ; les mandats terminés affichent leurs deux dates.
3. **Passe sur un autre pays** avec le sélecteur (ex. Allemagne,
   villes de test) : tu dois y voir un président et son historique
   propres à ce pays.
4. **Le badge « Président »** que tu connais déjà (sur Ma ville et la
   page Villes depuis le Jalon 7) ne change pas de comportement — il
   reste calculé en direct, toujours exact, même sans repasser par
   `/pays`.

## ⚠ Points à trancher

- **Aucun pouvoir particulier pour le président** — le cahier des
  charges ne prévoit pour l'instant qu'un badge et un historique, pas
  d'effet de jeu. Rien codé au-delà.
- **Départage à population strictement égale** : la ville la plus
  ancienne reste présidente. Simple et stable, mais à confirmer si tu
  préfères une autre règle.

## Note technique (sans lien avec ce jalon)

Même remarque qu'aux jalons précédents : si des tests échouent sur des
pages qui marchent très bien à l'œil, redémarre le serveur de
développement (`Ctrl+C` puis `npm run dev`) — un cache de compilation
qui traîne trop longtemps finit par perturber les tests automatisés.

## Tests automatisés couvrant ce jalon

```bash
npm test
npm run test:e2e  # dont tests/e2e/jalon11-le-president-malgre-lui.spec.ts
```

Sur cette machine, la suite complète est plus fiable avec
`npx playwright test --workers=1` qu'avec les 2 workers par défaut.
