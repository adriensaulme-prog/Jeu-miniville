# Système de développement des villes

*Proposition de game design, 23/09/2026, rédigée avec Adrien côté Claude
chat. Statut : **à valider par Adrien** (les chiffres sont des premiers
réglages, à équilibrer avec les villes de test). À intégrer ensuite dans
`docs/DECISIONS.md` par Claude Code.*

---

## 1. L'idée en une phrase

Chaque visite apporte **+1 habitant** et **1 point de développement**
dans l'activité que le visiteur choisit. Les points font apparaître des
quartiers dans la ville, déclenchent des bonus, et doivent rester
**équilibrés** : une ville déséquilibrée a des problèmes. Les joueurs
décident donc ensemble de la direction que prend la ville.

Règle d'or (cahier des charges §31) : **on comprend l'action en moins
d'une minute.** Le joueur ne voit jamais de formule, seulement 7 jauges
colorées, les effets actifs en clair, et une recommandation du maire.

---

## 2. La visite, pas à pas

1. Le joueur visite une ville (une fois par jour et par ville, règle
   actuelle inchangée).
2. Il choisit **une** activité parmi 7. La ville affiche ses besoins :
   jauges, activité recommandée par le maire, mégaprojet en cours.
3. Résultat immédiat : +1 habitant (voir modificateurs §4) et +1 point
   dans l'activité choisie. Un message dit ce que ça a changé
   (« L'énergie de Rochemaure passe de 58 % à 59 % »).

Le **propriétaire** de la ville ne peut pas se visiter lui-même (règle
actuelle), mais il a chaque jour **1 contribution de maire** gratuite, et
il peut afficher une **recommandation** (« Le maire recommande : ⚡
Énergie ») que voient tous les visiteurs. C'est l'outil de la décision
collective : le maire oriente, les visiteurs décident.

---

## 3. Les 7 activités et leurs jauges

Chaque activité a une **part cible** du développement. La jauge compare
la part réellement reçue à cette cible : **100 % = pile à l'équilibre**.

| | Activité | Part cible | Ce que ça produit |
|---|---|---|---|
| 🏠 | Résidentiel | 30 % | logements (capacité d'accueil) |
| 🏭 | Industrie | 12 % | **matériaux** (stock) |
| 🛒 | Commerce | 14 % | **revenus** (stock) |
| 🌳 | Loisirs | 12 % | attractivité |
| 🏥 | Services | 12 % | résistance aux coups durs |
| ⚡ | Énergie | 12 % | fonctionnement de la ville |
| 🔬 | Recherche | 8 % | **technologies** (paliers) |

**La ville regarde surtout le dernier mois** : chaque jour, les points
de chaque activité perdent 3,3 % de leur poids (demi-vie d'environ trois
semaines). Sans ça, une grande ville mettrait des mois à corriger un
manque ; avec, quelques semaines de choix différents suffisent. Les
stocks (matériaux, revenus), la recherche cumulée et la vocation des
quartiers, eux, ne s'effacent jamais.

**Calcul de la jauge** (côté serveur uniquement) :
`jauge = (élan de l'activité + 20 × part) / (élan total + 20) / part`.
Le « + 20 » évite qu'une ville neuve soit en crise dès sa première visite.

**Vérifié en simulation** (maquette des écrans, ville de 20 500
habitants, 60 visites par jour pendant 30 jours) :
- le maire conseille chaque jour la jauge la plus basse et la moitié des
  visiteurs suit : la crise d'énergie se résorbe (59 % → 96 %), aucune
  manifestation, +1 800 habitants ;
- les visiteurs choisissent au hasard : pas de manifestation, mais le
  Résidentiel devient fragile (100 % → 65 %) ;
- tout le monde choisit Résidentiel : 6 jauges en crise, 7
  manifestations, la ville **perd** près de 1 000 habitants.
C'est exactement la leçon voulue : l'équilibre paie, la décision
collective compte.

**Lecture des couleurs** :

| Jauge | État | Couleur |
|---|---|---|
| < 60 % | **Crise** : un malus s'applique | rouge |
| 60 – 90 % | Fragile | orange |
| 90 – 120 % | Équilibré | vert |
| > 120 % | **Point fort** : un bonus s'applique | bleu |

Comme les parts s'additionnent à 100 %, **pousser une activité en point
fort en fait baisser d'autres** : c'est le cœur du choix stratégique
(se spécialiser ou rester équilibré).

---

## 4. Effets de chaque activité

Tous les effets sont **progressifs** (ils montent de 0 à leur maximum
entre 60 % et 150 % de jauge), plafonnés, et calculés côté serveur.

| | Point fort (jusqu'à 150 %) | Crise (< 60 %) |
|---|---|---|
| 🏠 Résidentiel | — (condition de base) | **crise du logement** : chaque visite n'apporte l'habitant qu'avec une probabilité jauge ÷ 60 % |
| 🏭 Industrie | **grèves plus courtes** : jusqu'à −60 % de durée | grèves +50 % de durée |
| 🛒 Commerce | **croissance** : jusqu'à +25 % d'habitants par visite (habitant bonus) | pas de bonus des jumelages |
| 🌳 Loisirs | **ville soudée** : pertes dues aux manifestations et à la propagande jusqu'à −50 % | pertes +50 % |
| 🏥 Services | **santé publique** : pertes dues à la contamination jusqu'à −50 % | contamination +50 % |
| ⚡ Énergie | risque de **manifestation divisé par 2** | **pénurie** : les gratte-ciel arrêtent de monter, risque de manifestation ×2 |
| 🔬 Recherche | **influence renforcée** : chaque influence envoyée a jusqu'à 50 % de chance de compter double | pas de nouvelle technologie débloquée |

Ces effets s'appuient sur les mécaniques **déjà codées** (grève,
contamination, propagande, influence, jumelages) : on ne crée qu'un seul
nouveau type d'événement, la manifestation (§5). Le lien complet avec
AntiVille est au §6 bis.

---

## 5. Les manifestations (conséquence du déséquilibre)

Une fois par jour, chaque ville tire au sort une éventuelle
manifestation :
- risque de base : **+10 % par jauge en crise** (Énergie compte double),
  divisé par 2 si l'Énergie est en point fort ;
- effet : la ville perd **1 % de ses habitants** (réduit par les Loisirs), et le bulletin municipal l'explique (« Manifestation contre
  le manque de services : −205 habitants ») ;
- jamais de bâtiment détruit : la ville reste dessinée à son record
  (règle §10 point 11).

Une ville équilibrée n'a **jamais** de manifestation. Le message est
clair pour le joueur : « équilibre ta ville et tu n'auras pas de
problème ».

---

## 6. Stocks, technologies et mégaprojets

**Stocks** : chaque point d'Industrie ajoute 1 **matériau**, chaque
point de Commerce 1 **revenu**. Ils s'accumulent et se dépensent dans les
mégaprojets (les jauges, elles, ne baissent pas quand on dépense).

**Technologies** : tous les paliers de points de Recherche cumulés
(100, 300, 800, 2 000, 5 000, puis ×2), une technologie se débloque. Elle
est surtout **visuelle** (cahier des charges §12) : éclairage public LED
la nuit, panneaux solaires sur les toits, tramway dans les grands axes,
toits végétalisés, drones… avec parfois un petit bonus.

**Mégaprojets** : à chaque stade de population, le maire choisit **un
mégaprojet parmi 3** ; les visiteurs le financent.

| Stade | Au choix | Coût (matériaux / revenus / points du thème) |
|---|---|---|
| Bourg (5 000) | Grande école 🏥 · Parc des sports 🌳 · Marché couvert 🛒 | 400 / 400 / 250 |
| Ville (15 000) | Hôpital 🏥 · Stade 🌳 · Centrale solaire ⚡ · Zone logistique 🏭 | 1 200 / 1 200 / 750 |
| Grande ville (40 000) | Technopole 🔬 · Gare TGV 🛒 · Parc éolien ⚡ · Opéra 🌳 | 3 200 / 3 200 / 2 000 |
| Métropole (100 000) | Tour emblématique · Aéroport 🛒 · Centre de recherche 🔬 · Centrale ⚡ | 8 000 / 8 000 / 5 000 |
| puis tous les 50 000 | nouveaux choix | coûts ×1,5 |

- Les points du thème comptent **à partir du choix** du mégaprojet : les
  visiteurs qui choisissent l'activité du thème font avancer le chantier.
- Une fois construit : un **bâtiment emblématique** apparaît dans la
  ville en 3D, et un **bonus permanent** s'ajoute (ex. Stade : départs
  −25 % ; Centrale solaire : Énergie comptée +20 % ; Tour emblématique :
  +prestige, lien avec les avantages nationaux du cahier §13).

---

## 6 bis. Le lien avec AntiVille

Principe : **une ville équilibrée se défend bien, une ville
déséquilibrée est une proie facile.** Les actions AntiVille existantes
(Jalon 4) ne changent pas de nature ; le développement règle leur force.

**Une défense par attaque**, facile à retenir :

| Attaque (existante) | Effet actuel | Activité qui protège | Point fort | Crise |
|---|---|---|---|---|
| ✊ Grève | bloque l'influence reçue 24 h | 🏭 Industrie | durée jusqu'à −60 % | durée +50 % |
| 🦠 Contamination | fait perdre des habitants | 🏥 Services | perte jusqu'à −50 % | perte +50 % |
| 📢 Propagande | −2 influence | 🌳 Loisirs | perte jusqu'à −50 % | perte +50 % |

**Ce que les attaques touchent en plus :**
- la **grève** met aussi en pause le **chantier du mégaprojet** et la
  production de matériaux pendant sa durée (« les ouvriers sont en
  grève ») ;
- rien d'autre : une attaque ne retire jamais de points de développement
  ni de stocks, et ne détruit jamais un bâtiment (la ville reste dessinée
  à son record).

**Après une attaque**, la ville réagit :
- le bulletin municipal l'annonce, avec la ville attaquante ;
- le conseil du maire propose automatiquement l'activité qui protège
  (« Rochemaure a été contaminée : 🏥 Services conseillé ») ;
- **solidarité** *(optionnel, à valider)* : pendant 24 h, chaque visite
  qui choisit l'activité protectrice rapporte +1 habitant de plus. Une
  attaque rassemble donc la communauté de la ville au lieu de seulement
  la punir.

**Mégaprojets défensifs** : l'Hôpital divise encore la contamination par
2, la Zone logistique rend la ville insensible à la pause de chantier,
l'Opéra divise la propagande par 2.

**Force des attaques : des paliers selon le nombre d'attaques du jour**
*(idée d'Adrien, 24/09/2026, après avoir testé le Jalon 4 : « −10 % de
population est exagéré »)*.

Aujourd'hui, une seule contamination retire 10 % de la population : avec
l'échelle à 100 000, c'est 2 000 habitants pour une ville de 20 000,
soit un mois de visites. Nouvelle règle proposée : **une attaque isolée
pèse peu, une attaque massive et coordonnée pèse lourd**, et on compte
les attaques **reçues par la ville dans la journée, tous attaquants
confondus**.

- Chaque attaque a un **petit effet unitaire** : contamination
  **−0,01 % des habitants** (au moins 1), propagande −0,1 % de
  l'influence (au moins 1), grève −0,1 % de l'influence reçue pendant
  24 h.
- Les effets s'additionnent dans la journée, avec un **plafond : 10 %
  par jour**, atteint à **1 000 attaques**.
- La ville passe des **paliers visibles** par tous :

| Attaques reçues aujourd'hui | Palier | Pertes cumulées (ville de 20 000) | Ce qui se passe en plus |
|---|---|---|---|
| 1 – 9 | Incidents | jusqu'à ~20 habitants | ligne au bulletin municipal |
| 10 – 99 | Troubles | jusqu'à ~200 (1 %) | le maire est alerté, conseil de défense automatique |
| 100 – 499 | Émeutes | jusqu'à ~1 000 (5 %) | fumée visible dans la ville en 3D, solidarité doublée pour les défenseurs |
| 500 – 999 | Crise | jusqu'à ~2 000 (10 %) | le pays de la ville est prévenu (lien avec la future page pays) |
| 1 000 et + | Ville sinistrée | plafond de 10 % atteint | plus aucune perte jusqu'au lendemain |

Avec 3 attaques par joueur et par jour, atteindre 1 000 attaques demande
plus de 300 joueurs coordonnés : c'est un **événement collectif** (une
vraie guerre de villes ou de pays), jamais l'œuvre d'un joueur seul.
Les défenses du tableau ci-dessus (Industrie, Services, Loisirs,
mégaprojets) réduisent l'effet unitaire. Les chiffres sont à régler avec
les villes de test et un simulateur.

**Cette logique vaut pour tout le jeu** : chaque mécanisme (visites,
influence, attaques, jumelages, développement, puis pays) doit être
revu avec la même grille : effet unitaire, cumul dans la journée,
plafond, paliers visibles, protections. C'est l'objet d'un futur jalon
« Revoir les règles du jeu ».

---

## 7. Ce qu'on voit dans la ville (3D)

La règle actuelle maisons → immeubles → tours reste celle des **blocs
résidentiels**. Les autres activités font apparaître leurs propres
quartiers :

- quand un **nouveau bloc s'ouvre**, sa **vocation** est fixée une fois
  pour toutes : celle de l'activité la plus en retard entre sa part de
  points et sa part de blocs (le résidentiel garde au moins la moitié des
  blocs) ;
- 🏭 bloc industriel : entrepôts et ateliers, puis usines et cheminées,
  puis grand complexe (même logique de croissance que les maisons) ;
- 🛒 bloc commercial : commerces, halles, centre commercial, bureaux ;
- 🌳 bloc loisirs : parc, terrains de sport, puis stade / salle de
  spectacle ;
- 🏥 bloc services : école, caserne de pompiers, puis hôpital ;
- 🔬 bloc recherche : campus, laboratoires ;
- ⚡ énergie : **hors de la ville**, dans la campagne autour (panneaux
  solaires, éoliennes, puis centrale), en nombre proportionnel aux
  points ;
- les mégaprojets sont des **bâtiments uniques**, reconnaissables de
  loin.

Donnée à ajouter : la vocation de chaque bloc ouvert (table
`city_blocks`), puisqu'elle ne se déduit plus seulement de la
population.

---

## 8. Données et anti-triche (pour Claude Code)

- `city_activity_points` : par ville, 7 compteurs cumulés + stocks
  (matériaux, revenus) + recherche cumulée.
- `visits` : ajouter la colonne `activite` (une des 7, obligatoire).
- `city_blocks` : ville, rang du bloc, vocation, date d'ouverture.
- `megaprojets` : ville, type, stade, statut (choisi / en chantier /
  construit), progression.
- `city_events` : manifestations et autres événements, pour le bulletin
  municipal.
- Tout se calcule dans des fonctions SQL (comme `population_vers_niveau`)
  : le client envoie seulement « je visite telle ville avec telle
  activité ».

---

## 9. Découpage proposé en jalons

1. **Choisir une activité à chaque visite** : les 7 jauges, le choix
   obligatoire à la visite, la recommandation du maire, l'affichage des
   jauges sur la page de la ville. (Aucun effet encore.)
2. **Les effets de l'équilibre** : bonus et crises du §4, manifestations
   du §5, lien avec AntiVille du §6 bis (dont la correction de la
   contamination et le plafond de pertes), bulletin municipal.
3. **Les quartiers** : vocation des blocs et nouveaux bâtiments 3D
   (industrie, commerce, loisirs, services, recherche, énergie hors
   ville).
4. **Les mégaprojets et les technologies** : choix du maire,
   financement collectif, bâtiments emblématiques, technologies
   visuelles.

Chaque étape est jouable et testable seule, avec les villes de test.

---

## 10. Questions pour Adrien

1. Les **parts cibles** (30 % résidentiel, etc.) te conviennent-elles ?
2. Le **maire** : une contribution gratuite par jour et la
   recommandation affichée, ça te va ? Ou faut-il un **vote des
   habitants** de la ville à la place ?
3. Ta phrase sur les mégaprojets était coupée (« À certains seuils de
   population, de grands mégaprojets peuvent être… ») : le choix du
   maire parmi 3 et le financement par les visiteurs, c'est ce que tu
   avais en tête ?
4. Faut-il un **stade au-delà de Métropole** (ex. Mégapole à 250 000) ?
5. Les liens avec le **pays** (cahier §10-13 : ressources nationales,
   votes Industrie / Techno / Culture / Commerce) : proposition — les
   points des villes alimentent les ressources nationales de leur pays.
   À valider quand on arrivera aux jalons « pays ».
6. **AntiVille** (§6 bis) : les paliers selon le nombre d'attaques du
   jour (idée d'Adrien) ; à régler avec un simulateur. Et la
   **solidarité** après une attaque, on la garde ?
