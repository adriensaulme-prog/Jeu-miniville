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

---

## Phase 1 — Une ville qui vit

- [ ] **Jalon 1 — Naître quelque part.** Création de compte (Supabase
  Auth), choix du nom de ville et du pays, page de ville minimale
  affichant population / influence / activité, niveau visuel de départ
  (Hameau).
- [ ] **Jalon 2 — Grandir grâce aux autres.** Mécanique de connexion
  quotidienne entre joueurs (+1 population), une seule connexion
  comptabilisée par joueur et par ville et par jour, évolution visuelle
  automatique selon seuils.
- [ ] **Jalon 3 — Peser socialement.** 5 actions d'influence par jour,
  cibler une autre ville, effet +1 influence.

## Phase 2 — Rivalités entre villes

- [ ] **Jalon 4 — Rivalités de quartier.** Actions AntiVille de base
  (grève, contamination, propagande) avec protection progressive contre le
  harcèlement (effets dégressifs sur attaques répétées).
- [ ] **Jalon 5 — Villes jumelles.** Proposition et acceptation de
  jumelage entre deux villes, bonus quotidien si les deux joueurs sont
  actifs.
- [ ] **Jalon 6 — Se classer.** Classement des villes (pays + mondial).

## Phase 3 — Le pays prend forme

- [ ] **Jalon 7 — Naissance d'un pays.** Page pays, agrégation des
  statistiques nationales (population, influence, activité) à partir des
  villes membres.
- [ ] **Jalon 8 — Voter pour son pays.** Vote hebdomadaire de ressource
  (Industrie / Techno / Culture / Commerce), résultat proportionnel aux
  votes, attribution des ressources nationales.
- [ ] **Jalon 9 — Le président malgré lui.** La ville #1 du pays devient
  automatiquement présidente, apparition dans un historique des
  présidents.

## Phase 4 — Le monde entre en scène

- [ ] **Jalon 10 — Décider à l'international.** Décision diplomatique
  hebdomadaire (alliance, paix, attaque/rivalité, embargo éventuel),
  agrégation des votes citoyens, le président peut proposer sans décider
  seul.
- [ ] **Jalon 11 — France contre Allemagne.** Premier scénario de rivalité
  internationale : coût en ressources, bonus défensif pour l'attaqué,
  mobilisation quotidienne, résultat en fin de période. Scénario de test
  explicitement prévu par le cahier des charges.

## Phase 5 — Tenir la route

- [ ] **Jalon 12 — Rester dans la légalité.** Anti-triche côté serveur
  systématique : validation serveur de toutes les actions sensibles,
  limitation multi-compte, détection de comportements automatisés/répétitifs.
- [ ] **Jalon 13 — Jouable partout.** Passage en PWA installable (manifest,
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

*Dernière mise à jour : 23/09/2026, avant le début du jalon 1.*
