import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 2 : visiter une autre ville lui donne +1 population — et le
 * niveau visuel évolue tout seul en franchissant les seuils de
 * population_vers_niveau() (migration 0003). Client service_role
 * recréé ici pour la même raison que dans jalon1-naitre-quelque-part.spec.ts
 * (voir son commentaire) : "server-only" lève une erreur hors du
 * pipeline de build Next.js.
 *
 * Le plafond "une visite par (visiteur, ville) et par jour" de ce
 * jalon a été remplacé au Jalon 13 bis par un délai d'une heure entre
 * deux visites plus un plafond de 3 par jour — voir
 * tests/e2e/jalon13bis-revenir-plus-souvent.spec.ts pour cette
 * mécanique ; seul le test "sabotage" ci-dessous qui vérifiait
 * l'ancienne limite quotidienne est adapté en conséquence.
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
  test("visiter une autre ville lui donne +1 population", async ({
    page,
  }) => {
    // Premier test de ce fichier à toucher le navigateur : le serveur de
    // dev compile /connexion et /ville à la volée, ce qui peut dépasser
    // le timeout par défaut de 5 s sur un premier essai — même pattern
    // que tous les autres fichiers e2e de ce projet (jalon1, 8, 9...).
    test.setTimeout(60_000);
    const visiteur = await creerCompteAvecVille("visiteur");
    const cible = await creerCompteAvecVille("cible");

    try {
      await page.goto("/connexion");
      await page.getByLabel("Adresse e-mail").fill(visiteur.email);
      await page.getByLabel("Mot de passe").fill(visiteur.motDePasse);
      await page.getByRole("button", { name: "Se connecter" }).click();
      await expect(page).toHaveURL(/\/ville$/, { timeout: 20_000 });

      await page.goto("/villes");

      // Ma propre ville a le lien "/ville" (page dédiée), pas une entrée
      // sélectionnable dans la liste des autres villes.
      const ligneMoi = page.getByRole("link", { name: new RegExp(visiteur.villeNom) });
      await expect(ligneMoi).toHaveAttribute("href", "/ville");

      const ligneCible = page.getByRole("link", { name: new RegExp(cible.villeNom) });
      await expect(ligneCible).toBeVisible();
      await expect(ligneCible.getByText("1")).toBeVisible(); // population de départ

      // Depuis le Jalon 13 ter (docs/A-INTEGRER.md §15), plus de bouton
      // "Visiter" à cliquer : ouvrir le panneau détail suffit, la visite
      // se déclenche automatiquement ~2,5 s après (voir
      // src/components/VisiteAutomatique.tsx).
      await ligneCible.click();
      await expect(page.getByText("Visite comptée, +1 habitant.")).toBeVisible({ timeout: 8_000 });

      // Le délai d'une heure (Jalon 13 bis) bloque toute visite
      // suivante : le badge "indisponible" apparaît dans la liste.
      await expect(ligneCible.getByText("Indisponible pour l'instant")).toBeVisible({ timeout: 8_000 });

      const { data: villeApresVisite } = await supabaseAdmin
        .from("cities")
        .select("population, niveau")
        .eq("id", cible.villeId)
        .single();
      expect(villeApresVisite?.population).toBe(2);
      expect(villeApresVisite?.niveau).toBe(0); // sous le seuil du niveau 1 (5)

      // Recharger la page : l'état "indisponible" doit tenir, pas
      // seulement dans le DOM issu du premier submit.
      await page.reload();
      await expect(
        page.getByRole("link", { name: new RegExp(cible.villeNom) }).getByText("Indisponible pour l'instant")
      ).toBeVisible();
    } finally {
      await supprimerCompte(visiteur.userId);
      await supprimerCompte(cible.userId);
    }
  });

  // Le test qui vivait ici ("sabotage : se visiter soi-même est
  // refusé...") vérifiait un blocage retiré au Jalon 13 ter — se
  // visiter soi-même est désormais autorisé, comme une vraie règle du
  // jeu (docs/A-INTEGRER.md §16, déviation assumée du cahier des
  // charges §3). Voir tests/e2e/jalon13ter-visite-automatique.spec.ts
  // pour la couverture de l'auto-visite ; le délai d'une heure entre
  // deux visites (peu importe qui visite) reste couvert par
  // tests/e2e/jalon13bis-revenir-plus-souvent.spec.ts.

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
