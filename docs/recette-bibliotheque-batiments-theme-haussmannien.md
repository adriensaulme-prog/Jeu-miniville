# Recette — Bibliothèque de bâtiments (4/4) : pack de thème Haussmannien

À jouer par Adrien. **Migration à appliquer cette fois** — la seule de
tout le chantier "bibliothèque de bâtiments", tout le reste était
purement front-end.

```bash
npm run dev
```

## ⚠ Avant de tester : migration à appliquer

Colle `supabase/migrations/0034_bibliotheque_batiments_theme_haussmannien.sql`
dans l'éditeur SQL de Supabase.

## Ce qu'il faut juger

1. **Sur "Ma ville"** : un nouveau sélecteur "Thème de la ville" à côté
   de la recommandation d'activité. Choisis "Haussmannien" puis
   "Appliquer" — les immeubles de ta ville prennent l'allure
   parisienne (façade pierre claire, garde-corps en fer forgé, étage
   mansardé en zinc).
2. **Pack partiel, comme prévu par le document** : seuls les immeubles
   changent d'aspect. Les maisons et les tours restent "classique" —
   Haussmann, c'est avant tout des immeubles parisiens, pas des
   pavillons ni des gratte-ciel.
3. **Les visiteurs voient TON thème** : si tu vas voir une autre ville
   (`/villes`), c'est le thème choisi par SON maire qui s'affiche, pas
   le tien.
4. **Pas de restriction pour l'instant** : n'importe quel joueur peut
   choisir Haussmannien librement, gratuitement — il n'y a pas encore
   de boutique/paiement dans le jeu (viendra plus tard, voir
   `docs/BATIMENTS-ET-PACKS.md` §5-6). Dis-moi si tu veux que je
   restreigne ça en attendant (ex. comptes de test uniquement).
5. **Rien d'autre ne change** : c'est purement cosmétique, aucun bonus
   de jeu lié au thème choisi.

## Tests automatisés couvrant ce jalon

```bash
npm test  # dont tests/unit/catalogue.test.ts (pack haussmannien)
npm run test:e2e  # dont tests/e2e/jalon-bibliotheque-theme-haussmannien.spec.ts
```
