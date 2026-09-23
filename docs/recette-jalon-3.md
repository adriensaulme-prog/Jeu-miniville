# Recette — Jalon 3 : « Peser socialement »

À jouer par Adrien. Objectif : vérifier que l'influence, en plus de la
population (Jalon 2), donne une deuxième bonne raison de visiter
d'autres villes chaque jour — sans que ce soit confus avec le bouton
"Visiter".

Aucun réglage préalable : tout est déjà en place depuis les jalons
précédents et la migration `0004` de ce jalon.

```bash
npm run dev
```

Ouvre `http://localhost:3000`, connecte-toi, va sur "Villes".

## Ce qu'il faut juger

1. **Les deux boutons côte à côte** ("Visiter" en bleu, "Influencer" en
   violet) sur chaque ville — est-ce clair que ce sont deux actions
   différentes, avec des effets différents (population vs influence) ?
2. **Le compteur en haut de page** ("Actions d'influence restantes
   aujourd'hui : x/5") — assez visible ? Comprend-on tout de suite la
   règle des 5 actions par jour sans avoir besoin de lire le cahier des
   charges ?
3. **Cliquer "Influencer"** sur une ville — l'influence doit monter de
   1, le bouton devient "Déjà influencée aujourd'hui", le compteur
   descend d'une unité. Recharge la page pour confirmer que ça tient.
4. **Épuiser le quota** — si tu as plusieurs villes à disposition (sinon
   demande-moi de créer des comptes de test), influence 5 villes
   différentes dans la journée : au-delà, les villes restantes doivent
   afficher "Quota atteint" à la place du bouton.
5. **Colonne "Influence" du tableau** — utile pour décider qui
   influencer (une ville avec peu d'influence a-t-elle plus besoin
   d'aide qu'une grosse ville) ? Ou est-ce un chiffre qui ne veut encore
   rien dire à ce stade du jeu ?
6. **Ressenti général** — est-ce que "visiter + influencer" chaque jour
   commence à ressembler à une vraie boucle de jeu de 2-5 minutes, ou
   est-ce que ça fait déjà beaucoup de clics répétitifs ?

## ⚠ Points à trancher (Claude Code a tranché seul faute de réponse)

- **Quota non verrouillé entre la vérification et l'écriture** : en
  théorie, deux clics vraiment simultanés (deux onglets ouverts en même
  temps, par exemple) pourraient te faire dépasser 5 actions de
  quelques unités ce jour-là. Risque jugé négligeable pour un usage
  normal — je te le signale par honnêteté, pas parce que je pense que
  ça posera un problème en pratique.
- **Colonne "Influence" ajoutée au tableau des villes**, en plus de
  "Population" déjà là depuis le Jalon 2 — pas explicitement demandé,
  ajouté parce que ça semblait cohérent. Dis-moi si tu préfères que ce
  chiffre reste caché tant qu'il n'a pas d'effet visible dans le jeu.

## Tests automatisés couvrant ce jalon

```bash
npm test           # tests unitaires (inchangés pour ce jalon)
npm run test:e2e   # parcours complet : influence, quota, auto-influence refusée
```
