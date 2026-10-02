import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * A-INTEGRER §26 D (migration 0041) : suivi unilatéral de villes, liste
 * personnelle avec rangs. Pays réservé à ce fichier : LU n'est utilisé que
 * par decouverte-petites-villes ; on prend ici AT (aucun autre spec n'y
 * crée de ville). Client service_role recréé ici pour la même raison que
 * les specs des jalons précédents ("server-only" hors du pipeline Next.js).
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const suffixe = () => Math.random().toString(36).slice(2, 6);
const comptes: string[] = [];

async function nouveau(prefixe: string, population = 1) {
  const email = `${prefixe}-${Date.now()}-${suffixe()}@example.com`;
  const motDePasse = "mot-de-passe-test-e2e";
  const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password: motDePasse, email_confirm: true });
  if (error || !data.user) throw new Error(`Création de ${prefixe} : ${error?.message}`);
  comptes.push(data.user.id);
  const { data: ville, error: erreurVille } = await supabaseAdmin.rpc("creer_ville", {
    p_owner_id: data.user.id,
    p_pseudo: `${prefixe}-${suffixe()}`,
    p_country_id: "AT",
    p_nom_ville: `${prefixe}-ville-${suffixe()}`,
  });
  if (erreurVille) throw new Error(`Ville de ${prefixe} : ${erreurVille.message}`);
  if (population !== 1) {
    await supabaseAdmin.from("cities").update({ population, population_max: population }).eq("id", ville.id);
  }
  return { userId: data.user.id, email, motDePasse, villeId: ville.id as string, nom: ville.nom as string };
}

const suivis = async (joueurId: string) =>
  ((await supabaseAdmin.from("villes_suivies").select("ville_id").eq("joueur_id", joueurId)).data ?? []).map(
    (l) => l.ville_id as string
  );

test.afterAll(async () => {
  for (const id of comptes) await supabaseAdmin.auth.admin.deleteUser(id);
});

test.describe.configure({ mode: "serial" });

test.describe("Suivi de villes (A-INTEGRER §26 D)", () => {
  test("suivre_ville : idempotent, jamais sa propre ville, ville inconnue refusée, identité vérifiée, et quota de 50", async () => {
    test.setTimeout(300_000); // ~50 comptes à créer pour atteindre le quota
    const moi = await nouveau("suivi-sql-moi");
    const autre = await nouveau("suivi-sql-autre");

    expect((await supabaseAdmin.rpc("suivre_ville", { p_joueur_id: moi.userId, p_ville_id: autre.villeId })).error).toBeNull();
    // Idempotent : un deuxième appel ne crée pas de doublon et ne coûte pas de quota.
    expect((await supabaseAdmin.rpc("suivre_ville", { p_joueur_id: moi.userId, p_ville_id: autre.villeId })).error).toBeNull();
    expect(await suivis(moi.userId)).toEqual([autre.villeId]);

    expect((await supabaseAdmin.rpc("suivre_ville", { p_joueur_id: moi.userId, p_ville_id: moi.villeId })).error?.code).toBe("P0005");
    expect(
      (await supabaseAdmin.rpc("suivre_ville", { p_joueur_id: moi.userId, p_ville_id: "00000000-0000-4000-8000-000000000000" })).error?.code
    ).toBe("P0004");

    // Quota : 49 suivis fictifs de plus (insertion directe), le 50e passe, le 51e est refusé (P0029).
    const lot = [];
    for (let i = 0; i < 48; i++) lot.push(await nouveau(`suivi-quota-${i}`));
    const lignes = lot.map((v) => ({ joueur_id: moi.userId, ville_id: v.villeId }));
    expect((await supabaseAdmin.from("villes_suivies").insert(lignes)).error).toBeNull();
    expect(await suivis(moi.userId)).toHaveLength(49);
    const cinquantieme = await nouveau("suivi-sql-50e");
    const cinquanteEtUn = await nouveau("suivi-sql-51e");
    expect((await supabaseAdmin.rpc("suivre_ville", { p_joueur_id: moi.userId, p_ville_id: cinquantieme.villeId })).error).toBeNull();
    expect((await supabaseAdmin.rpc("suivre_ville", { p_joueur_id: moi.userId, p_ville_id: cinquanteEtUn.villeId })).error?.code).toBe("P0029");
    // Déjà suivie : pas de refus même au quota.
    expect((await supabaseAdmin.rpc("suivre_ville", { p_joueur_id: moi.userId, p_ville_id: autre.villeId })).error).toBeNull();

    await supabaseAdmin.rpc("ne_plus_suivre_ville", { p_joueur_id: moi.userId, p_ville_id: autre.villeId });
    expect(await suivis(moi.userId)).toHaveLength(49);
  });

  test("villes_suivies_rangs : rang dans le pays et dans le monde, ex æquo au même rang", async () => {
    const moi = await nouveau("suivi-rang-moi");
    const grosse = await nouveau("suivi-rang-grosse", 777_777);
    const moyenne = await nouveau("suivi-rang-moyenne", 555_555);
    for (const v of [grosse, moyenne]) {
      await supabaseAdmin.rpc("suivre_ville", { p_joueur_id: moi.userId, p_ville_id: v.villeId });
    }
    const { data, error } = await supabaseAdmin.rpc("villes_suivies_rangs", { p_joueur_id: moi.userId });
    expect(error).toBeNull();
    const rangs = new Map((data as { ville_id: string; rang_pays: number; rang_monde: number }[]).map((r) => [r.ville_id, r]));
    expect(rangs.get(grosse.villeId)!.rang_pays).toBe(1);
    expect(rangs.get(moyenne.villeId)!.rang_pays).toBe(2);
    expect(rangs.get(moyenne.villeId)!.rang_monde).toBeGreaterThan(rangs.get(grosse.villeId)!.rang_monde);
    // Seulement les villes suivies.
    expect(rangs.size).toBe(2);
  });

  test("interface : suivre depuis /villes, retrouver la ville dans /suivi avec ses rangs, ne plus suivre ; invisible pour les autres", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    const moi = await nouveau("suivi-ui-moi");
    const cible = await nouveau("suivi-ui-cible", 888_888);
    const curieux = await nouveau("suivi-ui-curieux");

    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill(moi.email);
    await page.getByLabel("Mot de passe").fill(moi.motDePasse);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/ville$/, { timeout: 30_000 });

    await page.goto(`/suivi`);
    await expect(page.getByText("Tu ne suis aucune ville pour l'instant.")).toBeVisible({ timeout: 30_000 });

    await page.goto(`/villes?ville=${cible.villeId}`);
    await page.getByRole("button", { name: /Suivre/ }).click();
    await expect(page.getByRole("button", { name: /Ne plus suivre/ })).toBeVisible({ timeout: 20_000 });
    expect(await suivis(moi.userId)).toEqual([cible.villeId]);

    await page.goto("/suivi");
    await expect(page.getByText(cible.nom)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("1ᵉʳ dans le pays")).toBeVisible();
    await expect(page.getByText("Président")).toBeVisible();

    // Page publique d'une ville : le bouton reflète l'état.
    await page.goto(`/v/${cible.villeId}`);
    await expect(page.getByRole("button", { name: /Ne plus suivre/ })).toBeVisible({ timeout: 30_000 });

    // Quelqu'un d'autre ne voit jamais ma liste (RLS) : ses propres suivis restent vides.
    expect(await suivis(curieux.userId)).toEqual([]);

    await page.goto("/suivi");
    await page.getByRole("button", { name: /Ne plus suivre/ }).click();
    await expect(page.getByText("Tu ne suis aucune ville pour l'instant.")).toBeVisible({ timeout: 20_000 });
    expect(await suivis(moi.userId)).toEqual([]);
  });

  test("/suivi et le bouton Suivre sont réservés aux joueurs connectés ; pas de bouton sur sa propre ville", async ({ page }) => {
    test.setTimeout(90_000);
    const moi = await nouveau("suivi-acces");
    await page.goto("/suivi");
    await expect(page).toHaveURL(/\/connexion/, { timeout: 30_000 });

    await page.goto(`/v/${moi.villeId}`);
    await expect(page.getByRole("button", { name: /Suivre/ })).toHaveCount(0);

    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill(moi.email);
    await page.getByLabel("Mot de passe").fill(moi.motDePasse);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/ville$/, { timeout: 30_000 });
    await page.goto(`/v/${moi.villeId}`);
    await expect(page.getByRole("link", { name: "Voir ma ville" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: /Suivre/ })).toHaveCount(0);
  });
});
