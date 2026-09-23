import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 6bis : la page /ville affiche la ville en 3D temps réel
 * (Three.js, portage du prototype — voir docs/DECISIONS.md §4). Ce
 * test ne vérifie pas le rendu pixel par pixel (hors de portée d'un
 * test e2e), seulement que le canvas s'affiche, dessine réellement
 * quelque chose (pas une image vide) et ne plante pas — la fidélité
 * visuelle elle-même a été vérifiée à la main dans le navigateur
 * pendant ce jalon. Client service_role recréé ici pour la même raison
 * que les specs des jalons précédents (voir leurs commentaires :
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

test.describe("Jalon 6bis — rendu 3D", () => {
  test("la page /ville affiche un canvas WebGL qui dessine réellement quelque chose", async ({
    page,
  }) => {
    const joueur = await creerCompteAvecVille("rendu3d");

    try {
      const erreursConsole: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") erreursConsole.push(msg.text());
      });

      await page.goto("/connexion");
      await page.getByLabel("Adresse e-mail").fill(joueur.email);
      await page.getByLabel("Mot de passe").fill(joueur.motDePasse);
      await page.getByRole("button", { name: "Se connecter" }).click();
      await expect(page).toHaveURL(/\/ville$/);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(joueur.villeNom);

      const canvas = page.locator('canvas[aria-label="Vue 3D de la ville"]');
      await expect(canvas).toBeVisible();

      // Laisse le temps à la géométrie de se construire et au premier
      // rendu de se produire (requestAnimationFrame).
      await page.waitForTimeout(1000);

      const pixels = await canvas.evaluate((el) => {
        const c = el as HTMLCanvasElement;
        const tmp = document.createElement("canvas");
        tmp.width = c.width;
        tmp.height = c.height;
        const ctx = tmp.getContext("2d")!;
        ctx.drawImage(c, 0, 0);
        const { data } = ctx.getImageData(0, 0, c.width, c.height);
        // Un canvas WebGL jamais rendu reste transparent (alpha = 0)
        // partout ; on vérifie qu'au moins un pixel a été peint.
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] !== 0) return true;
        }
        return false;
      });
      expect(pixels).toBe(true);

      const erreursReelles = erreursConsole.filter(
        (m) => !m.includes("webpack-hmr") && !m.includes("Failed to load resource")
      );
      expect(erreursReelles, erreursReelles.join("\n")).toEqual([]);
    } finally {
      await supprimerCompte(joueur.userId);
    }
  });
});
