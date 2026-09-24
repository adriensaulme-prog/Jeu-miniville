# Recette — Jalon 8 : « Se classer »

À jouer par Adrien. Objectif : juger si le choix de région et les trois
classements (mondial, national, régional) sont clairs et justes.

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Ton compte existant** — connecte-toi avec ton vrai compte. Comme ta
   ville a été créée avant ce jalon, elle n'a pas encore de région :
   tu dois atterrir sur un écran « Choisis ta région » avant de pouvoir
   aller ailleurs (Villes, Jumelages, Classement bloqués tant que ce
   choix n'est pas fait). Choisis une région française. Une fois validé,
   tu retombes sur Ma ville, qui affiche maintenant une ligne
   « Région : ... · Changer ».
2. **Changer de région tout de suite** — clique « Changer » : la page
   `/ville/region` doit refuser le changement et afficher combien de
   jours il reste à attendre (30 jours depuis ton choix de tout à
   l'heure). C'est voulu : on ne peut pas sauter de région en région.
3. **Créer une nouvelle ville de test** (`npm run seed:test` si besoin) —
   sur l'écran de création, choisis un pays : la liste des régions
   n'apparaît qu'après, et ne propose que les régions de ce pays.
4. **Page Classement** (nouvel onglet dans la barre de navigation) :
   - Onglet **Mondial** : toutes les villes, triées par population,
     avec ta position toujours affichée en haut (« Ma position : Nᵉ »),
     même si tu n'es pas dans le top 100 affiché.
   - Onglet **National** : seulement les villes de ton pays.
   - Onglet **Régional** : seulement les villes de ta région — regarde
     par exemple **Belval-sur-Loire** (Île-de-France, 114 000
     habitants) : elle doit être 1ʳᵉ en régional si tu es en
     Île-de-France, mais peut être derrière d'autres grandes villes en
     mondial.
   - Clique une ville du classement (qui n'est pas la tienne) : ça doit
     t'emmener sur la page Villes, prête à visiter cette ville.
5. **Villes de test dans plusieurs pays** : passe en classement mondial
   et vérifie que les villes allemandes, belges, suisses, canadiennes et
   japonaises apparaissent aussi (le Japon n'a qu'une région « Tout le
   pays » pour l'instant, voir point ouvert ci-dessous).

## ⚠ Points à trancher

- **Régions réelles seulement pour 6 pays** (France, Allemagne, Belgique,
  Suisse, Canada, États-Unis) — j'ai tranché seul, à contester si tu
  veux. Le Japon et les ~240 autres pays ont une seule région « Tout le
  pays » pour l'instant (`DECISIONS.md` §10 point 24). Dis-moi si tu
  veux que j'ajoute d'autres pays (ça ne demande qu'une migration).
- **Titre de « gouverneur de région »** (point 23) — pas fait, en
  attente de ta décision (`docs/CLASSEMENTS.md` question 2).
- **Noms uniques (pseudos et villes)** — ta demande du 24/09/2026
  (`docs/A-INTEGRER.md` §8) disait de le faire dans ce jalon, mais le
  contenu réel du Jalon 8 a suivi `docs/CLASSEMENTS.md` (régions +
  classements) : ce n'est **pas fait**. Aujourd'hui deux villes ou deux
  joueurs peuvent encore avoir le même nom. Je le note comme point
  ouvert plutôt que de l'ajouter sans te le dire (`DECISIONS.md` §10
  point 26) : un mini-jalon dédié, ou je l'ajoute au prochain jalon —
  comme tu préfères.
- **Jalon 8bis « Les palmarès »** (bilans journaliers, classements de
  croissance/pertes/influence/visites/jumelages/attaques, par période)
  pas commencé — c'est la suite naturelle si tu valides ce Jalon 8.

## Tests automatisés couvrant ce jalon

```bash
npm test          # 57 tests unitaires
npm run test:e2e  # dont tests/e2e/jalon8-se-classer.spec.ts : écran de
                   # rattrapage, sabotage région d'un autre pays (refusé),
                   # sabotage changement avant 30 jours (refusé), 30 jours
                   # pile après (accepté), mondial/national/régional +
                   # "ma position" juste
```
