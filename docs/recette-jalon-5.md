# Recette — Jalon 5 : « Villes jumelles »

À jouer par Adrien. Objectif : vérifier que proposer/accepter un
jumelage est clair, et que le bonus quotidien donne envie d'avoir des
"vrais" partenaires de jeu plutôt que de juste accumuler des jumelages.

**Comme au Jalon 4**, le nombre de jumelages actifs (3) a été tranché
par moi sur ta délégation explicite — voir "Points à trancher" plus
bas.

Aucun réglage préalable : tout est déjà en place.

```bash
npm run dev
```

Ouvre `http://localhost:3000`, connecte-toi, va sur "Villes".

## Ce qu'il faut juger

1. **Le bouton "Proposer un jumelage"** (vert) à côté des autres
   actions — assez visible sans être confondu avec Visiter/Influencer ?
2. **Propose un jumelage** à une ville (demande-moi un 2e compte de
   test si besoin) — le bouton doit devenir "Déjà jumelée".
3. **Va sur "Jumelages"** (nouveau lien dans la barre du haut) — ta
   demande doit apparaître dans "Demandes envoyées", avec un bouton
   "Annuler".
4. **Avec le 2e compte, sur `/jumelages`** — la demande doit apparaître
   dans "Demandes reçues", avec "Accepter"/"Refuser". Accepte-la — elle
   doit passer dans "Jumelages actifs" pour les deux comptes.
5. **Le bonus quotidien** — pour le voir, il faut que les deux joueurs
   fassent au moins une action (visiter, influencer, ou lancer une
   action AntiVille) le même jour, PUIS recharger `/ville` ou
   `/jumelages`. Un message vert "Bonus de jumelage accordé
   aujourd'hui..." doit apparaître, et la population des deux villes
   doit monter de 1.
6. **Recharge encore** — le bonus ne doit pas se redonner une deuxième
   fois le même jour (pas de message, population inchangée).
7. **Annule un jumelage** actif ou une demande envoyée — le bouton
   "Proposer un jumelage" doit redevenir disponible pour cette ville
   sur `/villes`.
8. **Ressenti général** — est-ce que ce système donne envie de créer de
   vraies relations avec d'autres joueurs (esprit du cahier des
   charges), ou est-ce que ça se sent comme une corvée de plus à gérer
   chaque jour ?

## ⚠ Points à trancher (délégués explicitement, à valider ou ajuster)

Détail complet du raisonnement dans `DECISIONS.md` §4 (Jalon 5) :

- **3 jumelages actifs maximum par ville.** Le cahier des charges
  laissait ce nombre explicitement ouvert.
- **Bonus : +1 population aux deux villes**, quand les deux joueurs ont
  été actifs le même jour (au moins une visite, une influence ou une
  action AntiVille — pas une simple connexion, qui n'existe pas encore
  comme notion séparée dans le jeu).
- **Le bonus est accordé quand tu recharges `/ville` ou `/jumelages`**,
  pas par une tâche automatique qui tournerait en arrière-plan à heure
  fixe (le projet n'a aucune infrastructure de ce genre pour l'instant).
  Concrètement : si aucun des deux joueurs ne revient sur une de ces
  deux pages après avoir été actif, le bonus attend simplement d'être
  réclamé au prochain passage — rien n'est perdu, juste retardé.
- **Un détail mineur trouvé en écrivant les tests** : si tu es déjà au
  quota de 3 jumelages ET que tu retentes de proposer un jumelage à une
  ville déjà jumelée avec toi, le message sera "quota atteint" plutôt
  que "déjà jumelée" — les deux sont vrais en même temps, ce n'est pas
  grave, mais je te le signale par honnêteté.

## Tests automatisés couvrant ce jalon

```bash
npm test           # tests unitaires (inchangés pour ce jalon)
npm run test:e2e   # parcours complet : proposer, accepter, bonus, idempotence, sabotages
```
