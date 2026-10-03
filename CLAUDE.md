# CLAUDE.md — jeu_miniville

Consignes lues automatiquement par Claude Code au début de chaque session.

## Au début de chaque session, et avant de commencer chaque jalon

1. Lire `docs/DECISIONS.md` (source de vérité), `docs/ROADMAP.md` et
   `docs/GUIDE-METHODE.md` (méthode : Adrien décide, Claude Code
   implémente, teste et documente).
2. **Lire `docs/A-INTEGRER.md`** : c'est la boîte aux lettres des
   décisions prises par Adrien côté Claude chat (Cowork). Pour chaque
   section pas encore intégrée :
   - l'intégrer dans `DECISIONS.md` / `ROADMAP.md` **sans écraser**
     l'existant ;
   - l'appliquer dans le jalon en cours si la note le demande ;
   - mettre à jour l'encadré « État de l'intégration » en haut de la
     note (section par section : fait, en cours, en attente d'Adrien).
3. Si une section contredit une décision déjà prise ou le travail en
   cours, **ne pas trancher seul** : le signaler à Adrien.

## Règles permanentes (détail dans DECISIONS.md)

- Aucun curseur ni bouton de triche dans le jeu jouable (population,
  heure) : ce sont des outils de maquette uniquement.
- Application légère : budget de poids (A-INTEGRER §4), pas de nouvelle
  dépendance, image ou modèle 3D sans décision d'Adrien.
- Jamais de destruction permanente d'une ville.
- **Ne jamais engager de dépense** (nom de domaine, service payant,
  abonnement, quota dépassé d'une offre gratuite) sans qu'Adrien l'ait
  validée au préalable, même pour un montant faible. Voir DECISIONS.md
  §1 point 1 (mis à jour le 25/09/2026 : "zéro coût" devient "toute
  dépense est possible mais doit être demandée avant").
- Pseudos et noms de ville uniques (A-INTEGRER §8).
- **Aucune vraie marque** (nom, logo, produit reconnaissable) dans un
  bâtiment, un monument, un mégaprojet ou un pack, sans validation
  explicite d'Adrien au cas par cas (A-INTEGRER §29).
- Les fichiers de `docs/SYSTEME-DEVELOPPEMENT.md`,
  `docs/BATIMENTS-ET-PACKS.md` marqués « à valider » ne se codent pas
  avant validation d'Adrien.
