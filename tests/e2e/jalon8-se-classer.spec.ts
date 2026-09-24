import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 8 : régions (choix obligatoire à la création, écran de
 * rattrapage pour les villes créées avant ce jalon, changement limité à
 * une fois tous les 30 jours) et classements mondial/national/régional
 * avec "ma position" toujours visible — voir docs/CLASSEMENTS.md et
 * docs/DECISIONS.md §4. Client service_role recréé ici pour la même
 * raison que les specs des jalons précédents (voir leurs commentaires :
 * "server-only" hors du pipeline Next.js).
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

/** "3ᵉ"/"1ᵉʳ" — copie volontairement locale de src/lib/game/ordinal.ts (fr
 * uniquement) pour ne pas dépendre de la résolution de chemin @/ dans les
 * specs e2e, qui n'est pas utilisée ailleurs dans ce dossier. */
function ordinalFr(n: number): string {
  return n === 1 ? "1ᵉʳ" : `${n}ᵉ`;
}

async function creerCompteAvecVille(
  prefixe: string,
  paysId: string,
  regionId: string,
  population = 1
) {
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

  if (population !== 1) {
    const { error: erreurPop } = await supabaseAdmin
      .from("cities")
      .update({ population, population_max: population })
      .eq("id", ville.id);
    if (erreurPop) throw new Error(`Impossible de fixer la population de ${prefixe} : ${erreurPop.message}`);
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

test.describe("Jalon 8 — se classer", () => {
  test("une ville créée avant ce jalon (région nulle) est bloquée sur l'écran de rattrapage, puis débloquée après le choix", async ({
    page,
  }) => {
    const joueur = await creerCompteAvecVille("region-rattrapage", "FR", "fr-idf");
    try {
      // Simule une ville d'avant le Jalon 8 : region_id remis à nul
      // directement (creer_ville() n'en produit plus jamais).
      const { error } = await supabaseAdmin
        .from("cities")
        .update({ region_id: null, region_choisie_le: null })
        .eq("id", joueur.villeId);
      expect(error).toBeNull();

      await connecter(page, joueur.email, joueur.motDePasse);
      await expect(page).toHaveURL(/\/ville$/, { timeout: 20_000 });

      // Toute page du jeu redirige vers l'écran de rattrapage tant que
      // la région n'est pas choisie.
      await page.goto("/villes");
      await expect(page).toHaveURL(/\/ville\/region$/);

      await page.getByRole("combobox").selectOption({ label: "Bretagne" });
      await page.getByRole("button", { name: "Confirmer ma région" }).click();
      await expect(page).toHaveURL(/\/ville$/);
      await expect(page.getByText("Région : Bretagne")).toBeVisible();

      const { data: villeApres } = await supabaseAdmin
        .from("cities")
        .select("region_id, region_choisie_le")
        .eq("id", joueur.villeId)
        .single();
      expect(villeApres?.region_id).toBe("fr-bre");
      expect(villeApres?.region_choisie_le).not.toBeNull();
    } finally {
      await supprimerCompte(joueur.userId);
    }
  });

  test("sabotage : une région d'un autre pays est refusée", async () => {
    const joueur = await creerCompteAvecVille("region-mauvais-pays", "FR", "fr-idf");
    try {
      const { error } = await supabaseAdmin.rpc("definir_region", {
        p_owner_id: joueur.userId,
        p_region_id: "de-by", // une région allemande pour une ville française
      });
      expect(error?.code).toBe("P0010");

      const { data: ville } = await supabaseAdmin
        .from("cities")
        .select("region_id")
        .eq("id", joueur.villeId)
        .single();
      expect(ville?.region_id).toBe("fr-idf"); // inchangée
    } finally {
      await supprimerCompte(joueur.userId);
    }
  });

  test("sabotage : changer de région moins de 30 jours après le dernier choix est refusé", async () => {
    const joueur = await creerCompteAvecVille("region-trop-tot", "FR", "fr-idf");
    try {
      const { error } = await supabaseAdmin.rpc("definir_region", {
        p_owner_id: joueur.userId,
        p_region_id: "fr-bre",
      });
      expect(error?.code).toBe("P0011");

      const { data: ville } = await supabaseAdmin
        .from("cities")
        .select("region_id")
        .eq("id", joueur.villeId)
        .single();
      expect(ville?.region_id).toBe("fr-idf"); // inchangée
    } finally {
      await supprimerCompte(joueur.userId);
    }
  });

  test("sabotage : un changement 30 jours pile après le précédent est accepté", async () => {
    const joueur = await creerCompteAvecVille("region-30-jours", "FR", "fr-idf");
    try {
      const il31jours = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin.from("cities").update({ region_choisie_le: il31jours }).eq("id", joueur.villeId);

      const { error } = await supabaseAdmin.rpc("definir_region", {
        p_owner_id: joueur.userId,
        p_region_id: "fr-bre",
      });
      expect(error).toBeNull();

      const { data: ville } = await supabaseAdmin
        .from("cities")
        .select("region_id")
        .eq("id", joueur.villeId)
        .single();
      expect(ville?.region_id).toBe("fr-bre");
    } finally {
      await supprimerCompte(joueur.userId);
    }
  });

  test("mondial, national et régional filtrent correctement, et « ma position » est toujours juste", async ({
    page,
  }) => {
    // Quatre comptes créés + plusieurs navigations : plus que les 30 s par
    // défaut sur un serveur de dev à froid (même cause que Jalon 7bis,
    // DECISIONS.md §4 — ici un délai plus long plutôt qu'un risque de
    // laisser des comptes orphelins si le timeout saute le `finally`).
    test.setTimeout(60_000);
    // Trois villes françaises en Île-de-France, dont deux avec la même
    // population que le joueur qui va se connecter : sert à vérifier
    // l'ordre relatif sans dépendre du contenu exact des autres villes
    // (de test ou réelles) déjà en base.
    const moi = await creerCompteAvecVille("classement-moi", "FR", "fr-idf", 5_000_000);
    const memeRegionPlusPetite = await creerCompteAvecVille("classement-idf-petite", "FR", "fr-idf", 1_000_000);
    const memePaysAutreRegion = await creerCompteAvecVille("classement-fr-bretagne", "FR", "fr-bre", 4_000_000);
    const autrePays = await creerCompteAvecVille("classement-allemagne", "DE", "de-by", 9_000_000);

    try {
      await connecter(page, moi.email, moi.motDePasse);
      await expect(page).toHaveURL(/\/ville$/, { timeout: 20_000 });

      // Rangs attendus, calculés en base au moment du test (robuste au
      // contenu déjà présent, villes de test comme compte réel d'Adrien).
      const rangDans = async (filtreColonne: "country_id" | "region_id" | null, valeur: string | null) => {
        let requete = supabaseAdmin.from("cities").select("id", { count: "exact", head: true });
        if (filtreColonne) requete = requete.eq(filtreColonne, valeur!);
        const { count } = await requete.gt("population", 5_000_000);
        return (count ?? 0) + 1;
      };
      const rangMondial = await rangDans(null, null);
      const rangNational = await rangDans("country_id", "FR");
      const rangRegional = await rangDans("region_id", "fr-idf");

      await page.goto("/classement");
      await expect(page.getByText(moi.villeNom)).toBeVisible();
      await expect(page.getByText(memeRegionPlusPetite.villeNom)).toBeVisible();
      await expect(page.getByText(memePaysAutreRegion.villeNom)).toBeVisible();
      await expect(page.getByText(autrePays.villeNom)).toBeVisible(); // mondial : tout le monde
      await expect(page.getByText(ordinalFr(rangMondial), { exact: true })).toBeVisible();

      await page.goto("/classement?vue=national");
      await expect(page.getByText(moi.villeNom)).toBeVisible();
      await expect(page.getByText(memePaysAutreRegion.villeNom)).toBeVisible(); // même pays
      await expect(page.getByText(autrePays.villeNom)).toHaveCount(0); // autre pays exclu
      await expect(page.getByText(ordinalFr(rangNational), { exact: true })).toBeVisible();

      await page.goto("/classement?vue=regional");
      await expect(page.getByText(moi.villeNom)).toBeVisible();
      await expect(page.getByText(memeRegionPlusPetite.villeNom)).toBeVisible(); // même région
      await expect(page.getByText(memePaysAutreRegion.villeNom)).toHaveCount(0); // autre région exclue
      await expect(page.getByText(ordinalFr(rangRegional), { exact: true })).toBeVisible();
    } finally {
      await supprimerCompte(moi.userId);
      await supprimerCompte(memeRegionPlusPetite.userId);
      await supprimerCompte(memePaysAutreRegion.userId);
      await supprimerCompte(autrePays.userId);
    }
  });
});
