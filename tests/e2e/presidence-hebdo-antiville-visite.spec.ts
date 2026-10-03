import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * A-INTEGRER §31 (migration 0046) : la présidence est attribuée à la
 * semaine, pas en direct ; A-INTEGRER §34 (migration 0045) : une action
 * AntiVille annule la visite comptée dans la minute précédente et la visite
 * automatique est suspendue dès qu'on touche au panneau AntiVille. Pays
 * réservés à ce fichier : HR et SI. Client service_role recréé ici pour la
 * même raison que les specs des jalons précédents ("server-only" hors du
 * pipeline Next.js).
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const suffixe = () => Math.random().toString(36).slice(2, 6);
const comptes: string[] = [];

async function nouveau(prefixe: string, paysId: string, population = 1) {
  const email = `${prefixe}-${Date.now()}-${suffixe()}@example.com`;
  const motDePasse = "mot-de-passe-test-e2e";
  const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password: motDePasse, email_confirm: true });
  if (error || !data.user) throw new Error(`Création de ${prefixe} : ${error?.message}`);
  comptes.push(data.user.id);
  const { data: ville, error: erreurVille } = await supabaseAdmin.rpc("creer_ville", {
    p_owner_id: data.user.id,
    p_pseudo: `${prefixe}-${suffixe()}`,
    p_country_id: paysId,
    p_nom_ville: `${prefixe}-ville-${suffixe()}`,
  });
  if (erreurVille) throw new Error(`Ville de ${prefixe} : ${erreurVille.message}`);
  if (population !== 1) {
    await supabaseAdmin.from("cities").update({ population, population_max: population }).eq("id", ville.id);
  }
  return { userId: data.user.id, email, motDePasse, villeId: ville.id as string, nom: ville.nom as string };
}

const nbVisites = async (visiteurId: string, villeId: string) =>
  (await supabaseAdmin.from("visites").select("id", { count: "exact", head: true }).eq("visiteur_id", visiteurId).eq("ville_id", villeId))
    .count ?? 0;
const population = async (villeId: string) =>
  (await supabaseAdmin.from("cities").select("population").eq("id", villeId).single()).data!.population as number;
const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

test.afterAll(async () => {
  for (const id of comptes) await supabaseAdmin.auth.admin.deleteUser(id);
});

test.describe.configure({ mode: "serial" });

test.describe("Présidence hebdomadaire (§31) et AntiVille / visite (§34)", () => {
  test("§31 : la présidence est désignée une fois par semaine, figée en cours de semaine, et l'historique garde une entrée par semaine", async () => {
    const petite = await nouveau("hebdo-petite", "SI");
    await supabaseAdmin.rpc("verifier_president", { p_country_id: "SI" });
    const semaineCourante = (
      await supabaseAdmin.from("presidents_semaine").select("semaine, ville_id").eq("country_id", "SI").single()
    ).data!;
    expect(semaineCourante.ville_id).toBe(petite.villeId);

    // Une plus grande ville arrive : elle est n°1 en direct, mais pas présidente avant lundi.
    const grande = await nouveau("hebdo-grande", "SI", 900);
    await supabaseAdmin.rpc("verifier_president", { p_country_id: "SI" });
    await supabaseAdmin.rpc("verifier_president", { p_country_id: "SI" });
    const officielles = (await supabaseAdmin.from("presidents_semaine").select("ville_id").eq("country_id", "SI")).data!;
    expect(officielles).toEqual([{ ville_id: petite.villeId }]);
    const ouvert = (await supabaseAdmin.from("presidents").select("ville_id, debut").eq("country_id", "SI").is("fin", null)).data!;
    expect(ouvert).toHaveLength(1);
    expect(ouvert[0].ville_id).toBe(petite.villeId);
    // Le mandat commence un lundi à 00 h UTC, pas à l'instant de la lecture.
    const debut = new Date(ouvert[0].debut);
    expect(debut.getUTCDay()).toBe(1);
    expect(debut.getUTCHours()).toBe(0);
    expect(debut.getUTCMinutes()).toBe(0);

    // Semaine suivante : on recule la présidence et le mandat d'une semaine.
    const avant = new Date(`${semaineCourante.semaine}T00:00:00Z`);
    avant.setUTCDate(avant.getUTCDate() - 7);
    await supabaseAdmin.from("presidents_semaine").update({ semaine: avant.toISOString().slice(0, 10) }).eq("country_id", "SI");
    await supabaseAdmin
      .from("presidents")
      .update({ debut: new Date(new Date(ouvert[0].debut).getTime() - 7 * 86_400_000).toISOString() })
      .eq("country_id", "SI")
      .is("fin", null);
    await supabaseAdmin.rpc("verifier_president", { p_country_id: "SI" });
    const apres = (await supabaseAdmin.from("presidents_semaine").select("ville_id, semaine").eq("country_id", "SI").order("semaine")).data!;
    expect(apres.map((l) => l.ville_id)).toEqual([petite.villeId, grande.villeId]); // une entrée par semaine
    const mandatOuvert = (await supabaseAdmin.from("presidents").select("ville_id, debut").eq("country_id", "SI").is("fin", null)).data!;
    expect(mandatOuvert).toHaveLength(1);
    expect(mandatOuvert[0].ville_id).toBe(grande.villeId);
    expect(new Date(mandatOuvert[0].debut).getUTCDay()).toBe(1);

    // L'historique de /pays donne le président de la semaine passée.
    const { data: histo, error } = await supabaseAdmin.rpc("historique_pays", { p_country_id: "SI", p_nb_semaines: 12 });
    expect(error).toBeNull();
    const ligne = (histo as { semaine: string; president_ville_id: string | null; president_ville_nom: string | null }[]).find(
      (l) => l.semaine === avant.toISOString().slice(0, 10)
    );
    expect(ligne?.president_ville_id).toBe(petite.villeId);
    expect(ligne?.president_ville_nom).toBe(petite.nom);
  });

  test("§31 : si la ville présidente disparaît en cours de semaine, une nouvelle est désignée à la lecture suivante", async () => {
    const supprimee = await nouveau("hebdo-supprimee", "HR", 5_000);
    await nouveau("hebdo-remplacante", "HR", 4_000);
    await supabaseAdmin.rpc("verifier_president", { p_country_id: "HR" });
    const avant = (await supabaseAdmin.from("presidents").select("ville_id").eq("country_id", "HR").is("fin", null).single()).data!;
    expect(avant.ville_id).toBe(supprimee.villeId);
    await supabaseAdmin.auth.admin.deleteUser(supprimee.userId);
    await supabaseAdmin.rpc("verifier_president", { p_country_id: "HR" });
    const apres = (await supabaseAdmin.from("presidents").select("ville_id").eq("country_id", "HR").is("fin", null)).data!;
    expect(apres).toHaveLength(1);
    expect(apres[0].ville_id).not.toBe(supprimee.villeId);
  });

  test("§34 : une action AntiVille annule la visite de la dernière minute (ligne supprimée, habitants repris) mais pas une visite plus ancienne", async () => {
    test.setTimeout(60_000);
    const attaquant = await nouveau("anti-attaquant", "HR");
    const cible = await nouveau("anti-cible", "HR");
    const pop0 = await population(cible.villeId);

    const { data: visite, error: erreurVisite } = await supabaseAdmin.rpc("visiter_ville", {
      p_visiteur_id: attaquant.userId,
      p_ville_id: cible.villeId,
    });
    expect(erreurVisite).toBeNull();
    const gain = (visite as { gain: number }).gain;
    expect(await population(cible.villeId)).toBe(pop0 + gain);
    expect(await nbVisites(attaquant.userId, cible.villeId)).toBe(1);

    // Attaque dans la minute : visite annulée, habitants repris (propagande : n'altère pas la population).
    const { data: attaque, error: erreurAttaque } = await supabaseAdmin.rpc("lancer_action_antiville", {
      p_attaquant_id: attaquant.userId,
      p_ville_id: cible.villeId,
      p_type_action: "propagande",
    });
    expect(erreurAttaque).toBeNull();
    expect((attaque as { visite_annulee: boolean }).visite_annulee).toBe(true);
    expect(await nbVisites(attaquant.userId, cible.villeId)).toBe(0);
    expect(await population(cible.villeId)).toBe(pop0);

    // Une visite de plus de 2 minutes n'est PAS annulée par une attaque ultérieure.
    await supabaseAdmin.rpc("visiter_ville", { p_visiteur_id: attaquant.userId, p_ville_id: cible.villeId });
    await supabaseAdmin
      .from("visites")
      .update({ created_at: new Date(Date.now() - 2 * 60_000).toISOString() })
      .eq("visiteur_id", attaquant.userId)
      .eq("ville_id", cible.villeId);
    await attendre(2200); // délai anti-rafale entre deux actions AntiVille
    const { data: attaque2, error: erreurAttaque2 } = await supabaseAdmin.rpc("lancer_action_antiville", {
      p_attaquant_id: attaquant.userId,
      p_ville_id: cible.villeId,
      p_type_action: "propagande",
    });
    expect(erreurAttaque2).toBeNull();
    expect((attaque2 as { visite_annulee: boolean }).visite_annulee).toBe(false);
    expect(await nbVisites(attaquant.userId, cible.villeId)).toBe(1);
  });

  test("§34 : toucher au panneau AntiVille suspend la visite automatique de la page", async ({ page }) => {
    test.setTimeout(120_000);
    const attaquant = await nouveau("anti-ui-attaquant", "HR");
    const cible = await nouveau("anti-ui-cible", "HR");
    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill(attaquant.email);
    await page.getByLabel("Mot de passe").fill(attaquant.motDePasse);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/ville$/, { timeout: 30_000 });

    // Horloge simulée : le minuteur de 2,5 s ne tourne que quand on le décide, ce qui rend
    // le scénario « je touche AntiVille avant que la visite ne parte » déterministe.
    await page.clock.install();
    await page.goto(`/villes?ville=${cible.villeId}`);
    const bouton = page.locator(".anti button").first();
    await expect(bouton).toBeVisible({ timeout: 30_000 });
    // Attendre l'hydratation de React (sans quoi le geste n'est pas encore écouté).
    await page.waitForFunction(() => {
      const b = document.querySelector(".anti button");
      return !!b && Object.keys(b).some((k) => k.startsWith("__reactProps"));
    });
    await bouton.click(); // un geste vers AntiVille, avant toute visite
    await page.clock.runFor(10_000); // le minuteur de visite arrive à échéance
    await attendre(1500);
    expect(await nbVisites(attaquant.userId, cible.villeId)).toBe(0);
  });
});
