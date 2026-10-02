import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 17 — Système de développement des villes (1/4) : choix
 * d'activité et jauges, sans effet de jeu encore branché dessus
 * (docs/SYSTEME-DEVELOPPEMENT.md §9 point 1). Deux contradictions avec
 * le document initial (23/09) tranchées par Adrien le 27/09/2026 (voir
 * docs/DECISIONS.md §4) : la visite reste 100 % automatique pour la
 * population, le choix d'activité est une action séparée et
 * facultative (aléatoire si absente) ; se visiter soi-même suit
 * exactement la même règle qu'une autre ville. Client service_role
 * recréé ici pour la même raison que les specs des jalons précédents
 * ("server-only" hors du pipeline Next.js).
 *
 * Correctif Jalon 19 (docs/A-INTEGRER.md §20 B, migration `0027`) : un
 * choix explicite est désormais définitif — un second appel sur la
 * même visite est refusé (P0023), même activité encore débloquée et
 * fenêtre de grâce encore ouverte.
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

test.describe.configure({ mode: "serial" });

test.describe("Jalon 17 — choisir une activité", () => {
  test("sabotage : visiter_ville tire une activité débloquée pour le niveau de la ville (Hameau)", async () => {
    const cible = await creerCompteAvecVille("j17-tirage-cible");
    const visiteur = await creerCompteAvecVille("j17-tirage-visiteur");
    try {
      const { error } = await supabaseAdmin.rpc("visiter_ville", {
        p_visiteur_id: visiteur.userId,
        p_ville_id: cible.villeId,
      });
      expect(error).toBeNull();

      const { data: visite } = await supabaseAdmin
        .from("visites")
        .select("activite")
        .eq("visiteur_id", visiteur.userId)
        .eq("ville_id", cible.villeId)
        .single();
      // Hameau (< 1 000 hab.) : seules Résidentiel et Loisirs sont débloquées.
      expect(["residentiel", "loisirs"]).toContain(visite?.activite);
    } finally {
      await supprimerCompte(cible.userId);
      await supprimerCompte(visiteur.userId);
    }
  });

  test("sabotage : choisir_activite_visite remplace l'activité de la toute dernière visite, si elle est débloquée", async () => {
    const cible = await creerCompteAvecVille("j17-choix-cible");
    const visiteur = await creerCompteAvecVille("j17-choix-visiteur");
    try {
      await supabaseAdmin.rpc("visiter_ville", {
        p_visiteur_id: visiteur.userId,
        p_ville_id: cible.villeId,
      });

      const { data: resultat, error } = await supabaseAdmin.rpc("choisir_activite_visite", {
        p_visiteur_id: visiteur.userId,
        p_ville_id: cible.villeId,
        p_activite: "loisirs",
      });
      expect(error).toBeNull();
      expect(resultat.activite).toBe("loisirs");

      // Choisir une activité non débloquée (Recherche, Ville/15 000) sur un Hameau : refusé.
      const { error: erreurNonDebloquee } = await supabaseAdmin.rpc("choisir_activite_visite", {
        p_visiteur_id: visiteur.userId,
        p_ville_id: cible.villeId,
        p_activite: "recherche",
      });
      expect(erreurNonDebloquee?.code).toBe("P0022");

      // L'activité invalide n'a pas écrasé le choix valide précédent.
      const { data: visiteApres } = await supabaseAdmin
        .from("visites")
        .select("activite")
        .eq("visiteur_id", visiteur.userId)
        .eq("ville_id", cible.villeId)
        .single();
      expect(visiteApres?.activite).toBe("loisirs");
    } finally {
      await supprimerCompte(cible.userId);
      await supprimerCompte(visiteur.userId);
    }
  });

  test("sabotage : un choix explicite verrouille la visite, un second choix (même valide) est refusé", async () => {
    const cible = await creerCompteAvecVille("j19-verrou-cible");
    const visiteur = await creerCompteAvecVille("j19-verrou-visiteur");
    try {
      await supabaseAdmin.rpc("visiter_ville", {
        p_visiteur_id: visiteur.userId,
        p_ville_id: cible.villeId,
      });

      const { data: premierChoix, error } = await supabaseAdmin.rpc("choisir_activite_visite", {
        p_visiteur_id: visiteur.userId,
        p_ville_id: cible.villeId,
        p_activite: "loisirs",
      });
      expect(error).toBeNull();
      expect(premierChoix.activite).toBe("loisirs");
      expect(premierChoix.activite_verrouillee).toBe(true);

      // Deuxième choix, pourtant parfaitement valide (Résidentiel est
      // débloqué dès le Hameau comme Loisirs) : refusé, le verrou ne
      // dépend pas de la validité de l'activité demandée.
      const { error: erreurVerrou } = await supabaseAdmin.rpc("choisir_activite_visite", {
        p_visiteur_id: visiteur.userId,
        p_ville_id: cible.villeId,
        p_activite: "residentiel",
      });
      expect(erreurVerrou?.code).toBe("P0023");

      const { data: visiteApres } = await supabaseAdmin
        .from("visites")
        .select("activite, activite_verrouillee")
        .eq("visiteur_id", visiteur.userId)
        .eq("ville_id", cible.villeId)
        .single();
      expect(visiteApres?.activite).toBe("loisirs");
      expect(visiteApres?.activite_verrouillee).toBe(true);
    } finally {
      await supprimerCompte(cible.userId);
      await supprimerCompte(visiteur.userId);
    }
  });

  test("sabotage : choisir_activite_visite échoue sans visite récente (aucune, ou trop ancienne)", async () => {
    const cible = await creerCompteAvecVille("j17-sansvisite-cible");
    const visiteur = await creerCompteAvecVille("j17-sansvisite-visiteur");
    try {
      const { error: erreurAucuneVisite } = await supabaseAdmin.rpc("choisir_activite_visite", {
        p_visiteur_id: visiteur.userId,
        p_ville_id: cible.villeId,
        p_activite: "residentiel",
      });
      expect(erreurAucuneVisite?.code).toBe("P0021");

      await supabaseAdmin.rpc("visiter_ville", {
        p_visiteur_id: visiteur.userId,
        p_ville_id: cible.villeId,
      });
      // Recule la visite hors de la fenêtre de grâce de 5 minutes.
      await supabaseAdmin
        .from("visites")
        .update({ created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() })
        .eq("visiteur_id", visiteur.userId)
        .eq("ville_id", cible.villeId);

      const { error: erreurTropAncienne } = await supabaseAdmin.rpc("choisir_activite_visite", {
        p_visiteur_id: visiteur.userId,
        p_ville_id: cible.villeId,
        p_activite: "residentiel",
      });
      expect(erreurTropAncienne?.code).toBe("P0021");
    } finally {
      await supprimerCompte(cible.userId);
      await supprimerCompte(visiteur.userId);
    }
  });

  test("sabotage : se visiter soi-même choisit aussi une activité, exactement comme une autre ville", async () => {
    const joueur = await creerCompteAvecVille("j17-autovisite");
    try {
      const { error } = await supabaseAdmin.rpc("visiter_ville", {
        p_visiteur_id: joueur.userId,
        p_ville_id: joueur.villeId,
      });
      expect(error).toBeNull();

      const { data: visite, error: erreurChoix } = await supabaseAdmin.rpc("choisir_activite_visite", {
        p_visiteur_id: joueur.userId,
        p_ville_id: joueur.villeId,
        p_activite: "residentiel",
      });
      expect(erreurChoix).toBeNull();
      expect(visite.activite).toBe("residentiel");
    } finally {
      await supprimerCompte(joueur.userId);
    }
  });

  test("sabotage : definir_recommandation réservée au maire, refuse une activité non débloquée", async () => {
    const maire = await creerCompteAvecVille("j17-maire");
    const intrus = await creerCompteAvecVille("j17-intrus");
    try {
      const { error: erreurIntrus } = await supabaseAdmin.rpc("definir_recommandation", {
        p_owner_id: intrus.userId,
        p_ville_id: maire.villeId,
        p_activite: "residentiel",
      });
      expect(erreurIntrus?.code).toBe("P0007");

      const { error: erreurNonDebloquee } = await supabaseAdmin.rpc("definir_recommandation", {
        p_owner_id: maire.userId,
        p_ville_id: maire.villeId,
        p_activite: "industrie", // Bourg (5 000), pas encore débloquée pour ce Hameau
      });
      expect(erreurNonDebloquee?.code).toBe("P0022");

      const { data: resultat, error } = await supabaseAdmin.rpc("definir_recommandation", {
        p_owner_id: maire.userId,
        p_ville_id: maire.villeId,
        p_activite: "loisirs",
      });
      expect(error).toBeNull();
      expect(resultat.recommandation_activite).toBe("loisirs");

      // Effacer la recommandation (null) fonctionne aussi.
      const { data: efface, error: erreurEffacer } = await supabaseAdmin.rpc("definir_recommandation", {
        p_owner_id: maire.userId,
        p_ville_id: maire.villeId,
        p_activite: null,
      });
      expect(erreurEffacer).toBeNull();
      expect(efface.recommandation_activite).toBeNull();
    } finally {
      await supprimerCompte(maire.userId);
      await supprimerCompte(intrus.userId);
    }
  });

  test("sabotage : jauges_ville applique la formule (élan + 20×part) / (élan_total + 20) / part", async () => {
    const cible = await creerCompteAvecVille("j17-jauges-cible");
    const visiteurs: string[] = [];
    try {
      // 10 visites "residentiel" aujourd'hui (poids 0,967^0 = 1 chacune),
      // insérées directement (hors visiter_ville, données de test
      // contrôlées) pour isoler le calcul de jauges_ville() du tirage
      // aléatoire et du délai/plafond de visiter_ville().
      const lignes = [] as { visiteur_id: string; ville_id: string; activite: string }[];
      for (let i = 0; i < 10; i++) {
        const v = await creerCompteAvecVille(`j17-jauges-v${i}`);
        visiteurs.push(v.userId);
        lignes.push({ visiteur_id: v.userId, ville_id: cible.villeId, activite: "residentiel" });
      }
      const { error: erreurInsert } = await supabaseAdmin.from("visites").insert(lignes);
      expect(erreurInsert).toBeNull();

      const { data: jauges, error } = await supabaseAdmin.rpc("jauges_ville", { p_ville_id: cible.villeId });
      expect(error).toBeNull();

      const parCle = new Map((jauges ?? []).map((j: { activite: string; jauge: number }) => [j.activite, j.jauge]));
      // élan_residentiel = 10, élan_total = 10.
      // jauge_residentiel = (10 + 20×0,30) / (10 + 20) / 0,30 = 16 / 9.
      expect(parCle.get("residentiel")).toBeCloseTo(16 / 9, 6);
      // jauge_industrie = (0 + 20×0,12) / 30 / 0,12 = 2,4 / 3,6 = 2/3.
      expect(parCle.get("industrie")).toBeCloseTo(2 / 3, 6);
      // Les 7 activités sont toujours renvoyées, même à 0 point.
      expect(jauges?.length).toBe(7);
    } finally {
      await supprimerCompte(cible.userId);
      for (const id of visiteurs) {
        await supprimerCompte(id);
      }
    }
  });

  test("sabotage : jauges_ville fait décroître les points de 3,3 %/jour (demi-vie ~3 semaines)", async () => {
    const cible = await creerCompteAvecVille("j17-decroissance-cible");
    const visiteur = await creerCompteAvecVille("j17-decroissance-visiteur");
    try {
      const ilYA21Jours = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
      const jour21 = ilYA21Jours.toISOString().slice(0, 10);
      const { error: erreurInsert } = await supabaseAdmin.from("visites").insert({
        visiteur_id: visiteur.userId,
        ville_id: cible.villeId,
        activite: "residentiel",
        jour: jour21,
        created_at: ilYA21Jours.toISOString(),
      });
      expect(erreurInsert).toBeNull();

      const { data: jauges } = await supabaseAdmin.rpc("jauges_ville", { p_ville_id: cible.villeId });
      const ligne = (jauges ?? []).find((j: { activite: string }) => j.activite === "residentiel");
      // Demi-vie d'environ 3 semaines : l'élan résiduel après 21 jours
      // doit avoisiner 0,5 (0,967^21 ≈ 0,494), pas 1 (pas de
      // décroissance) ni proche de 0 (décroissance beaucoup trop rapide).
      expect(ligne?.elan).toBeGreaterThan(0.4);
      expect(ligne?.elan).toBeLessThan(0.6);
    } finally {
      await supprimerCompte(cible.userId);
      await supprimerCompte(visiteur.userId);
    }
  });

  test("la page /villes affiche les jauges et propose de changer l'activité choisie après une visite", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const visiteur = await creerCompteAvecVille("j17-ui-visiteur");
    const cible = await creerCompteAvecVille("j17-ui-cible");
    try {
      await page.goto("/connexion");
      await page.getByLabel("Adresse e-mail").fill(visiteur.email);
      await page.getByLabel("Mot de passe").fill(visiteur.motDePasse);
      await page.getByRole("button", { name: "Se connecter" }).click();
      await expect(page).toHaveURL(/\/ville$/, { timeout: 20_000 });

      await page.goto(`/villes?ville=${cible.villeId}`);
      // Les 7 jauges (ou au moins celles débloquées) sont affichées,
      // même sans effet de jeu dessus.
      await expect(page.getByText("Résidentiel")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText("Loisirs")).toBeVisible();

      // L'activité affichée est une donnée serveur (dernière visite
      // dans la fenêtre de grâce), pas un état transitoire côté client
      // — elle doit donc rester visible même après le(s)
      // rafraîchissement(s) automatique(s) qui suivent la visite
      // (constaté en testant : ça peut arriver très vite, avant qu'un
      // joueur n'ait le temps de réagir à un composant éphémère,
      // d'où ce choix de conception). Timeout généreux (20 s) : la
      // scène 3D en arrière-plan peut ralentir le thread principal
      // (GPU stall observé en environnement de test headless).
      await expect(page.getByText("Activité choisie :")).toBeVisible({ timeout: 20_000 });

      // A-INTEGRER §27 B : juste après la visite, « +1 visite » puis les
      // choix d'activité d'emblée, sans passer par « Changer ».
      await expect(page.getByText("+1 visite").first()).toBeVisible();
      await expect(page.getByText("Choisir une activité")).toBeVisible();
      await expect(page.getByRole("button", { name: "Changer" })).toHaveCount(0);
      await page.getByRole("button", { name: /Loisirs/ }).click();
      await expect(page.getByText("Activité choisie : 🌳 Loisirs")).toBeVisible({ timeout: 10_000 });
      // Correctif Jalon 19 (§20 B) : ce choix explicite est verrouillé,
      // plus de bouton pour en choisir un autre sur cette visite.
      await expect(page.getByRole("button", { name: "Changer" })).toHaveCount(0);
    } finally {
      await supprimerCompte(visiteur.userId);
      await supprimerCompte(cible.userId);
    }
  });
});
