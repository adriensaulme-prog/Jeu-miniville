import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 22 — « Revoir les règles du jeu », suite : paliers visibles
 * pour visites, influence et jumelages (docs/DECISIONS.md §10 point 22
 * et §4, migration 0033). Contrairement à AntiVille (Jalon 18) et à la
 * guerre entre pays (Jalon 21), ces trois mécaniques sont des effets
 * POSITIFS déjà plafonnés par joueur — choix d'Adrien (AskUserQuestion,
 * 28/09/2026) : paliers visibles SEULEMENT, aucun plafond ajouté.
 *
 * Client service_role recréé ici pour la même raison que les specs des
 * jalons précédents ("server-only" hors du pipeline Next.js).
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

  return { userId, email, motDePasse, villeId: ville.id as string };
}

async function supprimerCompte(userId: string) {
  await supabaseAdmin.auth.admin.deleteUser(userId);
}

const AUJOURDHUI = new Date().toISOString().slice(0, 10);

async function donnerVisitesAujourdhui(visiteurId: string, villeId: string, n: number) {
  const lignes = Array.from({ length: n }, () => ({
    visiteur_id: visiteurId,
    ville_id: villeId,
    jour: AUJOURDHUI,
  }));
  const { error } = await supabaseAdmin.from("visites").insert(lignes);
  if (error) throw new Error(`donnerVisitesAujourdhui a échoué : ${error.message}`);
}

test.describe.configure({ mode: "serial" });

test.describe("Jalon 22 — paliers visibles pour visites, influence et jumelages", () => {
  test("visites_recues_aujourdhui et actions_influence_recues_aujourdhui comptent tous les visiteurs/joueurs du jour, pas seulement l'appelant (RLS)", async () => {
    const cible = await creerCompteAvecVille("j22-rls-cible");
    const joueurA = await creerCompteAvecVille("j22-rls-a");
    const joueurB = await creerCompteAvecVille("j22-rls-b");
    try {
      // visites : un même joueur peut visiter plusieurs fois par jour
      // (quota 3), contrairement à actions_influence (une ligne par
      // (joueur, ville, jour), unique).
      await donnerVisitesAujourdhui(joueurA.userId, cible.villeId, 3);
      await donnerVisitesAujourdhui(joueurB.userId, cible.villeId, 2);
      const { error: erreurInfluenceA } = await supabaseAdmin
        .from("actions_influence")
        .insert({ joueur_id: joueurA.userId, ville_id: cible.villeId, jour: AUJOURDHUI });
      expect(erreurInfluenceA).toBeNull();
      const { error: erreurInfluenceB } = await supabaseAdmin
        .from("actions_influence")
        .insert({ joueur_id: joueurB.userId, ville_id: cible.villeId, jour: AUJOURDHUI });
      expect(erreurInfluenceB).toBeNull();

      // Connecté comme joueurA (qui n'a fait que 3 des 5 visites et 1
      // des 2 actions d'influence), les deux fonctions doivent quand
      // même renvoyer les totaux complets — pas seulement les siens.
      // Régression : visites_lecture_propre/actions_influence_lecture_propre
      // limitent chacune la lecture directe à auth.uid() = visiteur_id/joueur_id.
      const clientJoueurA = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      const { error: erreurConnexion } = await clientJoueurA.auth.signInWithPassword({
        email: joueurA.email,
        password: joueurA.motDePasse,
      });
      expect(erreurConnexion).toBeNull();

      const { data: nbVisites, error: erreurVisites } = await clientJoueurA.rpc("visites_recues_aujourdhui", {
        p_ville_id: cible.villeId,
      });
      expect(erreurVisites).toBeNull();
      expect(nbVisites).toBe(5);

      const { data: nbInfluence, error: erreurInfluence } = await clientJoueurA.rpc(
        "actions_influence_recues_aujourdhui",
        { p_ville_id: cible.villeId }
      );
      expect(erreurInfluence).toBeNull();
      expect(nbInfluence).toBe(2);
    } finally {
      await supprimerCompte(cible.userId);
      await supprimerCompte(joueurA.userId);
      await supprimerCompte(joueurB.userId);
    }
  });

  test("jours_bonus_jumelages_ville cumule exactement les jours où le bonus a déjà été accordé pour un jumelage actif", async () => {
    const villeA = await creerCompteAvecVille("j22-jum-a");
    const villeB = await creerCompteAvecVille("j22-jum-b");
    const villeC = await creerCompteAvecVille("j22-jum-c");
    try {
      const { data: jumelageActif, error: erreurJumelage } = await supabaseAdmin
        .from("jumelages")
        .insert({
          ville_proposante_id: villeA.villeId,
          ville_ciblee_id: villeB.villeId,
          statut: "actif",
          accepte_le: new Date().toISOString(),
        })
        .select()
        .single();
      expect(erreurJumelage).toBeNull();

      // Un jumelage juste proposé (pas encore actif) ne doit pas
      // apparaître dans le résultat.
      const { error: erreurJumelageEnAttente } = await supabaseAdmin.from("jumelages").insert({
        ville_proposante_id: villeA.villeId,
        ville_ciblee_id: villeC.villeId,
        statut: "en_attente",
      });
      expect(erreurJumelageEnAttente).toBeNull();

      // 5 jours de bonus déjà accordés pour le jumelage actif.
      const lignesBonus = Array.from({ length: 5 }, (_, i) => {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - i);
        return { jumelage_id: jumelageActif.id, jour: d.toISOString().slice(0, 10) };
      });
      const { error: erreurBonus } = await supabaseAdmin.from("jumelage_bonus").insert(lignesBonus);
      expect(erreurBonus).toBeNull();

      const { data: resultat, error: erreurRpc } = await supabaseAdmin.rpc("jours_bonus_jumelages_ville", {
        p_ville_id: villeA.villeId,
      });
      expect(erreurRpc).toBeNull();
      const lignes = resultat as { jumelage_id: string; jours: number }[];
      expect(lignes).toHaveLength(1); // seulement le jumelage actif
      expect(lignes[0].jumelage_id).toBe(jumelageActif.id);
      expect(lignes[0].jours).toBe(5);

      // Même résultat vu depuis l'autre ville du jumelage.
      const { data: resultatB } = await supabaseAdmin.rpc("jours_bonus_jumelages_ville", {
        p_ville_id: villeB.villeId,
      });
      expect((resultatB as { jours: number }[])[0]?.jours).toBe(5);
    } finally {
      await supabaseAdmin.from("jumelages").delete().eq("ville_proposante_id", villeA.villeId);
      await supprimerCompte(villeA.userId);
      await supprimerCompte(villeB.userId);
      await supprimerCompte(villeC.userId);
    }
  });

  test("la page /villes affiche les paliers de popularité et de renommée d'une ville visitée", async ({ page }) => {
    test.setTimeout(90_000);
    const moi = await creerCompteAvecVille("j22-ui-moi");
    const cible = await creerCompteAvecVille("j22-ui-cible");
    const visiteurs = await Promise.all(
      Array.from({ length: 5 }, (_, i) => creerCompteAvecVille(`j22-ui-v${i}`))
    );
    try {
      for (const v of visiteurs) {
        await donnerVisitesAujourdhui(v.userId, cible.villeId, 1);
        const { error } = await supabaseAdmin
          .from("actions_influence")
          .insert({ joueur_id: v.userId, ville_id: cible.villeId, jour: AUJOURDHUI });
        expect(error).toBeNull();
      }
      // 5 visites => palier "tres_frequentee" ; 5 actions d'influence => "renommee".

      await page.goto("/connexion");
      await page.getByLabel("Adresse e-mail").fill(moi.email);
      await page.getByLabel("Mot de passe").fill(moi.motDePasse);
      await page.getByRole("button", { name: "Se connecter" }).click();
      await expect(page).toHaveURL(/\/ville$/, { timeout: 40_000 });

      await page.goto(`/villes?ville=${cible.villeId}`);
      await expect(page.getByText("Très fréquentée")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText("Renommée", { exact: true })).toBeVisible();
    } finally {
      await supprimerCompte(moi.userId);
      await supprimerCompte(cible.userId);
      for (const v of visiteurs) await supprimerCompte(v.userId);
    }
  });
});
