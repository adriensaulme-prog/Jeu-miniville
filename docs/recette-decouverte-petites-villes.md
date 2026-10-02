# Recette — A-INTEGRER §26 E : découverte des petites villes neuves

À jouer par Adrien. **Migration `0040` appliquée.**

```bash
npm run dev
```

## Ce qu'il faut juger

1. Sur **Villes**, sous le filtre de pays, un nouveau sélecteur **« Trier
   les villes »** avec trois choix :
   - **Les plus peuplées** (le choix par défaut, comme avant) ;
   - **Villes récentes** : les villes créées le plus récemment en premier ;
   - **Qui attendent des visites** : les villes qui ont reçu le moins de
     visites ces 7 derniers jours en premier (à égalité, la plus récente
     d'abord). Ta propre ville n'y figure pas. Chaque ligne indique « n
     visite(s) / 7 j ».
2. Le tri se **combine** avec le filtre de pays et la recherche, et il
   est conservé quand tu ouvres une ville puis reviens à la liste.
3. Hors du tri par défaut, le numéro affiché à gauche d'une ville est son
   **rang mondial de population**, pas sa position dans la liste.

## À savoir avant de juger

- **C'est discret** : un joueur qui ne cherche pas le sélecteur ne verra
  pas les petites villes. Si tu veux plus visible (par exemple « 3 villes
  qui attendent une visite » sur **Ma ville**, ou un badge « nouvelle
  ville »), dis-le-moi.
- La fenêtre de 7 jours compte aujourd'hui et les 6 jours précédents.

## Tests automatisés couvrant ce chantier

```bash
npx vitest run tests/unit/triVilles.test.ts
npx playwright test tests/e2e/decouverte-petites-villes.spec.ts
```
