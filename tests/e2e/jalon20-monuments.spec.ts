import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 20 (3/3) — Système de développement des villes (4/4), dernier
 * sous-jalon : les monuments d'influence (docs/A-INTEGRER.md §19,
 * migration 0030). Catalogue fini de 16 paliers, débloqués
 * automatiquement sur le RECORD d'influence (`influence_max`, jamais
 * décroissant même si `influence` rebaisse ensuite) — pas de choix du
 * maire, pas de financement, comme les technologies (2/3) mais un
 * catalogue fini plutôt qu'infini. Client service_role recréé ici pour
 * la même raison que les specs des jalons précédents ("server-only"
 * hors du pipeline Next.js).
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

  return { userId, villeId: ville.id as string };
}

async function supprimerCompte(userId: string) {
  await supabaseAdmin.auth.admin.deleteUser(userId);
}

test.describe.configure({ mode: "serial" });

test.describe("Jalon 20 (3/3) — monuments d'influence", () => {
  test("sabotage : avancer_monuments débloque les paliers atteints, un bulletin par palier, idempotent, jamais au-delà de 16", async () => {
    const ville = await creerCompteAvecVille("j20-mon-financement");
    try {
      await supabaseAdmin.from("cities").update({ influence: 24, influence_max: 24 }).eq("id", ville.villeId);
      await supabaseAdmin.rpc("avancer_monuments", { p_ville_id: ville.villeId });
      let { data: debloques } = await supabaseAdmin
        .from("monuments")
        .select("palier")
        .eq("ville_id", ville.villeId);
      expect(debloques).toHaveLength(1); // seuil 10 franchi, seuil 25 pas encore (24 < 25)

      // Bien au-delà du dernier seuil (1 000 000) : les 16 paliers, pas plus.
      await supabaseAdmin.from("cities").update({ influence_max: 5_000_000 }).eq("id", ville.villeId);
      await supabaseAdmin.rpc("avancer_monuments", { p_ville_id: ville.villeId });
      ({ data: debloques } = await supabaseAdmin
        .from("monuments")
        .select("palier")
        .eq("ville_id", ville.villeId)
        .order("palier"));
      expect(debloques?.map((d) => d.palier)).toEqual(Array.from({ length: 16 }, (_, i) => i));

      const { data: evenements } = await supabaseAdmin
        .from("city_events")
        .select("valeur")
        .eq("ville_id", ville.villeId)
        .eq("type", "monument_debloque");
      expect(evenements).toHaveLength(16);

      // Idempotent : un second appel ne rajoute rien.
      await supabaseAdmin.rpc("avancer_monuments", { p_ville_id: ville.villeId });
      const { data: apres } = await supabaseAdmin.from("monuments").select("palier").eq("ville_id", ville.villeId);
      expect(apres).toHaveLength(16);
    } finally {
      await supprimerCompte(ville.userId);
    }
  });

  test("sabotage : influencer_ville fait avancer influence_max en même temps qu'influence", async () => {
    const cible = await creerCompteAvecVille("j20-mon-influencer-cible");
    const visiteur = await creerCompteAvecVille("j20-mon-influencer-visiteur");
    try {
      const { data: avant } = await supabaseAdmin
        .from("cities")
        .select("influence, influence_max")
        .eq("id", cible.villeId)
        .single();
      expect(avant?.influence).toBe(0);
      expect(avant?.influence_max).toBe(0);

      const { error } = await supabaseAdmin.rpc("influencer_ville", {
        p_joueur_id: visiteur.userId,
        p_ville_id: cible.villeId,
      });
      expect(error).toBeNull();

      const { data: apres } = await supabaseAdmin
        .from("cities")
        .select("influence, influence_max")
        .eq("id", cible.villeId)
        .single();
      expect(apres?.influence).toBeGreaterThan(0);
      expect(apres?.influence_max).toBe(apres?.influence);
    } finally {
      await supprimerCompte(cible.userId);
      await supprimerCompte(visiteur.userId);
    }
  });

  test("sabotage : une perte de propagande ne fait jamais reculer influence_max, et un monument déjà débloqué n'est jamais retiré", async () => {
    const cible = await creerCompteAvecVille("j20-mon-propagande-cible");
    const attaquant = await creerCompteAvecVille("j20-mon-propagande-attaquant");
    try {
      await supabaseAdmin
        .from("cities")
        .update({ influence: 1000, influence_max: 1000 })
        .eq("id", cible.villeId);
      await supabaseAdmin.rpc("avancer_monuments", { p_ville_id: cible.villeId });
      const { data: avantMonuments } = await supabaseAdmin
        .from("monuments")
        .select("palier")
        .eq("ville_id", cible.villeId);
      expect(avantMonuments?.length).toBeGreaterThan(0); // au moins les paliers jusqu'à 1 000

      const { error } = await supabaseAdmin.rpc("lancer_action_antiville", {
        p_attaquant_id: attaquant.userId,
        p_ville_id: cible.villeId,
        p_type_action: "propagande",
      });
      expect(error).toBeNull();

      const { data: ville } = await supabaseAdmin
        .from("cities")
        .select("influence, influence_max")
        .eq("id", cible.villeId)
        .single();
      expect(ville?.influence).toBeLessThan(1000); // la propagande a bien réduit l'influence courante
      expect(ville?.influence_max).toBe(1000); // ...mais jamais le record

      // Aucun monument déjà débloqué n'a disparu (§19 : "jamais retiré").
      await supabaseAdmin.rpc("avancer_monuments", { p_ville_id: cible.villeId });
      const { data: apresMonuments } = await supabaseAdmin
        .from("monuments")
        .select("palier")
        .eq("ville_id", cible.villeId);
      expect(apresMonuments?.length).toBe(avantMonuments?.length);
    } finally {
      await supprimerCompte(cible.userId);
      await supprimerCompte(attaquant.userId);
    }
  });
});
