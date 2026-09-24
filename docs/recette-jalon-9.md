# Recette — Jalon 9 : « Naissance d'un pays »

À jouer par Adrien. Objectif : juger si la page pays donne une vue
utile et juste de ton pays.

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Depuis Ma ville**, en bas des informations de ta ville, clique
   « Mon pays : France → » (ou ton pays). Tu arrives sur `/pays`.
2. **Les quatre chiffres** : population totale, influence totale,
   activité moyenne, nombre de villes — tous agrégés à partir des
   vraies villes de ton pays.
3. **Villes principales** : les 10 plus grandes villes du pays, dans
   l'ordre, avec un lien vers chacune (sauf la tienne, qui mène
   directement à Ma ville).
4. **Change de pays** avec le sélecteur en haut : les chiffres et la
   liste doivent se mettre à jour pour le nouveau pays.
5. **« Voir toutes les villes de ce pays »** en bas de la liste : te
   renvoie vers la page Villes, déjà filtrée sur ce pays.
6. **Ta tuile « Activité » sur Ma ville** — elle affichait 0 depuis le
   début du jeu (bug jamais remarqué, corrigé par ce jalon). Visite une
   autre ville, influence-la ou lance une action AntiVille, reviens sur
   Ma ville : la tuile doit maintenant afficher au moins 1.

## ⚠ Points à trancher

- **Définition de « activité » choisie sans toi** (nombre de jours
  actifs sur les 7 derniers jours, 0 à 7) — à contester si tu avais une
  autre idée en tête. Voir `DECISIONS.md` §4, journal du Jalon 9.
- **Pas de classement des pays entre eux** dans ce jalon (déjà noté
  comme "plus tard" dans `docs/CLASSEMENTS.md` §3) — seulement ta
  propre vue d'un pays à la fois.
- **Fenêtre glissante de 7 jours**, pas une semaine calendaire — même
  logique que les périodes du Jalon 8bis.

## Incident rencontré en testant (sans lien avec ce jalon)

L'API d'authentification de Supabase a cessé de répondre en pleine
vérification (panne côté Supabase, pas du code) — la suite de tests a
viré au rouge sur des jalons anciens et inchangés le temps que ça
revienne. Réglé une fois le service revenu ; aucune conséquence sur le
jeu réel.

## Tests automatisés couvrant ce jalon

```bash
npm test          # 63 tests unitaires
npm run test:e2e  # dont tests/e2e/jalon9-naissance-dun-pays.spec.ts
```

Remarque technique : sur cette machine, la suite complète est plus
fiable avec `npx playwright test --workers=1` qu'avec les 2 workers par
défaut (occasionnellement des échecs de connexion sous charge, sans
lien avec le code — voir `DECISIONS.md` §4, journal du Jalon 9).
