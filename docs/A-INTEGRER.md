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
> plutôt que ce §8, voir `DECISIONS.md` §10 point 26. Ce fichier peut
> être supprimé quand Adrien aura répondu aux questions restantes.

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
