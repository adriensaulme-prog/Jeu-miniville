# Recette — Jalon 15 : « Jouable partout »

À jouer par Adrien — **cette recette est le vrai livrable de ce
jalon**, pas juste une relecture facultative : la vérification mobile
n'est pas faisable par Claude Code.

## Ce qu'il faut vérifier

1. **Sur PC** :
   ```bash
   npm run build
   npm start
   ```
   Ouvre `http://localhost:3000` dans Chrome (ou un autre navigateur
   basé Chromium) : une icône d'installation doit apparaître dans la
   barre d'adresse (souvent une icône "+" ou un écran avec une flèche).
   Installe l'app, vérifie qu'elle s'ouvre dans sa propre fenêtre (sans
   barre d'adresse ni onglets de navigateur).

2. **Sur mobile**, même Wi-Fi que ton PC (même méthode qu'au Jalon
   6bis) :
   - Trouve l'IP locale de ton PC (`ipconfig` sous Windows, cherche
     "Adresse IPv4").
   - Sur ton téléphone, ouvre `http://<cette IP>:3000` dans Chrome
     (Android) ou Safari (iOS) — le serveur doit tourner en mode
     production (`npm start`), pas `npm run dev`.
   - **Android/Chrome** : menu ⋮ → "Ajouter à l'écran d'accueil" (ou
     une bannière d'installation peut apparaître automatiquement).
   - **iOS/Safari** : bouton de partage (carré avec flèche) → "Sur
     l'écran d'accueil".
   - Lance l'app depuis l'icône ajoutée : elle doit s'ouvrir en plein
     écran, sans barre d'adresse Safari/Chrome.

3. **Mode hors-ligne dégradé** (PC ou mobile) : une fois l'app ouverte
   et une page ou deux visitées (ex. `/ville`, `/classement`), coupe le
   réseau (mode avion, ou Wi-Fi désactivé) et recharge la page — elle
   doit continuer à s'afficher (avec des données figées au moment de
   la dernière visite en ligne), pas une erreur de navigateur brute.
   Une page jamais visitée avant la coupure retombera sur l'écran
   d'accueil plutôt que sur une erreur — normal, c'est le comportement
   dégradé prévu.

## ⚠ Points à trancher

- **Rien de spécifique à ce jalon** — le manifest, les icônes et le
  service worker existaient déjà depuis le Jalon 0 ; ce jalon a
  surtout consisté à vérifier que tout tient debout et à rendre le
  service worker plus sûr (jamais de données de jeu périmées servies
  quand le réseau fonctionne). Si l'installation ou le hors-ligne ne
  se comportent pas comme décrit ci-dessus sur ton téléphone, dis-le —
  ce sera alors un vrai bug à corriger, pas un point de conception à
  trancher.

## Tests automatisés couvrant ce jalon

```bash
npm test
npm run test:e2e
```

Rien de nouveau à isoler ici : la suite complète existante
(`tests/e2e/smoke.spec.ts`) couvre déjà la non-régression du service
worker en développement (jamais enregistré, sous peine de bloquer les
rechargements). Sur cette machine, la suite complète est plus fiable
avec `npx playwright test --workers=1` qu'avec les 2 workers par
défaut.
