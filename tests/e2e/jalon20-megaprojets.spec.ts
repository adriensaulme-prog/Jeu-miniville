import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 20 (1/3) — Système de développement des villes (4/4), premier
 * sous-jalon : les mégaprojets du maire (docs/SYSTEME-DEVELOPPEMENT.md
 * §6, migration 0028). Les technologies de Recherche et les monuments
 * d'influence (A-INTEGRER.md §19) restent pour de prochains
 * sous-jalons. Client service_role recréé ici pour la même raison que
 * les specs des jalons précédents ("server-only" hors du pipeline
 * Next.js).
 *
 * Seuls 4 mégaprojets ont un bonus numérique câblé (Stade, Centrale
 * solaire, Hôpital, Opéra) — testés ici en insérant directement une
 * ligne `megaprojets` "construit" (service_role, RLS contournée),
 * séparément du mécanisme de financement lui-même (déjà couvert par
 * ses propres tests, plus haut dans ce fichier).
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

/**
 * Insère n visites (une seule activité), toutes après `apres` si fourni
 * — sinon récentes (nécessaire pour jauges_ville(), qui ne regarde que
 * les 180 derniers jours ; les stocks, eux, n'ont pas de fenêtre).
 */
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

async function construireDirectement(villeId: string, palier: number, type: string) {
  const { error } = await supabaseAdmin
    .from("megaprojets")
    .insert({ ville_id: villeId, palier, type, statut: "construit", construit_le: new Date().toISOString() });
  if (error) {
    throw new Error(`construireDirectement a échoué : ${error.message}`);
  }
}

test.describe.configure({ mode: "serial" });

test.describe("Jalon 20 (1/3) — mégaprojets", () => {
  test("sabotage : choisir_megaprojet refuse un palier pas encore débloqué, un type invalide, et quelqu'un d'autre que le maire", async () => {
    const maire = await creerCompteAvecVille("j20-choix-maire");
    const intrus = await creerCompteAvecVille("j20-choix-intrus");
    try {
      // Ville toute neuve (population_max très faible) : palier 0 (Bourg, 5 000) pas débloqué.
      const { error: erreurPalier } = await supabaseAdmin.rpc("choisir_megaprojet", {
        p_owner_id: maire.userId,
        p_ville_id: maire.villeId,
        p_palier: 0,
        p_type: "grande_ecole",
      });
      expect(erreurPalier?.code).toBe("P0024");

      await supabaseAdmin.from("cities").update({ population_max: 5000 }).eq("id", maire.villeId);

      const { error: erreurIntrus } = await supabaseAdmin.rpc("choisir_megaprojet", {
        p_owner_id: intrus.userId,
        p_ville_id: maire.villeId,
        p_palier: 0,
        p_type: "grande_ecole",
      });
      expect(erreurIntrus?.code).toBe("P0007");

      const { error: erreurType } = await supabaseAdmin.rpc("choisir_megaprojet", {
        p_owner_id: maire.userId,
        p_ville_id: maire.villeId,
        p_palier: 0,
        p_type: "hopital", // valide au palier 1 (Ville), pas au palier 0 (Bourg)
      });
      expect(erreurType?.code).toBe("P0026");

      const { data: choix, error } = await supabaseAdmin.rpc("choisir_megaprojet", {
        p_owner_id: maire.userId,
        p_ville_id: maire.villeId,
        p_palier: 0,
        p_type: "grande_ecole",
      });
      expect(error).toBeNull();
      expect(choix.statut).toBe("en_chantier");

      // Un deuxième choix sur le même palier, même valide, est refusé.
      const { error: erreurDejaChoisi } = await supabaseAdmin.rpc("choisir_megaprojet", {
        p_owner_id: maire.userId,
        p_ville_id: maire.villeId,
        p_palier: 0,
        p_type: "parc_sports",
      });
      expect(erreurDejaChoisi?.code).toBe("P0025");
    } finally {
      await supprimerCompte(maire.userId);
      await supprimerCompte(intrus.userId);
    }
  });

  test("sabotage : financement avec un thème distinct des stocks — ne construit qu'au dernier seuil manquant", async () => {
    const maire = await creerCompteAvecVille("j20-financement2");
    try {
      await supabaseAdmin.from("cities").update({ population_max: 15000 }).eq("id", maire.villeId);
      const { data: chantier } = await supabaseAdmin.rpc("choisir_megaprojet", {
        p_owner_id: maire.userId,
        p_ville_id: maire.villeId,
        p_palier: 1,
        p_type: "hopital", // thème services ; coût palier 1 : 1200/1200/750
      });

      await donnerVisites(maire.userId, maire.villeId, "industrie", 1200);
      await donnerVisites(maire.userId, maire.villeId, "commerce", 1200);
      await donnerVisites(maire.userId, maire.villeId, "services", 749, new Date(chantier.choisi_le));
      await supabaseAdmin.rpc("avancer_megaprojets", { p_ville_id: maire.villeId });

      const { data: avant } = await supabaseAdmin
        .from("megaprojets")
        .select("statut")
        .eq("ville_id", maire.villeId)
        .eq("palier", 1)
        .single();
      expect(avant?.statut).toBe("en_chantier"); // il manque encore 1 point de Services

      await donnerVisites(maire.userId, maire.villeId, "services", 1, new Date(chantier.choisi_le));
      await supabaseAdmin.rpc("avancer_megaprojets", { p_ville_id: maire.villeId });

      const { data: apres } = await supabaseAdmin
        .from("megaprojets")
        .select("statut, construit_le")
        .eq("ville_id", maire.villeId)
        .eq("palier", 1)
        .single();
      expect(apres?.statut).toBe("construit");
      expect(apres?.construit_le).not.toBeNull();

      const { data: ville } = await supabaseAdmin
        .from("cities")
        .select("materiaux_depenses, revenus_depenses")
        .eq("id", maire.villeId)
        .single();
      expect(ville?.materiaux_depenses).toBe(1200);
      expect(ville?.revenus_depenses).toBe(1200);

      // Un bulletin municipal "mégaprojet construit" a été inséré.
      const { data: evenement } = await supabaseAdmin
        .from("city_events")
        .select("type, activite, valeur")
        .eq("ville_id", maire.villeId)
        .eq("type", "megaprojet_construit")
        .single();
      expect(evenement?.activite).toBe("services");
      expect(evenement?.valeur).toBe(1);

      // Idempotent : un second appel ne dépense pas deux fois.
      await supabaseAdmin.rpc("avancer_megaprojets", { p_ville_id: maire.villeId });
      const { data: villeApres } = await supabaseAdmin
        .from("cities")
        .select("materiaux_depenses, revenus_depenses")
        .eq("id", maire.villeId)
        .single();
      expect(villeApres?.materiaux_depenses).toBe(1200);
      expect(villeApres?.revenus_depenses).toBe(1200);
    } finally {
      await supprimerCompte(maire.userId);
    }
  });

  test("sabotage : Hôpital construit divise encore par deux l'effet d'une contamination", async () => {
    const temoin = await creerCompteAvecVille("j20-hopital-temoin");
    const protegee = await creerCompteAvecVille("j20-hopital-protegee");
    // Deux attaquants distincts : l'anti-rafale de 2 s (Jalon 14) porte
    // sur le DERNIER attaquant tous cibles confondues, un seul aurait
    // bloqué la seconde attaque de ce test.
    const attaquant1 = await creerCompteAvecVille("j20-hopital-attaquant1");
    const attaquant2 = await creerCompteAvecVille("j20-hopital-attaquant2");
    try {
      await supabaseAdmin
        .from("cities")
        .update({ population: 1_000_000, population_max: 1_000_000 })
        .in("id", [temoin.villeId, protegee.villeId]);
      await construireDirectement(protegee.villeId, 1, "hopital");

      const { data: resultatTemoin } = await supabaseAdmin.rpc("lancer_action_antiville", {
        p_attaquant_id: attaquant1.userId,
        p_ville_id: temoin.villeId,
        p_type_action: "contamination",
      });
      const { data: resultatProtegee } = await supabaseAdmin.rpc("lancer_action_antiville", {
        p_attaquant_id: attaquant2.userId,
        p_ville_id: protegee.villeId,
        p_type_action: "contamination",
      });

      // Même population, aucune jauge en jeu (activité protectrice à
      // l'équilibre par défaut, ville neuve) : seule la présence de
      // l'Hôpital doit diviser la perte par deux.
      expect(resultatProtegee.perte).toBe(Math.round(resultatTemoin.perte / 2));
    } finally {
      await supprimerCompte(temoin.userId);
      await supprimerCompte(protegee.userId);
      await supprimerCompte(attaquant1.userId);
      await supprimerCompte(attaquant2.userId);
    }
  });

  test("sabotage : Opéra construit divise encore par deux l'effet d'une propagande", async () => {
    const temoin = await creerCompteAvecVille("j20-opera-temoin");
    const protegee = await creerCompteAvecVille("j20-opera-protegee");
    const attaquant1 = await creerCompteAvecVille("j20-opera-attaquant1");
    const attaquant2 = await creerCompteAvecVille("j20-opera-attaquant2");
    try {
      await supabaseAdmin.from("cities").update({ influence: 100_000 }).in("id", [temoin.villeId, protegee.villeId]);
      await construireDirectement(protegee.villeId, 2, "opera");

      const { data: resultatTemoin } = await supabaseAdmin.rpc("lancer_action_antiville", {
        p_attaquant_id: attaquant1.userId,
        p_ville_id: temoin.villeId,
        p_type_action: "propagande",
      });
      const { data: resultatProtegee } = await supabaseAdmin.rpc("lancer_action_antiville", {
        p_attaquant_id: attaquant2.userId,
        p_ville_id: protegee.villeId,
        p_type_action: "propagande",
      });

      expect(resultatProtegee.perte).toBe(Math.round(resultatTemoin.perte / 2));
    } finally {
      await supprimerCompte(temoin.userId);
      await supprimerCompte(protegee.userId);
      await supprimerCompte(attaquant1.userId);
      await supprimerCompte(attaquant2.userId);
    }
  });

  test("sabotage : Centrale solaire construite multiplie l'élan Énergie par 1,2", async () => {
    const ville = await creerCompteAvecVille("j20-centrale-solaire");
    try {
      await donnerVisites(ville.userId, ville.villeId, "energie", 20);
      const { data: avant } = await supabaseAdmin.rpc("jauges_ville", { p_ville_id: ville.villeId });
      const elanAvant = (avant as { activite: string; elan: number }[]).find((j) => j.activite === "energie")!.elan;

      await construireDirectement(ville.villeId, 1, "centrale_solaire");

      const { data: apres } = await supabaseAdmin.rpc("jauges_ville", { p_ville_id: ville.villeId });
      const elanApres = (apres as { activite: string; elan: number }[]).find((j) => j.activite === "energie")!.elan;

      expect(elanApres).toBeCloseTo(elanAvant * 1.2, 6);
    } finally {
      await supprimerCompte(ville.userId);
    }
  });
});
