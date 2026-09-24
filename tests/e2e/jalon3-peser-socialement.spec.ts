import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 3 : influencer une autre ville lui donne +1 influence, une fois
 * par (joueur, ville, jour), avec un quota global de 5 actions
 * d'influence par joueur et par jour. Client service_role recréé ici
 * pour la même raison que dans les specs des jalons précédents (voir
 * leurs commentaires : "server-only" hors du pipeline Next.js).
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

test.describe("Jalon 3 — peser socialement", () => {
  test("influencer une autre ville lui donne +1 influence, une fois par jour", async ({
    page,
  }) => {
    const joueur = await creerCompteAvecVille("joueur-influence");
    const cible = await creerCompteAvecVille("cible-influence");

    try {
      await page.goto("/connexion");
      await page.getByLabel("Adresse e-mail").fill(joueur.email);
      await page.getByLabel("Mot de passe").fill(joueur.motDePasse);
      await page.getByRole("button", { name: "Se connecter" }).click();
      await expect(page).toHaveURL(/\/ville$/);

      await page.goto("/villes");
      await expect(page.getByText("Actions d'influence restantes aujourd'hui : 5/5")).toBeVisible();

      const ligneCible = page.getByRole("link", { name: new RegExp(cible.villeNom) });
      await ligneCible.click();
      await page.getByRole("button", { name: "Influencer" }).click();

      // Le statut "déjà influencée" se voit dans le panneau de détail
      // (le bouton "Influencer" se désactive) ; contrairement à "déjà
      // visitée", il n'est pas repris en badge dans la liste compacte
      // (mêmes choix d'affichage que la maquette du Jalon 7).
      await expect(page.getByText("Déjà influencée aujourd'hui")).toBeVisible();
      await expect(page.getByText("Actions d'influence restantes aujourd'hui : 4/5")).toBeVisible();

      const { data: villeApresAction } = await supabaseAdmin
        .from("cities")
        .select("influence")
        .eq("id", cible.villeId)
        .single();
      expect(villeApresAction?.influence).toBe(1);

      await page.reload();
      await expect(page.getByText("Déjà influencée aujourd'hui")).toBeVisible();
    } finally {
      await supprimerCompte(joueur.userId);
      await supprimerCompte(cible.userId);
    }
  });

  test("sabotage : s'influencer soi-même est refusé, et une 6e action le même jour est refusée (quota de 5)", async () => {
    const joueur = await creerCompteAvecVille("joueur-sabotage-influence");
    const cibles = [] as { userId: string; villeId: string }[];

    try {
      const { error: erreurAutoInfluence } = await supabaseAdmin.rpc("influencer_ville", {
        p_joueur_id: joueur.userId,
        p_ville_id: joueur.villeId,
      });
      // Code dédié (P0005), pas P0001 (quota) : régression réelle
      // trouvée en vérifiant le Jalon 4 — voir migration 0006.
      expect(erreurAutoInfluence?.code).toBe("P0005");

      // 5 cibles distinctes pour épuiser le quota (la règle est "une
      // fois par ville et par jour" : il faut 5 villes différentes,
      // pas 5 fois la même).
      for (let i = 0; i < 5; i++) {
        const cible = await creerCompteAvecVille(`cible-quota-${i}`);
        cibles.push({ userId: cible.userId, villeId: cible.villeId });
        const { error } = await supabaseAdmin.rpc("influencer_ville", {
          p_joueur_id: joueur.userId,
          p_ville_id: cible.villeId,
        });
        expect(error).toBeNull();
      }

      const sixiemeCible = await creerCompteAvecVille("cible-quota-6e");
      cibles.push({ userId: sixiemeCible.userId, villeId: sixiemeCible.villeId });
      const { error: erreurQuota } = await supabaseAdmin.rpc("influencer_ville", {
        p_joueur_id: joueur.userId,
        p_ville_id: sixiemeCible.villeId,
      });
      expect(erreurQuota?.code).toBe("P0001");

      const { data: sixiemeVille } = await supabaseAdmin
        .from("cities")
        .select("influence")
        .eq("id", sixiemeCible.villeId)
        .single();
      expect(sixiemeVille?.influence).toBe(0); // le quota a bien bloqué l'action
    } finally {
      await supprimerCompte(joueur.userId);
      for (const cible of cibles) {
        await supprimerCompte(cible.userId);
      }
    }
  });
});
