# jeu_miniville (nom provisoire)

Jeu social multijoueur de stratégie légère — développe ta ville, fais
vivre ton pays, pèse sur les décisions internationales.

- Le **quoi** et le **pourquoi** du jeu : `docs/cahier-des-charges.pdf`.
- La **méthode de travail** (qui décide quoi, tests, recette, git) :
  `docs/GUIDE-METHODE.md`.
- Le **journal de décisions** (source de vérité, jalon par jalon) :
  `docs/DECISIONS.md`.
- Le **plan d'avancement** (jalons à venir) : `docs/ROADMAP.md`.

## Stack technique

Next.js (App Router, TypeScript) + Supabase (PostgreSQL, Auth) + Vercel,
en PWA. Tout sur niveaux gratuits — voir `docs/DECISIONS.md` §1 et §7.

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis remplir avec les clés de ton projet Supabase
npm run dev                  # http://localhost:3000
```

## Tests

```bash
npm test          # tests unitaires (Vitest)
npm run test:e2e  # tests bout-en-bout (Playwright) — nécessite npx playwright install la première fois
```

## Prochaines étapes (à faire une fois, par toi — nécessite un accès
Internet que cette session Claude n'a pas depuis ton dossier connecté)

1. `npm install` dans ce dossier.
2. Créer un projet gratuit sur [supabase.com](https://supabase.com), copier
   l'URL et les clés dans `.env.local` (voir `.env.example`).
3. Créer un dépôt **privé** sur [github.com](https://github.com/new), puis :
   ```bash
   git remote add origin <url-de-ton-depot>
   git push -u origin main
   ```
4. Connecter le dépôt sur [vercel.com](https://vercel.com) pour le
   déploiement automatique à chaque push.

Le détail de chaque jalon est dans `docs/ROADMAP.md` — le Jalon 1
(« Naître quelque part ») est le prochain à construire.
