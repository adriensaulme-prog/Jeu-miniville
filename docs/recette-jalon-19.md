# Recette — Jalon 19 : « Système de développement des villes (3/4) — quartiers et bâtiments 3D »

À jouer par Adrien. Objectif : confirmer que les blocs d'une ville
prennent des vocations différentes et que les nouveaux bâtiments
apparaissent comme prévu.

```bash
npm run dev
```

## ⚠ Avant de tester : migration à appliquer

Ce jalon a été repris une fois après ton premier retour de test — colle
`supabase/migrations/0027_jalon19_correctif_choix_active_verrouille.sql`
dans l'éditeur SQL de Supabase avant de retester (0026 est déjà
appliquée). Sans elle, le choix d'activité reste modifiable plusieurs
fois (voir point 3 ci-dessous).

## Ce qu'il faut juger

1. **Les blocs d'une ville ne sont plus tous des maisons/immeubles.**
   À mesure qu'une ville s'agrandit, ses nouveaux blocs prennent une
   vocation différente (industrie, commerce, loisirs, services,
   recherche) selon l'activité la plus développée — reconnaissable à sa
   couleur et sa silhouette (entrepôt puis usine avec cheminée fumante
   pour l'Industrie, enseigne colorée puis parvis pour le Commerce,
   croix puis repère héliporté pour les Services, dôme puis second dôme
   et panneaux solaires pour la Recherche, stade pour les Loisirs). Le
   bloc central (le tout premier) reste toujours résidentiel, et au
   moins la moitié des blocs le restent aussi. Les villes de test
   Belval-sur-Loire et Neustadt-am-See (Métropoles) montrent tout le
   catalogue.
2. **L'Énergie n'a pas de bloc dans la ville** : elle apparaît dans la
   campagne autour, sous forme d'éoliennes (bien plus détaillées qu'au
   premier passage — mât à bande rouge/blanche, nacelle, balise) et de
   petites fermes de panneaux solaires, en plus grand nombre si tu
   visites souvent en choisissant Énergie. Une centrale (avec ses
   propres bâtiments et pylônes de raccordement) apparaît si l'activité
   est très développée — regarde loin dans la campagne, elles ne
   collent pas aux abords immédiats de la ville.
3. **Le choix d'activité est maintenant définitif** : une fois choisi
   explicitement (bouton "Changer" puis une activité), impossible d'en
   choisir une autre pour cette visite — le bouton "Changer" disparaît.
4. **Le gratte-ciel reste réservé au bloc résidentiel central** : les
   blocs de quartier n'en construisent jamais, cet emplacement reste un
   petit square.

## Historique

Premier passage (deux étapes par vocation) jugé insuffisant après ton
test en ligne — repris le jour même avec un niveau de détail à trois
paliers (simple / développée / grand complexe), dans l'esprit des
maisons (plusieurs éléments tirés au sort, pas une géométrie
grossie). Détail dans `DECISIONS.md` §4, journal du Jalon 19.

## Tests automatisés couvrant ce jalon

```bash
npm test
npm run test:e2e  # dont tests/e2e/jalon19-quartiers.spec.ts et jalon17-choisir-activite.spec.ts
```

Sur cette machine, la suite complète est plus fiable avec
`npx playwright test --workers=1` qu'avec les 2 workers par défaut.
