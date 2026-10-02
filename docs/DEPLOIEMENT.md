# Mise en ligne de jeu_miniville — guide pas à pas

Document de préparation (02/10/2026). **Rien n'a été déployé ni payé** : ce
guide dit ce qui est prêt côté code, ce que tu dois faire toi-même (comptes
à ton nom) et les décisions à prendre avant. Toute dépense reste soumise à
ton accord explicite (`CLAUDE.md`, `DECISIONS.md` §1 point 1).

## 1. Ce qui est déjà vérifié côté code

- `npm run build` réussit (19 routes, 0 erreur de type ni de lint). Poids :
  ~122 Ko de JavaScript au premier chargement de « Ma ville », Three.js est
  chargé à part, en différé.
- Le build de production a été **essayé pour de vrai** : `next start`, puis
  25 tests de parcours réels (connexion, création de ville, visites, choix
  d'activité, page publique, suivi, zonage) tous verts contre ce build.
- Pages publiques en production : accueil, règles, journal du monde, page
  d'une ville (`/v/<id>`). Pages protégées : redirection vers la connexion.
- **`/dev/showroom` (outil de développement) renvoie 404 en production** :
  corrigé aujourd'hui, il était jusque-là publié tel quel.
- Aucune clé en dur : tout passe par 3 variables d'environnement (§3). La clé
  `service_role` n'est lue que côté serveur (`server-only`).
- `npm run schema:complet` assemble les 43 migrations en un seul fichier
  (`supabase/schema-complet.sql`, ~380 Ko, non versionné) pour initialiser un
  projet Supabase **neuf** d'un seul collage. Il vérifie que les numéros se
  suivent sans trou.

## 2. Décisions à prendre (par toi) avant de commencer

1. **Un projet Supabase de production SÉPARÉ de celui de développement.**
   Le projet actuel contient des comptes et villes de test et sert aux tests
   automatiques (qui créent et suppriment des centaines de comptes) : il ne
   doit jamais être celui des vrais joueurs. Le garde-fou
   `tests/unit/pas-de-test-en-production.test.ts` attend justement ça.
2. **Hébergeur** : Vercel (prévu par le projet). Le plan gratuit
   « Hobby » **interdit l'usage commercial** : tant que le jeu est gratuit
   pour des amis testeurs, ça passe ; dès qu'il y a des packs payants ou de
   la publicité (voir `BATIMENTS-ET-PACKS.md` §5-6), il faudra le plan Pro
   (~20 $/mois) — **une dépense à valider à ce moment-là**.
3. **Adresse** : l'adresse gratuite `xxx.vercel.app` suffit pour tester. Un
   nom de domaine à toi est payant (≈ 10-15 €/an) : à ne prendre qu'avec ton
   accord. Attention : l'APK Android (§28) est lié à une adresse précise,
   changer d'adresse plus tard oblige à régénérer l'APK.
4. **E-mails de confirmation d'inscription** : le service e-mail intégré de
   Supabase est limité à **quelques e-mails par heure** (un test avec des
   amis suffit à le saturer). Pour de vrais inscrits il faut un service
   d'envoi à toi (SMTP) : plusieurs ont un palier gratuit, la création d'un
   compte chez eux est de ton côté. Alternative pour la phase de test entre
   amis : désactiver la confirmation d'e-mail dans Supabase (Authentication →
   Providers → Email → « Confirm email »). À toi de choisir.
5. **Région** : choisir la même région pour Supabase et Vercel (en Europe,
   par exemple). « Ma ville » fait ~26 requêtes à la suite : si le serveur et
   la base sont éloignés, la page devient lente.

## 3. Variables d'environnement (à saisir dans Vercel)

| Variable | Où la trouver | Exposée au navigateur ? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | oui (normal) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem, clé « anon / public » | oui (normal) |
| `SUPABASE_SERVICE_ROLE_KEY` | idem, clé « service_role » | **JAMAIS** : serveur seulement |

Ne jamais copier la clé `service_role` dans un message, un fichier versionné
ou un champ préfixé `NEXT_PUBLIC_`.

## 4. Déroulé (à faire dans cet ordre)

1. **Supabase** : créer un nouveau projet (région Europe). Dans l'éditeur SQL,
   coller **tout** le contenu de `supabase/schema-complet.sql`
   (`npm run schema:complet` pour le régénérer), l'exécuter, puis exécuter
   `notify pgrst, 'reload schema';` (sinon l'API ne voit pas les fonctions
   tout de suite — vu avec les migrations 0040 à 0042). Les pays et régions
   sont inclus dans les migrations (0002, 0009).
2. **Supabase → Authentication → URL Configuration** : « Site URL » = l'adresse
   publique du jeu ; ajouter la même adresse dans « Redirect URLs ». Sans ça,
   le lien dans l'e-mail de confirmation pointe vers `localhost`.
3. **Vercel** : importer le dépôt GitHub (`adriensaulme-prog/Jeu-miniville`),
   framework « Next.js » détecté automatiquement, saisir les 3 variables
   (§3), déployer. Choisir la région des fonctions proche de celle de
   Supabase.
4. **Vérifier** : ouvrir l'adresse publique, s'inscrire, créer une ville,
   visiter. Puis lancer le garde-fou contre la production :
   `VERIFIER_PROD=true npx vitest run tests/unit/pas-de-test-en-production.test.ts`
   avec les variables du projet de production dans l'environnement.
5. **Ne jamais** lancer `npm run seed:test` ni la suite Playwright contre la
   production (elles créent et suppriment des comptes en masse).

## 5. Après la mise en ligne

- Renseigner `DECISIONS.md` §7 (paliers gratuits Vercel et Supabase, tableau
  des dépenses) : les chiffres réels n'existent qu'après le déploiement.
- **Supabase gratuit** : le projet est mis en pause après environ une
  semaine sans activité, et la base est limitée (500 Mo). À surveiller avec
  les testeurs.
- Ensuite seulement : l'APK (§28) — Bubblewrap ou PWABuilder (gratuits),
  fichier `assetlinks.json` à publier sur l'adresse du jeu, et surtout
  **la clé de signature à conserver précieusement** (la perdre oblige à
  republier sous une autre identité d'application).
- Puis le Play Store : compte développeur Google (25 $, une fois — **à
  valider**) et 12 testeurs pendant 14 jours consécutifs avant la mise en
  production.

## 6. Limites connues, à ne pas oublier

- Le nom affiché est « jeu_miniville (nom provisoire) » (manifeste, titre) ;
  un vrai nom est à choisir avant le Play Store.
- Pas d'image d'aperçu quand un lien est partagé dans une messagerie.
- Pas de notification poussée du navigateur (chantier à part).
- Le lien de confirmation d'e-mail ramène sur l'adresse du site (« Site URL »
  de Supabase), pas directement dans le jeu connecté : il n'y a pas de page
  de retour dédiée. Le compte est bien confirmé, le joueur se connecte
  ensuite. À vérifier pendant le premier essai réel (§4, étape 4).
