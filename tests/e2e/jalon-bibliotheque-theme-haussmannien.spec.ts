import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Bibliothèque de bâtiments (4/4) — premier pack de thème : Haussmannien
 * (docs/BATIMENTS-ET-PACKS.md §4, migration 0034). `cities.theme`,
 * choisi librement par le maire (pas de restriction de paiement pour
 * l'instant, voir l'en-tête de la migration). Client service_role
 * recréé ici pour la même raison que les specs des jalons précédents
 * ("server-only" hors du pipeline Next.js).
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
    p_pseudo: prefixe,
    p_country_id: "FR",
    p_nom_ville: `${prefixe}-ville`,
  });
  if (erreurVille) {
    throw new Error(`Impossible de créer la ville de ${prefixe} : ${erreurVille.message}`);
  }

  return { userId, email, motDePasse, villeId: ville.id as string };
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

test.describe("Bibliothèque de bâtiments (4/4) — thème Haussmannien", () => {
  test("sabotage : definir_theme_ville réservée au maire, refuse un thème invalide, par défaut classique", async () => {
    const maire = await creerCompteAvecVille("j-theme-maire");
    const intrus = await creerCompteAvecVille("j-theme-intrus");
    try {
      const { data: villeInitiale } = await supabaseAdmin
        .from("cities")
        .select("theme")
        .eq("id", maire.villeId)
        .single();
      expect(villeInitiale?.theme).toBe("classique");

      const { error: erreurIntrus } = await supabaseAdmin.rpc("definir_theme_ville", {
        p_owner_id: intrus.userId,
        p_ville_id: maire.villeId,
        p_theme: "haussmannien",
      });
      expect(erreurIntrus?.code).toBe("P0007");

      const { error: erreurInvalide } = await supabaseAdmin.rpc("definir_theme_ville", {
        p_owner_id: maire.userId,
        p_ville_id: maire.villeId,
        p_theme: "futuriste", // n'existe pas encore dans le catalogue
      });
      expect(erreurInvalide?.code).toBe("P0022");

      const { data: resultat, error } = await supabaseAdmin.rpc("definir_theme_ville", {
        p_owner_id: maire.userId,
        p_ville_id: maire.villeId,
        p_theme: "haussmannien",
      });
      expect(error).toBeNull();
      expect(resultat.theme).toBe("haussmannien");

      // Le thème est bien celui lu directement en base (pas seulement
      // dans la valeur de retour de la fonction).
      const { data: villeApres } = await supabaseAdmin.from("cities").select("theme").eq("id", maire.villeId).single();
      expect(villeApres?.theme).toBe("haussmannien");

      // Retour au classique fonctionne aussi.
      const { data: retour } = await supabaseAdmin.rpc("definir_theme_ville", {
        p_owner_id: maire.userId,
        p_ville_id: maire.villeId,
        p_theme: "classique",
      });
      expect(retour.theme).toBe("classique");
    } finally {
      await supprimerCompte(maire.userId);
      await supprimerCompte(intrus.userId);
    }
  });

  test("la page /ville permet de choisir le thème Haussmannien, la ville reste affichée sans erreur", async ({ page }) => {
    test.setTimeout(60_000);
    const maire = await creerCompteAvecVille("j-theme-ui");
    try {
      await connecter(page, maire.email, maire.motDePasse);
      await expect(page).toHaveURL(/\/ville$/, { timeout: 40_000 });

      await expect(page.getByText("Thème de la ville :")).toBeVisible({ timeout: 20_000 });
      await page.getByLabel("Thème de la ville :").selectOption("haussmannien");
      await page.getByRole("button", { name: "Appliquer" }).click();

      await expect(page).toHaveURL(/\/ville$/, { timeout: 20_000 });
      await expect(page.locator("select[name=theme]")).toHaveValue("haussmannien");

      const { data: ville } = await supabaseAdmin.from("cities").select("theme").eq("id", maire.villeId).single();
      expect(ville?.theme).toBe("haussmannien");
    } finally {
      await supprimerCompte(maire.userId);
    }
  });
});
