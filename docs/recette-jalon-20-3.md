# Recette — Jalon 20 (3/3) : « Système de développement des villes (4/4) — les monuments d'influence »

À jouer par Adrien. Objectif : confirmer que les monuments se
débloquent automatiquement à mesure que le record d'influence de la
ville progresse. **Dernier sous-jalon du système de développement des
villes** — une fois validé, le chantier ouvert au Jalon 17 est terminé
côté code.

```bash
npm run dev
```

## ⚠ Avant de tester : migration à appliquer

Colle `supabase/migrations/0030_jalon20_monuments.sql` dans l'éditeur
SQL de Supabase.

## Ce qu'il faut juger

1. **Aucun choix à faire**, comme les technologies : dès que le
   **record** d'influence de ta ville (jamais le chiffre courant, qui
   peut baisser) franchit un des 16 paliers (10, 25, 50, 100, 250,
   500, 1 000, 2 500, 5 000, 10 000, 25 000, 50 000, 100 000, 250 000,
   500 000, 1 000 000), un nouveau monument apparaît automatiquement.
2. **Un nouveau bloc "Monuments"** sur "Ma ville" et "Villes" liste
   ceux déjà débloqués et la progression vers le prochain.
3. **Bâtiments modestes dans la campagne**, plus proches du centre-ville
   et plus petits que les mégaprojets (une borne, un buste, une petite
   arche) — pas des bâtiments civiques.
4. **Jamais retiré** : même si une attaque de propagande fait baisser
   ton influence, les monuments déjà débloqués restent.
5. **Bulletin municipal** : chaque déblocage y apparaît.

## ⚠ Portée assumée

- **Purement cosmétique**, comme demandé — aucun bonus de jeu.
- **Bâtiments 3D volontairement simples** (même philosophie que les
  mégaprojets et les technologies).
- **Risque de chevauchement un peu plus élevé que pour les
  mégaprojets** : les premiers monuments (10-50 d'influence, atteints
  très tôt) sont placés proches du centre, qui peut déjà être occupé
  par de vrais blocs pour une ville qui a grandi vite en population
  sans avoir beaucoup d'influence. Dis-moi si tu observes un
  chevauchement visible.

## Tests automatisés couvrant ce jalon

```bash
npm test
npm run test:e2e  # dont tests/e2e/jalon20-monuments.spec.ts
```

Sur cette machine, la suite complète est plus fiable avec
`npx playwright test --workers=1` qu'avec les 2 workers par défaut.
