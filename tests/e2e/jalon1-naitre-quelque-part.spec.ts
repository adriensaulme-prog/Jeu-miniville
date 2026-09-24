import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Parcours réel du Jalon 1 : connexion → création de la ville (pseudo,
 * nom, pays) → page de ville affichant population/influence/activité et
 * le niveau de départ (Hameau). Utilise un compte créé et pré-confirmé
 * via l'API admin Supabase (service_role), pour ne pas dépendre du
 * réglage "confirmation d'e-mail" du projet ni d'une vraie boîte mail —
 * voir docs/recette-jalon-1.md pour le test manuel du vrai formulaire
 * d'inscription, que ce test ne couvre pas.
 *
 * Client service_role recréé ici (pas d'import de
 * src/lib/supabase/server.ts) : ce fichier charge "server-only", qui
 * lève une erreur dès qu'il est importé hors du pipeline de build
 * Next.js (webpack/turbopack le neutralise sélectivement selon le
 * bundle ; le runner de test de Playwright n'a pas cette magie).
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Les deux tests partagent un seul compte (le second vérifie l'état
// laissé par le premier) : exécution forcée en série, sinon
// "fullyParallel" du config leur donnerait chacun leur propre worker et
// donc leur propre appel à createUser() avec le même e-mail en
// parallèle (conflit constaté : "Database error creating new user").
test.describe.configure({ mode: "serial" });

test.describe("Jalon 1 — naître quelque part", () => {
  const email = `jalon1-e2e-${Date.now()}@example.com`;
  const motDePasse = "mot-de-passe-test-e2e";
  let userId: string;

  test.beforeAll(async () => {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: motDePasse,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`Impossible de créer le compte de test : ${error?.message}`);
    }
    userId = data.user.id;
  });

  test.afterAll(async () => {
    if (userId) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    }
  });

  test("se connecter, fonder sa ville, voir ses statistiques", async ({ page }) => {
    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByLabel("Mot de passe").fill(motDePasse);
    await page.getByRole("button", { name: "Se connecter" }).click();

    // Deux sauts (connexion → /ville → redirection /ville/creer) : sur un
    // serveur de dev à froid, chaque route se compile à la demande et les
    // 5 s par défaut ne suffisent pas toujours (faux échec constaté trois
    // fois, voir DECISIONS.md §4, Jalon 7bis).
    await expect(page).toHaveURL(/\/ville\/creer$/, { timeout: 20_000 });

    await page.getByLabel("Ton pseudo").fill("Testeur");
    await page.getByLabel("Nom de ta ville").fill("Testopolis");
    await page.getByLabel("Pays").selectOption({ label: "France" });
    // Le sélecteur de région n'apparaît qu'une fois un pays choisi
    // (Jalon 8, CreerVilleForm.tsx) — voir tests/e2e/jalon8-se-classer.spec.ts
    // pour la couverture dédiée aux régions.
    await page.getByLabel("Ta région").selectOption({ label: "Île-de-France" });
    await page.getByRole("button", { name: "Fonder ma ville" }).click();

    await expect(page).toHaveURL(/\/ville$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Testopolis");
    // Ancré en début de texte : la ligne de région ("Région :
    // Île-de-France ·", Jalon 8) contient aussi "France ·" en sous-chaîne.
    await expect(page.getByText(/^France · \d{2}:\d{2}/)).toBeVisible();
    await expect(page.getByText("Hameau")).toBeVisible();
    await expect(page.getByText("Population")).toBeVisible();
    await expect(page.getByRole("main").getByText("1", { exact: true })).toBeVisible();
  });

  test("une ville déjà créée ne repasse pas par le formulaire de création", async ({
    page,
  }) => {
    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByLabel("Mot de passe").fill(motDePasse);
    await page.getByRole("button", { name: "Se connecter" }).click();

    // Attendre que la connexion (asynchrone) ait posé la session avant
    // de naviguer explicitement ailleurs, sinon /ville/creer ci-dessous
    // peut être atteint avant que le cookie de session n'existe.
    await expect(page).toHaveURL(/\/ville$/);

    await page.goto("/ville/creer");
    await expect(page).toHaveURL(/\/ville$/);
  });
});
