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

## Phase 1 ter — Un jeu agréable à regarder *(terminée)*

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
- [x] **Jalon 7bis — La ville continue de grandir.** La ville ne
  plafonne plus à 40 000 habitants pour son rendu 3D : un nouveau bloc
  tous les 5 000 habitants au-delà, sans limite (voir
  `docs/A-INTEGRER.md` §2) ; brouillard, ombres, occlusion au sol et
  caméra suivent le rayon réel de la ville. Scindé du Jalon 7 (même
  logique que la scission Jalon 6 / 6bis). Détail dans `DECISIONS.md` §4
  — recette dans `docs/recette-jalon-7bis.md`. Points ouverts : plafond
  de rendu pour les très grandes villes, stade au-delà de Métropole
  (§10 points 19 et 20).

## À placer (Adrien choisit quand)

- [ ] **Revoir les règles du jeu.** Tous les mécanismes et actions revus
  sur une même grille : effets unitaires faibles, cumul des attaques
  reçues dans la journée, plafond de 10 % par jour, paliers visibles
  (Incidents, Troubles, Émeutes, Crise, Ville sinistrée). Proposition en
  réflexion (`docs/SYSTEME-DEVELOPPEMENT.md` §6 bis, `DECISIONS.md` §10
  point 22), pas de code avant validation.
- [ ] **La bibliothèque de bâtiments** (puis thèmes et boutique).
  Proposition `docs/BATIMENTS-ET-PACKS.md`, en attente des réponses
  d'Adrien (`DECISIONS.md` §10 point 21).

## Phase 2 — Rivalités entre villes *(terminée)*

- [x] **Jalon 8 — Se classer.** Régions (choix obligatoire à la création,
  écran de rattrapage pour les villes créées avant ce jalon, changement
  limité à une fois tous les 30 jours) et classements mondial, national
  et régional, avec "ma position" toujours visible. Contenu précisé par
  `docs/CLASSEMENTS.md` (demande d'Adrien, 24/09/2026) par rapport à la
  version d'origine de ce jalon. Détail dans `DECISIONS.md` §4 — recette
  dans `docs/recette-jalon-8.md`. Points ouverts : titre de gouverneur de
  région, régions réelles pour d'autres pays (§10 points 23 et 24).
- [x] **Jalon 8bis — Les palmarès.** Sept classements annexes (plus
  forte croissance, plus éprouvées, plus influentes, plus visitées,
  plus attaquées, joueurs les plus généreux, plus beaux jumelages), sur
  4 périodes (jour/semaine/mois/toujours) et 3 échelles (monde, pays,
  région), avec "ma position". Scindé du Jalon 8, même logique que
  6/6bis et 7/7bis. Calculés par requête directe sur les journaux
  existants plutôt que par bilan journalier + `pg_cron` (écart assumé,
  voir `DECISIONS.md` §4, journal du Jalon 8bis). Détail dans
  `DECISIONS.md` §4 — recette dans `docs/recette-jalon-8bis.md`.

## Phase 3 — Le pays prend forme *(terminée)*

- [x] **Jalon 9 — Naissance d'un pays.** Page pays (`/pays`), agrégation
  des statistiques nationales (population, influence, activité) à
  partir des villes membres, sélecteur de pays, villes principales.
  "Activité" enfin définie (jours actifs sur 7 jours, calculée à la
  volée) — corrige au passage la tuile Activité de Ma ville, bloquée à
  0 depuis le Jalon 1. Détail dans `DECISIONS.md` §4 — recette dans
  `docs/recette-jalon-9.md`.
- [x] **Jalon 10 — Voter pour son pays.** Vote hebdomadaire de ressource
  (Industrie / Techno / Culture / Commerce) sur `/pays`, résultat
  proportionnel aux votes, ressources nationales accumulées. Aucun
  effet de gameplay codé pour ces ressources (point ouvert §10 point 27
  — le cahier des charges ne le précise pas). Détail dans
  `DECISIONS.md` §4 — recette dans `docs/recette-jalon-10.md`.
- [x] **Jalon 11 — Le président malgré lui.** La ville n°1 du pays reste
  présidente (badge déjà en place depuis le Jalon 7, calculé en
  direct) ; nouveauté : historique des mandats sur `/pays` ("depuis
  quand", mandats précédents), tenu à jour par une réconciliation
  idempotente. Détail dans `DECISIONS.md` §4 — recette dans
  `docs/recette-jalon-11.md`.
- [x] **Jalon 9 ter — La carte du pays.** Remplace le fond 3D de la
  page Pays par une carte SVG illustrée (régions colorées par
  population, pastilles pour la ville du joueur / la présidente / la
  n°1 de chaque région, cliquables). Scindé après coup des Jalons 9 et
  10, même logique que 6/6bis et 7/7bis (`docs/CARTE-DU-PAYS.md`,
  demande d'Adrien, 25/09/2026). Scintillement nocturne, repères de
  jumelages en bord de carte et clic sur une région non faits (points
  ouverts §10 point 28). Détail dans `DECISIONS.md` §4 — recette dans
  `docs/recette-jalon-9ter.md`.

## Phase 4 — Le monde entre en scène *(terminée)*

- [x] **Jalon 12 — Décider à l'international.** Sur `/pays`, la
  présidente en exercice propose un pays cible + une catégorie
  (Alliance/Paix/Rivalité/Embargo) une fois par semaine ; les citoyens
  soutiennent. Aucun effet de gameplay codé pour ces décisions (comme
  les ressources du Jalon 10) — laissé au Jalon 13. Détail dans
  `DECISIONS.md` §4 — recette dans `docs/recette-jalon-12.md`.
- [x] **Jalon 13 — France contre Allemagne.** Premier scénario de rivalité
  internationale : sur `/pays`, la décision diplomatique du Jalon 12 se
  résout à la majorité pour/contre en fin de semaine ; une "rivalité"
  adoptée déclenche un conflit de 7 jours, effort de chaque camp dérivé
  automatiquement de l'activité et des ressources nationales
  (`effort_national()`, pas une action à cliquer — correction en cours
  de route, `docs/A-INTEGRER.md` §12), bonus défensif de 50 % pour le
  défenseur, résultat en fin de période. Coût en ressources traité comme
  un instantané informatif, jamais déduit (point ouvert §10 point 30).
  Détail dans `DECISIONS.md` §4 — recette dans `docs/recette-jalon-13.md`.
- [x] **Jalon 13 bis — Revenir plus souvent.** Sur `/villes`, une ville
  peut être revisitée plusieurs fois par jour (jusqu'à 3, délai d'une
  heure entre deux) au lieu d'une seule fois — déviation assumée du
  cahier des charges §3/§26, demandée par Adrien pour la rétention
  (`docs/A-INTEGRER.md` §13). Détail dans `DECISIONS.md` §4.
- [x] **Jalon 13 ter — Visite automatique.** Trois retours de test
  regroupés : le panneau flottant du bas se réduit sur mobile pour
  laisser voir la ville (`docs/A-INTEGRER.md` §14) ; visiter une ville
  ne demande plus de cliquer un bouton, ça se compte automatiquement en
  ouvrant sa page (§15) ; visiter sa propre ville est désormais permis,
  même délai/plafond que pour les autres (§16, nouvelle déviation
  assumée du cahier des charges §3). Détail dans `DECISIONS.md` §4.

## Phase 5 — Tenir la route *(terminée, sous réserve de la vérification mobile)*

- [x] **Jalon 14 — Rester dans la légalité.** Anti-triche côté serveur
  (cahier des charges §26) : audit complet des fonctions SQL sensibles
  (aucune anomalie trouvée), délai anti-rafale d'une seconde entre deux
  actions du même type (Influencer, AntiVille), pas de nouveau signal
  technique pour le multi-compte (décision d'Adrien — un compte = un
  email vérifié = une ville suffit à cette échelle). Détail dans
  `DECISIONS.md` §4.
- [x] **Jalon 15 — Jouable partout.** Passage en PWA installable (manifest,
  service worker, mode hors-ligne minimal) — le squelette (manifest,
  icônes, enregistrement) datait déjà du Jalon 0 ; ce jalon réécrit le
  service worker pour ne jamais servir de données périmées quand le
  réseau fonctionne, avec un vrai hors-ligne dégradé (pages déjà
  visitées, secours sur l'accueil sinon). Détail dans `DECISIONS.md`
  §4. Point encore ouvert : vérification manuelle sur mobile
  (Android + iOS) et PC, pas faisable par Claude Code — en attente
  d'Adrien.

## Phase 6 — Équilibrage et système de développement des villes *(en cours)*

- [x] ~~Jalon 16 — Croissance rapide en début de partie (gain
  dégressif).~~ **Annulé par Adrien le 27/09/2026** : le gain par
  visite reste un flat +1 comme avant ; la sensation de croissance doit
  venir du rendu 3D plutôt que du chiffre de population. Détail dans
  `DECISIONS.md` §4 ("Annulation du Jalon 16") et point ouvert §10
  point 33.
- [x] **Jalon 16 (redéfini) — Croissance visible dans le rendu 3D
  ("habitants par habitation").** Refonte complète par type de bâtiment
  choisie par Adrien. Fait pour les **maisons** : une maison = un
  logement, occupé tous les 4 habitants (`HABITANTS_PAR_LOGEMENT_MAISON`,
  `src/lib/ville3d/constantes.ts`), même règle du Hameau à la Métropole.
  Immeubles et tours volontairement inchangés (leur rythme actuel est
  calé sur les repères de densité du cahier des charges). Détail dans
  `DECISIONS.md` §4 ("Habitants par habitation") et point ouvert §10
  point 33 (immeubles/tours, encore ouvert).
- [ ] **Jalon 17 — Système de développement des villes (1/4) : choix
  d'activité et jauges, sans effet.** Premier des quatre jalons du
  chantier validé par Adrien dans `docs/A-INTEGRER.md` §18 (7
  activités, `docs/SYSTEME-DEVELOPPEMENT.md` §9) : poser le choix
  d'activité à chaque visite et les jauges associées, sans encore
  brancher d'effet de jeu.
- [ ] **Jalon 18 — Système de développement (2/4) : équilibre, crises,
  manifestations, lien AntiVille.**
- [ ] **Jalon 19 — Système de développement (3/4) : quartiers et
  bâtiments 3D.**
- [ ] **Jalon 20 — Système de développement (4/4) : mégaprojets et
  technologies.**

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

*Dernière mise à jour : 27/09/2026, jalon 16 annulé et redéfini
(croissance visible dans le rendu 3D plutôt que gain de population
dégressif — DECISIONS.md §4 "Annulation du Jalon 16" et "Habitants par
habitation") — MVP du cahier des charges §30 livré depuis le Jalon 15,
vérification manuelle mobile/PC d'Adrien toujours en attente pour le
considérer définitivement clos. Point encore ouvert : le même principe
pour les immeubles et les tours (DECISIONS.md §10 point 33). Chantier
suivant : le système de développement des villes (7 activités), validé
par Adrien dans A-INTEGRER.md §18, découpé en Jalons 17 à 20.*
