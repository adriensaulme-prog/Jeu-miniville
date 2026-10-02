import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 21 — « Revoir les règles du jeu » appliqué au conflit pays
 * (guerre/mobilisation) : docs/DECISIONS.md §10 point 22 et §4 (grille
 * effet unitaire faible / cumul du jour / plafond / paliers visibles,
 * déjà appliquée à AntiVille au Jalon 18). Choix d'Adrien (AskUserQuestion,
 * 28/09/2026) : contrairement à AntiVille, un conflit pays n'avait
 * ENCORE AUCUN effet concret (juste un badge attaquant/défenseur/égalité
 * à J+7) — cette migration en crée un, sur cette même grille. Détail
 * complet dans supabase/migrations/0032_jalon_grille_guerre.sql.
 *
 * Client service_role recréé ici pour la même raison que les specs des
 * jalons précédents ("server-only" hors du pipeline Next.js).
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function creerCompteAvecVille(prefixe: string, paysId: string, population = 1) {
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
    p_region_id: null,
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

  return { userId, email, motDePasse, villeId: ville.id as string };
}

async function supprimerCompte(userId: string) {
  await supabaseAdmin.auth.admin.deleteUser(userId);
}

async function nettoyerConflit(attaquantId: string, defenseurId: string) {
  await supabaseAdmin.from("conflits").delete().eq("pays_attaquant_id", attaquantId).eq("pays_defenseur_id", defenseurId);
}

/** Donne de l'activité (Jalon 9, activite_7j_de) à un joueur sur
 * `jours` jours distincts des 7 derniers jours — même astuce que
 * tests/e2e/jalon13-france-contre-allemagne.spec.ts : des lignes
 * `visites` insérées directement, pas de vrai visiteur nécessaire. */
async function donnerActivite(villeId: string, userId: string, jours: number) {
  const lignes = Array.from({ length: jours }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    return { visiteur_id: userId, ville_id: villeId, jour: d.toISOString().slice(0, 10) };
  });
  const { error } = await supabaseAdmin.from("visites").insert(lignes);
  if (error) throw new Error(`donnerActivite a échoué : ${error.message}`);
}

function ilYA(jours: number): string {
  return new Date(Date.now() - jours * 24 * 60 * 60 * 1000).toISOString();
}

async function connecter(page: import("@playwright/test").Page, email: string, motDePasse: string) {
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(motDePasse);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

test.describe.configure({ mode: "serial" });

test.describe("Jalon 21 — grille effet unitaire/cumul/plafond/paliers appliquée à la guerre", () => {
  test("chaque jour gagné inflige une perte de population faible à l'adversaire, cumulée jour après jour (rattrapage multi-jours en un seul appel)", async () => {
    const attaquant = await creerCompteAvecVille("j21-cumul-atk", "CL", 1);
    const defenseur = await creerCompteAvecVille("j21-cumul-def", "UY", 100_000);
    try {
      // Un seul jour d'activité suffit : effort_national(CL) = 1, très
      // supérieur à floor(0 * 1,5) = 0 côté UY (aucune activité, aucune
      // ressource) — l'attaquant gagne chaque jour du rattrapage.
      await donnerActivite(attaquant.villeId, attaquant.userId, 1);

      // Conflit démarré il y a 2 jours, jamais encore traité
      // (dernier_jour_traite = null) : le prochain appel doit rattraper
      // 3 journées d'un coup (J-2, J-1, aujourd'hui), toutes gagnées par
      // l'attaquant vu l'écart d'effort.
      const { data: conflit, error: erreurInsertion } = await supabaseAdmin
        .from("conflits")
        .insert({
          pays_attaquant_id: "CL",
          pays_defenseur_id: "UY",
          debut: ilYA(2),
          fin: ilYA(-10), // dans 10 jours : ne doit pas encore se terminer
        })
        .select()
        .single();
      expect(erreurInsertion).toBeNull();

      const { error: erreurResolution } = await supabaseAdmin.rpc("resoudre_conflits_en_cours");
      expect(erreurResolution).toBeNull();

      const { data: conflitApres } = await supabaseAdmin
        .from("conflits")
        .select("statut, jours_gagnes_attaquant, jours_gagnes_defenseur")
        .eq("id", conflit.id)
        .single();
      expect(conflitApres?.statut).toBe("en_cours"); // pas encore à échéance
      expect(conflitApres?.jours_gagnes_attaquant).toBe(3);
      expect(conflitApres?.jours_gagnes_defenseur).toBe(0);

      // Perte unitaire faible (0,1 %/jour) cumulée sur 3 jours, sur la
      // population du défenseur (100 000 → 99 900 → 99 800 → 99 700) :
      // bien loin du plafond de 5 % pour ce nombre de jours.
      const { data: villeDefenseur } = await supabaseAdmin
        .from("cities")
        .select("population")
        .eq("id", defenseur.villeId)
        .single();
      expect(villeDefenseur?.population).toBe(99_700);

      const { data: evenements } = await supabaseAdmin
        .from("city_events")
        .select("valeur, conflit_id, type")
        .eq("ville_id", defenseur.villeId)
        .eq("type", "guerre");
      expect(evenements).toHaveLength(3);
      expect(evenements?.every((e) => e.conflit_id === conflit.id)).toBe(true);
      expect(evenements?.reduce((s, e) => s + Number(e.valeur), 0)).toBe(300);

      // Idempotence : un deuxième appel le même jour ne rejoue rien.
      await supabaseAdmin.rpc("resoudre_conflits_en_cours");
      const { data: villeApresRejeu } = await supabaseAdmin
        .from("cities")
        .select("population")
        .eq("id", defenseur.villeId)
        .single();
      expect(villeApresRejeu?.population).toBe(99_700);
    } finally {
      await nettoyerConflit("CL", "UY");
      await supprimerCompte(attaquant.userId);
      await supprimerCompte(defenseur.userId);
    }
  });

  test("un plafond limite la perte totale sur toute la durée du conflit, même en rattrapant de très nombreux jours d'un coup", async () => {
    const attaquant = await creerCompteAvecVille("j21-plafond-atk", "IS", 1);
    const defenseur = await creerCompteAvecVille("j21-plafond-def", "FI", 100_000);
    try {
      await donnerActivite(attaquant.villeId, attaquant.userId, 1);

      // Conflit "commencé" il y a 90 jours, jamais traité : un seul
      // appel doit rattraper ~90 journées perdues d'affilée pour le
      // défenseur — sans le plafond, ça ferait bien plus que 5 % de
      // perte (90 × 0,1 % ≈ 9 %).
      const { data: conflit, error: erreurInsertion } = await supabaseAdmin
        .from("conflits")
        .insert({
          pays_attaquant_id: "IS",
          pays_defenseur_id: "FI",
          debut: ilYA(90),
          fin: ilYA(-1000), // très loin dans le futur, ne se termine pas ici
        })
        .select()
        .single();
      expect(erreurInsertion).toBeNull();

      const { error: erreurResolution } = await supabaseAdmin.rpc("resoudre_conflits_en_cours");
      expect(erreurResolution).toBeNull();

      const { data: villeDefenseur } = await supabaseAdmin
        .from("cities")
        .select("population")
        .eq("id", defenseur.villeId)
        .single();
      const perteTotale = 100_000 - (villeDefenseur?.population ?? 0);

      // Le plafond (5 % par jour de la population COURANTE, donc
      // toujours ≤ 5 % de la population de départ) borne strictement la
      // perte totale, malgré ~90 jours de rattrapage d'un coup.
      expect(perteTotale).toBeGreaterThan(0);
      expect(perteTotale).toBeLessThanOrEqual(5_000); // 5 % de 100 000

      const { data: evenements } = await supabaseAdmin
        .from("city_events")
        .select("valeur")
        .eq("ville_id", defenseur.villeId)
        .eq("type", "guerre")
        .eq("conflit_id", conflit.id);
      const sommeEvenements = (evenements ?? []).reduce((s, e) => s + Number(e.valeur), 0);
      expect(sommeEvenements).toBe(perteTotale);
    } finally {
      await nettoyerConflit("IS", "FI");
      await supprimerCompte(attaquant.userId);
      await supprimerCompte(defenseur.userId);
    }
  });

  test("le verdict final se base sur la majorité des journées gagnées cumulées, pas sur le seul dernier jour", async () => {
    const attaquant = await creerCompteAvecVille("j21-verdict-atk", "NO", 1);
    const defenseur = await creerCompteAvecVille("j21-verdict-def", "SE", 50_000);
    try {
      // L'attaquant gagne la comparaison du jour (effort 1 > floor(0*1,5) = 0),
      // mais le défenseur a déjà cumulé 3 journées gagnées auparavant
      // contre 1 seule pour l'attaquant (état injecté directement,
      // comme si les jours précédents avaient déjà été traités).
      await donnerActivite(attaquant.villeId, attaquant.userId, 1);

      const { data: conflit, error: erreurInsertion } = await supabaseAdmin
        .from("conflits")
        .insert({
          pays_attaquant_id: "NO",
          pays_defenseur_id: "SE",
          debut: ilYA(4),
          fin: ilYA(0), // échéance aujourd'hui : ce dernier jour doit clôturer le conflit
          dernier_jour_traite: ilYA(1).slice(0, 10), // hier déjà traité
          jours_gagnes_attaquant: 1,
          jours_gagnes_defenseur: 3,
        })
        .select()
        .single();
      expect(erreurInsertion).toBeNull();

      const { error: erreurResolution } = await supabaseAdmin.rpc("resoudre_conflits_en_cours");
      expect(erreurResolution).toBeNull();

      const { data: conflitApres } = await supabaseAdmin
        .from("conflits")
        .select("statut, resultat, jours_gagnes_attaquant, jours_gagnes_defenseur")
        .eq("id", conflit.id)
        .single();
      expect(conflitApres?.statut).toBe("termine");
      // Aujourd'hui, l'attaquant gagne (1 → 2 journées), mais le
      // défenseur reste en tête au cumul (3 journées) : c'est lui qui
      // remporte le conflit, pas l'attaquant du "dernier jour".
      expect(conflitApres?.jours_gagnes_attaquant).toBe(2);
      expect(conflitApres?.jours_gagnes_defenseur).toBe(3);
      expect(conflitApres?.resultat).toBe("defenseur");
    } finally {
      await nettoyerConflit("NO", "SE");
      await supprimerCompte(attaquant.userId);
      await supprimerCompte(defenseur.userId);
    }
  });

  test("la page /pays affiche le palier visible et les journées gagnées d'un conflit en cours", async ({ page }) => {
    test.setTimeout(90_000);
    const presidente = await creerCompteAvecVille("j21-ui-pres", "IE", 400_000);
    try {
      await supabaseAdmin.rpc("verifier_president", { p_country_id: "IE" });
      const { error: erreurConflit } = await supabaseAdmin.from("conflits").insert({
        pays_attaquant_id: "IE",
        pays_defenseur_id: "PL",
        debut: ilYA(0),
        fin: ilYA(-7),
        jours_gagnes_attaquant: 2,
        jours_gagnes_defenseur: 0,
        dernier_jour_traite: ilYA(0).slice(0, 10), // déjà traité aujourd'hui : la page n'y touche plus
      });
      expect(erreurConflit).toBeNull();

      await connecter(page, presidente.email, presidente.motDePasse);
      await expect(page).toHaveURL(/\/ville$/, { timeout: 40_000 });

      await page.goto("/pays");
      await expect(page.getByText("Irlande contre Pologne")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText("Escarmouches")).toBeVisible();
      await expect(page.getByText("Journées gagnées (attaquant)")).toBeVisible();
      await expect(page.getByText("Journées gagnées (défenseur)")).toBeVisible();
      await expect(
        page.getByText("Chaque jour, le camp qui domine inflige une perte de population faible et plafonnée à l'adversaire.")
      ).toBeVisible();
    } finally {
      await supprimerCompte(presidente.userId);
      await nettoyerConflit("IE", "PL");
    }
  });
});
