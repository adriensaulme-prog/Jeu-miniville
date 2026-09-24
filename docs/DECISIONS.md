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
6. **Application légère** (règle ferme d'Adrien, ajoutée le 23/09/2026 via
   `docs/A-INTEGRER.md` §4) : c'est une appli de 2 à 5 minutes par jour, elle
   doit rester légère. Budget mesuré sur `next build` (tailles déjà
   compressées gzip/brotli qu'il affiche, jamais celles de `.next/` après
   `npm run dev` qui ne veulent rien dire) : premier chargement complet
   ≤ 500 Ko (JS + CSS + polices) ; chaque visite suivante ≈ 0 Ko de code
   grâce au service worker ; une page affiche son texte avant que la 3D ne
   soit prête (Three.js ne doit jamais faire partie du paquet initial du
   layout — voir §4, Jalon 7, correction post-recette, pour le cas où ça
   n'a pas été respecté et comment c'est corrigé). Pas de nouvelle
   dépendance npm sans peser son poids et l'inscrire ici.
7. **Aucun outil de triche ou de démonstration dans le jeu jouable**
   (règle ferme d'Adrien, `docs/A-INTEGRER.md` §1) : pas de curseur
   "Habitants", de bouton "Voir grandir", de curseur d'heure ni de
   simulateur — la population ne monte que par les visites d'autres
   joueurs, l'heure affichée est toujours l'heure réelle du pays. Ces
   outils existent dans la maquette (`docs/prototypes/maquette-ecrans.html`)
   pour la démonstration seulement ; pour tester, on utilise les villes de
   test et les scripts de seed, jamais un contrôle accessible au joueur.

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
- **Code source** : GitHub, dépôt privé —
  `github.com/adriensaulme-prog/Jeu-miniville`.
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

### Jalon 1 — naître quelque part — 23/09/2026

**Ce qui a été fait** : inscription et connexion (Supabase Auth), création
du profil joueur et de sa ville (pseudo, nom de ville, pays) en une seule
étape après la première connexion, page de ville affichant population,
influence, activité et niveau de départ (Hameau). Premier module de
`src/lib/game/` (`niveauVille.ts`). Premier système d'i18n du projet
(dictionnaire fr/en maison, cookie de langue, sélecteur dans la nav) —
voir point 8 ci-dessous sur ce choix. Migrations SQL `0001` et `0002`
(tables `countries`/`users`/`cities`, fonction `creer_ville()`, liste
complète des pays ISO 3166-1 avec noms fr/en).

**Pourquoi** : c'est le premier jalon de contenu du MVP (cahier des
charges §2 et §30) — sans lui, rien n'est jouable.

**Décisions prises en cours de route, à la demande d'Adrien ou par
déduction du cahier des charges** :

1. **Liste de pays à la création** : le cahier des charges ne précisait
   pas la liste. Adrien a tranché pour la liste complète (ISO 3166-1
   alpha-2, 250 entrées, y compris quelques territoires non
   souverains — Antarctique, Mayotte, etc. — inclus dans la norme ISO).
   Noms fr/en générés via le paquet `i18n-iso-countries`, embarqués dans
   la migration `0002` (pas de dépendance à ce paquet à l'exécution).
2. **`Country.nom` (types/index.ts) étendu en `nomFr`/`nomEn`** : la
   règle i18n de `GUIDE-METHODE.md` §9 impose les deux traductions dès
   le premier texte affiché ; un seul champ `nom` ne le permettait pas
   pour les 250 pays. Décision d'implémentation, pas de design de jeu.
3. **Anti-triche appliqué strictement dès ce jalon** : aucune policy RLS
   d'écriture sur `users`/`cities` pour les rôles `anon`/`authenticated` —
   toute écriture passe par la fonction serveur `creer_ville()`, appelée
   avec la clé `service_role`. Étend par prudence le principe du cahier
   des charges §26 (pensé pour population/influence en jeu) au tout
   premier écrit, pour ne pas avoir à le durcir plus tard.
4. **Schéma de la table `users`** : gardé fidèle à `src/types/index.ts`
   existant (et au cahier des charges §28), avec `country_id` et
   `city_id` directement sur la ligne joueur, même si `city_id` est
   dérivable via `cities.owner_id`. Une légère dénormalisation assumée,
   déjà écrite dans le code avant ce jalon.
5. **i18n fait maison, sans librairie** (dictionnaire `fr`/`en` +
   cookie de langue, pas de découpage d'URL `/fr`/`/en`) plutôt que
   `next-intl` ou équivalent. Suffisant pour deux langues, évite de
   figer une structure de routes dès le Jalon 1 ; à reconsidérer si
   l'i18n devient plus complexe (pluriels, dates, etc.).
6. **`@supabase/ssr` ajouté aux dépendances** (paquet officiel Supabase
   pour la gestion de session par cookies en Next.js App Router) : choix
   technique standard, pas un choix de design de jeu.

**Bug trouvé en route (avant même d'écrire du code de jeu)** : l'URL
Supabase dans `.env.local` pointait vers `*.supabase.com` au lieu de
`*.supabase.co` (domaine réel des projets Supabase) — corrigé. La clé
`anon` de `.env.local`, elle, est rejetée par le projet réel
("Invalid API key" — signature invalide) alors que la clé
`service_role` fonctionne : **point ouvert avec Adrien**, voir §10.

**Ce qui a été testé** : `tests/unit/dictionaries.test.ts` (parité des
clés fr/en, aucune valeur vide — protège la règle i18n elle-même) et
`tests/unit/niveauVille.test.ts` (tous les niveaux 0 à 5 dans les deux
langues, sabotage : niveau hors plage ou non entier rejeté).
`tests/e2e/jalon1-naitre-quelque-part.spec.ts` couvre le parcours réel
(connexion → création de ville → page de ville) avec un compte de test
pré-confirmé via l'API admin Supabase, nettoyé après coup — pas encore
exécuté avec succès de bout en bout, faute de clé `anon` valide et de
migrations appliquées sur le projet réel (voir §10). `npm run build` et
`npm run lint` passent.

**Vérification rouge par sabotage** : `niveauVille.test.ts` couvre un
niveau hors plage (-1, 6) et non entier (1.5) → `RangeError` attendu,
test rouge si l'erreur n'est plus levée.

**Mise à jour a posteriori** : une fois Adrien a corrigé la clé `anon`
et appliqué les migrations, la suite e2e est passée de bout en bout —
voir le Jalon 2 ci-dessous, où deux bugs supplémentaires ont été trouvés
en la faisant vraiment tourner (client navigateur sans cookie de
session, hook React périmé).

---

### Jalon 2 — grandir grâce aux autres — 23/09/2026

**Ce qui a été fait** : page `/villes` listant toutes les villes sauf la
sienne (nom, pays, population), bouton "Visiter" qui donne +1 population
à la ville visitée — une fois par (visiteur, ville, jour). Le niveau
visuel de la ville évolue automatiquement en franchissant les seuils de
population (migration `0003`, fonction `population_vers_niveau()`).
Navigation ajoutée dans la barre du haut ("Ma ville" / "Villes"), absente
depuis le Jalon 1.

**Pourquoi** : cahier des charges §3 (population et connexions) et §2
(évolution visuelle) — le cœur de la boucle "attirer des joueurs pour
faire grandir sa ville".

**Décisions prises en cours de route** :

1. **Découverte des villes à visiter** : liste simple (nom, pays,
   population), triée par population décroissante — tranché par Adrien
   plutôt qu'un bouton "ville au hasard". Le vrai classement (tri par
   colonne, pagination) arrive au Jalon 6.
2. **Seuils d'évolution visuelle, provisoires** : 0 (Hameau) dès la
   naissance, puis 5/15/30/60/120 habitants pour les niveaux 1 à 5.
   Choisis pour qu'une évolution soit visible avec une poignée de
   joueurs de test, pas calibrés sur un vrai volume de joueurs — cahier
   des charges §2 : "seuils à équilibrer pendant les tests"
   (`docs/DECISIONS.md` §10 point 2, toujours ouvert). Dupliqués dans
   `src/lib/game/niveauVille.ts` (source pour les tests unitaires) et
   `population_vers_niveau()` en SQL (autorité réelle, anti-triche) —
   les deux fichiers se référencent l'un l'autre en commentaire.
3. **Anti-triche** : comme au Jalon 1, aucune policy RLS d'écriture sur
   `visites` pour le client — tout passe par `visiter_ville()` (clé
   service_role), qui refuse aussi de se visiter soi-même et applique
   l'unicité (visiteur, ville, jour) par contrainte SQL, pas par de la
   logique applicative contournable.
4. **"Jour" = jour calendaire UTC**, pas le fuseau horaire du joueur.
   Simplification délibérée pour le MVP ; à reconsidérer si des joueurs
   dans des fuseaux très éloignés trouvent la limite de minuit injuste.
5. **`activité` non touchée à ce jalon** : le Jalon 2 du `ROADMAP.md` ne
   parle que de population et de niveau visuel ; le champ `activite` de
   `cities` reste à 0 jusqu'à un jalon qui le définira précisément
   (candidat naturel : agrégation pays du Jalon 7, cahier des charges §9).

**Bug trouvé en écrivant la page** (avant même de la tester) : `/villes`
ne vérifiait pas que le visiteur avait déjà un profil (`public.users`) —
un compte fraîchement créé sans ville pouvait afficher la page et cliquer
"Visiter", provoquant une violation de clé étrangère silencieuse côté
serveur (l'action avalait l'erreur). Corrigé en ajoutant la même
redirection que `/ville` vers `/ville/creer` quand le profil n'existe
pas. Trouvé en testant manuellement avec un compte créé directement via
l'API admin Supabase (sans passer par le formulaire d'inscription) —
scénario qu'aucun test automatisé ne couvrait puisque les comptes de
test du Jalon 1 et du Jalon 2 passent tous par `creer_ville()`.

**Autre point d'attention noté en testant** : lancer deux serveurs
`npm run dev` en parallèle sur le même dossier `.next` (le serveur de
prévisualisation de Claude Code + celui que Playwright essaie de
démarrer si le premier n'est pas détecté à temps) corrompt le cache de
build et provoque des 404 sur toutes les routes. Pas un bug du projet,
mais à savoir pour les prochains jalons : toujours arrêter le serveur de
prévisualisation avant de lancer `npm run test:e2e` en ligne de commande.

**Ce qui a été testé** : `tests/unit/niveauVille.test.ts` étendu
(`niveauPourPopulation` : valeur de naissance, juste avant/juste au
seuil pour chaque niveau, plafond à Métropole, sabotage population
négative ou non entière). `tests/e2e/jalon2-grandir-grace-aux-autres.spec.ts` :
parcours réel (connexion → visite → +1 population → "déjà visitée" au
rechargement), plus deux tests de sabotage au niveau de la fonction SQL
directement : auto-visite refusée, double visite le même jour refusée
(deuxième appel : `23505`, population +1 seulement), et franchissement
réel du seuil du niveau 1 avec 4 visiteurs distincts. `npm run build`,
`npm run lint` et la suite complète (`npm test` + `npm run test:e2e`,
14 tests unitaires + 6 tests e2e) passent contre le projet Supabase réel.

**Vérification rouge par sabotage** : voir ci-dessus — auto-visite,
double visite le même jour, population négative/non entière, niveau
hors plage. Cinq cas de sabotage au total pour ce jalon.

---

### Jalon 3 — peser socialement — 23/09/2026

**Ce qui a été fait** : sur la page `/villes` (Jalon 2), un deuxième
bouton "Influencer" à côté de "Visiter" — +1 influence à une autre
ville, avec un quota affiché en haut de page ("Actions d'influence
restantes aujourd'hui : x/5"). Migration `0004` (table
`actions_influence`, fonction `influencer_ville()`).

**Pourquoi** : cahier des charges §4 — "chaque joueur dispose de 5
actions d'influence par jour. Une action permet d'influencer une autre
ville."

**Décisions prises en cours de route** :

1. **Une fois par ville et par jour, comme les visites** — tranché par
   Adrien plutôt que de permettre de concentrer les 5 actions sur une
   seule ville. Même mécanisme anti-abus que `visiter_ville()` : la
   contrainte unique `(joueur_id, ville_id, jour)` empêche de cibler
   deux fois la même ville le même jour ; le quota de 5 (compté, pas de
   contrainte SQL simple possible pour un total) est vérifié dans
   `influencer_ville()` avant l'insertion.
2. **Auto-influence refusée** : le cahier des charges dit littéralement
   "influencer *une autre* ville" — pas d'ambiguïté à signaler ici,
   contrairement à la règle "une fois par ville et par jour" (point 1)
   qui, elle, n'était pas explicite pour l'influence.
3. **Limite connue et acceptée sur le quota** : la vérification
   (compter les actions du jour, puis insérer) n'est pas verrouillée
   entre les deux étapes — un même joueur cliquant vraiment
   simultanément (deux onglets, script) pourrait dépasser 5 de
   quelques unités. Risque jugé négligeable pour un clic humain normal ;
   documenté dans la migration `0004` elle-même, à revoir si ça devient
   un vecteur de triche observé en pratique.
4. **Colonne "Influence" ajoutée au tableau `/villes`** (population
   déjà affichée depuis le Jalon 2) : cohérent avec l'affichage
   existant, aide à décider qui influencer.

**Ce qui a été testé** : `tests/e2e/jalon3-peser-socialement.spec.ts` —
parcours réel (connexion → influencer → +1 influence → compteur de
quota qui descend → "déjà influencée" qui tient au rechargement), plus
sabotage au niveau de la fonction SQL directement : auto-influence
refusée, et quota de 5 réellement bloquant à la 6e ville différente
(vérifié avec 6 cibles distinctes, pas juste 6 appels sur la même,
puisque la règle est justement "une fois par ville"). `npm run build`,
`npm run lint` et la suite complète (`npm test` + `npm run test:e2e`,
14 tests unitaires + 8 tests e2e) passent contre le projet Supabase réel.

**Vérification rouge par sabotage** : auto-influence, 6e action du jour
sur une 6e ville distincte (quota). Deux cas de sabotage pour ce jalon,
en plus des cinq déjà couverts par les jalons précédents et toujours
protégés (aucun test supprimé).

---

### Jalon 4 — rivalités de quartier — 23/09/2026

**Ce qui a été fait** : trois actions AntiVille (grève, contamination,
propagande) sur la page `/villes`, avec quota quotidien (3/jour, tous
types et cibles confondus) et protection anti-harcèlement dégressive
par paire (attaquant, cible) sur une fenêtre glissante de 24h — 1re
attaque = effet plein, 2e = effet réduit de moitié, 3e et suivantes =
bloquées. Migrations `0005` et `0006` (correctif, voir plus bas).

**Pourquoi** : cahier des charges §5 — créer des rivalités entre villes
sans guerre militaire à l'intérieur d'un pays, avec la protection
progressive explicitement exigée pour qu'une ville ne puisse pas être
bloquée en permanence par un seul joueur.

**Adrien a explicitement délégué les paramètres d'équilibrage** à
Claude Code ("tranche selon tes reco" — `GUIDE-METHODE.md` §3), après
avoir écarté deux autres options (donner les chiffres lui-même,
réduire la portée à une seule action). Raisonnement complet des choix
tranchés à sa place, pour qu'il puisse les contester d'un mot :

1. **Quota AntiVille : 3 actions/jour**, plus bas que le quota
   d'influence (5/jour, Jalon 3). Choix délibéré : les actions
   AntiVille sont négatives pour la cible, un quota plus bas limite la
   toxicité potentielle du jeu sans l'empêcher.
2. **Protection dégressive par paire (attaquant, cible), tous types
   d'action confondus**, sur une fenêtre glissante de 24h (pas un jour
   calendaire UTC comme les autres quotas — une vraie "récupération"
   progressive, cohérente avec le mot du cahier des charges). Le cahier
   des charges mentionne aussi une protection liée à "la fréquence des
   attaques reçues" en général, tous attaquants confondus : **non
   implémentée à ce jalon**, simplification assumée et documentée dans
   la migration `0005` — seule la version "même attaquant" (l'exemple
   de principe donné par le cahier des charges) est couverte. Point
   ouvert pour un jalon futur si une ville se retrouve harcelée par
   plusieurs joueurs coordonnés.
3. **Contamination : perte proportionnelle (10% de la population,
   minimum 1 au plein effet)**, population jamais sous 1 — respecte la
   contrainte fondatrice §1 point 4 ("jamais de destruction permanente
   d'une ville"). À effet réduit (protection), la perte peut arrondir à
   0 pour une petite ville : assumé, ça revient à une immunité de fait
   une fois la ville déjà protégée.
4. **Propagande : -2 influence au plein effet**, jamais sous 0.
5. **Grève : bloque la réception d'influence pendant 24h au plein
   effet (12h à effet réduit)**, pas de blocage de la production
   (l'influence ne se "produit" pas passivement dans le jeu actuel,
   elle vient uniquement des actions "Influencer" des autres joueurs —
   bloquer la réception couvre donc tout le mécanisme existant).
   Implémenté comme un état temporaire (`cities.greve_jusqua`), pas un
   malus instantané comme les deux autres actions — `influencer_ville()`
   (Jalon 3) a dû être redéfinie pour vérifier cet état.
6. **Retour visible du résultat de chaque action** (réussie / effet
   réduit / bloquée par la protection / quota atteint), contrairement à
   `visiterVille`/`influencerVille` qui absorbent silencieusement leurs
   cas "normaux" : se faire bloquer par la protection anti-harcèlement
   est un événement que le joueur doit comprendre, pas une erreur à
   cacher.

**Bug trouvé en vérifiant contre le projet réel** : un `RAISE EXCEPTION`
sans `using errcode` prend par défaut le code `P0001` en PL/pgSQL —
exactement le code choisi à la main pour "quota atteint". Une ville
introuvable, une auto-attaque ou un type d'action invalide étaient donc
tous rapportés côté client comme "quota atteint" au lieu d'une vraie
erreur, puisque `src/app/villes/actions.ts` ne distingue que sur
`error.code`. Trouvé en testant `lancer_action_antiville()` avec un id
de ville bidon via `curl` directement contre le projet réel (pas par un
test automatisé — aucun des tests ne vérifiait le code exact de
l'erreur d'auto-attaque, seulement qu'une erreur existait). Corrigé par
la migration `0006`, qui donne un code dédié à chaque cas (`P0004`
ville introuvable, `P0005` auto-cible, `P0006` type invalide, `P0007`
non autorisé) et documente le registre complet des codes utilisés.
Les tests des Jalons 3 et 4 ont été renforcés pour vérifier le code
exact de l'erreur d'auto-cible, afin que cette régression précise ne
puisse plus repasser inaperçue.

**Autre point d'attention noté en testant** : un test Playwright qui
expire (timeout) peut sauter l'exécution de son bloc `finally`, donc ne
pas nettoyer les comptes de test qu'il avait créés — c'est arrivé
pendant la vérification de ce jalon (deux comptes `*-antiville-*`
laissés dans le projet Supabase réel avant que la migration `0005` n'y
soit appliquée, nettoyés à la main). À garder en tête pour les jalons
suivants : après un run e2e qui a timeout, vérifier
`auth.users` avant de relancer.

**Ce qui a été testé** :
`tests/e2e/jalon4-rivalites-de-quartier.spec.ts` — propagande réelle
via l'UI (influence réduite, visible dans le tableau), grève qui bloque
bien une tentative d'influence d'un tiers, contamination qui ne fait
jamais tomber une ville à 0 habitant, la courbe complète de protection
(1re attaque pleine, 2e réduite, 3e bloquée avec le code `P0003`), et
le quota de 3 réellement bloquant à la 4e cible avec le code `P0001`.
Tests des Jalons 3 et 4 renforcés sur le code exact de l'erreur
d'auto-cible (voir bug ci-dessus). `npm run build`, `npm run lint` et
la suite complète (`npm test` + `npm run test:e2e`, 14 tests unitaires
+ 13 tests e2e) passent contre le projet Supabase réel, migrations
`0005` et `0006` appliquées.

**Vérification rouge par sabotage** : contamination sur une ville à
population 1 (ne doit jamais atteindre 0), auto-attaque, protection
anti-harcèlement à la 3e attaque, quota à la 4e action. Quatre cas de
sabotage pour ce jalon, en plus des sept déjà couverts par les jalons
précédents et toujours protégés (aucun test supprimé).

---

### Jalon 5 — villes jumelles — 23/09/2026

**Ce qui a été fait** : proposer un jumelage à une autre ville depuis
`/villes`, l'accepter ou le refuser depuis une nouvelle page
`/jumelages` (qui liste aussi les jumelages actifs et les demandes
envoyées, avec un bouton "Annuler" pour y mettre fin), bonus quotidien
de +1 population aux deux villes quand les deux joueurs ont été actifs
le même jour. Migration `0007` (tables `jumelages` et `jumelage_bonus`,
fonctions `proposer_jumelage()`, `repondre_jumelage()`,
`annuler_jumelage()`, `reclamer_bonus_jumelages()`).

**Pourquoi** : cahier des charges §6 — créer de vraies relations entre
joueurs, "sans transformer le système en gestion complexe."

**Le nombre de jumelages actifs était un point ouvert explicite**
(`DECISIONS.md` §10 point 3, qui prévoyait déjà la délégation) —
tranché par Claude Code dans le même esprit que le Jalon 4 :

1. **3 jumelages actifs maximum par ville**, revérifié à la fois côté
   proposant (à la proposition) et côté cible (à l'acceptation, au cas
   où sa situation aurait changé entre-temps). Même ordre de grandeur
   que le quota AntiVille, pour rester cohérent et éviter la "gestion
   complexe" que le cahier des charges veut éviter.
2. **Une seule relation en_attente/actif à la fois entre deux villes
   données**, dans un sens ou l'autre — appliqué par un index unique
   partiel sur `(least(ville_a, ville_b), greatest(ville_a, ville_b))`,
   donc garanti même en cas de double clic ou de requêtes concurrentes
   (pas seulement vérifié côté application).
3. **Bonus : +1 population aux deux villes**, même ordre de grandeur
   qu'une visite (Jalon 2) — "petit bonus quotidien" au sens littéral du
   cahier des charges.
4. **Définition de "joueur actif"** : au moins une visite, une action
   d'influence ou une action AntiVille lancée ce jour-là (UTC) — pas de
   notion de connexion/login séparée, qui n'existe pas encore dans le
   jeu. Simplification assumée et documentée dans la migration `0007`.
5. **Bonus accordé au chargement de `/ville` ou `/jumelages`**, pas par
   une tâche planifiée : le projet n'a aucune infrastructure de tâches
   en arrière-plan à ce stade (cohérent avec la contrainte "zéro coût,
   zéro infrastructure" — `DECISIONS.md` §1 point 1), et le cahier des
   charges n'exige pas un versement à une heure précise. La fonction
   SQL est idempotente (une ligne dans `jumelage_bonus` par jumelage et
   par jour) : le rappeler plusieurs fois le même jour ne redonne rien.
   Concession assumée : le bonus peut mettre du temps à apparaître si
   aucun des deux joueurs ne recharge une de ces deux pages après que
   les deux ont été actifs.

**Bug trouvé en écrivant les tests** (pas en vérifiant contre le projet
réel cette fois — trouvé avant même d'appliquer la migration) : dans
`proposer_jumelage()`, le quota (3 jumelages actifs) est vérifié avant
la tentative d'insertion, donc une proposition vers une ville déjà
jumelée alors que le quota est déjà plein renvoie "quota atteint"
(`P0008`) plutôt que "déjà jumelée" (`23505`) — les deux sont vraies
en même temps, mais un seul code peut être renvoyé. Pas corrigé (les
deux comportements sont défendables), mais le test de sabotage a été
réorganisé pour vérifier chaque cas séparément, sans les mélanger.

**Ce qui a été testé** : `tests/e2e/jalon5-villes-jumelles.spec.ts` —
parcours réel (proposer → accepter → bonus accordé, visible sur
`/jumelages` et reflété dans la population des deux villes → rappel du
bonus le même jour sans effet, idempotence vérifiée), et sabotage :
auto-jumelage refusé (`P0005`), double proposition vers une ville déjà
jumelée refusée (`23505`), quota de 3 jumelages actifs réellement
bloquant à la 4e ville (`P0008`). Vérifié aussi visuellement dans le
navigateur (proposer, recevoir, accepter). `npm run build`, `npm run
lint` et la suite complète (`npm test` + `npm run test:e2e`, 14 tests
unitaires + 15 tests e2e) passent contre le projet Supabase réel,
migration `0007` appliquée.

**Point d'attention noté en testant, qui s'aggrave avec le nombre de
jalons** : la flakiness du serveur de dev sous compilation à froid
(déjà notée au Jalon 2) devient plus visible à mesure que le nombre de
routes grandit (10 routes à ce jalon) — une suite e2e lancée juste
après `rm -rf .next` peut voir plusieurs tests échouer en parallèle la
première fois, simplement parce que Next.js compile chaque route à la
demande. Un deuxième passage (routes déjà compilées) suffit à confirmer
si c'est bien ça ou un vrai bug. Pas un problème pour la production
(le build de prod précompile tout), seulement pour les runs e2e locaux
répétés dans une même session de vérification.

**Vérification rouge par sabotage** : auto-jumelage, double proposition
vers une ville déjà liée, quota de 3 jumelages actifs. Trois cas de
sabotage pour ce jalon, en plus des onze déjà couverts par les jalons
précédents et toujours protégés (aucun test supprimé).

---

### Jalon 6 (couche données) — préparation du rendu 3D — 23/09/2026

**Ce qui a été fait** : ce jalon prépare les données pour le rendu 3D
temps réel décidé avec Adrien hors de cette session (§8) — le portage
du rendu lui-même vers Three.js est un jalon séparé ("Jalon 6bis"), vu
sa taille (§8 : prototype de ~2000 lignes de géométrie procédurale
WebGL bas niveau). Migration `0008` :
- Latitude/longitude/fuseau horaire (IANA) sur `countries`, pour 247
  pays sur 250 (générés via les paquets `world-countries` et
  `moment-timezone`, pas de dépendance à l'exécution).
- `population_max` sur `cities` : le record de population jamais
  atteint. `visiter_ville()`, `lancer_action_antiville()` et
  `reclamer_bonus_jumelages()` redéfinies pour le maintenir et calculer
  `niveau` à partir de lui, jamais de la population instantanée — une
  contamination fait baisser le chiffre affiché sans jamais faire
  régresser le niveau visuel.
- Nouveaux seuils de niveau : Métropole = 100 000 habitants (Village
  1 000, Bourg 5 000, Ville 15 000, Grande ville 40 000), en
  remplacement des seuils provisoires 5/15/30/60/120 du Jalon 2.
- `is_test` sur `users`/`cities` (avec contrainte : pseudo préfixé
  `test_` obligatoire si `is_test`), script
  `scripts/charger-villes-test.mjs` (idempotent — supprime puis
  recharge) qui a chargé les 24 villes et 8 jumelages de
  `supabase/seed/villes-de-test.json`, et un test opt-in
  (`VERIFIER_PROD=true`) qui vérifiera l'absence de données `is_test`
  une fois qu'un vrai environnement de production existera.

**Pourquoi** : cahier des charges §2 (évolution visuelle) et travail de
direction artistique mené par Adrien avec Claude chat/web (§8) — les
essais d'images 2D générées ont été jugés insuffisants, d'où le choix
d'une vraie 3D temps réel dans le navigateur.

**Décisions prises en cours de route** :

1. **Découpage du jalon en deux, proposé par Claude Code et accepté par
   Adrien** : porter fidèlement ~2000 lignes de géométrie procédurale
   vers Three.js est un chantier à part entière. Ce jalon ne livre que
   la couche données (testable et utile seule) ; le rendu proprement
   dit attend une session dédiée.
2. **Moteur 3D : Three.js**, tranché par Adrien (reco initiale de
   Claude chat) plutôt que garder le WebGL fait main du prototype —
   plus simple à faire évoluer, licence MIT, pas de coût. S'applique au
   jalon du rendu, pas à celui-ci.
3. **Rendu (et niveau) basés sur `population_max`, pas la population du
   moment** — Adrien n'avait pas de préférence tranchée et a laissé la
   reco initiale de Claude chat s'appliquer (§10 point 11, maintenant
   clos). Implémenté dès ce jalon pour `niveau`, avant même que le rendu
   3D existe, parce que la mécanique (contamination qui ne régresse
   jamais le niveau) est indépendante du rendu et se teste seule.
4. **Fuseau horaire "de la capitale" choisi à la main pour les pays
   multi-fuseaux les plus courants** (US, CA, RU, AU, BR, MX, MN, CL,
   PT, PF, ES) : `moment-timezone` renvoie sinon le premier fuseau par
   ordre alphabétique, pas forcément celui de la capitale (ex. sans
   cette liste, le Canada aurait hérité de `America/Atikokan`). Les
   pays multi-fuseaux non couverts par cette liste gardent le
   comportement par défaut (premier fuseau alphabétique) — simplification
   assumée, à corriger au cas par cas si un pays précis pose problème.
5. **Script de villes de test écrit en JavaScript simple (`.mjs`),
   exécuté par cette session** (contrairement aux migrations SQL, qui
   nécessitent le tableau de bord Supabase) : utilise directement
   `@supabase/supabase-js` avec la clé `service_role`, sans passer par
   les fonctions RPC du jeu (`creer_ville()` ne permet pas de fixer une
   population/influence arbitraire) — écriture directe dans `users` et
   `cities`, légitime ici puisque c'est un script d'administration, pas
   une action de joueur.
6. **`seed.jumelages` chargé dans la vraie table `jumelages`** (le
   Jalon 5 existe déjà) ; `seed.presidents_attendus` ignoré pour
   l'instant — le concept de président n'est pas encore implémenté
   (Jalon 10 du `ROADMAP.md` actuel), le champ attend ce jalon-là.
7. **`activite_7j` du JSON stocké tel quel dans `cities.activite`** —
   ce champ n'a pas encore de définition précise dans le jeu réel (voir
   Jalon 2 : "candidat naturel, agrégation pays du Jalon 8" avec la
   numérotation actuelle) ; import fait par avance pour que les villes
   de test soient déjà prêtes quand ce jalon arrivera.
8. **Le script "simuler N jours"** mentionné dans
   `GUIDE-METHODE.md` (section "Les villes de test") **n'existe pas
   encore** — décalage entre la description du guide (écrite avec
   Claude chat, en amont du travail réel) et ce qui a été implémenté
   jalon après jalon. Noté ici pour ne pas laisser le guide mentir sans
   le signaler ; pas dans la portée de ce jalon.

**Ce qui a été testé** : `tests/e2e/jalon6-donnees-rendu-3d.spec.ts` —
`population_vers_niveau()` sur les 11 points limites des nouveaux
seuils, une contamination qui ne fait régresser ni `population_max` ni
`niveau` sur une ville poussée à 5 200 habitants, géo/fuseau présents
pour les 6 pays du scénario de test, et la contrainte `is_test` +
pseudo `test_` réellement appliquée par la base. Le test de
`niveauVille.test.ts` du Jalon 2 qui vérifiait un franchissement de
seuil avec de vrais visiteurs a été adapté : avec Métropole à 100 000,
atteindre un seuil avec des comptes de test un par un n'est plus
praticable, remplacé par une vérification directe de la fonction SQL
(bien plus rapide, et c'est elle l'autorité réelle). Chargement réel
des 24 villes de test vérifié (niveaux corrects, jumelages avec le bon
statut, affichage correct sur `/villes` dans le navigateur). `npm run
build`, `npm run lint` et la suite complète (`npm test` + `npm run
test:e2e`, 14 tests unitaires + 2 ignorés + 19 tests e2e) passent
contre le projet Supabase réel, migration `0008` appliquée.

**Vérification rouge par sabotage** : les 11 seuils de
`population_vers_niveau()`, contamination sans régression de
`population_max`/`niveau`, contrainte `is_test`/pseudo. Quatorze cas de
sabotage au total depuis le début du projet, tous toujours protégés
(aucun test supprimé).

---

### Jalon 6bis — le rendu 3D — 23/09/2026

**Ce qui a été fait** : la page `/ville` affiche désormais la ville en
3D temps réel, portée du prototype `docs/prototypes/prototype-ville-3d.html`
(~2000 lignes de géométrie procédurale WebGL bas niveau) vers **Three.js**
(décision d'Adrien, `DECISIONS.md` §10 point 12), branchée sur les
vraies données : identité stable de la ville (l'id sert de graine —
toujours la même ville, jamais recalculée au hasard), `population_max`
(maisons → immeubles → tours, jamais de régression visuelle après une
contamination — voir Jalon 6), soleil à l'heure réelle du pays de la
ville (latitude/longitude/fuseau déjà en base depuis le Jalon 6).
Nouveaux modules `src/lib/ville3d/` (géométrie, bâtiments, terrain,
occlusion ambiante, shaders, scène Three.js) et
`src/lib/game/soleilVille.ts` (position du soleil, pur et testable,
dans le même esprit que `niveauVille.ts`). Composant `VilleScene`
(client) monté dans `/ville`.

**Pourquoi** : direction artistique décidée par Adrien avec Claude
chat/web (`DECISIONS.md` §8) — les essais d'images 2D générées ont été
jugés insuffisants ("pas assez réaliste"), d'où le choix d'une vraie 3D
temps réel dans le navigateur, dans l'esprit de l'ancien MiniVille
(Motion Twin).

**Portage, pas réécriture** : la quasi-totalité de la logique de
génération du prototype (grille de rues, maisons, immeubles, gratte-ciel
avec grue de chantier, cours communes, parkings, campagne alentour,
occlusion ambiante précalculée) et le shader de matériaux procéduraux
(fenêtres éclairées la nuit, tuiles, vitrages réfléchissants, chaussée
marquée, ciel avec disque solaire, brouillard, tonemapping ACES) sont
repris **tels quels**, juste traduits en TypeScript et branchés sur
Three.js plutôt que sur des appels WebGL bruts. Aucune règle de
génération n'a été réinventée : c'est un vrai portage, vérifié
fonctionnellement identique par un test de non-régression
(`tests/unit/ville3dGenerer.test.ts`, déterminisme comparé
sommet par sommet).

**Adaptations assumées par rapport au prototype** (voir aussi les
commentaires dans `src/lib/ville3d/shaders.ts` et `scene.ts`) :

1. **Ombres : `sampler2D` + comparaison manuelle plutôt que
   `sampler2DShadow` + comparaison matérielle.** Le prototype utilisait
   le mode de comparaison natif de WebGL2 pour un PCF matériel ; Three.js
   n'expose pas simplement ce mode via `WebGLRenderTarget`/`DepthTexture`.
   Même algorithme (12 échantillons Poisson), juste la comparaison
   profondeur faite à la main dans le shader plutôt que par le matériel.
   Résultat visuel équivalent, vérifié à l'œil dans le navigateur.
2. **Caméra et interactions (glisser/zoomer/déplacer) réimplémentées
   avec les primitives Three.js** (`OrthographicCamera`,
   `camera.lookAt()`) plutôt que la matrice `lookAt`/`ortho` manuelle du
   prototype — Three.js fait ce travail nativement, c'est tout l'intérêt
   du choix de bibliothèque. Le comportement (azimut/élévation autour
   d'une cible, cadrage automatique selon l'étendue de la ville,
   pincement tactile) est identique.
3. **Pas de vue "autre ville en 3D" depuis `/villes`** : ce jalon couvre
   ce que `ROADMAP.md` demandait explicitement ("la page de ville
   affiche la ville en 3D") — voir sa propre ville, pas celle des
   autres. Ajouter un aperçu 3D des autres villes est un possible
   raffinement futur, pas oublié, juste hors de portée ici.
4. **Repli France (46,6 / 2,35 / Europe/Paris) si le pays de la ville
   n'a pas de géo renseignée** — 3 pays sur 250 seulement (Jalon 6),
   défendable pour ne pas bloquer le rendu sur une donnée manquante rare.

**Bug trouvé en testant, pas dans le rendu lui-même** : sous forte
concurrence (8 workers Playwright simultanés), plusieurs tests
échouaient de façon reproductible en restant bloqués sur `/connexion`
— pas un problème de connexion, mais `/ville` (désormais ~150 Ko de
JS rien que pour cette route, tout Three.js compris) qui met trop
longtemps à compiler à la demande quand plusieurs requêtes la
sollicitent en même temps pour la première fois. Limiter à 2 workers
(au lieu de la valeur par défaut, ici 7-8) résout le problème une fois
la route déjà compilée une fois — corrigé à la racine plutôt que
documenté comme rappel : `playwright.config.ts` fixe maintenant
`workers: 2`, en plus du réflexe déjà connu (arrêter le serveur de
prévisualisation avant de lancer les tests, `rm -rf .next` en cas de
doute).

**Ce qui a été testé** : `tests/unit/ville3dAleatoire.test.ts` (le
hasard déterministe qui garantit l'identité stable des villes),
`tests/unit/soleilVille.test.ts` (position du soleil : élévation nette
à midi solaire vs minuit, azimut est le matin/ouest le soir, bornes
exactes des catégories jour/nuit), `tests/unit/ville3dGenerer.test.ts`
(déterminisme sommet par sommet, triangles toujours valides, plus de
population donne plus de blocs actifs et de sommets, pas d'exception
aux bornes population=0 et très grande population, un gratte-ciel
n'apparaît qu'au-delà du seuil du niveau Ville). `tests/e2e/jalon6bis-rendu-3d.spec.ts` :
la page `/ville` réelle affiche un canvas qui peint vraiment des pixels
(pas une image transparente vide) et ne produit aucune erreur console.
Vérifié aussi à l'œil dans le navigateur : arbres, maison avec fenêtres
éclairées la nuit (l'heure réelle à Paris au moment du test était
21h49, donc nuit — confirmé cohérent avec le calcul de position du
soleil), glisser pour tourner la caméra. `npm run build`, `npm run
lint` et la suite complète (`npm test` + `npm run test:e2e`,
17 tests unitaires + 2 ignorés + 20 tests e2e) passent contre le projet
Supabase réel.

**Vérification rouge par sabotage** : aucun cas de sabotage spécifique
à ce jalon — le rendu 3D n'affecte ni score, ni ressources, ni
anti-triche (il ne fait qu'afficher `population_max`, déjà protégée par
les sabotages du Jalon 6). Le test de non-régression du portage
(comparaison sommet par sommet entre deux générations) joue un rôle
équivalent pour ce jalon : toute dérive accidentelle du portage casserait
ce test plutôt qu'une règle de jeu.

---

*(Les jalons suivants migrent ici au fur et à mesure, depuis
`ROADMAP.md`, avec : ce qui a été fait, pourquoi, ce qui a été testé, le
compte de vérification par sabotage, et les bugs trouvés en route.)*

---

### Corrections post-Jalon 6bis — 23/09/2026

Trouvées en testant le rendu 3D sur le téléphone d'Adrien (`teste sur
mon téléphone`), corrigées dans la foulée (pas de nouveau jalon, juste
des bugs sur du code déjà livré) :

1. **Barre de nav débordait sur mobile.** `tailwind.config.ts` ne
   scannait que `src/app/**` et `src/lib/**` — `src/components/**` en
   était absent depuis le début du projet. Résultat : toute classe
   Tailwind utilisée *seulement* dans un composant de `src/components/`
   (ici `flex-wrap`/`whitespace-nowrap` ajoutés à `Nav.tsx`) n'était
   jamais générée dans le CSS final, silencieusement (pas d'erreur, la
   classe est juste absente du bundle). Corrigé en ajoutant
   `./src/components/**/*.{js,ts,jsx,tsx,mdx}` aux `content` globs. Bug
   latent qui aurait pu ressurgir sur n'importe quel futur composant, pas
   spécifique à ce jalon.
2. **Ciel/fond délavé en gris-bleu au lieu du bleu nuit (ou du vert
   prairie de jour).** Le shader (`shaders.ts`) fait tout le pipeline
   colorimétrique à la main (linéarisation, ACES, gamma 1/2.2) — c'est
   volontaire, à l'identique du prototype WebGL2 porté. Mais la couleur
   d'effacement (`renderer.setClearColor`, le ciel/brouillard) passe par
   `new THREE.Color(...)`, et Three.js applique automatiquement *sa
   propre* gestion des couleurs dessus (elle suppose une couleur linéaire
   et la ré-encode en sRGB) sans savoir qu'elle était déjà encodée par le
   shader — double encodage gamma, qui éclaircit et désature
   spécifiquement le fond (environ 94 % de l'image à l'écran vu le
   cadrage large observé). Les objets réels (arbres, bâtiments), dessinés
   par le shader lui-même, n'étaient pas affectés — d'où des arbres verts
   normaux sur un fond gris-bleu délavé. Diagnostiqué en calculant à la
   main la couleur attendue (`docs/DECISIONS.md`, position du soleil via
   `soleilVille.ts`) puis en la comparant aux pixels réellement affichés
   (lecture directe du canvas). Corrigé par une ligne dans `scene.ts` :
   `renderer.outputColorSpace = THREE.LinearSRGBColorSpace` (égale à
   l'espace de travail interne de Three.js, donc aucune conversion n'est
   appliquée — le shader garde la main sur 100 % du pipeline couleur,
   comme prévu).

   **Rectificatif du 24/09/2026** : ce double encodage était réel et la
   correction reste valable (la couleur du ciel est maintenant exacte),
   mais ce n'était **pas** la cause de "l'herbe est grise". Les ~94 % de
   "fond" mesurés ici étaient justement le signe que le sol n'était pas
   dessiné du tout — mal interprété sur le moment. Vraie cause et
   correction : voir le journal du Jalon 7, "Correction post-recette :
   le sol n'était pas dessiné".

**Vérification** : suite unitaire complète (33 tests) et `tsc --noEmit`
repassés après les deux corrections, tous verts. Pas de vérification par
sabotage — bugs purement visuels, aucun impact sur score/anti-triche.

Point encore ouvert trouvé pendant ce même test : `DECISIONS.md` §10
point 14 (halo de lampadaire qui semblerait traverser les bâtiments).

---

### Jalon 7 — Un jeu agréable à regarder — 24/09/2026

**Contexte et réordonnancement.** L'ancien Jalon 7 "Se classer" est devenu
le Jalon 8 : une note de passage de relais (`docs/A-INTEGRER.md`, déposée
par une session Claude chat/Cowork le 23/09/2026 au soir, avec une
maquette cliquable `docs/prototypes/maquette-ecrans.html`) proposait de
faire d'abord la refonte visuelle de toutes les pages. Adrien a tranché
pour cet ordre le 23/09/2026 (§10 point 15).

**Ce qui a été fait** : toutes les pages du jeu reskinnées selon la
maquette validée — accueil, connexion, inscription, création de ville
(avec aperçu 3D en direct du nom tapé), Ma ville, Villes, Jumelages,
navigation. Nouveau système visuel porté depuis la maquette dans
`src/app/globals.css` (jetons de couleur clair/sombre via
`prefers-color-scheme`, panneaux vitrés flous, panneau d'entrée
d'agglomération pour les noms de ville, typographie Barlow/Barlow
Condensed via `next/font/google`). La scène 3D du Jalon 6bis est
maintenant **unique et persistante** dans `src/app/layout.tsx`
(`src/components/SceneVilleFond.tsx`, un contexte React) plutôt que
recréée à chaque page : les pages serveur annoncent juste "voici la ville
à afficher" via `src/components/SincroniserScene.tsx`, ce qui évite de
reconstruire le contexte WebGL à chaque navigation et permet à la caméra
de rester stable. La page Villes devient une liste classée + panneau de
détail (visite/influence/AntiVille/jumelage inchangés en logique, juste
reskinnés), avec bascule liste/détail en un seul panneau sur mobile.

**Classement minimal inclus** (nécessaire à l'affichage, pas le Jalon 8
complet) : tri de la liste par population, badge de rang ("3ᵉ de
France"/"3rd in France" — `src/lib/game/ordinal.ts`) et badge "Président"
(n°1 de son pays), tous deux calculés à la volée sur `population`
courante, pas `population_max`. Le Jalon 8 pourra ajouter un mondial et
une page dédiée par-dessus cette base.

**Explicitement exclu de ce jalon** (voir §10 points 16 et 17) :
- Le système de développement des villes (7 activités, jauges, maire,
  mégaprojets, "Simuler 30 jours") présent dans la maquette mais non
  validé par Adrien — la maquette reste une proposition de design, pas
  une spécification à coder telle quelle.
- Le "Bulletin municipal" (journal quotidien des événements de la ville)
  et le lien de partage personnalisé ("Fais grandir ta ville") : tous
  deux demanderaient un nouveau modèle de données (une table
  d'événements, un mécanisme d'invitation anonyme) qui n'existe pas —
  plutôt qu'une fausse façade, ces deux "clins d'œil" sont reportés à un
  jalon qui les spécifie vraiment.
- La ville qui grandit sans limite (`docs/A-INTEGRER.md` §2) : reportée
  au Jalon 7bis (scission volontaire, même logique que 6/6bis — c'est un
  changement du générateur 3D indépendant de la refonte visuelle).

**Bug trouvé en cours de route (pas dans le nouveau code, latent depuis
le Jalon 1)** : `owner:users(pseudo)` dans la requête de la page Villes
échouait silencieusement (`data: null`, donc "Aucune ville ne
correspond." pour tout le monde) — `cities` a deux relations de clé
étrangère vers `users` (`owner_id` et `city_id` en sens inverse),
PostgREST refuse d'embarquer sans préciser laquelle. Corrigé avec
`owner:users!cities_owner_id_fkey(pseudo)`, et une erreur de requête sur
cette page journalise désormais côté serveur au lieu d'échouer
silencieusement.

**Tests.** Unitaires nouveaux, purs et déterministes :
`tests/unit/ordinal.test.ts` (suffixes fr/en, y compris l'exception
11/12/13 "th" en anglais), `tests/unit/ligneLocale.test.ts` (jour/nuit/
lever/coucher selon l'heure et la position réelle du soleil, cf. Jalon
6bis), et l'ajout de `progressionNiveau()` dans
`tests/unit/niveauVille.test.ts` (pourcentage vers le seuil suivant,
jamais à 0 % pile au seuil, 100 % au niveau maximal). E2e : les parcours
UI des Jalons 2 à 5 ont dû être adaptés (la page Villes n'est plus un
`<table>` mais une liste + panneau de détail — cliquer une ville ouvre le
détail où vivent maintenant les boutons d'action, avant de rester "à
demeure" sur chaque ligne). Comportement vérifié inchangé : mêmes RPC
appelées, mêmes quotas, mêmes messages ; seuls les sélecteurs de test ont
changé. Suite complète (`npm test` + `npm run test:e2e`, 47 tests
unitaires + 20 tests e2e) verte, deux fois de suite. Vérifié aussi à
l'œil dans le navigateur, poste et mobile : accueil, connexion,
inscription, création avec aperçu 3D en direct, Ma ville, Villes (liste,
sélection, actions réelles testées avec des comptes jetables), Jumelages.

**Vérification rouge par sabotage** : aucune, ce jalon ne touche à
aucune règle de jeu sensible (score/ressources/anti-triche) — seule la
présentation change ; les fonctions SQL et actions serveur qui portent la
vraie logique sont inchangées. Le classement (rang/président) est un
calcul d'affichage pur (compte de lignes), sans écriture, donc pas de
surface à saboter.

**Correction post-recette (24/09/2026)** : Adrien a testé et signalé
qu'il ne pouvait plus tourner/zoomer/déplacer la caméra sur aucune page.
Cause : `.screen` (le conteneur de page, transparent, posé par-dessus le
canvas 3D plein écran) capturait tous les clics/molette de tout l'écran
avant qu'ils n'atteignent le canvas en dessous — la maquette avait
`pointer-events: none` sur cet élément (et `auto` seulement sur les
panneaux vitrés), règle perdue au moment du portage. Corrigé dans
`globals.css`. Reproduit et vérifié avec un compte jetable amené
artificiellement à l'échelle Métropole (~97 000 habitants, non testée
avant ce signalement — les jalons précédents n'avaient vérifié le rendu
qu'à l'échelle Hameau) : rotation/zoom fonctionnent de nouveau.

**Correction post-recette : le sol n'était pas dessiné (24/09/2026) —
la vraie cause de "l'herbe est grise" et des "bâtiments pas finis".**
Le prototype WebGL2 désactive le culling (`gl.disable(gl.CULL_FACE)`),
et les quads horizontaux produits par `geometrie.ts` (prairie, routes,
trottoirs, parcelles, toits plats) sont enroulés face vers le bas. Le
port Three.js gardait le culling par défaut de Three.js (`FrontSide`) :
tous ces quads étaient éliminés avant d'être dessinés. On voyait donc la
couleur de fond à la place du sol ("l'herbe est grise", "les routes sont
grises") et les tours n'avaient plus de toit — seuls les contours des
hélipads flottaient au-dessus ("les bâtiments ne sont pas finis", "pas
3D comme la maquette"). Bug présent depuis le Jalon 6bis. **Trouvé et
corrigé par Adrien** : `side: THREE.DoubleSide` sur le matériau principal
et sur celui de la passe d'ombres (`scene.ts`), soit le même rendu que
le prototype.

Ce que ma propre investigation avait conclu à tort : j'avais comparé
avec la maquette ouverte dans le navigateur, vérifié la palette, les
uniformes d'éclairage et le calcul ACES/gamma pixel par pixel, et conclu
"pas de bug, c'est la direction artistique" — alors que la mesure clé
était sous mes yeux : ~92 % des pixels d'un hameau exactement à la
couleur de fond, c'est-à-dire rien de dessiné, pas un sol délavé. J'avais
formulé l'hypothèse "géométrie absente" puis l'avais écartée en lisant
que la prairie couvre ±1 800 m, sans penser au culling. Les quelques
milliers de pixels de chaussée "corrects" trouvés venaient de surfaces
non éliminées (faces latérales, trottoirs en boîtes). Leçon : quand la
couleur mesurée est *exactement* celle du fond, chercher d'abord pourquoi
la géométrie n'est pas dessinée (culling, profondeur, clipping) avant de
remettre en cause l'éclairage. Les explications précédentes de ce
journal (brouillard à l'échelle Métropole, ciel sans dégradé, densité
urbaine) sont donc à ignorer pour ce symptôme.

**Test de non-régression** (`tests/e2e/jalon6bis-rendu-3d.spec.ts`, "le
sol est bien dessiné") : heure figée à midi en France
(`page.clock.setFixedTime`, pour que l'herbe soit franchement verte quel
que soit le moment où la suite tourne), hameau fraîchement créé, puis
part des pixels nettement verts dans le carré central 40 % × 40 % du
canvas. Mesuré : ~58 % avec le sol dessiné, ~9 % (les arbres seuls) sans
— seuil fixé à 25 %. **Vérification rouge par sabotage** : `side` remis à
`FrontSide` sur le matériau principal → le test échoue (8,6 % mesuré),
puis passe de nouveau une fois `DoubleSide` rétabli.

**Deuxième correction post-recette, contrainte "application légère"
(§1 point 6, ajoutée le même jour).** En relisant `docs/A-INTEGRER.md`
après la première correction, découverte que ce jalon enfreignait la
contrainte de poids qui venait d'y être ajoutée : la scène 3D
(Three.js) était importée directement dans `src/app/layout.tsx`,
donc chargée dans le paquet initial de **toutes** les pages — mesuré
avec `next build` (le seul qui compte, `.next/` après `npm run dev` ne
veut rien dire) : 256-264 Ko de JS au premier chargement de `/`,
`/ville`, `/villes`, `/jumelages`, contre un budget de 500 Ko pour toute
l'appli. Corrigé en séparant le vrai canvas Three.js
(`src/components/CanvasVilleInterne.tsx`, nouveau) du contexte React qui
l'entoure (`SceneVilleFond.tsx`, inchangé pour les pages) et en chargeant
le premier avec `next/dynamic(..., { ssr: false })` — le texte de chaque
page s'affiche donc immédiatement, la 3D arrive juste après en tâche de
fond. Après correction : 104-113 Ko sur ces mêmes pages. Les appels à
`definirVille()` reçus avant que le canvas ne soit monté sont mémorisés
et rejoués dès qu'il l'est (pas de perte d'état). Suite complète
(47 tests unitaires + 20 tests e2e, dont la vérification que le canvas
peint bien des pixels) repassée après cette correction, verte.

---

### Jalon 7bis — la ville continue de grandir — 24/09/2026

**Ce qui a été fait** : portage dans le générateur Three.js de la
croissance sans limite déjà écrite dans le prototype mis à jour
(`docs/prototypes/prototype-ville-3d.html`, demande d'Adrien consignée
dans `docs/A-INTEGRER.md` §2). Les 16 premiers blocs s'ouvrent exactement
aux mêmes seuils qu'avant (`BLOCK_OPEN`, jusqu'à 40 000 habitants), puis
un bloc de plus tous les 5 000 habitants, sans plafond, toujours du
centre vers l'extérieur (`openAtK`, `constantes.ts`). Les blocs sont
repérés par des entiers relatifs au croisement central
(`blockX0(b) = 8 + 80·b`, rues sur x = 80·k) au lieu de la grille fixe
de 4 × 4. Chaque nouveau bloc suit la même vie (maisons, immeubles, puis
chantier de gratte-ciel au plus tôt 12 000 habitants après son ouverture,
`towerAtK`) ; les tours des blocs lointains plafonnent à 14 étages (le
centre reste le plus haut). Les deux grands axes traversent toute la
ville et repartent en routes de campagne depuis son bord réel ; les
forêts ont des positions fixes par ville et s'effacent là où la ville
s'étend.

Tout ce qui était réglé pour une ville de 168 m de demi-côté suit
désormais le **rayon réel de la ville** (`stats.cityR`, plancher
`CITY_R_MIN` = 168) : champs cultivés et brouillard dans le shader
(`uCityR`), emprise et finesse de la carte d'occlusion au sol
(`dimensionsAO` : ville + 40 m, texture 1024² au-delà de 300 m), cadre de
la caméra des ombres, distance et limites de zoom/déplacement de la
caméra. Fidèle au prototype, à une exception près : son `CITY_R` était
une variable globale modifiée en cours de génération, ici c'est une
valeur retournée par `generate()` et passée explicitement (plus facile à
tester, pas d'état caché).

Deux petites corrections au passage, dans le code touché :
- la texture d'occlusion précédente n'était jamais libérée quand on
  changeait de ville (fuite mémoire, plus coûteuse maintenant qu'elle
  peut faire 1024²) ;
- changer de ville (page Villes) ne recadrait pas la caméra si le
  joueur avait zoomé à la main : on restait zoomé pour un hameau sur une
  métropole. Recadrage automatique à chaque changement de ville, comme
  dans le prototype.

**Décision prise sans Adrien, à contester si besoin** : l'aspect de
toutes les villes existantes change une fois avec ce jalon (ordre
d'ouverture des blocs, maisons, voitures, forêts). Le prototype tire
désormais un aléa propre à chaque bloc, à chaque case de rue et à chaque
arbre, au lieu de générateurs séquentiels — c'est ce qui garantit
qu'agrandir la ville ne déplace jamais ce qui existe déjà (voir tests
ci-dessous), mais ça rebat les cartes une fois. Pas de migration pour
garder l'ancien plan : il n'existe aujourd'hui que les villes de test et
un seul vrai compte (Adrien, un hameau à 1 habitant), et la règle
"l'identité d'une ville ne change jamais" vise les changements au hasard
d'un rechargement à l'autre, pas une mise à jour du moteur annoncée.
Après ce jalon, la règle redevient stricte (§10 point 18).

**Mesures** (`generate()` + occlusion, Node, même machine) :

| Habitants | Blocs | Rayon | Sommets | Génération |
|---|---|---|---|---|
| 1 | 1 | 168 m | 143 000 | ~60 ms |
| 40 000 | 16 | 240 m | 227 000 | ~60 ms |
| 100 000 | 28 | 240 m | 287 000 | ~65 ms |
| 250 000 | 58 | 320 m | 436 000 | ~155 ms |
| 500 000 | 108 | 480 m | 706 000 | ~185 ms |
| 1 000 000 | 208 | 640 m | 1 250 000 | ~345 ms |

Repères de la spécification atteints (~28 blocs à 100 000, ~58 à
250 000). Poids du paquet inchangé (`next build` : 104-113 Ko au premier
chargement des pages du jeu, le générateur est dans le morceau 3D chargé
en différé). **Pas de plafond ajouté** : la demande dit "sans limite",
mais au-delà de ~500 000 habitants la géométrie devient lourde pour un
téléphone — point ouvert pour Adrien (§10 point 19), pas tranché
silencieusement. La plus grande ville de test fait aujourd'hui 114 000
habitants.

**Tests** : `tests/unit/ville3dCroissance.test.ts` (nouveau) — les 16
premiers seuils sont identiques à avant ; +1 bloc tous les 5 000
habitants au-delà ; un chantier de tour jamais moins de 12 000 habitants
après son bloc ; repères 28 et 58 blocs ; la ville dépasse enfin 16
blocs ; **stabilité** : pour trois graines et neuf paliers de 1 à
500 000 habitants, chaque bloc ouvert le reste, au même endroit, avec les
mêmes seuils ; la ville naît au croisement central et s'étend vers
l'extérieur ; le rayon ne descend jamais sous le plancher et grandit avec
la ville ; la carte d'occlusion couvre toujours toute la ville. Pour
tester l'ordre des blocs sans passer par la géométrie, la planification
est sortie de `generate()` dans une fonction pure,
`planifierBlocs()`. Les tests existants (déterminisme, triangles valides,
bornes jusqu'à 500 000, gratte-ciel au seuil Ville) et le test e2e "le
sol est bien dessiné" passent sans changement. Vérifié aussi à l'œil
avec un compte jetable à 250 000 habitants (58 blocs, tours plus hautes
au centre, champs et routes de campagne partant du bord réel, ombres sur
toute la ville) et en passant d'une grande ville à un hameau sur la page
Villes (recadrage correct). Suite complète : 57 tests unitaires +
21 tests e2e, verte depuis un cache froid.

**Vérification rouge par sabotage** : remplacer l'aléa par bloc par un
générateur séquentiel unique (l'ancienne méthode) → le test de stabilité
échoue (blocs "perdus" quand la ville grandit), puis passe de nouveau une
fois l'aléa par bloc rétabli.

**Faux échec corrigé à la racine** : le test e2e du Jalon 1 échouait
parfois à froid (troisième fois constatée) sur la double redirection
connexion → `/ville` → `/ville/creer`, les deux routes se compilant à la
demande en plus des 5 s d'attente par défaut. Attente portée à 20 s sur
cette seule assertion, avec un commentaire qui l'explique.

---

### Jalon 8 — se classer — 24/09/2026

**Contenu, revu par rapport à la ROADMAP d'origine.** L'ancien Jalon 8
("classement des villes, pays + mondial") a été précisé et étendu par
une demande d'Adrien du même jour : `docs/CLASSEMENTS.md` ajoute les
**régions** (chaque ville appartient à une région de son pays,
classements mondial/national/**régional**). La proposition scinde
elle-même le travail en Jalon 8 (régions + classements principaux) et
**Jalon 8bis "Les palmarès"** (bilans journaliers, classements annexes
par période) — scission reprise telle quelle, même logique que
6/6bis et 7/7bis.

**Régions.** Table `regions` (id, country_id, nom_fr, nom_en). Régions
réelles pour les 6 pays cités nommément par Adrien et les plus présents
dans les villes de test — France (18 : 13 régions + 5 d'outre-mer),
Allemagne (16 Länder), Belgique (3), Suisse (26 cantons), Canada (13),
États-Unis (51, avec DC) — soit 127 lignes. **Décision prise sans
attendre Adrien, à contester si besoin** : le Japon, présent dans les
villes de test mais pas dans la liste explicite d'Adrien, n'a pas reçu
de régions réelles pour ce jalon — il reçoit comme tous les ~240 autres
pays une région de repli unique "Tout le pays", générée par requête
depuis `countries` plutôt que listée à la main (244 lignes). Étendre à
d'autres pays plus tard ne demande qu'une nouvelle migration insert,
aucun changement de code.

**Choix de région.** Obligatoire à la création (`creer_ville()` reçoit
`p_region_id`, valide qu'elle appartient au pays choisi, sinon P0010).
Les villes créées avant ce jalon (le compte réel d'Adrien, les villes de
test avant le rechargement du seed) ont `region_id` nul : un garde-fou
commun (`src/lib/supabase/gardes.ts`, appelé par Ma ville/Villes/
Jumelages/Classement) redirige vers `/ville/region` tant que le choix
n'est pas fait — même principe que la redirection déjà en place vers
`/ville/creer` pour un profil sans ville. La même page sert aussi à
**changer** de région plus tard, avec le délai de 30 jours
(`definir_region()`, P0011 si trop tôt) : premier choix libre (region_id
encore nul), un changement volontaire redémarre le délai.

**Classements** (`/classement`, nouvel onglet). Trois vues (mondial,
national, régional) par simples requêtes triées sur `population`, "ma
position" toujours affichée (nombre de villes strictement devant + 1,
même méthode que le badge de rang de Ma ville depuis le Jalon 7) — pas
de vue matérialisée ni de `pg_cron` pour ce jalon : à l'échelle actuelle
(une poignée de villes), une requête directe suffit très largement ;
CLASSEMENTS.md §4 le propose comme optimisation pour plus tard, pas
comme un prérequis. Chaque ligne du classement renvoie vers `/villes`
(les vraies actions restent là, pas dupliquées ici) ou vers `/ville`
pour sa propre ville.

**Bug trouvé en testant, pas dans le code applicatif** : `create or
replace function` sur `creer_ville()` avec un paramètre en plus
(`p_region_id`, même avec une valeur par défaut) ne remplace pas la
fonction — Postgres distingue les fonctions par les *types* de leurs
paramètres, pas leurs noms ni leurs valeurs par défaut, donc l'ancienne
version à 4 paramètres restait active à côté de la nouvelle à 5. Tout
appel à 4 arguments (tous les tests e2e des jalons précédents) devenait
ambigu pour PostgREST ("Could not choose the best candidate function").
Corrigé par une migration corrective (`0010`, jamais de modification
d'une migration déjà appliquée) qui supprime explicitement l'ancienne
signature.

**Vérifié aussi, sans lien avec ce jalon** : deux exécutions de la
nouvelle suite e2e ont laissé des comptes orphelins (mêmes noms de ville
réutilisés d'un essai à l'autre) après un test qui a dépassé son délai —
le même piège déjà documenté au Jalon 6bis (timeout Playwright qui saute
le bloc `finally`). Nettoyés à la main ; délai du test concerné porté à
60 s pour que ça n'arrive plus.

**Testé.** `tests/e2e/jalon8-se-classer.spec.ts` (nouveau) : une ville à
région nulle est bloquée sur `/ville/region` puis débloquée après choix
(vérifié aussi en base) ; sabotage région d'un autre pays refusée
(P0010) ; sabotage changement avant 30 jours refusé (P0011, région
inchangée en base) ; sabotage changement accepté pile 30 jours après ;
mondial/national/régional filtrent correctement et "ma position" tombe
juste — calculée dynamiquement en base au moment du test plutôt que
codée en dur, donc robuste au contenu déjà présent (villes de test,
compte réel d'Adrien). **Vérification rouge par sabotage** sur le calcul
de rang de `/classement` (retrait du `+ 1`) : le test échoue, corrigé →
repasse. Jalon 1 adapté (le formulaire de création a un champ région en
plus) et son assertion sur le pays élargie (collision de texte avec la
nouvelle ligne "Région : ..."). Vérifié aussi à l'œil avec un compte
jetable : sélecteur de région qui apparaît après le choix du pays,
affichage "Région : ... · Changer" sur Ma ville, page Classement (trois
onglets, "Ma position", liste), écran `/ville/region` en mode
"changement" avec le délai de 30 jours affiché. Poids du paquet
toujours dans le budget (104-180 Ko selon les pages, contrainte
"application légère" du §1 point 6). Suite complète : 57 tests unitaires
+ 26 tests e2e, verte depuis un cache froid.

**Explicitement exclu de ce jalon**, comme le proposait
`docs/CLASSEMENTS.md` §6 :
- le **titre de gouverneur de région** — marqué "idée à valider" par
  Adrien lui-même, pas codé ;
- le **classement des plus grands attaquants** — exclu par choix
  délibéré du document, pas de code ;
- le **Jalon 8bis "Les palmarès"** (bilans journaliers, classements
  annexes par période) — jalon séparé, voir son propre journal
  ci-dessous (fait le même jour).

---

### Jalon 8bis — les palmarès — 24/09/2026

**Contenu.** Suite naturelle du Jalon 8, comme prévu par
`docs/CLASSEMENTS.md` §3 et §5 : sept classements annexes (plus forte
croissance, plus éprouvées, plus influentes, plus visitées, plus
attaquées, joueurs les plus généreux, plus beaux jumelages), chacun sur
quatre périodes (aujourd'hui, cette semaine, ce mois, depuis toujours)
et trois échelles (mondial, national, régional), avec "ma position"
affichée quand elle existe — nouvel onglet `/palmares`.

**Écart assumé par rapport à `docs/CLASSEMENTS.md` §4, décidé sans
attendre Adrien (à contester si besoin).** La spécification proposait
une table `city_stats_jour` remplie au fil des événements puis agrégée
par `pg_cron`. En écrivant ce jalon, constat que les journaux des
jalons précédents (`visites`, `actions_influence`, `actions_antiville`,
`jumelage_bonus`) contiennent déjà tout ce dont les sept palmarès ont
besoin — chacun a une colonne `jour` — sauf le **montant** perdu par une
action AntiVille (seul le type d'action était gardé, pas la quantité).
Plutôt qu'une nouvelle table à tenir à jour en plus de ces journaux, ce
jalon ajoute une seule colonne (`actions_antiville.montant`, renseignée
par `lancer_action_antiville()`) et calcule chaque palmarès par une
requête directe sur les journaux existants (sept fonctions SQL
`palmares_croissance`, `palmares_pertes`, `palmares_influence`,
`palmares_visites`, `palmares_attaques`, `palmares_generosite`,
`palmares_jumelages`, chacune paramétrée par une date de début et une
échelle). Même logique que la décision déjà prise au Jalon 8 de ne pas
mettre de vue matérialisée/`pg_cron` pour les classements principaux
tant que l'échelle réelle (quelques dizaines de villes) ne le justifie
pas — voir le commentaire en tête de
`supabase/migrations/0011_jalon8bis_palmares.sql` pour le détail.
Chaque fonction renvoie tous les sujets actifs sur la période (pas de
`LIMIT` arbitraire, juste `valeur > 0`) avec leur rang exact via
`row_number()`, ce qui donne "ma position" et le haut du classement en
une seule requête, sans requête séparée pour le rang hors-top.

**Choix de conception notés au passage** :
- "Habitants gagnés" (croissance) compte les visites reçues **et** les
  bonus de jumelage reçus — ce sont les deux seules sources de
  population dans le jeu actuel ; "habitants perdus" (pertes) ne compte
  que les contaminations (pas les grèves/propagandes, qui ne retirent
  pas d'habitants).
- "Influence gagnée" compte les actions d'influence reçues (toujours
  +1 chacune), sans soustraire les pertes de propagande — lecture
  littérale de "influence gagnée" dans `docs/CLASSEMENTS.md` §3, pas un
  solde net.
- "Joueurs les plus généreux" (par joueur, pas par ville) filtre
  l'échelle sur la **région du joueur qui visite**, pas sur celle de la
  ville visitée.
- "Plus beaux jumelages" (par paire, pas par ville) compte une paire
  dans une échelle si **l'une** de ses deux villes en fait partie (un
  jumelage peut traverser une frontière de pays/région).
- Les quatre périodes sont des **fenêtres glissantes** (aujourd'hui
  inclus, pas de mois calendaire) — même logique que la fenêtre
  glissante de 24h déjà utilisée par la protection anti-harcèlement du
  Jalon 4. Calcul dans `src/lib/game/periodePalmares.ts` (pur, testable,
  séparé de la page comme `ordinal.ts`/`ligneLocale.ts`).

**Pas de vérification rouge par sabotage sur les fonctions SQL
elles-mêmes** : contrairement au code applicatif (TypeScript), une
fonction SQL déjà appliquée ne peut pas être modifiée temporairement
depuis un test sans accès psql direct (contrainte connue du projet).
Les tests vérifient donc des **valeurs exactes** calculées à partir
d'actions connues (ex. deux visites → `valeur = 2` pile), pas de simples
`> 0` — une régression de calcul fait échouer une valeur précise, même
rôle de garde-fou qu'un sabotage.

**Testé.** `tests/unit/periodePalmares.test.ts` (nouveau, 6 tests) :
bornes des quatre périodes, insensibilité à l'heure du jour (seule la
date UTC compte), passage correct d'un mois à l'autre.
`tests/e2e/jalon8bis-palmares.spec.ts` (nouveau, 6 tests) : croissance et
visites reçues comptent exactement les vraies visites ; pertes et
attaques comptent exactement le montant et le nombre d'une
contamination (montant recalculé côté test à partir de la formule du
Jalon 4, pas codé en dur) ; influence compte exactement les actions
reçues ; générosité filtre bien sur la région du joueur qui visite (pas
celle qu'il visite) ; jumelages compte exactement les bonus accordés à
une paire ; la page `/palmares` affiche les sept classements et change
bien de filtre (classement/période/échelle) sans erreur console.
Vérifié aussi à l'œil avec des comptes jetables : page vide avant la
migration (erreur PostgREST "function not found" absorbée proprement,
pas de crash), page remplie après, "ma position" et badge "Ma ville"
corrects. Poids du paquet toujours dans le budget (108 Ko pour
`/palmares`). Suite complète : 63 tests unitaires + 32 tests e2e, verte
depuis un cache froid.

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

## §8. Direction artistique et rendu des villes

*(Section rédigée côté Claude chat/Cowork le 23/09/2026, avec Adrien —
décisions de design, pas encore implémentées dans le jeu.)*

### Ce qui a été essayé, et pourquoi on a changé

Quatre essais d'images 2D générées par script (vue de face, puis
isométrique, puis quadrillage de blocs) ont été jugés insuffisants par
Adrien ("pas assez réaliste"). Constat : ce qui rend l'ancien MiniVille
(Motion Twin, 2007) réaliste, ce sont des bâtiments **en 3D éclairés**
(ombres portées, reflets, pieds de murs plus sombres), pas des formes 2D
mieux coloriées. D'où le choix d'une **vraie 3D temps réel dans le
navigateur**.

### Prototype de référence

`docs/prototypes/prototype-ville-3d.html` — un seul fichier, WebGL 2,
aucune bibliothèque, aucun coût. Il contient tout le rendu attendu :
caméra isométrique qu'on tourne/zoome/déplace (souris et tactile),
ombres douces, occlusion ambiante, reflets des vitrages, rues avec
marquages et passages piétons, voitures, maisons à toit de tuiles et
volets, petits immeubles avec balcons et commerces, cours et squares,
parkings, lampadaires, campagne et forêts, routes qui partent vers
l'horizon. Il sert de **référence visuelle et de base de code** pour le
jalon qui l'intègre (`ROADMAP.md`).

### Règles de la ville (décidées par Adrien)

- **Plan** : un quadrillage de rues délimite des blocs (4×4 blocs). Dans
  chaque bloc : **4 maisons, 2 petits immeubles, 1 gratte-ciel**, tous au
  bord d'une rue (le centre du bloc est une cour commune, jamais
  construite). Les deux grands axes traversent la carte et partent en
  routes de campagne : **la ville naît à leur croisement**.
- **Chaque ville est unique et stable** : la forme, les couleurs et les
  modèles des bâtiments sont tirés une seule fois à partir de l'identité
  de la ville ; la même ville revisitée est toujours identique, et un
  bâtiment déjà posé ne change jamais d'aspect quand la ville grandit.
- **Progression : maisons → immeubles → tours**, pilotée par le nombre
  d'habitants (1 connexion = +1 habitant) :

| Stade | À partir de | Ce qui apparaît |
|---|---|---|
| Hameau | 0 | la première maison au croisement, puis les suivantes une par une |
| Village | 1 000 | nouveaux blocs, toujours des maisons |
| Bourg | 5 000 | premiers petits immeubles (2 étages, jusqu'à 7 ensuite) |
| Ville | 15 000 | premier gratte-ciel, dans le bloc du centre |
| Grande ville | 40 000 | les 16 blocs sont ouverts, les tours se lancent bloc après bloc |
| Métropole | 100 000 | toutes les tours sont construites ou presque |

- **Blocs** : ils s'ouvrent du centre vers l'extérieur (16 blocs, le
  dernier vers 40 000 habitants). Dans un bloc, les 4 maisons arrivent
  une par une.
- **Gratte-ciel** : son emplacement est d'abord un **square public**
  (aucune maison détruite). Le chantier démarre à 15 000 habitants dans
  le bloc du centre, puis un nouveau chantier tous les 4 500 habitants.
  La tour gagne **un étage tous les 500 habitants** depuis le début de son
  chantier, avec une grue et des étages en béton brut tant qu'elle n'est
  pas finie. Hauteur maximale plus grande au centre (~38 étages) qu'en
  périphérie (~23) : **les plus hautes tours au milieu**.
- Toutes ces valeurs sont réglables et à équilibrer en jouant avec les
  villes de test ; l'échelle (Métropole = 100 000) est une décision
  d'Adrien.

### Lumière : l'heure réelle du pays de la ville

Le soleil suit l'heure et la date réelles **du pays de la ville** (pas
celles du joueur qui regarde) : vraie position du soleil calculée avec la
latitude, la longitude et le fuseau horaire du pays, saisons comprises.
Aube et crépuscule dorés, nuit au clair de lune avec fenêtres allumées et
lampadaires. Une ville japonaise visitée depuis Paris à 17 h est donc en
pleine nuit. **Conséquence pour les données** : la table `countries` doit
porter latitude, longitude et fuseau horaire (IANA, ex. `Europe/Paris`).

### Villes de test

`supabase/seed/villes-de-test.json` : 24 villes fictives de tous les
stades et plusieurs pays (France et Allemagne en tête), pour tester
rendu, classements et interactions. Règles dans `GUIDE-METHODE.md`
(section recette) : jamais en production (`is_test`), enrichies à chaque
jalon, animées plus tard par un script "simuler N jours".

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
3. ~~Nombre de jumelages actifs autorisés par ville.~~ **Tranché au
   Jalon 5** : 3 jumelages actifs par ville, délégué à Claude Code
   ("tranche selon tes reco"). Détail et raisonnement dans
   `DECISIONS.md` §4, journal du Jalon 5.
4. **Publicités et premium.** Chapitre volontairement laissé ouvert par le
   cahier des charges lui-même (§7). → **Hors MVP, à rouvrir plus tard par
   Adrien.**
5. **Stratégie App Store / Play Store.** PWA au démarrage ; passage aux
   stores nécessiterait un compte développeur Apple payant. → **À trancher
   par Adrien si/quand le jeu a une communauté.**
6. ~~Accès réseau indisponible pour Claude Code depuis cette session.~~
   **Périmé au Jalon 1** : cette session Claude Code a bien un accès
   réseau sortant (installation de `@supabase/ssr`, appels au projet
   Supabase réel pour diagnostiquer le point 8 ci-dessous). Reste vrai
   que la création du dépôt GitHub et le déploiement Vercel n'ont pas
   été retentés depuis cette session. Corrigé ici pour ne pas induire en
   erreur un jalon futur.
7. **Clé `anon` invalide dans `.env.local` (projet Supabase réel).**
   Le `SUPABASE_SERVICE_ROLE_KEY` fonctionne contre le projet
   (`wdqsbazuxnhhtnejbvwc.supabase.co`), mais `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   est rejetée avec "Invalid API key" (signature invalide) — bloque
   toute action faite depuis le navigateur (inscription, connexion),
   donc la recette du Jalon 1. → **À corriger par Adrien** : recopier la
   clé `anon public` depuis Project Settings → API sur supabase.com,
   remplacer la ligne dans `.env.local`.
8. **Migrations `0001`/`0002` pas encore appliquées sur le projet
   Supabase réel.** Écrites dans `supabase/` mais cette session n'a pas
   les moyens de les pousser elle-même (pas de mot de passe de base de
   données ni de session `supabase login`). → **À faire par Adrien** :
   coller le contenu des deux fichiers dans l'éditeur SQL du tableau de
   bord Supabase (voir `supabase/README.md`).
9. **Format exact des paliers de guerre / rivalité internationale**
   (coefficients de réduction sur attaques répétées, plafonds de coalition).
   Le cahier des charges donne le principe, pas les chiffres ("les
   coefficients exacts seront définis lors du balancing"). → **À trancher
   par Adrien avec appui de Claude Code sur les tests d'équilibrage.**
10. ~~Seuils de population à revoir dans le code.~~ **Appliqué au
    Jalon 6** : `SEUILS_NIVEAU` (TS) et `population_vers_niveau()` (SQL,
    migration `0008`) utilisent désormais 1 000 / 5 000 / 15 000 /
    40 000 / 100 000.
11. ~~Rendu basé sur la population… ou sur son record ?~~ **Tranché au
    Jalon 6** : Adrien n'avait pas de préférence tranchée, la reco de
    Claude s'applique — `population_max` (record jamais atteint), pas la
    population du moment. Implémenté pour `niveau` dès ce jalon (avant
    même le rendu 3D lui-même) — voir `DECISIONS.md` §4, journal du
    Jalon 6.
12. ~~Bibliothèque 3D pour la version de production.~~ **Fait au
    Jalon 6bis** : Adrien a confirmé Three.js (reco de Claude), portage
    complet du prototype effectué — voir `DECISIONS.md` §4, journal du
    Jalon 6bis.
13. ~~Fluidité sur mobile.~~ **Testé après le Jalon 6bis** (23/09/2026,
    sur le téléphone d'Adrien via l'IP locale du PC) : fluide. Au passage,
    deux bugs trouvés et corrigés lors de ce test (voir `DECISIONS.md`
    §4, entête "Corrections post-Jalon 6bis") : la nav mobile qui
    débordait (classes Tailwind de `src/components/` jamais scannées) et
    un double encodage gamma qui délavait le ciel/fond en gris-bleu.
14. **Halo des lampadaires qui semble traverser les bâtiments la nuit**
    (signalé par Adrien le 23/09/2026, après les corrections ci-dessus).
    **Probablement expliqué le 24/09/2026** par le bug de culling (voir
    §4, journal du Jalon 7, "le sol n'était pas dessiné") : sans leurs
    toits (et sans les faces éliminées), on voyait à travers les
    bâtiments les fenêtres éclairées des murs du fond. → **À reconfirmer
    par Adrien de nuit** avant de clore ; l'hypothèse ci-dessous sur le
    halo au sol reste une piste secondaire.
    Hypothèse la plus probable après relecture du code : le halo au sol
    des lampadaires (`ao.ts`, fonction `bakeAO`) est une carte 2D floutée
    autour de chaque lampadaire, sans notion des murs — un halo peut donc
    déborder sous un bâtiment proche d'un trottoir. Pas reproduit
    visuellement avec certitude (ville de test = un hameau avec une seule
    maison, écran trop petit/sombre pour trancher). → **À reprendre** dès
    qu'Adrien peut décrire précisément l'effet ou envoyer une capture
    (idéalement de jour, sur une ville avec plusieurs bâtiments) — pas de
    correction à l'aveugle sur un shader.
15. ~~Jalon 7 : classement ou refonte visuelle d'abord ?~~ **Tranché par
    Adrien le 23/09/2026** : refonte visuelle d'abord (nouveau Jalon 7
    "Un jeu agréable à regarder", proposé dans `docs/A-INTEGRER.md`
    déposé par une session Claude chat/Cowork le même jour). "Se classer"
    devient le Jalon 8. Détail dans `ROADMAP.md` et `DECISIONS.md` §4,
    journal du Jalon 7.
16. **Système de développement des villes (7 activités, jauges,
    mégaprojets, décisions du maire — `docs/SYSTEME-DEVELOPPEMENT.md`).**
    Proposition déposée le 23/09/2026, explicitement **non validée par
    Adrien** — présente dans la maquette du Jalon 7
    (`docs/prototypes/maquette-ecrans.html`) mais volontairement exclue de
    l'implémentation de ce jalon (gaz d'échappement de la maquette, pas
    une spécification). → **À trancher par Adrien** avant tout code sur
    ce système. Note associée : à l'échelle 100 000 habitants, la
    contamination à −10 % serait trop forte si ce système était activé un
    jour (2 000 habitants perdus d'un coup pour une ville de 20 000) —
    proposition en attente : −1 % et plafond de 3 % de pertes/jour toutes
    causes confondues (sans lien avec ce système, applicable dès
    maintenant si Adrien le souhaite pour l'antiville existante — à
    confirmer séparément).
17. **"Bulletin municipal" (journal d'événements) et lien de partage
    personnalisé** — présents dans la maquette du Jalon 7 comme "clins
    d'œil", mais demanderaient chacun une vraie fonctionnalité qui
    n'existe pas encore (une table d'événements par ville ; un mécanisme
    d'invitation/visite anonyme via un lien). Non codés en façade pour ce
    jalon plutôt que de simuler quelque chose de creux. → **À trancher
    par Adrien** : si ces "clins d'œil" valent la peine d'un mini-jalon
    dédié, et avec quel contenu réel pour le bulletin (quels événements
    logger : nouveaux habitants, influence reçue, attaques subies,
    étages construits ?).
18. **Aspect des villes existantes changé une fois par le Jalon 7bis**
    (nouveau plan de blocs, maisons, voitures, forêts). Tranché par
    Claude, raisonnement dans §4, journal du Jalon 7bis. → **À contester
    par Adrien s'il préfère une migration** qui garde l'ancien plan. À
    partir de maintenant, la règle redevient stricte : toute évolution du
    générateur doit garder à l'identique les villes déjà construites (le
    test de stabilité du Jalon 7bis en couvre l'ordre des blocs ; la
    future bibliothèque de bâtiments, `docs/BATIMENTS-ET-PACKS.md` §2,
    devra faire de même pour les modèles).
19. **Plafond de rendu pour les très grandes villes ?** La croissance est
    sans limite comme demandé, mais le coût monte : 436 000 sommets à
    250 000 habitants, 706 000 à 500 000, 1,25 million à 1 000 000 (mesures
    au §4, Jalon 7bis). Sur téléphone, au-delà de ~500 000 habitants, ça
    risque de ramer. Pistes : plafonner le *rendu* (la population continue
    de monter, la ville dessinée arrête de s'étendre) ; ou simplifier les
    blocs lointains (moins de détails loin du centre). → **À trancher par
    Adrien**, sans urgence : la plus grande ville de test fait 114 000
    habitants. À mesurer sur son téléphone avec une ville de test géante
    avant de décider.
20. **Un stade au-delà de Métropole ?** (ex. "Mégapole" à 250 000
    habitants, question posée dans `docs/A-INTEGRER.md` §2). Le rendu
    continue de grandir mais le niveau reste Métropole au-delà de
    100 000. → **À trancher par Adrien** ; toucherait `SEUILS_NIVEAU` et
    la fonction SQL `population_vers_niveau()` (nouvelle migration).
21. **Bibliothèque de bâtiments et packs de thèmes**
    (`docs/BATIMENTS-ET-PACKS.md`, proposition du 24/09/2026). En attente
    des réponses d'Adrien aux 4 questions de son §7 (thèmes prioritaires,
    variantes par pays, packs uniquement cosmétiques, ordre par rapport
    au Jalon 8). Aucun code avant validation.
22. **Revoir les règles du jeu** (retour d'Adrien après le Jalon 4 :
    "−10 % de population, c'est exagéré" — `docs/A-INTEGRER.md` §3 et
    `docs/SYSTEME-DEVELOPPEMENT.md` §6 bis). Proposition en réflexion :
    effets unitaires faibles, cumul des attaques de la journée, plafond de
    10 %/jour, paliers visibles. Ajouté à `ROADMAP.md` comme jalon **à
    placer par Adrien**. Pas de code d'ici là.
23. **Titre de gouverneur de région ?** (idée à valider,
    `docs/CLASSEMENTS.md` §2 et §6 question 2) — badge et historique pour
    la ville n°1 d'une région, sur le modèle du président du pays, sans
    pouvoir particulier pour l'instant. Non codé au Jalon 8. → **À
    trancher par Adrien.**
24. **Régions réelles pour le Japon, et d'autres pays ?** Le Jalon 8 a
    donné des régions réelles aux 6 pays cités nommément par Adrien
    (France, Allemagne, Belgique, Suisse, Canada, États-Unis) ; le Japon,
    présent dans les villes de test, a reçu la région de repli "Tout le
    pays" comme les ~240 autres pays (décision de Claude Code, §4,
    journal du Jalon 8, à contester si besoin). → **À trancher par
    Adrien** : étendre à d'autres pays (Japon, Espagne, Italie,
    Royaume-Uni ?) ne demande qu'une nouvelle migration insert.
25. **Jalon 8bis "Les palmarès"** — fait, §4 journal du Jalon 8bis (sept
    classements annexes, 4 périodes × 3 échelles, calculés par requête
    directe sur les journaux existants plutôt que par
    `city_stats_jour`/`pg_cron`, écart documenté dans le journal).
    Question encore ouverte pour Adrien (`docs/CLASSEMENTS.md` §6,
    question 4 — la question 3 est tranchée, l'absence de classement des
    attaquants) : d'autres classements annexes en tête ?
26. **Noms uniques (pseudos et villes) pas encore faits.**
    `docs/A-INTEGRER.md` §8 demandait cette règle **dans le Jalon 8**
    ("qui touche déjà l'écran de création"), mais le contenu réel de ce
    jalon a été fixé par `docs/CLASSEMENTS.md` (régions + classements)
    avant que ce §8 ne soit pris en compte — la demande d'unicité n'a
    pas été codée ici. Aujourd'hui, ni `users.pseudo` ni `cities.nom`
    n'ont de contrainte d'unicité (toujours vrai depuis les migrations
    0001-0010). → **À trancher par Adrien** : mini-jalon dédié (colonne
    normalisée + index unique, vérification à la création, migration de
    dédoublonnage des données existantes, écran de rattrapage) ou
    intégré à un prochain jalon proche.
