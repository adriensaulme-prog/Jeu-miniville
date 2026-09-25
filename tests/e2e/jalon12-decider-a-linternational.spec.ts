import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 12 : décision diplomatique hebdomadaire — la présidente en
 * exercice propose un pays cible + une catégorie (alliance/paix/
 * rivalité/embargo), les citoyens soutiennent — voir docs/ROADMAP.md
 * et docs/DECISIONS.md §4. Client service_role recréé ici pour la même
 * raison que les specs des jalons précédents ("server-only" hors du
 * pipeline Next.js).
 *
 * Comme pour les Jalons 8bis, 9, 10 et 11, pas de vérification rouge
 * par sabotage sur les fonctions SQL elles-mêmes (pas d'accès psql
 * direct) : les assertions vérifient des transitions et des deltas
 * exacts, robustes au contenu déjà présent en base.
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

test.describe("Jalon 12 — décider à l'international", () => {
  test("sabotage : seule la présidente en exercice peut proposer une décision", async () => {
    // Pays isolé (peu de données de test réelles) pour ne pas entrer
    // en collision avec une proposition déjà faite cette semaine par
    // un autre test/compte réel.
    const presidente = await creerCompteAvecVille("diplo-pres", "CH", "ch-ge", 9_000_000);
    const citoyenne = await creerCompteAvecVille("diplo-non-pres", "CH", "ch-zh", 1);
    try {
      const { error: erreurVerif } = await supabaseAdmin.rpc("verifier_president", { p_country_id: "CH" });
      expect(erreurVerif).toBeNull();

      const { error: erreurNonPresidente } = await supabaseAdmin.rpc("proposer_decision_diplomatique", {
        p_president_id: citoyenne.userId,
        p_pays_cible_id: "DE",
        p_categorie: "alliance",
      });
      expect(erreurNonPresidente?.code).toBe("P0013");

      const { data: proposition, error: erreurPresidente } = await supabaseAdmin.rpc(
        "proposer_decision_diplomatique",
        { p_president_id: presidente.userId, p_pays_cible_id: "DE", p_categorie: "alliance" }
      );
      expect(erreurPresidente).toBeNull();
      expect(proposition.pays_cible_id).toBe("DE");
      expect(proposition.categorie).toBe("alliance");

      // Sabotage : cible = son propre pays, catégorie invalide, ou une
      // deuxième proposition la même semaine — tous refusés.
      const { error: erreurAutoCible } = await supabaseAdmin.rpc("proposer_decision_diplomatique", {
        p_president_id: presidente.userId,
        p_pays_cible_id: "CH",
        p_categorie: "paix",
      });
      expect(erreurAutoCible?.code).toBe("P0015");

      const { error: erreurDoublon } = await supabaseAdmin.rpc("proposer_decision_diplomatique", {
        p_president_id: presidente.userId,
        p_pays_cible_id: "FR",
        p_categorie: "embargo",
      });
      expect(erreurDoublon?.code).toBe("23505");

      const { data: propositions } = await supabaseAdmin
        .from("propositions_diplomatiques")
        .select("pays_cible_id, categorie")
        .eq("country_id", "CH");
      expect(propositions).toHaveLength(1);
      expect(propositions![0].pays_cible_id).toBe("DE"); // la première reste, pas écrasée
    } finally {
      await supprimerCompte(presidente.userId);
      await supprimerCompte(citoyenne.userId);
    }
  });

  test("soutenir_decision_diplomatique compte exactement les soutiens, refuse un doublon et sans proposition", async () => {
    const presidente = await creerCompteAvecVille("diplo2-pres", "BE", "be-bru", 9_000_000);
    const citoyenA = await creerCompteAvecVille("diplo2-a", "BE", "be-vlg", 1);
    const citoyenB = await creerCompteAvecVille("diplo2-b", "BE", "be-wal", 1);
    const paysSansProposition = await creerCompteAvecVille("diplo2-orphelin", "CA", "ca-on", 1);
    try {
      await supabaseAdmin.rpc("verifier_president", { p_country_id: "BE" });
      const { error: erreurSansProposition } = await supabaseAdmin.rpc("soutenir_decision_diplomatique", {
        p_joueur_id: paysSansProposition.userId,
      });
      expect(erreurSansProposition?.code).toBe("P0016"); // le Canada n'a pas proposé cette semaine

      await supabaseAdmin.rpc("proposer_decision_diplomatique", {
        p_president_id: presidente.userId,
        p_pays_cible_id: "NL",
        p_categorie: "rivalite",
      });

      const { error: e1 } = await supabaseAdmin.rpc("soutenir_decision_diplomatique", {
        p_joueur_id: citoyenA.userId,
      });
      expect(e1).toBeNull();
      const { error: e2 } = await supabaseAdmin.rpc("soutenir_decision_diplomatique", {
        p_joueur_id: citoyenB.userId,
      });
      expect(e2).toBeNull();
      // Sabotage : A soutient une deuxième fois la même semaine.
      const { error: erreurDoublon } = await supabaseAdmin.rpc("soutenir_decision_diplomatique", {
        p_joueur_id: citoyenA.userId,
      });
      expect(erreurDoublon?.code).toBe("23505");

      const { data: resultat } = await supabaseAdmin.rpc("resultat_decision_semaine", {
        p_country_id: "BE",
        p_semaine: null,
      });
      const ligne = Array.isArray(resultat) ? resultat[0] : resultat;
      expect(ligne.pays_cible_id).toBe("NL");
      expect(ligne.categorie).toBe("rivalite");
      expect(ligne.nb_soutiens).toBe(2); // A et B, pas le doublon de A
    } finally {
      await supprimerCompte(presidente.userId);
      await supprimerCompte(citoyenA.userId);
      await supprimerCompte(citoyenB.userId);
      await supprimerCompte(paysSansProposition.userId);
    }
  });

  test("la page /pays permet à la présidente de proposer et aux citoyens de soutenir", async ({ page }) => {
    test.setTimeout(90_000);
    const presidente = await creerCompteAvecVille("diplo-ui-pres", "US", "us-ca", 9_000_000);
    try {
      await supabaseAdmin.rpc("verifier_president", { p_country_id: "US" });

      await connecter(page, presidente.email, presidente.motDePasse);
      await expect(page).toHaveURL(/\/ville$/, { timeout: 40_000 });

      await page.goto("/pays");
      await expect(page.getByRole("heading", { name: "États-Unis d'Amérique" })).toBeVisible({ timeout: 20_000 });

      await expect(page.getByLabel("Choisis un pays cible")).toBeVisible();
      await page.getByLabel("Choisis un pays cible").selectOption({ label: "Mexique" });
      await page.getByLabel("Choisis une catégorie").selectOption({ label: "Paix" });
      await page.getByRole("button", { name: "Proposer", exact: true }).click();

      await expect(page.getByText("Paix · Mexique")).toBeVisible({ timeout: 20_000 });
      await page.getByRole("button", { name: "Soutenir" }).click();
      await expect(page.getByText("Tu soutiens déjà cette proposition.")).toBeVisible();
    } finally {
      await supprimerCompte(presidente.userId);
    }
  });
});
