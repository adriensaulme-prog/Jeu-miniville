import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 13 bis : « Revenir plus souvent » — une même personne peut
 * revisiter une ville plusieurs fois par jour (jusqu'à 3, plafond
 * choisi par Claude Code), avec un délai minimum d'une heure entre deux
 * visites de la même ville. Déviation assumée du cahier des charges
 * §3/§26 ("une fois par jour"), demandée par Adrien en connaissance de
 * cause — voir docs/A-INTEGRER.md §13 et docs/DECISIONS.md §4. Client
 * service_role recréé ici pour la même raison que les specs des jalons
 * précédents ("server-only" hors du pipeline Next.js).
 *
 * Le délai réel d'une heure n'est pas attendu par le test : après
 * chaque visite, on recule directement le timestamp `created_at` en
 * base (service_role, hors RLS) pour simuler que l'heure s'est écoulée,
 * plutôt que de ralentir la suite d'une heure par assertion.
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

  return { userId, email, motDePasse, villeId: ville.id as string, villeNom: ville.nom as string };
}

async function supprimerCompte(userId: string) {
  await supabaseAdmin.auth.admin.deleteUser(userId);
}

/** Recule le timestamp de toutes les visites (visiteur, ville) pour
 * simuler que le délai d'une heure est écoulé, sans changer `jour`
 * (le plafond quotidien, lui, doit rester compté). */
async function debloquerDelai(visiteurId: string, villeId: string) {
  await supabaseAdmin
    .from("visites")
    .update({ created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() })
    .eq("visiteur_id", visiteurId)
    .eq("ville_id", villeId);
}

async function connecter(page: import("@playwright/test").Page, email: string, motDePasse: string) {
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(motDePasse);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

test.describe.configure({ mode: "serial" });

test.describe("Jalon 13 bis — Revenir plus souvent", () => {
  test("sabotage : délai d'une heure entre deux visites, plafond de 3 par jour", async () => {
    const cible = await creerCompteAvecVille("j13bis-sabotage-cible");
    const visiteur = await creerCompteAvecVille("j13bis-sabotage-visiteur");
    try {
      const { error: e1 } = await supabaseAdmin.rpc("visiter_ville", {
        p_visiteur_id: visiteur.userId,
        p_ville_id: cible.villeId,
      });
      expect(e1).toBeNull();

      // Immédiatement après : délai non écoulé.
      const { error: erreurDelai } = await supabaseAdmin.rpc("visiter_ville", {
        p_visiteur_id: visiteur.userId,
        p_ville_id: cible.villeId,
      });
      expect(erreurDelai?.code).toBe("P0018");

      await debloquerDelai(visiteur.userId, cible.villeId);
      const { error: e2 } = await supabaseAdmin.rpc("visiter_ville", {
        p_visiteur_id: visiteur.userId,
        p_ville_id: cible.villeId,
      });
      expect(e2).toBeNull();

      await debloquerDelai(visiteur.userId, cible.villeId);
      const { error: e3 } = await supabaseAdmin.rpc("visiter_ville", {
        p_visiteur_id: visiteur.userId,
        p_ville_id: cible.villeId,
      });
      expect(e3).toBeNull();

      // Délai à nouveau écoulé, mais plafond quotidien de 3 déjà atteint.
      await debloquerDelai(visiteur.userId, cible.villeId);
      const { error: erreurPlafond } = await supabaseAdmin.rpc("visiter_ville", {
        p_visiteur_id: visiteur.userId,
        p_ville_id: cible.villeId,
      });
      expect(erreurPlafond?.code).toBe("P0019");

      const { data: ville } = await supabaseAdmin
        .from("cities")
        .select("population")
        .eq("id", cible.villeId)
        .single();
      expect(ville?.population).toBe(4); // 1 (départ) + 3 visites, pas 4

      const { count } = await supabaseAdmin
        .from("visites")
        .select("id", { count: "exact", head: true })
        .eq("visiteur_id", visiteur.userId)
        .eq("ville_id", cible.villeId);
      expect(count).toBe(3);
    } finally {
      await supprimerCompte(cible.userId);
      await supprimerCompte(visiteur.userId);
    }
  });

  test("la page /villes compte la visite automatiquement puis affiche le compte à rebours et le plafond quotidien", async ({
    page,
  }) => {
    // Jalon 13 ter (docs/A-INTEGRER.md §15) : la visite n'est plus un
    // clic sur un bouton "Visiter" (qui n'existe plus), elle se
    // déclenche toute seule ~2,5 s après l'affichage du panneau détail
    // (voir src/components/VisiteAutomatique.tsx) — chaque étape
    // ci-dessous attend donc ce délai plutôt que de cliquer.
    test.setTimeout(60_000);
    const cible = await creerCompteAvecVille("j13bis-ui-cible");
    const visiteur = await creerCompteAvecVille("j13bis-ui-visiteur");
    try {
      await connecter(page, visiteur.email, visiteur.motDePasse);
      await expect(page).toHaveURL(/\/ville$/, { timeout: 20_000 });

      await page.goto(`/villes?ville=${cible.villeId}`);
      await expect(page.getByText("0/3")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText("1/3")).toBeVisible({ timeout: 8_000 });
      await expect(page.getByText(/Revisiter dans \d+ min/)).toBeVisible();

      await debloquerDelai(visiteur.userId, cible.villeId);
      await page.reload();
      await expect(page.getByText("1/3")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText("2/3")).toBeVisible({ timeout: 8_000 });

      await debloquerDelai(visiteur.userId, cible.villeId);
      await page.reload();
      await expect(page.getByText("2/3")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText("3/3")).toBeVisible({ timeout: 8_000 });

      // Plafond atteint : "Quota atteint" s'affiche, plus de visite
      // automatique possible même si le délai est aussi encore actif
      // juste après cette 3e visite.
      await expect(page.getByText("Quota atteint")).toBeVisible();
      await expect(page.getByRole("link", { name: new RegExp(cible.villeNom) })).toContainText(
        "Indisponible pour l'instant"
      );
    } finally {
      await supprimerCompte(cible.userId);
      await supprimerCompte(visiteur.userId);
    }
  });
});
