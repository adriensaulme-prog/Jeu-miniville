import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 14 : « Rester dans la légalité » — cahier des charges §26
 * (anti-triche). Portée cadrée avec Adrien avant de coder (deux
 * questions posées, comme pour le Jalon 13) : un audit des fonctions
 * SQL sensibles (docs/DECISIONS.md §4, aucune anomalie trouvée — pas de
 * nouveau code, rien à tester ici) et un délai minimum d'une seconde
 * entre deux actions du même type par le même joueur (Influencer,
 * AntiVille), pour bloquer un script qui enchaîne des appels en rafale
 * sans jamais gêner un humain normal. Pas de tracking IP ni de
 * détection comportementale plus poussée — décision explicite
 * d'Adrien, "aucun signal technique" pour le multi-compte.
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

test.describe.configure({ mode: "serial" });

test.describe("Jalon 14 — rester dans la légalité", () => {
  test("sabotage : deux actions d'influence trop rapprochées sont refusées (P0020), le délai débloque ensuite", async () => {
    const joueur = await creerCompteAvecVille("j14-influ-joueur");
    const cible1 = await creerCompteAvecVille("j14-influ-cible1");
    const cible2 = await creerCompteAvecVille("j14-influ-cible2");
    try {
      const { error: e1 } = await supabaseAdmin.rpc("influencer_ville", {
        p_joueur_id: joueur.userId,
        p_ville_id: cible1.villeId,
      });
      expect(e1).toBeNull();

      // Cible différente, mais même joueur, immédiatement après : refusé.
      const { error: erreurRafale } = await supabaseAdmin.rpc("influencer_ville", {
        p_joueur_id: joueur.userId,
        p_ville_id: cible2.villeId,
      });
      expect(erreurRafale?.code).toBe("P0020");

      await supabaseAdmin
        .from("actions_influence")
        .update({ created_at: new Date(Date.now() - 2000).toISOString() })
        .eq("joueur_id", joueur.userId);

      const { error: e2 } = await supabaseAdmin.rpc("influencer_ville", {
        p_joueur_id: joueur.userId,
        p_ville_id: cible2.villeId,
      });
      expect(e2).toBeNull();

      const { data: villeCible2 } = await supabaseAdmin
        .from("cities")
        .select("influence")
        .eq("id", cible2.villeId)
        .single();
      expect(villeCible2?.influence).toBe(1); // la tentative refusée n'a pas eu d'effet
    } finally {
      await supprimerCompte(joueur.userId);
      await supprimerCompte(cible1.userId);
      await supprimerCompte(cible2.userId);
    }
  });

  test("sabotage : deux actions AntiVille trop rapprochées sont refusées (P0020), le délai débloque ensuite", async () => {
    const attaquant = await creerCompteAvecVille("j14-av-attaquant");
    const cible1 = await creerCompteAvecVille("j14-av-cible1");
    const cible2 = await creerCompteAvecVille("j14-av-cible2");
    try {
      const { error: e1 } = await supabaseAdmin.rpc("lancer_action_antiville", {
        p_attaquant_id: attaquant.userId,
        p_ville_id: cible1.villeId,
        p_type_action: "propagande",
      });
      expect(e1).toBeNull();

      const { error: erreurRafale } = await supabaseAdmin.rpc("lancer_action_antiville", {
        p_attaquant_id: attaquant.userId,
        p_ville_id: cible2.villeId,
        p_type_action: "propagande",
      });
      expect(erreurRafale?.code).toBe("P0020");

      await supabaseAdmin
        .from("actions_antiville")
        .update({ created_at: new Date(Date.now() - 2000).toISOString() })
        .eq("attaquant_id", attaquant.userId);

      const { error: e2 } = await supabaseAdmin.rpc("lancer_action_antiville", {
        p_attaquant_id: attaquant.userId,
        p_ville_id: cible2.villeId,
        p_type_action: "propagande",
      });
      expect(e2).toBeNull();

      const { data: villeCible2 } = await supabaseAdmin
        .from("cities")
        .select("influence")
        .eq("id", cible2.villeId)
        .single();
      expect(villeCible2?.influence).toBe(0); // Jalon 18 : -1 (perte plancher), déjà à 0
    } finally {
      await supprimerCompte(attaquant.userId);
      await supprimerCompte(cible1.userId);
      await supprimerCompte(cible2.userId);
    }
  });

  test("le délai anti-rafale est propre à chaque joueur : deux joueurs distincts peuvent agir sans délai entre eux", async () => {
    const joueurA = await creerCompteAvecVille("j14-independant-a");
    const joueurB = await creerCompteAvecVille("j14-independant-b");
    const cible = await creerCompteAvecVille("j14-independant-cible");
    try {
      const { error: erreurA } = await supabaseAdmin.rpc("influencer_ville", {
        p_joueur_id: joueurA.userId,
        p_ville_id: cible.villeId,
      });
      expect(erreurA).toBeNull();

      // B influence la même ville juste après A : aucun rapport avec le
      // délai de A, qui est propre à chaque joueur.
      const { error: erreurB } = await supabaseAdmin.rpc("influencer_ville", {
        p_joueur_id: joueurB.userId,
        p_ville_id: cible.villeId,
      });
      expect(erreurB).toBeNull();

      const { data: villeCible } = await supabaseAdmin
        .from("cities")
        .select("influence")
        .eq("id", cible.villeId)
        .single();
      expect(villeCible?.influence).toBe(2);
    } finally {
      await supprimerCompte(joueurA.userId);
      await supprimerCompte(joueurB.userId);
      await supprimerCompte(cible.userId);
    }
  });
});
