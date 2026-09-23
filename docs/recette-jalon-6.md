# Recette — Jalon 6 (couche données) : « La ville prend forme »

À jouer par Adrien. **Ce jalon ne livre pas encore de rendu 3D** — c'est
la couche données qui le prépare (voir `ROADMAP.md`, Jalon 6bis pour le
rendu lui-même). Rien de nouveau à voir visuellement, sauf les villes
de test qui apparaissent maintenant dans "Villes".

Aucun réglage préalable : tout est déjà en place, y compris le
chargement des villes de test (déjà fait depuis cette session).

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Va sur "Villes"** — 24 nouvelles villes doivent apparaître
   (Belval-sur-Loire, Neustadt-am-See, Rochemaure, Sakuragawa...),
   couvrant tous les stades du Hameau à la Métropole, avec plusieurs
   pays (France, Allemagne en tête, plus Belgique, Suisse, Canada,
   Japon). Vérifie que "Visiter", "Influencer", "Proposer un jumelage"
   et les actions AntiVille fonctionnent normalement sur elles — ce
   sont des villes comme les autres, juste fictives.
2. **Attaque une ville de test avec "Contamination"** — sa population
   doit baisser d'environ 10 %, mais si tu regardes juste après
   (recharge la page), son niveau visuel affiché ne doit **pas** avoir
   changé, même si la population est repassée sous un seuil. C'est le
   nouveau comportement : le niveau ne redescend jamais.
3. **Les seuils ont beaucoup changé** — une ville met maintenant
   1 000 habitants pour devenir "Village" (au lieu de 5 avant). Avec de
   vrais joueurs à ce stade du jeu, ça prendra du temps à voir en vrai ;
   les villes de test permettent de voir tous les stades tout de suite
   sans attendre.
4. **Rejoue ce script à volonté** si tu veux repartir d'un jeu de
   données propre (il supprime et recrée les 24 villes de test) :
   ```bash
   npm run seed:test
   ```
5. **Ressenti général** — avec l'échelle à 100 000 habitants pour
   Métropole, est-ce que la progression te semble avoir le bon rythme
   pour un jeu qui doit rester jouable en 2-5 minutes par jour ? (C'est
   la question qui compte le plus ici, plus que le rendu — qui arrive
   au prochain jalon.)

## ⚠ Points à trancher

Rien de nouveau cette fois — les deux décisions bloquantes de ce jalon
(Three.js, rendu basé sur `population_max`) ont déjà été tranchées par
toi en amont (voir `DECISIONS.md` §10 points 11 et 12, maintenant
clos). Un point näturellement ouvert reste à vérifier plus tard :

- **Fluidité sur mobile du rendu 3D** — pas testable avant que le
  Jalon 6bis existe.

## Tests automatisés couvrant ce jalon

```bash
npm test           # tests unitaires (nouveaux seuils 1000-100000)
npm run test:e2e   # seuils de niveau, contamination sans régression,
                    # géo/fuseau des pays, contrainte is_test/pseudo
```

Le test qui garantit l'absence de villes de test en production est
ignoré par défaut (aucun environnement de production distinct
n'existe encore) — voir le commentaire en tête de
`tests/unit/pas-de-test-en-production.test.ts`.
