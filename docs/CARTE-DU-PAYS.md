# La carte du pays

*Proposition, 25/09/2026, rédigée avec Adrien côté Claude chat. Statut :
**style validé par Adrien** (carte illustrée façon jeu, régions colorées
par population). Détails techniques à confirmer par Claude Code. Corrige
un choix déjà fait aux Jalons 9 et 10.*

Constat d'Adrien : la page Pays affiche aujourd'hui sa propre ville en
3D vue du ciel, comme toutes les autres pages du jeu (fond partagé,
`SceneVilleFond`, Jalon 7). Pour un pays, ça n'a pas de sens : « je ne
veux pas de ville vue du ciel mais plutôt une carte ».

---

## 1. Le principe

Sur la page **Pays uniquement**, le fond n'est plus la ville 3D du
joueur : c'est une **carte illustrée du pays**, dans le même esprit
graphique que le reste du jeu (typographie Barlow Condensed pour les
noms, rouge panneau #c23b2c, panneaux vitrés flottants par-dessus) —
pas une carte réaliste ou satellite, une carte « de jeu de société ».
Toutes les autres pages (Ma ville, Villes, Classement, Palmarès,
Jumelages) gardent la ville 3D en fond, sans changement.

---

## 2. Ce qu'on voit sur la carte

- **Le pays entier**, découpé en ses **régions** (celles déjà prévues
  pour les classements régionaux, `docs/CLASSEMENTS.md`).
- **Une région = une couleur**, plus marquée si elle est plus peuplée
  (dégradé simple sur une seule teinte, pas un arc-en-ciel). Une région
  sans encore de ville dedans reste neutre.
- **Une pastille par ville marquante** :
  - la **ville du joueur**, mise en valeur (contour rouge) ;
  - la ville **présidente** du pays, avec l'étoile déjà utilisée pour ce
    statut ;
  - la ville **n° 1 de chaque région** (« gouverneur », proposition de
    `CLASSEMENTS.md` §2), avec une petite couronne.
- **De petites lumières qui scintillent la nuit** sur les grandes
  villes, à l'heure réelle du pays (même fuseau horaire que la 3D
  aujourd'hui) : garde l'impression d'un monde vivant sans le poids
  d'une scène 3D.
- **Un repère discret en bord de carte** pour chaque jumelage
  international (petite flèche ou pointillé vers le bord, au niveau de
  la région du pays partenaire) — écho des villes jumelles à l'échelle
  du pays.
- **Cliquer une région** ouvre son résumé (population, ville n° 1),
  **cliquer une ville** va sur sa page — même logique d'interaction
  qu'ailleurs dans le jeu.

**Cas des petits pays** (Monaco, Luxembourg, Malte...) : une seule
région, pas de vraie carte à dessiner — une simple vignette avec le nom
du pays suffit, pas de carte forcée pour un territoire minuscule.

---

## 3. D'où viennent les tracés (pour Claude Code)

- **Source** : *Natural Earth*, données de frontières administratives
  du monde entier, dans le **domaine public** (aucune attribution
  requise, aucun coût). Suffisant pour un rendu stylisé — inutile de
  viser la précision d'un GPS.
- **Fabriqué une fois pour toutes**, pas téléchargé à chaque visite :
  un petit script transforme les frontières en **un fichier SVG léger
  par pays** (simplifié, quelques Ko), stocké dans le dépôt comme les
  autres données de jeu.
- **Chargé seulement pour le pays du joueur**, comme les packs de
  bâtiments (règle « application légère », `A-INTEGRER.md` §4) :
  jamais les ~195 pays d'un coup.
- **Pas de service de cartes payant** (Google Maps, Mapbox...) : inutile
  pour un rendu stylisé et non interactif au pixel près, et ça
  introduirait une dépendance et un coût récurrent pour rien — cohérent
  avec la règle « dépenses sous contrôle » (`A-INTEGRER.md` §10) : la
  proposition ci-dessus ne coûte rien, donc pas besoin de te demander.
- **Données déjà prêtes à réutiliser** : régions (`regions`, table
  prévue pour les classements), population par ville, statut président
  et jumelages — rien de neuf à calculer, seulement à dessiner.

---

## 4. Découpage proposé

**Jalon 9 ter — La carte du pays** *(vient après les Jalons 9 et 10,
déjà livrés sans ce point)* : remplacement du fond 3D par la carte sur
la page Pays, régions colorées, pastilles des villes marquantes,
jumelages en bord de carte. Le scintillement de nuit et les vraies
frontières précises peuvent être une seconde passe si le volume de
travail est trop grand pour un seul jalon.

---

## 5. Ce qui reste ouvert

- Le style (carte illustrée) et la couleur des régions (par population)
  sont validés par Adrien le 25/09/2026.
- Pas de question bloquante : Claude Code peut avancer sur cette base,
  et proposer des ajustements de détail dans son propre journal
  (`DECISIONS.md`) si un point précis (par exemple la taille exacte des
  pastilles) mérite un choix d'implémentation.
