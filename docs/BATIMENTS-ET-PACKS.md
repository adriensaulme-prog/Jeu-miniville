# Bibliothèque de bâtiments et packs de thèmes

*Proposition, 24/09/2026, rédigée avec Adrien côté Claude chat. Statut :
**à valider par Adrien**. À intégrer ensuite dans `docs/DECISIONS.md`
par Claude Code.*

Demande d'Adrien : « plusieurs modèles de bâtiments, beaucoup de
bâtiments différents, et des thèmes (packs payants) ; prévoir la création
d'une librairie et de différents packs ».

---

## 1. Point de départ

Aujourd'hui (`src/lib/ville3d/batiments.ts`, 344 lignes), il existe
**3 familles** : maison, immeuble et gratte-ciel. Chacune a quelques
variations tirées au hasard : couleurs, 1 ou 2 étages, largeur, toit.

Tous les bâtiments sont **dessinés par le code**. Il n'y a ni modèle 3D
ni texture à télécharger. On garde ce principe, parce que c'est lui qui
permet d'avoir des centaines de bâtiments sans alourdir l'appli (règle
« application légère », `A-INTEGRER.md` §4) :

- un modèle de bâtiment = une petite fonction de 30 à 100 lignes,
  soit 1 à 3 Ko ;
- un pack entier fait quelques dizaines de Ko, contre plusieurs Mo pour
  des modèles 3D classiques.

---

## 2. La bibliothèque (catalogue de modèles)

Chaque modèle est une **fiche** enregistrée dans un catalogue commun :

| Champ | Exemple | Rôle |
|---|---|---|
| `id` | `maison-longere` | identifiant stable, jamais réutilisé |
| `pack` | `classique` | pack auquel il appartient |
| `famille` | maison · immeuble · tour · industrie · commerce · loisirs · services · recherche · énergie · mégaprojet · mobilier | quelle place il peut occuper |
| `lot` | 1 parcelle, ½ bloc, bloc entier | taille au sol |
| `capacite` | 4 habitants | lien avec les logements (`SYSTEME-DEVELOPPEMENT.md` §6 bis) |
| `stadeMin` | Village | pas de tour de verre dans un hameau |
| `poids` | 3 | fréquence d'apparition |
| `construire(g, lot, rng)` | fonction | dessine le bâtiment |

**Règles du catalogue :**

- **Même ville, mêmes bâtiments.** Le choix du modèle pour une parcelle
  vient de la graine de la ville et de la parcelle. Ajouter des modèles
  au catalogue ne doit **jamais** changer les bâtiments déjà construits
  d'une ville existante. Techniquement, chaque parcelle garde le modèle
  qu'elle a reçu, ou le tirage se fait par liste versionnée.
- **Changer de thème ne déplace rien.** Les routes, les parcelles et les
  hauteurs restent les mêmes ; seul l'habillage change (façades, toits,
  matériaux, arbres, lampadaires).
- **Chaque modèle a une limite de triangles** pour rester fluide sur
  téléphone. Un test le vérifie.
- **Un pack peut être partiel.** Si un thème n'a pas de modèle pour une
  famille, le catalogue prend celui du pack Classique.

**Showroom (outil de développement, jamais dans le jeu publié).** C'est
une page qui affiche tous les modèles d'un pack côte à côte, de jour et
de nuit, pour qu'Adrien les valide d'un coup d'œil. Elle respecte la
règle « pas de curseur » : c'est un outil de test, comme les villes de
test.

---

## 3. Le pack de base « Classique » (gratuit) : beaucoup de variété

Objectif : **qu'on ne voie jamais deux fois le même bâtiment côte à côte.**

| Famille | Modèles visés | Exemples |
|---|---|---|
| Maisons | 12 à 15 | pavillon, longère, maison de ville, chalet, maison d'architecte à toit plat, maison à véranda, maison mitoyenne… |
| Immeubles | 10 | petit collectif à balcons, immeuble ancien à corniche, résidence en briques, immeuble à coursives, immeuble à toit-terrasse… |
| Tours | 8 | verre bleu, béton et loggias, tour à gradins, tour torsadée, tour à couronne lumineuse… |
| Quartiers d'activité (quand le système de développement sera validé) | 5 par activité | entrepôt, usine à cheminées, supérette, halle, centre commercial, gymnase, école, caserne, hôpital, laboratoire, campus, éolienne, panneaux solaires… |
| Mégaprojets | 1 par mégaprojet | stade, gare TGV, opéra, tour emblématique… |
| Mobilier urbain | 10 à 15 | arbres (plusieurs essences), lampadaires, abribus, fontaines, kiosques, bancs, voitures variées… |

Et chaque modèle garde ses variations tirées au hasard (couleurs,
fenêtres, balcons, toits). Avec 3 à 5 variantes par modèle, on
obtient plusieurs centaines d'apparences différentes.

**Variante gratuite par pays** *(idée à valider)* : le pays de la ville
choisit déjà le soleil ; il pourrait aussi colorer le pack Classique.
Par exemple :

- toits d'ardoise ou de tuiles en France ;
- colombages en Allemagne ;
- toits verts et bleus au Japon ;
- façades claires autour de la Méditerranée.

Ce serait un simple jeu de couleurs et de toits, très léger. Il
renforce l'identité du pays et la rivalité France contre Allemagne.

---

## 4. Les packs de thèmes

Un pack, c'est trois choses :

- des **modèles** qui remplacent ceux du Classique ;
- une **palette** (couleurs des façades, toits, routes, végétation) ;
- parfois une **ambiance** (lampadaires, arbres, sol, neige,
  illuminations).

Idées de packs :

| Pack | Idée |
|---|---|
| Haussmannien | Paris, balcons filants, toits de zinc, kiosques |
| Méditerranée | façades blanches et ocre, tuiles, pins parasols, oliviers |
| Nordique | maisons en bois colorées, toits pentus, bouleaux |
| Japon | toits courbés, néons la nuit, cerisiers |
| New York | briques, escaliers de secours, taxis jaunes, gratte-ciel Art déco |
| Futuriste | tours organiques, jardins suspendus, voitures volantes |
| Médiéval | colombages, remparts, beffroi |
| Saisonniers | Noël (neige, illuminations), Halloween, été |

**Règles des packs :**

- **Purement cosmétique** : un pack ne donne **aucun avantage** dans le
  jeu (habitants, influence, défense). Sinon, le jeu devient
  « payer pour gagner » et perd son esprit.
- **Le joueur choisit le thème de sa ville.** Les visiteurs voient la
  ville avec le thème de son propriétaire. Un thème acheté donne donc
  envie aux autres de l'avoir.
- **Chargé seulement quand on en a besoin.** Le code d'un pack se
  télécharge seulement quand on regarde une ville qui l'utilise.
  Poids maximum : **50 Ko compressés par pack**.
- On peut essayer un pack en aperçu dans la boutique avant de l'acheter.

---

## 5. Le paiement : à préparer, pas à coder maintenant

Vendre des packs, c'est vendre quelque chose : il faut prévoir, bien
avant de brancher le paiement, les points suivants.

- **Commissions (pas de coût fixe, mais une part des ventes).**
  - Sur le site (PWA), un service comme Stripe prend environ 1,5 % +
    0,25 € par paiement par carte européenne.
  - Dans les applis des stores, Apple et Google **imposent leur propre
    système d'achat** pour les contenus numériques. Leur commission est
    de 15 % pour les petits développeurs, 30 % sinon.
  - Aucun abonnement à payer d'avance. La règle « zéro coût » est
    respectée, mais chaque vente est amputée.
- **Statut légal.** Pour encaisser de l'argent en France, il faut un
  statut (la micro-entreprise est le plus simple), des conditions
  générales de vente, et la TVA sur les ventes numériques en Europe.
  Stripe et les stores s'en chargent en partie. **À vérifier avec un
  comptable** : je ne suis pas conseiller juridique ni fiscal.
- **Ce qu'on peut faire dès maintenant**, sans rien payer :
  - les tables `packs` et `joueur_packs` (quels packs chaque joueur
    possède) ;
  - la colonne `cities.theme` ;
  - des packs gratuits ;
  - un pack « premium » **débloqué pour les comptes de test**.

  Le jour venu, brancher le paiement reviendra seulement à remplir
  `joueur_packs` après un achat validé côté serveur.

---

## 6. Découpage proposé en jalons

1. **La bibliothèque de bâtiments** (après le Jalon 7bis) :
   - réorganisation de `batiments.ts` en catalogue de fiches ;
   - pack Classique enrichi : environ 30 modèles de maisons, immeubles
     et tours, plus le mobilier ;
   - showroom de développement ;
   - tests : tirage stable (une ville existante ne change pas quand on
     ajoute un modèle), limite de triangles, poids.
2. **Des villes aux couleurs de leur pays** *(optionnel)* : les
   variantes régionales gratuites.
3. **Les thèmes** :
   - choix du thème de sa ville ;
   - chargement des packs à la demande ;
   - 1 thème gratuit supplémentaire et 1 thème premium débloqué pour
     les comptes de test ;
   - aperçu.
4. **La boutique** (après le MVP, une fois le statut légal réglé) :
   paiement par carte sur le site, puis achats intégrés dans les
   applis des stores.

Les bâtiments des quartiers d'activité et des mégaprojets entreront
dans le catalogue au moment des jalons du système de développement.

---

## 7. Questions pour Adrien

1. Les **thèmes de départ** que tu veux en priorité (dans la liste du
   §4, ou d'autres idées) ?
2. Les **variantes gratuites par pays** : oui ou non ?
3. Tu es d'accord pour que les packs soient **uniquement cosmétiques** ?
4. Ordre : la bibliothèque de bâtiments **avant** le classement
   (Jalon 8), ou après ?
