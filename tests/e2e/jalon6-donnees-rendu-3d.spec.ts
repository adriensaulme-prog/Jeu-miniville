import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 6 (couche données) : nouveaux seuils de niveau (Métropole =
 * 100 000 habitants), population_max qui ne redescend jamais (une
 * contamination ne fait jamais régresser le niveau visuel d'une
 * ville), géo/fuseau des pays, garde-fou is_test/pseudo. Le portage du
 * rendu 3D lui-même est un jalon séparé — voir docs/DECISIONS.md §4.
 * Client service_role recréé ici pour la même raison que les specs des
 * jalons précédents (voir leurs commentaires : "server-only" hors du
 * pipeline Next.js).
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

test.describe.configure({ mode: "serial" });

test.describe("Jalon 6 — données du rendu 3D", () => {
  test("sabotage : population_vers_niveau() suit les nouveaux seuils (Métropole = 100 000)", async () => {
    const seuils: [number, number][] = [
      [999, 0],
      [1000, 1],
      [4999, 1],
      [5000, 2],
      [14999, 2],
      [15000, 3],
      [39999, 3],
      [40000, 4],
      [99999, 4],
      [100000, 5],
      [1000000, 5],
    ];
    for (const [population, niveauAttendu] of seuils) {
      const { data, error } = await supabaseAdmin.rpc("population_vers_niveau", {
        p_population: population,
      });
      expect(error).toBeNull();
      expect(data, `population=${population}`).toBe(niveauAttendu);
    }
  });

  test("sabotage : une contamination ne fait jamais régresser population_max ni le niveau", async () => {
    const attaquant = await creerCompteAvecVille("attaquant-donnees6");
    const cible = await creerCompteAvecVille("cible-donnees6");

    try {
      // Simule une ville qui a déjà grandi jusqu'au niveau 2 (Bourg,
      // seuil 5 000) — atteindre ça avec de vrais visiteurs un par un
      // n'est pas praticable dans un test ; on pousse directement l'état
      // via le client service_role, ce qu'aucun joueur ne peut faire.
      const { error: erreurSetup } = await supabaseAdmin
        .from("cities")
        .update({ population: 5200, population_max: 5200, niveau: 2 })
        .eq("id", cible.villeId);
      expect(erreurSetup).toBeNull();

      const { error: erreurContamination } = await supabaseAdmin.rpc("lancer_action_antiville", {
        p_attaquant_id: attaquant.userId,
        p_ville_id: cible.villeId,
        p_type_action: "contamination",
      });
      expect(erreurContamination).toBeNull();

      const { data: villeApres } = await supabaseAdmin
        .from("cities")
        .select("population, population_max, niveau")
        .eq("id", cible.villeId)
        .single();

      expect(villeApres?.population).toBeLessThan(5200); // ~10% de perte
      expect(villeApres?.population_max).toBe(5200); // jamais touché
      expect(villeApres?.niveau).toBe(2); // pas de régression visuelle
    } finally {
      await supprimerCompte(attaquant.userId);
      await supprimerCompte(cible.userId);
    }
  });

  test("les pays du scénario de test ont une géo et un fuseau horaire renseignés", async () => {
    const { data, error } = await supabaseAdmin
      .from("countries")
      .select("id, latitude, longitude, fuseau_horaire")
      .in("id", ["FR", "DE", "BE", "CH", "CA", "JP"]);
    expect(error).toBeNull();
    expect(data).toHaveLength(6);
    for (const pays of data ?? []) {
      expect(pays.latitude, pays.id).not.toBeNull();
      expect(pays.longitude, pays.id).not.toBeNull();
      expect(pays.fuseau_horaire, pays.id).not.toBeNull();
    }
    const france = data?.find((p) => p.id === "FR");
    expect(france?.fuseau_horaire).toBe("Europe/Paris");
  });

  test("sabotage : une ville is_test doit avoir un pseudo préfixé test_", async () => {
    const { data: authData, error: erreurAuth } = await supabaseAdmin.auth.admin.createUser({
      email: `pseudo-invalide-${Date.now()}@example.com`,
      password: "mot-de-passe-test-e2e",
      email_confirm: true,
    });
    expect(erreurAuth).toBeNull();
    const userId = authData!.user!.id;

    try {
      const { error } = await supabaseAdmin.from("users").insert({
        id: userId,
        pseudo: "PasDeTestIci",
        country_id: "FR",
        is_test: true,
      });
      expect(error).not.toBeNull();
      expect(error?.message).toContain("users_is_test_pseudo_prefixe");
    } finally {
      await supprimerCompte(userId);
    }
  });
});
