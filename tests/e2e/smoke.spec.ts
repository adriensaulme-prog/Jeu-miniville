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
