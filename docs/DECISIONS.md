# DECISIONS.md — jeu_miniville (nom de travail)

Source de vérité du projet. Journal honnête : on y consigne ce qui a
marché, ce qui n'a pas marché, et pourquoi. Voir `GUIDE-METHODE.md` pour la
démarche générale et `ROADMAP.md` pour les jalons à venir.

---

## §1. Contraintes fondatrices

Posées avant la première ligne de code, à ne jamais contourner "juste pour
un jalon" :

1. **Dépenses sous contrôle, zéro royalties** (assoupli le 25/09/2026,
   `docs/A-INTEGRER.md` §10, décision d'Adrien — remplace l'ancienne
   règle "zéro coût"). Par défaut, uniquement des outils et niveaux de
   service gratuits (Next.js, Supabase free tier, Vercel free tier,
   GitHub privé gratuit). Une dépense raisonnable reste possible pour un
   résultat carré (nom de domaine, service d'e-mails...), **mais
   uniquement après validation explicite d'Adrien, montant et
   fournisseur à l'appui** — jamais engagée seule, même pour un petit
   montant, et jamais de carte bancaire ni de compte payant créé sans
   cette validation préalable. Toujours aucune royalty sur les revenus
   futurs, aucune licence à l'unité.
2. **Anti-triche côté serveur.** Toute règle qui affecte le classement, la
   population, l'influence ou les ressources d'un joueur est validée côté
   serveur. Le client ne fait que demander et afficher.
3. **Boucle courte.** Le jeu doit rester jouable en 2 à 5 minutes par jour ;
   toute mécanique qui allonge ce temps sans raison de design explicite est
   un point ouvert, pas un fait acquis. **Nuancé le 26/09/2026** (Jalon
   13 bis, `docs/A-INTEGRER.md` §13) : revisiter une ville plusieurs fois
   par jour (jusqu'à 3, délai d'une heure entre deux) est une exception
   volontaire pour la rétention, décidée par Adrien en connaissance de
   cause — voir §4, journal du Jalon 13 bis.
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

**Intégralement livré au 26/09/2026** (Jalon 15, sous réserve de la
vérification manuelle mobile/PC encore en attente d'Adrien — voir §4,
journal du Jalon 15). Repris du cahier des charges §30, c'est la
version volontairement plus petite que le jeu final :

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

### Jalon 9 — naissance d'un pays — 25/09/2026

**Contenu.** Nouvel onglet `/pays` : nom du pays, population totale,
influence totale, activité moyenne et nombre de villes, agrégés à
partir des villes membres (`stats_pays()`) ; sélecteur pour voir un
autre pays ; villes principales du pays (top 10 par population) avec
lien vers la liste complète (`/villes?pays=...`, déjà existante depuis
le Jalon 7). Lien "Mon pays" ajouté sur Ma ville. Pas de vote (Jalon 10)
ni de président (Jalon 11) dans ce jalon — la ROADMAP les garde
séparés.

**"Activité" enfin définie, décidé sans attendre Adrien (à contester si
besoin).** La colonne `cities.activite` existe depuis le Jalon 1 mais
n'avait jamais de définition réelle : toujours 0 pour une vraie ville
(bug visible, jamais remarqué jusqu'ici, sur la tuile "Activité" de Ma
ville), seules les villes de test avaient une valeur, arbitraire
(`activite_7j` du seed, sans lien avec une vraie mécanique — voir
DECISIONS.md §4, journal du Jalon 6). Définition retenue : le nombre de
jours, sur les 7 derniers jours, où le propriétaire de la ville a été
actif — même notion d'activité que `reclamer_bonus_jumelages()`
(Jalon 5) pour une seule journée (au moins une visite donnée, une
action d'influence ou une action AntiVille lancée), étendue ici sur une
fenêtre glissante de 7 jours (`activite_7j_de()`, réutilisée par
`activite_ville()` pour Ma ville et par `stats_pays()` pour la moyenne
nationale). Calculée à la volée, pas stockée — même logique que les
palmarès du Jalon 8bis ; la colonne `cities.activite` reste donc
inutilisée par ce jalon (pas supprimée, juste plus lue). Corrige au
passage l'affichage de la tuile Activité sur Ma ville, restée bloquée à
0 depuis le Jalon 1.

**Incident de vérification, sans lien avec le code applicatif.**
L'API Auth de Supabase est devenue injoignable en pleine vérification
(la REST API répondait en 150 ms, l'API Auth restait bloquée plus de
15 s sans réponse) — suite e2e massivement rouge sur des jalons
anciens et inchangés (1, 2, 3, 5, 6bis, 8, 8bis), tous bloqués à l'étape
"se connecter". Revenue à la normale une heure plus tard (signalé par
Adrien). Trois bugs réels trouvés en re-testant après coup, tous dans
le test lui-même, pas dans l'application :
- l'instantané "avant" de `stats_pays` dans le test était pris *après*
  la création des deux villes de test, faussant le delta attendu ;
- une mise à jour directe de `population` sans `population_max`
  échouait silencieusement contre la contrainte SQL
  `population_max >= population` (Jalon 6), laissant une ville de test
  à 1 habitant donc absente du "top 10" attendu ;
- plusieurs comptes de test orphelins de tentatives interrompues par la
  panne (le `finally` n'avait pas pu s'exécuter, même piège déjà
  documenté aux Jalons 6bis et 8) faussaient un autre test par une
  ville en double — nettoyés à la main.

**Flakiness confirmée liée à l'environnement, pas au code** : sous 2
workers Playwright (réglage habituel du projet), plusieurs tests de
jalons anciens et inchangés échouent occasionnellement à l'étape
"se connecter", y compris en relançant plusieurs fois de suite. Avec
`--workers=1`, la suite complète passe systématiquement (à l'exception
d'un test du Jalon 8 déjà identifié comme lourd, 4 comptes créés). Cette
machine ne semble pas absorber 2 workers Playwright + serveur de dev
Next.js aussi bien qu'attendu — observation notée ici, pas une
régression de ce jalon, et pas un changement de réglage forcé (le
projet garde `workers: 2` par défaut).

**Testé.** `tests/e2e/jalon9-naissance-dun-pays.spec.ts` (nouveau,
4 tests) : `stats_pays` agrège exactement la population et l'influence
(delta isolé et connu) ; `activite_7j_de`/`activite_ville` comptent
exactement les jours actifs (0 puis 1 après une visite) ; la page
`/pays` affiche les statistiques, liste les villes principales et
permet de changer de pays via le sélecteur, avec un lien vers la liste
complète ; la tuile "Activité" de Ma ville n'est plus bloquée à 0 après
une visite donnée. Vérifié aussi à l'œil avec des comptes jetables,
dont `/villes?pays=DE` en navigation directe pour confirmer que le
symptôme observé pendant les échecs (page bloquée) était bien un délai
de compilation à froid et non une vraie erreur serveur. Poids du
paquet toujours dans le budget (112 Ko pour `/pays`). Suite complète :
63 tests unitaires + 36 tests e2e, verte à `--workers=1`.

---

### Correction hors-jalon : service worker actif en développement — 25/09/2026

**Bug vécu et corrigé par Adrien lui-même** (`docs/A-INTEGRER.md` §9,
intégré ici) : `localhost:3000` bloqué avec `ERR_FAILED` dans Chrome
alors que le serveur `next dev` tournait bien. Cause :
`RegisterServiceWorker` (`src/app/register-sw.tsx`) enregistrait
`public/sw.js` même en développement ; les chunks et le HTML changent à
chaque compilation/HMR, et le service worker servait une version
périmée. Corrigé par Adrien : le service worker ne s'enregistre plus
qu'en production (`process.env.NODE_ENV === "production"`) ; en
développement, toute inscription ou cache résiduel d'une session
antérieure est nettoyé automatiquement au chargement.

**Ajouté par Claude Code à la demande d'Adrien** ("ajouter un test qui
empêche la régression") : `tests/e2e/smoke.spec.ts` vérifie que
`navigator.serviceWorker.getRegistrations()` reste vide après le
chargement de `/` en développement. Geste de dépannage documenté dans
`docs/GUIDE-METHODE.md` §9 pour un joueur qui aurait encore un service
worker périmé enregistré depuis avant la correction.

**Vérification rouge incomplète, notée honnêtement** : la sabotage
manuel (retirer temporairement la garde `NODE_ENV`) n'a pas fait
échouer le nouveau test dans ce sandbox — la registration du service
worker par l'effet React ne se déclenchait pas de façon observable dans
ce navigateur de test dans les quelques secondes disponibles, avec ou
sans la garde (une registration manuelle directe depuis la page
fonctionnait, elle). Le vrai bug d'Adrien impliquait un service worker
*déjà* enregistré lors d'une session précédente, une condition qu'un
navigateur Playwright fraîchement lancé ne reproduit pas naturellement.
Le test reste une garde-fou raisonnable (il encode la règle attendue)
mais n'a pas été confirmé rouge avant la correction, contrairement à la
convention habituelle du projet — à revoir si l'occasion se présente.

---

### Jalon 10 — voter pour son pays — 25/09/2026

**Contenu.** Sur `/pays`, section « Vote hebdomadaire » (visible
uniquement pour son propre pays) : un vote par joueur et par semaine
ISO parmi 4 catégories (Industrie / Technologie / Culture / Commerce,
`docs/ROADMAP.md`), résultat affiché en pourcentages recalculés sur le
total de la semaine — "proportionnel aux votes" au sens le plus
littéral : chaque vote compte pour 1, la répartition entre catégories
EST le résultat. « Ressources nationales » : stock cumulé par catégorie
depuis le premier vote, jamais remis à zéro, visible pour n'importe
quel pays consulté (pas seulement le sien).

**Portée volontairement limitée, décidée sans attendre Adrien (point
ouvert, §10) :** le cahier des charges dit "vote hebdomadaire de
ressource, résultat proportionnel aux votes" et "ressources
nationales", sans jamais préciser ce que ces ressources *font* une fois
accumulées. Plutôt qu'inventer un effet de gameplay (bonus aux villes ?
condition pour les décisions diplomatiques des Jalons 12/13 ?), ce
jalon construit le vote et l'accumulation — utiles et testables seuls,
comme l'a été l'"activité" du Jalon 9 avant d'avoir un usage. Voir le
commentaire en tête de `supabase/migrations/0013_jalon10_voter_pour_son_pays.sql`.

**Choix de conception notés au passage** :
- Le pays n'est jamais reçu du client dans `voter_pays()` — résolu
  depuis `users.country_id`, même principe que "ma ville" dans
  `proposer_jumelage()` (Jalon 5) : on ne peut voter que pour son
  propre pays, pas un pays choisi arbitrairement.
- "Semaine" = lundi de la semaine ISO 8601 courante (UTC), via
  `date_trunc('week', ...)` côté SQL et un équivalent JS testé
  (`src/lib/game/semaineIso.ts`) côté page, pour que les deux
  s'accordent sur "cette semaine" sans se passer la date calculée.
- Nouveau code d'erreur `P0012` (catégorie de vote invalide) — premier
  code libre après le `P0011` du Jalon 8.

**Incident de vérification, sans lien avec le code applicatif** : même
symptôme qu'au Jalon 9 (suite e2e rouge sur des jalons anciens et
inchangés, bloqués à "se connecter"), cette fois avec un seul worker
Playwright (donc pas la flakiness de concurrence déjà documentée) —
cause identifiée : le serveur de dev tournait sans interruption depuis
plusieurs heures à travers les Jalons 9 et 10, cache de compilation
probablement corrompu par l'accumulation de recompilations (même classe
de problème que documenté aux Jalons 6bis, 7bis, 8bis et 9). Redémarré,
suite complète repassée au vert immédiatement, `--workers=1` y compris
sur le test du Jalon 8 déjà identifié comme lourd (44.6s puis 41.8s,
sous la limite).

**Testé.** `tests/e2e/jalon10-voter-pour-son-pays.spec.ts` (nouveau,
4 tests) : `resultats_vote_semaine` reflète exactement les votes de la
semaine (delta connu, pourcentage recalculé vérifié) et
`ressources_pays` les cumule ; un vote inséré directement sur une
semaine passée compte dans `ressources_pays` mais pas dans
`resultats_vote_semaine` de la semaine courante ; sabotage — un
deuxième vote la même semaine est refusé (23505) et le premier vote
n'est pas écrasé ; la page `/pays` permet de voter, affiche la
confirmation et le résultat, masque la section de vote pour un pays
qu'on ne représente pas. Un vrai bug de test trouvé et corrigé en
route : `getByText("Culture", { exact: true })` visait n'importe quelle
occurrence du mot sur la page (résultats et ressources l'affichent
aussi), pas seulement le message de confirmation — corrigé en ciblant
le message précis puis `toContainText`. Poids du paquet toujours dans
le budget (113 Ko pour `/pays`). Suite complète : 69 tests unitaires +
41 tests e2e, verte à `--workers=1`.

---

### Jalon 11 — le président malgré lui — 25/09/2026

**Contenu.** Sur `/pays` : « Présidente actuelle : [ville] · depuis
[date] » et une section « Historique des présidents » (mandats passés
et en cours, plus récent en premier). Le badge "Président" existant
depuis le Jalon 7 (rang #1 du pays, calculé en direct sur `/ville` et
`/villes`) ne change pas — il reste la source de vérité pour "qui est
président *maintenant*", toujours exact. Ce jalon ajoute seulement la
mémoire de *depuis quand* et des mandats précédents
(`presidents`/`verifier_president()`), tenue à jour par une
réconciliation idempotente appelée à chaque affichage de `/ville` (son
propre pays) ou `/pays` (le pays consulté) — même principe que
`reclamer_bonus_jumelages()` au Jalon 5 : pas de cron, pas de trigger
sur chaque action qui change la population.

**Départage à population égale** : la ville la plus ancienne
(`created_at`) reste présidente — comportement stable, jamais
d'oscillation entre deux villes strictement à égalité.

**Bug trouvé en testant à l'œil, pas dans ce jalon mais dans le
Jalon 10** : la section "Résultats de cette semaine" écrasait les noms
de catégorie ("I...", "T..." au lieu de "Industrie", "Technologie") —
`list .rowbtn` (CSS) attend une grille à 3 colonnes fixes (`rk` 26px,
`nm` flexible, `pp` auto) ; cette section n'avait pas de `span.rk`, donc
`nm` se retrouvait placé dans la première colonne (26px) par le
placement automatique de la grille. Corrigé en ajoutant le `rk` manquant
(numéro d'ordre 1-4). Repéré uniquement parce que ce jalon-ci a rouvert
`/pays` pour vérifier visuellement l'ajout du président — jamais
remarqué avant.

**Testé.** `tests/e2e/jalon11-le-president-malgre-lui.spec.ts` (nouveau,
3 tests) : `verifier_president` élit la ville n°1 (populations très
hautes pour dominer sans ambiguïté toute donnée déjà présente),
idempotent sur un appel répété sans changement de rang (même mandat,
même date de début), puis bascule correctement (ancien mandat fermé,
nouveau ouvert) quand une autre ville dépasse la présidente ; à
population strictement égale, la ville la plus ancienne reste
présidente ; la page `/pays` affiche le président actuel et
l'historique. Un vrai bug trouvé dans un test **du Jalon 9** en
relançant la suite complète : l'ajout de "Présidente actuelle" fait
apparaître le nom de la ville une fois de plus sur `/pays`, cassant une
assertion `getByText` non assez précise (3 correspondances au lieu de
2) — corrigée en ciblant le lien de la liste des villes principales.
Poids du paquet toujours dans le budget (`/pays` inchangé, pas de JS
client ajouté). Suite complète : 69 tests unitaires + 44 tests e2e,
verte à `--workers=1`, serveur de dev fraîchement démarré.

---

### Jalon 9 ter — la carte du pays — 25/09/2026

**Contenu.** Sur `/pays` uniquement, le fond 3D partagé (Jalon 7) est
remplacé par une carte SVG illustrée du pays : régions colorées selon
leur population (une seule teinte, l'accent rouge panneau, plus marquée
si plus peuplée — `docs/CARTE-DU-PAYS.md` §2), pastilles cliquables
pour la ville du joueur (anneau rouge), la présidente (cercle or) et la
ville n°1 de chaque région (petit cercle brun, sans le mot
"gouverneur" — ce titre reste un point ouvert §10 point 23, non
tranché). Cliquer une pastille va sur la ville. Les autres pages
gardent la 3D sans changement.

**Comment la carte cohabite avec la scène 3D partagée, sans la
démonter** : `SceneVilleFond` (Jalon 7) rend le canvas en position
fixe, plein écran, `z-index: 0`, sous tout le reste de l'app — les
pages n'ont jamais besoin de le démonter, seulement de ne pas le
recouvrir. `/pays` ne l'annonce plus (`SincroniserScene` retiré de
cette page) et affiche `.carte-pays` à la place, `position: fixed`,
à l'intérieur de `.screen` (déjà au-dessus du canvas, Jalon 7) — la
carte recouvre donc visuellement la 3D sans jamais la démonter ; le
canvas continue de tourner en arrière-plan, invisible tant qu'on reste
sur Pays (petit gaspillage CPU/GPU accepté plutôt que la complexité
d'une vraie pause, `docs/DECISIONS.md` §10 point 28).

**Chasse aux données géographiques : trois échecs avant la bonne
source, à consigner pour la prochaine fois.** L'idée de départ
(A-INTEGRER §11) était de générer les cartes une fois pour toutes à
partir de Natural Earth. En pratique :
1. Les miroirs GeoJSON habituels de Natural Earth sur GitHub
   (`nvkelso/natural-earth-vector`, `martynafford/natural-earth-geojson`)
   se sont révélés incomplets pour les subdivisions administratives
   (admin-1) au moment d'écrire ce jalon — seulement 9 à 51 pays
   couverts selon le fichier, jamais les 6 dont ce projet a besoin en
   entier. Cause non identifiée avec certitude (snapshot dégradé du
   dépôt ? reconstruction en cours ?).
2. `world-atlas` (paquet npm, CDN jsdelivr) s'est révélé fiable mais ne
   couvre que le contour des pays (admin-0), pas leurs régions — utilisé
   pour les ~228 pays sans régions réelles.
3. **geoBoundaries** (`geoboundaries.org`, projet académique William &
   Mary, licence ouverte) a fourni des données admin-1 complètes et
   fiables pour les 6 pays voulus, via son API
   (`api/current/gbOpen/{ISO3}/ADM1/`) qui renvoie une URL vers sa
   propre version pré-simplifiée (`simplifiedGeometryGeoJSON`) — la
   version détaillée aurait dépassé la limite de taille de chaîne de
   Node (500 Mo+ pour le Canada, à cause de son archipel arctique).
   Piège rencontré : les fichiers sont servis via Git LFS, seul le
   chemin `github.com/.../raw/<ref>/...` (pas
   `raw.githubusercontent.com/...`) résout le vrai contenu au lieu
   d'un pointeur texte de 130 octets.

**Piège de projection, découvert en cours de route** : `d3-geo`
(`geoMercator().fitSize(...)`, `geoBounds`) a d'abord renvoyé des
projections dégénérées (tout le contenu tassé dans un coin de 16×15
pixels) sur les polygones de geoBoundaries. Cause : ces polygones ont
un sens de rotation (winding) qui fait que les algorithmes sphériques
de d3-geo (conventions RFC 7946, extérieur en sens antihoraire) les
lisent comme couvrant le globe entier. `geojson-rewind` n'a pas corrigé
le symptôme non plus (raison non éclaircie). Solution retenue : une
projection équirectangulaire maison (longitude compressée par
cos(latitude centrale), simplification Douglas-Peucker écrite à la
main après projection) — plus simple, sans dépendance à d3-geo, et
largement suffisante pour "une carte illustrée, pas une carte GPS"
(`docs/CARTE-DU-PAYS.md` §3). `d3-geo` et `topojson-server`/
`topojson-simplify` ont été retirés des devDependencies après coup ;
seuls `topojson-client` (décodage pur du TopoJSON de world-atlas, sans
géométrie sphérique) et `world-countries` (correspondance code ISO
numérique ↔ alpha-2) restent nécessaires — tous deux devDependencies,
jamais importés par l'app, poids nul sur le paquet client
(`docs/DECISIONS.md` §1 point 6), utilisés uniquement par
`scripts/generer-cartes-pays.mjs`, exécuté une fois (pas à chaque
build).

**Corrections manuelles constatées en comparant aux id de la table
`regions`** (Jalon 8) : Corse (`FR-20R` → `fr-cor`), Québec (`CA-QB` →
`ca-qc`), Belgique (préfixe pays absent : `BRU`/`VLG`/`WAL` →
`be-bru`/`be-vlg`/`be-wal`), et une coquille dans les données de
geoBoundaries elles-mêmes (Dakota du Sud sous le pays "SU" au lieu de
"US"). Codées en dur dans le script de génération, avec le
raisonnement, pour ne pas se reperdre si les cartes sont régénérées un
jour.

**Limites connues, acceptées pour cette première version** :
- **5 régions d'outre-mer françaises** (Guadeloupe, Martinique, Guyane,
  Réunion, Mayotte) et **2 États américains** (Rhode Island, DC)
  n'apparaissent pas sur la carte — absents des données sources
  (France) ou perdus à la simplification (trop petits, États-Unis).
  Les classements/votes/ressources de ces régions restent corrects
  (non affectés, la carte n'est qu'un habillage visuel) ; seule la
  carte elle-même ne les montre pas.
- **Pas de scintillement nocturne** ni de **repères de jumelages en
  bord de carte** (`docs/CARTE-DU-PAYS.md` §2) : explicitement permis
  à différer par la proposition elle-même pour le premier point, pas
  fait pour le second faute de temps — tous deux en point ouvert.
- **Cliquer une région n'ouvre pas de résumé** (population, ville n°1)
  — seules les pastilles de villes sont cliquables dans cette version.
- **16 très petits territoires sans carte du tout** (îles inhabitées,
  Kosovo — absent de world-atlas pour raison de statut contesté, etc.)
  — retombent sur la vignette prévue par la proposition elle-même pour
  "les petits pays".
- **Une ville qui n'a pas de coordonnées propres** dans ce projet
  (seulement une région) : sa pastille est placée au centroïde de sa
  région, pas à sa position géographique réelle — approximation
  assumée, cohérente avec "carte illustrée, pas une carte précise".

**Testé.** `tests/unit/couleurRegion.test.ts` (nouveau, 4 tests) :
région sans habitant neutre, région la plus peuplée à l'accent, gradient
monotone, aucune région peuplée reste neutre.
`tests/e2e/jalon9ter-carte-du-pays.spec.ts` (nouveau, 2 tests) : la
carte s'affiche avec plusieurs régions dessinées et une pastille
cliquable mène bien sur Ma ville ; un pays sans carte générée retombe
sur la vignette, sans erreur console. Deux tests d'autres jalons
(Jalon 9 et 11) adaptés : les nouvelles pastilles de la carte
introduisent des `<a href="/ville">` et des `<title>` SVG (jamais
visibles) qui entraient en collision avec des assertions `getByText`
trop larges — corrigées en ciblant précisément la liste des villes
principales / la note "Président actuel", pas n'importe quelle
occurrence du nom de ville sur la page. Vérifié aussi à l'œil avec des
comptes jetables : carte de France correcte visuellement (13 régions,
bonnes formes, bonnes couleurs), pastille "ma ville" cliquable menant
bien vers Ma ville. Poids du paquet **réduit** sur `/pays` (111 Ko contre
113 Ko avant ce jalon — la carte SVG serveur est plus légère que
`SincroniserScene`). Suite complète : 73 tests unitaires + 46 tests
e2e, verte à `--workers=1`.

---

### Jalon 12 — décider à l'international — 25/09/2026

**Contenu.** Sur `/pays`, section « Décision diplomatique » : une fois
par semaine ISO, la présidente **en exercice** (mandat ouvert dans
`presidents`, Jalon 11) propose un pays cible + une catégorie (Alliance
/ Paix / Rivalité / Embargo) ; n'importe quel citoyen peut ensuite
soutenir cette proposition, une fois par semaine
(`proposer_decision_diplomatique()`, `soutenir_decision_diplomatique()`,
`resultat_decision_semaine()`).

**Portée tranchée avec Adrien avant de coder**, contrairement aux
jalons précédents où j'avais décidé seul : le cahier des charges
("décision diplomatique hebdomadaire... le président peut proposer
sans décider seul") laissait deux lectures possibles — une cible par
semaine proposée par la présidente (retenu), ou une relation par paire
de pays votable indépendamment (matrice n×n, plus lourd, sans lien
direct avec un "vote hebdomadaire" unique). Un seul pays ne peut avoir
qu'une proposition par semaine (contrainte `unique (country_id,
semaine)`) : cohérent avec "un pays cible", et il ne peut de toute
façon y avoir qu'une présidente à la fois.

**Même écart que le Jalon 10, assumé pour la même raison** : ce jalon
construit la proposition et le soutien, pas ce qu'une décision *fait*
une fois soutenue (aucune règle de jeu ne change encore selon qu'un
pays est "en rivalité" ou "allié" avec un autre) — laissé au Jalon 13
("France contre Allemagne"), premier scénario concret qui donnera un
sens réel à ces catégories.

**Choix de conception** : pas de vote de rejet séparé — soutenir est un
acte positif, l'absence de soutien suffit à mesurer le désaccord (même
simplicité que les votes du Jalon 10, qui n'ont pas de "je suis
contre"). La vérification "est-ce la présidente en exercice" réutilise
directement la table `presidents` du Jalon 11 plutôt que d'introduire
une nouvelle notion de rôle. Nouveaux codes d'erreur `P0013` (pas
présidente), `P0014` (catégorie invalide), `P0015` (cible invalide :
soi-même ou pays inconnu), `P0016` (soutien sans proposition cette
semaine) — premiers codes libres après le `P0012` du Jalon 10.

**Testé.** `tests/e2e/jalon12-decider-a-linternational.spec.ts`
(nouveau, 3 tests) : sabotage — une citoyenne non présidente ne peut
pas proposer (P0013), une cible = soi-même est refusée (P0015), une
deuxième proposition la même semaine est refusée (23505, la première
n'est pas écrasée) ; les soutiens sont comptés exactement (delta connu,
doublon refusé, soutien sans proposition refusé avec P0016) ; la page
`/pays` permet à la présidente de proposer et à un citoyen de soutenir,
avec confirmation affichée. Vérifié aussi à l'œil avec un compte
jetable devenu présidente — la page dégrade proprement avant la
migration (fonctions absentes, pas de crash), fonctionne correctement
après. Poids du paquet toujours dans le budget (112 Ko pour `/pays`).
Suite complète : 73 tests unitaires + 49 tests e2e, verte à
`--workers=1`, du premier coup sur un serveur de dev fraîchement
démarré.

### Jalon 13 — france contre allemagne — 25/09/2026

**Contenu.** Complète le vote de décision diplomatique du Jalon 12 avec
une notion de majorité et un premier effet de gameplay réel :

- `votes_diplomatie` gagne une `position` (`pour`/`contre`) ;
  `soutenir_decision_diplomatique()` prend désormais cette position en
  paramètre (signature changée : `drop function` puis recréation, piège
  du Jalon 8 réappliqué sans le redécouvrir).
- `resoudre_decision_diplomatique(country_id)` : idempotente, appelée à
  chaque affichage de `/pays` (même schéma que `verifier_president` au
  Jalon 11) — clôt la proposition de la dernière semaine terminée à la
  majorité des votes exprimés (égalité ou 0 vote = non adoptée), trace
  le verdict dans `resultats_diplomatiques`.
- Si adoptée et catégorie = "rivalité" : déclenche un `conflits` de 7
  jours entre les deux pays (sauf conflit déjà en cours entre eux, index
  unique `conflits_paire_active_unique`).
- `effort_national(country_id)` : la force de mobilisation d'un pays à
  l'instant T, dérivée automatiquement de ses stats déjà existantes —
  somme de l'activité 7 jours (`activite_7j_de`, Jalon 9) des villes du
  pays, plus `floor(sqrt(somme des ressources nationales))` (Jalon 10,
  racine carrée pour que les ressources — un compteur cumulatif qui ne
  fait que croître depuis le Jalon 10 — comptent comme un bonus
  secondaire sans écraser l'activité pour un pays ancien).
- `resoudre_conflits_en_cours()` : idempotente, appelée à chaque
  affichage de `/pays` — clôt tout conflit dont les 7 jours sont
  écoulés, compare `effort_national()` des deux camps avec un **bonus
  défensif de 50 %** pour le défenseur (`effort_attaquant >
  floor(effort_defenseur * 1.5)` pour que l'attaquant l'emporte).

**Déclenchement et résolution tranchés avec Adrien avant de coder**
(contrairement à "aucun effet de gameplay" laissé en l'état aux
Jalons 10 et 12) : le cahier des charges donnait juste "coût en
ressources, bonus défensif pour l'attaqué, mobilisation quotidienne,
résultat en fin de période" sans dire *qui* déclenche le conflit ni
*comment* il se résout. Deux questions posées, réponses d'Adrien :
« c'est à la fin de la semaine le vote majoritaire des personnes de la
nation déclenche le conflit » puis « À la fin de la semaine le vote
majoritaire de la nation (par les personnes du [pays]) déclenche
l'action choisit, le président emet une sugestion mais il ne décide pas
seul ». Cela révélait que le Jalon 12 était incomplet : il manquait la
notion pour/contre et la résolution majoritaire — ajoutées ici plutôt
qu'en reprenant le Jalon 12 a posteriori (le comportement de soutien
seul du Jalon 12 n'était pas faux, juste incomplet pour "France contre
Allemagne").

**Correction d'Adrien en cours de route sur la "mobilisation
quotidienne"** (`docs/A-INTEGRER.md` §12, 25/09/2026) : la première
implémentation (migration `0016`, déjà appliquée par Adrien avant qu'il
ne se relise) ajoutait une action « Mobiliser » que chaque citoyen
devait cliquer une fois par jour pendant un conflit, comptée dans une
table `mobilisations`. Adrien s'est rendu compte que ce n'était pas ce
qu'il voulait dire en répondant à ma question, et l'a signalé avant que
je committe : l'effort quotidien d'un pays en guerre ne doit **pas**
être un compteur de clics, mais dérivé automatiquement de ce que le
pays *est déjà* — son activité (Jalon 9) et ses ressources (Jalon 10) —
sans nouvelle action citoyenne. Migration corrective `0017` : retire
`mobilisations`/`mobiliser()`/le bouton « Mobiliser », introduit
`effort_national()`. Demandé à Adrien comment pondérer activité et
ressources (le cahier des charges ne le précise pas) ; il a choisi ma
proposition — voir écart ci-dessous. « Avantages nationaux » type
Défense (cahier des charges §13) n'existe pas encore comme système dans
ce projet : pas construit ici, signalé comme point ouvert (§10 point 31)
plutôt qu'inventé pour combler le manque, comme demandé par la note.

**Écarts assumés, pas tranchés avec Adrien :**

- **Taux du bonus défensif** : le cahier des charges demande un "bonus
  défensif pour l'attaqué" (le défenseur) sans donner de chiffre — 50 %
  choisi par Claude Code (`floor(effort_defenseur * 1.5)` comparé à
  l'effort de l'attaquant), pas tranché avec Adrien, à ajuster si le
  balancing le demande.
- **Durée du conflit** : 7 jours à partir de sa résolution (pas calée
  sur la semaine ISO — la décision qui le déclenche vient d'une semaine
  déjà terminée, plus simple de faire courir le conflit à partir de sa
  résolution que de recaler sur un calendrier).
- **"Coût en ressources"** : traité comme un instantané informatif des
  ressources nationales de l'attaquant au moment du déclenchement
  (`conflits.cout_ressources`), affiché mais jamais déduit — voir point
  ouvert 30 (`DECISIONS.md` §10). Les ressources du Jalon 10 sont un
  compteur cumulatif en lecture seule sans mécanisme de dépense ; en
  faire une vraie monnaie dépensable aurait été un jalon à part entière,
  disproportionné pour ce jalon.
- **Alliance/Paix/Embargo** : toujours sans effet de gameplay au-delà du
  vote pour/contre lui-même — le cahier des charges ne cite que la
  rivalité ("France contre Allemagne") comme scénario de test explicite.
  Point 29 (§10) marqué tranché sur cette base.
- **Formule d'`effort_national`** : activité (somme brute de
  `activite_7j_de` sur les villes du pays, pas de plafond) + `floor(sqrt(
  somme des ressources))` en bonus secondaire — pondération choisie par
  Claude Code, proposée à Adrien et retenue par lui plutôt que de
  spécifier le calcul lui-même. À ajuster si le balancing le demande.

**Code d'erreur `P0017`** (mobilisation sans conflit en cours) attribué
puis retiré dans la même journée avec la fonction `mobiliser()` — pas
réutilisé pour autre chose (`P0018` et `P0019` pris le lendemain par le
Jalon 13 bis, voir plus bas).

**Testé.** `tests/e2e/jalon13-france-contre-allemagne.spec.ts` (4
tests) : le vote pour/contre compte séparément, refuse une position
invalide (P0014), un doublon (23505) et un vote sans proposition
(P0016) ; la résolution adopte à la majorité et déclenche un conflit de
rivalité (idempotente — pas de doublon de résultat ni de conflit au
deuxième appel), rejette à l'égalité sans déclencher de conflit ;
`effort_national()` reflète exactement l'activité et les ressources
insérées, la résolution de fin de conflit l'utilise pour les deux
camps, applique le bonus défensif de 50 % et clôt le conflit
(idempotente) ; la page `/pays` affiche le vote pour/contre et l'effort
automatique d'un conflit en cours. Vérifié aussi à l'œil avec un compte
jetable, à la fois avant la migration (dégrade proprement, fonctions
absentes, pas de crash) et après (vote et affichage du conflit
fonctionnent, effort mis à jour en direct sans action supplémentaire).
Poids du paquet toujours dans le budget (112 Ko pour `/pays`). Les deux
tests devenus obsolètes du Jalon 12 (l'ancien "soutenir" à sens unique,
signature changée) sont retirés de `jalon12-decider-a-linternational.spec.ts`
au profit de cette suite — un seul test y reste (`proposer_decision_diplomatique`,
inchangé). Suite complète : 73 tests unitaires + 51 tests e2e, verte à
`--workers=1` sur ce jalon. Croisé en route, sans rapport avec ce
jalon : une connexion qui reste bloquée sur `/connexion` a fait
échouer un test des Jalons 1 et 8 chacun une fois sur plusieurs runs
(jamais les mêmes, jamais un test touchant `/pays`) — même famille de
flakiness "serveur de dev" déjà rencontrée et documentée à plusieurs
reprises dans ce journal (Jalons 9/10/11/9 ter/12), pas creusée
davantage ici faute de lien avec ce jalon.

### Jalon 13 bis — revenir plus souvent — 26/09/2026

**Contenu.** Sur `/villes`, une même personne peut désormais revisiter
une ville plusieurs fois par jour (jusqu'à 3 fois, plafond choisi par
Claude Code — voir plus bas), avec un délai minimum d'une heure entre
deux visites de la même ville. Remplace l'ancienne règle "une visite par
(visiteur, ville) et par jour" du Jalon 2. `visiter_ville()` (migration
0018) : la contrainte unique `(visiteur_id, ville_id, jour)` sur
`visites` est retirée, remplacée par deux contrôles explicites — délai
d'une heure (`max(created_at)` du couple, nouveau code `P0018`) puis
plafond quotidien de 3 (nouveau code `P0019`). Interface : compteur
« n/3 » toujours visible à côté du bouton Visiter, bouton désactivé
avec compte à rebours (« Revisiter dans 42 min ») pendant le délai, puis
« Quota atteint » une fois le plafond touché ; badge de liste
« Indisponible pour l'instant » dans les deux cas (remplace l'ancien
« Déjà visitée aujourd'hui », devenu inexact puisqu'une ville visitée le
matin peut redevenir visitable l'après-midi).

**Déviation assumée du cahier des charges**, pas un oubli : les §3 et
§26 du cahier des charges posent explicitement « une même personne ne
peut contribuer qu'une seule fois par jour à une même ville » comme
règle anti-abus. C'est Adrien, auteur du cahier des charges, qui demande
cette évolution après avoir été informé de la contradiction (question
posée en retour côté Claude chat, `docs/A-INTEGRER.md` §13) — objectif
assumé : « garder les gens connectés plus souvent, ce qui est mieux pour
les fidéliser », pas seulement accélérer la croissance. Même précédent
que l'assouplissement de la règle "zéro coût" (§1 point 1) : un
amendement volontaire du cahier des charges par son auteur, pas une
extension prise seule par Claude Code.

**Plafond quotidien de 3, choisi par Claude Code** ("chiffre à
déterminer", Adrien délègue explicitement, même schéma que les quotas
des Jalons 3 et 4) : sans plafond, un joueur très motivé pourrait
visiter la même ville jusqu'à ~24 fois/jour avec seulement le délai
d'une heure, ce qui dépasserait largement la "boucle courte" (§1 point
3) et déséquilibrerait la croissance (un visiteur acharné ferait grandir
une ville bien plus vite qu'une ville qui recrute large, à l'inverse de
l'esprit du §3 du cahier des charges). 3 par jour laisse une vraie
marge par rapport à l'ancien plafond implicite de 1 (retenir les gens
plus souvent) sans l'ouvrir en grand — à ajuster avec les villes de test
si Adrien le juge trop bas ou trop haut à l'usage.

**Périmètre** : seule l'action Visiter (population) est concernée.
Les quotas d'Influence (5/jour, tous ciblés confondus) et d'AntiVille
(3/jour) restent inchangés, comme demandé — Adrien n'a pas étendu
l'objectif de rétention à ces deux actions ; point ouvert si l'envie
vient plus tard (§10 point 32).

**Nouveaux codes d'erreur** `P0018` (délai d'une heure non écoulé) et
`P0019` (plafond quotidien de 3 atteint) — premiers codes réellement
utilisés après `P0017`, qui avait été attribué puis retiré le même jour
avec `mobiliser()` (Jalon 13).

**Testé.** `tests/e2e/jalon13bis-revenir-plus-souvent.spec.ts` (nouveau,
2 tests) : sabotage — délai d'une heure refusé (P0018) tant qu'il n'est
pas écoulé, 3 visites acceptées une fois le délai simulé écoulé entre
chacune, une 4e refusée par le plafond (P0019) même délai écoulé,
population exacte (+3, pas +4) ; la page `/villes` affiche le compteur
n/3, le compte à rebours puis "Quota atteint" une fois les 3 visites
faites. `tests/e2e/jalon2-grandir-grace-aux-autres.spec.ts` mis à jour :
le test UI vérifie désormais le badge "Indisponible pour l'instant" (au
lieu de "Déjà visitée aujourd'hui"), le test de sabotage attend `P0018`
(au lieu de `23505`, la contrainte unique retirée) pour une revisite
immédiate. Vérifié aussi à l'œil avec des comptes jetables, à la fois
avant la migration (dégrade proprement : la page utilise déjà la table
`visites` existante pour son compteur et son délai, seule la fonction
SQL n'a pas encore les nouveaux codes) et après. Poids du paquet
inchangé (114 Ko pour `/villes`).

**Bug trouvé après application de la migration 0018** (en lançant la
suite e2e, pas à l'œil — le contrôle visuel avant migration n'exerçait
qu'un seul appel, insuffisant pour le révéler) : la nouvelle
`visiter_ville()` avait été réécrite à partir de la version d'origine
du Jalon 2 (migration 0003) au lieu de la version réellement en place,
déjà redéfinie par le Jalon 4 (codes d'erreur `P0004`/`P0005`/`P0007`)
puis le Jalon 6 (maintien de `population_max`/`niveau` via
`greatest(population_max, population + 1)`, nécessaire depuis la
contrainte `check (population_max >= population)` ajoutée ce même
jalon). Conséquence : toute visite échouait avec la contrainte
`cities_check` violée (`population_max` plus jamais mis à jour) et les
codes d'erreur historiques avaient disparu. Corrigé par la migration
`0019` (redéfinit `visiter_ville()` avec le corps complet du Jalon 6 +
le délai/plafond de ce jalon) — leçon retenue : pour redéfinir une
fonction SQL, relire sa version **actuelle** dans le dépôt (chercher
toutes les migrations qui la redéfinissent, prendre la plus récente),
jamais la première trouvée par nom de jalon d'origine.

**Vérification finale** (après la migration `0019`) : ce jalon est
verte et reproductible — `tests/e2e/jalon13bis-revenir-plus-souvent.spec.ts`
(2 tests) et `tests/e2e/jalon2-grandir-grace-aux-autres.spec.ts` (3
tests, dont son premier test navigateur a dû recevoir le même bump de
délai que les autres fichiers e2e du projet, oublié à l'origine) passés
3 fois de suite sans exception. Suite complète : 73 tests unitaires +
53 tests e2e. Croisé en route, sans rapport avec ce jalon : sur 3 runs
complets, une connexion restée bloquée sur `/connexion` ou une
navigation trop lente a fait échouer un test différent à chaque fois
(Jalon 1, 6bis, 8, 9 — jamais deux fois le même, jamais un test touchant
`/villes`) — même famille de flakiness "serveur de dev" déjà documentée
à plusieurs reprises dans ce journal (Jalons 9/10/11/9 ter/12/13), pas
creusée davantage ici faute de lien avec ce jalon.

### Jalon 14 — rester dans la légalité — 26/09/2026

**Contenu.** Cahier des charges §26 (anti-triche), quatre volets :
« toutes les actions importantes validées côté serveur », « une seule
connexion par joueur et par ville sur la période quotidienne prévue »,
« détection des comportements automatisés et répétitifs », « protection
contre les créations massives de comptes » et « limitation du
multi-compte abusif ». Portée volontairement cadrée avec Adrien avant
de coder (deux questions posées, même démarche qu'au Jalon 13) plutôt
que d'inventer une réponse à un chapitre aussi vaste et sensible (vie
privée, faux positifs) :

- **Validation serveur systématique** : **audit complet** de toutes les
  fonctions SQL `security definer` des 20 migrations (délégué à un
  agent d'exploration, rapport intégral conservé dans l'historique de
  session) — chaque fonction ayant un paramètre "qui agit"
  (`p_joueur_id`, `p_visiteur_id`, `p_attaquant_id`...) vérifie bien
  `auth.uid() is not null and auth.uid() <> p_xxx_id` (code `P0007`
  depuis le correctif du Jalon 4) ; aucune fonction n'accepte une
  valeur numérique de jeu (population, influence, perte, effort) du
  client sans la recalculer serveur ; tous les paramètres texte
  (catégorie, type d'action, position de vote) sont validés contre une
  whitelist avant usage ; aucune table de jeu n'a de policy RLS
  INSERT/UPDATE/DELETE ouverte à `anon`/`authenticated` — 15 policies
  trouvées, toutes en lecture seule. **Aucune anomalie trouvée.**
  Seule vraie trouvaille : la fonction/table `mobiliser`/`mobilisations`
  du Jalon 13, déjà retirée par le correctif du même jalon (rien à
  refaire ici, juste confirmé absente).
- **Une seule connexion par jour** : couvert depuis le Jalon 2, nuancé
  sciemment par le Jalon 13 bis (jusqu'à 3/jour avec délai d'une heure,
  déviation assumée et documentée — voir son propre journal). Rien de
  nouveau ici.
- **Détection de comportements automatisés/répétitifs** : **délai
  anti-rafale d'une seconde** entre deux actions du même type par le
  même joueur, sur `influencer_ville()` et `lancer_action_antiville()`
  (migration `0020`, nouveau code `P0020`, partagé entre les deux
  fonctions — même principe que `P0001`, déjà réutilisé pour plusieurs
  quotas distincts dans ce projet). Ce sont les deux seules actions
  répétables plusieurs fois par jour sans délai propre : Visiter a déjà
  son délai d'une heure (Jalon 13 bis), les actions hebdomadaires (vote,
  décision diplomatique) n'ont pas ce risque avec une seule occurrence
  par semaine. **Explicitement pas une heuristique comportementale** —
  juste de quoi bloquer un script qui enchaîne des appels en boucle sans
  délai, jamais perceptible par un humain qui navigue normalement entre
  deux villes. Décision d'Adrien après question posée : pas d'ambition
  plus poussée pour ce jalon.
- **Créations massives de comptes / multi-compte abusif** : **aucun
  signal technique ajouté**, décision explicite d'Adrien après question
  posée — la règle "un compte = un email vérifié (Supabase Auth) = une
  ville" suffit pour ce projet à cette échelle. Pas de tracking IP ni
  d'empreinte navigateur : coût de complexité et de vie privée jugé
  disproportionné, et le rate-limiting natif de Supabase Auth sur les
  inscriptions existe déjà côté plateforme sans code supplémentaire.

**Écart assumé** : le "délai d'une seconde" a cassé plusieurs tests
existants qui enchaînaient des actions en rafale via l'API service_role
pour construire leurs scénarios (Jalons 3 et 4 — boucles de 3 à 6
appels du même joueur) ; corrigé en reculant explicitement le
`created_at` des actions précédentes entre chaque appel de boucle
(même pattern que le déblocage de délai du Jalon 13 bis), pas en
affaiblissant le garde-fou.

**Testé.** `tests/e2e/jalon14-rester-dans-la-legalite.spec.ts` (nouveau,
3 tests) : deux actions d'influence trop rapprochées refusées (P0020),
débloquées après recul du délai, sans effet de la tentative refusée ;
même vérification pour AntiVille ; le délai est propre à chaque joueur
(deux joueurs distincts agissent sans se gêner). `jalon3-peser-socialement.spec.ts`
et `jalon4-rivalites-de-quartier.spec.ts` mis à jour pour débloquer le
délai entre leurs appels de boucle existants (7 tests au total sur ces
deux fichiers, tous verts) — au passage, le premier test de
`jalon3-peser-socialement.spec.ts` a reçu le même bump de délai de
connexion que tous les autres fichiers e2e du projet (oublié à
l'origine, comme pour `jalon2` au Jalon 13 bis). Suite complète : 73
tests unitaires + 56 tests e2e. Poids du paquet inchangé (aucun
changement de composant client). Croisé en route, sans rapport avec ce
jalon : sur la suite complète, une connexion lente ou une session
navigateur fermée en cours de route a fait échouer un test des Jalons 8
et 9 (jamais `/villes`, Influence ou AntiVille) — même famille de
flakiness "serveur de dev" déjà documentée à plusieurs reprises dans ce
journal (Jalons 9/10/11/9 ter/12/13/13 bis), pas creusée davantage ici.

### Jalon 15 — jouable partout — 26/09/2026

**Contenu.** Passage en PWA installable, manifest, service worker, mode
hors-ligne minimal, vérification manuelle sur mobile et PC. La
découverte principale de ce jalon : le squelette technique (Jalon 0,
23/09/2026) avait déjà posé `public/manifest.json`, `public/sw.js`,
`src/app/register-sw.tsx` et les icônes — la partie "manifest +
installable" était donc déjà faite. Le vrai travail restant :

- **Service worker réécrit** (`public/sw.js`, cache `v1` → `v2`) : la
  version d'origine faisait du cache-first pour tout, y compris les
  pages, ce qui aurait pu un jour servir des données de jeu périmées
  même quand le réseau fonctionne (risque réel pour un jeu multijoueur
  où la fraîcheur compte — voir cahier des charges §9). Nouvelle
  stratégie : les pages (navigation) passent par le réseau en premier
  et sont mises en cache au passage, secours sur la dernière version en
  cache seulement si le réseau échoue, secours ultime sur la page
  d'accueil si la page n'a jamais été visitée ; les assets statiques
  restent cache-first (rafraîchis en arrière-plan) ; tout ce qui n'est
  pas une requête GET same-origin (Supabase, Server Actions) n'est
  jamais intercepté, toujours le réseau — ce sont les données de jeu
  elles-mêmes.
- **Vérifié avec un vrai navigateur** (Chromium piloté par Playwright,
  contre `npm run build && npm start`, script ponctuel non conservé
  comme test automatisé — voir plus bas pourquoi) : le service worker
  s'enregistre bien en production ; une page déjà visitée en ligne
  reste consultable une fois hors-ligne (testé sur `/classement`) ; une
  page jamais visitée, hors-ligne, retombe proprement sur le shell de
  l'accueil en cache plutôt qu'une erreur de navigateur brute (testé
  sur `/jumelages`). Le smoke test existant (`tests/e2e/smoke.spec.ts`,
  Jalon 0) continue de garantir qu'aucun service worker ne s'enregistre
  en développement (`npm run dev`) — bug déjà vécu par Adrien
  (`docs/A-INTEGRER.md` §9), non-régression déjà en place, inchangée.
- **Pas de test automatisé permanent en mode production** : la suite
  e2e de ce projet tourne entièrement contre `npm run dev` (choix
  déjà établi, le service worker y est justement désactivé exprès).
  Ajouter un deuxième serveur Playwright rien que pour ce test aurait
  demandé une vraie infrastructure de test supplémentaire (projet
  Playwright séparé, `npm run build` à chaque run) pour vérifier un
  comportement simple et stable — jugé disproportionné vu le poids/la
  simplicité visés par ce projet. Vérification ponctuelle jugée
  suffisante, comme déjà fait ailleurs dans ce journal ("vérifié aussi
  à l'œil avec un compte jetable").
- **Détection d'un `.next` corrompu en cours de route** : `npm start`
  échouait avec `Cannot find module './vendor-chunks/@supabase.js'`
  après plusieurs démarrages concurrents de serveurs sur le port 3000
  pendant la vérification — résolu par un `rm -rf .next` suivi d'un
  rebuild propre. Pas un bug du projet, un aléa de cette session de
  vérification, noté pour mémoire seulement.

**Vérification manuelle sur mobile et PC : pas faisable par Claude
Code**, cette session n'a pas d'accès à un vrai téléphone Android/iOS
ni à l'installation réelle d'une PWA (ajout à l'écran d'accueil,
lancement en mode standalone). **Demandé à Adrien** : lancer
`npm run build && npm start`, ouvrir `http://<IP locale du PC>:3000`
depuis son téléphone (même Wi-Fi, même méthode qu'au Jalon 6bis),
tenter "Ajouter à l'écran d'accueil" (Android/Chrome et iOS/Safari),
vérifier le lancement en plein écran sans barre d'adresse, et un
rechargement en mode avion pour confirmer le hors-ligne dégradé.

**Testé.** Vérification ponctuelle par script Playwright (voir
ci-dessus, non conservée comme test automatisé) ; suite complète
inchangée : 73 tests unitaires + 56 tests e2e, verte à `--workers=1` —
aucun changement de composant client, `sw.js` n'entre jamais dans le
bundle JS (fichier statique servi tel quel), poids du paquet inchangé.
Vérification manuelle mobile/PC en attente du retour d'Adrien — MVP
(cahier des charges §30) complet une fois confirmée.

### Jalon 13 ter — visite automatique — 26/09/2026

**Contenu.** Trois retours de test d'Adrien reçus le même jour
(`docs/A-INTEGRER.md` §14/§15/§16), tous liés au mécanisme de visite du
Jalon 13 bis, traités ensemble :

- **§14 — panneau flottant réductible sur mobile.** Constat d'Adrien en
  testant sur téléphone : le panneau du bas (`.dock-float`) pouvait
  occuper jusqu'à 55 % de la hauteur d'écran, posé par-dessus la scène
  3D, sans aucun moyen de le réduire pour voir sa ville. Nouveau
  composant `src/components/PanneauFlottant.tsx` : une poignée (visible
  seulement en mobile) bascule le panneau entre "ouvert" et "réduit"
  (42px, juste la poignée) ; état mémorisé en `sessionStorage`, partagé
  entre les 6 pages qui utilisaient `.dock-float` directement
  (`/classement`, `/jumelages`, `/palmares`, `/pays`, `/ville`,
  `/villes`), toutes basculées sur ce composant. CSS : `.dock-contenu`
  vaut `display: contents` par défaut (desktop), pour que le nouveau
  wrapper n'altère strictement rien à la mise en page existante quand
  la poignée n'est pas affichée — bascule en `display: grid` seulement
  sous 640px.
- **§15 (partie A) — visite automatique, plus de bouton.** Demande
  d'Adrien : « il ne faudrait pas avoir à cliquer, ça devrait être
  automatique ». Le bouton "Visiter" est retiré ; `visiterVille()`
  (`src/app/villes/actions.ts`) change de signature (`villeId: string`
  direct plutôt que `FormData`, appelée par du JS, plus par un
  `<form>`) et un nouveau composant `src/components/VisiteAutomatique.tsx`
  déclenche l'appel automatiquement ~2,5 s après l'affichage du panneau
  détail d'une ville (autre ville, ou la sienne depuis le §16
  ci-dessous). **Délai laissé à l'appréciation de Claude Code** par
  Adrien (« risque qu'une visite se déclenche par simple curiosité ») :
  2,5 s choisies pour absorber un aller-retour accidentel (le minuteur
  est annulé si le panneau se ferme avant, via le nettoyage du
  `useEffect`) sans ajouter de geste supplémentaire — le clic qui ouvre
  déjà le panneau (depuis la liste, ou "Ma ville" dans la nav) reste le
  geste volontaire. Un message discret ("Visite comptée, +1 habitant.")
  s'affiche ~1,2 s avant que `router.refresh()` ne fasse basculer
  l'affichage sur le compte à rebours/plafond du Jalon 13 bis (options
  explicitement interchangeables selon la note d'Adrien). **Partie B
  (choix du thème à développer) volontairement pas construite** :
  bloquée derrière `docs/SYSTEME-DEVELOPPEMENT.md`, pas encore validé
  par Adrien — la ville continue de grandir en `population` comme
  aujourd'hui, sans écran de choix.
- **§16 — autoriser l'auto-visite.** Troisième déviation assumée du
  cahier des charges dans ce projet (après le §13/Jalon 13 bis et
  l'assouplissement "zéro coût") : le §3 pose l'attraction d'autres
  joueurs comme LE principe fondateur de la croissance d'une ville.
  Adrien, informé de la contradiction, confirme vouloir qu'un joueur
  puisse visiter sa propre ville, en connaissance de cause — une ville
  isolée sans aucun visiteur extérieur peut désormais progresser, mais
  au mieux 3 fois par jour par elle-même (même délai/plafond que pour
  une autre ville, aucune règle spéciale), très lentement comparé à une
  ville qui recrute de vrais visiteurs. `visiter_ville()` (migration
  `0021`) : retire le contrôle qui levait `P0005` sur l'auto-visite ;
  le code `P0005` devient inutilisé pour cette fonction (toujours actif
  pour Influencer/AntiVille/Jumelage, qui n'ont pas cette évolution —
  auto-influence et auto-attaque n'ont pas de sens, aucune raison de
  les ouvrir). `src/app/ville/page.tsx` ("Ma ville") gagne les mêmes
  requêtes de délai/plafond que `/villes` et le même `VisiteAutomatique`.

**Testé.** `tests/e2e/jalon13ter-visite-automatique.spec.ts` (nouveau,
3 tests) : l'auto-visite est acceptée puis re-bloquée par le délai
(P0018, comme pour une autre ville) ; la page `/ville` compte une
auto-visite automatiquement, sans bouton "Visiter" (absent, count 0) ;
le panneau flottant se réduit et s'agrandit sur mobile (375×812), le
nom de la ville disparaît/réapparaît avec. `tests/e2e/jalon2-grandir-grace-aux-autres.spec.ts`
et `tests/e2e/jalon13bis-revenir-plus-souvent.spec.ts` mis à jour pour
la visite automatique (attendent le délai au lieu de cliquer) ; le test
"auto-visite refusée" de `jalon2` retiré (devenu faux). Vérifié aussi à
l'œil avant la migration `0021` (dégrade proprement : page affichée
normalement, `console.error` côté serveur pour `P0005` absorbé
silencieusement côté UI, population inchangée) et après (auto-visite
comptée, population +1, confirmé en base). Poids du paquet : léger
supplément lié à `PanneauFlottant` sur les 6 pages concernées (max
+6 Ko sur `/classement`/`/jumelages`/`/palmares`, +2 Ko sur `/villes`,
inchangé sur `/pays`), toujours largement dans le budget de 500 Ko.
Suite complète : 73 tests unitaires + 58 tests e2e, verte à
`--workers=1` (migration `0021` appliquée par Adrien avant ce dernier
run). Croisé en route, sans rapport avec ce jalon : le test fragile déjà
documenté de `jalon8-se-classer.spec.ts` (rang national dynamique) a
échoué une fois, le serveur de dev étant partagé avec Adrien pendant sa
propre vérification manuelle au même moment — même famille de
flakiness "serveur de dev"/données partagées déjà rencontrée à
plusieurs reprises dans ce journal.

---

### Jalon 16 — croissance rapide en début de partie — 26/09/2026

**Contenu.** `docs/A-INTEGRER.md` §17 : Adrien a remonté qu'une ville
neuve grandit trop lentement (+1 habitant par visite, quel que soit le
niveau) pour donner une sensation de progression gratifiante les
premiers jours — objectif de rétention déjà posé au §13 (Jalon 13 bis).
Pas une déviation du cahier des charges, un ajustement d'équilibrage ;
chiffres exacts **laissés à l'appréciation de Claude Code** ("tranche
selon tes reco"). Retenu, bas de la fourchette proposée par Adrien (à
ajuster avec les villes de test si besoin) :

| Niveau visité | Gain par visite |
|---|---|
| Hameau (< 1 000 hab.) | ×5 |
| Village (1 000-4 999 hab.) | ×2 |
| Bourg et au-delà (≥ 5 000 hab.) | ×1 (rythme actuel, inchangé) |

Le gain dépend de la population **avant** la visite : une visite qui
fait franchir un seuil garde le gain du niveau de départ pour cette
visite-là (pas de bonus rétroactif). `visiter_ville()` (migration
`0022`) recalcule ce gain à chaque appel plutôt que d'ajouter un flat
+1 ; signature et type de retour inchangés depuis la migration `0021`,
donc `create or replace` direct, sans le contournement habituel des
migrations précédentes (Jalons 8/13). Nouveau
`src/lib/game/gainVisite.ts`, copie TypeScript de la même règle
("source de vérité" pour l'affichage et les tests unitaires, à tenir
manuellement synchronisée avec la fonction SQL) — utilisé par
`/villes` et `/ville` pour annoncer le gain avant la visite ("+5
population · 0/3") et par `VisiteAutomatique` pour le message de
confirmation après coup. i18n : `villes.visiteComptee` perdait son
"+1 habitant" fixe (règle du projet : jamais de nombre dans une chaîne
traduite) — désormais juste "Visite comptée," suivi du nombre
interpolé en JSX.

**Testé.** `tests/unit/gainVisite.test.ts` (nouveau, 3 tests, un par
palier avec les valeurs limites 999/1000 et 4999/5000). Tous les tests
e2e qui vérifiaient une population calculée à partir du flat +1 ont dû
être audités et corrigés (recherche systématique de tout appel à
`visiter_ville` ou toute assertion sur `population`) :
`jalon2-grandir-grace-aux-autres.spec.ts`,
`jalon5-villes-jumelles.spec.ts`,
`jalon13bis-revenir-plus-souvent.spec.ts`,
`jalon13ter-visite-automatique.spec.ts` (toutes les villes de test
partent à population 1, donc restent au palier Hameau ×5 sur toute la
durée de ces scénarios). `jalon8bis-palmares.spec.ts` a été
initialement corrigé à tort (le palmarès de croissance compte des
*événements* — visites + bonus de jumelage reçus — pas les habitants
gagnés ; sa valeur ne dépend pas du gain par visite et n'avait pas à
changer, corrigé une seconde fois pour revenir à l'attendu d'origine).

En creusant les échecs restants de ces quatre fichiers, une vraie
source de flakiness a été isolée (pas une régression du Jalon 16) : en
environnement de test headless, la scène 3D (`SincroniserScene`)
provoque des « GPU stall due to ReadPixels » qui bloquent le thread
principal, retardant le minuteur de 2,5 s de `VisiteAutomatique`
jusqu'à ~8,5 s dans certaines conditions — confirmé en instrumentant
un test temporaire avec les timestamps réels de la requête réseau du
serveur action. Les assertions `toBeVisible({ timeout: 8_000 })` liées
à un cycle de visite automatique ont donc été portées à 15 000 ms dans
les quatre fichiers ci-dessus, cohérent avec la convention déjà en
place ("ne jamais faire confiance à un timeout par défaut trop
serré"). Seconde source de bruit rencontrée en cours de route et sans
rapport avec le Jalon 16 : des comptes de diagnostic créés
manuellement pour cet investigation avaient des noms de ville
contenant la sous-chaîne `cible-ville`, entrant en collision avec les
regex de recherche des tests — nettoyés (supprimés) après coup ;
rappel pour la suite de toujours nettoyer tout compte créé
manuellement en dehors d'un test avant de relancer la suite.

Suite complète après ces corrections : 76 tests unitaires + 58 tests
e2e, `--workers=1`. Les 4 fichiers touchés par ce jalon passent tous ;
6 échecs résiduels dans des fichiers non touchés par ce jalon (Jalons
1, 4, 6bis, 8, 9, 10), tous des timeouts génériques de connexion —
même famille de flakiness environnementale que ci-dessus, pas un
suivi qui bloque ce jalon. Poids du paquet inchangé (`gainVisite.ts`
est quelques lignes pures, aucune nouvelle dépendance) : First Load JS
toujours au maximum 182 Ko, largement dans le budget de 500 Ko.

### Annulation du Jalon 16 — 27/09/2026

**Contenu.** Adrien revient sur le principe même du Jalon 16 dès le
lendemain : il ne veut pas d'un gain de population dégressif, le gain
par visite doit rester un flat **+1**, comme avant. La sensation de
croissance recherchée doit passer par le **rendu 3D** plutôt que par le
chiffre de population : il veut voir de nouvelles habitations
apparaître régulièrement (« tous les 4 habitants par exemple pour un
hameau ») et demande qu'on définisse combien d'habitants correspondent
à une habitation.

Tout le contenu du Jalon 16 est donc défait : `visiter_ville()`
(migration `0022`, réécrite et renvoyée à Adrien pour ré-application —
un `create or replace` écrase la version dégressive sans distinction
d'historique) revient au flat +1 de la migration `0021` ;
`src/lib/game/gainVisite.ts` et son test supprimés ; `/villes`,
`/ville` et `VisiteAutomatique` reviennent à une constante
`GAIN_VISITE = 1` locale à chaque page (même style que
`QUOTA_VISITE_QUOTIDIEN`/`DELAI_VISITE_MINUTES` déjà présents). Gardé
en revanche, indépendant de la question dégressif/flat : l'hygiène
i18n sur `villes.visiteComptee` (nombre interpolé en JSX, jamais dans
la chaîne traduite) et le correctif de flakiness des tests e2e
(timeouts de 15 s sur les cycles de `VisiteAutomatique`, la scène 3D
pouvant ralentir le thread principal en environnement headless — voir
journal du Jalon 16 ci-dessus).

**Point ouvert — "combien d'habitants par habitation".** Le
générateur 3D (`src/lib/ville3d/`, docs/DECISIONS.md §8) a en réalité
*déjà* une logique de révélation progressive maison par maison, pas
seulement bloc par bloc : dans `terrain.ts::buildBlock`, les 4
premières parcelles d'un bloc apparaissent à des seuils espacés de
`gap × 0,2` à l'intérieur de l'écart entre deux blocs
(`constantes.ts::BLOCK_OPEN`) — pour le tout premier bloc d'un Hameau
(écart 0 → 300), cela donne une maison à population 0, 60, 120 puis
180. C'est déjà plus fin qu'un bloc entier, mais bien plus grossier que
le rythme "tous les 4 habitants" évoqué par Adrien, et ce rythme n'est
pas un simple paramètre isolé : il découle du nombre de blocs déjà
tunés (`BLOCK_OPEN`, `STAGE_AT`, testés par
`tests/unit/ville3dCroissance.test.ts` qui garantit qu'un bloc déjà
ouvert ne bouge jamais). Soumis à Adrien via une question à choix
(retoucher juste les seuils existants, ou refonte complète par type de
bâtiment) : il choisit la refonte complète — voir la mise en œuvre
ci-dessous.

### « Habitants par habitation » — 27/09/2026

**Contenu.** Implémentation du point ouvert ci-dessus, pour la partie
**maisons individuelles** : nouvelle constante
`HABITANTS_PAR_LOGEMENT_MAISON = 4` (`src/lib/ville3d/constantes.ts`,
chiffre donné par Adrien lui-même) — une maison est UN logement, et les
4 maisons d'un bloc (`terrain.ts::buildBlock`) apparaissent maintenant
à `openAt + idx × 4` au lieu de `openAt + gap × idx × 0,2`. Concrètement,
les 4 maisons d'un bloc qui vient de s'ouvrir sont toutes visibles en
douze habitants, contre 180 avant (pour le tout premier bloc d'un
Hameau) — même règle du Hameau à la Métropole, puisque c'est un écart
absolu, pas une fraction de l'écart jusqu'au bloc suivant.

**Immeubles et tours volontairement laissés inchangés**, et c'est un
choix assumé plutôt qu'un oubli : un seul étage d'immeuble ou de tour
loge d'emblée plusieurs foyers, donc le même "4 habitants par logement"
n'a pas de sens direct à cette échelle sans une refonte beaucoup plus
lourde (`APART_FLOOR_EVERY`, `PER_FLOOR` sont calés sur les repères de
densité du cahier des charges — ~28 blocs à 100 000 habitants, ~58 à
250 000, voir journal du Jalon 7bis — les retoucher risquerait de
casser un équilibre déjà vérifié). Point à rouvrir avec Adrien si le
rythme des immeubles/tours doit lui aussi être repensé — voir §10
point 33.

**Testé.** Nouveau test dans
`tests/unit/ville3dCroissance.test.ts` : pour le premier bloc d'une
ville, la géométrie ne change pas entre deux seuils de 4 habitants,
puis change exactement au seuil suivant (vérifié aux trois premiers
paliers de maisons, 4/8/12). Suite existante inchangée (déterminisme,
seuils de blocs, repères 28/58, stabilité) : aucune régression, la
constante ne touche que le calcul interne du seuil, jamais le nombre ou
l'ordre des blocs. Vérifié aussi à l'œil : ville de test à population
1 (une maison), puis 4 (deuxième maison visible), captures à l'appui.

### Jalon 17 — Système de développement des villes (1/4) : choix d'activité et jauges — 27/09/2026

**Contenu.** Premier des quatre jalons du chantier validé par Adrien
(`docs/A-INTEGRER.md` §18, `docs/SYSTEME-DEVELOPPEMENT.md` §9 point 1) :
les 7 jauges de développement (Résidentiel, Industrie, Commerce,
Loisirs, Services, Énergie, Recherche), le choix d'une activité par
visite, la recommandation du maire, l'affichage des jauges. **Aucun
effet de jeu encore** (bonus/malus/manifestations/AntiVille : Jalon 18).

Deux points du document initial (rédigé le 23/09, avant le Jalon 13
ter) contredisaient des décisions déjà prises — **signalés à Adrien
plutôt que tranchés seul**, comme le demande `GUIDE-METHODE.md` :

1. Le document suppose qu'à chaque visite, le visiteur choisit une
   activité — mais depuis le Jalon 13 ter, visiter est devenu
   automatique et silencieux (2,5 s, aucun clic), exactement pour
   supprimer ce genre de friction. Adrien (27/09/2026) : **la visite
   reste 100 % automatique pour la population ; le choix d'activité
   est une action séparée et facultative, ensuite** — si le visiteur ne
   choisit rien, une activité est tirée au sort dès la visite (pas
   d'état "en attente" à gérer côté serveur).
2. Le document dit "le propriétaire ne peut pas se visiter lui-même,
   mais il a une contribution de maire gratuite par jour" — écrit avant
   que le Jalon 13 ter autorise l'auto-visite. Adrien : **se visiter
   soi-même suit exactement la même règle qu'une autre ville** (déjà
   vrai depuis le Jalon 13 ter) ; l'idée d'une "contribution de maire"
   séparée est abandonnée.

**Base de données** (migration `0023`, qui inclut aussi le retour au
flat +1 du Jalon 16 annulé — `visiter_ville()` réécrite en entier,
donc pas besoin de rejouer la `0022` séparément) :
- `visites.activite` (nullable, contrainte sur les 7 valeurs) : tirée
  au hasard par `visiter_ville()` parmi les activités débloquées pour
  le niveau de la ville (`§10 point 8` : Résidentiel/Loisirs dès le
  Hameau, Commerce/Services dès Village (1 000), Industrie/Énergie dès
  Bourg (5 000), Recherche dès Ville (15 000)).
- `choisir_activite_visite(visiteur, ville, activite)` : remplace
  l'activité de la **toute dernière** visite du joueur pour cette
  ville, seulement dans les 5 minutes qui suivent (fenêtre de grâce —
  largement assez pour le délai de 2,5 s côté client, sans laisser
  modifier une visite ancienne). Erreurs : `P0021` (pas de visite
  récente), `P0022` (activité invalide ou non débloquée).
- `cities.recommandation_activite` (nullable) + `definir_recommandation()` :
  réservée au propriétaire (vérifié côté SQL), même contrôle de
  déblocage que le choix d'activité.
- `jauges_ville(ville)` : jauge de chaque activité, formule du §3
  (`(élan + 20×part) / (élan_total + 20) / part`), "élan" = somme des
  points pondérée par une décroissance exponentielle de 3,3 %/jour
  (demi-vie ~3 semaines) calculée **à la volée** depuis `visites`
  plutôt que maintenue dans un compteur à part — même logique que
  `activite_ville()` (Jalon 9) : aucun job planifié nécessaire. Fenêtre
  de 180 jours (poids résiduel ~0,3 % au-delà, négligeable) pour borner
  le coût de la requête sur une ville ancienne et active.

**Code applicatif** : `src/lib/game/activites.ts` (les 7 activités,
parts cibles, seuils de déblocage par niveau, lecture des couleurs de
jauge — copie TypeScript de la même règle que le SQL, à tenir
synchronisée) ; `src/components/JaugesActivites.tsx` (affichage) ;
`/ville` gagne un petit formulaire pour que le maire choisisse sa
recommandation.

**Choix de conception revu en cours de route** (constaté en testant,
pas anticipé au départ) : la première version rattachait le choix
d'activité à `VisiteAutomatique.tsx`, affiché quelques secondes après
la confirmation de la visite avant que le panneau ne se rafraîchisse.
En testant, le rafraîchissement s'est avéré arriver bien plus vite que
prévu — le framework revalide la page dès que l'action serveur répond,
pas seulement après le délai choisi côté client — laissant une fenêtre
de choix trop courte et peu fiable pour qu'un joueur ait le temps de
cliquer. Plutôt que de chasser ce timing, le choix d'activité a été
détaché en un composant séparé et persistant,
`src/components/ChoisirActivite.tsx` : il lit l'activité réellement
enregistrée pour la dernière visite du joueur (donnée serveur, tant
qu'elle reste dans la fenêtre de grâce de 5 minutes de
`choisir_activite_visite()`) et l'affiche durablement ("Activité
choisie : 🏠 Résidentiel — Changer"), qu'il y ait eu zéro, un ou
plusieurs rafraîchissements entre-temps. `VisiteAutomatique.tsx` revient
à son rôle d'origine (confirmation de la visite elle-même, +1
population), sans rapport avec le choix d'activité.

**Bug trouvé et corrigé en cours de route** (sans lien direct avec le
choix de conception, une vraie régression) : avec la migration en
attente d'application, `/ville` interrogeait `cities.recommandation_activite`
(colonne pas encore créée), la requête échouait, `ville` devenait
`null`, et le code redirigeait vers `/ville/creer` — qui redirige lui
-même vers `/ville` dès qu'un profil existe : **boucle de redirection
infinie** pour tout compte existant, reproduite et confirmée dans les
logs du serveur de dev. Corrigé en distinguant "vraiment pas de
ville" (redirige) de "erreur de requête" (log l'erreur, affiche un
message générique, ne redirige jamais) — `src/app/ville/page.tsx`.
Cette distinction n'existait pas avant et aurait pu se reproduire à
n'importe quel jalon futur touchant `cities` ; corrigée une bonne fois.

**Testé.** `tests/unit/activites.test.ts` (10 tests : seuils de
déblocage par niveau, parts cibles = 100 %, bornes des 4 états de
jauge). `tests/e2e/jalon17-choisir-activite.spec.ts` (nouveau, 7
tests) : tirage aléatoire d'une activité débloquée pour un Hameau ;
`choisir_activite_visite` remplace le choix dans la fenêtre de grâce et
refuse une activité non débloquée (sans écraser le choix valide
précédent) ; échoue sans visite récente (aucune, ou trop ancienne) ;
l'auto-visite suit la même règle qu'une autre ville ; `definir_recommandation`
réservée au maire, refuse une activité non débloquée, accepte
d'effacer (`null`) ; `jauges_ville` vérifiée contre la formule calculée
à la main (10 visites Résidentiel un même jour) et contre la
décroissance attendue (élan résiduel ~0,5 après 21 jours, ni 1 ni 0) ;
un test UI vérifie que les jauges s'affichent et que l'activité choisie
reste visible et modifiable après une visite. Migration `0023`
appliquée par Adrien, confirmée par une vérification directe (gain
flat +1, activité tirée au sort, `jauges_ville` répond). Suite e2e
complète relancée : 50 tests verts (dont les 8 du Jalon 17 et les 4
fichiers touchés par le retour au flat +1) ; 7 échecs résiduels dans
des fichiers non touchés par ce jalon (Jalons 1, 4, 6bis, 8, 9, 10, 13),
même famille de flakiness environnementale déjà documentée (timeouts
génériques de connexion, scène 3D ralentissant le thread principal en
headless). Pollution de test croisée en cours de route et sans rapport
avec le jalon lui-même : des comptes `j17-ui-*` créés pendant le
débogage du composant de choix d'activité n'avaient pas été nettoyés
après un `test.setTimeout` forcé (le bloc `finally` n'a pas eu
l'occasion de s'exécuter) — nettoyés après coup, même rappel que
d'habitude sur les comptes de diagnostic créés manuellement.
Typecheck, lint, suite unitaire (84 tests) et build (poids inchangé)
verts.

### Jalon 18 — Système de développement des villes (2/4) : les effets de l'équilibre — 27/09/2026

**Contenu.** Deuxième des quatre jalons du chantier
(`docs/A-INTEGRER.md` §18) : branche les bonus/crises des 7 activités
(§4), les manifestations (§5) et le lien AntiVille (§6bis) posés sans
effet au Jalon 17. Périmètre volontairement resserré — voir l'en-tête
de la migration `0024` pour le détail complet — en laissant de côté
les mégaprojets/stocks/technologies (§6, Jalon 20), la vocation des
quartiers (Jalon 19), et deux effets purement cosmétiques renvoyés en
points ouverts (§10 points 34 et 35 : gratte-ciel qui se figent en
crise Énergie, fumée 3D au palier Émeutes / notification du pays au
palier Crise).

**Grève redéfinie par Adrien (27/09/2026), signalé plutôt que tranché
seul.** Le document initial (23/09) se contredisait entre "bloque
24 h, durée modulée par l'Industrie" (tableau) et "−0,1 % d'influence
par attaque, cumulé" (liste des effets unitaires) — deux mécaniques
different. Adrien tranche : une échelle selon le nombre CUMULÉ
d'actions grève reçues aujourd'hui (tous attaquants, pas par
attaquant) — 1 action → bloque 1 h, 5 → 2 h, 20 → 5 h pour un Hameau,
ajustée par la taille de la ville ("plus la ville est grosse, plus il
faudra d'actions"). Formule retenue pour relier ces trois points
(chiffres exacts délégués à Claude Code) : racine carrée du nombre
d'actions divisé par un facteur de taille calqué sur l'échelle des
niveaux (1/2/5/10/25/50 du Hameau à la Métropole) —
`duree_blocage_greve_heures()`, à ajuster avec les villes de test.
L'Industrie continue de moduler cette durée (jusqu'à −60 % en point
fort, +50 % en crise).

**L'ancienne "protection anti-harcèlement"** (par paire attaquant/cible,
2 attaques en 24h → effet réduit, 3e bloquée, code P0003) est
**entièrement remplacée** par le nouveau système de paliers cumulés
PAR VILLE (tous attaquants confondus) — une attaque isolée pèse peu
(effet unitaire minuscule : contamination −0,01 % au moins 1,
propagande −0,1 % au moins 1), une attaque massive coordonnée pèse
lourd (effets qui s'additionnent, plafonnés à 10 %/jour pour
contamination et propagande). Paliers visibles : Incidents (1-9
attaques/jour) → Troubles (10-99) → Émeutes (100-499) → Crise
(500-999) → Ville sinistrée (1000+, plafond atteint, plus aucune perte
jusqu'au lendemain). P0003 devient inutilisé (même précédent que
P0005) ; le quota par attaquant (3/jour) et l'anti-rafale (2 s, Jalon
14) restent inchangés — protections différentes, pas remplacées.

**Formules retenues pour les effets progressifs** (§4 : "montent de 0
à leur maximum entre 60 % et 150 % de jauge, plafonnés") — la
lecture du document laissait une ambiguïté entre une progression
continue sur toute la plage et deux effets séparés ancrés à 60 %/150 % ;
retenu : deux fonctions symétriques,
`intensite_crise(jauge)` = 0 à 60 % → 1 à 0 % ; `intensite_point_fort(jauge)`
= 0 à 120 % → 1 à 150 % (et au-delà, plafonné) — la zone 60-120 %
(Fragile + Équilibré) n'a par construction aucun effet numérique, elle
ne fait qu'avertir visuellement (cohérent avec le tableau §4, qui ne
liste que "Point fort" et "Crise", jamais "Fragile"). Chaque effet du
tableau applique cette intensité à son maximum donné (ex. Industrie
point fort : durée × (1 − 0,6 × intensité) ; Énergie crise :
risque de manifestation × (1 + intensité)) — sauf indication contraire
explicite du document : le Résidentiel garde sa formule propre
(probabilité = jauge ÷ 60 %, donnée telle quelle) et le Commerce en
crise perd le bonus de jumelage de façon binaire ("pas de bonus", pas
de "jusqu'à").

**Solidarité** (§6bis, "optionnel, à valider" dans le document, mais
confirmée gardée par `A-INTEGRER.md` §18/§10 point 6) : si une visite
choisit (au hasard ou explicitement, via `choisir_activite_visite`)
l'activité qui protège contre le type de la dernière attaque reçue
dans les 24h, +1 habitant de plus (+2 au palier Émeutes et au-delà,
"solidarité doublée pour les défenseurs"). Une seule fois par visite
(`visites.bonus_solidarite_applique`), jamais retiré si l'activité
change ensuite.

**Manifestations** (§5) : pas de tâche planifiée dans ce projet (même
choix que `activite_ville()`, Jalon 9, et `verifier_president()`,
Jalon 11) — `verifier_manifestation()` est appelée de façon
opportuniste à chaque affichage de la page d'une ville (`/ville` et
`/villes`), idempotente via `cities.derniere_verification_manifestation`.
Risque = +10 points par activité en crise (+20 pour l'Énergie),
divisé progressivement si l'Énergie est en point fort ; perte de 1 %
des habitants (plancher 1), réduite/aggravée par les Loisirs, jamais
plus d'une fois par ville et par jour. Une ville équilibrée n'a
jamais de manifestation.

**Bulletin municipal** : nouvelle table `city_events` (lecture
publique, comme `cities`), remplie par `lancer_action_antiville()` et
`verifier_manifestation()`. Affiché en bas du panneau détail sur
`/villes` et `/ville` (`BulletinMunicipal.tsx`) — dernières
manifestations et attaques reçues, sans jamais mélanger avec les
lignes "vérifié, rien trouvé" (idempotence gérée par une date sur
`cities`, pas par une ligne `city_events` à blanc — sinon le bulletin
se serait rempli de bruit).

**Bug trouvé et corrigé en cours de route** (pas un choix de
conception, une régression réelle du Jalon 17 mise au jour en
préparant ce jalon) : le message de confirmation de visite
(`VisiteAutomatique.tsx`) affichait toujours "+1 population", recopié
depuis une prop statique calculée AVANT la visite — jamais le vrai
gain renvoyé par le serveur. Sans conséquence tant que le gain était
garanti (avant ce jalon), mais devenu trompeur dès que le Résidentiel
peut être en crise (gain réellement à 0 alors que l'UI annoncerait
"+1"). `visiter_ville()` change de type de retour (jsonb avec le gain
réel inclus) pour corriger ça — voir la note sur `drop function`
ci-dessous.

**Base de données** (migration `0024`, ~820 lignes — la plus grosse du
projet à ce jour) :
- `visiter_ville()` : type de retour changé en `jsonb` (gain réel,
  jamais garanti) → `drop function` avant `create` (piège habituel des
  changements de type de retour, voir Jalons 8/13/16). `lancer_action_antiville()`,
  `choisir_activite_visite()`, `reclamer_bonus_jumelages()`,
  `influencer_ville()` : signature et type de retour inchangés,
  `create or replace` direct.
- Nouvelles fonctions utilitaires pures : `jauge_activite()` (une
  seule jauge, wrapper de `jauges_ville()`), `intensite_crise()`,
  `intensite_point_fort()`, `activite_protectrice()`,
  `attaques_recues_aujourdhui()`, `palier_attaques()`,
  `ratio_taille_ville()`, `duree_blocage_greve_heures()`.
- `visites.bonus_solidarite_applique`, `cities.derniere_verification_manifestation`,
  `actions_antiville.duree_heures` (nouvelles colonnes).

**Testé.** `tests/unit/antiville.test.ts` (2 tests : bornes exactes des
6 paliers, copie TypeScript de `palier_attaques()`).
`tests/e2e/jalon18-effets-equilibre.spec.ts` (nouveau, 9 tests) :
palier cumulé tous attaquants confondus ; plafond de 10 %/jour pour la
contamination (12 attaques sur une ville à 100 habitants, jamais plus
de 10 perdus) ; durée de grève dépendante du cumul du jour ; crise du
Résidentiel (ville poussée en crise profonde via un historique de
visites synthétique — voir `gonflerActivite()`, contourne la
contrainte unique `(visiteur_id, ville_id, jour)` avec des dates
différentes plutôt que des centaines de comptes — puis 15 vraies
visites, gain total < 15 avec une probabilité d'échec du test
≈ 3×10⁻¹¹ si la crise n'a plus d'effet) ; solidarité (accordée une
fois, pas deux) ; crise du Commerce sur le bonus de jumelage (une
ville touchée, l'autre non) ; `verifier_manifestation` neutre et
idempotente sur une ville équilibrée, puis déclenchée sur au moins une
de 8 villes en crise profonde indépendantes (probabilité d'échec
≈ 2,6×10⁻⁶) ; point fort Recherche sur l'influence (15 essais,
probabilité d'échec ≈ 3×10⁻⁵ si le doublement n'existe plus). Tests
existants audités et mis à jour : `jalon4-rivalites-de-quartier.spec.ts`
(protection anti-harcèlement remplacée par une vérification que le
même attaquant peut désormais frapper la même cible plusieurs fois de
suite) ; `jalon8bis-palmares.spec.ts` et `jalon6-donnees-rendu-3d.spec.ts`
(commentaires et formule de calcul de la perte attendue mis à jour —
la valeur numérique elle-même ne changeait pas pour une ville de test
à très petite population, coïncidence du plancher "au moins 1").
Typecheck, lint, suite unitaire (86 tests) et build (poids inchangé,
182 Ko max) verts.

**Bug trouvé après application de la migration** (vérification directe
par RPC, avant même de relancer la suite e2e) : le plafond quotidien de
perte (10 % de la population/influence **avant** l'attaque) valait 0
quand cette valeur de départ était nulle ou très petite — 10 % de
presque rien s'arrondit à 0, donc une ville neuve (0 influence)
devenait **immunisée** contre toute propagande, même la toute première
attaque du jour. Corrigé par un plancher `greatest(1, ...)` sur le
plafond lui-même (migration corrective `0025`, appliquée par Adrien) —
cohérent avec le plancher "au moins 1" déjà appliqué à l'effet unitaire
de chaque attaque.

**Suite e2e complète relancée après les deux migrations** : 73 tests
verts (dont les 9 du Jalon 18). Deux échecs rencontrés en cours de
route, tous deux sans rapport avec ce jalon : `jalon13-france-contre-allemagne.spec.ts`
(donnée résiduelle d'un run interrompu plus tôt dans la session — une
ligne `conflits` Argentine/Mexique jamais nettoyée — supprimée
manuellement, le test repasse ensuite) ; `jalon8-se-classer.spec.ts`
(flakiness déjà documentée à plusieurs reprises dans ce journal, "rang
national dynamique"). Un des 9 tests du Jalon 18 lui-même
(`crise du Résidentiel`) a d'abord échoué à son tour : le calcul à la
main dans son commentaire s'est avéré faux (élan d'une seule activité
gonflée ≈ 30, jauge Résidentiel ≈ 40 %, probabilité de gain ≈ 67 % —
pas assez creusé pour rendre 15 succès sur 15 improbable). Corrigé en
gonflant trois activités au lieu d'une (élan total ≈ 90, jauge ≈ 18 %,
probabilité ≈ 30 %, probabilité d'échec du test ≈ 1,4×10⁻⁸) — vérifié
fiable sur plusieurs relances.

### Jalon 19 — Système de développement des villes (3/4) : quartiers et bâtiments 3D — 27/09/2026

**Contenu.** Troisième des quatre jalons du chantier : la vocation de
chaque bloc (§7 — résidentiel, industrie, commerce, loisirs, services,
recherche, une fois pour toutes à l'ouverture du bloc) et les nouveaux
bâtiments 3D qui vont avec, plus l'Énergie hors de la ville (panneaux
solaires, éoliennes, puis centrale, dans la campagne autour). Adrien a
été interrogé explicitement sur l'ampleur du jalon avant de commencer
(les 5 nouvelles vocations de quartier représentent d'un coup plus de
nouveaux bâtiments que tous les jalons précédents cumulés) et a choisi
la **version complète** (progression à deux étapes pour chacune, plutôt
qu'un seul stade fixe).

**Portée réduite assumée, à signaler explicitement : deux étapes par
vocation de quartier, pas trois ou quatre.** Le document (§7) décrit
jusqu'à 4 étapes par activité ("entrepôts et ateliers, puis usines et
cheminées, puis grand complexe" pour l'Industrie, "école puis
université, campus, laboratoires" pour la Recherche, etc.), à la
manière des maisons → immeubles → tours du Résidentiel. Implémenté ici
avec seulement **deux étapes** ("simple", puis "développée") par
vocation — moins riche que ce qu'Adrien a validé en choisissant
"version complète". Compromis choisi par Claude Code pour livrer les
6 vocations (5 quartiers + Énergie hors-ville) avec une silhouette et
une couleur clairement distinctes chacune, dans un temps raisonnable,
plutôt que 2-3 vocations à 4 étapes chacune. Loisirs suit son propre
schéma proche du document (parc, comme avant le Jalon 6bis, puis un
stade simplifié) ; les 4 autres (Industrie, Commerce, Services,
Recherche) ont chacune un bâtiment "simple" et un bâtiment "développé"
avec une silhouette/couleur/accessoire dédiés (silo pour l'Industrie,
enseigne et vitrine pour le Commerce, croix pour les Services, dôme
pour la Recherche). **À valider par Adrien** : garder ces deux étapes,
ou demander d'aller vers 3-4 étapes par vocation dans un futur passage.

**Blocs identifiés par RANG, jamais par coordonnées (bi, bj).**
L'ordre d'ouverture des blocs (`planifierBlocs()`, distance au centre +
aléa stable par ville) est déjà une fonction pure de la graine et de la
population — le dupliquer en SQL (avec son générateur pseudo-aléatoire)
aurait été fragile et inutile. La nouvelle table `city_blocks` retient
donc seulement `(ville_id, rang, vocation)` ; le rang k du client
(`planifierBlocs()`) correspond exactement au rang k stocké en base.

**Algorithme d'assignation** (§7, "l'activité la plus en retard entre
sa part de points et sa part de blocs, le résidentiel garde au moins la
moitié des blocs") : `assigner_vocations_blocs()`, appelée de façon
opportuniste à chaque affichage d'une ville (même logique que
`verifier_manifestation()`), idempotente — ne retouche jamais un bloc
déjà en base. Entièrement déterministe (aucun tirage au sort,
contrairement aux mécaniques du Jalon 18) : à élan nul partout, la
séquence des 8 premiers blocs est toujours résidentiel, commerce,
résidentiel, industrie, résidentiel, loisirs, résidentiel, recherche —
départage alphabétique stable entre les 5 activités de quartier à
égalité. Testé valeur par valeur plutôt que statistiquement (voir Testé
ci-dessous).

**Énergie, hors de la ville** (§7) : pas de bloc dans la ville, des
installations dans la campagne autour (éoliennes et panneaux solaires),
en nombre proportionnel à l'élan de l'activité (`jauges_ville()`), puis
une centrale au-delà d'un seuil. Emplacements tirés une fois par ville
(un générateur par indice, comme les forêts de `buildCountryside()`) :
une installation déjà visible ne se déplace jamais quand l'élan
grandit, et une position avalée par la ville en grandissant est
simplement sautée (même dégradation que les forêts). Seuils choisis par
Claude Code (un repère tous les 4 points d'élan, comme
`HABITANTS_PAR_LOGEMENT_MAISON`, jusqu'à 24 installations, centrale à
partir de 100) — **à ajuster avec les villes de test si besoin**, comme
les autres chiffres délégués des Jalons 17-18.

**Le gratte-ciel reste une règle strictement résidentielle** (§7 : "la
règle actuelle maisons → immeubles → tours reste celle des blocs
résidentiels") : un bloc de quartier n'a jamais de chantier de
gratte-ciel, cet emplacement reste un square public en permanence.

**Base de données** (migration `0026`, nouvelle table `city_blocks` +
deux fonctions) :
- `city_blocks(id, ville_id, rang, vocation, created_at)`, lecture
  publique (comme `cities`), jamais écrite depuis le client.
- `nb_blocs_ouverts(population)` : copie SQL de la table de seuils
  `BLOCK_OPEN`/`openAtK()` (`src/lib/ville3d/constantes.ts`) — à tenir
  synchronisée si ces seuils changent côté 3D.
- `assigner_vocations_blocs(ville_id)` : voir l'algorithme ci-dessus.
  Aucun nouveau code d'erreur (rien d'appelable directement par un
  joueur).

**Câblage 3D** : `generate()` et `planifierBlocs()` (`generer.ts`)
prennent désormais des paramètres optionnels `vocations` (Map rang →
vocation) et `elanEnergie`, absents = dégradation propre vers
"tout résidentiel, pas d'installation Énergie" (ville dont les blocs
n'ont pas encore de vocation assignée, ou plus vieille que ce jalon).
`buildBlock()` (`terrain.ts`) branche sur `b.vocation` pour choisir les
bâtiments de chaque parcelle et ne jamais construire de gratte-ciel
hors résidentiel. Câblé bout en bout uniquement sur les deux pages qui
affichent une ville précise avec ses vraies données (`/ville`,
`/villes`) — pas sur les pages de vitrine/classement (accueil,
classement, jumelages, palmarès, aperçu de création), qui continuent
d'afficher une ville générique tout-résidentiel (même choix que
`verifier_manifestation()`, jamais appelée non plus sur ces pages).

**Testé.** Vérification directe du générateur (script jetable, en
dehors du pipeline de test — comparaison des couleurs de sommets
générées aux palettes attendues) avant toute vérification visuelle,
après une fausse alerte : le premier essai dans le navigateur semblait
montrer une ville inchangée malgré les nouveaux paramètres, à cause
d'un état de Fast Refresh périmé (tableau de dépendances de
`useEffect` qui change de taille) — un nouvel onglet a suffi à lever le
doute, et la vérification programmatique a confirmé que les couleurs
des 5 palettes de quartier étaient bien présentes dans la géométrie
produite. Vérification visuelle ensuite dans le navigateur : éolienne
bien visible dans la campagne, bâtiment à bandeau rouge (Commerce),
volumes à toit plat distincts des maisons/immeubles, dôme bleuté
(Recherche). `tests/unit` existants (86 tests, dont la géométrie
déterministe) toujours verts sans modification — la signature de
`generate()` reste rétrocompatible (nouveaux paramètres optionnels).
`tests/e2e/jalon19-quartiers.spec.ts` (nouveau, 5 tests) : premier bloc
toujours résidentiel ; séquence déterministe des 8 premiers blocs à
élan nul ; une activité dont l'élan domine passe devant l'ordre
alphabétique par défaut ; idempotence (deuxième appel sans effet) ;
une ville qui grandit n'ajoute que des blocs, sans jamais retoucher
ceux déjà ouverts. Migration `0026` appliquée par Adrien, les 5 tests
vérifiés verts contre la vraie base, puis suite complète relancée :
79/80 verts, seul échec `jalon8-se-classer.spec.ts` ("rang national
dynamique", flakiness pré-existante déjà documentée plus haut dans ce
journal, sans lien avec ce jalon — confirmé en reproduisant le même
échec avec les changements de ce jalon mis de côté via `git stash`).

**Retour de test d'Adrien, deux corrections (`docs/A-INTEGRER.md` §20,
27/09/2026)** :

**A. Niveau de détail des quartiers, repris.** Le niveau "2 étapes"
signalé comme portée réduite ci-dessus a été jugé insuffisant par
Adrien après test en ligne, en particulier pour l'Énergie (éolienne
trop minimaliste) et l'Industrie. Repris avec un **niveau numérique
0/1/2** (au lieu du booléen `developpe`) pour Industrie, Commerce,
Services et Recherche — 0 simple, 1 développée, 2 grand complexe —, le
niveau 2 atteint `QUARTIER_NIVEAU2_APRES` (10 000, chiffre à ajuster
comme d'habitude) habitants après le déblocage du niveau 1, même
logique de progression que `APART_FLOOR_EVERY` pour les immeubles :
pas de nouvelle architecture de blocs, juste plus de richesse dans les
deux emplacements de lot déjà existants (maisons/immeubles). Ajouts
par vocation, dans l'esprit "plusieurs éléments optionnels tirés au
sort" déjà utilisé par les maisons (`buildHouse()`) plutôt qu'une
géométrie mise à l'échelle : Industrie (lanterneaux de toit, cheminée
fumante, réservoirs, palettes, clôture, camion garé) ; Commerce
(second bandeau, parvis + voitures + climatiseurs en toiture) ;
Services (aile secondaire + repère héliporté sur le toit, ambulance) ;
Recherche (second dôme, panneaux solaires en toiture, antenne).
Énergie (`energie.ts`) : éolienne agrandie et bien plus détaillée (mât
à bande d'avertissement, nacelle à nez + balise clignotante, pales à
deux segments), panneaux solaires posés en petite ferme de 3 à 5
unités au lieu d'une seule, centrale avec un second réservoir, un
bâtiment technique séparé, une clôture et des pylônes de raccordement
vers la ville.

**B. Choix d'activité verrouillé après un premier choix explicite.**
`choisir_activite_visite()` acceptait d'être rappelée plusieurs fois
dans sa fenêtre de grâce de 5 minutes, en écrasant à chaque fois le
choix précédent — Adrien veut qu'un choix explicite soit définitif.
Nouvelle colonne `visites.activite_verrouillee` (faux par défaut, donc
le tirage au sort automatique de `visiter_ville()` n'est pas
concerné : il reste remplaçable une fois) ; `choisir_activite_visite()`
refuse désormais un second appel sur la même visite (nouveau code
`P0023`, suite de P0021/P0022) — migration corrective `0027`. Côté
client, `ChoisirActivite.tsx` reçoit une nouvelle prop `verrouillee` et
masque le bouton "Changer" dès que le choix est verrouillé, sur
`/ville` et `/villes`.

**Testé (correctifs).** Deux nouveaux tests dans
`tests/e2e/jalon17-choisir-activite.spec.ts` (fichier qui teste déjà
cette fonction) : un choix explicite verrouille la visite et un second
choix — pourtant valide — est refusé (`P0023`) sans écraser le
premier ; le test UI existant du même fichier étendu pour vérifier que
le bouton "Changer" disparaît après un choix. Le niveau de détail des
quartiers (A) n'est pas testé automatiquement au-delà de la géométrie
déterministe déjà couverte (`ville3dGenerer.test.ts`) : vérifié comme
au premier passage, par script jetable (présence des nouvelles
couleurs/matériaux dans la géométrie produite pour la configuration
réelle de Belval-sur-Loire) puis contrôle visuel dans le navigateur
(repères héliportés visibles sur plusieurs bâtiments Services, silos
et accent Industrie visibles, dôme Recherche visible) — les
installations Énergie n'ont pas pu être repérées visuellement dans le
temps disponible (positionnées loin dans la campagne, hors du champ de
caméra exploré), confirmées uniquement par la vérification
programmatique.

### Jalon 20 (1/3) — Système de développement des villes (4/4) : les mégaprojets du maire — 27/09/2026

**Contenu.** Premier des trois sous-jalons du dernier chantier du
système de développement (mégaprojets, puis technologies de Recherche,
puis monuments d'influence — Adrien, 27/09/2026 : « un sous-jalon à la
fois »). Le maire choisit un mégaprojet parmi 3-4 à chaque palier de
population (Bourg 5 000, Ville 15 000, Grande ville 40 000, Métropole
100 000, Mégapole 250 000, puis un palier de plus tous les 50 000) ;
les visiteurs le financent (matériaux/revenus accumulés + points de
l'activité du thème) ; une fois financé, un bâtiment apparaît et — pour
4 des ~18 projets — un bonus permanent s'applique.

**Portée assumée, signalée avant de commencer** (Adrien a confirmé
cette approche via `AskUserQuestion`) : le mécanisme complet pour tous
les paliers dès cette passe, mais des bâtiments 3D volontairement
simples (un socle + une silhouette parmi trois archétypes + une
couleur d'accent selon l'activité du thème — pas encore le niveau de
détail des maisons/quartiers), et seuls les 4 mégaprojets où le
document donne un chiffre exact ont un effet numérique câblé : Stade
(pertes de manifestation ×0,75), Centrale solaire/Parc éolien/Centrale
(élan Énergie ×1,2, cumulatif), Hôpital (contamination ÷2 en plus de la
défense existante), Opéra (propagande ÷2 en plus de la défense
existante). Les autres (dont Zone logistique, dont le bonus documenté
dépend d'une "pause pendant la grève" qui n'existe pas pour les
stocks — pas construite dans cette passe, point ouvert) restent
purement cosmétiques pour l'instant, comme les monuments d'influence.

**Stocks calculés à la volée, pas de compteur à part** (même logique
que `jauges_ville()`/`activite_ville()`) : les matériaux et les revenus
sont un simple `count(*)` sur `visites.activite` ('industrie'/'commerce'),
**sans la fenêtre de 180 jours des jauges** — contrairement à l'élan,
un stock "s'accumule et ne redescend jamais" (§6), seule la dépense (à
la construction d'un mégaprojet) est retenue, sur deux nouvelles
colonnes `cities.materiaux_depenses`/`revenus_depenses`. Les points de
l'activité du thème d'un mégaprojet comptent "à partir du choix" (§6) :
comptés depuis `megaprojets.choisi_le`, jamais avant.

**Catalogue de la Mégapole (palier 4) et au-delà inventé par Claude
Code**, comme autorisé par la réponse d'Adrien du 26/09/2026
("peuvent reprendre des variantes des paliers précédents en
attendant") : Grand stade (loisirs), Centrale nouvelle génération
(énergie), Siège international (commerce) — mêmes 3 options réutilisées
à chaque palier au-delà de la Mégapole, coûts ×1,5 par palier
supplémentaire comme demandé. Tour emblématique (Métropole, sans
activité de thème dans le tableau du document) : activité de thème
fixée à Résidentiel par Claude Code, faute de mieux précisé.

**Emplacement des bâtiments en 3D** : juste à l'extérieur de la ville
(le document ne précise pas où), à une distance qui dépend du **palier**
et non du rayon courant de la ville — sinon un mégaprojet déjà construit
se serait éloigné du centre à chaque fois que la ville grandit ensuite.
Positions fixes par ville et par palier (un générateur par palier,
même logique que les installations d'Énergie), sans vérification de
collision avec les blocs résidentiels/quartiers (simplification
assumée, risque réel mais faible vu le petit nombre de mégaprojets par
ville).

**Base de données** (migration `0028`) :
- `cities.materiaux_depenses`, `cities.revenus_depenses` (nouvelles
  colonnes).
- `city_events.type` : nouvelle valeur `megaprojet_construit` (contrainte
  CHECK réécrite).
- `megaprojets(id, ville_id, palier, type, statut, choisi_le, construit_le)`,
  lecture publique, `unique (ville_id, palier)` — un palier, un projet,
  jamais retouché (même philosophie que `city_blocks`, Jalon 19).
- Nouvelles fonctions utilitaires pures : `stock_ville()`,
  `megaprojet_options()`, `seuil_megaprojet()`, `nb_megaprojets_ouverts()`,
  `cout_megaprojet()`, `nb_megaprojets_construits()`.
- `choisir_megaprojet()` : réservé au maire, nouveaux codes d'erreur
  **P0024** (palier pas encore débloqué), **P0025** (palier déjà
  choisi), **P0026** (type invalide pour ce palier).
- `avancer_megaprojets()` : construit les chantiers financés, appelée
  de façon opportuniste à chaque affichage d'une ville (même logique
  que `assigner_vocations_blocs()`/`verifier_manifestation()`).
- `etat_megaprojets()` : lecture pour l'affichage (progression).
- `jauges_ville()`, `verifier_manifestation()`, `lancer_action_antiville()` :
  signatures inchangées, `create or replace` direct, modifiées pour les
  4 bonus ci-dessus.

**Interface** : nouveau composant `Megaprojets.tsx` (liste des
chantiers en cours/construits avec barres de progression matériaux/
revenus/points, et pour le maire un choix parmi 3-4 boutons dès qu'un
palier se débloque), affiché sur `/ville` (maire) et `/villes` (panneau
détail, lecture seule pour un visiteur). Bulletin municipal
(`BulletinMunicipal.tsx`) étendu pour le nouvel événement
`megaprojet_construit`.

**Testé.** `tests/unit/megaprojets.test.ts` (nouveau, 8 tests) : parité
du mirroir TypeScript (`src/lib/game/megaprojets.ts`) avec les formules
SQL (seuils, catalogue, coûts). `tests/e2e/jalon20-megaprojets.spec.ts`
(nouveau, 5 tests) : refus palier non débloqué/type invalide/non-maire ;
financement complet (stocks + points du thème depuis `choisi_le`,
dépense exacte, idempotence, événement de bulletin) ; bonus Hôpital et
Opéra (comparés sur deux villes jumelles, l'une avec le mégaprojet
construit directement inséré, l'autre non — anti-rafale de 2 s du
Jalon 14 contournée avec deux attaquants distincts plutôt qu'un seul) ;
bonus Centrale solaire sur l'élan Énergie. Migration `0028` appliquée
par Adrien, les 5 tests vérifiés verts contre la vraie base, puis suite
complète relancée : 83/86 verts, les 3 échecs tous la flakiness
pré-existante déjà documentée plus haut dans ce journal, sans rapport
avec ce jalon. Typecheck, lint et suite unitaire (94 tests) vérifiés
verts après chaque étape.

### Jalon 20 (2/3) — Système de développement des villes (4/4) : les technologies de Recherche — 27/09/2026

**Contenu.** Deuxième des trois sous-jalons du dernier chantier. "Tous
les paliers de points de Recherche cumulés (100, 300, 800, 2 000,
5 000, puis ×2), une technologie se débloque. Elle est surtout
visuelle" (§6). Contrairement aux mégaprojets (1/3), **aucun choix du
maire** : un seul stock (les points de Recherche déjà accumulés, même
fonction `stock_ville()` que les mégaprojets) qui débloque
automatiquement chaque palier — mécanique nettement plus simple, pas
de dimension "matériaux/revenus" à financer en parallèle.

**Catalogue des 5 premiers paliers choisi par Claude Code**, dans
l'ordre où le document les cite : éclairage public LED, panneaux
solaires sur les toits, tramway, toits végétalisés, drones. Les
paliers suivants (×2 à chaque fois au-delà de 5 000) n'ont pas encore
d'effet visuel défini — point ouvert, même logique que les mégaprojets
sans bonus câblé. Le nom de chaque technologie ne vit que côté
TypeScript (`src/lib/game/technologies.ts`) : la table ne retient que
le palier (0 = LED, 1 = panneaux, etc.), à tenir synchronisé.

**Effets 3D, volontairement simples** (même philosophie que les
mégaprojets 1/3) : lampadaires en teinte froide (LED) ; petits panneaux
et patch végétalisé approximatifs sur le toit des immeubles
(volontairement **pas** sur les tours, dont le toit a déjà son propre
traitement héliport/antenne — superposer aurait été confus) ; rails et
quelques rames sur les deux grands axes centraux (tramway) ; quelques
drones de livraison en vol à position fixe par ville (générateur par
indice, même logique que les installations d'Énergie). Aucun bonus
numérique câblé pour cette première passe ("avec parfois un petit
bonus" du document reste vague) — purement visuel, comme la plupart des
mégaprojets.

**Bug trouvé et corrigé avant l'envoi, pas après cette fois** (en
préparant ce sous-jalon, avant même d'écrire la migration
correspondante) : `stock_ville()` et `etat_megaprojets()` (Jalon 20
1/3, migration `0028`) n'étaient pas `security definer`. Un visiteur
authentifié appelant `etat_megaprojets()` directement pour afficher la
progression d'un chantier ne voyait, à travers la policy RLS
`visites_lecture_propre` (`auth.uid() = visiteur_id`), que **ses
propres visites** — les barres de matériaux/revenus/points auraient
été très sous-comptées pour toute ville avec plusieurs visiteurs.
`jauges_ville()` avait déjà `security definer` pour la même raison
depuis le Jalon 17 ; `avancer_megaprojets()` n'était pas concerné (déjà
`security definer`, donc déjà correcte pour la vraie construction) —
seul l'AFFICHAGE de la progression était faux. Corrigé en tête de la
migration `0029` (avant qu'elle ne soit envoyée à Adrien, donc jamais
appliquée en l'état buggé).

**Base de données** (migration `0029`) :
- Correctif ci-dessus sur `stock_ville()`/`etat_megaprojets()`.
- `city_events.type` : nouvelle valeur `technologie_debloquee`
  (contrainte CHECK réécrite) — sans bulletin, un joueur ne saurait pas
  qu'une technologie vient de se débloquer (cahier des charges §31,
  "on comprend l'action en moins d'une minute").
- `technologies(id, ville_id, palier, debloquee_le)`, lecture publique,
  `unique (ville_id, palier)`.
- `seuil_technologie()`, `avancer_technologies()` (opportuniste, même
  logique que `assigner_vocations_blocs()`/`avancer_megaprojets()`,
  boucle qui termine toujours car `seuil_technologie()` est strictement
  croissant).

**Interface** : nouveau composant `Technologies.tsx` (lecture seule —
liste des technologies débloquées + progression vers la prochaine),
affiché sur `/ville` et `/villes`. Bulletin municipal étendu pour
`technologie_debloquee`.

**Testé.** `tests/unit/technologies.test.ts` (nouveau, 6 tests) :
parité du mirroir TypeScript avec les formules SQL, plus
`technologiesDepuisPalier()` (dérive les 5 booléens depuis le nombre de
paliers débloqués). `tests/e2e/jalon20-technologies.spec.ts` (nouveau,
2 tests, écrits mais **pas encore exécutés** — migration `0029` pas
encore appliquée par Adrien au moment de l'écriture) : déblocage
progressif (plusieurs paliers d'un coup si les points le permettent),
bulletin par palier, idempotence ; **régression ciblée sur le bug
ci-dessus** — `stock_ville()`/`etat_megaprojets()` appelées par un
client authentifié (pas service_role) voient bien les visites de
tous les visiteurs, pas seulement les siennes. Vérification
programmatique du rendu 3D (script jetable, comme aux Jalons 19/20 1/3) :
présence de la couleur LED et augmentation du nombre de sommets avec
les 5 technologies actives, aucun NaN. Contrôle visuel dans le
navigateur : lampadaires en teinte froide bien visibles ; rails,
panneaux de toit et drones **pas repérés à l'œil** dans le temps
disponible (rendu nocturne, géométries fines sur fond sombre) —
confirmés uniquement par la vérification programmatique, comme
certains éléments du Jalon 19. Migration `0029` appliquée par Adrien ;
premier essai des 2 tests en échec (bug de timing dans le test
lui-même — les visites de la vérification RLS étaient insérées avant
`choisi_le` du mégaprojet, donc hors de la fenêtre de comptage des
points), corrigé, les 2 tests vérifiés verts contre la vraie base
ensuite, puis suite complète : 84/88 verts (échecs = flakiness de
connexion déjà documentée, sans rapport). Typecheck, lint et suite
unitaire (100 tests) vérifiés verts.

**Hors-jalon, traité le même jour** : `docs/A-INTEGRER.md` §21 (Adrien,
précision sur l'affichage des jauges d'activité) — après clarification,
Adrien confirme ne changer que l'affichage, pas le calcul ni les
seuils du Jalon 18 ("c'est très bien comme ça, ça ne change rien").
`JaugesActivites.tsx` : l'état (Crise/Fragile/Équilibré/Point fort)
devient le texte principal, le pourcentage exact passe en infobulle
(`title`). Pur front-end, aucune migration, aucun test cassé.

### Jalon 20 (3/3) — Système de développement des villes (4/4) : les monuments d'influence — 27/09/2026

**Contenu.** Dernier des trois sous-jalons — et donc dernier jalon du
chantier "système de développement des villes" ouvert au Jalon 17.
`docs/A-INTEGRER.md` §19 : des monuments (bornes, statues, arches...)
débloqués automatiquement par paliers d'**influence record**, jamais
retirés même si l'influence courante rebaisse ensuite. Mécaniquement
très proche des technologies (2/3) — aucun choix du maire, aucun
financement, déblocage automatique — mais un **catalogue fini de 16
paliers** (10 à 1 000 000, cf. §19), pas de "puis ×2" à l'infini
au-delà comme les mégaprojets/technologies.

**`cities.influence_max`, nouveau record jamais décroissant** — même
principe que `population_max`. Comme ce projet maintient ces records
**en ligne, explicitement, dans chaque fonction anti-triche** plutôt
que via un trigger caché (cohérent avec le reste du code), les deux
seules fonctions qui touchent `cities.influence` aujourd'hui —
`influencer_ville()` et `lancer_action_antiville()` (branche
propagande) — sont recréées pour maintenir `influence_max` en même
temps. Une perte de propagande ne peut jamais faire reculer le record
(pas besoin d'écrire `greatest(influence_max, ...)` dans cette
branche : ce serait un no-op).

**Catalogue des 16 paliers repris tel quel du document** (§19) :
borne commémorative, banc public, fontaine simple, buste, obélisque,
arc de triomphe miniature, horloge municipale, fontaine monumentale,
statue équestre, mur des remerciements, arche monumentale,
tour-observatoire, statue emblématique, temple national, statue
géante, monument ultime.

**Bâtiments 3D, plus modestes que les mégaprojets** — même philosophie
"simple d'abord", mais volontairement plus petits et plus sobres (une
borne ou un buste n'est pas un bâtiment civique) : un socle, une
silhouette parmi trois archétypes (colonne/obélisque, statue/buste,
arche/fontaine) selon le type, une teinte dorée/bronze commune plutôt
que liée à une activité (les monuments ne sont rattachés à aucune
activité). Placés plus près du centre-ville que les mégaprojets (§19 :
"près du croisement central... zone symbolique"), mais toujours à une
distance fixe par palier (jamais relative au rayon courant de la
ville, même raison que pour les mégaprojets) — **risque de
chevauchement avec un bloc réel un peu plus élevé que pour les
mégaprojets**, puisque les premiers paliers (10-50 d'influence, faciles
à atteindre même très tôt) sont placés proches du rayon minimal d'une
ville (`CITY_R_MIN`) : simplification assumée, à surveiller.

**Base de données** (migration `0030`) :
- `cities.influence_max` (nouvelle colonne, rétro-remplie à `influence`
  pour les villes déjà existantes).
- `influencer_ville()`, `lancer_action_antiville()` : signatures
  inchangées, `create or replace` direct, modifiées pour maintenir
  `influence_max`.
- `monument_catalogue()` : catalogue fixe (palier, seuil, type).
- `monuments(id, ville_id, palier, debloque_le)`, lecture publique,
  `unique (ville_id, palier)`.
- `city_events.type` : nouvelle valeur `monument_debloque` (contrainte
  CHECK réécrite).
- `avancer_monuments()` : opportuniste, s'arrête dès le premier palier
  pas encore atteint (paliers croissants, pas besoin de tout parcourir).

**Interface** : nouveau composant `Monuments.tsx` (lecture seule, même
forme que `Technologies.tsx`), affiché sur `/ville` et `/villes`.
Bulletin municipal étendu pour `monument_debloque`.

**Testé.** `tests/unit/monuments.test.ts` (nouveau, 5 tests) : parité
du catalogue TypeScript avec le catalogue SQL, `nbMonumentsDebloques()`
plafonne bien à 16 très au-delà du dernier seuil.
`tests/e2e/jalon20-monuments.spec.ts` (nouveau, 3 tests, écrits mais
**pas encore exécutés** — migration `0030` pas encore appliquée par
Adrien au moment de l'écriture) : déblocage progressif jusqu'à 16
paliers max (testé avec une influence très au-delà du dernier seuil) ;
`influencer_ville()` fait bien avancer `influence_max` en même temps
qu'`influence` ; une perte de propagande réduit `influence` mais jamais
`influence_max`, et aucun monument déjà débloqué ne disparaît ensuite.
Vérification programmatique du rendu 3D (script jetable) : présence de
la couleur dorée/bronze, augmentation du nombre de sommets, aucun NaN
— pas de contrôle visuel dans le navigateur cette fois (diminishing
returns après les contrôles similaires des Jalons 19/20 1-2, la
géométrie est du même type que celle déjà vérifiée à l'œil pour les
mégaprojets). Typecheck, lint et suite unitaire (105 tests) vérifiés
verts.

**Chantier "système de développement des villes" (Jalons 17 à 20)
terminé côté code** — reste la vérification manuelle d'Adrien sur
l'ensemble, et les points ouverts déjà notés en cours de route (portée
réduite du détail visuel des quartiers, validée puis reprise ; bonus
non câblés pour la plupart des mégaprojets/technologies ; risque de
chevauchement des monuments proches du centre, ci-dessus).

### Niveau "Mégapole" (250 000 habitants) — rattrapage d'un point déjà validé — 28/09/2026

**Retrouvé en faisant le point une fois le chantier ci-dessus
terminé** : Adrien avait validé un niveau au-delà de Métropole dès le
26/09/2026 (`docs/SYSTEME-DEVELOPPEMENT.md` §10 point 4, "oui, ajouté
— Mégapole à 250 000 habitants"), consigné comme point ouvert §10
point 20 ("à trancher par Adrien" — en réalité déjà tranché, la note
n'avait juste jamais été mise à jour) — mais **jamais réellement
câblé** : `NIVEAU_MAX` valait toujours 5 et `population_vers_niveau()`
plafonnait toujours à Métropole. Une ville franchissant 250 000
habitants restait donc affichée "Métropole" indéfiniment. Pas une
nouvelle décision, juste un oubli pendant le sprint des Jalons 17-20 —
corrigé directement, sans repasser par Adrien.

**Changé** : `NIVEAU_MAX` (6), `SEUILS_NIVEAU` (`src/lib/game/niveauVille.ts`),
`population_vers_niveau()` (migration `0031`, `create or replace`
direct), clé i18n `niveau.6` ("Mégapole"/"Megapolis"), et la copie
locale de seuils dans `scripts/charger-villes-test.mjs`. Rattrapage
`cities.niveau` pour une ville déjà existante qui dépasserait déjà
250 000 (aucune parmi les villes de test actuelles, la plus grande
fait 114 000, mais la migration le fait au cas où). Aucun autre
endroit du code ne supposait Métropole comme niveau maximal (recherché
explicitement) — `progressionNiveau()`/`libelleNiveau()` et leur
affichage (`ville/page.tsx`, `villes/page.tsx`) itèrent déjà
génériquement sur `SEUILS_NIVEAU`, pas de segment figé à corriger.

**Testé.** `tests/unit/niveauVille.test.ts` : les deux tests qui
plafonnaient à Métropole/5 (bornes du niveau maximal) mis à jour pour
Mégapole/6, le test de refus d'un niveau hors plage déplacé de 6 à 7.
`tests/e2e/jalon6-donnees-rendu-3d.spec.ts` : seuils étendus jusqu'à
250 000/6, la valeur à 1 000 000 (qui attendait encore 5) corrigée.
Typecheck, lint et suite unitaire (105 tests) vérifiés verts. Suite
e2e complète pas encore relancée — migration `0031` pas encore
envoyée/appliquée au moment de l'écriture.

---

### Jalon 21 — « Revoir les règles du jeu » appliqué à la guerre entre pays — 28/09/2026

**Origine** : §10 point 22, retour d'Adrien après le Jalon 4 ("−10 % de
population, c'est exagéré") — grille à appliquer à tous les mécanismes
(effet unitaire faible, cumul du jour, plafond, paliers visibles), déjà
faite pour AntiVille au Jalon 18. Choix d'Adrien (multiSelect,
28/09/2026) : reprendre uniquement **Pays (guerre/mobilisation)** dans
cette passe — visites, influence et jumelages restent non touchés.

**Constat avant de coder** (relecture des migrations 0016/0017) :
contrairement à AntiVille, un conflit pays n'avait **encore aucun effet
concret** — `resoudre_conflits_en_cours()` posait juste un badge
attaquant/défenseur/égalité à J+7, sans jamais toucher `population` ni
`influence`. Signalé et tranché avec Adrien via `AskUserQuestion` avant
de coder (le point n'était pas "quel chiffre choisir" mais "est-ce
qu'on crée un effet réel ou juste un affichage narratif ?") : Adrien a
choisi l'effet réel.

**Traduction de la grille sur un mécanisme sans clic individuel**
(l'automatisation `effort_national()` du correctif Jalon 13 reste
inchangée) : l'« unité » devient la JOURNÉE du conflit, pas une
attaque. `resoudre_conflits_en_cours()` (migration `0032`,
`create or replace` direct) avance chaque conflit `en_cours` jour par
jour depuis son `dernier_jour_traite` (nouvelle colonne) :
- **effet unitaire faible** : le camp qui perd la comparaison
  `effort_national()` du jour (bonus défensif ×1,5 inchangé) perd
  0,1 % de population sur chacune de ses villes ce jour-là ;
- **cumul du jour** : compteurs `jours_gagnes_attaquant`/
  `jours_gagnes_defenseur` (nouvelles colonnes `conflits`) ;
- **plafond** : 5 % de perte maximum par ville sur toute la durée du
  conflit, suivi via `city_events` (nouveau type `'guerre'` + nouvelle
  colonne `conflit_id`, pour ne pas confondre deux guerres simultanées
  d'un même pays contre deux adversaires différents) ;
- **paliers visibles** : `palierGuerre()` (`src/lib/game/conflits.ts`,
  copie TS pure comme `palierAttaques()`), 6 paliers de "Calme" à
  "Victoire écrasante" selon le nombre de journées gagnées par le camp
  en tête, affichés sur `/pays`.

Le verdict final à J+7 se base désormais sur la **majorité des
journées gagnées cumulées**, pas sur un seul instantané du dernier
jour — plus fidèle à l'esprit "cumul" de la grille, et plus juste (un
camp qui a dominé 5 jours sur 7 ne peut plus perdre sur un simple sursaut
du 7e jour). Chiffres (0,1 %/jour, plafond 5 %) : décision de Claude
Code, contestable — mêmes ordres de grandeur que le 0,01 %/plafond
10 % d'AntiVille, ajustés pour un rythme "1 unité/jour" plutôt que
"potentiellement des centaines d'unités/jour".

**Rattrapage documenté comme simplification assumée** : la fonction
est opportuniste (pas de cron), appelée à chaque affichage de `/pays`.
Si personne ne consulte la page plusieurs jours de suite, tous les
jours manqués sont rattrapés d'un coup — mais `effort_national()` ne
reflète que l'état ACTUEL des pays (pas d'historique jour par jour),
donc les jours rattrapés réutilisent le même instantané. Même famille
d'approximation que l'activité 7 jours glissants (Jalon 9).

**Testé.** `tests/unit/conflits.test.ts` (4 tests, parité `palierGuerre()`).
`tests/e2e/jalon21-grille-guerre.spec.ts` (4 tests) : cumul sur
plusieurs jours rattrapés en un seul appel (valeurs exactes) ; plafond
qui borne strictement la perte totale même sur ~90 jours rattrapés
d'un coup (preuve : le plafond est toujours calculé sur la population
courante, qui ne fait que décroître, donc toujours ≤ 5 % de la
population de départ) ; verdict basé sur le cumul et non le dernier
jour (scénario où le camp qui gagne "aujourd'hui" perd quand même la
guerre) ; affichage du palier et des compteurs sur `/pays`.
`tests/e2e/jalon13-france-contre-allemagne.spec.ts` mis à jour : le
test qui vérifiait un recalcul "à la volée" par `conflit_pays()` avant
toute résolution a été adapté (ce recalcul n'existe plus, les valeurs
sont désormais toujours figées par `resoudre_conflits_en_cours()`).
Typecheck et suite unitaire complète (109 tests) vérifiés verts. Suite
e2e pas encore relancée — migration `0032` pas encore envoyée/appliquée
au moment de l'écriture.

---

### Jalon 22 — « Revoir les règles du jeu », suite : paliers pour visites, influence, jumelages — 28/09/2026

**Suite du Jalon 21** : Adrien a choisi de continuer sur le reste de la
grille (visites, influence, jumelages — §10 point 22).

**Différence assumée, tranchée avec Adrien avant de coder**
(`AskUserQuestion`) : contrairement à AntiVille et à la guerre entre
pays, ces trois mécaniques sont des effets **positifs** pour la ville
qui les reçoit (population/influence gagnées, bonus de jumelage), déjà
plafonnés **par joueur** (3 visites/jour, 5 actions d'influence/jour,
délais anti-rafale, 3 jumelages actifs max, bonus de jumelage borné à
une fois par jour) — contrairement à AntiVille/guerre qui n'avaient
aucun plafond par cible avant leur passage sur cette grille. Ajouter un
plafond quotidien PAR VILLE CIBLÉE (tous visiteurs confondus)
freinerait la croissance d'une ville populaire, ce qui n'a pas le même
esprit que la demande initiale ("−10 %, c'est exagéré", un effet
négatif à adoucir). Décision d'Adrien : **paliers visibles seulement,
aucun plafond ajouté** sur ces trois mécaniques.

**Fait** (migration `0033`, 3 nouvelles fonctions `security definer` —
même raison que `attaques_recues_aujourdhui()` au Jalon 18 : les
tables sous-jacentes (`visites`, `actions_influence`, `jumelage_bonus`)
ont des policies RLS "lecture propre", un maire ne peut pas lire
directement les lignes des AUTRES joueurs sur sa ville) :
- `visites_recues_aujourdhui()` / `palierVisites()`
  (`src/lib/game/popularite.ts`) : popularité du jour (Calme →
  Fréquentée → Très fréquentée → En vogue → Virale) ;
- `actions_influence_recues_aujourdhui()` / `palierInfluence()`
  (même fichier) : renommée du jour (Calme → Respectée → Renommée →
  Célèbre → Légendaire) ;
- `jours_bonus_jumelages_ville()` / `palierJumelage()`
  (`src/lib/game/jumelages.ts`) : solidité d'un jumelage actif, sur le
  cumul de jours où son bonus a déjà été accordé (Naissant → Solide →
  Indéfectible → Légendaire).

Badges affichés sur `/ville`, `/villes` (panneau détail) et
`/jumelages`. Seuils choisis par Claude Code, contestables — ordre de
grandeur cohérent avec les quotas existants (3-5 actions/jour/joueur).

**Testé.** `tests/unit/popularite.test.ts` (6 tests) et
`tests/unit/jumelages.test.ts` (3 tests), parité des trois fonctions de
palier. `tests/e2e/jalon22-paliers-visites-influence-jumelages.spec.ts`
(3 tests) : régression RLS sur les deux nouvelles fonctions de comptage
(client authentifié réel, pas service_role) ; cumul exact des jours de
bonus pour `jours_bonus_jumelages_ville()` (et absence d'un jumelage
"en_attente" dans le résultat) ; affichage des badges sur `/villes`.
Typecheck, lint et suite unitaire complète (127 tests) vérifiés verts.
Suite e2e pas encore relancée — migration `0033` pas encore
envoyée/appliquée au moment de l'écriture.

---

### Jalon "Bibliothèque de bâtiments" (1/4 : catalogue + premiers modèles) — 30/09/2026

**Suite du Jalon 22** : `docs/BATIMENTS-ET-PACKS.md`, §10 point 21 de
ce document. Trois questions tranchées avec Adrien avant de coder
(`AskUserQuestion`) : (1) packs purement cosmétiques — **oui** ; (2)
variantes gratuites par pays — **non pour l'instant** ; (3) thème
prioritaire pour le premier pack payant — **Haussmannien** (pas encore
codé, seule l'infrastructure de packs existe — voir plus bas) ; (4)
découpage du chantier — Adrien a choisi **"tout en une fois"** plutôt
qu'un lot réduit à valider d'abord.

**Portée réellement livrée dans cette passe, plus modeste que les
"~30-40 modèles" du document** (décision de Claude Code, à signaler
explicitement à Adrien — voir DECISIONS.md, convention habituelle de
transparence sur les réductions de portée) : **6 maisons, 4 immeubles,
2 tours**, plus l'infrastructure complète (catalogue typé, sélection
stable, showroom, tests). Un rythme soutenable pour une seule passe
sans dégrader la qualité/vérification de chaque modèle ; l'ajout d'un
modèle de plus est maintenant juste une entrée de tableau, donc les
prochains lots seront plus rapides. Mobilier urbain non repris en
catalogue cette fois (arbres/voitures restent gérés par mobilier.ts).

**Point technique tranché avec Adrien avant de coder** (`AskUserQuestion`) :
le document demande qu'ajouter un modèle au catalogue ne change jamais
l'apparence d'une ville déjà construite. Garantir ça à 100 % demanderait
de mémoriser en base, une fois pour toutes, le modèle choisi par chaque
parcelle — un coût d'écritures que le jeu n'a pas aujourd'hui. Adrien a
confirmé qu'une ville peut changer d'apparence (cas des packs de
thèmes, activables/désactivables librement) : choix retenu = **tirage
par hachage stable** (fonction pure de la graine de ville + position de
la parcelle + identifiant du modèle, insensible à l'ORDRE des modèles
dans le tableau), sans nouvelle table. Limite assumée et documentée
(`src/lib/ville3d/catalogue.ts`) : ajouter un nouveau modèle peut, de
façon rare, faire basculer une parcelle déjà construite vers ce nouveau
modèle — pas une garantie à 100 %, un compromis délibéré.

**Un second risque de dérive, repéré en implémentant** (pas anticipé
dans la question posée à Adrien, corrigé directement) : le niveau
d'une ville n'est pas figé une fois une parcelle construite — si le
tirage dépendait du niveau courant (`stadeMin`), une maison déjà posée
changerait d'aspect dès que la ville franchit un seuil de niveau, le
même défaut que la grille est censée éviter. Fixé en gardant
`stadeMin` à 0 pour tous les modèles "classique" de cette passe (le
champ reste dans l'infrastructure pour un futur pack premium à
débloquer par niveau, juste inexploité pour l'instant).

**Showroom** (`/dev/showroom`, outil de développement jamais lié
depuis la navigation) : rendu Three.js simplifié (couleurs de sommets,
une lumière), bascule jour/nuit, cadrage automatique sur la vraie boîte
englobante de chaque modèle construit (une tour ne tient pas dans un
cadrage pensé pour une maison). Pas la scène finale du jeu — juste de
quoi valider formes et proportions d'un coup d'œil, comme demandé par
le document (§2).

**Vérifié dans le vrai rendu du jeu** (page d'accueil, population
temporairement montée à 60 000 pour voir tours et immeubles, revenue à
1200 après vérification) : variété visible de maisons, immeubles et
tours, aucune erreur console, géométrie propre.

**Testé.** `tests/unit/catalogue.test.ts` (11 tests) : déterminisme du
tirage, insensibilité à l'ordre du tableau, répartition statistique
proche des poids déclarés, filtre par niveau, repli du pack vers le
classique, erreur explicite si aucun modèle disponible, limite de
triangles par modèle (docs/BATIMENTS-ET-PACKS.md §2). Suite unitaire
complète (129 tests), typecheck et lint vérifiés verts. Aucune
migration pour ce jalon (purement front-end/génération 3D) — pas de
recette à faire valider par Adrien côté base de données, juste le rendu
visuel.

---

### Jalon "Bibliothèque de bâtiments" (2/4 : deuxième lot de modèles) — 30/09/2026

**Suite immédiate du 1/4**, choix confirmé par Adrien (`AskUserQuestion` :
continuer sur plus de modèles "classique" plutôt que démarrer le pack
Haussmannien). Catalogue étendu de 12 à **20 modèles** : +3 maisons
(mitoyenne, méditerranéenne, fermette → 9 au total), +3 immeubles
(art déco, barre, loggias → 7 au total), +2 tours (béton brutaliste,
flèche → 4 au total). Mobilier urbain toujours pas repris en catalogue
(reste pour un prochain lot).

Aucun nouveau choix de conception cette fois — même infrastructure,
mêmes conventions (`stadeMin` à 0, pack "classique", `decorJardin()`
partagé pour les maisons, `edicule()`/`chantierGratteCiel()`/
`grueChantier()` partagés pour immeubles/tours). Les deux nouvelles
tours réutilisent le même squelette chantier/grue que tour-verre —
seul le fût final change (bandeaux de béton alternés pour tour-beton,
fût étroit + flèche toujours présente, jamais d'héliport, pour
tour-fleche).

**Vérifié dans le vrai rendu du jeu** (page d'accueil, population
temporairement montée à 60 000 pour voir les nouvelles tours, revenue
à 1200 après vérification) et dans le showroom (`/dev/showroom`,
20 modèles listés) : aucune erreur console, silhouettes distinctes.

**Testé.** `tests/unit/catalogue.test.ts` couvre déjà tous les modèles
du catalogue génériquement (boucle sur `MODELES_MAISONS`/
`MODELES_IMMEUBLES`/`MODELES_TOURS`) — aucun nouveau test nécessaire,
les 8 nouveaux modèles sont automatiquement couverts par la limite de
triangles et les tests de détermisme/pondération. Suite unitaire
complète (129 tests), typecheck et lint vérifiés verts. Suite e2e
complète relancée pour confirmer l'absence de régression sur le rendu
3D : 81 passés, 6 échecs — tous la même flakiness de connexion
pré-existante déjà documentée plusieurs fois ce jour (redirection vers
`/connexion` au lieu de `/ville`, répartie sur des jalons sans aucun
rapport avec le rendu 3D comme les Jalons 1/3/4/5/8/9), pas une
régression liée à ce jalon.

---

### Jalon "Bibliothèque de bâtiments" (3/4 : mobilier urbain) — 30/09/2026

**Suite immédiate du 2/4**, dernière catégorie du document encore
absente (`docs/BATIMENTS-ET-PACKS.md` §3 : "arbres, lampadaires,
abribus, fontaines, kiosques, bancs, voitures variées"). Contrairement
aux bâtiments (maisons/immeubles/tours), le mobilier urbain n'est **pas**
assigné une fois pour toutes à une parcelle précise — ce sont des
éléments dispersés dans le décor (trottoirs, parcs, cours), donc pas
besoin du catalogue à sélection stable : ajoutés comme fonctions
réutilisables dans `mobilier.ts` et placés via des tirages `r() < p`
classiques (même convention que les arbres d'alignement déjà en place).

**Ajouté** (`src/lib/ville3d/mobilier.ts`) : `banc()`, `fontaine()`
(la fontaine de cour existait déjà en dur dans `buildCourtyard()`,
extraite en fonction réutilisable et enrichie d'un jet d'eau),
`abribus()`, `kiosque()`. Arbres (feuillu + conifère) et voitures (8
couleurs) existaient déjà. Lampadaires restent une fonction locale à
`buildBlock()` (pas de variante de forme pour l'instant — seulement la
couleur selon la technologie LED, Jalon 20 2/3).

**Câblé** : `buildPark()` place un banc (ou deux) systématiquement, un
kiosque de temps en temps (30 %) à la place ; `buildCourtyard()`
utilise `fontaine()` (même rendu qu'avant, code partagé) ;
`buildBlock()` place un abribus sur un des 4 trottoirs, 40 % du temps.

**Vérifié** : suite unitaire dédiée (`tests/unit/mobilierUrbain.test.ts`,
5 tests — géométrie non vide, sans `NaN`, déterminisme) plutôt qu'une
vérification visuelle seule (petits éléments, difficiles à distinguer
à l'œil sur une capture de ville entière) ; suite `ville3dGenerer`/
`ville3dCroissance` toujours vertes (déterminisme global de
`generate()` préservé) ; vérifié aussi dans le vrai rendu du jeu, sans
erreur console.

---

### Jalon "Bibliothèque de bâtiments" (4/4 pour les modèles de base : troisième lot) — 30/09/2026

**Suite immédiate du 3/4**, décision de Claude Code de continuer sur le
même chantier plutôt que de redemander à Adrien à chaque petit pas
(le sens de "passe à la suite" répété plusieurs fois de suite sur ce
chantier précis) — si ce n'est pas ce qu'il voulait, à corriger.
Catalogue étendu de 20 à **26 modèles** : +3 maisons (duplex,
split-level, cottage → 12 au total), +2 immeubles (gradins multiples,
vitrée → 9 au total), +1 tour (obélisque, fût mince et uniforme sans
palier → 5 au total). Se rapproche des ~30 modèles visés par
`docs/BATIMENTS-ET-PACKS.md` §3 (bâtiments seuls, hors mobilier urbain
déjà fait au 3/4).

**Vérifié** : suite unitaire complète (134 tests, `catalogue.test.ts`
couvre génériquement tous les modèles) ; typecheck et lint verts ;
vérifié dans le vrai rendu du jeu (population 60 000, silhouettes
distinctes visibles pour toutes les nouvelles tours, notamment
tour-obélisque très reconnaissable — fût mince et uniforme au milieu
des autres tours), aucune erreur console. Suite e2e complète relancée :
75 passés, 10 échecs + 12 non exécutés — tous la même flakiness de
connexion pré-existante (`toHaveURL(/\/ville$/)`, vérifié ligne par
ligne dans les logs), y compris le test `jalon6bis-rendu-3d.spec.ts`
qui teste le canvas WebGL : son échec est dû au même blocage de
connexion AVANT même d'atteindre la vérification du canvas, pas à un
problème de rendu 3D. Nombre d'échecs plus élevé que d'habitude ce
jour-là, probablement lié à la charge de la machine (serveurs de
développement et suites e2e enchaînés sans pause) plutôt qu'à une
nouvelle cause — à surveiller si ça persiste.

---

### Jalon "Bibliothèque de bâtiments" (4/4 : premier pack de thème, Haussmannien) — 30/09/2026

**Dernier morceau de ce chantier**, décision de Claude Code de
poursuivre dans la même direction plutôt que de redemander à Adrien à
chaque étape (voir aussi la note du 3/4 sur "passe à la suite" répété).
Premier pack de thème payant du document (§4), choisi en priorité par
Adrien le 30/09/2026 (AskUserQuestion). **Première migration de tout ce
chantier** — tout le reste (catalogue, 3 lots de modèles, mobilier
urbain) était purement front-end.

**Portée assumée** (décision de Claude Code, à contester si besoin) :
le document prévoit des packs PAYANTS (§5), mais la boutique elle-même
est explicitement une étape ultérieure ("après le MVP, une fois le
statut légal réglé" — §6 point 4). Comme aucun système de paiement
n'existe encore, le thème Haussmannien est sélectionnable librement par
n'importe quel joueur pour l'instant, sans colonne `joueur_packs` ni
réservation aux comptes de test (le document proposait pourtant cette
option à moindre coût — §5). La restriction viendra avec la boutique,
pas avant : plus simple pour tester/juger le rendu maintenant, cohérent
avec "pas de fausse promesse de paiement avant d'avoir vraiment un
moyen de payer".

**Pack partiel** (§2, "si un thème n'a pas de modèle pour une famille,
le catalogue prend celui du pack Classique") : seuls les IMMEUBLES ont
des modèles Haussmannien dédiés (`immeuble-haussmannien` — façade
pierre claire, garde-corps en fer forgé filants, étage mansardé en zinc
avec lucarne ; `immeuble-haussmannien-angle` — même archétype avec une
tourelle d'angle arrondie). Maisons et tours retombent sur "classique"
pour ce thème — choix délibéré : Haussmann est avant tout une
architecture d'immeubles parisiens, pas de pavillons ni de
gratte-ciel.

**Fait** :
- Migration `0034` : `cities.theme` (défaut `'classique'`, contrainte
  `check`), `definir_theme_ville()` (security definer, maire
  uniquement, même anti-triche que `definir_recommandation()`).
- `theme` propagé sur toute la chaîne de rendu (déjà prévu dans
  l'infrastructure du catalogue, `choisirModele(cle, modeles, niveau,
  packActif)`) : `generate()` → `buildBlock()` → `buildHouse`/
  `buildApart`/`buildTower` → `choisirModele()`. `ParametresVille.theme`
  (scene.ts), `SincroniserScene`, `/ville` et `/villes` (le visiteur
  voit le thème choisi par LE MAIRE de la ville regardée, pas le sien).
- Sélecteur sur `/ville` (le maire uniquement) : un `<select>` +
  bouton "Appliquer", même style que le sélecteur de recommandation
  d'activité (Jalon 17).

**Testé.** `tests/unit/catalogue.test.ts` étendu (4 nouveaux tests,
15 au total) : le pack haussmannien fournit bien des modèles
d'immeuble, un immeuble avec ce thème actif utilise toujours un modèle
haussmannien, une maison/tour avec ce thème actif retombe toujours sur
classique (aucun modèle disponible pour ces familles). Nouveau fichier
e2e (`tests/e2e/jalon-bibliotheque-theme-haussmannien.spec.ts`, 2
tests) : anti-triche de `definir_theme_ville()` (réservé au maire,
thème invalide refusé, valeur par défaut `'classique'` vérifiée) ; page
`/ville` permet de choisir le thème et la valeur est bien persistée en
base. Suite unitaire complète (134 tests), typecheck et lint vérifiés
verts. Suite e2e complète pas encore relancée — migration `0034` pas
encore envoyée/appliquée au moment de l'écriture.

---

### Noms uniques (pseudos et villes) + fiabilisation de la suite e2e — 02/10/2026

**Noms uniques** (`docs/A-INTEGRER.md` §8, règle ferme d'Adrien du
24/09/2026, oubliée depuis le Jalon 8 — §10 point 26 ; même histoire que
le niveau Mégapole : validée, jamais codée). Migration `0035` :
`nom_normalise()` (minuscules, sans accents, uniquement a-z0-9),
colonnes générées `users.pseudo_normalise` / `cities.nom_normalise`,
index uniques, `nom_disponible()` ("✓ disponible / ✗ déjà pris" à la
saisie), `renommer_pseudo()` / `renommer_ville()`, `creer_ville()`
redéfinie (erreurs dédiées **P0027** pseudo pris, **P0028** nom de ville
pris). Doublons existants : le plus ancien garde le nom, les autres sont
marqués `*_a_changer` (exclus de l'index) et passent par l'écran de
rattrapage `/ville/noms` à leur prochaine page de jeu
(`exigerRegionChoisie()` étendue). Création : indication de disponibilité
sous les champs, pseudo limité à 20 caractères, noms réservés et mots
interdits refusés (`src/lib/game/nomsUniques.ts`).

*Écarts assumés avec la lettre du §8, à contester si besoin* : (1) pas
d'extension `unaccent` (non IMMUABLE donc inutilisable dans une colonne
générée indexée, et son schéma varie selon le projet Supabase) — une
translittération explicite des lettres latines accentuées la remplace,
vérifiée identique en SQL et en TypeScript par un test de parité ; (2)
les règles de FORMAT (3-20 caractères, réservés, interdits) sont
appliquées dans l'application, pas dans `creer_ville()`, que les specs
et scripts appellent directement — seule l'UNICITÉ est garantie par la
base. Pas de test « retirer l'index fait échouer » (pas d'accès psql) :
les assertions de collision échouent d'elles-mêmes sans l'index.

*Correctif découvert en chemin* : la contrainte `cities_niveau_check`
(migration 0001) plafonnait encore `niveau` à 5, la migration `0031`
(Mégapole, niveau 6) ne l'ayant jamais élargie — toute ville à 250 000
habitants ou plus faisait échouer sa mise à jour. Le journal e2e
affichait ce message depuis des jours sans que je le relève. Corrigé
dans `0035`.

**Fiabilisation de la suite e2e** — la « flakiness de connexion »
invoquée à chaque run depuis le Jalon 6bis n'en était pas une, et je
l'avais écartée trop vite (y compris dans les entrées précédentes
d'aujourd'hui). Causes réelles, toutes corrigées : (a) `/ville` enchaîne
**~26 appels Supabase séquentiels** (31 pour `/villes`) à 100-400 ms
chacun — plusieurs secondes de rendu, donc le `toHaveURL` de 5 s tombait
; délai d'assertion porté à 20 s et de test à 60 s (`playwright.config.ts`)
**en attendant de paralléliser ces appels** (tâche proposée à part, vraie
amélioration pour les joueurs) ; (b) serveur de dev lancé à froid :
préchauffage des pages (`tests/e2e/prechauffage.ts`) ; (c) des villes de
test à **9 000 000 d'habitants** (près de 1 800 blocs à générer côté
navigateur — le point ouvert §10 n°19 « plafond de rendu » n'est donc pas
théorique) bloquaient la page ; ramenées à 400 000 ; (d) formulaire de
connexion : clic possible avant l'hydratation de React (bouton désactivé
jusque-là, valeurs lues dans le DOM) ; (e) helper de délai anti-rafale
reculé de 2 s pile (la limite) à 10 s ; (f) `getByText("1")` par
sous-chaîne qui matchait le rang « 31 » ; (g) lecture en base avant la
fin d'une action serveur (attente active). Les specs créent maintenant
leurs comptes avec un suffixe aléatoire (sinon un compte oublié par un
run raté bloquerait le suivant). Résultat : de 12 échecs + 14 non
exécutés à 98 verts sur 99 (le dernier, un test à correspondance par
sous-chaîne, corrigé depuis).

**Testé.** `tests/unit/nomsUniques.test.ts` (9 tests) ;
`tests/e2e/noms-uniques.spec.ts` (7 tests : parité SQL/TypeScript,
collisions casse/accent/tiret/espace, création simultanée, disponibilité,
renommage, seed sans collision). Pas encore lancés : migration `0035`
pas encore appliquée au moment de l'écriture.

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

- **Suivi des dépenses en cours** (§1 point 1, assoupli le 25/09/2026) —
  aucune ligne pour l'instant, à remplir dès qu'une dépense est validée
  par Adrien :

| Dépense | Montant | Fournisseur | Approuvée le | Motif |
|---|---|---|---|---|
| *(aucune pour l'instant)* | — | — | — | — |

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
    confirmer séparément). **[Résolu — validé par Adrien le 26/09/2026
    (`docs/A-INTEGRER.md` §18), codé aux Jalons 17-20, voir §4.]**
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
    **[Résolu — validé par Adrien le 26/09/2026, câblé le 28/09/2026
    (migration `0031`), voir §4 "Niveau Mégapole".]**
21. **Bibliothèque de bâtiments et packs de thèmes**
    (`docs/BATIMENTS-ET-PACKS.md`, proposition du 24/09/2026).
    **Questions du §7 répondues par Adrien le 30/09/2026** : packs
    cosmétiques uniquement (oui), variantes par pays (non pour
    l'instant), thème prioritaire (Haussmannien), ordre (devenu sans
    objet, le Jalon 8 est fait depuis longtemps). **Catalogue + showroom
    + mobilier urbain
    codés le 30/09/2026, trois lots de bâtiments le même jour : 12 maisons,
    9 immeubles, 5 tours (26 au total, proche des ~30 visés), plus
    banc/fontaine/abribus/kiosque**, voir §4. **Point maintenant
    entièrement résolu** : premier pack de thème Haussmannien (partiel,
    immeubles seulement) codé le 30/09/2026, migration `0034`,
    sélectionnable librement par le maire sur `/ville` (pas de
    restriction de paiement, la boutique reste une étape ultérieure —
    §6 point 4 du document). Reste, si Adrien le souhaite un jour : plus
    de modèles pour atteindre exactement les ~30 visés, d'autres packs
    de thèmes (Méditerranée, Nordique, Japon...), la boutique elle-même.
22. **Revoir les règles du jeu** (retour d'Adrien après le Jalon 4 :
    "−10 % de population, c'est exagéré" — `docs/A-INTEGRER.md` §3 et
    `docs/SYSTEME-DEVELOPPEMENT.md` §6 bis). Proposition en réflexion :
    effets unitaires faibles, cumul des attaques de la journée, plafond de
    10 %/jour, paliers visibles. Ajouté à `ROADMAP.md` comme jalon **à
    placer par Adrien**. Pas de code d'ici là. **[Partiellement résolu —
    cette grille (effet unitaire faible, cumul du jour, plafond, paliers
    visibles) est appliquée à AntiVille depuis le Jalon 18 (§4), à la
    guerre entre pays depuis le Jalon 21 (§4, 28/09/2026), et à
    visites/influence/jumelages depuis le Jalon 22 (§4, 28/09/2026 —
    sous forme de paliers visibles seulement, sans nouveau plafond,
    puisque ce sont des effets positifs déjà plafonnés par joueur).
    **Ce point est maintenant entièrement résolu** : AntiVille, guerre,
    visites, influence et jumelages ont tous été revus sur cette
    grille.]**
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
26. **Noms uniques (pseudos et villes)** — **[Codé le 02/10/2026,
    migration `0035`, voir §4 ; en attente d'application par Adrien.]**
    Ancien texte : pas encore faits.
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
27. **Ressources nationales : aucun effet de gameplay pour l'instant.**
    Le Jalon 10 construit le vote hebdomadaire et l'accumulation des
    ressources par catégorie (Industrie/Techno/Culture/Commerce),
    visibles sur `/pays`, mais le cahier des charges ne dit nulle part
    ce que ces ressources *font* une fois accumulées — rien codé, décision
    volontairement pas prise seul (`DECISIONS.md` §4, journal du
    Jalon 10). **Partiellement touché au Jalon 13** : le "coût en
    ressources" d'un conflit est désormais un instantané informatif
    (`conflits.cout_ressources`), affiché mais jamais déduit — voir point
    30 ci-dessous. → **Toujours à trancher par Adrien** : une vraie
    dépense/consommation de ces ressources (par les décisions
    diplomatiques ou ailleurs) reste à faire si souhaitée.
28. **Carte du pays (Jalon 9 ter) : détails laissés de côté faute de
    temps ou de données.** Pas de scintillement nocturne des grandes
    villes, pas de repères de jumelages en bord de carte (les deux
    prévus par `docs/CARTE-DU-PAYS.md` §2), pas d'interaction au clic
    sur une région (résumé population/ville n°1). 5 régions d'outre-mer
    françaises et 2 États américains (Rhode Island, DC) absents de la
    carte elle-même (données sources incomplètes/perdues à la
    simplification — les classements/votes de ces régions restent
    corrects). Le canvas 3D partagé continue de tourner, invisible,
    derrière la carte plutôt que d'être mis en pause (petit gaspillage
    CPU/GPU assumé). → **À trancher par Adrien** : lesquels de ces
    points valent une seconde passe, et avec quelle priorité par
    rapport aux autres jalons ?
29. ~~Décisions diplomatiques (Jalon 12) : aucun effet de gameplay pour
    l'instant.~~ **Tranché au Jalon 13** : un vote pour/contre majoritaire
    en fin de semaine adopte ou non la décision ; une "rivalité" adoptée
    déclenche un conflit d'une semaine entre les deux pays. Alliance/
    Paix/Embargo restent sans effet de gameplay au-delà du vote
    lui-même — non demandés par le cahier des charges, qui ne cite que
    la rivalité comme scénario de test. Détail dans `DECISIONS.md` §4,
    journal du Jalon 13.
30. **Coût en ressources d'un conflit (Jalon 13) : informatif seulement,
    jamais déduit.** `conflits.cout_ressources` capture un instantané des
    ressources nationales de l'attaquant (Jalon 10) au moment du
    déclenchement, affiché sur `/pays`, mais rien n'est retiré nulle
    part — les ressources du Jalon 10 sont un compteur cumulatif en
    lecture seule, sans mécanisme de dépense (voir point 27). En faire
    une vraie monnaie dépensable aurait été un jalon à part entière ;
    décision prise sans attendre Adrien pour ne pas bloquer ce jalon.
    → **À confirmer par Adrien** : simplification acceptée telle quelle,
    ou faut-il un vrai coût déduit ?
31. **"Avantages nationaux" (dont Défense, cahier des charges §13) :
    système pas encore construit.** Signalé par Adrien lui-même comme un
    ingrédient attendu de l'effort national en temps de guerre
    (`docs/A-INTEGRER.md` §12, 25/09/2026) — `effort_national()` du
    Jalon 13 s'appuie pour l'instant seulement sur l'activité (Jalon 9)
    et les ressources nationales (Jalon 10), les deux seuls ingrédients
    qui existent déjà, plutôt que d'inventer un substitut. → **À
    trancher par Adrien** : vaut-il un jalon dédié (quels avantages,
    quelles conditions pour les débloquer, quel effet chiffré), et à
    quel moment par rapport aux autres priorités ?
32. **Visites multiples par jour (Jalon 13 bis) : Influence et AntiVille
    pas étendus au même système.** Seule l'action Visiter permet
    désormais plusieurs fois par jour (délai d'une heure, plafond de 3) ;
    Influence (5/jour) et AntiVille (3/jour) gardent leur ancienne limite
    d'une fois par (joueur, ville, jour). Adrien n'a demandé l'extension
    que pour Visiter. → **À trancher par Adrien** : l'objectif de
    rétention justifie-t-il d'étendre le même principe à Influence et/ou
    AntiVille, ou ces deux actions restent-elles volontairement à une
    fois par jour ?
33. ~~"Combien d'habitants par habitation" — maisons.~~ **Fait le
    27/09/2026** : Adrien choisit la refonte complète par type de
    bâtiment (plutôt que juste retoucher les seuils existants) ;
    implémenté pour les **maisons** (`HABITANTS_PAR_LOGEMENT_MAISON = 4`,
    voir `DECISIONS.md` §4 "Habitants par habitation"). **Reste ouvert
    pour les immeubles et les tours** : leur rythme actuel
    (`APART_FLOOR_EVERY`, `PER_FLOOR`) est resté inchangé, un choix
    assumé pour ne pas casser les repères de densité du cahier des
    charges (~28 blocs à 100 000 habitants, ~58 à 250 000) plutôt qu'un
    oubli. → **À trancher par Adrien** : le rythme des immeubles/tours
    doit-il lui aussi être repensé en "logements", ou son rythme actuel
    (mesuré en étages) reste-t-il satisfaisant tel quel ?
34. **Gratte-ciel figés en crise Énergie (Jalon 18, docs/SYSTEME-DEVELOPPEMENT.md
    §4).** "Les gratte-ciel arrêtent de monter" en crise Énergie n'est
    pas implémenté — nécessiterait un nouvel état persistant (un
    "population gelée pour les tours", mise à jour uniquement quand
    l'Énergie n'est pas en crise) pour un effet purement visuel ; jugé
    disproportionné pour ce jalon. → **À trancher par Adrien** : vaut-il
    le coût d'implémentation, ou peut-on laisser les tours continuer de
    monter même en crise Énergie (l'effet réel — risque de
    manifestation ×2 — reste lui bien appliqué) ?
35. **Fumée 3D (palier Émeutes) et notification du pays (palier Crise),
    Jalon 18, docs/SYSTEME-DEVELOPPEMENT.md §6bis.** Pas d'infra de
    notification pays pour l'instant (pas de boîte de réception, pas de
    page dédiée) ; l'effet 3D "fumée visible" nécessiterait de toucher
    le générateur de ville pour un affichage temporaire. Les paliers
    eux-mêmes sont bien calculés et visibles (badge + bulletin), seuls
    ces deux effets d'accompagnement manquent. → **À trancher par
    Adrien** : à construire maintenant, ou repoussé à un futur jalon
    (ex. quand une vraie page pays avec notifications existera) ?
36. **Monuments d'influence (docs/A-INTEGRER.md §19, 27/09/2026).**
    Bâtiments spéciaux (statues, fontaines, arcs...) débloqués
    automatiquement par paliers d'influence RECORD (`influence_max`,
    nouveau champ, jamais décroissant — même principe que
    `population_max`), 16 paliers proposés de 10 à 1 000 000, purement
    cosmétique. Rangé dans `ROADMAP.md` au Jalon 20 (mégaprojets/
    technologies), à la discrétion de Claude Code selon la note
    d'Adrien. → **Chiffres des paliers et liste des bâtiments à
    ajuster avec les villes de test**, comme d'habitude — pas encore
    codé.
