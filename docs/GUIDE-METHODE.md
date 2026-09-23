# Guide de méthode — projet "jeu_miniville" (nom de travail)

> Ce fichier décrit **la démarche et le mode de fonctionnement** du projet,
> pas le jeu lui-même : le jeu, lui, se raconte dans `DECISIONS.md`, et le
> plan d'avancement dans `ROADMAP.md`.
>
> Il est adapté de la méthode utilisée par Henri sur son propre projet
> (CVLS), à la demande d'Adrien, pour un jeu différent dans sa nature — un
> jeu social multijoueur en ligne, pas une simulation locale solo — mais
> avec la même exigence de rigueur.

---

## 1. Le projet en deux minutes

**Nom de travail : jeu_miniville** (à définir définitivement — voir §10 de
`DECISIONS.md`). Jeu social multijoueur de stratégie légère, inspiré de
l'esprit MiniVille / AntiVille. Chaque joueur possède une ville qui évolue
grâce aux interactions avec les autres joueurs, participe à la vie de son
pays, et prend chaque semaine des décisions diplomatiques à l'échelle
internationale.

- **Trois échelles** : Ville → Pays → Monde.
- **Boucle courte** : le jeu doit rester jouable en 2 à 5 minutes par jour.
- **Compétition sociale forte, sans système militaire complexe.**
- **Cible** : accessible sur mobile et PC, gratuitement, sans royalties.

Le cahier des charges complet (fourni par Adrien) reste la référence pour
le contenu du jeu ; ce guide ne couvre que la façon dont on travaille
dessus.

---

## 2. Choix techniques et pourquoi

Le cahier des charges d'Adrien proposait déjà une architecture ; on la
reprend telle quelle, elle est cohérente avec la contrainte "zéro coût,
zéro royalties" :

- **Frontend** : Next.js / React, packagé en **PWA** (installable sur
  écran d'accueil mobile et PC, fonctionne dans n'importe quel navigateur).
  Pas de compte développeur payant nécessaire à ce stade.
- **Backend et base de données** : Supabase (PostgreSQL managé), niveau
  gratuit.
- **Authentification** : Supabase Auth.
- **Hébergement** : Vercel (niveau gratuit) pour le frontend, Supabase pour
  le backend.
- **Code source** : dépôt **GitHub privé, gratuit** (choix d'Adrien) —
  Vercel s'y connecte pour déployer automatiquement à chaque push sur la
  branche principale.

**Point de vigilance, à consigner et surveiller** : les niveaux gratuits de
Supabase et Vercel ont des limites (stockage, requêtes, utilisateurs actifs
par mois). Ce n'est ni un logiciel payant ni une royalty — c'est un plafond
d'usage. Tant qu'on est en développement et en petite communauté de test,
on ne le touchera pas. Si le jeu grossit, ce sera un point à trancher par
Adrien (passer à un palier payant, ou plafonner l'accès). Suivi dans
`DECISIONS.md` §7.

**Boutique d'applications (App Store / Play Store)** : non prévu au
démarrage. La PWA couvre "fonctionne sur Android, iOS et PC" sans frais.
Si Adrien veut plus tard une vraie présence sur les stores, ça demandera un
compte développeur Apple payant (~99 $/an) et un compte Google (25 $ une
fois) — décision explicitement repoussée, notée en point ouvert.

---

## 3. Qui décide quoi

C'est le cœur du mode de fonctionnement.

| | Rôle |
|---|---|
| **Adrien** | Décide. Périmètre, design de jeu, dureté des mécaniques AntiVille, ce qui est amusant, l'équilibrage. Et **recette** : c'est lui qui joue et qui juge. |
| **Claude (chat/web)** | Sert à réfléchir et consolider les décisions avant qu'elles deviennent du code. |
| **Claude Code** | Implémente. Écrit les tests. Écrit le journal (`DECISIONS.md`). Écrit le cahier de recette. **Ne tranche pas d'architecture ou de design tout seul.** |

**La règle qui tient tout** : en cas d'ambiguïté ou de point non couvert
par `DECISIONS.md`, on **signale le point ouvert** au lieu de choisir à la
place d'Adrien.

**L'exception, et sa contrepartie** : Adrien peut déléguer explicitement
(*« tranche selon tes reco »*). Dans ce cas la décision est prise, mais
elle est **consignée avec son raisonnement complet** dans `DECISIONS.md`
§10, précisément pour pouvoir être contestée d'un mot plus tard.

Dernier point de méthode : si un jalon proposé est trop gros, on **le dit
et on propose un redécoupage**, plutôt que d'encaisser en silence.

---

## 4. `DECISIONS.md` — la source de vérité

Versionné avec le code, à la racine du dépôt. Sa structure (voir le fichier
lui-même pour le détail) :

- **§1 à §3** : contraintes fondatrices, périmètre, environnement
  technique.
- **§4** : le **journal des jalons** — un jalon = une entrée, qui dit ce
  qui a été fait, **pourquoi**, ce qui a été testé, et les bugs trouvés en
  route (y compris ceux introduits par Claude Code lui-même).
- **§5** : i18n.
- **§6** : méthode de travail (tests, recette).
- **§7** : versionnage, infra et coûts (suivi des paliers gratuits).
- **§8** : réservé (extensions futures).
- **§9** : ambitions long terme (stores, notifications, etc.).
- **§10** : points ouverts, avec qui doit les trancher.

**Le ton** : ce n'est pas une doc de release, c'est **un journal honnête**.
On y écrit ce qui n'a pas marché du premier coup, pas seulement les
réussites.

`ROADMAP.md` est le complément : il contient les jalons **à venir**, pas
encore réalisés. Une fois un jalon terminé, son résumé migre dans le
journal de `DECISIONS.md`.

---

## 5. Les jalons

Roadmap agile, itérations courtes, **un livrable testable à chaque fois**.

Deux familles, comme chez Henri :

- **Jalons de contenu** — quelque chose de neuf est jouable (« fonder sa
  ville », « voter pour son pays », « la première rivalité »).
- **Jalons techniques** — consolider la base (auth, anti-triche côté
  serveur, performance) sans ajouter de contenu visible.

Chaque jalon est nommé avec des mots de tous les jours, pas de jargon —
convention reprise telle quelle : le titre doit dire au joueur ce qui
change pour lui.

Le détail du découpage MVP est dans `ROADMAP.md`.

---

## 6. Git et GitHub

- Dépôt **GitHub privé**, créé par Adrien (compte gratuit).
- `git push` sur la branche principale → déploiement automatique via
  Vercel.
- **Tags SemVer**, un tag annoté par jalon validé :
  - `0.x.0` — phase de développement, un jalon = une mineure.
  - `0.x.y` — correctif sur un jalon déjà tagué.
  - `1.0.0` — première mise en ligne publique du jeu au périmètre MVP
    décidé dans `DECISIONS.md`.
- **Messages de commit** : titre court (`Jalon N: nom du jalon`), corps en
  prose qui explique *pourquoi*, pas seulement *quoi* — décisions,
  arbitrages, bugs trouvés. Contrairement à CVLS, pas de contrainte
  d'encodage Windows/Git ici : les accents sont bienvenus partout, y
  compris dans les commits.
- Signature de commit : `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
  Adrien est l'auteur, Claude est co-auteur. Pas d'obligation de cacher ni
  de mettre en avant que le projet est fait avec une IA.

---

## 7. Les tests

Le projet change d'écosystème (JavaScript/TypeScript, pas GDScript), donc
les outils changent, mais **l'esprit reste identique** :

- **Tests unitaires** : Vitest (logique de jeu : calcul de population,
  d'influence, de ressources, de résultats de vote/guerre).
- **Tests d'intégration / bout-en-bout** : Playwright (parcours joueur
  réel : créer une ville, se connecter à une autre, voter).
- **Plus jamais de test jetable.** Un jalon protège tous les précédents ;
  aucun test n'est supprimé "pour faire propre" avant un commit.
- **Vérification rouge par sabotage** : à chaque jalon sensible (calcul de
  score, anti-triche, résultats de guerre), on casse volontairement une
  règle du jeu et on vérifie que les tests concernés passent au rouge. Le
  compte est consigné dans le journal (`DECISIONS.md` §4), comme chez
  Henri : *« N tests, M vérifications rouges par tant de sabotages »*.
- **Anti-triche côté serveur** : toute règle qui a un impact sur le
  classement ou les ressources d'un joueur est validée côté serveur
  (Supabase / fonctions edge), jamais seulement côté client. C'est explicite
  dans le cahier des charges (§26) et non négociable.

---

## 8. La recette

À la fin de chaque jalon, Claude Code fournit un **mini cahier de
recette** dans `docs/recette-jalon-N.md` : quoi lancer, quelles actions
faire, quel résultat attendre.

Deux sections à toujours inclure :

- **« Ce qu'il faut juger »** — questions où l'avis humain est le
  livrable (*« est-ce que gagner de l'influence se sent gratifiant ? »*).
- **« ⚠ Points à trancher »** — endroits où Claude Code a tranché seul
  faute de réponse (ex. seuils exacts d'évolution visuelle, nombre de
  jumelages actifs autorisés), en attente de validation d'Adrien.

Comme chez Henri : *« dis-moi précisément quelle ligne t'a manqué ou
trompé, pas "améliore l'UI" en général. »*

### Les villes de test

Un jeu de **villes fictives** (`supabase/seed/villes-de-test.json`,
24 villes au départ) sert à tous les essais : rendu, classements,
interactions. Elles couvrent tous les stades (du Hameau à la Métropole)
et plusieurs pays, avec en priorité la France et l'Allemagne pour le
scénario de rivalité du cahier des charges.

Règles :
- **Jamais en production.** Chaque ville de test porte `is_test = true` et
  un pseudo préfixé `test_` ; elles ne sont chargées que dans les
  environnements de développement et de recette, par un script dédié. Un
  test automatique vérifie qu'aucune donnée `is_test` n'existe en prod.
- **Chaque jalon enrichit le jeu de données** avec ce dont il a besoin
  (influence au Jalon 4, attaques AntiVille au 5, jumelages au 6, votes et
  présidents plus tard). Le fichier est versionné et ses résultats
  attendus aussi (ex. `presidents_attendus`) : c'est une référence pour
  les tests, pas seulement un décor.
- **Un script de simulation** ("simuler N jours") fera agir ces villes
  entre elles (connexions, influence, attaques) pour tester les
  classements et les interactions sans attendre de vrais joueurs. Il
  arrive avec le Jalon 3, quand les connexions existent.
- Les cahiers de recette citent des villes de test précises ("visite
  Rochemaure, 9 100 connexions, stade Ville") pour que chaque essai soit
  reproductible.

---

## 9. Conventions à connaître

- **i18n dès le premier texte** : toute chaîne affichée passe par une clé
  lisible et **les deux traductions, fr et en, sont remplies
  immédiatement**. Défaut : français.
- **Jamais de valeur écrite en dur qui devrait venir du serveur** :
  population, influence, classement affichés côté client sont toujours une
  lecture de l'état serveur, jamais un calcul recalculé côté client (risque
  de triche et d'incohérence).
- **Sauvegardes / état persistant en base versionnée** (migrations SQL
  numérotées et versionnées avec le code), jamais de schéma modifié à la
  main en prod sans migration écrite.
- **Pas de contrôle qui suppose un type d'appareil précis** : penser
  tactile et souris/clavier dès le départ, l'app tourne sur les deux.
- **Équilibrage** : les principes du cahier des charges (§31) sont la
  référence — jamais de destruction permanente d'une ville par un seul
  joueur, l'activité compte plus que le nombre de comptes, les petits pays
  doivent pouvoir gagner par l'alliance et la stratégie.

---

## 10. Pour démarrer

1. Lire `DECISIONS.md` §1 à §3 (contraintes et périmètre) et §10 (points
   ouverts).
2. Lire `ROADMAP.md` pour voir le jalon en cours.
3. Si tu touches au code : un jalon, un livrable testable, des tests non
   jetables, une vérification rouge par sabotage sur les parties sensibles,
   une entrée dans `DECISIONS.md`, un mini cahier de recette, un tag.

**Ce qui attend explicitement une décision d'Adrien** (le § 10 de
`DECISIONS.md` fait la liste vivante, mais les gros points connus dès le
départ) : le nom définitif du jeu, l'identité visuelle des villes
(placeholder au début), la dureté exacte des mécaniques AntiVille, les
seuils d'équilibrage (actions/jour, coûts de guerre), et la stratégie
premium/publicité (volontairement repoussée par le cahier des charges).
