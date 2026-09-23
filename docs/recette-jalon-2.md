# Recette — Jalon 2 : « Grandir grâce aux autres »

À jouer par Adrien. Objectif : vérifier que la mécanique centrale du
jeu — faire grandir sa ville grâce aux visites des autres joueurs — est
claire et donne envie de revenir chaque jour.

Aucun réglage préalable cette fois : la clé `anon` et les migrations
sont déjà en place depuis le Jalon 1, et la migration `0003` (ajoutée
par ce jalon) est déjà appliquée sur ton projet.

```bash
npm run dev
```

Ouvre `http://localhost:3000`, connecte-toi avec ton compte existant
(celui avec la ville "Bonneuil-Matours" si tu as joué la recette du
Jalon 1).

## ⚠ Avant de juger : ta ville a déjà été visitée une fois

En vérifiant ce jalon, j'ai dû visiter "Bonneuil-Matours" avec un compte
de test pour confirmer que le bouton "Visiter" marchait vraiment — sa
population est donc passée de 1 à 2. C'est un vrai effet du jeu (une
vraie ligne dans la table `visites`), pas un bug à corriger ; je te le
signale juste pour que le chiffre ne te surprenne pas.

## Ce qu'il faut juger

1. **Le lien "Villes" dans la barre du haut** — visible seulement une
   fois connecté. Assez visible ? Le nom te semble clair ("Villes" —
   d'autres noms possibles : "Explorer", "Visiter d'autres villes"...) ?
2. **La liste des villes** (`/villes`) — nom, pays, population de
   chaque ville, triée par population décroissante. Ta propre ville
   n'y apparaît pas (normal, cahier des charges : la population vient
   *des autres*). Est-ce lisible avec beaucoup de villes ? (Pour
   l'instant il n'y en a qu'une ou deux — le vrai classement avec tri
   et pagination arrive au Jalon 6.)
3. **Visiter une ville** — clique "Visiter" sur une ville qui n'est pas
   la tienne. La population doit monter de 1, le bouton doit devenir
   "Déjà visitée aujourd'hui" (recharge la page pour confirmer que ça
   tient, pas juste un effet visuel temporaire).
4. **Re-visiter le même jour** — le bouton doit rester absent, pas de
   moyen de tricher en rechargeant ou en re-cliquant.
5. **L'évolution visuelle** — pour la voir vraiment, il faudrait 5
   visiteurs différents sur la même ville en un jour (seuil du niveau 1,
   "Village"). Avec un seul testeur (toi), tu ne verras probablement pas
   le changement de niveau aujourd'hui — c'est couvert automatiquement
   par `tests/e2e/jalon2-grandir-grace-aux-autres.spec.ts` (voir plus
   bas). Si tu veux le voir en vrai, il faudra soit attendre plus de
   joueurs, soit me demander un compte de test supplémentaire.
6. **Ressenti général** — est-ce que "visiter des villes pour les faire
   grandir" donne envie de revenir demain ? Le cahier des charges vise
   une boucle de 2 à 5 minutes par jour : est-ce le cas là ?

## ⚠ Points à trancher (Claude Code a tranché seul faute de réponse)

- **Seuils d'évolution visuelle** (5 / 15 / 30 / 60 / 120 habitants pour
  passer de Hameau à Métropole) : choisis pour qu'une évolution soit
  visible avec une poignée de joueurs de test, pas calibrés sur un vrai
  volume de joueurs. Le cahier des charges dit lui-même "seuils à
  équilibrer pendant les tests" — donc c'est normal que ce soit encore
  provisoire, mais dis-moi si un seuil te semble déjà clairement trop
  haut ou trop bas une fois que tu auras vu une vraie évolution.
- **"Jour" = jour calendaire UTC**, pas ton fuseau horaire local. Le
  bouton "Visiter" pourrait donc redevenir disponible à une heure qui
  ne correspond pas à minuit chez toi (par exemple 2h du matin en heure
  d'été française). Simplification volontaire pour ce jalon.
- **`activité` toujours à 0** : ce jalon ne fait grandir que la
  population, pas l'activité (autre stat déjà affichée sur ta page de
  ville). Le cahier des charges ne précise pas encore quand elle doit
  bouger — laissé pour un jalon dédié.

## Tests automatisés couvrant ce jalon

```bash
npm test           # tests unitaires (dont les seuils d'évolution visuelle)
npm run test:e2e   # parcours complet : visite, anti-abus, franchissement de seuil
```

`npm run test:e2e` crée et supprime ses propres comptes de test à
chaque exécution (aucun impact sur ton compte réel), sauf l'unique clic
manuel que j'ai fait sur "Bonneuil-Matours" pour la vérification visuelle
(voir l'avertissement plus haut).
