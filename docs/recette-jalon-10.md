# Recette — Jalon 10 : « Voter pour son pays »

À jouer par Adrien. Objectif : juger si le vote hebdomadaire est clair
et si le résultat te semble juste.

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Va sur `/pays`** (lien « Mon pays » depuis Ma ville, ou l'onglet
   Pays). Une section « Vote hebdomadaire » apparaît, avec quatre
   boutons : Industrie, Technologie, Culture, Commerce.
2. **Vote** pour une catégorie. Le message « Tu as voté pour X »
   remplace les boutons — tu ne peux plus revoter cette semaine.
3. **Résultats de cette semaine** : le pourcentage de chaque catégorie,
   recalculé en direct sur les votes déjà reçus cette semaine (les
   tiens et ceux des autres joueurs de ton pays).
4. **Ressources nationales** : le total cumulé de chaque catégorie,
   depuis le tout premier vote — ce chiffre ne redescend jamais à
   zéro, contrairement aux résultats de la semaine.
5. **Change de pays** avec le sélecteur : les résultats et ressources
   de l'autre pays s'affichent, mais **pas de section de vote** — tu ne
   votes que pour ton propre pays.

## ⚠ Points à trancher

- **Aucun effet de gameplay codé pour les ressources nationales.** Le
  cahier des charges dit « vote hebdomadaire, résultat proportionnel,
  ressources nationales » mais ne précise nulle part ce que ces
  ressources font une fois accumulées. J'ai construit le vote et
  l'accumulation, sans inventer un bonus ou un usage. → à toi de
  trancher (bonus aux villes ? ressource pour les décisions
  diplomatiques des Jalons 12/13 ? autre chose ?) — voir
  `DECISIONS.md` §10 point 27.
- **Semaine = lundi à dimanche (heure UTC)**, pas calée sur ton fuseau
  personnel — même simplification que "jour" pour les visites depuis
  le Jalon 1.
- **« Résultat proportionnel aux votes »** interprété au sens le plus
  simple : chaque vote compte pour 1, le pourcentage affiché EST la
  répartition des votes. Pas de pondération (ex. par ancienneté du
  compte, activité du joueur...).

## Note technique (sans lien avec ce jalon)

Le serveur de développement laissé tourner longtemps à travers
plusieurs jalons finit par avoir un cache de compilation dégradé, ce
qui peut faire échouer les tests automatisés sur des pages qui
marchent très bien à l'œil (déjà observé aux Jalons 6bis, 7bis, 8bis, 9
et 10). Le redémarrer (`Ctrl+C` puis `npm run dev`) résout le problème
à chaque fois.

## Tests automatisés couvrant ce jalon

```bash
npm test          # dont tests/unit/semaineIso.test.ts
npm run test:e2e  # dont tests/e2e/jalon10-voter-pour-son-pays.spec.ts
```

Sur cette machine, la suite complète est plus fiable avec
`npx playwright test --workers=1` qu'avec les 2 workers par défaut.
