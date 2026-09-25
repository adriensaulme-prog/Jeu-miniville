import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 11 : la ville n°1 du pays devient présidente automatiquement,
 * historique des mandats conservé — voir docs/ROADMAP.md et
 * docs/DECISIONS.md §4. Client service_role recréé ici pour la même
 * raison que les specs des jalons précédents ("server-only" hors du
 * pipeline Next.js).
 *
 * Comme pour les Jalons 8bis, 9 et 10, pas de vérification rouge par
 * sabotage sur les fonctions SQL elles-mêmes (pas d'accès psql direct) :
 * les assertions vérifient des deltas exacts et des transitions
 * connues, robustes au contenu déjà présent en base.
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

test.describe("Jalon 11 — le président malgré lui", () => {
  test("verifier_president élit la ville n°1, reste idempotent, puis bascule quand le rang change", async () => {
    // Populations très hautes pour dominer sans ambiguïté toute donnée
    // déjà présente en base pour ce pays (villes de test comprises).
    const villeB = await creerCompteAvecVille("president-b", "CH", "ch-zh", 6_000_000);
    const villeA = await creerCompteAvecVille("president-a", "CH", "ch-zh", 5_000_000);
    try {
      const { error: e1 } = await supabaseAdmin.rpc("verifier_president", { p_country_id: "CH" });
      expect(e1).toBeNull();

      const { data: mandatOuvert1 } = await supabaseAdmin
        .from("presidents")
        .select("ville_id, debut")
        .eq("country_id", "CH")
        .is("fin", null)
        .single();
      expect(mandatOuvert1?.ville_id).toBe(villeB.villeId); // B a la plus grande population

      // Appel répété sans aucun changement de rang : idempotent, pas de
      // nouveau mandat créé, la date de début ne bouge pas.
      const { error: e2 } = await supabaseAdmin.rpc("verifier_president", { p_country_id: "CH" });
      expect(e2).toBeNull();
      const { data: mandatsApresRepetition } = await supabaseAdmin
        .from("presidents")
        .select("id, debut")
        .eq("country_id", "CH")
        .eq("ville_id", villeB.villeId);
      expect(mandatsApresRepetition).toHaveLength(1);
      expect(mandatsApresRepetition![0].debut).toBe(mandatOuvert1!.debut);

      // A dépasse B : le mandat de B doit se refermer, un nouveau
      // s'ouvrir pour A.
      await supabaseAdmin
        .from("cities")
        .update({ population: 7_000_000, population_max: 7_000_000 })
        .eq("id", villeA.villeId);
      const { error: e3 } = await supabaseAdmin.rpc("verifier_president", { p_country_id: "CH" });
      expect(e3).toBeNull();

      const { data: mandatBFerme } = await supabaseAdmin
        .from("presidents")
        .select("fin")
        .eq("country_id", "CH")
        .eq("ville_id", villeB.villeId)
        .single();
      expect(mandatBFerme?.fin).not.toBeNull();

      const { data: mandatOuvert2 } = await supabaseAdmin
        .from("presidents")
        .select("ville_id")
        .eq("country_id", "CH")
        .is("fin", null)
        .single();
      expect(mandatOuvert2?.ville_id).toBe(villeA.villeId);
    } finally {
      // Supprimer les comptes supprime les villes en cascade (FK
      // owner_id), qui supprime les mandats en cascade (FK ville_id,
      // Jalon 11) — pas de nettoyage supplémentaire nécessaire.
      await supprimerCompte(villeA.userId);
      await supprimerCompte(villeB.userId);
    }
  });

  test("à population égale, la ville la plus ancienne reste présidente (départage stable)", async () => {
    const premiere = await creerCompteAvecVille("president-ancien", "BE", "be-vlg", 8_000_000);
    const seconde = await creerCompteAvecVille("president-recent", "BE", "be-vlg", 8_000_000);
    try {
      const { error } = await supabaseAdmin.rpc("verifier_president", { p_country_id: "BE" });
      expect(error).toBeNull();

      const { data: mandatOuvert } = await supabaseAdmin
        .from("presidents")
        .select("ville_id")
        .eq("country_id", "BE")
        .is("fin", null)
        .single();
      expect(mandatOuvert?.ville_id).toBe(premiere.villeId); // créée en premier
    } finally {
      await supprimerCompte(premiere.userId);
      await supprimerCompte(seconde.userId);
    }
  });

  test("la page /pays affiche le président actuel et l'historique", async ({ page }) => {
    test.setTimeout(60_000);
    const joueur = await creerCompteAvecVille("president-ui", "CA", "ca-on", 9_000_000);
    try {
      await connecter(page, joueur.email, joueur.motDePasse);
      await expect(page).toHaveURL(/\/ville$/, { timeout: 20_000 });

      await page.goto("/pays?pays=CA");
      await expect(page.getByRole("heading", { name: "Canada" })).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(joueur.villeNom).first()).toBeVisible();
      await expect(page.getByText("depuis")).toBeVisible();

      await expect(page.getByRole("heading", { name: "Historique des présidents" })).toBeVisible();
      await expect(page.getByText("en cours")).toBeVisible();
    } finally {
      await supprimerCompte(joueur.userId);
    }
  });
});
