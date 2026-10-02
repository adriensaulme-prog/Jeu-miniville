import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 13 ter — trois retours de test d'Adrien regroupés
 * (docs/A-INTEGRER.md §14/§15/§16, 26/09/2026), tous liés au mécanisme
 * de visite du Jalon 13 bis :
 * - §16 : visiter sa propre ville est désormais autorisé (déviation
 *   assumée du cahier des charges §3, même précédent que le délai/
 *   plafond du Jalon 13 bis) — même délai d'une heure et plafond de
 *   3/jour, aucune règle spéciale.
 * - §15 (partie A) : la visite (autre ville ou la sienne) se compte
 *   automatiquement en ouvrant la page, plus de bouton "Visiter" à
 *   cliquer (voir src/components/VisiteAutomatique.tsx).
 * - §14 : le panneau flottant du bas peut être réduit sur mobile pour
 *   voir la ville derrière (voir src/components/PanneauFlottant.tsx).
 *
 * Client service_role recréé ici pour la même raison que les specs des
 * jalons précédents ("server-only" hors du pipeline Next.js).
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function creerCompteAvecVille(prefixe: string) {
  const email = `${prefixe}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const motDePasse = "mot-de-passe-test-e2e";
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: motDePasse,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`Impossible de créer ${prefixe} : ${error?.message}`);
  }
  const userId = data.user.id;

  const { data: ville, error: erreurVille } = await supabaseAdmin.rpc("creer_ville", {
    p_owner_id: userId,
    p_pseudo: `${prefixe}-${Math.random().toString(36).slice(2, 6)}`,
    p_country_id: "FR",
    p_nom_ville: `${prefixe}-ville-${Math.random().toString(36).slice(2, 6)}`,
  });
  if (erreurVille) {
    throw new Error(`Impossible de créer la ville de ${prefixe} : ${erreurVille.message}`);
  }

  return { userId, email, motDePasse, villeId: ville.id as string, villeNom: ville.nom as string };
}

async function supprimerCompte(userId: string) {
  await supabaseAdmin.auth.admin.deleteUser(userId);
}

async function connecter(page: import("@playwright/test").Page, email: string, motDePasse: string) {
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(motDePasse);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

test.describe.configure({ mode: "serial" });

test.describe("Jalon 13 ter — visite automatique", () => {
  test("sabotage : visiter sa propre ville est désormais autorisé, avec le même délai et le même plafond", async () => {
    const joueur = await creerCompteAvecVille("j13ter-auto");
    try {
      const { error: e1 } = await supabaseAdmin.rpc("visiter_ville", {
        p_visiteur_id: joueur.userId,
        p_ville_id: joueur.villeId,
      });
      expect(e1).toBeNull(); // §16 : plus de P0005 pour l'auto-visite

      const { error: erreurDelai } = await supabaseAdmin.rpc("visiter_ville", {
        p_visiteur_id: joueur.userId,
        p_ville_id: joueur.villeId,
      });
      expect(erreurDelai?.code).toBe("P0018"); // le délai s'applique pareil qu'à une autre ville

      const { data: ville } = await supabaseAdmin
        .from("cities")
        .select("population")
        .eq("id", joueur.villeId)
        .single();
      expect(ville?.population).toBe(2); // 1 (départ) + 1 auto-visite
    } finally {
      await supprimerCompte(joueur.userId);
    }
  });

  test("la page /ville compte une auto-visite automatiquement, sans bouton", async ({ page }) => {
    test.setTimeout(60_000);
    const joueur = await creerCompteAvecVille("j13ter-ui-auto");
    try {
      await connecter(page, joueur.email, joueur.motDePasse);
      await expect(page).toHaveURL(/\/ville$/, { timeout: 20_000 });

      await expect(page.getByRole("button", { name: "Visiter" })).toHaveCount(0);
      await expect(page.getByText("0/3")).toBeVisible();
      // Timeouts généreux (15 s, pas 8 s) : la scène 3D en arrière-plan
      // peut ralentir le thread principal (GPU stall observé en
      // environnement de test headless) et repousser le déclenchement du
      // minuteur de ~2,5 s bien au-delà de sa valeur nominale.
      await expect(page.getByText("Visite comptée, +1 population.")).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText("1/3")).toBeVisible({ timeout: 15_000 });

      const { data: ville } = await supabaseAdmin
        .from("cities")
        .select("population")
        .eq("id", joueur.villeId)
        .single();
      expect(ville?.population).toBe(2); // 1 (départ) + 1 auto-visite
    } finally {
      await supprimerCompte(joueur.userId);
    }
  });

  test("sur mobile, le panneau flottant peut être réduit pour voir la ville derrière", async ({ page }) => {
    const joueur = await creerCompteAvecVille("j13ter-panneau");
    try {
      await page.setViewportSize({ width: 375, height: 812 });
      await connecter(page, joueur.email, joueur.motDePasse);
      await expect(page).toHaveURL(/\/ville$/, { timeout: 20_000 });

      const poignee = page.getByRole("button", { name: "Réduire le panneau" });
      await expect(poignee).toBeVisible();
      await expect(page.getByRole("heading", { name: joueur.villeNom })).toBeVisible();

      await poignee.click();
      await expect(page.getByRole("heading", { name: joueur.villeNom })).toBeHidden();
      await expect(page.getByRole("button", { name: "Agrandir le panneau" })).toBeVisible();

      await page.getByRole("button", { name: "Agrandir le panneau" }).click();
      await expect(page.getByRole("heading", { name: joueur.villeNom })).toBeVisible();
    } finally {
      await supprimerCompte(joueur.userId);
    }
  });
});
