# ROADMAP.md — jeu_miniville (nom de travail)

Jalons **à venir**, découpés à partir du MVP du cahier des charges
(`DECISIONS.md` §2). Un jalon terminé migre vers le journal
(`DECISIONS.md` §4) avec son résumé, ses tests et ses éventuels bugs
trouvés en route.

Convention reprise de CVLS : chaque jalon est nommé simplement, du point
de vue du joueur — le titre dit ce qui change pour lui.

---

## Fait

- [x] **Jalon 0 — squelette technique.** Next.js/Supabase/PWA, tests,
  dépôt Git local. Détail dans `DECISIONS.md` §4.
- [x] **Jalon 1 — Naître quelque part.** Création de compte (Supabase
  Auth), choix du pseudo, du nom de ville et du pays, page de ville
  minimale affichant population / influence / activité, niveau visuel de
  départ (Hameau). Détail dans `DECISIONS.md` §4 — recette dans
  `docs/recette-jalon-1.md`.
- [x] **Jalon 2 — Grandir grâce aux autres.** Page listant les autres
  villes, visite quotidienne (+1 population, une fois par joueur et par
  ville et par jour), évolution visuelle automatique selon seuils.
  Détail dans `DECISIONS.md` §4 — recette dans `docs/recette-jalon-2.md`.
- [x] **Jalon 3 — Peser socialement.** 5 actions d'influence par jour,
  cibler une autre ville, effet +1 influence. Détail dans
  `DECISIONS.md` §4 — recette dans `docs/recette-jalon-3.md`.
- [x] **Jalon 4 — Rivalités de quartier.** Actions AntiVille de base
  (grève, contamination, propagande) avec protection progressive contre le
  harcèlement (effets dégressifs sur attaques répétées). Détail dans
  `DECISIONS.md` §4 — recette dans `docs/recette-jalon-4.md`.
- [x] **Jalon 5 — Villes jumelles.** Proposition et acceptation de
  jumelage entre deux villes, bonus quotidien si les deux joueurs sont
  actifs. Détail dans `DECISIONS.md` §4 — recette dans
  `docs/recette-jalon-5.md`.
- [x] **Jalon 6 — La ville prend forme (couche données).** Préparation
  des données pour le rendu 3D : géo/fuseau horaire des pays,
  `population_max` (jamais de destruction visuelle), seuils de niveau à
  l'échelle 100 000 (`DECISIONS.md` §10 point 10), chargement des
  **villes de test** (`supabase/seed/villes-de-test.json`,
  `npm run seed:test`). Le rendu 3D lui-même est reporté au Jalon 6bis
  (portage Three.js trop gros pour un seul jalon — voir `DECISIONS.md`
  §4). Détail dans `DECISIONS.md` §4 — recette dans
  `docs/recette-jalon-6.md`.

---

## Phase 1 — Une ville qui vit *(terminée)*

## Phase 1 bis — La ville prend forme *(terminée)*

- [x] **Jalon 6bis — Le rendu 3D.** La page de ville affiche la ville en
  **3D temps réel**, portée du prototype
  `docs/prototypes/prototype-ville-3d.html` (WebGL fait main, ~2000
  lignes) vers **Three.js**, branchée sur les vraies données préparées
  au Jalon 6 : identité de la ville (graine = son id), pays (soleil et
  nuit à l'heure réelle du pays), population_max (maisons → immeubles →
  tours). Détail dans `DECISIONS.md` §4 — recette dans
  `docs/recette-jalon-6bis.md`. Point encore ouvert : fluidité sur
  mobile, à vérifier sur le téléphone d'Adrien (§10 point 13).

## Phase 1 ter — Un jeu agréable à regarder *(en cours)*

- [x] **Jalon 7 — Un jeu agréable à regarder.** Refonte visuelle de toutes
  les pages (accueil, connexion/inscription, création, Ma ville, Villes,
  Jumelages, navigation) selon `docs/prototypes/maquette-ecrans.html` :
  ville en 3D plein écran (scène persistante et partagée entre toutes les
  pages, plus besoin de la recréer à chaque navigation), panneaux vitrés
  flottants, panneau d'entrée d'agglomération pour le nom de ville,
  typographie Barlow. Réutilise la scène Three.js du Jalon 6bis. Remplace
  l'ancien Jalon 7 "Se classer" (voir `docs/DECISIONS.md` §4 et §10 pour
  la décision de réordonnancement, prise à partir de
  `docs/A-INTEGRER.md`). Le classement minimal nécessaire à cette refonte
  (tri par population, rang dans le pays, badge Président) est inclus ;
  le reste (page de classement dédiée, mondial) reste dans le Jalon 8.
  Détail dans `DECISIONS.md` §4 — recette dans `docs/recette-jalon-7.md`.
- [ ] **Jalon 7bis — La ville continue de grandir.** La ville ne
  plafonne plus à 40 000 habitants pour son rendu 3D : un nouveau bloc
  tous les 5 000 habitants au-delà, sans limite (voir
  `docs/A-INTEGRER.md` §2). Scindé du Jalon 7 : c'est un changement
  purement technique du générateur 3D, indépendant de la refonte visuelle
  (même logique que la scission Jalon 6 / 6bis).

## Phase 2 — Rivalités entre villes

- [ ] **Jalon 8 — Se classer.** Classement des villes (pays + mondial),
  au-delà de ce que le Jalon 7 a déjà mis en place pour son propre
  affichage.

## Phase 3 — Le pays prend forme

- [ ] **Jalon 9 — Naissance d'un pays.** Page pays, agrégation des
  statistiques nationales (population, influence, activité) à partir des
  villes membres.
- [ ] **Jalon 10 — Voter pour son pays.** Vote hebdomadaire de ressource
  (Industrie / Techno / Culture / Commerce), résultat proportionnel aux
  votes, attribution des ressources nationales.
- [ ] **Jalon 11 — Le président malgré lui.** La ville #1 du pays devient
  automatiquement présidente, apparition dans un historique des
  présidents.

## Phase 4 — Le monde entre en scène

- [ ] **Jalon 12 — Décider à l'international.** Décision diplomatique
  hebdomadaire (alliance, paix, attaque/rivalité, embargo éventuel),
  agrégation des votes citoyens, le président peut proposer sans décider
  seul.
- [ ] **Jalon 13 — France contre Allemagne.** Premier scénario de rivalité
  internationale : coût en ressources, bonus défensif pour l'attaqué,
  mobilisation quotidienne, résultat en fin de période. Scénario de test
  explicitement prévu par le cahier des charges.

## Phase 5 — Tenir la route

- [ ] **Jalon 14 — Rester dans la légalité.** Anti-triche côté serveur
  systématique : validation serveur de toutes les actions sensibles,
  limitation multi-compte, détection de comportements automatisés/répétitifs.
- [ ] **Jalon 15 — Jouable partout.** Passage en PWA installable (manifest,
  service worker, mode hors-ligne minimal), vérification manuelle sur
  mobile (Android + iOS via navigateur) et PC.

---

## Après le MVP (non planifié en détail)

Cette liste vit dans `DECISIONS.md` §9 (ambitions long terme) et §10
(points ouverts) — elle n'est pas encore découpée en jalons :

- Technologies visuelles avancées et leurs effets dans les villes.
- Alliances et coalitions entre pays (plafonds anti-écrasement).
- Journal mondial des événements.
- Viralité / partage (pages publiques de ville, liens d'événements).
- Amis et suivi.
- Publicités et premium.
- Éventuelle présence App Store / Play Store.

---

*Dernière mise à jour : 24/09/2026, jalon 7 terminé — "Un jeu agréable à
regarder" (renumérotation depuis `docs/A-INTEGRER.md`, voir
`DECISIONS.md` §4 et §10), avant le jalon 7bis (ville qui grandit sans
limite).*
