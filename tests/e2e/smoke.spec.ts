import { expect, test } from "@playwright/test";

/**
 * Test de fumée : l'app démarre et la page d'accueil s'affiche vraiment
 * dans un navigateur. Rôle équivalent à smoke_flight.gd chez CVLS —
 * attrape ce qu'un test unitaire ne voit pas (l'app qui ne démarre pas,
 * une page blanche).
 */
test("la page d'accueil se charge et affiche le titre", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "jeu_miniville"
  );
});

/**
 * Non-régression du bug vécu par Adrien les 24 et 25/09/2026
 * (docs/A-INTEGRER.md §9, docs/DECISIONS.md §4) : le service worker ne
 * doit jamais s'enregistrer pendant `npm run dev` (playwright teste
 * contre ce même mode), sous peine de mettre en cache des chunks
 * périmés à chaque HMR et de bloquer toute la page avec ERR_FAILED.
 */
test("le service worker ne s'enregistre pas en développement", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(500); // laisse le temps à l'effet client de s'exécuter
  const registrations = await page.evaluate(() => navigator.serviceWorker.getRegistrations());
  expect(registrations).toHaveLength(0);
});
