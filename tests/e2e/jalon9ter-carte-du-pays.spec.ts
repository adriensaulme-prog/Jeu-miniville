import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 9 ter : la page Pays affiche une carte illustrée du pays à la
 * place du fond 3D (docs/CARTE-DU-PAYS.md, docs/DECISIONS.md §4).
 * Client service_role recréé ici pour la même raison que les specs des
 * jalons précédents ("server-only" hors du pipeline Next.js).
 *
 * Pas de vérification rouge par sabotage : cette carte est un habillage
 * visuel (pas de score, de ressource ni d'anti-triche en jeu) — les
 * assertions vérifient directement le rendu et la navigation réels.
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function creerCompteAvecVille(prefixe: string, paysId: string, regionId: string, population = 1) {
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
    p_pseudo: prefixe,
    p_country_id: paysId,
    p_nom_ville: `${prefixe}-ville`,
    p_region_id: regionId,
  });
  if (erreurVille) {
    throw new Error(`Impossible de créer la ville de ${prefixe} : ${erreurVille.message}`);
  }

  if (population !== 1) {
    const { error: erreurPop } = await supabaseAdmin
      .from("cities")
      .update({ population, population_max: population })
      .eq("id", ville.id);
    if (erreurPop) throw new Error(`Impossible de fixer la population de ${prefixe} : ${erreurPop.message}`);
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

test.describe("Jalon 9 ter — la carte du pays", () => {
  test("affiche une carte cliquable pour un pays à régions réelles, et navigue au clic sur une ville", async ({
    page,
  }) => {
    // Premier test du fichier à toucher le navigateur : /connexion,
    // /ville et /pays se compilent tous à froid — plus que les 20 s
    // habituels sur un serveur qui vient de démarrer (même cause que
    // Jalon 9, 10 et 11, voir DECISIONS.md §4).
    test.setTimeout(90_000);
    const joueur = await creerCompteAvecVille("carte-fr", "FR", "fr-bre", 9_000_000);
    try {
      await connecter(page, joueur.email, joueur.motDePasse);
      await expect(page).toHaveURL(/\/ville$/, { timeout: 40_000 });

      await page.goto("/pays");
      await expect(page.getByRole("heading", { name: "France" })).toBeVisible({ timeout: 20_000 });

      // La carte SVG doit contenir au moins une région ET un marqueur
      // cliquable menant à Ma ville (le joueur, très peuplé, domine
      // forcément sa région et devient président).
      const carte = page.locator("svg.carte-pays-svg");
      await expect(carte).toBeVisible();
      const chemins = carte.locator("path");
      expect(await chemins.count()).toBeGreaterThan(5); // plusieurs régions dessinées

      // "/ville" existe aussi dans la nav (bureau + mobile, cette
      // dernière cachée mais présente dans le DOM) et dans la liste
      // "villes principales" : on cible la pastille de la carte
      // précisément.
      const lienMaVille = carte.locator('a[href="/ville"]');
      await expect(lienMaVille).toHaveCount(1);
      await lienMaVille.click();
      await expect(page).toHaveURL(/\/ville$/);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(joueur.villeNom);
    } finally {
      await supprimerCompte(joueur.userId);
    }
  });

  test("un pays sans carte générée retombe sur une simple vignette, sans erreur", async ({ page }) => {
    test.setTimeout(60_000);
    // La Guadeloupe (GP) n'a pas de contour dans les données sources
    // (hors couverture world-atlas à cette échelle) — voir
    // scripts/generer-cartes-pays.mjs et DECISIONS.md §4.
    const joueur = await creerCompteAvecVille("carte-vignette", "GP", "gp-tout");
    try {
      await connecter(page, joueur.email, joueur.motDePasse);
      await expect(page).toHaveURL(/\/ville$/, { timeout: 20_000 });

      await page.goto("/pays");
      await expect(page.locator(".carte-pays-vignette")).toBeVisible({ timeout: 20_000 });
      await expect(page.locator("svg.carte-pays-svg")).toHaveCount(0);

      const erreurs: string[] = [];
      page.on("pageerror", (e) => erreurs.push(e.message));
      await page.waitForTimeout(300);
      expect(erreurs).toEqual([]);
    } finally {
      await supprimerCompte(joueur.userId);
    }
  });
});
