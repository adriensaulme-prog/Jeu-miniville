# Recette — Jalon 4 : « Rivalités de quartier »

À jouer par Adrien. Objectif : vérifier que les actions AntiVille sont
compréhensibles, que la protection anti-harcèlement se sent juste (ni
trop permissive, ni trop punitive), et que rien ne semble injuste ou
cassé.

**Important pour ce jalon** : les paramètres d'équilibrage (quotas,
effets, courbe de protection) ont été choisis par moi, sur ta
délégation explicite ("tranche selon tes recos"). Voir la section
"Points à trancher" plus bas pour le raisonnement complet — c'est là
que ton avis compte le plus pour ce jalon.

Aucun réglage préalable : tout est déjà en place, y compris le
correctif de la migration `0006` (voir `DECISIONS.md` §4 pour le bug
qu'elle corrige).

```bash
npm run dev
```

Ouvre `http://localhost:3000`, connecte-toi, va sur "Villes".

## Ce qu'il faut juger

1. **Les trois boutons rouges** (Grève / Contamination / Propagande) à
   côté de Visiter/Influencer — assez clairs sans lire le cahier des
   charges ? Les couleurs (bleu/violet/rouge) aident-elles à distinguer
   "aider" de "attaquer" au premier coup d'œil ?
2. **Lance une Contamination** sur une ville — la population doit
   baisser un peu (10 % environ, minimum 1 point), jamais à 0. Le
   message "Action lancée." doit s'afficher.
3. **Lance une Propagande** — l'influence doit baisser de 2 (jamais
   sous 0).
4. **Lance une Grève** — rien de visible immédiatement sur la ligne,
   mais un badge orange "En grève" doit apparaître à côté du nom de la
   ville. Essaie ensuite de l'"Influencer" avec un autre compte (ou
   demande-moi un compte de test) : ça doit être bloqué.
5. **Attaque la même ville deux fois de suite** (n'importe quelle
   action) — la 2e doit dire "effet réduit de moitié". Une 3e doit
   afficher "protection anti-harcèlement active" et les boutons doivent
   disparaître pour cette ville (remplacés par "Protection
   anti-harcèlement active" en gris).
6. **Épuise ton quota** (3 actions AntiVille dans la journée, sur des
   cibles différentes) — au-delà, les boutons doivent disparaître
   partout, remplacés par "Quota AntiVille atteint".
7. **Ressenti général** — est-ce que ça donne un sentiment de rivalité
   amusante, ou est-ce que ça fait mesquin/désagréable ? Le fait que la
   protection empêche de "s'acharner" sur une ville te semble-t-il
   suffisant, ou une ville pourrait-elle quand même se sentir harcelée
   avec ces réglages ?

## ⚠ Points à trancher (délégués explicitement, à valider ou ajuster)

Tu m'as dit de trancher moi-même ces paramètres — les voici, avec mon
raisonnement, pour que tu puisses les contester d'un mot si le ressenti
en jeu ne te convient pas (détail complet dans `DECISIONS.md` §4) :

- **Quota : 3 actions AntiVille par jour**, contre 5 actions d'influence
  (Jalon 3). Volontairement plus bas parce que ce sont des actions
  négatives pour la cible.
- **Protection : 1re attaque pleine, 2e à moitié, 3e bloquée**, par
  paire (toi → cette ville précise), sur 24h glissantes — pas par jour
  calendaire comme les autres quotas.
- **Contamination : -10 % de population (minimum 1 au plein effet)**,
  jamais sous population = 1.
- **Propagande : -2 influence**, jamais sous 0.
- **Grève : bloque la réception d'influence 24h au plein effet, 12h à
  effet réduit.**
- **Non implémenté à ce jalon** : le cahier des charges évoque aussi
  une protection basée sur "la fréquence des attaques reçues" en
  général (tous attaquants confondus, pas seulement le même). Ce jalon
  ne protège que contre un même attaquant qui s'acharne — pas contre
  plusieurs joueurs différents qui cibleraient la même ville
  simultanément. À voir si ça devient un vrai problème une fois qu'il y
  aura plusieurs joueurs actifs.

## Tests automatisés couvrant ce jalon

```bash
npm test           # tests unitaires (inchangés pour ce jalon)
npm run test:e2e   # parcours complet : les 3 actions, la grève qui bloque
                    # l'influence, la courbe de protection, le quota
```
