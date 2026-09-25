# Recette — Jalon 13 : « France contre Allemagne »

À jouer par Adrien. Objectif : juger si le vote pour/contre et le
conflit qui en découle sont clairs et cohérents.

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Sur `/pays`**, sous « Décision diplomatique », s'il y a une
   proposition en cours pour ton pays cette semaine, deux boutons
   « Pour » / « Contre » remplacent l'ancien bouton unique « Soutenir »
   du Jalon 12. Vote une fois : le message « Tu as voté **Pour**. » (ou
   Contre) apparaît à la place des boutons.
2. **En fin de semaine** (le lundi suivant, à la prochaine visite de
   `/pays`), la proposition de la semaine passée est résolue
   automatiquement à la majorité des votes exprimés. Si elle est
   adoptée *et* que la catégorie était « Rivalité », un conflit
   apparaît dans une nouvelle section « Conflit » : les deux pays, le
   statut (En cours / Terminé), et l'effort de chaque camp.
3. **L'effort de chaque camp est entièrement automatique** — pas de
   bouton à cliquer. Il se calcule à partir des stats déjà existantes du
   pays (activité des 7 derniers jours des villes membres + un bonus lié
   aux ressources nationales accumulées) et se met à jour à chaque
   visite de `/pays`. Au bout de 7 jours, le conflit se clôt
   automatiquement (à la prochaine visite de `/pays`, tous pays
   confondus) : le défenseur bénéficie d'un bonus de +50 % sur son
   effort avant comparaison, le résultat (nom du pays vainqueur, ou
   égalité) s'affiche. **Correction après-coup** : la première version
   de ce jalon ajoutait un bouton « Mobiliser » à cliquer chaque jour —
   retiré suite à ta note dans `docs/A-INTEGRER.md` §12, l'effort ne
   doit pas être une action citoyenne séparée.
4. **Le coût en ressources** du conflit (instantané des ressources
   nationales de l'attaquant au moment du déclenchement) s'affiche sous
   le conflit, si non vide — c'est informatif seulement, rien n'est
   réellement dépensé (point ouvert, voir ci-dessous).

## Pour tester sans attendre une vraie semaine

Le passage d'une semaine à l'autre (résolution de la décision, fin du
conflit à 7 jours) n'est pas simulable depuis l'interface — dis-le si
tu veux un compte de test pré-avancé dans le temps pour le vérifier à
l'œil toi-même ; en attendant, la suite e2e ci-dessous couvre ces
transitions directement en base.

## ⚠ Points à trancher

- **Coût en ressources purement informatif, jamais déduit** — voir
  `docs/DECISIONS.md` §10 point 30. Les ressources du Jalon 10 n'ont
  toujours pas de mécanisme de dépense ; en faire une vraie monnaie
  aurait été un jalon à part entière. Dis-le si tu veux un vrai coût
  déduit.
- **Bonus défensif fixé à 50 %** sans chiffre imposé par le cahier des
  charges — à ajuster si le balancing le demande.
- **Durée du conflit fixée à 7 jours à partir de sa résolution** (pas
  calée sur la semaine ISO).
- **Formule de l'effort national** : activité brute (somme, pas de
  plafond) + racine carrée des ressources nationales en bonus — voir
  `docs/DECISIONS.md` §10 point 31 pour le détail. "Avantages nationaux"
  type Défense (cahier des charges §13) n'existe pas encore comme
  système, volontairement pas inventé pour ce jalon.
- **Alliance / Paix / Embargo restent sans effet de gameplay** au-delà
  du vote pour/contre lui-même — seule la Rivalité déclenche quelque
  chose, comme demandé explicitement par le cahier des charges pour ce
  jalon.

## Tests automatisés couvrant ce jalon

```bash
npm test
npm run test:e2e  # dont tests/e2e/jalon13-france-contre-allemagne.spec.ts
```

Sur cette machine, la suite complète est plus fiable avec
`npx playwright test --workers=1` qu'avec les 2 workers par défaut.
