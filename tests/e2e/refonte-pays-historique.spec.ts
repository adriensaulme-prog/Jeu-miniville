import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Refonte de l'onglet Pays (docs/A-INTEGRER.md §23, migration 0036) :
 * statut diplomatique de la semaine et historique hebdomadaire calculé à
 * la demande. Client service_role recréé ici pour la même raison que
 * les specs des jalons précédents ("server-only" hors du pipeline
 * Next.js). Pays réservés à ce fichier : GR/TR (guerre), NL/DK
 * (alliance), SK (paix, aucune donnée), HU (page UI).
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const suffixe = () => Math.random().toString(36).slice(2, 6);

/** Lundi (UTC, "YYYY-MM-DD") de la semaine courante décalée de `decalage` semaines. */
function lundi(decalage = 0): string {
  const m = new Date();
  const jour = m.getUTCDay();
  const depuis = jour === 0 ? 6 : jour - 1;
  return new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), m.getUTCDate() - depuis + decalage * 7))
    .toISOString()
    .slice(0, 10);
}

async function creerCompteAvecVille(prefixe: string, paysId: string) {
  const email = `${prefixe}-${Date.now()}-${suffixe()}@example.com`;
  const motDePasse = "mot-de-passe-test-e2e";
  const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password: motDePasse, email_confirm: true });
  if (error || !data.user) throw new Error(`Impossible de créer ${prefixe} : ${error?.message}`);
  const { data: ville, error: erreurVille } = await supabaseAdmin.rpc("creer_ville", {
    p_owner_id: data.user.id,
    p_pseudo: `${prefixe}-${suffixe()}`,
    p_country_id: paysId,
    p_nom_ville: `${prefixe}-ville-${suffixe()}`,
  });
  if (erreurVille) throw new Error(`Impossible de créer la ville de ${prefixe} : ${erreurVille.message}`);
  return { userId: data.user.id, email, motDePasse, villeId: ville.id as string };
}

const comptes: string[] = [];
async function nouveau(prefixe: string, paysId: string) {
  const c = await creerCompteAvecVille(prefixe, paysId);
  comptes.push(c.userId);
  return c;
}

async function nettoyerPaires() {
  await supabaseAdmin.from("conflits").delete().in("pays_attaquant_id", ["GR", "TR", "NL", "DK", "HU"]);
  await supabaseAdmin.from("resultats_diplomatiques").delete().in("country_id", ["GR", "TR", "NL", "DK", "HU"]);
  await supabaseAdmin.from("votes_pays").delete().in("country_id", ["GR", "TR", "NL", "DK", "HU"]);
  await supabaseAdmin.from("propositions_diplomatiques").delete().in("country_id", ["GR", "TR", "NL", "DK", "HU"]);
}

test.afterAll(async () => {
  await nettoyerPaires();
  for (const id of comptes) await supabaseAdmin.auth.admin.deleteUser(id);
});

test.describe.configure({ mode: "serial" });

test.describe("Refonte de l'onglet Pays — statut et historique hebdomadaire", () => {
  test("historique_pays : vote gagnant, décision, conflit et pertes par camp, semaine passée seulement", async () => {
    await nettoyerPaires();
    const gr = await nouveau("hist-gr", "GR");
    const grB = await nouveau("hist-gr2", "GR");
    const grC = await nouveau("hist-gr3", "GR");
    const tr = await nouveau("hist-tr", "TR");
    // Vote et décision il y a deux semaines ; le conflit qu'elle déclenche
    // démarre la semaine suivante (la décision est résolue en fin de semaine).
    const semainePassee = lundi(-2);
    const semaineConflit = lundi(-1);

    // Vote de ressource de la semaine passée : techno 2, culture 1 => techno.
    await supabaseAdmin.from("votes_pays").insert([
      { joueur_id: gr.userId, country_id: "GR", categorie: "techno", semaine: semainePassee },
      { joueur_id: grB.userId, country_id: "GR", categorie: "techno", semaine: semainePassee },
      { joueur_id: grC.userId, country_id: "GR", categorie: "culture", semaine: semainePassee },
    ]);
    // Et un vote de la semaine COURANTE, qui ne doit pas apparaître.
    await supabaseAdmin.from("votes_pays").insert({
      joueur_id: tr.userId,
      country_id: "TR",
      categorie: "commerce",
      semaine: lundi(0),
    });

    // Décision diplomatique de GR la semaine passée : rivalité contre TR, adoptée 2-1.
    const { data: proposition } = await supabaseAdmin
      .from("propositions_diplomatiques")
      .insert({ country_id: "GR", pays_cible_id: "TR", categorie: "rivalite", semaine: semainePassee, proposee_par_ville_id: gr.villeId })
      .select()
      .single();
    await supabaseAdmin.from("resultats_diplomatiques").insert({
      proposition_id: proposition!.id,
      country_id: "GR",
      pays_cible_id: "TR",
      categorie: "rivalite",
      nb_pour: 2,
      nb_contre: 1,
      adoptee: true,
    });

    // Conflit commencé la semaine passée (mercredi), terminé : GR l'emporte.
    const debut = new Date(`${semaineConflit}T12:00:00Z`);
    debut.setUTCDate(debut.getUTCDate() + 2);
    const { data: conflit } = await supabaseAdmin
      .from("conflits")
      .insert({
        pays_attaquant_id: "GR",
        pays_defenseur_id: "TR",
        debut: debut.toISOString(),
        fin: new Date(debut.getTime() + 7 * 86_400_000).toISOString(),
        statut: "termine",
        resultat: "attaquant",
        dernier_jour_traite: lundi(0),
        jours_gagnes_attaquant: 5,
        jours_gagnes_defenseur: 2,
      })
      .select()
      .single();
    // Pertes : 30 + 20 côté TR (défenseur), 7 côté GR.
    await supabaseAdmin.from("city_events").insert([
      { ville_id: tr.villeId, type: "guerre", valeur: 30, conflit_id: conflit!.id },
      { ville_id: tr.villeId, type: "guerre", valeur: 20, conflit_id: conflit!.id },
      { ville_id: gr.villeId, type: "guerre", valeur: 7, conflit_id: conflit!.id },
    ]);

    // Vue du côté attaquant.
    const { data: lignesGR, error } = await supabaseAdmin.rpc("historique_pays", { p_country_id: "GR", p_nb_semaines: 12 });
    expect(error).toBeNull();
    const semaines = (lignesGR as { semaine: string }[]).map((l) => l.semaine);
    expect(semaines).not.toContain(lundi(0)); // semaine courante exclue
    const ligneVote = (lignesGR as Record<string, unknown>[]).find((l) => l.semaine === semainePassee && l.conflit_id === null);
    expect(ligneVote).toMatchObject({
      vote_categorie: "techno",
      vote_nb: 2,
      decision_categorie: "rivalite",
      decision_cible: "TR",
      decision_adoptee: true,
      decision_pour: 2,
      decision_contre: 1,
    });
    const ligneConflit = (lignesGR as Record<string, unknown>[]).find((l) => l.conflit_id === conflit!.id);
    expect(ligneConflit?.semaine).toBe(semaineConflit);
    expect(ligneConflit).toMatchObject({
      conflit_role: "attaquant",
      conflit_adversaire: "TR",
      conflit_statut: "termine",
      conflit_resultat: "attaquant",
      pertes_pays: 7,
      pertes_adversaire: 50,
    });

    // Vue du côté défenseur : même conflit, rôle et pertes inversés.
    const { data: lignesTR } = await supabaseAdmin.rpc("historique_pays", { p_country_id: "TR" });
    const ligneTR = (lignesTR as Record<string, unknown>[]).find((l) => l.conflit_id === conflit!.id);
    expect(ligneTR).toMatchObject({
      conflit_role: "defenseur",
      conflit_adversaire: "GR",
      pertes_pays: 50,
      pertes_adversaire: 7,
    });
  });

  test("statut_pays_semaine : paix par défaut, guerre si conflit en cours, alliance adoptée la semaine dernière", async () => {
    await nettoyerPaires();
    const nl = await nouveau("stat-nl", "NL");
    await nouveau("stat-dk", "DK");

    const { data: paix } = await supabaseAdmin.rpc("statut_pays_semaine", { p_country_id: "SK" });
    expect(paix).toEqual([{ statut: "paix", pays_lie: null }]);

    // Alliance NL → DK adoptée la semaine dernière : les deux pays sont alliés.
    const { data: proposition } = await supabaseAdmin
      .from("propositions_diplomatiques")
      .insert({ country_id: "NL", pays_cible_id: "DK", categorie: "alliance", semaine: lundi(-1), proposee_par_ville_id: nl.villeId })
      .select()
      .single();
    await supabaseAdmin.from("resultats_diplomatiques").insert({
      proposition_id: proposition!.id,
      country_id: "NL",
      pays_cible_id: "DK",
      categorie: "alliance",
      nb_pour: 3,
      nb_contre: 0,
      adoptee: true,
    });
    expect((await supabaseAdmin.rpc("statut_pays_semaine", { p_country_id: "NL" })).data).toEqual([{ statut: "allie", pays_lie: "DK" }]);
    expect((await supabaseAdmin.rpc("statut_pays_semaine", { p_country_id: "DK" })).data).toEqual([{ statut: "allie", pays_lie: "NL" }]);

    // Un conflit en cours l'emporte sur l'alliance.
    await supabaseAdmin.from("conflits").insert({
      pays_attaquant_id: "NL",
      pays_defenseur_id: "DK",
      fin: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    });
    expect((await supabaseAdmin.rpc("statut_pays_semaine", { p_country_id: "NL" })).data).toEqual([{ statut: "guerre", pays_lie: "DK" }]);
    expect((await supabaseAdmin.rpc("statut_pays_semaine", { p_country_id: "DK" })).data).toEqual([{ statut: "guerre", pays_lie: "NL" }]);
  });

  test("la page /pays n'a plus de carte et affiche le statut et l'historique hebdomadaire", async ({ page }) => {
    test.setTimeout(120_000);
    await nettoyerPaires();
    const joueur = await nouveau("hist-ui", "HU");
    await supabaseAdmin.from("votes_pays").insert({
      joueur_id: joueur.userId,
      country_id: "HU",
      categorie: "industrie",
      semaine: lundi(-1),
    });

    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill(joueur.email);
    await page.getByLabel("Mot de passe").fill(joueur.motDePasse);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/ville$/);

    await page.goto("/pays");
    await expect(page.getByText("En paix")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Historique hebdomadaire" })).toBeVisible();
    await expect(page.getByText("Ressource votée")).toBeVisible();
    await expect(page.locator("svg.carte-pays, .carte-pays")).toHaveCount(0);
  });
});
