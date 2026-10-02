import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Guerres équilibrées (docs/A-INTEGRER.md §24, migration 0037) :
 * effort_national() est une MOYENNE par ville, plus une somme. Pays
 * réservés à ce fichier (aucune ville en base hors de lui) : BG, RO, MT.
 * Client service_role recréé ici pour la même raison que les specs des
 * jalons précédents ("server-only" hors du pipeline Next.js).
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const suffixe = () => Math.random().toString(36).slice(2, 6);

function lundi(decalage: number): string {
  const m = new Date();
  const jour = m.getUTCDay();
  const depuis = jour === 0 ? 6 : jour - 1;
  return new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), m.getUTCDate() - depuis + decalage * 7))
    .toISOString()
    .slice(0, 10);
}

const comptes: string[] = [];
async function nouveau(prefixe: string, paysId: string) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: `${prefixe}-${Date.now()}-${suffixe()}@example.com`,
    password: "mot-de-passe-test-e2e",
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Création de ${prefixe} : ${error?.message}`);
  comptes.push(data.user.id);
  const { error: erreurVille } = await supabaseAdmin.rpc("creer_ville", {
    p_owner_id: data.user.id,
    p_pseudo: `${prefixe}-${suffixe()}`,
    p_country_id: paysId,
    p_nom_ville: `${prefixe}-ville-${suffixe()}`,
  });
  if (erreurVille) throw new Error(`Ville de ${prefixe} : ${erreurVille.message}`);
  return data.user.id;
}

async function donnerActivite(userId: string, villeId: string, jours: number) {
  const lignes = Array.from({ length: jours }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    return { visiteur_id: userId, ville_id: villeId, jour: d.toISOString().slice(0, 10) };
  });
  const { error } = await supabaseAdmin.from("visites").insert(lignes);
  if (error) throw new Error(`donnerActivite : ${error.message}`);
}

async function villeDe(userId: string): Promise<string> {
  const { data } = await supabaseAdmin.from("cities").select("id").eq("owner_id", userId).single();
  return data!.id as string;
}

async function effort(pays: string): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc("effort_national", { p_country_id: pays });
  expect(error).toBeNull();
  return Number(data);
}

test.afterAll(async () => {
  await supabaseAdmin.from("votes_pays").delete().in("country_id", ["BG", "RO"]);
  for (const id of comptes) await supabaseAdmin.auth.admin.deleteUser(id);
});

test.describe.configure({ mode: "serial" });

test.describe("effort_national : moyenne par ville (A-INTEGRER §24)", () => {
  test("un pays sans aucune ville a un effort de 0 (pas de division par zéro)", async () => {
    expect(await effort("MT")).toBe(0);
  });

  test("la taille du pays ne donne plus d'avantage : même activité par joueur, même effort — que le pays ait 1 ou 3 villes", async () => {
    // RO : 1 ville active 3 jours. BG : 3 villes actives 3 jours chacune.
    // Avant (somme) BG aurait valu 9 contre 3 pour RO ; désormais 3 contre 3.
    const ro = await nouveau("moy-ro", "RO");
    await donnerActivite(ro, await villeDe(ro), 3);
    const bg = [await nouveau("moy-bg1", "BG"), await nouveau("moy-bg2", "BG"), await nouveau("moy-bg3", "BG")];
    for (const u of bg) await donnerActivite(u, await villeDe(u), 3);

    expect(await effort("RO")).toBe(3);
    expect(await effort("BG")).toBe(3);
  });

  test("les villes inactives tirent la moyenne vers le bas ; le terme ressources est aussi une moyenne", async () => {
    // BG : on ajoute 3 villes inactives (6 villes en tout, 3 actives à 3 jours)
    // => activité moyenne 9/6 = 1,5.
    for (let i = 0; i < 3; i++) await nouveau(`moy-bg-inactive${i}`, "BG");
    expect(await effort("BG")).toBe(1.5);

    // Ressources : 4 votes sur 4 semaines distinctes (un joueur, un vote par semaine).
    // RO (1 ville) : floor(sqrt(4 / 1)) = 2 => 3 + 2 = 5.
    // BG (6 villes) : floor(sqrt(4 / 6)) = 0 => 1,5 + 0 = 1,5.
    const joueur = (await supabaseAdmin.from("cities").select("owner_id").eq("country_id", "RO").single()).data!.owner_id as string;
    await supabaseAdmin.from("votes_pays").insert(
      [-1, -2, -3, -4].map((d) => ({ joueur_id: joueur, country_id: "RO", categorie: "industrie", semaine: lundi(d) }))
    );
    const bgJoueur = (await supabaseAdmin.from("cities").select("owner_id").eq("country_id", "BG").limit(1).single()).data!.owner_id as string;
    await supabaseAdmin.from("votes_pays").insert(
      [-1, -2, -3, -4].map((d) => ({ joueur_id: bgJoueur, country_id: "BG", categorie: "industrie", semaine: lundi(d) }))
    );
    expect(await effort("RO")).toBe(5);
    expect(await effort("BG")).toBe(1.5);
  });
});
