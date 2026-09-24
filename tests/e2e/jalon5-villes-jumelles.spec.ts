import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 5 : proposer un jumelage, l'accepter (ou le refuser), et le
 * bonus quotidien (+1 population aux deux villes) quand les deux
 * joueurs ont été actifs le même jour — quota de 3 jumelages actifs
 * par ville, une seule relation en_attente/actif à la fois entre deux
 * villes données. Voir docs/DECISIONS.md §4 pour le raisonnement
 * complet des paramètres. Client service_role recréé ici pour la même
 * raison que les specs des jalons précédents (voir leurs commentaires :
 * "server-only" hors du pipeline Next.js).
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

/** Rend un joueur "actif aujourd'hui" en le faisant visiter une ville tierce. */
async function rendreActif(joueurId: string, uneVilleTierceId: string) {
  await supabaseAdmin.rpc("visiter_ville", {
    p_visiteur_id: joueurId,
    p_ville_id: uneVilleTierceId,
  });
}

test.describe.configure({ mode: "serial" });

test.describe("Jalon 5 — villes jumelles", () => {
  test("proposer, accepter, puis recevoir le bonus quotidien quand les deux sont actifs", async ({
    page,
  }) => {
    const a = await creerCompteAvecVille("jumelage-a");
    const b = await creerCompteAvecVille("jumelage-b");
    const tierce = await creerCompteAvecVille("jumelage-tierce");

    try {
      await page.goto("/connexion");
      await page.getByLabel("Adresse e-mail").fill(a.email);
      await page.getByLabel("Mot de passe").fill(a.motDePasse);
      await page.getByRole("button", { name: "Se connecter" }).click();
      await expect(page).toHaveURL(/\/ville$/);

      await page.goto("/villes");
      const ligneB = page.getByRole("link", { name: new RegExp(b.villeNom) });
      await ligneB.click();
      await page.getByRole("button", { name: "Proposer un jumelage" }).click();
      await expect(page.getByText("Demande envoyée")).toBeVisible();

      // B accepte via l'API directement (plus rapide que refaire tout
      // le parcours UI, déjà couvert côté "proposition" ci-dessus).
      const { data: jumelageEnAttente } = await supabaseAdmin
        .from("jumelages")
        .select("id")
        .eq("ville_proposante_id", a.villeId)
        .eq("ville_ciblee_id", b.villeId)
        .single();
      expect(jumelageEnAttente).not.toBeNull();

      const { error: erreurAcceptation } = await supabaseAdmin.rpc("repondre_jumelage", {
        p_joueur_id: b.userId,
        p_jumelage_id: jumelageEnAttente!.id,
        p_accepter: true,
      });
      expect(erreurAcceptation).toBeNull();

      // Les deux joueurs sont actifs aujourd'hui (A l'est déjà via la
      // proposition de jumelage ? non — proposer un jumelage ne compte
      // pas comme une activité "visite/influence/antiville". On les
      // rend actifs explicitement.
      await rendreActif(a.userId, tierce.villeId);
      await rendreActif(b.userId, tierce.villeId);

      await page.goto("/jumelages");
      await expect(page.getByText(b.villeNom)).toBeVisible();
      await expect(page.getByText("Bonus de jumelage accordé aujourd'hui à")).toBeVisible();

      const { data: villeAApres } = await supabaseAdmin
        .from("cities")
        .select("population")
        .eq("id", a.villeId)
        .single();
      const { data: villeBApres } = await supabaseAdmin
        .from("cities")
        .select("population")
        .eq("id", b.villeId)
        .single();
      // 1 (naissance) + éventuellement 1 (visite tierce ne touche pas
      // sa propre ville) + 1 (bonus de jumelage) = 2.
      expect(villeAApres?.population).toBe(2);
      expect(villeBApres?.population).toBe(2);

      // Rappeler le bonus le même jour ne doit rien redonner (idempotent).
      const { data: rappel } = await supabaseAdmin.rpc("reclamer_bonus_jumelages", {
        p_joueur_id: a.userId,
      });
      expect((rappel as { bonus_accordes: number }).bonus_accordes).toBe(0);

      const { data: villeAApresRappel } = await supabaseAdmin
        .from("cities")
        .select("population")
        .eq("id", a.villeId)
        .single();
      expect(villeAApresRappel?.population).toBe(2);
    } finally {
      await supprimerCompte(a.userId);
      await supprimerCompte(b.userId);
      await supprimerCompte(tierce.userId);
    }
  });

  test("sabotage : auto-jumelage refusé, double proposition refusée, quota de 3 jumelages actifs respecté", async () => {
    const proposant = await creerCompteAvecVille("jumelage-quota");
    const cibles = [] as { userId: string; villeId: string }[];

    try {
      const { error: erreurAuto } = await supabaseAdmin.rpc("proposer_jumelage", {
        p_proposant_id: proposant.userId,
        p_ville_ciblee_id: proposant.villeId,
      });
      expect(erreurAuto?.code).toBe("P0005");

      for (let i = 0; i < 3; i++) {
        const cible = await creerCompteAvecVille(`jumelage-quota-cible-${i}`);
        cibles.push({ userId: cible.userId, villeId: cible.villeId });
        const { data: proposition, error } = await supabaseAdmin.rpc("proposer_jumelage", {
          p_proposant_id: proposant.userId,
          p_ville_ciblee_id: cible.villeId,
        });
        expect(error).toBeNull();

        // Double proposition vers cette même ville, juste après la
        // 1re : refusée (23505), testé avant d'atteindre le quota pour
        // ne pas mélanger les deux causes de refus possibles (le quota,
        // vérifié en premier dans proposer_jumelage, primerait sinon).
        if (i === 0) {
          const { error: erreurDouble } = await supabaseAdmin.rpc("proposer_jumelage", {
            p_proposant_id: proposant.userId,
            p_ville_ciblee_id: cible.villeId,
          });
          expect(erreurDouble?.code).toBe("23505");
        }

        const { error: erreurAcceptation } = await supabaseAdmin.rpc("repondre_jumelage", {
          p_joueur_id: cible.userId,
          p_jumelage_id: proposition!.id,
          p_accepter: true,
        });
        expect(erreurAcceptation).toBeNull();
      }

      // Quota de 3 jumelages actifs déjà atteint : une 4e proposition
      // vers une nouvelle ville est refusée.
      const quatrieme = await creerCompteAvecVille("jumelage-quota-4e");
      cibles.push({ userId: quatrieme.userId, villeId: quatrieme.villeId });
      const { error: erreurQuota } = await supabaseAdmin.rpc("proposer_jumelage", {
        p_proposant_id: proposant.userId,
        p_ville_ciblee_id: quatrieme.villeId,
      });
      expect(erreurQuota?.code).toBe("P0008");
    } finally {
      await supprimerCompte(proposant.userId);
      for (const cible of cibles) {
        await supprimerCompte(cible.userId);
      }
    }
  });
});
