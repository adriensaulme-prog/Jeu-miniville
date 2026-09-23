# `src/lib/game/`

C'est ici que vivra la logique de jeu pure (population, influence,
ressources, résultats de vote et de guerre) — séparée de l'affichage,
pour rester testable sans base de données ni serveur, dans l'esprit de
`scripts/sim/` chez CVLS (voir `docs/GUIDE-METHODE.md` §9).

Premier module au Jalon 1 : `niveauVille.ts`, qui traduit le niveau
numérique d'une ville (0=Hameau … 5=Métropole) en libellé localisé. Les
seuils de population qui feront évoluer une ville d'un niveau à l'autre
arrivent au Jalon 2 (`docs/DECISIONS.md` §10 point 2).
