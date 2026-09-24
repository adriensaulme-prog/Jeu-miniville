# Classements et régions

*Proposition, 24/09/2026, rédigée avec Adrien côté Claude chat. Statut :
**demande d'Adrien validée sur le principe, détails à confirmer**. À
intégrer par Claude Code dans `docs/DECISIONS.md` et dans le
**Jalon 8 — Se classer**.*

> **État de l'intégration (24/09/2026, Claude Code)** : §1, §2 et §4
> faits au Jalon 8 (`docs/DECISIONS.md` §4, journal du Jalon 8). §3 et
> §5 (Jalon 8bis) pas commencés. §6 : questions 1 et 3 tranchées par
> défaut (délai de 30 jours, pas de classement des attaquants) ; les
> questions 2 (gouverneur de région) et 4 (autres classements annexes)
> restent ouvertes pour Adrien — voir `docs/DECISIONS.md` §10 points 23
> et 25.

Demande d'Adrien : « chaque joueur choisit une région dans son pays, pour
faire différents classements pour un même pays, un classement mondial,
et aussi des classements annexes : ceux qui ont perdu le plus
d'habitants, etc. »

---

## 1. Les régions

- À la création de sa ville, le joueur choisit son **pays**, puis sa
  **région** dans ce pays. La liste des régions dépend du pays choisi.
- **Villes déjà créées** : à la prochaine connexion, un écran demande de
  choisir la région, et l'accès au reste du jeu attend ce choix. Les
  villes de test reçoivent une région dans `villes-de-test.json`.
- **Changer de région** : possible **une fois tous les 30 jours**. Cela
  évite de sauter de région en région pour être premier quelque part.
- **Source des régions** : on prend le premier niveau de découpage
  officiel de chaque pays (norme ISO 3166-2), avec les noms en français
  et en anglais. Le Unicode CLDR fournit ces données gratuitement, sous
  licence libre. On retouche ensuite la liste pour les pays principaux :
  - **France** : les 13 régions de métropole, plus les 5 régions
    d'outre-mer ;
  - **Allemagne** : les 16 Länder ;
  - **Belgique** : 3 régions ;
  - **Suisse** : 26 cantons ;
  - **Canada** : provinces et territoires ;
  - **États-Unis** : 50 États et Washington DC ;
  - etc.
- **Pays sans découpage utile** (Monaco, Luxembourg, Malte, etc.) : une
  seule région, « Tout le pays ».
- Données : une table `regions` (id, pays, code ISO, nom_fr, nom_en) et
  une colonne `cities.region_id`, obligatoire pour toutes les nouvelles
  villes.

---

## 2. Les classements principaux (par habitants)

| Classement | Qui est comparé |
|---|---|
| 🌍 **Mondial** | toutes les villes |
| 🇫🇷 **National** | les villes d'un même pays (c'est lui qui désigne le président, règle actuelle) |
| 📍 **Régional** | les villes d'une même région |

Sur chaque classement, le joueur voit **toujours sa propre position**,
même s'il est 12 482ᵉ, avec les villes juste devant et juste derrière
lui. Le classement régional donne aux petites villes une vraie chance
d'être « première de sa région ».

*Idée à valider* : un titre de **gouverneur de région** pour la ville
n°1 de chaque région, sur le modèle du président du pays (badge et
historique, sans pouvoir particulier pour l'instant).

---

## 3. Les classements annexes

Chacun existe sur **4 périodes** (aujourd'hui, cette semaine, ce mois,
depuis toujours) et à **3 échelles** (monde, pays, région).

| Classement | Ce qu'on compare |
|---|---|
| 📈 Plus forte croissance | habitants gagnés |
| 📉 Plus éprouvées | habitants **perdus** (attaques, manifestations) |
| ✨ Plus influentes | influence gagnée |
| 🚶 Plus visitées | visites reçues |
| 🤝 Joueurs les plus généreux | visites **données** aux autres villes (classement de joueurs, pas de villes) |
| 🔗 Plus beaux jumelages | paires de villes jumelées, par bonus cumulé |
| 🛡️ Plus attaquées | attaques reçues |

Plus tard, avec le système de développement : ⚖️ villes les plus
équilibrées et 🏗️ mégaprojets construits. Et avec les pays : classement
**des pays** et **des régions** entre elles, par habitants cumulés.

**Choix délibéré** : pas de classement des « plus grands attaquants ».
Il récompenserait le harcèlement, alors que le cahier des charges
demande justement de le limiter. À rediscuter si Adrien le veut quand
même, par exemple uniquement pendant les guerres entre pays.

---

## 4. Comment ça marche (pour Claude Code)

- **Un bilan par ville et par jour** : table `city_stats_jour` avec la
  population en fin de journée, les habitants gagnés et perdus,
  l'influence, les visites reçues et données, les attaques reçues. Il
  est rempli au fil des événements (fonctions SQL existantes), pas
  recalculé à la volée. Les classements par période additionnent ces
  bilans.
- **Pas de calcul lourd à chaque affichage**. Les classements sont des
  vues SQL, que Supabase peut précalculer toutes les quelques minutes
  avec `pg_cron`, inclus dans l'offre gratuite. On affiche le **top 100**
  et la position du joueur.
- **Léger** : une page de classement ne charge que quelques Ko de
  données (règle « application légère »).
- **Les villes de test** remplissent les classements en recette. Les
  exclure de la production reste couvert par le test existant.
- **Tests** : un classement régional ne contient que des villes de la
  région, la position du joueur est juste même hors du top 100, le
  changement de région est refusé avant 30 jours, les villes de test
  sont absentes en production.

---

## 5. Découpage proposé

- **Jalon 8 — Se classer** : régions (choix à la création, rattrapage
  des villes existantes, changement tous les 30 jours) et classements
  principaux mondial, national et régional, avec « ma position ».
- **Jalon 8bis — Les palmarès** : bilans journaliers et classements
  annexes par période.

---

## 6. Questions pour Adrien

1. Le changement de région **une fois tous les 30 jours** te va ?
2. Le titre de **gouverneur de région**, oui ou non ?
3. D'accord pour **ne pas** faire de classement des plus grands
   attaquants ?
4. D'autres classements annexes en tête (« etc. etc. ») ?
