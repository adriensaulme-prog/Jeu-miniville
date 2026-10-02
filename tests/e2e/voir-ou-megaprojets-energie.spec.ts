import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { cleDe, emplacementEnergie, emplacementMegaprojet } from "../../src/lib/ville3d/emplacements";

/**
 * « Voir où il est » étendu aux mégaprojets construits et aux installations
 * d'Énergie (suite de docs/A-INTEGRER.md §25). Client service_role recréé
 * ici pour la même raison que les specs des jalons précédents
 * ("server-only" hors du pipeline Next.js).
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const suffixe = () => Math.random().toString(36).slice(2, 6);

test("un mégaprojet construit et l'Énergie ont leur bouton « Voir où il est », qui cible l'emplacement exact", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const email = `voir-ou-${Date.now()}-${suffixe()}@example.com`;
  const motDePasse = "mot-de-passe-test-e2e";
  const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password: motDePasse, email_confirm: true });
  if (error || !data.user) throw new Error(`Création du compte : ${error?.message}`);
  const userId = data.user.id;
  try {
    const { data: ville, error: erreurVille } = await supabaseAdmin.rpc("creer_ville", {
      p_owner_id: userId,
      p_pseudo: `voirou-${suffixe()}`,
      p_country_id: "FR",
      p_nom_ville: `voirou-ville-${suffixe()}`,
    });
    if (erreurVille) throw new Error(`Création de la ville : ${erreurVille.message}`);
    const villeId = ville.id as string;
    // Bourg (5 000) : premier palier de mégaprojet et activité Énergie débloquées.
    await supabaseAdmin.from("cities").update({ population: 6000, population_max: 6000 }).eq("id", villeId);
    await supabaseAdmin
      .from("megaprojets")
      .insert({ ville_id: villeId, palier: 0, type: "grande_ecole", statut: "construit", construit_le: new Date().toISOString() });
    // De l'élan d'Énergie : des visites sur plusieurs jours (la page lit l'élan, pas des compteurs).
    const lignes = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(Date.now() - i * 86_400_000);
      return { visiteur_id: userId, ville_id: villeId, activite: "energie", jour: d.toISOString().slice(0, 10), created_at: d.toISOString() };
    });
    expect((await supabaseAdmin.from("visites").insert(lignes)).error).toBeNull();

    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByLabel("Mot de passe").fill(motDePasse);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/ville$/, { timeout: 30_000 });

    const cle = cleDe(villeId);
    const canvas = page.locator("canvas");

    const boutonMega = page.getByRole("button", { name: /Voir où il est : Grande école/ });
    await expect(boutonMega).toBeVisible({ timeout: 30_000 });
    await boutonMega.click();
    const m = emplacementMegaprojet(cle, 0);
    await expect(canvas).toHaveAttribute("data-repere", `${Math.round(m.x)},${Math.round(m.z)}`);

    const boutonEnergie = page.getByRole("button", { name: /Voir où il est : Énergie/ });
    await expect(boutonEnergie).toBeVisible();
    await boutonEnergie.click();
    const e = emplacementEnergie(cle, 0);
    await expect(canvas).toHaveAttribute("data-repere", `${Math.round(e.x)},${Math.round(e.z)}`);
  } finally {
    await supabaseAdmin.auth.admin.deleteUser(userId);
  }
});
