import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 9 : page pays, agrégation des statistiques nationales
 * (population, influence, activité) à partir des villes membres — voir
 * docs/ROADMAP.md et docs/DECISIONS.md §4. Client service_role recréé
 * ici pour la même raison que les specs des jalons précédents
 * ("server-only" hors du pipeline Next.js).
 *
 * Comme pour le Jalon 8bis, pas de vérification rouge par sabotage sur
 * les fonctions SQL elles-mêmes (pas d'accès psql direct) : les
 * assertions vérifient des valeurs exactes calculées à partir d'actions
 * connues.
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
    p_pseudo: prefixe,
    p_country_id: paysId,
    p_nom_ville: `${prefixe}-ville`,
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

test.describe("Jalon 9 — naissance d'un pays", () => {
  test("stats_pays agrège exactement la population et l'influence des villes du pays", async () => {
    const paysUnique = "DE"; // les villes de test allemandes ont des populations connues, isolées via influencer_ville ci-dessous
    // Instantané pris AVANT toute création de compte : nb_villes et
    // population_totale doivent inclure les deux nouvelles villes créées
    // juste après, pas seulement l'action d'influence.
    const { data: avant } = await supabaseAdmin.rpc("stats_pays", { p_country_id: paysUnique });
    const statsAvant = Array.isArray(avant) ? avant[0] : avant;

    const a = await creerCompteAvecVille("pays-agg-a", paysUnique, "de-by");
    const b = await creerCompteAvecVille("pays-agg-b", paysUnique, "de-by");
    try {
      // +1 influence sur A (via B), population des deux villes inchangée
      // depuis leur création (1 chacune) : delta connu et isolé de tout
      // le reste des données déjà en base.
      const { error } = await supabaseAdmin.rpc("influencer_ville", {
        p_joueur_id: b.userId,
        p_ville_id: a.villeId,
      });
      expect(error).toBeNull();

      const { data: apres } = await supabaseAdmin.rpc("stats_pays", { p_country_id: paysUnique });
      const statsApres = Array.isArray(apres) ? apres[0] : apres;

      expect(statsApres.nb_villes).toBe(statsAvant.nb_villes + 2);
      expect(statsApres.influence_totale).toBe(statsAvant.influence_totale + 1);
      expect(statsApres.population_totale).toBe(statsAvant.population_totale + 2); // +1 chacune à la création
    } finally {
      await supprimerCompte(a.userId);
      await supprimerCompte(b.userId);
    }
  });

  test("activite_7j_de et activite_ville comptent exactement les jours actifs sur 7 jours", async () => {
    const joueur = await creerCompteAvecVille("pays-activite-j");
    const cible = await creerCompteAvecVille("pays-activite-c");
    try {
      const { data: avant } = await supabaseAdmin.rpc("activite_7j_de", { p_owner_id: joueur.userId });
      expect(avant).toBe(0); // aucune action encore

      const { error } = await supabaseAdmin.rpc("visiter_ville", {
        p_visiteur_id: joueur.userId,
        p_ville_id: cible.villeId,
      });
      expect(error).toBeNull();

      const { data: apres } = await supabaseAdmin.rpc("activite_7j_de", { p_owner_id: joueur.userId });
      expect(apres).toBe(1); // actif aujourd'hui, un seul jour distinct

      const { data: viaVille } = await supabaseAdmin.rpc("activite_ville", { p_ville_id: joueur.villeId });
      expect(viaVille).toBe(1); // même résultat via la ville plutôt que le joueur
    } finally {
      await supprimerCompte(joueur.userId);
      await supprimerCompte(cible.userId);
    }
  });

  test("la page /pays affiche les statistiques du pays et permet d'en changer", async ({ page }) => {
    // Premier test du fichier à toucher le navigateur (les deux
    // précédents ne font que des appels RPC directs) : /connexion,
    // /ville, /pays et /villes se compilent tous à froid l'un après
    // l'autre sur un serveur de dev qui vient de démarrer — bien plus
    // que les 30 s par défaut. Vérifié manuellement que chacune de ces
    // pages fonctionne (voir DECISIONS.md §4, journal du Jalon 9) :
    // seule la compilation à froid en cascade dépassait le délai.
    test.setTimeout(90_000);
    const joueur = await creerCompteAvecVille("pays-ui", "FR", "fr-idf");
    try {
      // Population très haute pour être certain d'apparaître dans le
      // "top 10" du pays malgré les vraies villes de test déjà en base
      // (ex. Belval-sur-Loire, 114 000 habitants) — sans ça, une ville
      // toute neuve à 1 habitant n'a aucune chance d'y figurer, ce qui
      // ne serait pas un bug de la page mais un mauvais choix de test.
      // population_max doit monter en même temps (contrainte SQL
      // population_max >= population, Jalon 6) sous peine d'échec
      // silencieux de cette mise à jour.
      const { error: erreurPop } = await supabaseAdmin
        .from("cities")
        .update({ population: 5_000_000, population_max: 5_000_000 })
        .eq("id", joueur.villeId);
      expect(erreurPop).toBeNull();

      await connecter(page, joueur.email, joueur.motDePasse);
      await expect(page).toHaveURL(/\/ville$/, { timeout: 20_000 });

      // Le lien "Mon pays" depuis Ma ville mène bien à /pays. Délai
      // allongé : première visite de cette route sur un serveur de dev
      // à froid, compilée à la demande (même cause que Jalon 1/7bis,
      // voir DECISIONS.md §4).
      await page.getByRole("link", { name: /Mon pays/ }).click();
      await expect(page).toHaveURL(/\/pays$/, { timeout: 20_000 });
      await expect(page.getByRole("heading", { name: "France" })).toBeVisible();
      await expect(page.getByText(joueur.villeNom)).toBeVisible(); // dans les villes principales

      // Changer de pays via le sélecteur.
      await page.getByLabel("Voir un autre pays").selectOption({ label: "Allemagne" });
      await expect(page).toHaveURL(/pays=DE/);
      await expect(page.getByRole("heading", { name: "Allemagne" })).toBeVisible();

      // Première visite de /villes dans ce fichier : même précaution de
      // délai que les navigations précédentes.
      await page.getByRole("link", { name: /Voir toutes les villes/ }).click();
      await expect(page).toHaveURL(/\/villes\?pays=DE/, { timeout: 20_000 });
    } finally {
      await supprimerCompte(joueur.userId);
    }
  });

  test("l'activité de /ville n'est plus figée à 0 après une visite donnée", async ({ page }) => {
    // Même précaution que le test précédent si ce fichier est exécuté
    // seul (ce test deviendrait alors le premier à toucher le
    // navigateur).
    test.setTimeout(60_000);
    const joueur = await creerCompteAvecVille("pays-activite-ui");
    const cible = await creerCompteAvecVille("pays-activite-ui-cible");
    try {
      await supabaseAdmin.rpc("visiter_ville", { p_visiteur_id: joueur.userId, p_ville_id: cible.villeId });

      await connecter(page, joueur.email, joueur.motDePasse);
      await expect(page).toHaveURL(/\/ville$/, { timeout: 20_000 });

      // Tuile "Activité" : la valeur ("1") doit apparaître dans les
      // tuiles, pas rester à "0" comme avant ce jalon.
      const tuileActivite = page.locator(".tile", { hasText: "Activité" });
      await expect(tuileActivite.locator("b")).toHaveText("1");
    } finally {
      await supprimerCompte(joueur.userId);
      await supprimerCompte(cible.userId);
    }
  });
});
