import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * A-INTEGRER §27 : (B) « +1 visite » puis choix d'activité d'emblée tant
 * que la visite est fraîche, derrière « Changer » ensuite ; (C) page
 * publique des règles du jeu, FR et EN, avec un lien discret dans la
 * barre du haut. (A, le plafond à 8, est couvert par
 * jalon13bis-revenir-plus-souvent.spec.ts et tests/unit/visites.test.ts.)
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

test.describe.configure({ mode: "serial" });

test.describe("Visites (feedback + choix) et règles du jeu (A-INTEGRER §27)", () => {
  test("une visite de plus de 2 minutes (mais de moins de 5) garde ses choix derrière « Changer »", async ({ page }) => {
    test.setTimeout(90_000);
    const visiteur = await creerCompteAvecVille("visites-ancienne");
    const cible = await creerCompteAvecVille("visites-ancienne-cible");
    try {
      const ilYaTroisMinutes = new Date(Date.now() - 3 * 60 * 1000).toISOString();
      const { error } = await supabaseAdmin.from("visites").insert({
        visiteur_id: visiteur.userId,
        ville_id: cible.villeId,
        jour: new Date().toISOString().slice(0, 10),
        activite: "residentiel",
        created_at: ilYaTroisMinutes,
      });
      expect(error).toBeNull();

      await page.goto("/connexion");
      await page.getByLabel("Adresse e-mail").fill(visiteur.email);
      await page.getByLabel("Mot de passe").fill(visiteur.motDePasse);
      await page.getByRole("button", { name: "Se connecter" }).click();
      await expect(page).toHaveURL(/\/ville$/, { timeout: 30_000 });

      await page.goto(`/villes?ville=${cible.villeId}`);
      await expect(page.getByText("Activité choisie :")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText("+1 visite").first()).toBeVisible();
      // Visite plus ancienne que 2 min : liste fermée, accessible par « Changer ».
      await expect(page.getByText("Choisir une activité")).toHaveCount(0);
      await page.getByRole("button", { name: "Changer" }).click();
      await expect(page.getByText("Choisir une activité")).toBeVisible();
    } finally {
      await supabaseAdmin.auth.admin.deleteUser(visiteur.userId);
      await supabaseAdmin.auth.admin.deleteUser(cible.userId);
    }
  });

  test("la page des règles est publique, en français puis en anglais, et le plafond de visites affiché est le bon", async ({
    page,
    context,
  }) => {
    await page.goto("/regles");
    await expect(page.getByRole("heading", { name: "Règles du jeu" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Visiter une ville" })).toBeVisible();
    await expect(page.getByText(/8 fois par jour/)).toBeVisible();

    await context.addCookies([{ name: "langue", value: "en", url: "http://localhost:3000" }]);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Game rules" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Visiting a city" })).toBeVisible();
    await expect(page.getByText(/at most 8 times a day/)).toBeVisible();
  });

  test("un lien discret « Règles » dans la barre du haut mène à la page, connecté ou non", async ({ page }) => {
    await page.goto("/");
    await page.locator("a.regles-lien[href=\"/regles\"]").click();
    await expect(page).toHaveURL(/\/regles$/);
    await expect(page.getByRole("heading", { name: "Règles du jeu" })).toBeVisible({ timeout: 20_000 });
  });
});
