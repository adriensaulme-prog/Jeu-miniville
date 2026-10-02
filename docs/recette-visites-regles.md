# Recette — A-INTEGRER §27 : plafond de visites à 8, « +1 visite » + choix d'emblée, page des règles

À jouer par Adrien. **Migration `0039` appliquée** (c'est fait).

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Plafond à 8** : sur la page d'une ville (`/villes`) ou sur « Ma
   ville », le compteur de visites du jour affiche maintenant `x/8`. Avec
   toujours une heure à attendre entre deux visites de la même ville.
   Au 8ᵉ, « Quota atteint ».
2. **« +1 visite »** : quelques secondes après avoir ouvert une ville,
   le message « +1 visite · Visite comptée, +1 habitant » apparaît. Il
   reste ensuite affiché dans le panneau pendant les 5 minutes de la
   fenêtre de choix.
3. **Choix d'activité d'emblée** : juste en dessous, sans cliquer sur
   « Changer », la liste des activités disponibles est ouverte. Un choix
   explicite est définitif pour cette visite. Si tu quittes la page et
   reviens plus de 2 minutes après (mais moins de 5), la liste est
   repliée derrière « Changer ».
4. **Règles du jeu** : un lien discret « Règles » dans la barre du haut
   (à gauche du sélecteur FR/EN), lisible sans être connecté. La v1
   couvre le cœur de jeu (visites, activités et jauges, influence,
   AntiVille, jumelages) ; pays, guerre, mégaprojets et technologies sont
   annoncés pour plus tard. Le texte existe en français et en anglais.

## À savoir avant de juger

- **Effet d'équilibrage** : 8 visites au lieu de 3, c'est 2,7 fois plus
  de croissance possible par visiteur et par ville. Les paliers de
  popularité du Jalon 22 (visites reçues aujourd'hui) avaient été
  calibrés avant. **À relever ?** Dis-moi.
- **Les règles écrites sont à relire par toi** : j'ai repris les chiffres
  des migrations (influence 5/jour, AntiVille 3/jour, 3 jumelages
  actifs, fenêtre de 5 minutes). Si une phrase te paraît inexacte ou mal
  formulée, c'est `src/lib/game/regles.ts`.
- **Les 2 minutes de « choix d'emblée »** sont mon choix (la fenêtre de
  grâce serveur reste de 5 minutes) ; réglable dans
  `src/lib/game/visites.ts` (`DUREE_VISITE_FRAICHE_MS`).

## Tests automatisés couvrant ce chantier

```bash
npx vitest run tests/unit/visites.test.ts tests/unit/regles.test.ts
npx playwright test tests/e2e/visites-regles.spec.ts tests/e2e/jalon13bis-revenir-plus-souvent.spec.ts tests/e2e/jalon17-choisir-activite.spec.ts
```
