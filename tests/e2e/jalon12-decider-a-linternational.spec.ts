import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 12 : décision diplomatique hebdomadaire — la présidente en
 * exercice propose un pays cible + une catégorie (alliance/paix/
 * rivalité/embargo) — voir docs/ROADMAP.md et docs/DECISIONS.md §4.
 * Client service_role recréé ici pour la même raison que les specs des
 * jalons précédents ("server-only" hors du pipeline Next.js).
 *
 * Le soutien à sens unique de ce jalon a été remplacé par un vote
 * pour/contre au Jalon 13 (voir tests/e2e/jalon13-france-contre-allemagne.spec.ts) ;
 * seul le test de proposition (encore inchangé) reste ici.
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

  // Les deux tests qui vivaient ici ("soutenir_decision_diplomatique
  // compte exactement les soutiens...", "la page /pays permet ... aux
  // citoyens de soutenir") testaient le soutien à sens unique de ce
  // jalon. Le Jalon 13 a remplacé cette mécanique par un vote pour/contre
  // majoritaire — signature de soutenir_decision_diplomatique() changée
  // (position en paramètre), bouton "Soutenir" remplacé par "Pour"/
  // "Contre" sur /pays. Couverture équivalente (et plus complète :
  // pour/contre, résolution majoritaire, conflit) désormais dans
  // tests/e2e/jalon13-france-contre-allemagne.spec.ts — voir
  // docs/DECISIONS.md §4, journal du Jalon 13.
});
