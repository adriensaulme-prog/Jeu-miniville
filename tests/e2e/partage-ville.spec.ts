import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * A-INTEGRER §26 C : page publique d'une ville (/v/<id>), lisible sans
 * connexion, avec un lien vers un événement précis et des boutons de
 * partage. Client service_role recréé ici pour la même raison que les
 * specs des jalons précédents ("server-only" hors du pipeline Next.js).
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const suffixe = () => Math.random().toString(36).slice(2, 6);
const comptes: string[] = [];

async function nouveau(prefixe: string) {
  const email = `${prefixe}-${Date.now()}-${suffixe()}@example.com`;
  const motDePasse = "mot-de-passe-test-e2e";
  const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password: motDePasse, email_confirm: true });
  if (error || !data.user) throw new Error(`Création de ${prefixe} : ${error?.message}`);
  comptes.push(data.user.id);
  const pseudo = `${prefixe}-${suffixe()}`;
  const { data: ville, error: erreurVille } = await supabaseAdmin.rpc("creer_ville", {
    p_owner_id: data.user.id,
    p_pseudo: pseudo,
    p_country_id: "FR",
    p_nom_ville: `${prefixe}-ville-${suffixe()}`,
  });
  if (erreurVille) throw new Error(`Ville de ${prefixe} : ${erreurVille.message}`);
  return { userId: data.user.id, email, motDePasse, pseudo, villeId: ville.id as string, nom: ville.nom as string };
}

async function evenement(villeId: string, ligne: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin
    .from("city_events")
    .insert({ ville_id: villeId, ...ligne })
    .select("id")
    .single();
  if (error) throw new Error(`Insertion d'événement : ${error.message}`);
  return data.id as string;
}

test.afterAll(async () => {
  for (const id of comptes) await supabaseAdmin.auth.admin.deleteUser(id);
});

test.describe.configure({ mode: "serial" });

test.describe("Page publique d'une ville (A-INTEGRER §26 C)", () => {
  test("sans connexion : la ville, le maire, un événement mis en avant, les réussites — et jamais les attaques subies", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const j = await nouveau("partage-public");
    const monument = await evenement(j.villeId, { type: "monument_debloque", valeur: 0 });
    await evenement(j.villeId, { type: "technologie_debloquee", valeur: 0 });
    await evenement(j.villeId, { type: "attaque_recue", type_action: "greve", activite: "industrie", valeur: 2 });

    await page.goto(`/v/${j.villeId}`);
    await expect(page.getByRole("heading", { name: j.nom.toUpperCase(), exact: false })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(`Maire : ${j.pseudo}`)).toBeVisible();
    await expect(page.getByText("Technologie débloquée :")).toBeVisible();
    await expect(page.getByText("Nouveau monument : Borne commémorative")).toBeVisible();
    // Les attaques subies restent dans le bulletin du maire, pas sur la page publique.
    await expect(page.getByText(/Grève|grève/)).toHaveCount(0);
    // Visiteur non connecté : invitation à créer un compte.
    await expect(page.getByRole("link", { name: "Créer un compte" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Se connecter" }).last()).toBeVisible();
    // Pas de guide de démarrage ni de redirection vers la connexion.
    await expect(page).toHaveURL(new RegExp(`/v/${j.villeId}$`));

    // Lien vers un événement précis.
    await page.goto(`/v/${j.villeId}?evenement=${monument}`);
    await expect(page.getByRole("status")).toContainText("Événement partagé", { timeout: 30_000 });
    await expect(page.getByRole("status")).toContainText("Nouveau monument : Borne commémorative");
  });

  test("ville inconnue, identifiant invalide ou événement d'une autre ville", async ({ page }) => {
    test.setTimeout(90_000);
    const a = await nouveau("partage-autre-a");
    const b = await nouveau("partage-autre-b");
    const eventB = await evenement(b.villeId, { type: "monument_debloque", valeur: 1 });

    const inconnue = await page.goto("/v/00000000-0000-4000-8000-000000000000");
    expect(inconnue?.status()).toBe(404);
    const invalide = await page.goto("/v/pas-un-identifiant");
    expect(invalide?.status()).toBe(404);

    // Un événement qui n'appartient pas à cette ville n'est jamais affiché.
    await page.goto(`/v/${a.villeId}?evenement=${eventB}`);
    await expect(page.getByText("Cet événement n'est plus disponible.")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Fontaine simple")).toHaveCount(0);
    await expect(page.getByText("Banc public")).toHaveCount(0);
  });

  test("les boutons Partager copient le lien exact de la ville et de l'événement", async ({ page, context }) => {
    test.setTimeout(90_000);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const j = await nouveau("partage-copie");
    const monument = await evenement(j.villeId, { type: "monument_debloque", valeur: 0 });

    await page.goto(`/v/${j.villeId}`);
    await page.getByRole("button", { name: "Partager cette ville" }).click();
    await expect(page.getByRole("button", { name: "Lien copié ✓" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`http://localhost:3000/v/${j.villeId}`);

    await page.getByRole("button", { name: "Partager", exact: true }).first().click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      `http://localhost:3000/v/${j.villeId}?evenement=${monument}`
    );
  });

  test("connecté : la page publique de sa ville renvoie vers Ma ville, et Ma ville propose le partage (ville + réussite)", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const j = await nouveau("partage-connecte");
    await evenement(j.villeId, { type: "monument_debloque", valeur: 0 });

    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill(j.email);
    await page.getByLabel("Mot de passe").fill(j.motDePasse);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/ville$/, { timeout: 30_000 });

    await expect(page.getByRole("button", { name: "Partager ma ville" })).toBeVisible();
    // Bulletin municipal : la réussite a son bouton de partage.
    await expect(page.getByText("Nouveau monument : Borne commémorative")).toBeVisible();
    await expect(page.locator(".partage-evenement")).toHaveCount(1);

    await page.goto(`/v/${j.villeId}`);
    await expect(page.getByRole("link", { name: "Voir ma ville" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("link", { name: "Créer un compte" })).toHaveCount(0);
  });
});
