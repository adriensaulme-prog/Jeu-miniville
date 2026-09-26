# Recette — Jalon 13 bis : « Revenir plus souvent »

À jouer par Adrien. Objectif : juger si le nouveau rythme de visite
(plusieurs fois par jour, avec délai) est clair et bien calibré.

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Sur `/villes`**, sélectionne une autre ville et clique « Visiter » :
   le compteur à côté (« 1/3 ») avance, et le bouton devient « Revisiter
   dans 60 min » (désactivé) au lieu de disparaître pour la journée.
2. **Attends que le délai soit écoulé** (ou demande-moi un compte de
   test pré-avancé dans le temps pour vérifier sans attendre une heure)
   pour revisiter la même ville une 2e puis une 3e fois — le compteur
   monte à « 2/3 » puis « 3/3 ».
3. **Une fois le plafond de 3 atteint**, le bouton devient « Quota
   atteint » (comme pour l'Influence), et la ville affiche le badge
   « Indisponible pour l'instant » dans la liste de gauche — que ce
   soit à cause du délai ou du plafond, le badge est le même.
4. **Influence et AntiVille ne changent pas** — toujours une fois par
   ville et par jour, comme avant. Dis-le si tu veux étendre le même
   principe à ces deux actions.

## ⚠ Points à trancher

- **Plafond de 3 visites par jour choisi par Claude Code** — "chiffre à
  déterminer" laissé par toi. Ajustable si trop bas ou trop haut à
  l'usage (voir `docs/DECISIONS.md` §4, journal du Jalon 13 bis pour le
  raisonnement).
- **Délai fixé à une heure**, conforme à ta demande.
- **Influence/AntiVille pas étendus** au même système (§10 point 32) —
  à trancher si l'objectif de rétention s'y prête aussi.
- **Déviation assumée du cahier des charges §3/§26** ("une fois par
  jour") — déjà confirmée par toi en amont, documentée dans
  `DECISIONS.md` §1 point 3 et §4.

## Tests automatisés couvrant ce jalon

```bash
npm test
npm run test:e2e  # dont tests/e2e/jalon13bis-revenir-plus-souvent.spec.ts
```

Sur cette machine, la suite complète est plus fiable avec
`npx playwright test --workers=1` qu'avec les 2 workers par défaut.
