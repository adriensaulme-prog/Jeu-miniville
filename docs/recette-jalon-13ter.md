# Recette — Jalon 13 ter : « Visite automatique »

À jouer par Adrien. Objectif : confirmer que tes trois retours de test
(panneau mobile, visite sans clic, auto-visite) sont bien pris en
compte.

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Sur mobile** (ou en réduisant la fenêtre du navigateur) : sur
   `/villes`, `/pays`, `/ville`, `/classement`, `/jumelages` ou
   `/palmares`, le panneau du bas a maintenant une petite poignée en
   haut. Tape dessus : le panneau se réduit à une bande fine, laissant
   voir la ville en 3D derrière. Tape à nouveau : il se rouvre.
2. **Ouvre n'importe quelle ville** (la tienne ou celle d'un autre
   joueur, depuis `/villes` ou via "Ma ville") : plus de bouton
   "Visiter" à cliquer. Après environ 2,5 secondes, un message
   « Visite comptée, +1 habitant. » apparaît brièvement, puis le
   compteur (`1/3`) et le compte à rebours (`Revisiter dans 60 min`)
   prennent le relais.
3. **Visiter ta propre ville compte désormais aussi** — même règle
   (délai d'une heure, jusqu'à 3 fois par jour). Une ville isolée sans
   aucun visiteur extérieur peut donc progresser, mais très lentement.

## ⚠ Points à trancher

- **Délai de 2,5 secondes avant de compter la visite**, choisi par
  moi comme tu l'avais délégué — dis-le si une ouverture accidentelle
  compte quand même trop souvent, ou si 2,5 s semble trop long/court.
- **Choix du thème à développer (§15 partie B)** toujours pas
  construit — reste derrière `docs/SYSTEME-DEVELOPPEMENT.md`, en
  attente de tes réponses là-bas.
- **Auto-visite : troisième déviation assumée du cahier des charges**
  (après le délai/plafond du Jalon 13 bis et l'assouplissement "zéro
  coût") — déjà confirmée par toi en amont.

## Tests automatisés couvrant ce jalon

```bash
npm test
npm run test:e2e  # dont tests/e2e/jalon13ter-visite-automatique.spec.ts
```

Sur cette machine, la suite complète est plus fiable avec
`npx playwright test --workers=1` qu'avec les 2 workers par défaut.
