# Recette — Jalon 21 : « Revoir les règles du jeu » appliqué à la guerre entre pays

À jouer par Adrien. Objectif : confirmer qu'un conflit pays a
désormais un effet concret, mais faible et progressif, sur la grille
déjà utilisée pour AntiVille (Jalon 18) — pas un couperet brutal à
J+7.

```bash
npm run dev
```

## ⚠ Avant de tester : migration à appliquer

Colle `supabase/migrations/0032_jalon_grille_guerre.sql` dans
l'éditeur SQL de Supabase.

## Ce qu'il faut juger

1. **Avant ce jalon, un conflit n'avait AUCUN effet** — juste un badge
   « en cours »/« terminé » à la fin des 7 jours. Maintenant, chaque
   jour du conflit, le camp qui domine (même formule qu'avant : bonus
   défensif ×1,5 pour le défenseur) inflige une perte de population
   **faible** (0,1 %) à chaque ville de l'adversaire.
2. **Plafond** : cette perte ne peut jamais dépasser 5 % de la
   population d'une ville sur toute la durée d'un conflit — même si le
   conflit dure longtemps ou que la page n'est pas ouverte tous les
   jours (voir point 4).
3. **Paliers visibles** sur `/pays` : un badge d'intensité (Calme →
   Tensions → Escarmouches → Conflit ouvert → Guerre totale → Victoire
   écrasante) selon le nombre de journées gagnées par le camp en tête,
   plus les compteurs « Journées gagnées (attaquant/défenseur) ».
4. **Le verdict final se base sur le cumul**, pas sur le dernier jour
   seul : un pays qui a dominé 5 jours sur 7 gagne la guerre même s'il
   perd la comparaison du 7e jour.
5. **Rattrapage** : la résolution n'est pas un cron, elle tourne à
   chaque affichage de `/pays`. Si personne ne va sur `/pays` pendant
   plusieurs jours, tous les jours manqués sont rattrapés d'un coup au
   prochain affichage (avec l'effort national du moment, pas un vrai
   historique jour par jour — simplification assumée, voir
   `DECISIONS.md` §4).
6. **Bulletin municipal** : chaque perte de population due à la guerre
   y apparaît, comme les autres événements.

## ⚠ Portée assumée

- **Chiffres choisis par Claude Code, contestables** : 0,1 % de perte
  par jour perdu, plafond de 5 % sur toute la durée du conflit — mêmes
  ordres de grandeur que la grille AntiVille (0,01 %/plafond 10 %),
  ajustés pour un rythme d'une seule "unité" par jour plutôt que des
  centaines d'attaques par jour.
- **Le reste de la grille (visites, influence, jumelages) n'est pas
  touché** — c'est le seul mécanisme qu'Adrien a choisi de revoir dans
  cette passe.

## Tests automatisés couvrant ce jalon

```bash
npm test
npm run test:e2e  # dont tests/e2e/jalon21-grille-guerre.spec.ts
```

Sur cette machine, la suite complète est plus fiable avec
`npx playwright test --workers=1` qu'avec les 2 workers par défaut.
