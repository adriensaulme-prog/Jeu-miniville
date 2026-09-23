# Recette — Jalon 1 : « Naître quelque part »

À jouer par Adrien. Objectif : vérifier que le tout premier parcours du
jeu — créer un compte, fonder sa ville, voir ses statistiques — marche
et se sent juste.

## ⚠ Avant de commencer : deux réglages à faire toi-même

Cette session Claude Code n'a pas pu les faire à ta place (voir
`docs/DECISIONS.md` §10 points 7 et 8).

1. **Corriger la clé `anon` Supabase.** Dans `.env.local`, la ligne
   `NEXT_PUBLIC_SUPABASE_ANON_KEY=...` est rejetée par ton projet réel
   ("Invalid API key"). Va sur supabase.com → ton projet → *Project
   Settings* → *API*, recopie la clé **`anon` `public`**, remplace la
   valeur dans `.env.local`. (La clé `service_role`, elle, fonctionne
   déjà — pas besoin d'y toucher.)
2. **Appliquer les migrations.** Sur le tableau de bord Supabase → *SQL
   Editor* → *New query* : colle et exécute d'abord tout le contenu de
   `supabase/migrations/0001_jalon1_naitre_quelque_part.sql`, puis tout
   le contenu de `supabase/migrations/0002_jalon1_seed_pays.sql`.

Ensuite, à la racine du projet :

```bash
npm run dev
```

Ouvre `http://localhost:3000`.

## Ce qu'il faut juger

1. **Le tout premier écran** — le message et les deux boutons ("Créer un
   compte" / "Se connecter") donnent-ils envie de continuer, ou est-ce
   trop sec ?
2. **L'inscription** — crée un compte avec ta propre adresse e-mail.
   Reçois-tu bien un e-mail de confirmation Supabase ? Le message affiché
   après inscription ("Vérifie ta boîte mail…") est-il clair ?
3. **La connexion**, une fois le compte confirmé.
4. **La création de ville** — choisis un pseudo, un nom de ville, un
   pays dans la liste déroulante (tous les pays du monde y sont). Est-ce
   que chercher son pays dans une liste de 250 est pénible ? (Si oui,
   c'est un point à retrancher avec moi — la liste complète était ton
   choix explicite pour ce jalon.)
5. **La page de ville** — nom de la ville, pays, niveau ("Hameau"),
   population (doit valoir 1), influence et activité (doivent valoir 0).
   Est-ce que ça donne envie de voir la suite (Jalon 2 : la population
   qui grandit grâce aux autres joueurs) ?
6. **Le changement de langue** (FR/EN en haut de chaque page) — tous les
   textes basculent-ils correctement, y compris les noms de pays ?
7. **La déconnexion**, puis reconnexion — retombes-tu bien sur ta ville
   (pas sur le formulaire de création à nouveau) ?

## ⚠ Points à trancher (Claude Code a tranché seul faute de réponse)

- **Valeurs de départ d'une ville** : population = 1, influence = 0,
  activité = 0. Le cahier des charges ne précisait pas ces valeurs
  initiales — semblait le choix le plus neutre ("la ville existe, avec
  son fondateur").
- **Étendue de la liste de pays** : tu as tranché toi-même pour la
  liste complète (250 entrées ISO 3166-1, y compris quelques
  territoires non souverains comme l'Antarctique ou Mayotte, inclus
  dans la norme). À reconsidérer si elle s'avère pénible à l'usage
  (point 4 ci-dessus).
- **i18n fait maison** plutôt qu'une librairie comme `next-intl` : choix
  d'implémentation pour rester simple à deux langues. Si le jeu a besoin
  de pluriels, de formats de date localisés, etc. plus tard, ce sera à
  reconsidérer.

## Tests automatisés couvrant ce jalon

```bash
npm test           # tests unitaires (i18n, niveaux de ville)
npm run test:e2e   # parcours complet : connexion, création de ville, page de ville
```

`test:e2e` ne pourra passer qu'une fois les deux réglages ci-dessus
faits (clé `anon` + migrations).
