import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 2 : visiter une autre ville lui donne +1 population, une fois
 * par (visiteur, ville, jour) — et le niveau visuel évolue tout seul
 * en franchissant les seuils de population_vers_niveau() (migration
 * 0003). Client service_role recréé ici pour la même raison que dans
 * jalon1-naitre-quelque-part.spec.ts (voir son commentaire) : "server-only"
 * lève une erreur hors du pipeline de build Next.js.
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

test.describe("Jalon 2 — grandir grâce aux autres", () => {
  test("visiter une autre ville lui donne +1 population, une fois par jour", async ({
    page,
  }) => {
    const visiteur = await creerCompteAvecVille("visiteur");
    const cible = await creerCompteAvecVille("cible");

    try {
      await page.goto("/connexion");
      await page.getByLabel("Adresse e-mail").fill(visiteur.email);
      await page.getByLabel("Mot de passe").fill(visiteur.motDePasse);
      await page.getByRole("button", { name: "Se connecter" }).click();
      await expect(page).toHaveURL(/\/ville$/);

      await page.goto("/villes");

      // Ma propre ville a le lien "/ville" (page dédiée), pas une entrée
      // sélectionnable dans la liste des autres villes.
      const ligneMoi = page.getByRole("link", { name: new RegExp(visiteur.villeNom) });
      await expect(ligneMoi).toHaveAttribute("href", "/ville");

      const ligneCible = page.getByRole("link", { name: new RegExp(cible.villeNom) });
      await expect(ligneCible).toBeVisible();
      await expect(ligneCible.getByText("1")).toBeVisible(); // population de départ

      await ligneCible.click();
      await page.getByRole("button", { name: "Visiter" }).click();

      await expect(ligneCible.getByText("Déjà visitée aujourd'hui")).toBeVisible();
      await expect(page.getByRole("button", { name: "Visiter" })).toHaveCount(0);

      const { data: villeApresVisite } = await supabaseAdmin
        .from("cities")
        .select("population, niveau")
        .eq("id", cible.villeId)
        .single();
      expect(villeApresVisite?.population).toBe(2);
      expect(villeApresVisite?.niveau).toBe(0); // sous le seuil du niveau 1 (5)

      // Recharger la page : l'état "déjà visitée" doit tenir, pas
      // seulement dans le DOM issu du premier submit.
      await page.reload();
      await expect(
        page.getByRole("link", { name: new RegExp(cible.villeNom) }).getByText("Déjà visitée aujourd'hui")
      ).toBeVisible();
    } finally {
      await supprimerCompte(visiteur.userId);
      await supprimerCompte(cible.userId);
    }
  });

  test("sabotage : se visiter soi-même et visiter deux fois la même ville le même jour sont refusés côté serveur", async () => {
    const cible = await creerCompteAvecVille("cible-sabotage");

    try {
      const { error: erreurAutoVisite } = await supabaseAdmin.rpc("visiter_ville", {
        p_visiteur_id: cible.userId,
        p_ville_id: cible.villeId,
      });
      expect(erreurAutoVisite).not.toBeNull();

      const visiteur = await creerCompteAvecVille("visiteur-sabotage");
      try {
        const { error: premiereVisite } = await supabaseAdmin.rpc("visiter_ville", {
          p_visiteur_id: visiteur.userId,
          p_ville_id: cible.villeId,
        });
        expect(premiereVisite).toBeNull();

        const { error: deuxiemeVisite } = await supabaseAdmin.rpc("visiter_ville", {
          p_visiteur_id: visiteur.userId,
          p_ville_id: cible.villeId,
        });
        expect(deuxiemeVisite?.code).toBe("23505");

        const { data: ville } = await supabaseAdmin
          .from("cities")
          .select("population")
          .eq("id", cible.villeId)
          .single();
        expect(ville?.population).toBe(2); // +1 seulement, pas +2
      } finally {
        await supprimerCompte(visiteur.userId);
      }
    } finally {
      await supprimerCompte(cible.userId);
    }
  });

  test("sabotage : plusieurs visiteurs distincts font bien monter la population sans plafond artificiel", async () => {
    const cible = await creerCompteAvecVille("cible-evolution");
    const visiteurs: string[] = [];

    try {
      // La ville naît à population 1. 4 visiteurs distincts doivent
      // chacun compter — voir jalon6-donnees-rendu-3d.spec.ts pour la
      // vérification des seuils de niveau eux-mêmes (1 000 habitants
      // pour le niveau 1 depuis le Jalon 6 : trop grand pour être
      // atteint ici avec de vrais comptes de test un par un).
      for (let i = 0; i < 4; i++) {
        const visiteur = await creerCompteAvecVille(`visiteur-evolution-${i}`);
        visiteurs.push(visiteur.userId);
        const { error } = await supabaseAdmin.rpc("visiter_ville", {
          p_visiteur_id: visiteur.userId,
          p_ville_id: cible.villeId,
        });
        expect(error).toBeNull();
      }

      const { data: ville } = await supabaseAdmin
        .from("cities")
        .select("population, population_max, niveau")
        .eq("id", cible.villeId)
        .single();
      expect(ville?.population).toBe(5);
      expect(ville?.population_max).toBe(5);
      expect(ville?.niveau).toBe(0); // bien en-dessous du seuil du niveau 1 (1 000)
    } finally {
      await supprimerCompte(cible.userId);
      for (const id of visiteurs) {
        await supprimerCompte(id);
      }
    }
  });
});
