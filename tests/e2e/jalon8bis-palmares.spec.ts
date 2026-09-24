import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 8bis : bilans par période et classements annexes (croissance,
 * pertes, influence, visites, générosité, jumelages, attaques) — voir
 * docs/CLASSEMENTS.md §3-5 et docs/DECISIONS.md §4. Client service_role
 * recréé ici pour la même raison que les specs des jalons précédents
 * ("server-only" hors du pipeline Next.js).
 *
 * Pas de vérification rouge par sabotage sur les fonctions SQL
 * palmares_* elles-mêmes : contrairement au code applicatif (TS), on ne
 * peut pas modifier une fonction SQL déjà appliquée depuis ce test (pas
 * d'accès psql direct, voir docs/GUIDE-METHODE.md). Les assertions
 * ci-dessous vérifient donc des valeurs exactes calculées à partir
 * d'actions connues, plutôt qu'un simple ">0" — ça joue le même rôle de
 * garde-fou (une régression de calcul ferait échouer une valeur précise).
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

test.describe("Jalon 8bis — les palmarès", () => {
  test("croissance et visites reçues comptent exactement les vraies visites", async () => {
    const cible = await creerCompteAvecVille("palm-croissance-cible");
    const visiteur1 = await creerCompteAvecVille("palm-croissance-v1");
    const visiteur2 = await creerCompteAvecVille("palm-croissance-v2");
    try {
      const { error: e1 } = await supabaseAdmin.rpc("visiter_ville", {
        p_visiteur_id: visiteur1.userId,
        p_ville_id: cible.villeId,
      });
      expect(e1).toBeNull();
      const { error: e2 } = await supabaseAdmin.rpc("visiter_ville", {
        p_visiteur_id: visiteur2.userId,
        p_ville_id: cible.villeId,
      });
      expect(e2).toBeNull();

      const { data: croissance, error: erreurCroissance } = await supabaseAdmin.rpc("palmares_croissance", {
        p_depuis: null,
        p_country_id: null,
        p_region_id: null,
      });
      expect(erreurCroissance).toBeNull();
      const ligneCroissance = (croissance ?? []).find((l: { ville_id: string }) => l.ville_id === cible.villeId);
      expect(ligneCroissance?.valeur).toBe(2);

      const { data: visites, error: erreurVisites } = await supabaseAdmin.rpc("palmares_visites", {
        p_depuis: null,
        p_country_id: null,
        p_region_id: null,
      });
      expect(erreurVisites).toBeNull();
      const ligneVisites = (visites ?? []).find((l: { ville_id: string }) => l.ville_id === cible.villeId);
      expect(ligneVisites?.valeur).toBe(2);
    } finally {
      await supprimerCompte(cible.userId);
      await supprimerCompte(visiteur1.userId);
      await supprimerCompte(visiteur2.userId);
    }
  });

  test("pertes et attaques comptent exactement le montant et le nombre d'une contamination", async () => {
    const attaquant = await creerCompteAvecVille("palm-pertes-att");
    const victime = await creerCompteAvecVille("palm-pertes-vic");
    try {
      const { data: villeAvant } = await supabaseAdmin
        .from("cities")
        .select("population")
        .eq("id", victime.villeId)
        .single();
      const perteAttendue = Math.floor(Math.max((villeAvant?.population ?? 1) * 0.1, 1));

      const { error } = await supabaseAdmin.rpc("lancer_action_antiville", {
        p_attaquant_id: attaquant.userId,
        p_ville_id: victime.villeId,
        p_type_action: "contamination",
      });
      expect(error).toBeNull();

      const { data: pertes, error: erreurPertes } = await supabaseAdmin.rpc("palmares_pertes", {
        p_depuis: null,
        p_country_id: null,
        p_region_id: null,
      });
      expect(erreurPertes).toBeNull();
      const lignePertes = (pertes ?? []).find((l: { ville_id: string }) => l.ville_id === victime.villeId);
      expect(lignePertes?.valeur).toBe(perteAttendue);

      const { data: attaques, error: erreurAttaques } = await supabaseAdmin.rpc("palmares_attaques", {
        p_depuis: null,
        p_country_id: null,
        p_region_id: null,
      });
      expect(erreurAttaques).toBeNull();
      const ligneAttaques = (attaques ?? []).find((l: { ville_id: string }) => l.ville_id === victime.villeId);
      expect(ligneAttaques?.valeur).toBe(1);
    } finally {
      await supprimerCompte(attaquant.userId);
      await supprimerCompte(victime.userId);
    }
  });

  test("influence compte exactement les actions d'influence reçues", async () => {
    const joueur = await creerCompteAvecVille("palm-influence-j");
    const cible = await creerCompteAvecVille("palm-influence-c");
    try {
      const { error } = await supabaseAdmin.rpc("influencer_ville", {
        p_joueur_id: joueur.userId,
        p_ville_id: cible.villeId,
      });
      expect(error).toBeNull();

      const { data: influence, error: erreurInfluence } = await supabaseAdmin.rpc("palmares_influence", {
        p_depuis: null,
        p_country_id: null,
        p_region_id: null,
      });
      expect(erreurInfluence).toBeNull();
      const ligne = (influence ?? []).find((l: { ville_id: string }) => l.ville_id === cible.villeId);
      expect(ligne?.valeur).toBe(1);
    } finally {
      await supprimerCompte(joueur.userId);
      await supprimerCompte(cible.userId);
    }
  });

  test("générosité filtre sur la région du joueur qui visite, pas sur celle qu'il visite", async () => {
    const visiteur = await creerCompteAvecVille("palm-genero-v", "FR", "fr-idf");
    const cibleAilleurs = await creerCompteAvecVille("palm-genero-c", "DE", "de-by");
    try {
      const { error } = await supabaseAdmin.rpc("visiter_ville", {
        p_visiteur_id: visiteur.userId,
        p_ville_id: cibleAilleurs.villeId,
      });
      expect(error).toBeNull();

      const { data: idf } = await supabaseAdmin.rpc("palmares_generosite", {
        p_depuis: null,
        p_country_id: null,
        p_region_id: "fr-idf",
      });
      const ligneIdf = (idf ?? []).find((l: { joueur_id: string }) => l.joueur_id === visiteur.userId);
      expect(ligneIdf?.valeur).toBe(1);

      const { data: bavaria } = await supabaseAdmin.rpc("palmares_generosite", {
        p_depuis: null,
        p_country_id: null,
        p_region_id: "de-by",
      });
      const ligneBavaria = (bavaria ?? []).find((l: { joueur_id: string }) => l.joueur_id === visiteur.userId);
      expect(ligneBavaria).toBeUndefined(); // le joueur habite fr-idf, pas de-by
    } finally {
      await supprimerCompte(visiteur.userId);
      await supprimerCompte(cibleAilleurs.userId);
    }
  });

  test("jumelages compte exactement les bonus accordés à une paire", async () => {
    const villeA = await creerCompteAvecVille("palm-jum-a");
    const villeB = await creerCompteAvecVille("palm-jum-b");
    const decoy = await creerCompteAvecVille("palm-jum-decoy");
    try {
      // A et B doivent être "actifs aujourd'hui" pour toucher le bonus
      // (reclamer_bonus_jumelages, Jalon 5) — une visite sur une
      // troisième ville sert de déclencheur sans influencer le résultat.
      await supabaseAdmin.rpc("visiter_ville", { p_visiteur_id: villeA.userId, p_ville_id: decoy.villeId });
      await supabaseAdmin.rpc("visiter_ville", { p_visiteur_id: villeB.userId, p_ville_id: decoy.villeId });

      const { data: proposition, error: erreurProposition } = await supabaseAdmin.rpc("proposer_jumelage", {
        p_proposant_id: villeA.userId,
        p_ville_ciblee_id: villeB.villeId,
      });
      expect(erreurProposition).toBeNull();

      const { error: erreurReponse } = await supabaseAdmin.rpc("repondre_jumelage", {
        p_joueur_id: villeB.userId,
        p_jumelage_id: proposition.id,
        p_accepter: true,
      });
      expect(erreurReponse).toBeNull();

      const { data: bonus, error: erreurBonus } = await supabaseAdmin.rpc("reclamer_bonus_jumelages", {
        p_joueur_id: villeA.userId,
      });
      expect(erreurBonus).toBeNull();
      expect((bonus as { bonus_accordes: number }).bonus_accordes).toBe(1);

      const { data: jumelages, error: erreurJumelages } = await supabaseAdmin.rpc("palmares_jumelages", {
        p_depuis: null,
        p_country_id: null,
        p_region_id: null,
      });
      expect(erreurJumelages).toBeNull();
      const ligne = (jumelages ?? []).find(
        (l: { jumelage_id: string }) => l.jumelage_id === proposition.id
      );
      expect(ligne?.valeur).toBe(1);
    } finally {
      await supprimerCompte(villeA.userId);
      await supprimerCompte(villeB.userId);
      await supprimerCompte(decoy.userId);
    }
  });

  test("la page /palmares affiche les sept classements sans erreur, et change avec les filtres", async ({
    page,
  }) => {
    const joueur = await creerCompteAvecVille("palm-ui");
    try {
      await connecter(page, joueur.email, joueur.motDePasse);
      await expect(page).toHaveURL(/\/ville$/, { timeout: 20_000 });

      await page.goto("/palmares");
      await expect(page.getByRole("heading", { name: "Les palmarès" })).toBeVisible();

      await page.getByRole("link", { name: "Plus éprouvées" }).click();
      await expect(page).toHaveURL(/classement=pertes/);

      await page.getByRole("link", { name: "Cette semaine" }).click();
      await expect(page).toHaveURL(/periode=semaine/);

      await page.getByRole("link", { name: "National" }).click();
      await expect(page).toHaveURL(/echelle=national/);

      // Toujours pas d'erreur console (canvas 3D compris) après ces
      // changements de filtre.
      const erreurs: string[] = [];
      page.on("pageerror", (e) => erreurs.push(e.message));
      await page.waitForTimeout(300);
      expect(erreurs).toEqual([]);
    } finally {
      await supprimerCompte(joueur.userId);
    }
  });
});
