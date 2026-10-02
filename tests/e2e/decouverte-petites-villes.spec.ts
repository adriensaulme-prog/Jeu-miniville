import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * A-INTEGRER §26 E (migration 0040) : tris alternatifs de /villes pour
 * remettre en avant les villes neuves / peu visitées. Pays réservé à ce
 * fichier : LU (aucune autre spec n'y crée de ville) — la liste est
 * filtrée dessus pour ne dépendre d'aucune autre donnée. Client
 * service_role recréé ici pour la même raison que les specs des jalons
 * précédents ("server-only" hors du pipeline Next.js).
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const suffixe = () => Math.random().toString(36).slice(2, 6);
const comptes: string[] = [];

async function nouveau(prefixe: string, population: number, creeeIlYaJours: number) {
  const email = `${prefixe}-${Date.now()}-${suffixe()}@example.com`;
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: "mot-de-passe-test-e2e",
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Création de ${prefixe} : ${error?.message}`);
  comptes.push(data.user.id);
  const { data: ville, error: erreurVille } = await supabaseAdmin.rpc("creer_ville", {
    p_owner_id: data.user.id,
    p_pseudo: `${prefixe}-${suffixe()}`,
    p_country_id: "LU",
    p_nom_ville: `${prefixe}-ville-${suffixe()}`,
  });
  if (erreurVille) throw new Error(`Ville de ${prefixe} : ${erreurVille.message}`);
  await supabaseAdmin
    .from("cities")
    .update({
      population,
      population_max: population,
      created_at: new Date(Date.now() - creeeIlYaJours * 86_400_000).toISOString(),
    })
    .eq("id", ville.id);
  return { userId: data.user.id, email, villeId: ville.id as string, nom: ville.nom as string };
}

test.afterAll(async () => {
  for (const id of comptes) await supabaseAdmin.auth.admin.deleteUser(id);
});

test.describe.configure({ mode: "serial" });

test.describe("Découverte des petites villes neuves (A-INTEGRER §26 E)", () => {
  test("visites_recues_7j_par_ville compte les 7 derniers jours (aujourd'hui + 6) et rien avant", async () => {
    const a = await nouveau("decouv-compteur", 50, 30);
    const jour = (decalage: number) => new Date(Date.now() - decalage * 86_400_000).toISOString().slice(0, 10);
    const { error } = await supabaseAdmin.from("visites").insert([
      { visiteur_id: a.userId, ville_id: a.villeId, jour: jour(0) },
      { visiteur_id: a.userId, ville_id: a.villeId, jour: jour(6) },
      { visiteur_id: a.userId, ville_id: a.villeId, jour: jour(7) }, // hors fenêtre
      { visiteur_id: a.userId, ville_id: a.villeId, jour: jour(20) }, // hors fenêtre
    ]);
    expect(error).toBeNull();
    const { data } = await supabaseAdmin.rpc("visites_recues_7j_par_ville");
    const ligne = (data as { ville_id: string; nb: number }[]).find((l) => l.ville_id === a.villeId);
    expect(ligne?.nb).toBe(2);
  });

  test("/villes : tris population (défaut), récentes et « qui attendent des visites »", async ({ page }) => {
    test.setTimeout(120_000);
    // Trois villes françaises-luxembourgeoises de test : une grosse et ancienne
    // très visitée, une moyenne, une toute neuve sans aucune visite.
    const grosse = await nouveau("decouv-grosse", 900, 40);
    const moyenne = await nouveau("decouv-moyenne", 120, 10);
    const neuve = await nouveau("decouv-neuve", 1, 0);
    const jour = new Date().toISOString().slice(0, 10);
    await supabaseAdmin.from("visites").insert([
      ...Array.from({ length: 5 }, () => ({ visiteur_id: moyenne.userId, ville_id: grosse.villeId, jour })),
      { visiteur_id: grosse.userId, ville_id: moyenne.villeId, jour },
    ]);

    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill(grosse.email);
    await page.getByLabel("Mot de passe").fill("mot-de-passe-test-e2e");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/ville$/, { timeout: 30_000 });

    // Seules nos trois villes comptent (la ville du premier test est aussi au LU) :
    // on vérifie leur ordre relatif.
    const nosNoms = [grosse.nom, moyenne.nom, neuve.nom];
    const ordre = async () =>
      (await page.locator(".rowbtn .nm").allTextContents()).map((t) => t.trim()).filter((n) => nosNoms.includes(n));

    await page.goto("/villes?pays=LU");
    await expect(page.getByText(grosse.nom)).toBeVisible({ timeout: 20_000 });
    expect(await ordre()).toEqual([grosse.nom, moyenne.nom, neuve.nom]);

    await page.goto("/villes?pays=LU&tri=recentes");
    await expect(page.getByText(neuve.nom)).toBeVisible({ timeout: 20_000 });
    expect(await ordre()).toEqual([neuve.nom, moyenne.nom, grosse.nom]);

    // « Qui attendent des visites » : la plus neuve sans visite d'abord, la
    // plus visitée en dernier... et sa propre ville (la grosse) n'y figure pas.
    await page.goto("/villes?pays=LU&tri=a_visiter");
    await expect(page.getByText(neuve.nom)).toBeVisible({ timeout: 20_000 });
    expect(await ordre()).toEqual([neuve.nom, moyenne.nom]);
    await expect(page.getByText("0 visite(s) / 7 j").first()).toBeVisible();
    await expect(page.getByText("1 visite(s) / 7 j").first()).toBeVisible();

    // Le sélecteur de tri est affiché et reflète le tri choisi.
    await expect(page.getByLabel("Trier les villes")).toHaveValue("a_visiter");
  });
});
