# Recette — Jalon 20 (1/3) : « Système de développement des villes (4/4) — les mégaprojets du maire »

À jouer par Adrien. Objectif : confirmer que le maire peut choisir un
mégaprojet, que les visiteurs le financent, et qu'il apparaît une fois
construit.

```bash
npm run dev
```

## ⚠ Avant de tester : migration à appliquer

Ce jalon ajoute une nouvelle table (`megaprojets`) et deux colonnes sur
`cities` — colle `supabase/migrations/0028_jalon20_megaprojets.sql`
dans l'éditeur SQL de Supabase avant de tester.

## Ce qu'il faut juger

1. **Sur "Ma ville"** : dès que ta ville atteint 5 000 habitants
   (Bourg), un nouveau bloc "Mégaprojets" propose 3 bâtiments au
   choix (Grande école, Parc des sports, Marché couvert). Choisis-en
   un — le choix est définitif, plus de bouton pour changer d'avis.
2. **Financement** : une fois choisi, le chantier affiche 3 barres de
   progression (points de l'activité du thème, matériaux, revenus).
   Les matériaux viennent de toutes les visites Industrie de la ville
   (même avant le choix du mégaprojet), les revenus des visites
   Commerce, les points du thème seulement des visites après le choix.
3. **Construction** : une fois les 3 seuils atteints, le chantier passe
   à "Construit" (à ta prochaine visite de la page — vérification
   automatique, pas de bouton), un bâtiment simple apparaît dans la
   campagne juste à l'extérieur de la ville, et le bulletin municipal
   l'annonce.
4. **Sur "Villes"** (en visitant une autre ville) : le même bloc
   s'affiche en lecture seule — tu vois ce qui se construit et peux
   choisir l'activité du thème pour aider à le financer, mais tu ne
   peux pas choisir à la place du maire.
5. **4 mégaprojets ont un vrai effet une fois construits** (les autres
   sont pour l'instant juste décoratifs, comme prévu pour cette
   première passe) : Hôpital et Opéra réduisent de moitié l'effet
   d'une contamination/propagande reçue ; Centrale solaire augmente
   l'élan Énergie de 20 % ; Stade réduit de 25 % les pertes d'une
   manifestation.

## ⚠ Portée assumée

- **Bâtiments 3D volontairement simples** pour cette première passe
  (un socle + une silhouette + une couleur selon l'activité du thème)
  — pas encore le niveau de détail des maisons/quartiers, comme
  discuté avant de commencer.
- **Seuls 4 mégaprojets sur ~18 ont un bonus numérique** (ceux où le
  document donnait un chiffre exact). Les autres (Grande école, Parc
  des sports, Marché couvert, Zone logistique, Technopôle, Gare TGV,
  Parc éolien, Tour emblématique, Aéroport, Centre de recherche,
  Centrale, et le catalogue de la Mégapole) sont pour l'instant
  purement cosmétiques.
- **Catalogue de la Mégapole (250 000 hab.) et au-delà inventé** par
  Claude Code, comme tu l'avais autorisé : Grand stade, Centrale
  nouvelle génération, Siège international.

## Tests automatisés couvrant ce jalon

```bash
npm test
npm run test:e2e  # dont tests/e2e/jalon20-megaprojets.spec.ts
```

Sur cette machine, la suite complète est plus fiable avec
`npx playwright test --workers=1` qu'avec les 2 workers par défaut.
