# Recette — A-INTEGRER §25, sous-jalon 25a : catalogue des monuments, « Voir où il est », secteurs hors de la ville

À jouer par Adrien. **Aucune migration à appliquer** pour ce sous-jalon.

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Sur « Ma ville »**, dans le panneau de gauche tout en bas : la
   rubrique **Monuments · N/16** (cliquer pour déplier). Elle liste les
   16 monuments : ✓ pour ceux que ta ville a débloqués, 🔒 grisés pour
   les autres avec le seuil d'influence à atteindre (le prochain montre
   aussi ta progression, par exemple « 300 / 500 d'influence »).
2. **« Voir où il est »** à droite de chaque monument débloqué : la
   caméra glisse vers lui (moins d'une seconde) et un **anneau jaune qui
   pulse + une colonne lumineuse** s'y posent pendant 10 secondes. Les
   monuments sont petits (quelques mètres de haut pour des blocs de
   64 m) : c'est le repère lumineux qui les rend trouvables. Dis-moi si
   tu veux les agrandir ou les rendre plus hauts.
3. **Sur mobile** : le panneau flottant se replie tout seul quand tu
   appuies sur « Voir où il est », sinon il cacherait la cible. Tu le
   rouvres avec la poignée.
4. **Reprise en main** : si tu touches la scène (glisser, molette,
   pincement) pendant que la caméra voyage, elle s'arrête et te laisse
   la main.
5. **Secteurs fixes** : tout ce qui est hors de la ville a maintenant sa
   zone, la même pour toutes les villes — **Énergie** (éoliennes,
   panneaux solaires, centrale) d'un côté, **mégaprojets** d'un autre,
   **monuments** du troisième, tous au-delà de la ville la plus grande
   qu'on dessine. Plus d'angle aléatoire : pour retrouver quelque chose,
   « Voir où il est » (monuments) ou dézoomer du bon côté.
6. **Sur « Villes »** (la ville d'un autre joueur) : le même catalogue
   s'affiche, avec les monuments de CETTE ville.

## À savoir avant de juger

- **Un déplacement unique** : les éoliennes, mégaprojets et monuments
  de tes villes déjà existantes changent de place une seule fois (ils
  quittent leur ancien angle aléatoire pour leur secteur). Ils ne
  bougeront plus ensuite.
- **Les monuments étaient dans la ville** avant ce correctif (à 141 m
  du centre sur une diagonale, alors que la ville fait 168 m de rayon
  dès « Ville ») : c'est en partie pour cela que tu ne les voyais pas.
- **Un bug de rendu corrigé au passage** : la ville entière disparaissait
  dès qu'on déplaçait la caméra loin du centre (le centre du monde
  sortait du champ). On ne le voyait pas car le déplacement manuel était
  borné près de la ville. Tu peux maintenant te déplacer jusqu'à 1100 m
  du centre (Maj + glisser, ou deux doigts).
- **Le brouillard recule un peu** pour les petites villes (il démarrait
  trop près des monuments). Purement visuel.
- **Pas encore fait** : « Voir où il est » pour les mégaprojets, les
  installations d'Énergie et les technologies (le §25 disait « plus tard
  si Adrien le souhaite »). Les positions existent, c'est un bouton à
  ajouter. Et **le zonage des blocs (sous-jalon 25b)** : gratte-ciels au
  centre, maisons en périphérie — on en parle avant que je le code.

## Tests automatisés couvrant ce sous-jalon

```bash
npx vitest run tests/unit/ville3dEmplacements.test.ts
npx playwright test tests/e2e/catalogue-monuments-voir-ou.spec.ts
```
