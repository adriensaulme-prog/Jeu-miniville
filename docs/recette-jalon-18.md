# Recette — Jalon 18 : « Système de développement des villes (2/4) — les effets de l'équilibre »

À jouer par Adrien. Objectif : confirmer que les bonus/crises des 7
activités, les manifestations et la nouvelle version d'AntiVille
fonctionnent comme prévu.

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Visiter une ville n'apporte plus toujours +1 habitant** : sur une
   ville dont une jauge (Résidentiel) est en crise (rouge, < 60 %), le
   message de confirmation peut dire « pas de nouvel habitant cette
   fois-ci » au lieu de « +1 population ». Sur une ville équilibrée,
   rien ne change.
2. **AntiVille a changé de comportement** : tu peux maintenant attaquer
   plusieurs fois de suite la même ville (plus de "protection
   anti-harcèlement" après 2 attaques) — seul le quota de 3
   actions/jour te limite. En contrepartie, chaque attaque isolée pèse
   très peu (quelques habitants ou points d'influence tout au plus) ;
   c'est une attaque massive et coordonnée par beaucoup de joueurs qui
   pèse vraiment. Le résultat affiché après une action montre la perte
   infligée (ou la durée de blocage pour une grève) et le **palier**
   de la ville visée (Calme, Incidents, Troubles, Émeutes, Crise,
   Ville sinistrée).
3. **Manifestations** : une ville avec plusieurs jauges dans le rouge
   peut, une fois par jour, "manifester" toute seule (perte de ~1 %
   des habitants) — visible dans le **bulletin municipal**, en bas du
   panneau d'une ville. Une ville équilibrée n'en a jamais.
4. **Solidarité** : après avoir été attaquée, choisis l'activité
   recommandée (affichée automatiquement) en visitant cette ville dans
   les 24h — la visite rapporte un habitant de plus que d'habitude.
5. **Bulletin municipal** : en bas du panneau d'une ville (la tienne et
   celles des autres), une liste des dernières manifestations et
   attaques reçues.

## ⚠ Points à trancher

- **Grève redéfinie par toi** le 27/09 (une échelle selon le nombre
  cumulé d'attaques du jour, ajustée par la taille de la ville) —
  chiffres délégués à moi pour relier tes trois exemples (1 action →
  1h, 5 → 2h, 20 → 5h) : dis-moi si le rythme te semble juste une fois
  testé.
- **Deux effets visuels pas construits, en points ouverts**
  (`DECISIONS.md` §10 points 34-35) : les gratte-ciel qui se figent en
  crise Énergie, et la fumée 3D / notification du pays aux paliers
  Émeutes/Crise. Le reste (les vrais effets de jeu) fonctionne déjà —
  dis-moi si ces deux-là valent la peine d'être construits maintenant.
- Les chiffres des effets progressifs (±50 %, ±60 %, etc.) sont ceux
  du document, à ajuster avec les villes de test si le rythme ne te
  convient pas.

## Tests automatisés couvrant ce jalon

```bash
npm test
npm run test:e2e  # dont tests/e2e/jalon18-effets-equilibre.spec.ts
```

Sur cette machine, la suite complète est plus fiable avec
`npx playwright test --workers=1` qu'avec les 2 workers par défaut.
