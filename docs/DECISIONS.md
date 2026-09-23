# DECISIONS.md — jeu_miniville (nom de travail)

Source de vérité du projet. Journal honnête : on y consigne ce qui a
marché, ce qui n'a pas marché, et pourquoi. Voir `GUIDE-METHODE.md` pour la
démarche générale et `ROADMAP.md` pour les jalons à venir.

---

## §1. Contraintes fondatrices

Posées avant la première ligne de code, à ne jamais contourner "juste pour
un jalon" :

1. **Zéro coût, zéro royalties.** Uniquement des outils et niveaux de
   service gratuits (Next.js, Supabase free tier, Vercel free tier, GitHub
   privé gratuit). Aucun logiciel payant, aucune licence à l'unité, aucune
   royalty sur les revenus futurs.
2. **Anti-triche côté serveur.** Toute règle qui affecte le classement, la
   population, l'influence ou les ressources d'un joueur est validée côté
   serveur. Le client ne fait que demander et afficher.
3. **Boucle courte.** Le jeu doit rester jouable en 2 à 5 minutes par jour ;
   toute mécanique qui allonge ce temps sans raison de design explicite est
   un point ouvert, pas un fait acquis.
4. **Pas de destruction permanente.** Une défaite ou une attaque ne doit
   jamais détruire durablement une ville ni effacer des mois de
   progression (cahier des charges §19).
5. **i18n dès le premier texte**, fr et en remplis immédiatement, jamais de
   trou "provisoire".

---

## §2. Périmètre (MVP)

Repris du cahier des charges §30, c'est la version volontairement plus
petite que le jeu final :

- Ville + population + influence.
- 1 connexion par joueur et par ville par jour → +1 population.
- 5 actions d'influence quotidiennes.
- 3 actions AntiVille : grève, contamination, propagande, avec protection
  progressive contre le harcèlement.
- Jumelage avec acceptation des deux villes.
- Classement des villes.
- Évolution visuelle automatique de la ville (Hameau → Village → Bourg →
  Ville → Grande ville → Métropole ; seuils à équilibrer pendant les
  tests).
- Pays + activité quotidienne agrégée.
- Vote hebdomadaire de ressource, résultat proportionnel aux votes.
- Ressources nationales.
- Président = ville #1 du pays.
- Décision diplomatique hebdomadaire (alliance, paix, attaque/rivalité,
  embargo éventuel).
- Rivalité France / Allemagne comme premier scénario de test.

**Explicitement hors MVP** (cahier des charges, "à ajouter ensuite") :
technologies visuelles avancées, alliances/coalitions complexes, projets
nationaux, journal mondial, personnalisation, monétisation, statistiques
avancées.

---

## §3. Environnement technique

- **Frontend** : Next.js / React, TypeScript.
- **Backend** : Supabase (PostgreSQL + Row Level Security + Edge
  Functions pour la logique serveur sensible).
- **Auth** : Supabase Auth.
- **Hébergement** : Vercel (frontend), Supabase (backend), niveaux
  gratuits.
- **PWA** : manifest + service worker pour l'installation sur mobile et
  PC, sans passer par un store.
- **Tests** : Vitest (unitaire), Playwright (bout-en-bout).
- **Code source** : GitHub, dépôt privé.
- **Langue par défaut** : français, anglais en parallèle dès le premier
  texte.

---

## §4. Journal des jalons

### Jalon 0 — squelette technique (Next.js, Supabase, PWA) — 23/09/2026

**Ce qui a été fait** : mise en place de la base technique avant tout
contenu de jeu — projet Next.js (App Router, TypeScript, Tailwind),
clients Supabase séparés navigateur/serveur, manifest + service worker
PWA minimal, harnais de tests (Vitest + Playwright), dépôt Git local
initialisé et taggé `0.0.0`.

**Pourquoi** : jalon technique pur, dans l'esprit des jalons techniques de
CVLS — rien de neuf n'est jouable, mais tout ce qui suit s'appuie dessus.

**Ce qui a été testé** : un test canari unitaire (`tests/unit/harness.test.ts`)
et un test de fumée bout-en-bout (`tests/e2e/smoke.spec.ts`), tous deux
non jetables. Pas de sabotage effectué : aucune règle de jeu n'existe
encore à casser.

**Point d'attention noté au passage** : cette session Claude n'a aucun
accès réseau, ni depuis le sandbox cloud ni depuis le dossier connecté sur
la machine d'Adrien (host non autorisé par la politique d'égress de
l'organisation). Concrètement : `npm install`, la création du dépôt
GitHub et son premier `git push`, la création du projet Supabase, et le
déploiement Vercel doivent être faits par Adrien lui-même, dans son propre
terminal. Documenté aussi en §10.

*(Les jalons suivants migrent ici au fur et à mesure, depuis
`ROADMAP.md`, avec : ce qui a été fait, pourquoi, ce qui a été testé, le
compte de vérification par sabotage, et les bugs trouvés en route.)*

---

## §5. i18n

Toute chaîne affichée passe par une clé (`ville.nom`, `jeu.connexion_jour`,
...) avec traduction fr et en remplies au même moment que la clé est
créée. Défaut : français. Pas de clé orpheline en prod.

---

## §6. Méthode de travail (résumé — détail dans `GUIDE-METHODE.md`)

- Un jalon = un livrable testable.
- Pas de test jetable, jamais.
- Vérification rouge par sabotage sur toute mécanique qui touche au score,
  aux ressources ou à l'anti-triche.
- Mini cahier de recette à jouer par Adrien après chaque jalon
  (`docs/recette-jalon-N.md`).
- Claude Code signale les points ouverts au lieu de trancher seul le
  design ou l'architecture.

---

## §7. Versionnage, infrastructure et coûts

- SemVer : `0.x.0` par jalon, `0.x.y` pour un correctif, `1.0.0` pour la
  première mise en ligne publique au périmètre MVP.
- **Suivi des paliers gratuits** (à mettre à jour à chaque jalon qui ajoute
  de la charge) :

| Service | Palier gratuit actuel | Usage actuel | Marge |
|---|---|---|---|
| Supabase | à renseigner au premier déploiement | — | — |
| Vercel | à renseigner au premier déploiement | — | — |

Dès qu'un de ces paliers est approché (ex. > 70 % du quota), c'est un point
ouvert à signaler à Adrien, pas une décision technique à prendre seul.

---

## §8. Réservé

*(section réservée pour une future extension du format, comme chez CVLS —
rien à date.)*

---

## §9. Ambitions long terme

Notées maintenant pour ne pas fermer de portes par accident, mais **hors
périmètre MVP** :

- Présence sur l'App Store / Play Store (nécessite un compte développeur
  payant côté Apple — décision explicitement repoussée à Adrien).
- Notifications push (rappel quotidien de connexion).
- Système de publicité et premium (cahier des charges §7, volontairement
  laissé ouvert par Adrien lui-même).
- Alliances et coalitions complexes entre pays.
- Journal mondial et système de viralité/partage.

---

## §10. Points ouverts

Liste vivante des points signalés, avec qui doit trancher. À jour au
23/09/2026 :

1. **Nom définitif du jeu.** "jeu_miniville" est un nom de travail choisi par
   Claude pour nommer le dépôt et les dossiers, pas une proposition de nom
   final. → **À trancher par Adrien**, sans urgence.
2. **Seuils exacts d'évolution visuelle des villes** (Hameau → ... →
   Métropole). Le cahier des charges dit explicitement "seuils à équilibrer
   pendant les tests". → **À trancher par Adrien après les premiers
   tests.**
3. **Nombre de jumelages actifs autorisés par ville.** Non précisé au
   cahier des charges. → **À trancher par Adrien**, ou délégation possible
   ("tranche selon tes reco") si souhaité.
4. **Publicités et premium.** Chapitre volontairement laissé ouvert par le
   cahier des charges lui-même (§7). → **Hors MVP, à rouvrir plus tard par
   Adrien.**
5. **Stratégie App Store / Play Store.** PWA au démarrage ; passage aux
   stores nécessiterait un compte développeur Apple payant. → **À trancher
   par Adrien si/quand le jeu a une communauté.**
6. **Accès réseau indisponible pour Claude Code depuis cette session.**
   `npm install`, dépôt GitHub, projet Supabase et déploiement Vercel sont
   à faire par Adrien dans son propre terminal (voir Jalon 0 au §4). → Pas
   une décision à trancher, un fait à garder en tête pour la suite du
   projet.
7. **Format exact des paliers de guerre / rivalité internationale**
   (coefficients de réduction sur attaques répétées, plafonds de coalition).
   Le cahier des charges donne le principe, pas les chiffres ("les
   coefficients exacts seront définis lors du balancing"). → **À trancher
   par Adrien avec appui de Claude Code sur les tests d'équilibrage.**
