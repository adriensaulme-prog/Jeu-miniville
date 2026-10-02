import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * A-INTEGRER §25 (sous-jalon 25b, migration 0038) : les blocs ouverts
 * à partir de la migration naissent « zonés » (city_blocks.zonee = true),
 * les blocs déjà ouverts gardent zonee = false et leur emplacement.
 * Client service_role recréé ici pour la même raison que les specs des
 * jalons précédents ("server-only" hors du pipeline Next.js).
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const suffixe = () => Math.random().toString(36).slice(2, 6);

async function creerCompteAvecVille(prefixe: string) {
  const email = `${prefixe}-${Date.now()}-${suffixe()}@example.com`;
  const motDePasse = "mot-de-passe-test-e2e";
  const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password: motDePasse, email_confirm: true });
  if (error || !data.user) throw new Error(`Impossible de créer ${prefixe} : ${error?.message}`);
  const { data: ville, error: erreurVille } = await supabaseAdmin.rpc("creer_ville", {
    p_owner_id: data.user.id,
    p_pseudo: `${prefixe}-${suffixe()}`,
    p_country_id: "FR",
    p_nom_ville: `${prefixe}-ville-${suffixe()}`,
  });
  if (erreurVille) throw new Error(`Impossible de créer la ville de ${prefixe} : ${erreurVille.message}`);
  return { userId: data.user.id, email, motDePasse, villeId: ville.id as string };
}

const blocsDe = async (villeId: string) =>
  ((await supabaseAdmin.from("city_blocks").select("rang, vocation, zonee").eq("ville_id", villeId).order("rang")).data ?? []) as {
    rang: number;
    vocation: string;
    zonee: boolean;
  }[];

test.describe.configure({ mode: "serial" });

test.describe("Zonage des quartiers (A-INTEGRER §25, 25b)", () => {
  test("les blocs ouverts après la migration naissent zonés ; les blocs historiques restent non zonés et rien n'est retraité", async () => {
    const j = await creerCompteAvecVille("zonage-migration");
    try {
      // Ville « historique » : deux blocs déjà en base avant le zonage (zonee = false).
      await supabaseAdmin.from("city_blocks").insert([
        { ville_id: j.villeId, rang: 0, vocation: "residentiel", zonee: false },
        { ville_id: j.villeId, rang: 1, vocation: "commerce", zonee: false },
      ]);
      await supabaseAdmin.from("cities").update({ population_max: 5000 }).eq("id", j.villeId);
      const { error } = await supabaseAdmin.rpc("assigner_vocations_blocs", { p_ville_id: j.villeId });
      expect(error).toBeNull();

      const blocs = await blocsDe(j.villeId);
      expect(blocs.length).toBeGreaterThanOrEqual(6); // 5 000 habitants : 6 blocs
      expect(blocs.slice(0, 2).map((b) => b.zonee)).toEqual([false, false]); // historiques intacts
      expect(blocs.slice(2).every((b) => b.zonee)).toBe(true); // nouveaux : zonés
      expect(blocs.slice(0, 2).map((b) => b.vocation)).toEqual(["residentiel", "commerce"]);

      // Idempotent : un second appel ne retouche rien.
      await supabaseAdmin.rpc("assigner_vocations_blocs", { p_ville_id: j.villeId });
      expect(await blocsDe(j.villeId)).toEqual(blocs);
    } finally {
      await supabaseAdmin.auth.admin.deleteUser(j.userId);
    }
  });

  test("une ville neuve : tous les blocs sont zonés dès le rang 0 et la règle de vocation est inchangée (résidentiel ≥ moitié)", async () => {
    const j = await creerCompteAvecVille("zonage-neuve");
    try {
      await supabaseAdmin.from("cities").update({ population_max: 13000 }).eq("id", j.villeId);
      await supabaseAdmin.rpc("assigner_vocations_blocs", { p_ville_id: j.villeId });
      const blocs = await blocsDe(j.villeId);
      expect(blocs).toHaveLength(10);
      expect(blocs.every((b) => b.zonee)).toBe(true);
      expect(blocs[0].vocation).toBe("residentiel");
      expect(blocs.filter((b) => b.vocation === "residentiel").length).toBeGreaterThanOrEqual(5);
    } finally {
      await supabaseAdmin.auth.admin.deleteUser(j.userId);
    }
  });

  test("/ville affiche une ville zonée sans erreur", async ({ page }) => {
    test.setTimeout(120_000);
    const j = await creerCompteAvecVille("zonage-page");
    try {
      await supabaseAdmin.from("cities").update({ population_max: 30000, population: 30000 }).eq("id", j.villeId);
      await page.goto("/connexion");
      await page.getByLabel("Adresse e-mail").fill(j.email);
      await page.getByLabel("Mot de passe").fill(j.motDePasse);
      await page.getByRole("button", { name: "Se connecter" }).click();
      await expect(page).toHaveURL(/\/ville$/, { timeout: 30_000 });
      await expect(page.locator("canvas")).toBeVisible();
      const blocs = await blocsDe(j.villeId);
      expect(blocs.length).toBeGreaterThanOrEqual(13);
      expect(blocs.every((b) => b.zonee)).toBe(true);
    } finally {
      await supabaseAdmin.auth.admin.deleteUser(j.userId);
    }
  });
});
