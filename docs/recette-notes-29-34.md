# Recette — notes §29 à §34 : présidence hebdomadaire, monuments dans la ville, AntiVille et visite

À jouer par Adrien. **Migrations `0045` et `0046` à appliquer** (dans cet ordre).

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Monuments dans la ville (§33)** : sur « Ma ville », ouvre le panneau
   Monuments et appuie sur « Voir où il est » : le monument est maintenant
   **dans la cour d'un bloc du centre** (deux par cour), plus à 450 m dans les
   champs. La fontaine de la cour est remplacée par les monuments. Pour en voir
   beaucoup, la ville de démonstration Zonaville a déjà 9 monuments. Énergie et
   mégaprojets restent dehors, comme avant.
2. **AntiVille et visite (§34)** : ouvre la page d'une ville pour l'attaquer.
   - Si tu touches au panneau AntiVille **avant** que la visite automatique se
     déclenche (2,5 s), elle est annulée pour cette page.
   - Si la visite est déjà comptée et que tu attaques **dans la minute**, elle
     est annulée : le message « Ta visite d'à l'instant sur cette ville est
     annulée… » s'affiche, ton compteur de visites du jour est rendu et les
     habitants gagnés sont repris.
   - Au-delà d'une minute, la visite reste comptée.
3. **Présidence à la semaine (§31)** : le président d'un pays ne change plus en
   cours de semaine, même si une autre ville passe devant (le badge
   « Président » en direct, lui, continue d'indiquer qui est n°1 à l'instant).
   La bascule se fait le **lundi à 00 h UTC** (2 h en France). Sur « Pays »,
   l'historique hebdomadaire montre le président de chaque semaine passée.

## À savoir avant de juger

- **« Dimanche 20 h » n'existe pas dans le jeu** : tu as choisi de garder la
  bascule du lundi 00 h UTC pour la présidence, le vote et la diplomatie.
- **Approximation** : le premier affichage de la semaine désigne le n°1 *à cet
  instant*, daté du lundi (l'ancien classement n'est pas archivé).
- **Les présidents actuels sont reconduits** pour la semaine en cours : rien ne
  change brusquement le jour de la migration.
- **La place de n°1 mondial** (journal, notifications) reste calculée en
  direct : le §31 ne parle que des pays. Dis-moi si tu veux l'aligner sur la
  semaine.
- **Visites d'avant la migration** : annulées sans reprise d'habitants (leur
  gain n'avait pas été enregistré).
- **Le bouton « Partager » des monuments est gardé**, comme tu l'as décidé.
- **La boutique (§30)** n'est pas codée : elle viendra avec le jalon « La
  boutique ».

## Tests automatisés couvrant ce chantier

```bash
npx vitest run tests/unit/monumentsVille.test.ts tests/unit/visites.test.ts
npx playwright test tests/e2e/presidence-hebdo-antiville-visite.spec.ts tests/e2e/jalon11-le-president-malgre-lui.spec.ts tests/e2e/journal-notifications.spec.ts tests/e2e/catalogue-monuments-voir-ou.spec.ts
```
