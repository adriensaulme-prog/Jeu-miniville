import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 20 (2/3) — Système de développement des villes (4/4), deuxième
 * sous-jalon : les technologies de Recherche
 * (docs/SYSTEME-DEVELOPPEMENT.md §6, migration 0029). Contrairement aux
 * mégaprojets (1/3), aucun choix du maire — un seul stock (les points
 * de Recherche déjà accumulés) qui débloque automatiquement les
 * paliers. Client service_role recréé ici pour la même raison que les
 * specs des jalons précédents ("server-only" hors du pipeline Next.js).
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

/** `apres` : toutes les visites sont datées après ce moment (par défaut, il y a 60 s) — nécessaire pour les points d'un mégaprojet, comptés seulement depuis son choisi_le. */
async function donnerVisites(visiteurId: string, villeId: string, activite: string, n: number, apres?: Date) {
  const base = apres ? apres.getTime() + 1000 : Date.now() - 60_000;
  const lignes = Array.from({ length: n }, (_, i) => {
    const d = new Date(base + i * 50);
    return {
      visiteur_id: visiteurId,
      ville_id: villeId,
      activite,
      jour: d.toISOString().slice(0, 10),
      created_at: d.toISOString(),
    };
  });
  const { error } = await supabaseAdmin.from("visites").insert(lignes);
  if (error) {
    throw new Error(`donnerVisites a échoué : ${error.message}`);
  }
}

test.describe.configure({ mode: "serial" });

test.describe("Jalon 20 (2/3) — technologies de Recherche", () => {
  test("sabotage : avancer_technologies débloque les paliers déjà atteints, un bulletin par palier, idempotent", async () => {
    const ville = await creerCompteAvecVille("j20-tech-financement");
    try {
      // Juste sous le palier 0 (100 points) : rien ne se débloque.
      await donnerVisites(ville.userId, ville.villeId, "recherche", 99);
      await supabaseAdmin.rpc("avancer_technologies", { p_ville_id: ville.villeId });
      let { data: debloquees } = await supabaseAdmin
        .from("technologies")
        .select("palier")
        .eq("ville_id", ville.villeId);
      expect(debloquees).toHaveLength(0);

      // Passe le palier 0 (100) et le palier 1 (300) d'un coup : les
      // deux doivent se débloquer en un seul appel (la boucle ne
      // s'arrête pas au premier).
      await donnerVisites(ville.userId, ville.villeId, "recherche", 300 - 99);
      await supabaseAdmin.rpc("avancer_technologies", { p_ville_id: ville.villeId });
      ({ data: debloquees } = await supabaseAdmin
        .from("technologies")
        .select("palier")
        .eq("ville_id", ville.villeId)
        .order("palier"));
      expect(debloquees?.map((d) => d.palier)).toEqual([0, 1]);

      const { data: evenements } = await supabaseAdmin
        .from("city_events")
        .select("valeur")
        .eq("ville_id", ville.villeId)
        .eq("type", "technologie_debloquee")
        .order("valeur");
      expect(evenements?.map((e) => e.valeur)).toEqual([0, 1]);

      // Idempotent : un second appel sans nouveaux points ne rajoute rien.
      await supabaseAdmin.rpc("avancer_technologies", { p_ville_id: ville.villeId });
      const { data: apres } = await supabaseAdmin.from("technologies").select("palier").eq("ville_id", ville.villeId);
      expect(apres).toHaveLength(2);
    } finally {
      await supprimerCompte(ville.userId);
    }
  });

  test("sabotage : stock_ville et etat_megaprojets voient TOUS les visiteurs, pas seulement l'appelant (RLS)", async () => {
    // Régression : ces deux fonctions n'étaient pas "security definer"
    // avant ce jalon — un joueur authentifié appelant l'une d'elles
    // directement ne voyait, via la policy RLS de `visites`
    // (auth.uid() = visiteur_id), que SES PROPRES visites. Corrigé dans
    // la migration 0029 (voir son en-tête).
    const cible = await creerCompteAvecVille("j20-rls-cible");
    const visiteurA = await creerCompteAvecVille("j20-rls-visiteurA");
    const visiteurB = await creerCompteAvecVille("j20-rls-visiteurB");
    try {
      await supabaseAdmin.from("cities").update({ population_max: 40000 }).eq("id", cible.villeId);
      // Choisi avant les visites, dont les points ne comptent qu'à
      // partir de choisi_le (§6, "à partir du choix") — les visites
      // ci-dessous sont donc explicitement datées après.
      const { data: chantier } = await supabaseAdmin.rpc("choisir_megaprojet", {
        p_owner_id: cible.userId,
        p_ville_id: cible.villeId,
        p_palier: 2,
        p_type: "technopole",
      });
      await donnerVisites(visiteurA.userId, cible.villeId, "recherche", 5, new Date(chantier.choisi_le));
      await donnerVisites(visiteurB.userId, cible.villeId, "recherche", 5, new Date(chantier.choisi_le));

      const clientVisiteurA = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      const { error: erreurConnexion } = await clientVisiteurA.auth.signInWithPassword({
        email: visiteurA.email,
        password: visiteurA.motDePasse,
      });
      expect(erreurConnexion).toBeNull();

      // Connecté comme visiteurA (qui n'a fait que 5 des 10 visites),
      // stock_ville() doit quand même renvoyer 10 — pas seulement les
      // siennes.
      const { data: stock, error: erreurStock } = await clientVisiteurA.rpc("stock_ville", {
        p_ville_id: cible.villeId,
        p_activite: "recherche",
      });
      expect(erreurStock).toBeNull();
      expect(stock).toBe(10);

      // Même vérification pour etat_megaprojets() (mégaprojet choisi
      // avec le thème Recherche, financé par les deux visiteurs).
      const { data: etat, error: erreurEtat } = await clientVisiteurA.rpc("etat_megaprojets", {
        p_ville_id: cible.villeId,
      });
      expect(erreurEtat).toBeNull();
      expect((etat as { points: number }[])[0]?.points).toBe(10);
    } finally {
      await supprimerCompte(cible.userId);
      await supprimerCompte(visiteurA.userId);
      await supprimerCompte(visiteurB.userId);
    }
  });
});
