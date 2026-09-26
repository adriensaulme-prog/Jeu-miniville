# À intégrer par Claude Code — décisions prises côté Claude chat (Cowork)

*Note de passage de relais, mise à jour le 23/09/2026 au soir (après le
Jalon 6bis). À fusionner dans `docs/` du dépôt **sans écraser** le
journal existant, puis ce fichier peut être supprimé.*

> **État de l'intégration (24/09/2026, Claude Code)** : §1 fait au
> Jalon 7 ; §2 fait au Jalon 7bis ; §3 consigné en points ouverts
> (`DECISIONS.md` §10 points 16 et 22, jalon "Revoir les règles du jeu"
> à placer dans `ROADMAP.md`), aucun code ; §4 inscrit comme contrainte
> permanente (`DECISIONS.md` §1 point 6), script `npm run poids` pas
> encore fait ; §6 fait aux Jalons 8 et 8bis (`DECISIONS.md` §4, journaux
> des deux jalons, et §10 points 23-25 pour les questions encore
> ouvertes) ;
> **§8 (noms uniques) pas fait** malgré la demande "à faire dans le
> Jalon 8" — le contenu réel du jalon a suivi `docs/CLASSEMENTS.md`
> plutôt que ce §8, voir `DECISIONS.md` §10 point 26 ; **§9 (service
> worker) fait le 25/09/2026** — correctif d'Adrien conservé, test de
> non-régression ajouté, geste de dépannage documenté dans
> `GUIDE-METHODE.md` §9 (voir `DECISIONS.md` §4, "Correction hors-jalon") ;
> **§10 (dépenses
> sous contrôle) fait le 25/09/2026** — règle §1 point 1 réécrite,
> nouveau tableau "dépenses en cours" en §7 ; **§11 (carte du pays)
> faite le 25/09/2026** comme "Jalon 9 ter" — `/pays` affiche
> maintenant la carte plutôt que le fond 3D ; scintillement nocturne,
> repères de jumelages et clic sur une région non faits (points
> ouverts, `DECISIONS.md` §10 point 28). **§12 (mobilisation
> quotidienne) fait le 25/09/2026** — "mobiliser" cliquable retiré
> (table, fonction, bouton), remplacé par `effort_national()` dérivé de
> l'activité et des ressources nationales (migration corrective `0017`,
> envoyée à Adrien, en attente de confirmation d'application) ; pondération
> proposée par Claude Code et retenue par Adrien ; "avantages nationaux"
> (Défense) pas construits, consignés en point ouvert (`DECISIONS.md`
> §10 point 31). Détail dans `DECISIONS.md` §4, journal du Jalon 13.
> **§13 (visites plusieurs fois par jour) fait le 26/09/2026** comme
> "Jalon 13 bis" — délai d'une heure + plafond de 3 par jour et par
> (visiteur, ville), plafond choisi par Claude Code comme demandé
> (migration `0018`, envoyée à Adrien, en attente de confirmation
> d'application). Point ouvert : extension du même principe à
> Influence/AntiVille, pas demandée pour l'instant (`DECISIONS.md` §10
> point 32). Détail dans `DECISIONS.md` §4, journal du Jalon 13 bis. Ce
> fichier peut être supprimé quand Adrien aura répondu aux questions
> restantes.

Fichiers déposés avec cette note :
- `docs/prototypes/maquette-ecrans.html` — **nouveau** : maquette
  cliquable de toutes les pages du jeu (données fictives).
- `docs/prototypes/prototype-ville-3d.html` — **mis à jour** : la ville
  qui grandit sans limite (voir plus bas). `git diff` montre ce qui a
  changé depuis la version portée au Jalon 6bis.
- `docs/SYSTEME-DEVELOPPEMENT.md` — **nouveau** : proposition de game
  design, **pas encore validée par Adrien, ne rien coder**.

---

## 1. Refonte visuelle des pages du jeu — prochain jalon proposé

**Constat d'Adrien** : après le Jalon 6bis, les pages ne ressemblent pas
aux maquettes qu'il a validées (panneaux de chaque côté de la ville,
onglets, encadrés d'informations). C'est normal : le Jalon 6bis ne
portait que le rendu 3D. Ce jalon-ci fait l'interface.

**Référence** : `docs/prototypes/maquette-ecrans.html`, écrans Accueil,
Fonder sa ville, Ma ville, Les villes (liste + visite), Jumelages, en
ordinateur et en mobile. Le moteur 3D de la maquette est le même que le
prototype : **réutiliser la scène Three.js du Jalon 6bis**, ne pas
reprendre le WebGL de la maquette.

**Hors périmètre de ce jalon** : dans la maquette, tout ce qui touche au
système de développement (grille des 7 activités à la visite, jauges,
mégaprojet, décisions du maire, bouton « Simuler 30 jours ») est une
proposition non validée. Ne pas l'implémenter ; garder la visite
actuelle (un bouton « Visiter »).

**Règle ferme d'Adrien : aucun curseur ni bouton de triche dans le jeu
jouable.** Les maquettes contiennent des outils de démonstration
(curseur « Habitants », bouton « Voir grandir », curseur d'heure, tiroir
« Simuler la croissance », « Simuler 30 jours ») : ce sont des outils
de test, **à ne jamais reproduire dans l'application**. Dans le jeu, la
population ne monte que par les visites des autres joueurs, et l'heure
est toujours l'heure réelle du pays. Pour tester, on utilise les villes
de test et les scripts de seed, pas l'interface. À inscrire dans
`DECISIONS.md` et à couvrir par un test (aucun champ `input[type=range]`
ni route de modification de population accessible au joueur).

**Principes de design à respecter** :
- La **ville en 3D occupe tout l'écran** ; l'interface flotte par-dessus
  dans des **panneaux vitrés** (blanc translucide + flou), à gauche
  (navigation / liste) et à droite (détail / journal). La caméra décale
  la ville pour qu'elle reste visible entre les panneaux. Sur mobile, un
  seul panneau en bas de l'écran et une barre d'onglets en bas.
- **Le nom d'une ville s'affiche comme un panneau d'entrée
  d'agglomération** (fond blanc, bord rouge, lettres capitales
  condensées).
- Typographie : **Barlow** (texte) et **Barlow Condensed** (noms de
  villes, titres, stades), Google Fonts, gratuites.
- Couleur d'accent : **rouge panneau** (#c23b2c) ; états en couleurs
  sémantiques séparées (vert = réussi / jumelée, orange = protégée,
  rouge = en grève / attaque).
- Chiffres en tuiles (habitants, influence, activité), barre de
  progression vers le stade suivant, compteurs de quotas visibles
  (« 4 / 5 aujourd'hui »), boutons désactivés avec la raison écrite
  (« Déjà visitée aujourd'hui »).
- **Afficher la ville qu'on regarde** : sur la page Villes, cliquer une
  ville la montre en 3D derrière le panneau de visite.
- Clin d'œil MiniVille : un **« Bulletin municipal »** (journal du jour :
  nouveaux habitants, influences reçues, attaques, étages construits) et
  un bloc **« Fais grandir ta ville »** avec le lien à partager.
- L'écran de création de ville montre **en direct** la future ville
  (hameau au croisement) pendant qu'on tape son nom et choisit le pays.
- Mode clair et sombre, i18n fr/en comme partout.

**Découpage** : nouveau **Jalon 7 — « Un jeu agréable à regarder »**
(toutes les pages : accueil, connexion / inscription, création, Ma
ville, Villes, Jumelages, navigation). « Se classer » devient le
Jalon 8 et les suivants sont décalés d'un numéro. *(Si Adrien préfère
faire le classement d'abord, l'ordre s'inverse simplement.)*

---

## 2. La ville ne s'arrête jamais de grandir (demande d'Adrien)

Complète `DECISIONS.md` §8. À porter dans la scène Three.js, dans le
Jalon 7 ou juste avant. Les **16 premiers blocs** s'ouvrent comme prévu
jusqu'à 40 000 habitants, puis la ville **continue de s'étendre sans
limite** : **un nouveau bloc tous les 5 000 habitants**, toujours du
centre vers l'extérieur, avec ses rues. Repères : ~28 blocs à 100 000
habitants (Métropole), ~58 blocs à 250 000.
- Chaque nouveau bloc suit la même vie : maisons une par une, immeubles,
  puis chantier de gratte-ciel (au plus tôt 12 000 habitants après
  l'ouverture du bloc).
- Hauteur des tours toujours plus grande au centre ; les blocs lointains
  plafonnent à ~14 étages : la ville garde une silhouette dense au
  centre.
- Les deux grands axes traversent toute la ville et repartent en routes
  de campagne depuis son bord actuel ; les forêts ont des positions fixes
  et disparaissent là où la ville s'étend.
- Technique (voir le prototype mis à jour, fonctions `openAtK`,
  `towerAtK`, `generate`) : blocs repérés par des coordonnées entières
  relatives au croisement central (rues sur x = 80·k), ordre d'ouverture
  par distance au centre + petit aléa stable par ville ; caméra, ombres,
  occlusion au sol et brouillard s'adaptent au rayon de la ville.
- Point ouvert pour Adrien : un **stade au-delà de Métropole** (ex.
  « Mégapole » à 250 000) ?

---

## 3. Système de développement des villes (7 activités) — en attente

`docs/SYSTEME-DEVELOPPEMENT.md` : choix d'une activité à chaque visite,
7 jauges d'équilibre, effets, maire, manifestations, lien avec AntiVille
(§6 bis), mégaprojets. **En attente des réponses d'Adrien** (questions
en fin de document). À ranger dans `docs/` et à signaler dans
`DECISIONS.md` §10 comme point ouvert ; aucun jalon tant que ce n'est pas
validé.

**Retour d'Adrien après test du Jalon 4 (24/09/2026)** : « −10 % de
population est exagéré ». Tous les mécanismes et actions seront revus
dans un futur jalon **« Revoir les règles du jeu »**, sur une même grille :
effet unitaire faible, cumul des attaques reçues dans la journée (tous
attaquants confondus), plafond de 10 % par jour atteint à 1 000
attaques, paliers visibles (Incidents, Troubles, Émeutes, Crise, Ville
sinistrée). Détail dans `docs/SYSTEME-DEVELOPPEMENT.md` §6 bis.
Idée d'Adrien à intégrer dans la même réflexion : **une perte
d'habitants ne détruit aucun bâtiment, elle vide des logements**. Les
bâtiments représentent la capacité (`population_max`) ; tant que la
population n'est pas revenue à son record, les visites remplissent les
logements vides et **la construction est en pause** (§6 bis). Le rendu
actuel d'après `population_max` est donc déjà le bon ; seul l'affichage
des logements vides (fenêtres éteintes, « À louer ») sera à ajouter.
**Proposition en réflexion, ne pas coder maintenant** ; à ajouter à
`ROADMAP.md` comme jalon à placer (Adrien choisira quand), et à noter
dans `DECISIONS.md` §10 comme point ouvert.

---

## 4. Une application légère (demande d'Adrien)

**Règle ferme d'Adrien : le jeu doit rester léger, c'est une appli de
2-5 minutes par jour.** À inscrire dans `DECISIONS.md` comme contrainte
permanente, et à vérifier à chaque jalon.

Bonne nouvelle de départ : la ville 3D est **entièrement procédurale**
(bâtiments, textures et lumières calculés dans le code). Il n'y a ni
image, ni modèle 3D, ni texture à télécharger ; il faut que ça le
reste.

**Budget (build de production, compressé gzip/brotli)** :
- **premier chargement complet ≤ 500 Ko** (JavaScript + CSS + polices),
  dont Three.js ~150 Ko ;
- **visite suivante ≈ 0 Ko** de code (tout en cache par le service
  worker), seulement les données de la ville (quelques Ko de JSON) ;
- une page affiche son texte **avant** que la 3D soit prête : Three.js
  et la scène se chargent en différé (`import()` dynamique /
  `next/dynamic` avec `ssr: false`), jamais dans le paquet initial du
  `layout` ;
- application installée depuis les stores plus tard (TWA Android /
  Capacitor iOS) : **viser moins de 10 Mo**.

**Moyens** :
- pas d'image, de vidéo, de son ni de modèle 3D sans décision d'Adrien ;
  les icônes restent des SVG ou des emojis ;
- polices : **seulement les graisses réellement utilisées** de Barlow et
  Barlow Condensed (2-3 au total), sous-ensemble latin, `next/font`
  (déjà en place) ;
- **aucune nouvelle dépendance npm** sans l'inscrire dans `DECISIONS.md`
  avec son poids ; préférer quelques lignes de code maison ;
- Three.js : importer seulement les classes utilisées si possible (pas
  `import * as THREE` dans le code chargé au démarrage) ;
- téléphone : résolution des ombres et `pixelRatio` réduits sur mobile
  (déjà en partie fait), rendu mis en pause quand l'onglet est caché
  ou que rien ne bouge (batterie).

**Test** : un script `npm run poids` (ou un test Vitest) qui lance
`next build` et **échoue si le budget est dépassé** (lecture de la
sortie de build ou de `.next/`, tailles compressées). Les chiffres
mesurés vont dans le résumé de chaque jalon dans `DECISIONS.md` §4.
Attention : les tailles de `.next/` après `npm run dev` ne veulent rien
dire (code non minifié, plusieurs Mo) ; seul le `next build` compte.

---

## 6. Classements et régions — pour le Jalon 8 (demande d'Adrien, 24/09/2026)

Spécification dans `docs/CLASSEMENTS.md`. **À intégrer au Jalon 8 « Se
classer »**, qui change de contenu :
- chaque ville appartient à une **région** de son pays (choix à la
  création, rattrapage des villes existantes à la prochaine connexion,
  changement possible une fois tous les 30 jours) ; table `regions`
  construite à partir de l'ISO 3166-2 (noms fr/en du CLDR, libre),
  retouchée pour les pays principaux (France : 13 régions + 5
  d'outre-mer) ;
- classements **mondial, national et régional**, avec « ma position »
  toujours visible ;
- proposé en **Jalon 8bis « Les palmarès »** : bilans journaliers
  (`city_stats_jour`) et classements annexes par période (croissance,
  habitants perdus, influence, visites reçues et données, jumelages,
  attaques reçues).
Questions encore ouvertes pour Adrien en §6 du document (30 jours,
gouverneur de région, pas de classement des attaquants) : ne bloquent
pas le début du Jalon 8, prendre les propositions par défaut et le
noter dans `DECISIONS.md`.

## 7. Bâtiments : décision d'Adrien (24/09/2026)

Principe validé pour `docs/BATIMENTS-ET-PACKS.md` : **bâtiments de base
gratuits pour tout le monde** (ceux d'aujourd'hui, à enrichir), et
**packs payants inspirés de villes** (New York, Paris, etc.), purement
cosmétiques. Pas de variantes gratuites par pays. À inscrire dans
`DECISIONS.md` et dans `ROADMAP.md` (jalons « La bibliothèque de
bâtiments », « Les thèmes », puis « La boutique » après le MVP).

## 8. Noms uniques : pseudos et villes (demande d'Adrien, 24/09/2026)

**Règle ferme d'Adrien : deux joueurs ne peuvent pas avoir le même
pseudo, et deux villes ne peuvent pas avoir le même nom.** Constat :
aujourd'hui, ni `users.pseudo` ni `cities.nom` n'ont de contrainte
d'unicité (migrations 0001 à 0008). À faire **dans le Jalon 8**, qui
touche déjà l'écran de création (choix de la région).

- **Unicité « à la lecture »**, pas seulement à la lettre près :
  « Rochemaure », « rochemaure », « Rochemauré » et « Roche-Maure »
  sont le même nom. Colonne générée normalisée (minuscules, sans
  accents via l'extension `unaccent`, sans espaces, tirets ni
  apostrophes) + **index unique** dessus. C'est la base qui garantit
  la règle (deux inscriptions simultanées ne passent pas toutes les
  deux), pas seulement le formulaire.
- **Portée mondiale** pour les villes comme pour les pseudos : le nom
  d'une ville apparaît dans le classement mondial, il doit y être
  unique.
- **À la création** : vérification pendant la saisie (« ✓ disponible »
  / « ✗ déjà pris »), message clair si le nom est pris au moment de
  valider, avec un code d'erreur dédié (même logique que les codes
  P0004–P0007 du Jalon 4).
- **Doublons déjà existants** (base de dev/recette) : la migration les
  détecte ; la ville ou le pseudo **le plus ancien garde le nom**, le
  plus récent doit en choisir un autre à sa prochaine connexion (même
  écran de rattrapage que pour la région).
- **Villes de test** : vérifier qu'aucun nom de `villes-de-test.json`
  n'entre en collision ; le test existant sur leur absence en
  production reste valable.
- **Noms réservés** *(proposition)* : refuser « admin », « modérateur »,
  « système », le nom du jeu, et une courte liste de mots injurieux ;
  pseudo de 3 à 20 caractères (aujourd'hui 1 à 40).
- **Tests** : même nom avec une autre casse, avec ou sans accent, avec
  tiret ou espace → refusé ; deux créations simultanées du même nom →
  une seule réussit ; test rouge par sabotage (retirer l'index fait
  échouer le test).

## 9. Service worker : à désactiver en développement (bug vécu par Adrien, 25/09/2026)

**Symptôme** : `localhost:3000` inaccessible pour Adrien avec
`ERR_FAILED` dans Chrome (pas `ERR_CONNECTION_REFUSED` : le serveur
`next dev` tournait). Cause : `RegisterServiceWorker`
(`src/app/register-sw.tsx`) enregistre `public/sw.js` **aussi en
développement**. Ce service worker met en cache `/` de façon agressive
(`fetch` dans le handler `fetch`, cache `SHELL_URLS`), or les chunks et
le HTML changent à chaque compilation/HMR de `next dev` : le service
worker sert alors une version périmée ou échoue, et bloque toute la
page. Résolu ponctuellement par Adrien via DevTools > Application >
Service Workers > Unregister + Clear site data.

**À corriger** : n'enregistrer le service worker **qu'en production**
(`process.env.NODE_ENV === "production"`, ou équivalent Next.js), jamais
pendant `npm run dev`. Ajouter un test ou une vérification qui empêche
la régression. Documenter le geste de dépannage (Unregister + Clear
site data) dans `docs/GUIDE-METHODE.md` au cas où ça se reproduise
malgré tout (cache déjà enregistré chez un joueur avant la correction).

## 10. Assouplissement de la règle "zéro coût" (décision d'Adrien, 25/09/2026)

**Adrien accepte des dépenses raisonnables pour un résultat carré**
(nom de domaine, service d'e-mails, etc.), **à condition d'être
systématiquement demandé avant, même pour un petit montant.** Ce n'est
pas un blanc-seing : aucune dépense ne doit être engagée sans validation
préalable explicite, quel que soit le montant.

**À corriger dans `docs/DECISIONS.md` §1 point 1** ("Zéro coût, zéro
royalties") : remplacer par une règle en deux temps —
1. par défaut, on reste sur des outils et niveaux de service gratuits ;
2. une dépense reste possible (nom de domaine, service payant...), mais
   **seulement après qu'Adrien l'a explicitement approuvée**, montant et
   fournisseur à l'appui. Aucune carte bancaire ni compte payant ne doit
   être créé sans cette validation.

Renommer la règle en conséquence (ex. "Dépenses sous contrôle" plutôt
que "Zéro coût"), et adapter le point du §9 sur les paliers gratuits en
"dépenses en cours" (fournisseur, montant, date, approuvé par Adrien
le ...).

**Déclencheur de cette décision** : connexion Google/Facebook (gratuite)
et e-mails de vérification envoyés depuis une adresse à Adrien plutôt
que Supabase (nécessite un nom de domaine, ~10-15 €/an, + un service
d'envoi avec palier gratuit). Proposition détaillée à venir dans
`docs/AUTHENTIFICATION.md` une fois qu'Adrien aura choisi un nom de jeu
(le domaine en dépend) et un service d'e-mails.

## 11. La carte du pays, pas la ville en 3D (demande d'Adrien, 25/09/2026)

Proposition complète dans `docs/CARTE-DU-PAYS.md`. **Corrige un choix
déjà fait aux Jalons 9 et 10** : la page Pays affiche aujourd'hui la
ville du joueur en 3D en fond (`SincroniserScene` dans
`src/app/pays/page.tsx`), comme toutes les autres pages. Adrien ne veut
pas de ville vue du ciel pour cette page, mais une **carte du pays**.

**Style et couleur déjà validés par Adrien**, pas de question bloquante :
carte illustrée façon jeu (pas une carte réaliste/satellite), régions
colorées par population. Détail complet, source des tracés (Natural
Earth, domaine public, gratuit) et découpage en jalon (proposé : "Jalon
9 ter — La carte du pays") dans le document. Ne touche que la page
Pays ; les autres pages gardent leur fond 3D actuel.

## 12. Mobilisation quotidienne : correction d'une réponse d'Adrien (25/09/2026)

**Contexte** : en travaillant le Jalon 13 (« France contre Allemagne »),
tu as demandé à Adrien comment un citoyen contribue chaque jour à
l'effort de guerre de son pays. Sa réponse a mené à ce qui est
actuellement écrit dans
`supabase/migrations/0016_jalon13_france_contre_allemagne.sql`
(table `mobilisations`, fonction `mobiliser()`, effort compté par
`resoudre_conflits_en_cours()` et `conflit_pays()`) et au bouton
« Se mobiliser » (`pays.conflit.mobiliser`) de `src/app/pays/page.tsx` /
`mobiliserAction()` dans `src/app/pays/actions.ts` — **une nouvelle
action que chaque joueur doit cliquer une fois par jour pendant un
conflit**, dont l'effort cumulé (nombre de clics) décide du résultat de
la guerre. Adrien précise après coup qu'il a mal répondu à cette
question : ce n'est **pas** ce qu'il voulait dire, et il s'en est rendu
compte en la reformulant lui-même.

**Correction** : la mobilisation quotidienne n'est **pas une action que
le citoyen effectue en plus de ce qu'il fait déjà** — ce n'est pas un
nouveau bouton à cliquer chaque jour du conflit. C'est le **pays** qui a
des attributs et des ressources — ressources nationales (cahier des
charges §10), avantages nationaux dont Défense (§13), activité
quotidienne agrégée (§9) — et ce sont **ces valeurs déjà existantes ou
déjà prévues** qui déterminent la force de mobilisation du pays chaque
jour de conflit, pas un compteur de clics individuels.

Concrètement, le citoyen continue de jouer normalement (se connecter,
visiter, influencer, comme tous les autres jours) ; c'est **cette
activité normale, agrégée au niveau du pays** (l'activité quotidienne
suivie depuis les Jalons 8/8bis), combinée aux ressources et avantages
nationaux du pays, qui *constitue* la mobilisation quotidienne du jour —
pas une mécanique de guerre séparée avec sa propre table et son propre
bouton.

**À corriger dans le Jalon 13** :
- retirer la table `mobilisations`, la fonction `mobiliser()`, l'action
  serveur `mobiliserAction()` et le bouton « Se mobiliser »
  (clé `pays.conflit.mobiliser`) ;
- dans `resoudre_conflits_en_cours()` et `conflit_pays()`, calculer
  l'effort quotidien de chaque camp à partir des statistiques
  nationales déjà agrégées (activité quotidienne du pays, ressources
  nationales, avantages nationaux type Défense/Industrie) plutôt que
  d'un `count(*)` sur des clics individuels ;
- le bonus défensif de 50 % pour le défenseur (déjà décidé, cahier des
  charges) peut rester tel quel, appliqué cette fois sur le score national
  plutôt que sur un total de mobilisations ;
- si un ingrédient nécessaire n'existe pas encore (ex. avantages
  nationaux, pas encore construits comme système), le signaler comme
  point ouvert dans `DECISIONS.md` §10 plutôt que d'inventer une action
  citoyenne de remplacement pour combler le manque.

**Pourquoi ce n'était pas anodin** : une action « mobiliser » cliquable
ajoute une nouvelle mécanique quotidienne au jeu, contraire à la boucle
courte déjà fixée (`DECISIONS.md` §1 point 3), et n'est décrite nulle
part dans le cahier des charges — le §29 (« en cas de guerre :
mobilisation quotidienne... ») la liste comme un **ingrédient du
calcul**, à côté de « activité quotidienne », pas comme une action
séparée que le joueur doit accomplir volontairement.

## 13. Visiter plusieurs fois par jour, avec un délai minimum (décision d'Adrien, 26/09/2026)

**Demande d'Adrien** : au lieu d'une seule visite par (joueur, ville) et
par jour, une même personne doit pouvoir revisiter une ville (la sienne
ou celle d'un autre) plusieurs fois dans la journée, avec un **délai
minimum d'une heure entre deux visites** sur la même ville. Objectif
assumé, ce n'est pas seulement accélérer la croissance : « garder les
gens connectés plus souvent, ce qui est mieux pour les fidéliser ».

**Attention, déviation assumée du cahier des charges** : le §3 et le
§26 posent explicitement « une même personne ne peut contribuer qu'une
seule fois par jour à une même ville » comme règle anti-abus. Adrien,
auteur du cahier des charges, a été informé de cette contradiction
(question posée en retour côté Claude chat) et confirme vouloir cette
évolution malgré tout, en connaissance de cause. À documenter dans
`DECISIONS.md` comme un **amendement volontaire**, pas un oubli — même
précédent que l'assouplissement de la règle "zéro coût" (§10 plus haut
dans ce fichier).

**Ce qui doit changer techniquement** (`supabase/migrations/0003...sql`
et suivantes, table `visites`, fonction `visiter_ville()`) :
- retirer la contrainte `unique (visiteur_id, ville_id, jour)` — elle
  empêchait justement plusieurs visites le même jour ;
- dans `visiter_ville()`, remplacer le contrôle "déjà visité
  aujourd'hui" par : refuser si la dernière visite de ce couple
  (visiteur, ville) date de **moins d'une heure** (nouveau code
  d'erreur dédié, cf. le registre des codes de la migration `0006`) ;
- ajouter un **plafond quotidien** par (visiteur, ville) en plus du
  délai d'une heure — sans lui, un joueur très motivé pourrait visiter
  la même ville jusqu'à ~24 fois/jour, ce qui dépasserait largement la
  contrainte « boucle courte » (`DECISIONS.md` §1 point 3) et
  déséquilibrerait la croissance (une ville avec un visiteur acharné
  grandirait bien plus vite qu'une ville qui recrute large, à l'inverse
  de l'esprit du §3 du cahier des charges). **Nombre exact laissé à
  Claude Code** ("chiffre à déterminer", Adrien délègue) — recommandation
  de départ : **3 visites par jour et par (visiteur, ville)**, à ajuster
  avec les villes de test, dans le même esprit que les quotas déjà
  tranchés par Claude Code aux Jalons 3 et 4 ("tranche selon tes reco") ;
- l'auto-visite reste refusée (code existant) : cette règle-là n'est
  pas remise en cause par cette décision.

**Interface** : remplacer "Déjà visitée aujourd'hui" par un compte à
rebours (« Revisiter dans 42 min ») quand le délai n'est pas écoulé, et
un compteur du plafond quotidien une fois atteint (« 3/3 visites
aujourd'hui »), dans le même style que les autres quotas déjà affichés
(« 4 / 5 aujourd'hui » pour l'influence).

**Périmètre de cette décision** : seule l'action **Visiter**
(population) est concernée pour l'instant. Les quotas d'Influence
(5/jour) et d'AntiVille (3/jour) restent inchangés — Adrien n'a pas
demandé à les étendre au même système ; question ouverte à lui reposer
avant d'y toucher, si l'objectif de rétention s'y prête aussi.

**Complément naturel, pas pour ce jalon** : puisque le but est la
rétention, une notification de rappel (« ta ville peut être revisitée »)
serait un bon complément — déjà listé comme ambition long terme dans
`DECISIONS.md` §9 ("Notifications push"), à ne pas construire maintenant.
