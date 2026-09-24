# Recette — Jalon 8bis : « Les palmarès »

À jouer par Adrien. Objectif : juger si les sept classements annexes
sont lisibles et si le choix de période/échelle est clair.

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Nouvel onglet « Palmarès »** dans la barre de navigation, à côté de
   « Classement ». Ouvre-le.
2. **Sept boutons de classement** en haut : Plus forte croissance, Plus
   éprouvées, Plus influentes, Plus visitées, Plus attaquées, Joueurs
   les plus généreux, Plus beaux jumelages. Clique-les un par un : la
   liste doit changer, le bouton actif doit être surligné.
3. **Quatre périodes** (Aujourd'hui / Cette semaine / Ce mois / Depuis
   toujours) : sur ton compte réel (peu d'activité), « Aujourd'hui »
   affichera sûrement « Rien sur cette période pour l'instant » — normal,
   change de période pour voir apparaître des villes.
4. **Trois échelles** (Mondial / National / Régional), comme sur la
   page Classement.
5. **« Ma position »** : visite une autre ville aujourd'hui (page
   Villes), reviens sur Palmarès → « Plus forte croissance » →
   « Aujourd'hui » → **ta position ne doit rien afficher** (c'est la
   ville visitée qui gagne l'habitant, pas la tienne) ; va sur
   « Plus visitées » ou fais-toi visiter par quelqu'un d'autre pour te
   voir apparaître.
6. **Joueurs les plus généreux** : cette liste montre des **pseudos**,
   pas des noms de ville — normal, c'est un classement de joueurs.
7. **Plus beaux jumelages** : si tu as un jumelage actif et que vous
   avez été actifs tous les deux un jour récent, la paire doit
   apparaître avec le nombre de jours de bonus touchés.

## ⚠ Points à trancher

- **Pas de bilan journalier ni de `pg_cron`** — j'ai tranché seul
  (`DECISIONS.md` §4, journal du Jalon 8bis) : les classements sont
  calculés directement sur les journaux d'actions existants à chaque
  affichage, pas sur une table de bilans pré-calculée comme le
  proposait `docs/CLASSEMENTS.md`. Ça marche très bien à l'échelle
  actuelle (quelques dizaines de villes) ; si le jeu grossit beaucoup,
  ce sera à revoir.
- **Titre de gouverneur de région** (point 23) et **d'autres classements
  annexes en tête** (`docs/CLASSEMENTS.md` question 4) — toujours en
  attente de ta décision.
- **Fenêtres glissantes, pas mois calendaire** : "Ce mois" = les 30
  derniers jours à partir d'aujourd'hui, pas "depuis le 1ᵉʳ du mois".
  Dis-le si tu préfères un vrai mois calendaire.

## Tests automatisés couvrant ce jalon

```bash
npm test          # dont tests/unit/periodePalmares.test.ts
npm run test:e2e  # dont tests/e2e/jalon8bis-palmares.spec.ts : valeurs
                   # exactes (croissance, pertes, influence, générosité
                   # filtrée par la bonne région, jumelages), et la page
                   # qui change bien de filtre sans erreur
```
