# Recette — A-INTEGRER §26 F : guide de démarrage des nouveaux joueurs

À jouer par Adrien. **Aucune migration.**

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Crée un compte neuf** (ou ouvre une fenêtre de navigation privée avec
   un compte récent). Dès « Ma ville », une carte « Guide de démarrage ·
   1/5 » apparaît en haut, sans bloquer le reste.
2. **Les 5 étapes** : ta ville → visiter (lien « Aller aux Villes ») →
   choisir une activité → influencer / jumeler / AntiVille → le pays et les
   règles (lien « Lire les règles »). « Suivant » avance, « Passer le
   guide » l'arrête pour de bon, « Terminer » à la dernière.
3. **Il te suit** : la carte reste à la même étape quand tu changes
   d'onglet ou que tu recharges la page.
4. **Il ne dérange pas ailleurs** : jamais sur l'accueil, la connexion, la
   création de ville, ni la page des règles.
5. **Revoir le guide** : en bas de la page « Règles » (lien en haut à
   côté de FR/EN), un bouton relance le guide à l'étape 1. C'est aussi
   le seul moyen de le lire pour un compte de plus de 14 jours.
6. **Mobile** : la carte s'affiche en haut de l'écran, les panneaux restent
   en bas.

## À savoir avant de juger

- **Passif** : la carte avance quand tu cliques sur « Suivant », pas quand
  tu fais vraiment l'action (première visite, premier choix d'activité).
  Une v2 pourrait suivre tes vraies actions si ça te paraît trop
  scolaire — dis-le-moi.
- **Mémoire dans le navigateur** (pas dans ton compte) : un joueur qui
  change de téléphone ou vide son navigateur revoit le guide. Ça évite
  une migration ; on peut le stocker en base si tu préfères.
- **14 jours** : durée pendant laquelle un compte est considéré comme
  nouveau (réglable dans `src/lib/game/guide.ts`).
- Les textes (FR et EN) sont dans `src/lib/i18n/dictionaries.ts`
  (clés `guide.*`) ; à relire, c'est du texte joueur.

## Tests automatisés couvrant ce chantier

```bash
npx vitest run tests/unit/guide.test.ts
npx playwright test tests/e2e/guide-decouverte.spec.ts
```
