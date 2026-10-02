# Recette — A-INTEGRER §25, sous-jalon 25b : zonage des quartiers

À jouer par Adrien. **Migration `0038` appliquée** (c'est fait).

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Une ville neuve ou presque** : fais monter sa population (outil de
   maquette autorisé : compte de test) et observe les blocs qui
   apparaissent. Les 5 premiers blocs, au centre, sont résidentiels et
   deviennent des gratte-ciels quand la ville grandit.
2. **Des quartiers lisibles** : les blocs commerce, industrie, loisirs,
   recherche et services se regroupent chacun dans leur coin (un
   « secteur » en part de camembert depuis le centre), au lieu d'être
   éparpillés au milieu des maisons. Le résidentiel garde l'autre moitié.
3. **Maisons en périphérie** : les blocs résidentiels les plus
   éloignés du centre n'ont jamais de gratte-ciel (au-delà de la
   24ᵉ case) — ils restent maisons et petits immeubles.
4. **Rien ne bouge** : une ville qui grandit n'a jamais un bloc déjà
   ouvert qui change de place ou de vocation.
5. **Villes existantes** : leurs blocs actuels restent exactement où ils
   sont ; seuls les blocs qui s'ouvrent à partir de maintenant suivent le
   zonage. Une vieille ville sera donc « mi-ancienne, mi-zonée » un
   moment.

## À savoir avant de juger

- **Orientation fixe** : la moitié résidentielle est toujours du même
  côté, pour toutes les villes. Dis-moi si tu préfères une rotation
  propre à chaque ville.
- **Un secteur peut rester vide** un moment si aucun bloc de cette
  activité n'est encore ouvert : c'est alors une friche arborée.
- **La limite de gratte-ciels (24ᵉ case)** est mon choix (le §25
  demandait des maisons « durablement » en périphérie) ; elle se règle
  dans `src/lib/ville3d/zonage.ts` (`TOURS_CASE_MAX`).

## Tests automatisés couvrant ce sous-jalon

```bash
npx vitest run tests/unit/ville3dZonage.test.ts
npx playwright test tests/e2e/zonage-quartiers.spec.ts tests/e2e/jalon19-quartiers.spec.ts
```
