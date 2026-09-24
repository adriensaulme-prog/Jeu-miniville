# Recette — Jalon 7 : « Un jeu agréable à regarder »

À jouer par Adrien. Objectif : juger si la refonte visuelle (panneaux
vitrés flottants, ville en 3D plein écran, panneau d'entrée
d'agglomération pour les noms de ville) tient la comparaison avec la
maquette (`docs/prototypes/maquette-ecrans.html`) — et si l'expérience
reste fluide et compréhensible malgré le changement.

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Premier regard, déconnecté** — `http://localhost:3000`. La ville en
   3D occupe tout l'écran derrière le panneau d'accueil. Est-ce que ça
   ressemble à la maquette ? Le bouton rouge, la police condensée des
   titres, tout ça te plaît-il tel quel ?
2. **Créer une ville de test** — le nom que tu tapes doit s'afficher en
   direct dans le panneau d'entrée d'agglomération (fond blanc, bord
   rouge), pendant que la ville derrière (une maison au croisement de
   deux routes) reste fixe. Change de pays : est-ce que ça a un sens
   pour toi que la ville-aperçu ne change pas (seul le nom compte à ce
   stade) ?
3. **Ma ville** — vérifie : ton rang dans ton pays ("3ᵉ de France") ou le
   badge "Président" si tu es la ville n°1 de ton pays, l'heure et le
   ciel réels de ton pays sous le nom, la barre de progression vers le
   stade suivant, tes 3 chiffres (population/influence/activité).
4. **Les villes** — la liste est maintenant triée par population avec un
   classement affiché. Clique une ville : elle s'affiche en 3D derrière
   le panneau qui apparaît à droite (ou en bas sur mobile), avec ses
   vraies actions (Visiter, Influencer, AntiVille, Jumelage) — teste-les,
   ce sont les mêmes règles qu'avant, juste reskinnées. Essaie aussi le
   filtre par pays et la recherche.
5. **Jumelages** — cartes au lieu de listes brutes ; vérifie que les 3
   états (actifs/reçues/envoyées) restent clairs.
6. **Mobile** — réduis la fenêtre (ou vraiment sur ton téléphone) :
   panneau unique en bas de l'écran, barre d'onglets en bas, retour "←
   Toutes les villes" pour sortir du détail d'une ville. Est-ce
   utilisable à une main ?
7. **Nuit/jour** — comme au Jalon 6bis, le ciel de chaque ville suit son
   heure réelle. Regarde à des heures différentes si tu peux, ou demande
   une ville dans un autre fuseau pour comparer.

## Volontairement absent de ce jalon (pas oublié — voir ci-dessous)

- **Le "Bulletin municipal"** (journal du jour) et le **lien de partage
  personnalisé** de la maquette : les deux demanderaient une vraie
  fonctionnalité qui n'existe pas encore (journal d'événements, invitation
  anonyme). Pas simulés en façade — voir `DECISIONS.md` §10 point 17 si tu
  veux qu'on les spécifie pour de vrai.
- **Le système de développement des villes** (7 activités, jauges, maire,
  mégaprojets) visible dans la maquette : c'est une proposition de game
  design **non validée**, volontairement pas codée. Voir
  `docs/SYSTEME-DEVELOPPEMENT.md` et `DECISIONS.md` §10 point 16.
- **La ville qui grandit sans limite au-delà de 40 000 habitants** :
  reportée au Jalon 7bis (changement purement technique du générateur
  3D).
- **Le classement complet** (page dédiée, mondial) : seul le nécessaire à
  l'affichage de ce jalon est là (tri + rang + Président) ; le reste est
  le Jalon 8 "Se classer".

## Bug trouvé et corrigé en cours de route

La page Villes ne montrait plus aucune ville ("Aucune ville ne
correspond.") pour tout le monde — une requête ambiguë côté base de
données (deux façons de relier `cities` et `users`) échouait
silencieusement. Corrigé ; voir `DECISIONS.md` §4, journal de ce jalon.

## Tests automatisés couvrant ce jalon

```bash
npm test          # 47 tests unitaires, dont les nouveaux modules
                   # purs (rang ordinal, ligne d'heure locale, barre
                   # de progression de stade)
npm run test:e2e  # 20 tests e2e — adaptés à la nouvelle page Villes
                   # (liste + panneau de détail au lieu d'un tableau)
```
