import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * A-INTEGRER §26 A et B (migration 0042) : journal mondial public et centre
 * de notifications, lus dans des tables qui existent déjà (présidences,
 * conflits, alliances, événements de ville). Pays réservés à ce fichier :
 * EE, LV, LT. Client service_role recréé ici pour la même raison que les
 * specs des jalons précédents ("server-only" hors du pipeline Next.js).
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

const journal = async (limite = 200) =>
  ((await supabaseAdmin.rpc("journal_monde", { p_limite: limite })).data ?? []) as Record<string, unknown>[];
const notifs = async (joueurId: string) =>
  ((await supabaseAdmin.rpc("notifications_joueur", { p_joueur_id: joueurId, p_limite: 100 })).data ?? []) as Record<string, unknown>[];
const nbNonLues = async (joueurId: string) =>
  (await supabaseAdmin.rpc("nb_notifications_non_lues", { p_joueur_id: joueurId })).data as number;

async function nettoyer() {
  await supabaseAdmin.from("conflits").delete().in("pays_attaquant_id", ["EE", "LV", "LT"]);
  await supabaseAdmin.from("resultats_diplomatiques").delete().in("country_id", ["EE", "LV", "LT"]);
  await supabaseAdmin.from("propositions_diplomatiques").delete().in("country_id", ["EE", "LV", "LT"]);
}

test.afterAll(async () => {
  await nettoyer();
  for (const id of comptes) await supabaseAdmin.auth.admin.deleteUser(id);
});

test.describe.configure({ mode: "serial" });

test.describe("Journal mondial et notifications (A-INTEGRER §26 A/B)", () => {
  test("présidence : le journal annonce le changement, les deux propriétaires sont notifiés (acquise / perdue)", async () => {
    await nettoyer();
    const ancienne = await nouveau("jn-ancienne", "EE");
    await supabaseAdmin.rpc("verifier_president", { p_country_id: "EE" });
    const nouvelle = await nouveau("jn-nouvelle", "EE", 500);
    await supabaseAdmin.rpc("verifier_president", { p_country_id: "EE" });

    const lignes = await journal();
    const changement = lignes.find((l) => l.type === "president" && l.ville_id === nouvelle.villeId);
    expect(changement, "changement de présidence dans le journal").toBeDefined();
    expect(changement!.autre_ville_nom).toBe(ancienne.nom);
    // Le tout premier mandat (sans prédécesseur) n'est pas une « nouvelle » : absent du journal.
    expect(lignes.find((l) => l.type === "president" && l.ville_id === ancienne.villeId)).toBeUndefined();

    const pourNouvelle = await notifs(nouvelle.userId);
    expect(pourNouvelle.map((n) => n.type)).toContain("president_acquis");
    const pourAncienne = await notifs(ancienne.userId);
    const perdu = pourAncienne.find((n) => n.type === "president_perdu");
    expect(perdu?.autre_ville_nom).toBe(nouvelle.nom);
    expect(pourAncienne.find((n) => n.type === "president_acquis")).toBeDefined(); // son premier mandat
  });

  test("guerre et alliance : journal public, et notifications seulement pour les pays concernés", async () => {
    const lv = await nouveau("jn-lv", "LV");
    const lt = await nouveau("jn-lt", "LT");
    const ee = await supabaseAdmin.from("users").select("id").eq("country_id", "EE").limit(1).single();

    const { data: conflit } = await supabaseAdmin
      .from("conflits")
      .insert({ pays_attaquant_id: "LV", pays_defenseur_id: "LT", fin: new Date(Date.now() + 3 * 86_400_000).toISOString() })
      .select("id")
      .single();
    const { data: proposition } = await supabaseAdmin
      .from("propositions_diplomatiques")
      .insert({
        country_id: "LV",
        pays_cible_id: "EE",
        categorie: "alliance",
        semaine: new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10),
        proposee_par_ville_id: lv.villeId,
      })
      .select("id")
      .single();
    await supabaseAdmin.from("resultats_diplomatiques").insert({
      proposition_id: proposition!.id,
      country_id: "LV",
      pays_cible_id: "EE",
      categorie: "alliance",
      nb_pour: 2,
      nb_contre: 0,
      adoptee: true,
    });

    const lignes = await journal();
    expect(lignes.find((l) => l.id === `guerre:${conflit!.id}`)).toMatchObject({ type: "guerre_declaree", country_id: "LV", cible_country_id: "LT" });
    expect(lignes.find((l) => l.type === "alliance" && l.country_id === "LV" && l.cible_country_id === "EE")).toBeDefined();

    // Les deux pays en guerre sont notifiés, pas un pays tiers.
    for (const joueur of [lv.userId, lt.userId]) {
      expect((await notifs(joueur)).map((n) => n.id)).toContain(`guerre:${conflit!.id}`);
    }
    expect((await notifs(ee.data!.id as string)).map((n) => n.id)).not.toContain(`guerre:${conflit!.id}`);
    // L'alliance LV-EE concerne LV et EE, pas LT.
    expect((await notifs(lv.userId)).some((n) => n.type === "alliance")).toBe(true);
    expect((await notifs(lt.userId)).some((n) => n.type === "alliance")).toBe(false);

    // Fin du conflit.
    // Un conflit ne se termine qu'une fois sa date de fin passée : on la recule d'une minute.
    await supabaseAdmin
      .from("conflits")
      .update({ statut: "termine", resultat: "attaquant", fin: new Date(Date.now() - 60_000).toISOString() })
      .eq("id", conflit!.id);
    expect((await journal()).find((l) => l.id === `guerre_fin:${conflit!.id}`)).toMatchObject({ type: "guerre_terminee", resultat: "attaquant" });
  });

  test("événements de ville : les attaques subies notifient le maire mais n'apparaissent jamais dans le journal public", async () => {
    const maire = await nouveau("jn-ville", "LT");
    const { data: attaque } = await supabaseAdmin
      .from("city_events")
      .insert({ ville_id: maire.villeId, type: "attaque_recue", type_action: "greve", activite: "industrie", valeur: 2 })
      .select("id")
      .single();
    const { data: monument } = await supabaseAdmin
      .from("city_events")
      .insert({ ville_id: maire.villeId, type: "monument_debloque", valeur: 9 })
      .select("id")
      .single();
    const { data: petit } = await supabaseAdmin
      .from("city_events")
      .insert({ ville_id: maire.villeId, type: "monument_debloque", valeur: 0 })
      .select("id")
      .single();

    const mesNotifs = (await notifs(maire.userId)).map((n) => n.id);
    expect(mesNotifs).toEqual(expect.arrayContaining([`ev:${attaque!.id}`, `ev:${monument!.id}`, `ev:${petit!.id}`]));

    const lignes = (await journal()).map((l) => l.id);
    expect(lignes).not.toContain(`ev:${attaque!.id}`);
    expect(lignes).toContain(`ev:${monument!.id}`); // grand monument (palier 9 ≥ 8)
    expect(lignes).not.toContain(`ev:${petit!.id}`); // petit monument : reste dans sa ville
  });

  test("n°1 mondial (migration 0043) : journalisé une seule fois, annoncé au journal, gagné / perdu notifié aux deux propriétaires", async () => {
    test.setTimeout(90_000);
    // Population énorme (< 2^31) pour être, brièvement, la n°1 du monde ; la seconde la dépasse plus bas.
    const premiere = await nouveau("jn-monde-a", "EE", 2_000_000_000);
    const seconde = await nouveau("jn-monde-b", "EE");
    try {
      // La première devient n°1 (éventuellement après la ville n°1 d'avant : mandat précédent possible).
      await supabaseAdmin.rpc("verifier_premier_mondial");
      const mandatA = await supabaseAdmin.from("premiers_mondiaux").select("ville_id, fin").is("fin", null);
      expect(mandatA.data).toHaveLength(1);
      expect(mandatA.data![0].ville_id).toBe(premiere.villeId);
      // Idempotent : un second appel ne change rien.
      await supabaseAdmin.rpc("verifier_premier_mondial");
      expect((await supabaseAdmin.from("premiers_mondiaux").select("id").is("fin", null)).data).toHaveLength(1);

      // La seconde dépasse la première.
      await supabaseAdmin.from("cities").update({ population: 2_100_000_000, population_max: 2_100_000_000 }).eq("id", seconde.villeId);
      await supabaseAdmin.rpc("verifier_premier_mondial");
      const ouverts = (await supabaseAdmin.from("premiers_mondiaux").select("ville_id").is("fin", null)).data!;
      expect(ouverts).toEqual([{ ville_id: seconde.villeId }]);

      const lignes = await journal();
      const nouvelle = lignes.find((l) => l.type === "premier_mondial" && l.ville_id === seconde.villeId);
      expect(nouvelle, "n°1 mondial dans le journal").toBeDefined();
      expect(nouvelle!.autre_ville_nom).toBe(premiere.nom);

      expect((await notifs(seconde.userId)).map((n) => n.type)).toContain("premier_mondial_acquis");
      const perdu = (await notifs(premiere.userId)).find((n) => n.type === "premier_mondial_perdu");
      expect(perdu?.autre_ville_nom).toBe(seconde.nom);
    } finally {
      // Hors du top mondial au plus vite : ces populations fausseraient les autres suites.
      for (const v of [premiere, seconde]) {
        await supabaseAdmin.from("cities").update({ population: 1, population_max: 1 }).eq("id", v.villeId);
      }
      await supabaseAdmin.rpc("verifier_premier_mondial");
    }
  });

  test("non lues : la pastille compte, la page notifications marque tout lu, un nouvel événement la rallume ; un joueur ne lit jamais les notifications d'un autre", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const joueur = await nouveau("jn-lecture", "LV");
    const autre = await nouveau("jn-autre", "LT");
    await supabaseAdmin.from("city_events").insert({ ville_id: joueur.villeId, type: "technologie_debloquee", valeur: 0 });
    expect(await nbNonLues(joueur.userId)).toBeGreaterThan(0);

    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill(joueur.email);
    await page.getByLabel("Mot de passe").fill(joueur.motDePasse);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/ville$/, { timeout: 30_000 });

    // La cloche affiche une pastille.
    await expect(page.locator(".cloche-nb")).toBeVisible({ timeout: 20_000 });

    await page.goto("/notifications");
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Technologie débloquée :")).toBeVisible();
    await expect(page.getByText("Nouveau", { exact: true }).first()).toBeVisible(); // « non lu » montré cette fois

    // Marqué lu : plus rien de non lu.
    expect(await nbNonLues(joueur.userId)).toBe(0);
    await page.goto("/ville");
    await expect(page.locator(".cloche")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(".cloche-nb")).toHaveCount(0);

    // Un nouvel événement rallume la pastille.
    await supabaseAdmin.from("city_events").insert({ ville_id: joueur.villeId, type: "monument_debloque", valeur: 0 });
    expect(await nbNonLues(joueur.userId)).toBe(1);

    // Le journal est public : visible sans connexion, avec le texte de la présidence.
    const anonyme = await page.context().browser()!.newContext();
    const pageAnonyme = await anonyme.newPage();
    await pageAnonyme.goto("http://localhost:3000/journal");
    await expect(pageAnonyme.getByRole("heading", { name: "Journal du monde" })).toBeVisible({ timeout: 30_000 });
    await anonyme.close();

    // Un joueur connecté ne peut pas lire les notifications d'un autre : identité vérifiée par le serveur.
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: erreurConnexion } = await client.auth.signInWithPassword({ email: joueur.email, password: joueur.motDePasse });
    expect(erreurConnexion).toBeNull();
    const refus = await client.rpc("notifications_joueur", { p_joueur_id: autre.userId, p_limite: 10 });
    expect(refus.error?.code).toBe("P0007");
    const refusMarquer = await client.rpc("marquer_notifications_lues", { p_joueur_id: autre.userId });
    expect(refusMarquer.error?.code).toBe("P0007");
    const moi = await client.rpc("nb_notifications_non_lues", { p_joueur_id: joueur.userId });
    expect(moi.error).toBeNull();
  });
});
