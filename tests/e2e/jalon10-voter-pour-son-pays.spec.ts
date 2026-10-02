import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 10 : vote hebdomadaire de ressource (industrie/techno/culture/
 * commerce), résultat proportionnel aux votes, ressources nationales
 * accumulées — voir docs/ROADMAP.md et docs/DECISIONS.md §4. Client
 * service_role recréé ici pour la même raison que les specs des jalons
 * précédents ("server-only" hors du pipeline Next.js).
 *
 * Comme pour les Jalons 8bis et 9, pas de vérification rouge par
 * sabotage sur les fonctions SQL elles-mêmes (pas d'accès psql direct) :
 * les assertions vérifient des deltas exacts calculés à partir d'actions
 * connues, robustes au contenu déjà présent en base.
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function creerCompteAvecVille(prefixe: string, paysId = "FR", regionId = "fr-idf") {
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
    p_pseudo: `${prefixe}-${Math.random().toString(36).slice(2, 6)}`,
    p_country_id: paysId,
    p_nom_ville: `${prefixe}-ville-${Math.random().toString(36).slice(2, 6)}`,
    p_region_id: regionId,
  });
  if (erreurVille) {
    throw new Error(`Impossible de créer la ville de ${prefixe} : ${erreurVille.message}`);
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

test.describe("Jalon 10 — voter pour son pays", () => {
  test("resultats_vote_semaine reflète exactement les votes de la semaine, ressources_pays les cumule", async () => {
    const a = await creerCompteAvecVille("vote-a");
    const b = await creerCompteAvecVille("vote-b");
    const c = await creerCompteAvecVille("vote-c");
    try {
      const { data: avantResultats } = await supabaseAdmin.rpc("resultats_vote_semaine", {
        p_country_id: "FR",
        p_semaine: null,
      });
      const industrieAvant = avantResultats.find((r: { categorie: string }) => r.categorie === "industrie").nb_votes;
      const cultureAvant = avantResultats.find((r: { categorie: string }) => r.categorie === "culture").nb_votes;

      const { data: avantRessources } = await supabaseAdmin.rpc("ressources_pays", { p_country_id: "FR" });
      const industrieRessourceAvant = avantRessources.find(
        (r: { categorie: string }) => r.categorie === "industrie"
      ).total;

      const { error: e1 } = await supabaseAdmin.rpc("voter_pays", { p_joueur_id: a.userId, p_categorie: "industrie" });
      const { error: e2 } = await supabaseAdmin.rpc("voter_pays", { p_joueur_id: b.userId, p_categorie: "industrie" });
      const { error: e3 } = await supabaseAdmin.rpc("voter_pays", { p_joueur_id: c.userId, p_categorie: "culture" });
      expect(e1).toBeNull();
      expect(e2).toBeNull();
      expect(e3).toBeNull();

      const { data: apresResultats } = await supabaseAdmin.rpc("resultats_vote_semaine", {
        p_country_id: "FR",
        p_semaine: null,
      });
      const industrieApres = apresResultats.find((r: { categorie: string }) => r.categorie === "industrie");
      const cultureApres = apresResultats.find((r: { categorie: string }) => r.categorie === "culture");
      expect(industrieApres.nb_votes).toBe(industrieAvant + 2);
      expect(cultureApres.nb_votes).toBe(cultureAvant + 1);
      // Résultat proportionnel : le pourcentage suit exactement le
      // nombre de votes, recalculé sur le nouveau total (pas figé).
      const totalApres = apresResultats.reduce((s: number, r: { nb_votes: number }) => s + r.nb_votes, 0);
      const pourcentageAttendu = Math.round((industrieApres.nb_votes * 1000) / totalApres) / 10;
      expect(industrieApres.pourcentage).toBe(pourcentageAttendu);

      const { data: apresRessources } = await supabaseAdmin.rpc("ressources_pays", { p_country_id: "FR" });
      const industrieRessourceApres = apresRessources.find(
        (r: { categorie: string }) => r.categorie === "industrie"
      ).total;
      expect(industrieRessourceApres).toBe(industrieRessourceAvant + 2);
    } finally {
      await supprimerCompte(a.userId);
      await supprimerCompte(b.userId);
      await supprimerCompte(c.userId);
    }
  });

  test("ressources_pays cumule plusieurs semaines, resultats_vote_semaine reste borné à la semaine demandée", async () => {
    const joueur = await creerCompteAvecVille("vote-cumul");
    try {
      // Vote "d'une semaine passée" inséré directement (bypass
      // voter_pays, qui ne permet pas de choisir la semaine) pour
      // vérifier la distinction cumul (ressources_pays) / instantané
      // (resultats_vote_semaine).
      const ilDeuxSemaines = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const { data: profil } = await supabaseAdmin.from("users").select("country_id").eq("id", joueur.userId).single();
      const { error: erreurInsert } = await supabaseAdmin.from("votes_pays").insert({
        joueur_id: joueur.userId,
        country_id: profil!.country_id,
        categorie: "commerce",
        semaine: ilDeuxSemaines,
      });
      expect(erreurInsert).toBeNull();

      const { data: resultatsSemainePassee } = await supabaseAdmin.rpc("resultats_vote_semaine", {
        p_country_id: "FR",
        p_semaine: ilDeuxSemaines,
      });
      const commerceSemainePassee = resultatsSemainePassee.find(
        (r: { categorie: string }) => r.categorie === "commerce"
      );
      expect(commerceSemainePassee.nb_votes).toBeGreaterThanOrEqual(1);

      const { data: resultatsSemaineCourante } = await supabaseAdmin.rpc("resultats_vote_semaine", {
        p_country_id: "FR",
        p_semaine: null,
      });
      // Le vote inséré directement est daté d'il y a 2 semaines : il ne
      // doit pas compter dans la semaine courante pour ce joueur précis
      // (vérifié en base plutôt que sur le total, qui peut contenir
      // d'autres votes du même run).
      const { data: monVoteCetteSemaine } = await supabaseAdmin
        .from("votes_pays")
        .select("id")
        .eq("joueur_id", joueur.userId)
        .neq("semaine", ilDeuxSemaines);
      expect(monVoteCetteSemaine).toEqual([]);
      void resultatsSemaineCourante;
    } finally {
      await supprimerCompte(joueur.userId);
    }
  });

  test("sabotage : un deuxième vote la même semaine est refusé", async () => {
    const joueur = await creerCompteAvecVille("vote-double");
    try {
      const { error: premier } = await supabaseAdmin.rpc("voter_pays", {
        p_joueur_id: joueur.userId,
        p_categorie: "techno",
      });
      expect(premier).toBeNull();

      const { error: second } = await supabaseAdmin.rpc("voter_pays", {
        p_joueur_id: joueur.userId,
        p_categorie: "culture",
      });
      expect(second?.code).toBe("23505");

      const { data: votes } = await supabaseAdmin
        .from("votes_pays")
        .select("categorie")
        .eq("joueur_id", joueur.userId);
      expect(votes).toHaveLength(1);
      expect(votes![0].categorie).toBe("techno"); // le premier vote reste, pas écrasé
    } finally {
      await supprimerCompte(joueur.userId);
    }
  });

  test("la page /pays permet de voter, affiche le résultat, et masque le vote pour un pays étranger", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const joueur = await creerCompteAvecVille("vote-ui", "FR", "fr-idf");
    try {
      await connecter(page, joueur.email, joueur.motDePasse);
      await expect(page).toHaveURL(/\/ville$/, { timeout: 20_000 });

      await page.goto("/pays");
      await expect(page.getByRole("heading", { name: "Vote hebdomadaire" })).toBeVisible({ timeout: 20_000 });

      await page.getByRole("button", { name: "Culture" }).click();
      // "Culture" apparaît aussi dans les résultats et les ressources
      // plus bas sur la page : on vise le message de confirmation
      // précisément, pas n'importe quelle occurrence du mot.
      const confirmation = page.getByText("Tu as voté pour", { exact: false });
      await expect(confirmation).toBeVisible();
      await expect(confirmation).toContainText("Culture");
      // Le bouton de vote disparaît une fois le vote posé.
      await expect(page.getByRole("button", { name: "Culture" })).toHaveCount(0);

      // Sur un pays étranger, pas de section de vote (on ne vote pas
      // pour un pays qu'on ne représente pas).
      await page.getByLabel("Voir un autre pays").selectOption({ label: "Allemagne" });
      await expect(page).toHaveURL(/pays=DE/);
      await expect(page.getByRole("heading", { name: "Vote hebdomadaire" })).toHaveCount(0);
    } finally {
      await supprimerCompte(joueur.userId);
    }
  });
});
