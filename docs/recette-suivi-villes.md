# Recette — A-INTEGRER §26 D : suivre des villes

À jouer par Adrien. **Migration `0041` appliquée.**

```bash
npm run dev
```

## Ce qu'il faut juger

1. Dans **Villes**, ouvre la ville d'un autre joueur : un bouton
   **« ☆ Suivre »** (devient « ★ Ne plus suivre »). Le même bouton existe
   sur la page publique de la ville (`…/v/<id>`) quand tu es connecté.
2. Le lien **« ★ Mes villes suivies (n) »** en haut du panneau de Villes
   ouvre la page **Villes suivies** : chaque ville avec sa population, son
   niveau, son **rang dans son pays et dans le monde** (badge Président si
   elle est 1ʳᵉ de son pays), et un bouton « Ne plus suivre ».
3. Dans la liste de Villes, les villes que tu suis ont une **★**.
4. **L'autre joueur n'est pas prévenu** et ne voit pas qui le suit.
5. Limite de **50 villes suivies** ; on ne peut pas suivre sa propre ville.

## À savoir avant de juger

- **Ce n'est pas une amitié** : pas de demande, pas d'acceptation, pas de
  réciprocité. C'est une liste de raccourcis personnelle. Si tu veux de
  vraies relations d'amis, dis-le-moi et on en fait une extension.
- **Pas d'onglet « Suivi » dans la barre du bas** (sept onglets ne
  tiennent pas sur un téléphone) : on y accède depuis Villes.
- **Pas de notification** quand une ville suivie progresse (c'est le
  chantier B) ni de fil d'activité (chantier A).

## Tests automatisés couvrant ce chantier

```bash
npx vitest run tests/unit/suivi.test.ts
npx playwright test tests/e2e/suivi-villes.spec.ts
```
