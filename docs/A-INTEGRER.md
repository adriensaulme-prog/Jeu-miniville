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
> point 32). Détail dans `DECISIONS.md` §4, journal du Jalon 13 bis.
> **§14/§15/§16 faits le 26/09/2026** comme "Jalon 13 ter" — panneau
> flottant réductible sur mobile (`PanneauFlottant.tsx`) ; bouton
> "Visiter" retiré, visite comptée automatiquement ~2,5 s après
> ouverture de la page (`VisiteAutomatique.tsx`, délai choisi par
> Claude Code comme demandé) ; auto-visite autorisée, contrôle `P0005`
> retiré de `visiter_ville()`, même délai/plafond qu'une autre ville
> (migration `0021`, envoyée à Adrien, en attente de confirmation
> d'application). §15 partie B (choix du thème) toujours bloquée
> derrière `SYSTEME-DEVELOPPEMENT.md`, pas encore validé. Détail dans
> `DECISIONS.md` §4, journal du Jalon 13 ter.
> **§17 (croissance rapide en début de partie) fait le 26/09/2026 puis
> ANNULÉ par Adrien le 27/09/2026** — le gain par visite dégressif
> (×5/×2/×1) est défait, retour au flat +1 (migration `0022` réécrite,
> renvoyée à Adrien). Adrien veut que la sensation de croissance passe
> par le rendu 3D plutôt que par le chiffre de population ; reformulé
> comme "combien d'habitants par habitation" et **fait le 27/09/2026
> pour les maisons** (une maison = un logement, tous les 4 habitants,
> même règle du Hameau à la Métropole — `DECISIONS.md` §4 "Habitants
> par habitation"). Immeubles et tours volontairement laissés au
> rythme actuel, point ouvert (`DECISIONS.md` §10 point 33).
> **§18 (système de développement des 7 activités, 26/09/2026) :
> VALIDÉ, en cours de mise en œuvre** — les 8 questions de
> `SYSTEME-DEVELOPPEMENT.md` §10 ont toutes leur réponse, dont un
> nouveau stade "Mégapole" à 250 000 habitants. Découpé en Jalons 17 à
> 20 dans `ROADMAP.md` (Phase 6), suivant le découpage en 4 de son §9 ;
> répond aussi à `DECISIONS.md` §10 points 16, 20 et 22. **Jalon 17
> (1/4, choix d'activité et jauges) fait le 27/09/2026** — deux
> contradictions avec le document initial (visite automatique du Jalon
> 13 ter, auto-visite autorisée) tranchées par Adrien, pas par Claude
> Code seul (`DECISIONS.md` §4, journal du Jalon 17). **Jalon 18 (2/4,
> effets de l'équilibre) fait le 27/09/2026** — une troisième
> contradiction (mécanique de la grève, entre le tableau du §6bis et sa
> liste d'effets unitaires) de nouveau signalée plutôt que tranchée
> seule ; Adrien redéfinit la grève par une échelle selon le nombre
> cumulé d'attaques du jour (`DECISIONS.md` §4, journal du Jalon 18).
> **Jalon 19 (3/4, quartiers et bâtiments 3D) fait le 27/09/2026** —
> vocation de chaque bloc (table `city_blocks`, identifiée par rang),
> nouveaux bâtiments de quartier, Énergie hors de la ville. Portée
> réduite assumée à valider par Adrien : deux étapes par vocation au
> lieu des 3-4 du document (`DECISIONS.md` §4, journal du Jalon 19).
> Migration `0026` pas encore envoyée/appliquée au moment de cette
> note.
> **§19 (monuments d'influence, 27/09/2026) : fait le 27/09/2026**
> comme "Jalon 20 3/3" — catalogue des 16 paliers repris tel quel,
> nouveau champ `cities.influence_max`, bâtiments 3D simples. Migration
> `0030` envoyée à Adrien, en attente de confirmation d'application.
> Détail dans `DECISIONS.md` §4, journal du Jalon 20 (3/3).
> **§20 (retours de test Jalon 19, 27/09/2026) : fait le 27/09/2026** —
> (A) niveau de détail des quartiers repris (0/1/2 au lieu de 2 étapes,
> Énergie en particulier enrichie) ; (B) choix d'activité désormais
> verrouillé après un premier choix explicite (migration corrective
> `0027`, envoyée à Adrien, en attente de confirmation d'application).
> Détail dans `DECISIONS.md` §4, journal du Jalon 19.
> **§21 (affichage des jauges d'activité, 27/09/2026) : fait le
> 27/09/2026** — `JaugesActivites.tsx` affiche désormais l'état
> (Crise/Fragile/Équilibré/Point fort) en texte principal, le
> pourcentage exact passant en info secondaire (attribut `title`,
> infobulle au survol). Calcul, seuils et barre de progression
> inchangés (pur affichage front-end, aucune migration).
> **§22 (bibliothèque de bâtiments, retour de test du 30/09/2026,
> corrigé après capture d'écran) : nouveau** — pas un problème de
> richesse visuelle comme d'abord compris : sur `/dev/showroom`, la
> plupart des vignettes sont blanches ou ne montrent qu'un fragment du
> bâtiment, pas de vraie forme. Cause probable identifiée par Claude
> chat : 15 `WebGLRenderer` simultanés sur une seule page (un par
> vignette) contre un seul dans la vraie scène du jeu (`scene.ts`).
> **§23 (refonte /pays, 02/10/2026) : nouveau** — Adrien ne veut plus de
> la carte du pays (Jalon 9 ter) ; la remplacer par un statut
> diplomatique de la semaine (paix/guerre/allié) et un historique
> hebdomadaire complet (diplomatie + vote de ressource + résultat de
> conflit). Nouvelle table de synthèse probablement nécessaire.
> **§24 (guerres équilibrées entre pays, 02/10/2026) : nouveau** —
> `effort_national()` compare aujourd'hui une SOMME d'activité par
> pays, ce qui écrase mécaniquement les petits pays. Adrien a choisi de
> passer à une MOYENNE par ville/joueur, pour une guerre équitable
> indépendamment de la taille du pays.
> **§25 (zones dans la ville + repérer les bâtiments débloqués,
> 02/10/2026) : nouveau** — les blocs de la ville sont mélangés
> aujourd'hui (vocation décidée indépendamment de la position) ;
> Adrien veut les gratte-ciels au centre et les maisons repoussées en
> périphérie à mesure que la ville grandit, plus un vrai catalogue
> débloqué/à débloquer sur `/ville` avec un bouton pour repérer un
> bâtiment dans la vue 3D. Gros chantier, détail complet dans la
> section. **État : 25a (catalogue + « voir où il est » + secteurs
> fixes hors de la ville) et 25b (zonage des blocs par secteur, migration
> `0038`) codés le 02/10/2026.**
> **§26 (propositions d'amélioration de Claude chat, 02/10/2026,
> toutes validées par Adrien) : nouveau** — journal mondial (cahier
> §22), notifications de rivalité (cahier §23), page de ville
> partageable/viralité (cahier §24), amis et suivi (cahier §25),
> découverte des petites villes neuves sur `/villes`, et un parcours de
> découverte pour les nouveaux joueurs. Six chantiers distincts, non
> priorisés entre eux.
> **§27 (plafond de visites à 8, feedback de visite + choix immédiat,
> bouton règles du jeu, 02/10/2026) : nouveau** — trois demandes
> ponctuelles d'Adrien, détail dans la section. **État : A, B et C codés
> le 02/10/2026 (migration `0039`).**
> **§28 (fichier APK pour tester avec des amis, 02/10/2026) :
> nouveau** — emballer la PWA existante (Jalon 15) en TWA pour obtenir
> un .apk installable, utile pour les tests fermés désormais EXIGÉS par
> le Play Store (12 testeurs pendant 14 jours) avant toute mise en
> production. **État : reçu, pas commencé** (demande l'URL de
> production, Java/SDK Android et un accord sur la garde de la clé de
> signature). Ce fichier peut être supprimé quand Adrien aura répondu
> aux questions restantes et que les jalons de la Phase 6 seront
> terminés.

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

## 14. Mobile : le panneau du bas cache la ville (retour de test d'Adrien, 26/09/2026)

**Constat d'Adrien**, en testant sur téléphone : « je ne vois pas la
ville bien, car les différents onglets se mettent devant, il faudrait
avoir la possibilité de réduire les onglets pour voir les villes ».

**Vérifié côté code** (`src/app/globals.css`, règles `.dock-float` et
`.screen` sous `@media (max-width: 640px)`) : sur mobile, le panneau
flottant du bas (`.dock-float`) peut occuper jusqu'à **55 % de la
hauteur de l'écran** (`max-height: 55dvh`), posé par-dessus la scène 3D,
sans aucun moyen de le réduire ou de le masquer. La barre d'onglets du
bas (58px) reste toujours visible, mais le panneau au-dessus d'elle
prend toute la place qu'il veut. Le principe d'origine (`A-INTEGRER.md`
§1 : « sur mobile, un seul panneau en bas de l'écran et une barre
d'onglets en bas ») ne prévoyait pas de bouton pour le réduire — l'écran
de test grandeur réelle d'Adrien montre que c'en est un vrai manque, pas
un détail.

**À corriger** :
- ajouter une **poignée / bouton "réduire"** sur le panneau (`.dock-float`
  en mode mobile) : un tiret ou une flèche en haut du panneau, qui le
  fait passer d'un état "ouvert" (jusqu'à 55dvh, comme aujourd'hui) à un
  état "réduit" (juste le titre/l'essentiel, quelques dizaines de pixels)
  et inversement ;
- l'état réduit doit laisser voir la majorité de la scène 3D en dessous ;
- mémoriser l'état choisi le temps de la session (pas besoin de le
  garder après fermeture de l'appli) ;
- un simple **glisser vers le bas** sur le panneau (drag/swipe) peut
  faire la même chose que le bouton, si c'est simple à ajouter avec le
  reste — sinon le bouton seul suffit pour cette itération.

**Précision, pas un bug** : le tableau de bord `dock-right` est déjà
masqué sur mobile (`display: none` sous 640px) et remplacé par le mode
détail plein écran quand on ouvre une ville — ce comportement-là reste
inchangé, seul `.dock-float` (le panneau principal du bas, onglets
compris) a besoin du réducteur.

## 15. Visite automatique, sans bouton à cliquer (décision d'Adrien, 26/09/2026)

**Demande d'Adrien**, en continuité du §13 : « il ne faudrait pas avoir à
cliquer, ça devrait être automatique sur chaque ville, et ensuite
choisir le thème que l'on souhaite développer ». Précisé en réponse à
une question directe de Claude chat : **ouvrir la page d'une ville doit
suffire à compter comme une visite** (plus de bouton « Visiter » à
cliquer) ; le seul clic qui reste sert à choisir quelle activité/thème
développer.

**Cette demande se coupe en deux, à traiter séparément :**

**A. La visite automatique — buildable maintenant, extension directe du
§13/Jalon 13 bis.**
- Quand un joueur ouvre la page de détail d'**une ville qui n'est pas la
  sienne**, appeler automatiquement l'équivalent de `visiter_ville()`
  (celui du Jalon 13 bis, avec délai d'1h et plafond de 3/jour déjà en
  place) — plus besoin du bouton ni du `<form action={visiterVille}>`
  dans `src/app/villes/page.tsx` ;
- l'auto-visite reste bien sûr impossible (code `P0005` inchangé) ;
- interface : remplacer le bouton par un message de confirmation discret
  (« Visite comptée, +1 habitant » ou le compte à rebours/plafond du
  §13 si la ville vient d'être visitée) — pas de nouveau clic requis ;
- **point d'attention pour Claude Code, à trancher selon ta recommandation**
  comme d'habitude : une visite automatique au chargement de la page
  peut se déclencher par simple curiosité (ouvrir une ville dans la
  liste sans intention de la soutenir), alors qu'un bouton signalait une
  action volontaire. Si ça te semble un risque pour l'équilibre, une
  option intermédiaire : ne compter la visite qu'après un court délai
  sur la page (ex. 2-3 secondes), ou seulement en mode détail plein
  écran (pas depuis un simple survol/aperçu dans la liste). Décision
  laissée à Claude Code, comme le plafond du §13.

**B. Le choix du thème/activité à développer — reste bloqué derrière
`docs/SYSTEME-DEVELOPPEMENT.md`, pas encore validé.**
- C'est exactement ce que propose déjà ce document (grille de 7
  activités à choisir à chaque visite, jauges d'équilibre, etc.), en
  attente des réponses d'Adrien listées en fin de document ;
- **ne pas construire de version provisoire** du choix de thème pour
  combler ce point tant que le système n'est pas validé — la partie A
  (visite automatique) peut avancer seule sans ça, la ville continue de
  grandir en `population` comme aujourd'hui ;
- quand `SYSTEME-DEVELOPPEMENT.md` sera validé, le clic supprimé en
  partie A sera remplacé par l'écran de choix d'activité de ce
  document-là, pas par un nouveau bouton "Visiter" séparé.

**Ce qui ne change pas** : le délai d'1h et le plafond de 3 visites par
jour et par (visiteur, ville) du §13/Jalon 13 bis s'appliquent à l'identique,
seul le geste pour déclencher une visite change (plus de clic).

## 16. Autoriser l'auto-visite : nouvel amendement volontaire au cahier des charges (décision d'Adrien, 26/09/2026)

**Demande d'Adrien**, confirmée après question de clarification : il
souhaite qu'un joueur puisse **visiter sa propre ville**, comme une
vraie règle du jeu pour tout le monde — pas seulement un outil de test.
Une ville pourrait donc grandir sans qu'aucun autre joueur ne la
visite jamais.

**Attention, deuxième déviation assumée du cahier des charges dans ce
fichier** (après le §13) : le §3 pose l'attraction d'autres joueurs
comme **le** principe fondateur de la croissance d'une ville — c'est ce
qui donne au jeu son caractère social/viral (inviter des amis, partager
sa ville pour la faire grandir). Autoriser l'auto-visite retire
l'obligation d'avoir ne serait-ce qu'un seul autre joueur pour grandir.
Adrien, auteur du cahier des charges, a été informé de cette
contradiction et confirme vouloir cette évolution en connaissance de
cause. **À documenter dans `DECISIONS.md` comme amendement volontaire**,
même précédent que le §13 et que le renommage « zéro coût » →
« dépenses sous contrôle ».

**Ce qui doit changer techniquement** :
- dans `visiter_ville()` (version actuelle : Jalon 13 bis, migration
  `0018`), **retirer le contrôle qui bloque l'auto-visite**
  (`if v_owner_id = p_visiteur_id then raise exception ... errcode = 'P0005'`) ;
- le code d'erreur `P0005` devient inutilisé — le laisser dans le
  registre des codes (migration `0006`) mais noter qu'il ne sert plus,
  plutôt que le réutiliser pour autre chose ;
- **le délai d'1h et le plafond de 3 visites/jour du §13 s'appliquent
  exactement pareil à soi-même qu'à une autre ville** — pas de règle
  spéciale à ajouter, c'est le même compteur (visiteur_id, ville_id)
  qui compte déjà les visites, qu'elles soient de soi ou d'un autre ;
- combiné au §15 (visite automatique sans clic) : ouvrir sa propre page
  « Ma ville » comptera donc aussi automatiquement comme une visite,
  avec le même délai/plafond — une ville isolée sans aucun visiteur
  extérieur pourra quand même avancer, mais **au maximum 3 fois par
  jour par elle-même**, très lentement comparé à une ville qui recrute
  plusieurs vrais visiteurs. Ça garde un intérêt réel à attirer
  d'autres joueurs, sans plus jamais bloquer totalement une ville
  isolée.

**Interface** : sur `src/app/ville/page.tsx` (page « Ma ville »), ce qui
était un simple affichage devient une page qui peut aussi déclencher une
visite automatique (comme les autres villes en §15), avec le même
message de confirmation / compte à rebours / plafond que partout
ailleurs.

**Portée** : cette décision ne concerne que **Visiter** (population),
comme le §13. Influence et AntiVille restent interdits sur sa propre
ville — l'auto-influence n'a pas de sens (pas de tiers à convaincre) et
l'AntiVille est une action hostile envers un adversaire, pas envers
soi-même ; aucune raison de les ouvrir à l'auto-usage.

**Correction d'une note précédente** : les §13 et §15 de ce document
disaient encore « l'auto-visite reste refusée / interdite » — c'était
vrai au moment où ils ont été écrits, ce §16 vient changer cette règle
juste après. En cas de lecture dans l'ordre, c'est ce §16 qui fait foi
sur l'auto-visite.

## 17. Croissance rapide en début de partie (décision d'Adrien, 26/09/2026)

**Demande d'Adrien** : pour les villes de faible niveau, il veut que les
maisons se développent vite, que la ville grandisse vite — plutôt que le
rythme actuel, identique à tous les niveaux (`population_vers_niveau()`,
migration `0008` : Hameau < 1 000, Village < 5 000, Bourg < 15 000,
Ville < 40 000, Grande ville < 100 000, Métropole ≥ 100 000 habitants,
et **+1 habitant par visite**, quel que soit le niveau).

**Pourquoi c'est un vrai problème aujourd'hui** : avec +1 habitant par
visite et un plafond de 3 visites/jour par (visiteur, ville) — même en
comptant l'auto-visite du §16 — une ville avec peu de vrais visiteurs
progresse à peine de quelques habitants par jour. Passer du Hameau au
Village (1 000 habitants) peut prendre des semaines si peu de monde
visite. Ça va à l'encontre de l'objectif de rétention déjà posé au §13 :
les premiers jours doivent donner une sensation de croissance visible et
gratifiante, sinon un nouveau joueur décroche avant même d'avoir vu sa
ville changer de visage.

**Proposition** : un **gain par visite dégressif selon le niveau
actuel de la ville**, au lieu d'un flat +1 partout — élevé aux niveaux
Hameau et Village pour que les premières maisons sortent de terre vite,
puis revenant à un rythme plus classique à partir de Bourg (où le jeu
redevient surtout une question de recruter de vrais visiteurs, pas de
vitesse brute). Reste bien un **gain par visite réelle** (soi-même ou un
autre joueur, §16) — cette proposition ne change pas le principe "il
faut des visites pour grandir", juste ce que chaque visite rapporte.

**Chiffres exacts laissés à Claude Code** (même logique que le plafond
du §13, "tranche selon tes reco"), à ajuster avec les villes de test.
Piste de départ, pas un chiffre imposé :
- Hameau (< 1 000 hab.) : bonus fort (ex. ×5 à ×10 par visite) ;
- Village (1 000-4 999 hab.) : bonus modéré (ex. ×2 à ×3) ;
- Bourg et au-delà (≥ 5 000 hab.) : retour au rythme actuel (+1 par
  visite), le jeu social prend le relais.

**Ce que ça couvre déjà** : les maisons/immeubles/tours d'un bloc
apparaissent en fonction de `population_max` (`docs/A-INTEGRER.md` §2)
— accélérer la population aux petits niveaux accélère donc
automatiquement l'apparition visible des maisons, pas besoin d'un
changement séparé côté rendu 3D.

**Pas une déviation du cahier des charges** : contrairement aux §13 et
§16, ceci ne touche à aucune règle du cahier des charges — c'est un
ajustement d'équilibrage (comme les quotas des Jalons 3/4), pas un
principe fondateur. Peut être codé directement, sans validation
supplémentaire.

## 18. Système de développement des villes (7 activités) : VALIDÉ par Adrien (26/09/2026)

**`docs/SYSTEME-DEVELOPPEMENT.md` est maintenant validé** — les 8
questions de son §10 ont toutes une réponse d'Adrien, consignées
directement dans le document (statut mis à jour en tête de fichier).
Résumé des décisions :

1. Parts cibles des 7 activités : gardées telles quelles (30/12/14/12/12/12/8 %).
2. Le maire : contribution gratuite + recommandation affichée (pas de vote des habitants).
3. Mégaprojets : confirmé tel que décrit au §6 (choix du maire parmi 3, financement collectif).
4. **Nouveau stade "Mégapole" à 250 000 habitants**, au-delà de Métropole — à ajouter dans `population_vers_niveau()` (`>= 250000` → niveau 6), voir `SYSTEME-DEVELOPPEMENT.md` §6 pour le tableau des mégaprojets mis à jour. Ses mégaprojets propres restent à définir (peuvent reprendre des variantes en attendant). Répond aussi à `DECISIONS.md` §10 point 20.
5. Lien ressources nationales/pays : repoussé au chantier "ressources nationales et guerre" (`DECISIONS.md` §10 point 27), pas encore abordé — ne bloque pas ce système.
6. AntiVille : paliers **et** solidarité gardés tous les deux (voir `SYSTEME-DEVELOPPEMENT.md` §6 bis).
7. Logements vides : même rythme qu'une construction neuve (+1/visite), pas de bonus de vitesse.
8. Seuils de déblocage des activités par taille : confirmés tels que proposés au §3 bis.

**Peut être codé** en suivant le découpage en jalons déjà proposé au §9
de `SYSTEME-DEVELOPPEMENT.md` (1. choix d'activité à la visite + jauges,
2. effets d'équilibre + manifestations + lien AntiVille, 3. quartiers/
bâtiments par activité, 4. mégaprojets + technologies). Ce document
répond aussi à `DECISIONS.md` §10 points 16 et 22 ("Revoir les règles du
jeu") — plus la peine d'attendre pour ces deux points.

**Reste un point ouvert, sans lien avec ce système** : le §10 point 23
(titre de gouverneur de région) et point 24 (régions réelles pour
d'autres pays) restent à trancher séparément par Adrien, non couverts
par cette validation.

## 19. Monuments d'influence : bâtiments spéciaux débloqués par paliers (décision d'Adrien, 27/09/2026)

**Demande d'Adrien** : prévoir des bâtiments spéciaux (statues,
monuments, ou autre) débloqués régulièrement par paliers — il avait en
tête des paliers du type 10, 25, 50, 100, 250… jusqu'à un million.
Clarifié en échange avec Claude chat : la métrique concernée est
**l'influence** de la ville (pas la population, ni un "affluence" qui
n'existe pas encore dans le jeu).

**Pourquoi un nouveau champ `influence_max`** : `cities.influence`
(entier, jamais négatif) peut **baisser** — la Propagande (AntiVille)
lui retire des points, et le §6 bis de `SYSTEME-DEVELOPPEMENT.md` ajoute
d'autres effets qui la font varier. Pour des monuments qui ne
disparaissent jamais une fois débloqués (même principe que
`population_max` : « la ville reste dessinée à son record »), il faut
un **record historique**, pas la valeur courante. Ajouter
`cities.influence_max` (jamais décroissant, mis à jour partout où
`influence` change), et débloquer les monuments sur `influence_max`,
pas sur `influence`.

**Paliers proposés** (16 paliers, même logique ×2 / ×2,5 que les
exemples d'Adrien, prolongée jusqu'à un million) :

10 · 25 · 50 · 100 · 250 · 500 · 1 000 · 2 500 · 5 000 · 10 000 ·
25 000 · 50 000 · 100 000 · 250 000 · 500 000 · 1 000 000

Chiffres exacts à ajuster avec les villes de test, comme d'habitude —
Claude Code peut resserrer ou espacer les premiers paliers si 10/25/50
s'avèrent trop rapides ou trop lents à l'usage.

**Suggestions de bâtiments par palier** (à ajuster librement, l'idée
est la progression, pas la liste figée) :

| Palier | Monument |
|---|---|
| 10 | Borne commémorative |
| 25 | Banc public gravé |
| 50 | Fontaine simple |
| 100 | Buste / petite statue |
| 250 | Obélisque |
| 500 | Arc de triomphe miniature |
| 1 000 | Horloge municipale |
| 2 500 | Fontaine monumentale (place) |
| 5 000 | Statue équestre |
| 10 000 | Mur des remerciements (liste des plus généreux, lien avec le palmarès Jalon 8bis) |
| 25 000 | Arche monumentale |
| 50 000 | Tour-observatoire |
| 100 000 | Statue emblématique, unique par ville (générée proceduralement comme les bâtiments) |
| 250 000 | Temple / monument national |
| 500 000 | Statue géante, silhouette visible de loin dans la ville en 3D |
| 1 000 000 | Monument ultime — piste pour plus tard : inscription personnalisable par le joueur |

**Principes** :
- **Purement cosmétique/prestige**, comme les packs de thèmes
  (`BATIMENTS-ET-PACKS.md` §4) — pas de bonus de gameplay pour rester
  cohérent avec l'esprit "pas de pay to win", même si ici rien ne
  s'achète. Exception possible plus tard : un lien avec les "avantages
  nationaux" du cahier des charges §13 une fois ce système construit
  (`DECISIONS.md` §10 point 31), mais pas maintenant.
- **Jamais retiré** une fois débloqué, même si l'influence courante
  rebaisse ensuite (voir `influence_max` ci-dessus) — cohérent avec la
  règle "jamais de destruction permanente d'une ville".
- **Nouvelle famille de bâtiment** dans le catalogue prévu par
  `BATIMENTS-ET-PACKS.md` §2 : `monument`, distincte de `mégaprojet`
  (les mégaprojets sont choisis par le maire et financés collectivement
  selon le stade de population — Jalon 20 à venir — alors que les
  monuments d'influence se débloquent **automatiquement**, sans choix
  ni financement, dès que le record d'influence franchit le palier).
- Emplacement suggéré : près du croisement central de la ville (zone
  symbolique), pas mêlé aux blocs résidentiels/quartiers ordinaires.

**Cette demande répond aussi à un autre point d'Adrien** : les
"magasins et parcs selon comment la ville se développe" sont **déjà
prévus**, pas besoin d'un ajout séparé — c'est exactement ce que décrit
`SYSTEME-DEVELOPPEMENT.md` §7 ("Ce qu'on voit dans la ville") avec les
blocs Commerce et Loisirs par activité, prévu pour le Jalon 19
("quartiers et bâtiments"), pas encore fait.

**Où caser ça dans les jalons** : peut s'ajouter au Jalon 20 (mégaprojets
et technologies, à venir) plutôt qu'un jalon séparé, puisque les deux
sont des "bâtiments spéciaux au-delà des quartiers ordinaires" — à
la discrétion de Claude Code.

## 20. Retours de test sur le Jalon 19 : détail visuel et choix d'activité définitif (Adrien, 27/09/2026)

Deux retours après avoir testé le système de développement en ligne.

### A. Éoliennes et usines : bien moins développées que les bâtiments actuels

**Constat d'Adrien**, confirmé en lisant le code : `buildEolienne()`
(`src/lib/ville3d/energie.ts`) est un mât + une nacelle + 3 pales, et
`buildIndustrie()` (`src/lib/ville3d/quartiers.ts`) est une boîte avec
un silo optionnel — très en retrait par rapport aux maisons/immeubles/
tours de `batiments.ts` (plusieurs modèles, variantes de toits,
fenêtres, balcons, couleurs).

**Ce n'est pas un oubli, c'est un compromis déjà signalé par Claude
Code lui-même** : le journal du Jalon 19 (`DECISIONS.md` §4) note
explicitement une "portée réduite assumée" — deux étapes par vocation
de quartier (simple/développée) au lieu des 3-4 étapes décrites par
`SYSTEME-DEVELOPPEMENT.md` §7, pour livrer les 6 vocations dans un
temps raisonnable plutôt que 2-3 vocations très détaillées. Le
document demandait déjà d'y revenir : « À valider par Adrien : garder
ces deux étapes, ou demander d'aller vers 3-4 étapes par vocation dans
un futur passage. »

**Réponse d'Adrien, via ce retour de test** : non, le niveau de détail
actuel n'est pas suffisant, en particulier pour l'Énergie (éoliennes)
et l'Industrie (usines). **À reprendre** pour se rapprocher du niveau
de variété déjà atteint sur les maisons (plusieurs modèles/variantes,
pas juste une géométrie paramétrée en plus grand) :
- 🏭 Industrie : plus d'étapes (les 3-4 du document — entrepôt/atelier,
  puis usine et cheminées, puis grand complexe), plusieurs variantes de
  bâtiment par étape comme pour les maisons ;
- ⚡ Énergie : éoliennes avec plus de variété (hauteur, nombre de pales
  déjà variable mais modèle unique) et surtout **plus de présence
  visuelle** — silhouette plus travaillée, pas juste mât+nacelle+pales
  minimalistes ;
- même logique à vérifier pour Commerce, Services et Recherche
  (`buildCommerce`, `buildServices`, `buildRecherche`, présentes dans
  `quartiers.ts`), qui partagent le même compromis "2 étapes" que
  l'Industrie.

Chiffres/détails exacts (nombre de modèles par étape, nombre d'étapes)
laissés à Claude Code comme d'habitude, mais la direction est claire :
**rapprocher du niveau de finition des maisons**, quitte à prendre plus
de temps que prévu au Jalon 19.

### B. Le choix d'activité doit être définitif, pas modifiable

**Règle voulue par Adrien** : une fois l'activité choisie pour une
visite, impossible d'en choisir une autre — le choix est **validé**
immédiatement, exactement comme la visite elle-même (population
comprise), et rapporte 1 point dans l'activité choisie.

**Écart avec l'implémentation actuelle** (`choisir_activite_visite()`,
migration `0023`) : la fonction accepte d'être rappelée **plusieurs
fois** dans sa fenêtre de grâce de 5 minutes, et écrase à chaque fois
l'activité de la visite la plus récente — rien n'empêche aujourd'hui un
joueur de changer d'avis deux, trois fois de suite avant que les 5
minutes ne s'écoulent. L'intention initiale du document (remplacer
UNE FOIS l'activité tirée au sort) est correcte, mais pas appliquée
strictement dans le code.

**À corriger** : une fois qu'un choix explicite a été enregistré pour
une visite (que ce soit pour remplacer le tirage au sort ou un premier
choix), un second appel à `choisir_activite_visite()` sur la même
visite doit être refusé (nouveau code d'erreur, suite du registre
`P0021`/`P0022` de la migration `0023`). Nécessite de distinguer
"activité tirée au sort" de "activité choisie par le joueur" — par
exemple une colonne `visites.activite_verrouillee boolean default
false`, mise à `true` dès qu'un choix explicite réussit, et vérifiée en
tout début de la fonction (erreur si déjà vraie).

**Ce qui ne change pas** : la fenêtre de grâce de 5 minutes reste utile
pour laisser le temps au joueur de voir la visite automatique se
déclencher puis de choisir — seul le fait de pouvoir *changer* un choix
déjà fait doit disparaître.

---

## 21. Affichage des jauges d'activité : niveaux plutôt que pourcentages (précision d'Adrien, 27/09/2026)

**Demande initiale d'Adrien** : « pour les activités je pense au lieu
de mettre des pourcentages mettre des niveaux, et chaque niveau
débloquerait de nouvelles choses ».

**Clarification demandée et réponse d'Adrien** : la jauge en % de
chaque activité sert aujourd'hui au système d'équilibre du Jalon 18
(part reçue vs part cible, demi-vie ~3 semaines, seuils 60 % / 90 % /
120 % pour Crise / Fragile / Équilibré / Point fort, bonus/malus,
manifestations, protection AntiVille liée à l'équilibre) — un système
qui peut redescendre si une activité est délaissée. Remplacer ça par
des niveaux qui débloquent des choses (donc qui ne redescendent
jamais) aurait touché cette mécanique déjà livrée. Adrien a confirmé
vouloir l'option la plus légère : **« c'est très bien comme ça, ça ne
change rien »** — c'est-à-dire changer uniquement l'affichage, pas le
calcul.

**Ce qui ne change pas** : le calcul de la jauge (part reçue vs part
cible), la demi-vie, les seuils 60/90/120 %, les effets bonus/malus/
crise/manifestation du Jalon 18, et le fait que la jauge peut
redescendre. Rien de tout cela ne bouge. Il n'y a **aucun nouveau
palier de déblocage** lié à ce chiffre (contrairement à l'idée
initiale de "débloquer de nouvelles choses" par niveau — cette partie
de l'idée n'est pas retenue ici ; voir §19 "Monuments d'influence" pour
un système de paliers de déblocage, mais basé sur l'influence, pas sur
les jauges d'activité).

**Ce qui change** : uniquement l'affichage donné au joueur. Au lieu
d'un pourcentage brut ("58 %"), montrer quelque chose de plus lisible,
calculé à partir de la même valeur — par exemple les 4 états déjà
nommés (Crise / Fragile / Équilibré / Point fort) présentés comme le
"niveau" de l'activité, avec une barre/jauge visuelle qui se remplit
selon la valeur plutôt qu'un simple nombre. Le pourcentage exact peut
rester disponible en info secondaire (tooltip, détail au clic) pour les
joueurs qui veulent le chiffre précis.

**Implémentation suggérée** (libre à Claude Code d'ajuster côté UI) :
- Continuer à calculer et stocker la jauge en % exactement comme
  aujourd'hui (Jalon 18, aucune migration nécessaire).
- Côté affichage uniquement, dériver un libellé/niveau de cette valeur
  (les 4 états existants suffisent, pas besoin d'inventer une nouvelle
  échelle numérotée séparée) et l'afficher avec une barre de
  progression plutôt qu'un pourcentage nu.
- Aucun changement de base de données, aucune nouvelle migration.

**Portée** : pur affichage front-end. N'affecte ni `DECISIONS.md`
(pas de nouveau point ouvert nécessaire, cette précision referme la
question sans créer de point ouvert), ni `ROADMAP.md`.

---

---

## 22. Bug de rendu sur le showroom de la bibliothèque de bâtiments (30/09/2026)

**Contexte** : chantier en cours (pas encore un jalon numéroté),
documenté dans `docs/recette-bibliotheque-batiments-1.md` — 12 nouveaux
modèles (6 maisons, 4 immeubles... la recette parle de 7 immeubles
selon la capture d'écran d'Adrien, à vérifier), testables sur
`/dev/showroom`.

**Ce qu'Adrien a d'abord signalé** : « j'ai les mêmes soucis que la
dernière fois avec les nouveaux bâtiments créés », compris au départ
comme un problème de richesse visuelle (comme pour les éoliennes/usines
en §20 A). **Après capture d'écran du showroom, ce n'est pas ça** :
Adrien précise « je ne vois pas vraiment le rendu en fait ».

**Ce que montre la capture d'écran** : sur `/dev/showroom`, la plupart
des vignettes n'affichent pas de bâtiment reconnaissable —
`maison-pavillon`, `maison-chalet` et `maison-toit-plat` sont des
rectangles blancs vides ; les autres (`maison-longere`, `maison-ville`,
`maison-veranda`, `maison-mitoyenne`, `maison-mediterraneenne`,
`maison-fermette`, et plusieurs immeubles) n'affichent qu'un minuscule
fragment triangulaire (un bout de toit ?) dans un coin, sur fond bleu
ciel uni — pas de bâtiment entier visible. Aucun message d'erreur
visible dans l'interface.

**Cause probable, identifiée en lisant le code** (`src/app/dev/showroom/ShowroomClient.tsx`) :
ce composant crée **un `THREE.WebGLRenderer` distinct par vignette**
(un par modèle affiché : 6 + 7 + 2 = 15 vignettes actuellement, chacune
avec son propre canvas et son propre contexte WebGL). C'est très
différent de la vraie scène du jeu (`src/lib/ville3d/scene.ts`), qui
n'utilise qu'**un seul** `WebGLRenderer` pour toute la ville. Les
navigateurs limitent le nombre de contextes WebGL actifs simultanément
sur une page (souvent une quinzaine, parfois moins selon le
matériel/les extensions) ; au-delà, les contextes en trop peuvent être
silencieusement refusés ou perdus ("context lost"), ce qui donnerait
exactement ce qu'on voit : certaines vignettes jamais rendues (blanc),
d'autres perdues en cours de rendu (fragment seulement). Le code actuel
ne gère ni les échecs de création de contexte ni l'événement
`webglcontextlost` — rien ne s'affiche à la place d'une erreur.

**À vérifier/corriger par Claude Code** :
1. Confirmer la cause (regarder la console du navigateur pour des
   messages du type "too many active WebGL contexts" ou
   `webglcontextlost`, ou réduire temporairement le nombre de vignettes
   affichées en même temps pour voir si ça corrige le problème).
2. Corriger l'architecture du showroom pour éviter d'ouvrir 15 contextes
   WebGL en parallèle — par exemple un seul renderer partagé entre
   toutes les vignettes (une scène/caméra par vignette mais un seul
   `WebGLRenderer.setViewport()` réutilisé), ou ne monter/rendre que les
   vignettes visibles à l'écran (`IntersectionObserver`), ou au minimum
   gérer proprement l'échec de création/la perte de contexte avec un
   message visible plutôt qu'un rendu blanc silencieux.
3. Vérifier ensuite si le problème est bien limité au showroom (outil
   de dev) ou si les mêmes bâtiments s'affichent correctement dans une
   vraie ville sur `/ville` ou `/villes` (qui utilisent le renderer
   unique de `scene.ts`) — si oui, la richesse visuelle des modèles
   eux-mêmes n'a pas encore pu être jugée par Adrien, il faudra
   redemander son avis une fois le showroom réparé.

**Traité le 02/10/2026 (Claude Code)** : cause confirmée en deux temps.
(1) Un `WebGLRenderer` par vignette (15+ contextes) : remplacé par UN
seul renderer partagé, chaque modèle rendu à tour de rôle puis recopié
dans un canvas 2D (`src/app/dev/showroom/ShowroomClient.tsx`). (2) Une
fois toutes les vignettes affichées, il restait des fragments : le
matériau du showroom était à une seule face alors que la géométrie du
jeu a des toits/sols enroulés vers le bas (la vraie scène utilise
`DoubleSide`, `scene.ts`) — corrigé. Les tours sont désormais montrées
terminées (pas en chantier) et un curseur de rotation (outil de maquette
uniquement) a été ajouté. Le rendu dans une vraie ville (`/ville`,
`/villes`, accueil) n'était pas touché : vérifié correct plus tôt.
Le showroom a aussi révélé un vrai défaut : un trou dans le toit de
`immeuble-haussmannien` (dessus de la façade non fermé), corrigé.
Rendu simplifié : pas de textures de fenêtres dans le showroom, donc
les façades y paraissent unies — normal, ce n'est pas la scène du jeu.

---

## 23. Refonte de l'onglet Pays : retirer la carte, ajouter un statut diplomatique + un historique hebdomadaire (demande d'Adrien, 02/10/2026)

**Demande d'Adrien** : il n'aime pas l'onglet/page Pays telle qu'elle
est aujourd'hui. Il pense que la carte du pays (Jalon 9 ter) n'est pas
nécessaire. Il propose à la place un affichage plus simple : le pays,
son statut de la semaine (en guerre / coalition [alliance] / paix), et
un historique semaine par semaine.

**Écart avec une décision précédente** : la carte du pays était une
demande d'Adrien lui-même (Jalon 9 ter, 25/09/2026, remplaçant le fond
3D de la page). Elle a aussi des limites déjà connues et jamais
corrigées (`DECISIONS.md` §10 point 28 : pas de scintillement nocturne,
pas de repères de jumelage, pas de clic sur une région, canvas 3D qui
continue de tourner invisible derrière). Adrien revient sur ce choix
après usage — assumé, même mécanique que la croissance rapide annulée
au §17.

**Proposition retenue (confirmée par Adrien)** :

1. Retirer la carte (`<CartePays>`) de la page `/pays`. Le canvas 3D
   qui tournait dessous (gaspillage CPU/GPU du point 28) disparaît avec
   elle.
2. À la place, en haut de page : le nom/drapeau du pays, et son statut
   de la semaine en cours — un badge clair parmi : en paix (rien
   d'adopté cette semaine), en guerre (rivalité adoptée + conflit en
   cours), ou allié (alliance adoptée cette semaine) — à partir des
   données déjà calculées (`resultatDecision`, `conflit`).
3. Un historique hebdomadaire, semaine par semaine, le plus récent en
   premier, contenant pour chaque semaine passée : la décision
   diplomatique adoptée (et contre quel pays si rivalité), la
   catégorie de ressource qui a gagné le vote cette semaine-là, et le
   résultat du conflit si une rivalité a eu lieu cette semaine-là
   (victoire/défaite/égalité, pertes de population subies par chaque
   camp). **Confirmé par Adrien** : l'historique doit tout contenir
   (diplomatie + vote + conflit), pas seulement le statut diplomatique.

**Ce qui ne change pas** : les sections déjà existantes de `/pays` non
visées par la demande (villes principales, vote hebdomadaire en cours,
détail du conflit en cours, ressources accumulées, historique des
présidents) restent en l'état — seule la carte part, et l'historique
hebdomadaire est une vraie nouveauté à construire (rien de tel
n'existe aujourd'hui : seul l'historique des mandats présidentiels est
conservé).

**Donnée à prévoir** : rien aujourd'hui ne conserve un instantané par
semaine (le vote et les décisions diplomatiques sont recalculés à la
volée depuis `votes_pays`/`votes_diplomatie`/`conflits`, sans table de
synthèse hebdomadaire) — une nouvelle table (type
`historique_pays_semaine` : pays, semaine, catégorie gagnante du vote,
décision diplomatique adoptée, pays cible éventuel, résultat du
conflit éventuel) est probablement nécessaire, à moins que Claude Code
trouve plus simple de recalculer l'historique à la demande à partir
des tables existantes (semaine par semaine, en remontant dans le
temps) — à évaluer selon le volume de données déjà accumulé.

**Traité le 02/10/2026 (Claude Code)** : retrait de la carte, statut de
la semaine et historique hebdomadaire faits (migration `0036`, pas de
table de synthèse, calcul à la demande) — détail et interprétations à
contester dans `DECISIONS.md` §4 "Refonte de l'onglet Pays". En attente
d'application de la migration par Adrien.

---

## 24. Équilibrer les guerres entre pays : effort national à la moyenne par ville, pas à la somme (demande d'Adrien, 02/10/2026)

**Constat (Claude chat, en lisant `supabase/migrations/0017` et `0032`)** :
`effort_national(p_country_id)` additionne aujourd'hui l'activité 7
jours (`activite_7j_de`) de **toutes** les villes du pays, plus
`floor(sqrt(somme des ressources nationales))`. C'est une SOMME, pas
une moyenne — documentée comme un choix assumé mais "contestable" dans
la migration 0017 elle-même ("un pays plus grand ou plus actif produit
naturellement plus d'effort"). Conséquence concrète : un pays de 50
villes écrase mécaniquement un pays de 2 villes dans
`resoudre_conflits_en_cours()` (comparaison quotidienne
`effort_attaquant > floor(effort_defenseur * 1.5)`), même si les 2
villes du petit pays sont individuellement bien plus actives — le bonus
défensif de +50 % ne corrige en rien un tel écart de taille.

**Demande d'Adrien** : prendre en compte le nombre de joueurs par pays
dans le mécanisme de guerre, pour éviter des guerres déséquilibrées.
Après explication du problème exact, Adrien choisit l'option la plus
radicale : **une vraie moyenne par ville**, pour une équité totale —
la taille du pays ne doit plus donner aucun avantage mécanique en
guerre, seule l'implication réelle des joueurs doit compter.

**Changement demandé dans `effort_national()`** : remplacer la somme
d'activité par la **moyenne** d'activité par ville du pays
(`sum(activite_7j_de) / nombre de villes du pays`), et calculer le
terme ressources de la même façon **par habitant** plutôt que sur le
total du pays (`floor(sqrt(somme des ressources / nombre de villes))`,
au lieu de `floor(sqrt(somme des ressources))` sur le total) — pour
rester cohérent avec le choix de la moyenne sur les deux composantes de
la formule, pas seulement sur l'activité. Prévoir le cas d'un pays sans
aucune ville (division par zéro → effort 0, comme le `coalesce(...,
0)` déjà en place).

**Ce qui ne change pas** : le reste du mécanisme de guerre (bonus
défensif ×1,5, perte de population quotidienne de 0,1 % plafonnée à
5 % par ville sur 7 jours, paliers visibles `palierGuerre()`, Jalon 21)
n'est pas remis en cause — seule l'agrégation par pays dans
`effort_national()` change. Comme cette fonction est aussi utilisée
pour afficher l'état d'un conflit en cours sur `/pays`
(`conflit.effort_attaquant`/`effort_defenseur`), les chiffres affichés
changeront d'échelle (des moyennes, pas des totaux) — à adapter dans
l'affichage si besoin (ex. libellé "effort moyen par ville" plutôt que
"effort").

**Option écartée par Adrien** : atténuer l'avantage de taille sans
l'annuler (diviser par la racine carrée du nombre de villes plutôt que
par le nombre de villes lui-même) — gardée en mémoire si jamais la
moyenne pure s'avère trop punitive pour les grands pays une fois testée
avec les villes de test.

**Traité le 02/10/2026 (Claude Code)** : `effort_national()` passe à la
moyenne par ville (migration `0037`), efforts décimaux, libellés
« effort moyen par ville » sur `/pays` — détail et choix laissés à Claude
Code dans `DECISIONS.md` §4 "Guerres équilibrées". En attente
d'application de la migration par Adrien.

---

## 25. Zones dans la ville (gratte-ciels au centre, maisons en périphérie) + repérer les bâtiments débloqués (demande d'Adrien, 02/10/2026)

**Constat d'Adrien, vérifié dans le code** : « dans les villes, il
faudrait faire des zones, gratte-ciels, maison, commerce, énergie...
tout est mélangé actuellement, d'ailleurs je ne vois pas les bâtiments
pour chaque ».

Deux causes distinctes identifiées en lisant `supabase/migrations/0026`
et `src/lib/ville3d/generer.ts`/`terrain.ts` :

1. **Les blocs ne sont pas zonés.** La position de chaque bloc
   (distance au centre) est fixée uniquement par `planifierBlocs()`
   (ordre par distance au croisement central + un petit aléa propre à
   chaque bloc), AVANT même de savoir quelle vocation il aura. La
   vocation (résidentiel/industrie/commerce/loisirs/services/recherche)
   est ensuite attribuée bloc par bloc selon l'activité la plus en
   retard à cet instant (`assigner_vocations_blocs()`) — un calcul qui
   ne regarde jamais où est le bloc dans la ville. Résultat : un bloc
   commerce peut tout à fait se retrouver au rang 2 (très central) et
   un bloc résidentiel au rang 40 (en périphérie), sans aucune logique
   de zone.
2. **L'Énergie, les mégaprojets et les monuments d'influence ne sont
   même pas dans un bloc.** Ils sont placés dans la campagne, à un
   ANGLE ALÉATOIRE autour de la ville et à une distance qui peut aller
   jusqu'à 1500 unités pour l'Énergie (plus loin encore pour les
   mégaprojets/monuments aux paliers élevés) — explique directement
   pourquoi Adrien ne les voit pas en jouant : il faudrait tourner la
   caméra dans la bonne direction et dézoomer suffisamment, au hasard,
   pour tomber dessus.

**Ce qu'Adrien veut pour les zones** (après clarification) : les gros
bâtiments / gratte-ciels au centre-ville, et à mesure que des
gratte-ciels se construisent, les maisons doivent être repoussées vers
l'extérieur — un vrai gradient de densité du centre vers la périphérie,
pas un mélange.

**Point utile découvert en lisant le code** : une partie de cette idée
existe déjà partiellement dans le moteur — `towerAtK(k)`
(`constantes.ts`) fait déjà dépendre le seuil de population à partir
duquel un bloc résidentiel passe en gratte-ciel du rang `k` du bloc
(plus le rang est petit/central, plus tôt la tour apparaît). Le
problème n'est donc pas l'absence totale de logique centre/périphérie
pour les tours, mais que :
- cette logique ne s'applique qu'aux blocs **résidentiels**, et les
  blocs résidentiels ne sont pas forcément les plus centraux (point 1
  ci-dessus) ;
- rien ne "repousse" jamais un bâtiment résidentiel déjà construit —
  un bloc en périphérie qui devient résidentiel finira lui aussi par
  recevoir une tour si la ville grandit assez, ce qui contredit l'idée
  de garder les maisons en périphérie durablement.

**Proposition pour Claude Code** (idée générale validée par Adrien,
détail d'implémentation à sa main) :
1. Réorganiser l'attribution des blocs pour que les rangs les plus
   centraux soient réservés en priorité aux blocs résidentiels à forte
   densité (gratte-ciels), un anneau intermédiaire pour les autres
   vocations (commerce, industrie, services, loisirs, recherche), et
   les rangs les plus externes pour les maisons (résidentiel à faible
   densité) — plutôt que l'ordre purement géométrique actuel (distance
   au centre + aléa) qui ignore la vocation.
2. Garder la logique "résidentiel ≥ moitié des blocs" et "activité la
   plus en retard" pour décider QUELLE vocation ouvrir ensuite (ça
   marche bien, pas besoin d'y toucher) ; changer seulement OÙ ce
   nouveau bloc est placé pour respecter le gradient centre →
   périphérie plutôt que le rang géométrique brut.
3. Un bloc déjà ouvert ne change jamais de vocation ni de position
   (règle existante, à garder) — le "repoussement" des maisons se fait
   donc en choisissant mieux la position des FUTURS blocs résidentiels
   (toujours plus loin que les blocs à tours), jamais en déplaçant des
   maisons déjà construites.
4. Portée : seuls les blocs ouverts à partir de maintenant suivent la
   nouvelle règle de zonage — les villes déjà construites (villes de
   test notamment) ne sont pas rétroactivement réorganisées, pour
   respecter "un bloc une fois ouvert n'est jamais déplacé".
5. Énergie, mégaprojets et monuments : pas de retour sur le choix "hors
   de la ville" déjà validé — mais leur emplacement devrait devenir
   plus prévisible (un secteur/angle plus restreint plutôt
   qu'entièrement aléatoire sur 360°) pour qu'ils soient plus faciles à
   repérer, en complément du point suivant.

**Nouvelle fonctionnalité demandée sur `/ville`** : « voir ce qu'on a
débloqué et ce qu'il reste à débloquer, et quand on clique sur un
bâtiment débloqué on voit où il est ».
- Aujourd'hui, seul le panneau Monuments (`src/components/Monuments.tsx`)
  va dans ce sens, et il est incomplet : il liste seulement les
  monuments déjà débloqués plus le tout prochain, pas le catalogue
  complet des 16 paliers avec leur état (débloqué / à débloquer) —
  contrairement à ce que demande Adrien.
- À construire : un vrai panneau catalogue sur `/ville`, qui montre
  TOUS les paliers de monuments d'influence (les 16, voir
  `src/lib/game/monuments.ts`), chacun marqué débloqué ou verrouillé
  (avec son seuil si verrouillé) — et, pour chaque monument débloqué,
  un bouton/action "voir où il est" qui amène la caméra 3D dessus (ou
  au minimum un repère visuel surligné/clignotant) plutôt que de
  laisser le joueur chercher au hasard dans la campagne.
- À étendre, si Adrien le souhaite plus tard, au même traitement pour
  les mégaprojets (déjà un catalogue fini par palier de population,
  `SYSTEME-DEVELOPPEMENT.md` §6) et les technologies (paliers de points
  de Recherche) — pas demandé explicitement cette fois, mais la même
  logique s'appliquerait.

**Risque technique à surveiller** (pour Claude Code) : le "voir où il
est" demande de piloter la caméra 3D depuis un clic dans un panneau 2D
à côté — un nouveau type d'interaction (aujourd'hui la caméra ne
semble pilotée que par les gestes souris/doigt sur la scène
elle-même). Une version plus simple pourrait démarrer par un indicateur
visuel (surlignage/clignotement) placé sur le bâtiment visé sans
bouger la caméra, à faire évoluer vers un vrai "aller à" ensuite si
besoin.

**Sous-jalon 25b traité le 02/10/2026 (Claude Code)** : zonage « par
secteur » choisi par Adrien (cœur résidentiel de 5 blocs, un secteur
d'angle par activité, migration `0038`, blocs existants non déplacés,
pas de gratte-ciel au-delà de la 24ᵉ case pour les blocs zonés) — détail
dans `DECISIONS.md` §4 « Zonage des quartiers ». **Le §25 est donc traité
en entier** (25a + 25b), sauf l'extension facultative du « voir où il
est » aux mégaprojets, technologies et Énergie.

**Sous-jalon 25a traité le 02/10/2026 (Claude Code) — sous-jalon 25a**
(découpage choisi avec Adrien : visibilité d'abord, zonage ensuite) :
catalogue des 16 monuments sur `/ville` et `/villes`, bouton « Voir où
il est » (caméra + repère lumineux, ni migration ni dépense) et secteurs
fixes hors de la ville pour Énergie / mégaprojets / monuments (point 5).
Détail, défauts trouvés en chemin (dont des monuments qui étaient à
l'intérieur de la ville) et choix dans `DECISIONS.md` §4. **Reste à
faire (25b) : le zonage des blocs (points 1 à 4), à décider avec
Adrien avant de coder** — il touche `assigner_vocations_blocs()` et
l'ordre d'ouverture, donc probablement une migration. Extension du
« voir où il est » aux mégaprojets/technologies/Énergie : non demandée
pour l'instant.

---

## 26. Propositions d'amélioration de Claude chat, toutes validées par Adrien (02/10/2026)

Adrien a demandé des pistes d'amélioration. Six propositions ont été
faites (trois reprennent des sections du cahier des charges jamais
construites, une reprend une ambition déjà notée dans `ROADMAP.md`,
deux sont des idées nouvelles de Claude chat) — **toutes validées par
Adrien** (« ajoute tout ça »), mais non priorisées entre elles : à
Adrien/Claude Code de choisir l'ordre.

### A. Journal mondial (cahier des charges §22)

Un fil qui recense les événements importants à l'échelle du jeu entier
(pas une seule ville) : nouveaux présidents, guerres déclenchées/
terminées, alliances adoptées, technologies débloquées, grands
changements de classement. Le bulletin municipal (`BulletinMunicipal.tsx`,
déjà construit) fait l'équivalent à l'échelle d'UNE ville ; le journal
mondial est la même idée à l'échelle du jeu — probablement une nouvelle
page ou une nouvelle section d'accueil, alimentée par les mêmes types
d'événements déjà trackés (`city_events`, conflits, votes, mandats)
mais agrégés tous pays confondus plutôt que filtrés par ville.

### B. Notifications de rivalité (cahier des charges §23)

Le cahier des charges donne des exemples précis de notifications
attendues : « tu viens de perdre ta place #1 », « tu es maintenant
président », « ton pays entre en rivalité avec l'Allemagne », « ton
pays vient de débloquer une technologie », « ton pays est en train de
perdre la guerre », « ton rival vient de te dépasser ». Toutes ces
situations sont déjà détectables côté serveur (classements, mandats,
conflits, technologies) — le travail est de les transformer en
notifications poussées vers le joueur plutôt que des informations qu'il
ne voit que s'il va consulter la bonne page. Prévoir au minimum un
centre de notifications in-app (liste consultable) ; les notifications
push navigateur (le service worker du Jalon 15 existe déjà, PWA
installable) sont une suite naturelle mais un chantier à part (gestion
des permissions, abonnement, backend d'envoi) — à ne pas sous-estimer
niveau effort.

### C. Page de ville partageable / viralité (cahier des charges §24)

Chaque ville doit avoir une page partageable publiquement, sans
connexion (lecture seule) : « le joueur doit pouvoir partager des
événements : passage #1, accession à la présidence, victoire
internationale, appel à la mobilisation, etc. » Les liens de partage
doivent renvoyer directement vers la ville ou l'événement concerné.
Techniquement, c'est en grande partie une page de lecture des données
déjà publiques (`cities_lecture_publique` et consorts existent déjà en
RLS) — le travail principal est l'habillage (une page présentable même
pour quelqu'un qui n'a jamais ouvert le jeu) et la génération de liens
ciblés vers un événement précis plutôt que juste la ville en général.
Prérequis naturel pour D (Amis et suivi).

**Traité le 02/10/2026 (Claude Code), troisième des six chantiers du
§26** : page publique `/v/<id>` en lecture seule (3D, maire, rang,
réussites), lien vers un événement précis, boutons de partage, sans
migration — détail dans `DECISIONS.md` §4 « Page publique d'une ville ».
Les événements « passage n°1 » / « présidence » du cahier des charges ne
sont pas encore enregistrés comme événements (cf. A, journal mondial).

### D. Amis et suivi (cahier des charges §25)

« Les joueurs peuvent suivre leurs amis, consulter leurs villes et voir
leurs classements. Les relations sociales doivent rester simples. »
Une liste de villes suivies par joueur (table simple, pas de système
d'amitié réciproque à construire si le cahier ne le demande pas
explicitement — à confirmer au moment de spécifier ce jalon), avec un
accès rapide depuis cette liste plutôt que de chercher dans `/villes`.
S'appuie naturellement sur C (une ville suivie s'afficherait un peu
comme sa page partageable, mais pour un joueur connecté).

### E. Découverte des petites villes neuves sur `/villes`

Idée de Claude chat, pas dans le cahier des charges : `/villes` est
trié par population décroissante depuis le Jalon 2 (choix d'Adrien à
l'époque, plutôt qu'un bouton "ville au hasard") — une ville neuve est
donc systématiquement en bas de liste, quasiment invisible, ce qui
rend plus difficile pour elle de recevoir ses premières visites (le
problème concret vécu par Adrien lui-même en tout début de test : « 1
habitant depuis plusieurs jours »). Proposition : ajouter un moyen de
remettre en avant les villes qui ont besoin de visites — par exemple un
tri alternatif "villes récentes" ou "villes peu visitées récemment", ou
une petite sélection mise en avant quelque part sur `/villes` ou
l'accueil. Détail exact (quel tri, où l'afficher) à spécifier avec
Adrien quand ce chantier est pris.

**Traité le 02/10/2026 (Claude Code), premier des six chantiers du §26
choisi par Adrien** : sélecteur de tri sur `/villes` (récentes, « qui
attendent des visites » sur 7 jours), migration `0040` — détail dans
`DECISIONS.md` §4 « Découverte des petites villes neuves ». Pas de mise en
avant hors de `/villes` pour l'instant.

### F. Parcours de découverte pour les nouveaux joueurs

Idée de Claude chat, pas dans le cahier des charges : avec 7 activités,
des jauges, des monuments, des mégaprojets, la guerre, etc. déjà
construits, un nouveau joueur arrive aujourd'hui sans aucun guide
progressif. Proposition : un petit parcours de découverte au tout
début (quelques indications contextuelles plutôt qu'un mur de règles
d'un coup) pour réduire le risque d'abandon avant que la boucle de jeu
soit comprise. Portée exacte (combien d'étapes, quels écrans couvrir)
à spécifier avec Adrien quand ce chantier est pris.

**Traité le 02/10/2026 (Claude Code), deuxième des six chantiers du
§26** : guide de démarrage en 5 étapes (carte non bloquante, comptes de
moins de 14 jours, mémoire locale, « Revoir le guide » sur `/regles`),
sans migration — détail et choix dans `DECISIONS.md` §4 « Parcours de
découverte des nouveaux joueurs ».

---

## 27. Plafond de visites à 8, feedback de visite + choix immédiat, bouton règles du jeu (demande d'Adrien, 02/10/2026)

### A. Plafond de visites quotidien : 3 → 8

**Demande d'Adrien** : pouvoir faire 8 visites par jour sur une même
ville au lieu de 3 actuellement.

**Où c'est dans le code** : le plafond est un `3` écrit en dur dans
`visiter_ville()` (`if v_nb_aujourdhui >= 3 then ... using errcode =
'P0019'`), dans sa définition la plus récente
(`supabase/migrations/0030_jalon20_monuments.sql`). Ce même littéral
`3` apparaît aussi dans plusieurs migrations antérieures qui
redéfinissaient la fonction à chaque jalon (0022, 0023, 0024, 0025,
0028) — sans effet aujourd'hui puisque seule la dernière définition
compte, mais ça vaut le coup que Claude Code en profite pour centraliser
ce chiffre dans une seule constante plutôt que de le dupliquer une
fois de plus dans la prochaine migration qui touche à cette fonction.
Aucun texte visible par le joueur ne mentionne explicitement "3"
(l'erreur P0019 est absorbée silencieusement côté client,
`src/app/villes/actions.ts`) — changer uniquement le chiffre dans la
fonction SQL suffit, pas de traduction à toucher.

**Ce qui ne change pas** : le délai d'une heure entre deux visites de la
même ville par le même joueur (P0018) n'est pas concerné par cette
demande — avec 8 visites max et 1h de délai minimum, une ville ne peut
de toute façon pas recevoir plus de 8 visites du même joueur en 24h,
cohérent.

### B. Feedback de visite : "+1 visite" puis les choix d'activité tout de suite en dessous

**Demande d'Adrien** : quand on visite une ville, afficher "+1 visite"
clairement, et juste en dessous, les propositions de choix d'activité à
faire — directement, sans action supplémentaire.

**État actuel** (vérifié dans `VisiteAutomatique.tsx` et
`ChoisirActivite.tsx`) :
- `VisiteAutomatique` affiche aujourd'hui un message centré sur le
  gain de population réel ("Visite comptée ! +X habitant(s)." ou un
  message "sans gain" si la crise du Résidentiel a empêché le gain,
  voir Jalon 18) — pas de mention explicite d'un compteur de visite en
  tant que tel.
- `ChoisirActivite` affiche l'activité déjà tirée au sort/choisie, avec
  un bouton "changer" qu'il faut cliquer pour faire apparaître la
  liste des activités disponibles — les propositions de choix sont
  donc cachées par défaut, pas montrées "tout de suite en dessous"
  comme le souhaite Adrien.

**À faire** :
1. Ajouter un message "+1 visite" (distinct du message de gain de
   population actuel, qui reste utile et peut être affiché juste à
   côté ou en dessous — une visite compte même quand le gain de
   population est nul à cause d'une crise).
2. Juste en dessous de ce message, afficher directement la liste des
   activités disponibles à choisir (le contenu actuellement caché
   derrière le bouton "changer"), sans action supplémentaire requise —
   le bouton "changer" ne garde de sens que pour revenir consulter ce
   choix plus tard dans la fenêtre de grâce de 5 minutes, après avoir
   quitté puis rouvert la page, tant que le choix n'est pas verrouillé
   (§20 B, `visites.activite_verrouillee`).

### C. Bouton discret avec les règles du jeu

**Demande d'Adrien** : un bouton discret donnant accès aux règles du
jeu.

**État actuel** : aucune page ni composant "règles" n'existe
aujourd'hui dans le code (vérifié par recherche dans `src/`) — tout ce
qui explique une mécanique au joueur est aujourd'hui dispersé au fil
des pages (jauges, bulletin municipal, panneau Monuments, etc.), sans
vue d'ensemble consultable à la demande.

**À faire** : une page ou un panneau "Règles du jeu", accessible via un
bouton/lien discret (emplacement laissé à l'appréciation de Claude
Code — par exemple dans la barre de navigation ou en pied de page),
expliquant les mécaniques principales déjà en place : visites et
plafonds, influence, actions AntiVille, jumelages, les 7 activités et
leurs effets, manifestations, mégaprojets, technologies, monuments
d'influence, pays et ressources nationales, décisions diplomatiques et
guerre. Vu le volume, une v1 peut raisonnablement ne couvrir que le
cœur de boucle (visites, activités, influence, AntiVille) et compléter
le reste par la suite — à étoffer au même rythme que les jalons déjà
livrés plutôt que de tout rédiger d'un coup. Contenu à écrire en
français ET anglais dès cette première version (règle i18n immédiate,
`DECISIONS.md` §1 point 5). Peut servir de brique de départ pour le
parcours de découverte des nouveaux joueurs proposé en §26 F, sans
attendre que ce chantier-là soit pris.

**Traité le 02/10/2026 (Claude Code)** : A (plafond 8, migration `0039`,
constante centralisée — la définition de `visiter_ville()` se trouve en
fait dans la `0024`, pas la `0030`), B (« +1 visite » puis choix
d'emblée pour une visite de moins de 2 minutes) et C (page publique
`/regles`, FR + EN, v1 cœur de boucle) — détail dans `DECISIONS.md` §4
« Plafond de visites à 8… ». **Question posée à Adrien** : les paliers
de popularité du Jalon 22 sont-ils à relever maintenant que le plafond
passe de 3 à 8 ?

---

## 28. Fichier APK pour tester avec des amis avant le Play Store (demande d'Adrien, revenue le 02/10/2026)

**Contexte** : Adrien avait demandé fin septembre s'il était possible
de générer un `.apk` pour tester avec des amis avant le Play Store.
Réponse donnée à l'oral à l'époque mais jamais écrite ici pour Claude
Code — corrigé maintenant, d'autant plus utile puisque les règles du
Play Store rendent ce test **obligatoire**, pas juste pratique (12 testeurs pendant 14 jours
consécutifs avant toute mise en production — détail donné à Adrien en
conversation, pas une tâche de code, donc pas répété ici).

**Ce qui existe déjà** : la PWA installable du Jalon 15 (manifest,
service worker, mode hors-ligne minimal) — c'est la base nécessaire,
rien à refaire de ce côté.

**À faire** : empaqueter cette PWA en TWA (Trusted Web Activity) pour
obtenir un `.apk`/`.aab` installable sur Android, avec Bubblewrap (outil
officiel Google, gratuit, ligne de commande) ou PWABuilder (service web
équivalent, gratuit) :
1. Générer le projet Android à partir de l'URL de la PWA en production
   (Bubblewrap ou PWABuilder).
2. Publier un fichier `assetlinks.json` sur le domaine du jeu, pour que
   Android associe l'app installée au site (sans ça, l'app s'ouvre dans
   un onglet de navigateur visible au lieu d'une vraie app plein
   écran).
3. Garder précieusement la **clé de signature** générée à cette étape
   (le keystore) : la même clé doit signer toutes les versions futures,
   y compris celle envoyée au Play Store plus tard — la perdre
   obligerait à republier sous une identité d'app différente.
4. Adrien installe l'APK généré directement sur son téléphone et ceux
   de ses amis testeurs (pas besoin du Play Store pour ça : "installer
   depuis une source inconnue" suffit), ou le distribue via un lien de
   téléchargement direct.

**Coût** : aucun à cette étape (Bubblewrap/PWABuilder sont gratuits,
pas de compte développeur nécessaire juste pour générer et installer un
APK en direct) — le compte développeur Google (25 $, unique) n'est
nécessaire qu'à l'étape suivante, la mise en ligne sur le Play Store,
et sera, comme toujours, soumis à l'accord explicite d'Adrien avant
toute dépense.
