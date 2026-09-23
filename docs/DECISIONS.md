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
12. ~~Bibliothèque 3D pour la version de production.~~ **Tranché** :
    Adrien confirme Three.js (reco de Claude), plutôt que le WebGL fait
    main du prototype. → **Reste à faire** : le portage lui-même, dans
    un jalon séparé ("Jalon 6bis" — voir `ROADMAP.md`).
13. **Fluidité sur mobile** : à vérifier sur le téléphone d'Adrien dès le
    premier build du rendu 3D (le prototype réduit déjà la qualité des
    ombres sur écran tactile). Toujours ouvert — pas testable avant le
    jalon du rendu.
