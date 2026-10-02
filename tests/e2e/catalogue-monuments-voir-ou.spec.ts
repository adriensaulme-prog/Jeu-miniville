import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { cleDe, emplacementMonument } from "../../src/lib/ville3d/emplacements";

/**
 * A-INTEGRER §25 : catalogue complet des 16 monuments sur /ville
 * (débloqués / verrouillés avec leur seuil) et « Voir où il est » qui
 * amène la caméra 3D sur le monument. Client service_role recréé ici
 * pour la même raison que les specs des jalons précédents
 * ("server-only" hors du pipeline Next.js).
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const suffixe = () => Math.random().toString(36).slice(2, 6);

test.describe.configure({ mode: "serial" });

test("le catalogue liste les 16 monuments, verrouillés avec leur seuil, et « Voir où il est » cible le bon emplacement", async ({ page }) => {
  test.setTimeout(120_000);
  const email = `cat-mon-${Date.now()}-${suffixe()}@example.com`;
  const motDePasse = "mot-de-passe-test-e2e";
  const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password: motDePasse, email_confirm: true });
  if (error || !data.user) throw new Error(`Création du compte : ${error?.message}`);
  const userId = data.user.id;
  try {
    const { data: ville, error: erreurVille } = await supabaseAdmin.rpc("creer_ville", {
      p_owner_id: userId,
      p_pseudo: `catmon-${suffixe()}`,
      p_country_id: "FR",
      p_nom_ville: `catmon-ville-${suffixe()}`,
    });
    if (erreurVille) throw new Error(`Création de la ville : ${erreurVille.message}`);
    // 300 d'influence : paliers 10, 25, 50, 100, 250 franchis => 5 monuments, 11 verrouillés.
    await supabaseAdmin.from("cities").update({ influence: 300, influence_max: 300 }).eq("id", ville.id);

    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByLabel("Mot de passe").fill(motDePasse);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/ville$/, { timeout: 30_000 });

    const catalogue = page.locator("details.catalogue-monuments");
    await expect(catalogue.locator("summary")).toContainText("5/16");
    await catalogue.locator("summary").click();
    await expect(catalogue.locator("li")).toHaveCount(16);
    await expect(catalogue.locator("li.debloque")).toHaveCount(5);
    await expect(catalogue.locator("li.verrouille")).toHaveCount(11);
    // Le prochain verrouillé montre la progression ; les suivants juste leur seuil.
    await expect(catalogue.locator("li.verrouille").first()).toContainText("300 / 500");
    await expect(catalogue.locator("li.verrouille").nth(1)).toContainText("1 000");
    await expect(catalogue.getByRole("button", { name: /Voir où il est/ })).toHaveCount(5);

    // Clic sur le 3e monument débloqué (palier 2) : la scène reçoit son emplacement exact.
    await catalogue.getByRole("button", { name: /Voir où il est/ }).nth(2).click();
    const attendu = emplacementMonument(cleDe(ville.id as string), 2);
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-repere",
      `${Math.round(attendu.x)},${Math.round(attendu.z)}`
    );
  } finally {
    await supabaseAdmin.auth.admin.deleteUser(userId);
  }
});
