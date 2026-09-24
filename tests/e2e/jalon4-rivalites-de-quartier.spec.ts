import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 4 : trois actions AntiVille (grève, contamination, propagande)
 * avec quota quotidien (3/jour, tous types et cibles confondus) et
 * protection anti-harcèlement dégressive par paire (attaquant, cible)
 * sur une fenêtre glissante de 24h — voir docs/DECISIONS.md §4 pour le
 * raisonnement complet des paramètres d'équilibrage. Client
 * service_role recréé ici pour la même raison que les specs des jalons
 * précédents (voir leurs commentaires : "server-only" hors du pipeline
 * Next.js).
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

test.describe("Jalon 4 — rivalités de quartier", () => {
  test("lancer une propagande réduit l'influence de la cible, visible dans l'UI", async ({
    page,
  }) => {
    const attaquant = await creerCompteAvecVille("attaquant-antiville");
    const cible = await creerCompteAvecVille("cible-antiville");

    try {
      // Donne d'abord de l'influence à la cible pour que la baisse soit visible.
      const { error: erreurInfluence } = await supabaseAdmin.rpc("influencer_ville", {
        p_joueur_id: attaquant.userId,
        p_ville_id: cible.villeId,
      });
      expect(erreurInfluence).toBeNull();

      await page.goto("/connexion");
      await page.getByLabel("Adresse e-mail").fill(attaquant.email);
      await page.getByLabel("Mot de passe").fill(attaquant.motDePasse);
      await page.getByRole("button", { name: "Se connecter" }).click();
      await expect(page).toHaveURL(/\/ville$/);

      await page.goto("/villes");
      const ligneCible = page.getByRole("link", { name: new RegExp(cible.villeNom) });
      await ligneCible.click();
      await page.getByRole("button", { name: "Propagande" }).click();

      await expect(page.getByText("Action lancée.")).toBeVisible();

      const { data: villeApres } = await supabaseAdmin
        .from("cities")
        .select("influence")
        .eq("id", cible.villeId)
        .single();
      expect(villeApres?.influence).toBe(0); // 1 - 2, plafonné à 0
    } finally {
      await supprimerCompte(attaquant.userId);
      await supprimerCompte(cible.userId);
    }
  });

  test("une grève bloque la réception d'influence sur la ville visée", async () => {
    const attaquant = await creerCompteAvecVille("greviste");
    const cible = await creerCompteAvecVille("cible-greve");
    const tiers = await creerCompteAvecVille("tiers-influenceur");

    try {
      const { error: erreurGreve } = await supabaseAdmin.rpc("lancer_action_antiville", {
        p_attaquant_id: attaquant.userId,
        p_ville_id: cible.villeId,
        p_type_action: "greve",
      });
      expect(erreurGreve).toBeNull();

      const { error: erreurInfluenceBloquee } = await supabaseAdmin.rpc("influencer_ville", {
        p_joueur_id: tiers.userId,
        p_ville_id: cible.villeId,
      });
      expect(erreurInfluenceBloquee?.code).toBe("P0002");

      const { data: villeApres } = await supabaseAdmin
        .from("cities")
        .select("influence, greve_jusqua")
        .eq("id", cible.villeId)
        .single();
      expect(villeApres?.influence).toBe(0); // l'influence bloquée n'a pas eu d'effet
      expect(villeApres?.greve_jusqua).not.toBeNull();
    } finally {
      await supprimerCompte(attaquant.userId);
      await supprimerCompte(cible.userId);
      await supprimerCompte(tiers.userId);
    }
  });

  test("sabotage : la contamination ne détruit jamais une ville (population plancher à 1)", async () => {
    const attaquant = await creerCompteAvecVille("contaminateur");
    const cible = await creerCompteAvecVille("cible-contamination");

    try {
      // Ville toute jeune (population 1) : même une contamination en
      // pleine puissance ne doit jamais la faire tomber à 0.
      const { error, data } = await supabaseAdmin.rpc("lancer_action_antiville", {
        p_attaquant_id: attaquant.userId,
        p_ville_id: cible.villeId,
        p_type_action: "contamination",
      });
      expect(error).toBeNull();
      expect(data?.ville?.population).toBeGreaterThanOrEqual(1);

      const { data: ville } = await supabaseAdmin
        .from("cities")
        .select("population")
        .eq("id", cible.villeId)
        .single();
      expect(ville?.population).toBe(1);
    } finally {
      await supprimerCompte(attaquant.userId);
      await supprimerCompte(cible.userId);
    }
  });

  test("sabotage : protection anti-harcèlement — 1re attaque pleine, 2e réduite, 3e bloquée", async () => {
    const attaquant = await creerCompteAvecVille("harceleur");
    const cible = await creerCompteAvecVille("cible-harcelement");

    try {
      const premiere = await supabaseAdmin.rpc("lancer_action_antiville", {
        p_attaquant_id: attaquant.userId,
        p_ville_id: cible.villeId,
        p_type_action: "propagande",
      });
      expect(premiere.error).toBeNull();
      expect(premiere.data?.effet_reduit).toBe(false);

      const deuxieme = await supabaseAdmin.rpc("lancer_action_antiville", {
        p_attaquant_id: attaquant.userId,
        p_ville_id: cible.villeId,
        p_type_action: "propagande",
      });
      expect(deuxieme.error).toBeNull();
      expect(deuxieme.data?.effet_reduit).toBe(true);

      const troisieme = await supabaseAdmin.rpc("lancer_action_antiville", {
        p_attaquant_id: attaquant.userId,
        p_ville_id: cible.villeId,
        p_type_action: "propagande",
      });
      expect(troisieme.error?.code).toBe("P0003");
    } finally {
      await supprimerCompte(attaquant.userId);
      await supprimerCompte(cible.userId);
    }
  });

  test("sabotage : auto-attaque refusée, et un 4e type d'action le même jour est refusé (quota de 3)", async () => {
    const attaquant = await creerCompteAvecVille("attaquant-quota");
    const cibles = [] as { userId: string; villeId: string }[];

    try {
      const { error: erreurAuto } = await supabaseAdmin.rpc("lancer_action_antiville", {
        p_attaquant_id: attaquant.userId,
        p_ville_id: attaquant.villeId,
        p_type_action: "propagande",
      });
      // Code dédié (P0005), pas P0001 (quota) : régression réelle
      // trouvée en vérifiant ce jalon — voir migration 0006.
      expect(erreurAuto?.code).toBe("P0005");

      // 3 cibles distinctes pour épuiser le quota sans déclencher la
      // protection anti-harcèlement (qui, elle, se déclenche par cible).
      for (let i = 0; i < 3; i++) {
        const cible = await creerCompteAvecVille(`cible-quota4-${i}`);
        cibles.push({ userId: cible.userId, villeId: cible.villeId });
        const { error } = await supabaseAdmin.rpc("lancer_action_antiville", {
          p_attaquant_id: attaquant.userId,
          p_ville_id: cible.villeId,
          p_type_action: "propagande",
        });
        expect(error).toBeNull();
      }

      const quatrieme = await creerCompteAvecVille("cible-quota4-4e");
      cibles.push({ userId: quatrieme.userId, villeId: quatrieme.villeId });
      const { error: erreurQuota } = await supabaseAdmin.rpc("lancer_action_antiville", {
        p_attaquant_id: attaquant.userId,
        p_ville_id: quatrieme.villeId,
        p_type_action: "contamination",
      });
      expect(erreurQuota?.code).toBe("P0001");

      const { data: villeNonAttaquee } = await supabaseAdmin
        .from("cities")
        .select("population")
        .eq("id", quatrieme.villeId)
        .single();
      expect(villeNonAttaquee?.population).toBe(1); // le quota a bien bloqué l'action
    } finally {
      await supprimerCompte(attaquant.userId);
      for (const cible of cibles) {
        await supprimerCompte(cible.userId);
      }
    }
  });
});
