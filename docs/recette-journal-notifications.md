# Recette — A-INTEGRER §26 A et B : journal du monde et notifications

À jouer par Adrien. **Migration `0042` appliquée.**

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Journal du monde** : le lien **« Journal »** en haut (visible même sans
   être connecté). La page liste les faits marquants du jeu, du plus récent
   au plus ancien : une ville qui prend la tête de son pays (avec celle
   qu'elle dépasse), une guerre qui s'ouvre ou se termine, une alliance,
   un mégaprojet construit, un grand monument. Chaque ligne liée à une
   ville renvoie vers sa page publique.
2. **Notifications** : la **cloche 🔔** en haut, avec un chiffre rouge s'il
   y a du nouveau. La page **Notifications** montre ce qui concerne ta ville
   et ton pays ces 30 derniers jours : ta ville devient (ou cesse d'être)
   la n°1 de son pays, ton pays entre en conflit ou en sort, une alliance,
   un monument ou une technologie débloqués, une attaque subie. Les
   nouveautés sont marquées « Nouveau » **une seule fois** ; en quittant la
   page, la cloche repasse à zéro.
3. Un nouveau joueur **ne reçoit pas l'histoire du monde** : seulement ce
   qui s'est passé depuis la création de son compte.
4. Sur **téléphone**, le titre du jeu disparaît de la barre du haut (le
   logo reste) pour laisser la place à Journal, Règles, la cloche, la
   langue et « Se déconnecter ».

## À savoir avant de juger

- **Aucune nouvelle table** : le journal et les notifications lisent ce qui
  était déjà enregistré (présidences, guerres, alliances, événements de
  ville). L'historique d'avant ce chantier est donc déjà là.
- **Les attaques subies ne sont jamais publiques** : elles notifient le
  maire mais n'apparaissent pas dans le journal du monde.
- **Pas encore là**, parce que ces faits ne sont pas enregistrés : « tu
  viens de perdre ta place n°1 mondiale », « ton rival vient de te
  dépasser », « ton pays débloque une technologie » (les technologies sont
  par ville). Les ajouter demande de journaliser les changements de rang.
- **Pas de notification poussée du navigateur** (celle qui s'affiche quand
  le jeu est fermé) : c'est un chantier à part, avec permissions,
  abonnement et envoi côté serveur.
- Dans **ma base de développement**, le journal peut contenir des lignes
  étranges dues aux villes de test supprimées ; elles disparaissent d'elles-
  mêmes avec de vraies données.

## Tests automatisés couvrant ce chantier

```bash
npx vitest run tests/unit/journal.test.ts
npx playwright test tests/e2e/journal-notifications.spec.ts
```
