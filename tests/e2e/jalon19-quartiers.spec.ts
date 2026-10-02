import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 19 — Système de développement des villes (3/4) : quartiers et
 * bâtiments 3D (docs/SYSTEME-DEVELOPPEMENT.md §7, supabase/migrations/
 * 0026_jalon19_quartiers.sql). Contrairement aux mécaniques du Jalon 18,
 * assigner_vocations_blocs() est entièrement déterministe (aucun tirage
 * au sort) : à élan nul, la boucle "l'activité la plus en retard entre
 * sa part de points et sa part de blocs" produit toujours exactement la
 * même séquence, qu'on peut donc affirmer valeur par valeur plutôt que
 * statistiquement. Client service_role recréé ici pour la même raison
 * que les specs des jalons précédents ("server-only" hors du pipeline
 * Next.js).
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
    p_pseudo: `${prefixe}-${Math.random().toString(36).slice(2, 6)}`,
    p_country_id: "FR",
    p_nom_ville: `${prefixe}-ville-${Math.random().toString(36).slice(2, 6)}`,
  });
  if (erreurVille) {
    throw new Error(`Impossible de créer la ville de ${prefixe} : ${erreurVille.message}`);
  }

  return { userId, email, motDePasse, villeId: ville.id as string };
}

async function supprimerCompte(userId: string) {
  await supabaseAdmin.auth.admin.deleteUser(userId);
}

/** Même astuce que gonflerActivite() du Jalon 18 : des visites datées de
 * jours différents depuis un seul compte, pour accumuler de l'élan sans
 * des centaines de vrais visiteurs. */
async function gonflerActivite(visiteurId: string, villeId: string, activite: string, nbJours: number) {
  const lignes = Array.from({ length: nbJours }, (_, i) => {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    return {
      visiteur_id: visiteurId,
      ville_id: villeId,
      activite,
      jour: date.toISOString().slice(0, 10),
      created_at: date.toISOString(),
    };
  });
  const { error } = await supabaseAdmin.from("visites").insert(lignes);
  if (error) {
    throw new Error(`gonflerActivite a échoué : ${error.message}`);
  }
}

async function blocsDe(villeId: string) {
  const { data } = await supabaseAdmin
    .from("city_blocks")
    .select("rang, vocation")
    .eq("ville_id", villeId)
    .order("rang");
  return (data ?? []) as { rang: number; vocation: string }[];
}

test.describe.configure({ mode: "serial" });

test.describe("Jalon 19 — quartiers et bâtiments 3D", () => {
  test("le tout premier bloc d'une ville est toujours résidentiel", async () => {
    const { userId, villeId } = await creerCompteAvecVille("j19-premier-bloc");
    try {
      await supabaseAdmin.from("cities").update({ population_max: 100 }).eq("id", villeId);
      const { error } = await supabaseAdmin.rpc("assigner_vocations_blocs", { p_ville_id: villeId });
      expect(error).toBeNull();

      const blocs = await blocsDe(villeId);
      expect(blocs).toEqual([{ rang: 0, vocation: "residentiel" }]);
    } finally {
      await supprimerCompte(userId);
    }
  });

  test("élan nul partout : séquence déterministe des 8 premiers blocs (résidentiel ≥ moitié, puis commerce→industrie→loisirs→recherche par ordre alphabétique à égalité)", async () => {
    const { userId, villeId } = await creerCompteAvecVille("j19-sequence");
    try {
      // nb_blocs_ouverts(9000) = 8 (seuil 7 500-10 000).
      await supabaseAdmin.from("cities").update({ population_max: 9000 }).eq("id", villeId);
      const { error } = await supabaseAdmin.rpc("assigner_vocations_blocs", { p_ville_id: villeId });
      expect(error).toBeNull();

      const blocs = await blocsDe(villeId);
      expect(blocs.map((b) => b.vocation)).toEqual([
        "residentiel",
        "commerce",
        "residentiel",
        "industrie",
        "residentiel",
        "loisirs",
        "residentiel",
        "recherche",
      ]);
    } finally {
      await supprimerCompte(userId);
    }
  });

  test("l'activité la plus en retard sur ses points passe devant l'ordre alphabétique par défaut", async () => {
    const { userId, villeId } = await creerCompteAvecVille("j19-deficit");
    try {
      // Élan massif sur Services avant l'ouverture du moindre bloc : sa
      // part de points (~100 %) domine largement sa part de blocs (0 %),
      // donc le premier bloc de quartier doit lui revenir — pas à
      // Commerce (choix par défaut à élan nul, voir le test précédent).
      await gonflerActivite(userId, villeId, "services", 200);
      // nb_blocs_ouverts(500) = 2 (seuil 300-800) : rang 0 (résidentiel,
      // toujours) et rang 1 (le premier bloc de quartier).
      await supabaseAdmin.from("cities").update({ population_max: 500 }).eq("id", villeId);
      const { error } = await supabaseAdmin.rpc("assigner_vocations_blocs", { p_ville_id: villeId });
      expect(error).toBeNull();

      const blocs = await blocsDe(villeId);
      expect(blocs).toEqual([
        { rang: 0, vocation: "residentiel" },
        { rang: 1, vocation: "services" },
      ]);
    } finally {
      await supprimerCompte(userId);
    }
  });

  test("idempotente : un second appel n'ajoute rien et ne retouche pas les blocs déjà assignés", async () => {
    const { userId, villeId } = await creerCompteAvecVille("j19-idempotent");
    try {
      await supabaseAdmin.from("cities").update({ population_max: 500 }).eq("id", villeId);
      await supabaseAdmin.rpc("assigner_vocations_blocs", { p_ville_id: villeId });
      const premierPassage = await blocsDe(villeId);
      expect(premierPassage).toHaveLength(2);

      const { error } = await supabaseAdmin.rpc("assigner_vocations_blocs", { p_ville_id: villeId });
      expect(error).toBeNull();
      const secondPassage = await blocsDe(villeId);
      expect(secondPassage).toEqual(premierPassage);
    } finally {
      await supprimerCompte(userId);
    }
  });

  test("une ville qui grandit ne fait qu'ajouter des blocs, sans jamais réécrire ceux déjà ouverts", async () => {
    const { userId, villeId } = await creerCompteAvecVille("j19-croissance");
    try {
      await supabaseAdmin.from("cities").update({ population_max: 500 }).eq("id", villeId);
      await supabaseAdmin.rpc("assigner_vocations_blocs", { p_ville_id: villeId });
      const avant = await blocsDe(villeId);
      expect(avant).toHaveLength(2);

      // Gonfler Recherche massivement APRÈS coup : si l'algorithme
      // retouchait les blocs déjà en base, le rang 1 (déjà "commerce")
      // basculerait vers Recherche. Le §7 est explicite : la vocation
      // est fixée "une fois pour toutes" à l'ouverture du bloc.
      await gonflerActivite(userId, villeId, "recherche", 200);
      await supabaseAdmin.from("cities").update({ population_max: 9000 }).eq("id", villeId);
      const { error } = await supabaseAdmin.rpc("assigner_vocations_blocs", { p_ville_id: villeId });
      expect(error).toBeNull();

      const apres = await blocsDe(villeId);
      expect(apres.slice(0, 2)).toEqual(avant);
      expect(apres).toHaveLength(8);
    } finally {
      await supprimerCompte(userId);
    }
  });
});
