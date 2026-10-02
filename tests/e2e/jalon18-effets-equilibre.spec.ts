import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 18 — Système de développement des villes (2/4) : les effets de
 * l'équilibre (docs/SYSTEME-DEVELOPPEMENT.md §4, §5, §6bis). Client
 * service_role recréé ici pour la même raison que les specs des jalons
 * précédents ("server-only" hors du pipeline Next.js).
 *
 * Plusieurs mécaniques de ce jalon sont probabilistes par construction
 * (crise du Résidentiel, bonus Commerce, chance Recherche, tirage de
 * manifestation) — testées soit à une jauge extrême (probabilité
 * proche de 0 ou de 1, quasi déterministe en pratique), soit sur
 * suffisamment d'essais pour qu'un résultat contraire au mécanisme
 * attendu soit astronomiquement improbable (probabilité annotée en
 * commentaire à chaque fois), plutôt que sur une seule valeur exacte.
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

  return { userId, email, motDePasse, villeId: ville.id as string, villeNom: ville.nom as string };
}

async function supprimerCompte(userId: string) {
  await supabaseAdmin.auth.admin.deleteUser(userId);
}

/** Recule le timestamp des actions AntiVille pour rejouer l'anti-rafale (Jalon 14). */
async function debloquerDelaiAntiVille(attaquantId: string) {
  await supabaseAdmin
    .from("actions_antiville")
    .update({ created_at: new Date(Date.now() - 10_000).toISOString() })
    .eq("attaquant_id", attaquantId);
}

/**
 * Pousse une activité loin de l'équilibre pour une ville, sans passer
 * par de vrais visiteurs (coûteux à grande échelle) : insère des
 * visites datées de jours différents (contourne la contrainte unique
 * (visiteur_id, ville_id, jour)) depuis UN SEUL compte, pour accumuler
 * de l'élan côté décroissance. `nbJours` lignes ≈ élan
 * 30,3 × (1 − 0,967^nbJours) (somme géométrique, decay 3,3 %/jour).
 */
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

test.describe.configure({ mode: "serial" });

test.describe("Jalon 18 — effets de l'équilibre", () => {
  test("sabotage : le palier d'attaques cumule tous les attaquants, pas seulement le dernier", async () => {
    const cible = await creerCompteAvecVille("j18-palier-cible");
    const attaquants: string[] = [];
    try {
      for (let i = 0; i < 3; i++) {
        const a = await creerCompteAvecVille(`j18-palier-att${i}`);
        attaquants.push(a.userId);
        const { data, error } = await supabaseAdmin.rpc("lancer_action_antiville", {
          p_attaquant_id: a.userId,
          p_ville_id: cible.villeId,
          p_type_action: "propagande",
        });
        expect(error).toBeNull();
        // 3 attaques cumulées au total, quel que soit l'attaquant qui
        // vient de jouer : toujours "incidents" (1-9).
        expect(data?.palier).toBe("incidents");
      }

      const { data: nb } = await supabaseAdmin.rpc("attaques_recues_aujourdhui", { p_ville_id: cible.villeId });
      expect(nb).toBe(3);
    } finally {
      await supprimerCompte(cible.userId);
      for (const id of attaquants) await supprimerCompte(id);
    }
  });

  test("sabotage : la contamination est plafonnée à 10 % de la population par jour, tous attaquants confondus", async () => {
    const cible = await creerCompteAvecVille("j18-plafond-cible");
    const attaquants: string[] = [];
    try {
      // population_max doit suivre : une contrainte de la table impose
      // population <= population_max (trouvé en vérifiant ce test —
      // sans ça, la mise à jour est silencieusement rejetée et la
      // ville reste à population 1).
      await supabaseAdmin.from("cities").update({ population: 100, population_max: 100 }).eq("id", cible.villeId);

      // Perte minimale de 1/attaque (0,01 % de 100 arrondit à 0, plancher
      // à 1) : 10 attaques suffisent à atteindre le plafond de 10 % (10
      // habitants) pour une ville à 100 habitants.
      for (let i = 0; i < 12; i++) {
        const a = await creerCompteAvecVille(`j18-plafond-att${i}`);
        attaquants.push(a.userId);
        await supabaseAdmin.rpc("lancer_action_antiville", {
          p_attaquant_id: a.userId,
          p_ville_id: cible.villeId,
          p_type_action: "contamination",
        });
      }

      const { data: ville } = await supabaseAdmin
        .from("cities")
        .select("population")
        .eq("id", cible.villeId)
        .single();
      // 100 − 10 (plafond de 10 %) = 90, jamais moins malgré 12 attaques.
      expect(ville?.population).toBe(90);
    } finally {
      await supprimerCompte(cible.userId);
      for (const id of attaquants) await supprimerCompte(id);
    }
  });

  test("sabotage : la durée de blocage de la grève dépend du nombre cumulé d'attaques du jour, pas de l'attaquant", async () => {
    const cible = await creerCompteAvecVille("j18-greve-cible");
    const attaquant = await creerCompteAvecVille("j18-greve-attaquant");
    try {
      const avant = Date.now();
      const { data } = await supabaseAdmin.rpc("lancer_action_antiville", {
        p_attaquant_id: attaquant.userId,
        p_ville_id: cible.villeId,
        p_type_action: "greve",
      });
      // Hameau (niveau 0, ratio 1), 1re grève du jour : √(1/1) = 1 heure.
      expect(data?.duree_heures).toBeCloseTo(1, 1);

      const { data: ville } = await supabaseAdmin
        .from("cities")
        .select("greve_jusqua")
        .eq("id", cible.villeId)
        .single();
      const dureeReelleMs = new Date(ville!.greve_jusqua as string).getTime() - avant;
      expect(dureeReelleMs).toBeGreaterThan(55 * 60 * 1000); // ~1h, marge pour le temps d'exécution
      expect(dureeReelleMs).toBeLessThan(65 * 60 * 1000);
    } finally {
      await supprimerCompte(cible.userId);
      await supprimerCompte(attaquant.userId);
    }
  });

  test("sabotage : crise du Résidentiel — une ville très déséquilibrée n'accorde pas l'habitant à chaque visite", async () => {
    const cible = await creerCompteAvecVille("j18-crise-cible");
    const gonfleur = await creerCompteAvecVille("j18-crise-gonfleur");
    const visiteurs: string[] = [];
    try {
      // Pousse trois activités très loin devant sans jamais toucher
      // Résidentiel : 300 jours d'historique chacune (élan ≈ 30,3 par
      // activité, asymptote 1/(1−0,967) — un seul compte "gonfleur"
      // suffit, la contrainte unique sur `visites` a été retirée au
      // Jalon 13 bis, migration 0018). Élan total ≈ 90 → jauge
      // Résidentiel = 20/(90+20) ≈ 18 %, probabilité de gain
      // ≈ 18/60 ≈ 30 % par visite (une seule activité ne suffisait pas :
      // ≈ 40 % de jauge, 67 % de chance de gain — pas assez creusé,
      // trouvé en vérifiant ce test).
      await gonflerActivite(gonfleur.userId, cible.villeId, "loisirs", 300);
      await gonflerActivite(gonfleur.userId, cible.villeId, "commerce", 300);
      await gonflerActivite(gonfleur.userId, cible.villeId, "services", 300);

      const { data: jaugeAvant } = await supabaseAdmin.rpc("jauge_activite", {
        p_ville_id: cible.villeId,
        p_activite: "residentiel",
      });
      expect(jaugeAvant).toBeLessThan(0.3); // bien confirmé en crise profonde avant de continuer

      let gainTotal = 0;
      for (let i = 0; i < 15; i++) {
        const v = await creerCompteAvecVille(`j18-crise-v${i}`);
        visiteurs.push(v.userId);
        const { data } = await supabaseAdmin.rpc("visiter_ville", {
          p_visiteur_id: v.userId,
          p_ville_id: cible.villeId,
        });
        gainTotal += (data as { gain: number })?.gain ?? 0;
      }

      // À ~30 % de chance par visite, la probabilité que les 15 visites
      // réussissent TOUTES est ≈ 0,3^15 ≈ 1,4×10⁻⁸ : si ce test échoue
      // ici, c'est que la crise n'a plus d'effet, pas la malchance.
      expect(gainTotal).toBeLessThan(15);
    } finally {
      await supprimerCompte(cible.userId);
      await supprimerCompte(gonfleur.userId);
      for (const id of visiteurs) await supprimerCompte(id);
    }
  });

  test("sabotage : solidarité — après une attaque, choisir l'activité protectrice rapporte un habitant de plus", async () => {
    const cible = await creerCompteAvecVille("j18-solidarite-cible");
    const attaquant = await creerCompteAvecVille("j18-solidarite-attaquant");
    const visiteur = await creerCompteAvecVille("j18-solidarite-visiteur");
    try {
      // Services (protège contre la contamination) débloqué dès Village
      // (1 000 hab.) : passe la ville au niveau nécessaire directement,
      // aucun joueur ne peut le faire (setup de test).
      await supabaseAdmin.from("cities").update({ population_max: 1000, niveau: 1 }).eq("id", cible.villeId);

      const { error: erreurAttaque } = await supabaseAdmin.rpc("lancer_action_antiville", {
        p_attaquant_id: attaquant.userId,
        p_ville_id: cible.villeId,
        p_type_action: "contamination",
      });
      expect(erreurAttaque).toBeNull();

      const { data: avant } = await supabaseAdmin
        .from("cities")
        .select("population")
        .eq("id", cible.villeId)
        .single();

      const { data: visite, error: erreurVisite } = await supabaseAdmin.rpc("choisir_activite_visite", {
        p_visiteur_id: visiteur.userId,
        p_ville_id: cible.villeId,
        p_activite: "services",
      });
      // Pas encore de visite : choisir_activite_visite échoue sans
      // visite récente à modifier — visite d'abord, puis change vers
      // l'activité protectrice pour déclencher la solidarité.
      expect(erreurVisite?.code).toBe("P0021");

      await supabaseAdmin.rpc("visiter_ville", { p_visiteur_id: visiteur.userId, p_ville_id: cible.villeId });
      const { data: visiteApres, error: erreurChoix } = await supabaseAdmin.rpc("choisir_activite_visite", {
        p_visiteur_id: visiteur.userId,
        p_ville_id: cible.villeId,
        p_activite: "services",
      });
      expect(erreurChoix).toBeNull();
      expect(visiteApres?.activite).toBe("services");

      const { data: apres } = await supabaseAdmin
        .from("cities")
        .select("population")
        .eq("id", cible.villeId)
        .single();
      // +1 de la visite elle-même, +1 (ou +2 si palier Émeutes+, pas le
      // cas ici avec une seule attaque) de solidarité.
      expect(apres!.population).toBeGreaterThanOrEqual(avant!.population + 2);

      // Un second changement d'activité ne rapporte pas la solidarité
      // une deuxième fois (bonus_solidarite_applique).
      const populationIntermediaire = apres!.population;
      await supabaseAdmin.rpc("choisir_activite_visite", {
        p_visiteur_id: visiteur.userId,
        p_ville_id: cible.villeId,
        p_activite: "residentiel",
      });
      await supabaseAdmin.rpc("choisir_activite_visite", {
        p_visiteur_id: visiteur.userId,
        p_ville_id: cible.villeId,
        p_activite: "services",
      });
      const { data: final } = await supabaseAdmin
        .from("cities")
        .select("population")
        .eq("id", cible.villeId)
        .single();
      expect(final?.population).toBe(populationIntermediaire);
    } finally {
      await supprimerCompte(cible.userId);
      await supprimerCompte(attaquant.userId);
      await supprimerCompte(visiteur.userId);
    }
  });

  test("sabotage : crise du Commerce — pas de bonus de jumelage pour la ville concernée, l'autre le touche quand même", async () => {
    const villeA = await creerCompteAvecVille("j18-jumelage-a");
    const villeB = await creerCompteAvecVille("j18-jumelage-b");
    const decoy = await creerCompteAvecVille("j18-jumelage-decoy");
    const gonfleur = await creerCompteAvecVille("j18-jumelage-gonfleur");
    try {
      // Crise du Commerce pour A seulement (même technique que le test
      // de crise du Résidentiel ci-dessus, appliquée au Commerce de A).
      await gonflerActivite(gonfleur.userId, villeA.villeId, "loisirs", 300);
      const { data: jaugeCommerceA } = await supabaseAdmin.rpc("jauge_activite", {
        p_ville_id: villeA.villeId,
        p_activite: "commerce",
      });
      expect(jaugeCommerceA).toBeLessThan(0.6);

      await supabaseAdmin.rpc("visiter_ville", { p_visiteur_id: villeA.userId, p_ville_id: decoy.villeId });
      await supabaseAdmin.rpc("visiter_ville", { p_visiteur_id: villeB.userId, p_ville_id: decoy.villeId });

      const { data: proposition } = await supabaseAdmin.rpc("proposer_jumelage", {
        p_proposant_id: villeA.userId,
        p_ville_ciblee_id: villeB.villeId,
      });
      await supabaseAdmin.rpc("repondre_jumelage", {
        p_joueur_id: villeB.userId,
        p_jumelage_id: proposition.id,
        p_accepter: true,
      });

      const { data: aAvant } = await supabaseAdmin.from("cities").select("population").eq("id", villeA.villeId).single();
      const { data: bAvant } = await supabaseAdmin.from("cities").select("population").eq("id", villeB.villeId).single();

      await supabaseAdmin.rpc("reclamer_bonus_jumelages", { p_joueur_id: villeA.userId });

      const { data: aApres } = await supabaseAdmin.from("cities").select("population").eq("id", villeA.villeId).single();
      const { data: bApres } = await supabaseAdmin.from("cities").select("population").eq("id", villeB.villeId).single();

      expect(aApres?.population).toBe(aAvant?.population); // Commerce en crise : rien pour A
      expect(bApres?.population).toBe((bAvant?.population ?? 0) + 1); // B touche son bonus normalement
    } finally {
      await supprimerCompte(villeA.userId);
      await supprimerCompte(villeB.userId);
      await supprimerCompte(decoy.userId);
      await supprimerCompte(gonfleur.userId);
    }
  });

  test("sabotage : verifier_manifestation est sans effet sur une ville équilibrée, et idempotente le même jour", async () => {
    const cible = await creerCompteAvecVille("j18-calme-cible");
    try {
      const { data: avant } = await supabaseAdmin.from("cities").select("population").eq("id", cible.villeId).single();

      await supabaseAdmin.rpc("verifier_manifestation", { p_ville_id: cible.villeId });
      await supabaseAdmin.rpc("verifier_manifestation", { p_ville_id: cible.villeId });

      const { data: apres } = await supabaseAdmin.from("cities").select("population").eq("id", cible.villeId).single();
      expect(apres?.population).toBe(avant?.population);

      const { data: evenements } = await supabaseAdmin
        .from("city_events")
        .select("id")
        .eq("ville_id", cible.villeId)
        .eq("type", "manifestation");
      expect(evenements?.length ?? 0).toBe(0); // ville équilibrée : jamais de manifestation
    } finally {
      await supprimerCompte(cible.userId);
    }
  });

  test("sabotage : une ville en crise profonde finit par manifester (sur plusieurs essais indépendants)", async () => {
    const gonfleur = await creerCompteAvecVille("j18-manif-gonfleur");
    const proprietaires: string[] = [];
    try {
      let auMoinsUne = false;
      // Chaque ville en crise profonde a un risque de manifestation
      // élevé (jusqu'à 80 %, toutes activités hors Résidentiel en
      // crise) ; sur 8 villes indépendantes, la probabilité qu'AUCUNE
      // ne manifeste est astronomiquement faible si le mécanisme
      // fonctionne (≤ 0,2^8 ≈ 2,6×10⁻⁶ dans le pire cas).
      for (let i = 0; i < 8; i++) {
        const v = await creerCompteAvecVille(`j18-manif-cible${i}`);
        proprietaires.push(v.userId);
        await gonflerActivite(gonfleur.userId, v.villeId, "loisirs", 300);
        await supabaseAdmin.rpc("verifier_manifestation", { p_ville_id: v.villeId });
        const { data: evenements } = await supabaseAdmin
          .from("city_events")
          .select("valeur")
          .eq("ville_id", v.villeId)
          .eq("type", "manifestation");
        if ((evenements ?? []).some((e) => (e.valeur ?? 0) > 0)) {
          auMoinsUne = true;
        }
      }
      expect(auMoinsUne).toBe(true);
    } finally {
      await supprimerCompte(gonfleur.userId);
      for (const id of proprietaires) await supprimerCompte(id);
    }
  });

  test("sabotage : point fort Recherche — l'influence a une chance de compter double (sur plusieurs essais)", async () => {
    const cible = await creerCompteAvecVille("j18-recherche-cible");
    const gonfleur = await creerCompteAvecVille("j18-recherche-gonfleur");
    const joueurs: string[] = [];
    try {
      // Recherche débloquée dès Ville (15 000 hab.), poussée en point
      // fort (élan très supérieur à sa part cible de 8 %).
      await supabaseAdmin.from("cities").update({ population_max: 15000, niveau: 3 }).eq("id", cible.villeId);
      await gonflerActivite(gonfleur.userId, cible.villeId, "recherche", 300);
      const { data: jaugeRecherche } = await supabaseAdmin.rpc("jauge_activite", {
        p_ville_id: cible.villeId,
        p_activite: "recherche",
      });
      expect(jaugeRecherche).toBeGreaterThan(1.2); // confirmé en point fort

      for (let i = 0; i < 15; i++) {
        const j = await creerCompteAvecVille(`j18-recherche-j${i}`);
        joueurs.push(j.userId);
        await supabaseAdmin.rpc("influencer_ville", { p_joueur_id: j.userId, p_ville_id: cible.villeId });
      }
      const { data: villeFinale } = await supabaseAdmin
        .from("cities")
        .select("influence")
        .eq("id", cible.villeId)
        .single();
      // 15 actions à +1 ou +2 chacune : si aucune n'a jamais doublé,
      // l'influence totale vaudrait exactement 15. La probabilité qu'un
      // doublement à ≥ 50 % de chance ne se produise JAMAIS sur 15
      // essais est ≤ 0,5^15 ≈ 3×10⁻⁵.
      expect(villeFinale?.influence).toBeGreaterThan(15);
    } finally {
      await supprimerCompte(cible.userId);
      await supprimerCompte(gonfleur.userId);
      for (const id of joueurs) await supprimerCompte(id);
    }
  });
});
