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

---

## Phase 1 — Une ville qui vit *(terminée)*

## Phase 1 bis — La ville prend forme *(ajoutée le 23/09/2026)*

- [ ] **Jalon 6 — La ville prend forme.** La page de ville affiche la
  ville en **3D temps réel** à partir du prototype
  `docs/prototypes/prototype-ville-3d.html`, branché sur les vraies
  données : identité de la ville (même ville à chaque visite), pays
  (soleil et nuit à l'heure réelle du pays — ajouter latitude, longitude
  et fuseau horaire à `countries`), population (maisons → immeubles →
  tours selon `DECISIONS.md` §8). Au passage : seuils de niveau passés à
  l'échelle 100 000 (`DECISIONS.md` §10 point 10), chargement des
  **villes de test** (`supabase/seed/villes-de-test.json`) en dev/recette
  uniquement avec un test qui garantit leur absence en production. À
  trancher avant de commencer : Three.js ou WebGL fait main (§10 point
  12), rendu d'après la population ou son record (§10 point 11).

## Phase 2 — Rivalités entre villes

- [ ] **Jalon 7 — Se classer.** Classement des villes (pays + mondial).

## Phase 3 — Le pays prend forme

- [ ] **Jalon 8 — Naissance d'un pays.** Page pays, agrégation des
  statistiques nationales (population, influence, activité) à partir des
  villes membres.
- [ ] **Jalon 9 — Voter pour son pays.** Vote hebdomadaire de ressource
  (Industrie / Techno / Culture / Commerce), résultat proportionnel aux
  votes, attribution des ressources nationales.
- [ ] **Jalon 10 — Le président malgré lui.** La ville #1 du pays devient
  automatiquement présidente, apparition dans un historique des
  présidents.

## Phase 4 — Le monde entre en scène

- [ ] **Jalon 11 — Décider à l'international.** Décision diplomatique
  hebdomadaire (alliance, paix, attaque/rivalité, embargo éventuel),
  agrégation des votes citoyens, le président peut proposer sans décider
  seul.
- [ ] **Jalon 12 — France contre Allemagne.** Premier scénario de rivalité
  internationale : coût en ressources, bonus défensif pour l'attaqué,
  mobilisation quotidienne, résultat en fin de période. Scénario de test
  explicitement prévu par le cahier des charges.

## Phase 5 — Tenir la route

- [ ] **Jalon 13 — Rester dans la légalité.** Anti-triche côté serveur
  systématique : validation serveur de toutes les actions sensibles,
  limitation multi-compte, détection de comportements automatisés/répétitifs.
- [ ] **Jalon 14 — Jouable partout.** Passage en PWA installable (manifest,
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

*Dernière mise à jour : 23/09/2026, jalon 5 terminé, avant le début du
jalon 6.*
