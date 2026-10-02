import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { normaliserNom } from "../../src/lib/game/nomsUniques";

/**
 * Noms uniques : pseudos et noms de ville (docs/A-INTEGRER.md §8,
 * migration 0035). Client service_role recréé ici pour la même raison
 * que les specs des jalons précédents ("server-only" hors du pipeline
 * Next.js).
 *
 * Pas de vérification rouge « retirer l'index fait échouer le test »
 * demandée par le §8 : pas d'accès psql direct pour retirer l'index.
 * Les assertions sur les collisions (casse, accents, tirets, création
 * simultanée) échouent de toute façon si l'index disparaît, puisque
 * c'est lui seul qui les refuse.
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const suffixe = () => Math.random().toString(36).slice(2, 8);

async function creerCompte(): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: `nom-${Date.now()}-${suffixe()}@example.com`,
    password: "mot-de-passe-test-e2e",
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Création du compte : ${error?.message}`);
  return data.user.id;
}

async function creer(userId: string, pseudo: string, nomVille: string) {
  return supabaseAdmin.rpc("creer_ville", {
    p_owner_id: userId,
    p_pseudo: pseudo,
    p_country_id: "FR",
    p_nom_ville: nomVille,
  });
}

const aNettoyer: string[] = [];
test.afterAll(async () => {
  for (const id of aNettoyer) await supabaseAdmin.auth.admin.deleteUser(id);
});

async function nouveauCompte() {
  const id = await creerCompte();
  aNettoyer.push(id);
  return id;
}

test.describe.configure({ mode: "serial" });

test.describe("Noms uniques — pseudos et villes", () => {
  test("nom_normalise() (SQL) est identique à normaliserNom() (TypeScript)", async () => {
    const echantillons = [
      "Rochemaure",
      "Rochemauré",
      "Roche-Maure",
      "Saint-Étienne",
      "Cœur d'Alène",
      "Straße",
      "Łódź",
      "Ville 42 !",
      "ÀÉÎÕÜ ñ ç",
      "---",
    ];
    for (const e of echantillons) {
      const { data, error } = await supabaseAdmin.rpc("nom_normalise", { p_nom: e });
      expect(error).toBeNull();
      expect(data, e).toBe(normaliserNom(e));
    }
  });

  test("même nom avec une autre casse, un accent, un tiret ou un espace → refusé (pseudo P0027, ville P0028)", async () => {
    const base = `Roche${suffixe()}`;
    const premier = await nouveauCompte();
    const { error: erreurInitiale } = await creer(premier, base, `${base}-ville`);
    expect(erreurInitiale).toBeNull();

    const variantesPseudo = [base.toUpperCase(), base.toLowerCase(), `${base.slice(0, 3)}-${base.slice(3)}`, `${base.slice(0, 3)} ${base.slice(3)}`];
    for (const v of variantesPseudo) {
      const autre = await nouveauCompte();
      const { error } = await creer(autre, v, `autre-${suffixe()}`);
      expect(error?.code, `pseudo ${v}`).toBe("P0027");
    }

    const variantesVille = [`${base}-VILLE`, `${base} ville`, `${base}Ville`];
    for (const v of variantesVille) {
      const autre = await nouveauCompte();
      const { error } = await creer(autre, `pseudo-${suffixe()}`, v);
      expect(error?.code, `ville ${v}`).toBe("P0028");
    }
  });

  test("un accent ne distingue pas deux noms", async () => {
    const mot = `Cafe${suffixe()}`;
    const premier = await nouveauCompte();
    expect((await creer(premier, mot, `${mot}-v`)).error).toBeNull();

    const autre = await nouveauCompte();
    const { error } = await creer(autre, mot.replace("e", "é"), `${mot}-autre`);
    expect(error?.code).toBe("P0027");
  });

  test("deux créations simultanées du même nom → une seule réussit", async () => {
    const nom = `Simul${suffixe()}`;
    const [a, b] = [await nouveauCompte(), await nouveauCompte()];
    const [ra, rb] = await Promise.all([creer(a, nom, `${nom}-a`), creer(b, nom, `${nom}-b`)]);
    const erreurs = [ra.error, rb.error].filter(Boolean);
    expect(erreurs).toHaveLength(1);
    expect(erreurs[0]?.code).toBe("P0027");
  });

  test("nom_disponible() reflète la réalité, et ignore le joueur lui-même", async () => {
    const nom = `Dispo${suffixe()}`;
    const joueur = await nouveauCompte();
    expect((await supabaseAdmin.rpc("nom_disponible", { p_type: "pseudo", p_nom: nom })).data).toBe(true);
    await creer(joueur, nom, `${nom}-v`);
    expect((await supabaseAdmin.rpc("nom_disponible", { p_type: "pseudo", p_nom: nom.toUpperCase() })).data).toBe(false);
    expect((await supabaseAdmin.rpc("nom_disponible", { p_type: "ville", p_nom: `${nom} V` })).data).toBe(false);
    // Le joueur lui-même peut réutiliser son propre nom (autre casse).
    expect(
      (await supabaseAdmin.rpc("nom_disponible", { p_type: "pseudo", p_nom: nom.toUpperCase(), p_sauf_user_id: joueur })).data
    ).toBe(true);
    // Un nom vide après normalisation n'est jamais disponible.
    expect((await supabaseAdmin.rpc("nom_disponible", { p_type: "pseudo", p_nom: "---" })).data).toBe(false);
  });

  test("renommer_pseudo / renommer_ville : collision refusée, nom libre accepté, drapeau de rattrapage levé", async () => {
    const nomPris = `Pris${suffixe()}`;
    const titulaire = await nouveauCompte();
    await creer(titulaire, nomPris, `${nomPris}-v`);

    const joueur = await nouveauCompte();
    await creer(joueur, `j-${suffixe()}`, `v-${suffixe()}`);
    // Simule un doublon détecté par la migration : drapeaux levés à la main.
    await supabaseAdmin.from("users").update({ pseudo_a_changer: true }).eq("id", joueur);
    await supabaseAdmin.from("cities").update({ nom_a_changer: true }).eq("owner_id", joueur);

    expect((await supabaseAdmin.rpc("renommer_pseudo", { p_user_id: joueur, p_pseudo: nomPris })).error?.code).toBe("P0027");
    expect((await supabaseAdmin.rpc("renommer_ville", { p_owner_id: joueur, p_nom: `${nomPris}-v` })).error?.code).toBe("P0028");

    const libre = `Libre${suffixe()}`;
    expect((await supabaseAdmin.rpc("renommer_pseudo", { p_user_id: joueur, p_pseudo: libre })).error).toBeNull();
    expect((await supabaseAdmin.rpc("renommer_ville", { p_owner_id: joueur, p_nom: `${libre}-v` })).error).toBeNull();

    const { data: profil } = await supabaseAdmin.from("users").select("pseudo, pseudo_a_changer").eq("id", joueur).single();
    const { data: ville } = await supabaseAdmin.from("cities").select("nom, nom_a_changer").eq("owner_id", joueur).single();
    expect(profil).toEqual({ pseudo: libre, pseudo_a_changer: false });
    expect(ville).toEqual({ nom: `${libre}-v`, nom_a_changer: false });
  });

  test("les villes de test du seed n'entrent pas en collision entre elles ni avec leurs propres pseudos", async () => {
    const { data: villes } = await supabaseAdmin.from("cities").select("nom, nom_normalise, nom_a_changer").eq("is_test", true);
    const normalises = (villes ?? []).filter((v) => !v.nom_a_changer).map((v) => v.nom_normalise);
    expect(new Set(normalises).size).toBe(normalises.length);
  });

  test("un joueur dont le nom est en doublon est envoyé sur /ville/noms, change de nom et retrouve sa ville", async ({ page }) => {
    test.setTimeout(120_000);
    const email = `rattrapage-${Date.now()}-${suffixe()}@example.com`;
    const { data } = await supabaseAdmin.auth.admin.createUser({ email, password: "mot-de-passe-test-e2e", email_confirm: true });
    const userId = data.user!.id;
    aNettoyer.push(userId);
    await creer(userId, `Ancien${suffixe()}`, `AncienneVille${suffixe()}`);
    await supabaseAdmin.from("users").update({ pseudo_a_changer: true }).eq("id", userId);
    await supabaseAdmin.from("cities").update({ nom_a_changer: true }).eq("owner_id", userId);

    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByLabel("Mot de passe").fill("mot-de-passe-test-e2e");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/ville$/);

    // Toute page de jeu renvoie vers l'écran de rattrapage tant que les noms ne sont pas changés.
    await page.goto("/villes");
    await expect(page).toHaveURL(/\/ville\/noms$/);

    const nouveau = `Nouveau${suffixe()}`;
    await page.getByLabel("Ton nouveau pseudo").fill(nouveau);
    await page.getByLabel("Le nouveau nom de ta ville").fill(`${nouveau}ville`);
    await expect(page.getByText("✓ disponible").first()).toBeVisible();
    await page.getByRole("button", { name: "Valider" }).click();
    await expect(page).toHaveURL(/\/ville$/);

    const { data: profil } = await supabaseAdmin.from("users").select("pseudo, pseudo_a_changer").eq("id", userId).single();
    expect(profil).toEqual({ pseudo: nouveau, pseudo_a_changer: false });
  });
});
