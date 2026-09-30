# Recette — Jalon 20 (2/3) : « Système de développement des villes (4/4) — les technologies de Recherche »

À jouer par Adrien. Objectif : confirmer que les technologies se
débloquent automatiquement à mesure que la Recherche progresse, et
qu'elles changent quelque chose à l'œil dans la ville.

```bash
npm run dev
```

## ⚠ Avant de tester : migration à appliquer

Colle `supabase/migrations/0029_jalon20_technologies.sql` dans
l'éditeur SQL de Supabase. Elle corrige au passage un bug du Jalon 20
(1/3) : la progression des mégaprojets affichée à un visiteur (pas
toi) était sous-comptée — voir `DECISIONS.md` §4 pour le détail.

## Ce qu'il faut juger

1. **Aucun choix à faire** : contrairement aux mégaprojets, les
   technologies se débloquent toutes seules dès que ta ville a assez
   de points de Recherche cumulés (100, puis 300, 800, 2 000, 5 000).
   Un nouveau bloc "Technologies" sur "Ma ville" et "Villes" liste
   celles déjà débloquées et la progression vers la prochaine.
2. **5 effets visuels, dans cet ordre** :
   - Éclairage LED (100 pts) : les lampadaires passent d'une lueur
     chaude à une teinte plus froide/blanche.
   - Panneaux solaires (300 pts) : petits panneaux sur le toit des
     immeubles (pas les tours, ni les maisons).
   - Tramway (800 pts) : rails et quelques rames sur les deux grandes
     avenues qui traversent la ville.
   - Toits végétalisés (2 000 pts) : une touche de vert sur le toit des
     immeubles.
   - Drones (5 000 pts) : quelques drones en vol au-dessus de la ville.
3. **Bulletin municipal** : chaque déblocage y apparaît.

## ⚠ Portée assumée

- **Aucun bonus numérique** pour cette première passe — le document
  disait "avec parfois un petit bonus" sans préciser lesquels ni
  combien ; purement visuel pour l'instant, comme la plupart des
  mégaprojets.
- **Rien au-delà du 5e palier** (10 000 points et plus) — je n'ai pas
  inventé d'effet supplémentaire, dis-moi si tu en veux.
- Effets **volontairement simples** (comme les mégaprojets 1/3) — je
  n'ai pas réussi à repérer les rails/panneaux/drones à l'œil dans mes
  propres essais (rendu nocturne, détails fins), seulement confirmés
  par un script de vérification. Dis-moi si tu ne les vois pas non
  plus une fois en jeu.

## Tests automatisés couvrant ce jalon

```bash
npm test
npm run test:e2e  # dont tests/e2e/jalon20-technologies.spec.ts
```

Sur cette machine, la suite complète est plus fiable avec
`npx playwright test --workers=1` qu'avec les 2 workers par défaut.
