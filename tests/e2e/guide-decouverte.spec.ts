import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * A-INTEGRER §26 F : guide de démarrage des nouveaux joueurs — carte non
 * bloquante en 5 étapes, progression mémorisée dans le navigateur, « Passer »
 * définitif, « Revoir le guide » sur la page des règles. Client
 * service_role recréé ici pour la même raison que les specs des jalons
 * précédents ("server-only" hors du pipeline Next.js).
 *
 * playwright.config.ts marque le guide « fini » pour toute la suite
 * (sinon il recouvrirait les écrans testés ailleurs) : ce fichier repart
 * d'un navigateur vierge.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const suffixe = () => Math.random().toString(36).slice(2, 6);

test.describe.configure({ mode: "serial" });

test.describe("Guide de démarrage (A-INTEGRER §26 F)", () => {
  test("un compte neuf voit le guide étape par étape, le retrouve après rechargement, puis le termine ou le passe pour de bon", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const email = `guide-${Date.now()}-${suffixe()}@example.com`;
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: "mot-de-passe-test-e2e",
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(`Création du compte : ${error?.message}`);
    try {
      const { error: erreurVille } = await supabaseAdmin.rpc("creer_ville", {
        p_owner_id: data.user.id,
        p_pseudo: `guide-${suffixe()}`,
        p_country_id: "FR",
        p_nom_ville: `guide-ville-${suffixe()}`,
      });
      expect(erreurVille).toBeNull();

      const carte = page.getByRole("note", { name: "Guide de démarrage" });

      // Pas de guide sur la page de connexion.
      await page.goto("/connexion");
      await expect(page.getByLabel("Adresse e-mail")).toBeVisible();
      await expect(carte).toHaveCount(0);

      await page.getByLabel("Adresse e-mail").fill(email);
      await page.getByLabel("Mot de passe").fill("mot-de-passe-test-e2e");
      await page.getByRole("button", { name: "Se connecter" }).click();
      await expect(page).toHaveURL(/\/ville$/, { timeout: 30_000 });

      await expect(carte).toBeVisible({ timeout: 20_000 });
      await expect(carte).toContainText("1/5");
      await expect(carte).toContainText("Bienvenue");

      await carte.getByRole("button", { name: "Suivant" }).click();
      await expect(carte).toContainText("2/5");
      await expect(carte.getByRole("link", { name: /Aller aux Villes/ })).toBeVisible();

      // La progression survit à un rechargement ET à un changement de page.
      await page.goto("/classement");
      await expect(carte).toContainText("2/5", { timeout: 20_000 });
      await page.reload();
      await expect(carte).toContainText("2/5", { timeout: 20_000 });

      for (const n of [3, 4, 5]) {
        await carte.getByRole("button", { name: "Suivant" }).click();
        await expect(carte).toContainText(`${n}/5`);
      }
      await expect(carte.getByRole("button", { name: "Terminer" })).toBeVisible();
      await expect(carte.getByRole("link", { name: /Lire les règles/ })).toBeVisible();
      await carte.getByRole("button", { name: "Terminer" }).click();
      await expect(carte).toHaveCount(0);
      await page.reload();
      await expect(page.getByRole("button", { name: "Se déconnecter" })).toBeVisible({ timeout: 20_000 });
      await expect(carte).toHaveCount(0);

      // « Revoir le guide » sur la page des règles : retour à l'étape 1, sur Ma ville.
      await page.goto("/regles");
      await expect(carte).toHaveCount(0); // pas de carte sur les règles
      await page.getByRole("button", { name: "Revoir le guide de démarrage" }).click();
      await expect(page).toHaveURL(/\/ville$/, { timeout: 30_000 });
      await expect(carte).toContainText("1/5", { timeout: 20_000 });

      // « Passer » : disparaît pour de bon.
      await carte.getByRole("button", { name: "Passer le guide" }).click();
      await expect(carte).toHaveCount(0);
      await page.goto("/villes");
      await expect(page.getByRole("button", { name: "Se déconnecter" })).toBeVisible({ timeout: 20_000 });
      await expect(carte).toHaveCount(0);
    } finally {
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    }
  });
});
