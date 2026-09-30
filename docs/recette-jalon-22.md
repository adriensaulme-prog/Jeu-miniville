# Recette — Jalon 22 : « Revoir les règles du jeu » — visites, influence, jumelages

À jouer par Adrien. Suite du Jalon 21 : les trois dernières mécaniques
de la grille (`DECISIONS.md` §10 point 22), traitées différemment
puisque ce sont des effets **positifs**.

```bash
npm run dev
```

## ⚠ Avant de tester : migration à appliquer

Colle `supabase/migrations/0033_jalon22_paliers_visites_influence_jumelages.sql`
dans l'éditeur SQL de Supabase.

## Ce qu'il faut juger

1. **Aucun plafond ajouté** : contrairement à AntiVille et à la guerre,
   une ville très visitée ou très influencée continue de grandir sans
   limite — visites (3/jour/joueur) et influence (5/jour/joueur) ont
   déjà des quotas par joueur, pas de plafond par ville cible à
   ajouter ici (choix validé avec toi avant de coder).
2. **Badge de popularité** sur `/ville` et `/villes` (panneau détail) :
   Calme → Fréquentée → Très fréquentée → En vogue → Virale, selon le
   nombre de visites reçues aujourd'hui, tous visiteurs confondus.
3. **Badge de renommée**, même principe pour les actions d'influence
   reçues : Calme → Respectée → Renommée → Célèbre → Légendaire.
4. **Badge de solidité d'un jumelage** sur `/jumelages` (et dans le
   panneau détail de `/villes`) : Naissant → Solide → Indéfectible →
   Légendaire, selon le nombre cumulé de jours où son bonus quotidien a
   déjà été accordé.
5. **Rien d'autre ne change** : les gains eux-mêmes (+1 population par
   visite, +1/+2 influence par action, +1 population de chaque côté par
   jumelage actif) sont exactement les mêmes qu'avant ce jalon.

## ⚠ Portée assumée

- **Seuils choisis par Claude Code, contestables** — cohérents avec les
  quotas déjà en place (3-5 actions/jour/joueur).
- Avec `DECISIONS.md` §10 point 22 maintenant entièrement résolu.

## Tests automatisés couvrant ce jalon

```bash
npm test
npm run test:e2e  # dont tests/e2e/jalon22-paliers-visites-influence-jumelages.spec.ts
```

Sur cette machine, la suite complète est plus fiable avec
`npx playwright test --workers=1` qu'avec les 2 workers par défaut.
