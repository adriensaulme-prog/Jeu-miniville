# Recette — Jalon 14 : « Rester dans la légalité »

À jouer par Adrien. Objectif : confirmer que le délai anti-rafale est
bien invisible en jeu normal, et prendre connaissance de l'audit.

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Rien ne doit avoir changé visuellement.** Ce jalon n'ajoute aucun
   bouton, aucun texte, aucune page. Joue normalement (Influencer,
   AntiVille) : tout doit se comporter exactement comme avant. Le délai
   d'une seconde entre deux actions du même type est conçu pour être
   imperceptible — le temps de cliquer, naviguer vers une autre ville
   et recliquer dépasse largement une seconde.
2. **L'audit** (`docs/DECISIONS.md` §4, journal de ce jalon) a passé en
   revue toutes les fonctions SQL du jeu : aucune anomalie trouvée,
   toutes valident déjà correctement côté serveur. Rien à corriger,
   juste une confirmation à lire si tu veux les détails.

## ⚠ Points à trancher

- **Délai anti-rafale fixé à 1 seconde**, choisi par Claude Code (comme
  délégué) — à ajuster si jamais un humain arrive à le déclencher en
  jeu normal (peu probable).
- **Multi-compte et créations massives de comptes : aucun nouveau
  signal technique** — décision que tu as prise en amont ("aucun signal
  technique, juste la règle"). La règle actuelle (un compte = un email
  vérifié = une ville) reste la seule protection. Si un abus réel
  apparaît un jour, ce sera un nouveau point à rouvrir avec toi.
- **Détection de comportements automatisés plus poussée** (analyse de
  fréquence, tableau de bord de signalement) volontairement pas faite
  pour ce jalon, comme tu l'as choisi.

## Tests automatisés couvrant ce jalon

```bash
npm test
npm run test:e2e  # dont tests/e2e/jalon14-rester-dans-la-legalite.spec.ts
```

Sur cette machine, la suite complète est plus fiable avec
`npx playwright test --workers=1` qu'avec les 2 workers par défaut.
