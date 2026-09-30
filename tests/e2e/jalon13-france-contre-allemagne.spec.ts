import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Jalon 13 : « France contre Allemagne » — vote majoritaire pour/contre
 * qui clôt la décision diplomatique du Jalon 12 en fin de semaine et,
 * si la décision adoptée est une "rivalité", déclenche un conflit d'une
 * semaine. L'effort quotidien de chaque camp est dérivé automatiquement
 * des stats nationales déjà existantes (activité 7j agrégée, ressources
 * nationales — voir effort_national() dans la migration 0017), pas
 * d'une action citoyenne à cliquer : correctif d'après-coup d'Adrien
 * (docs/A-INTEGRER.md §12), voir docs/ROADMAP.md et docs/DECISIONS.md
 * §4. Client service_role recréé ici pour la même raison que les specs
 * des jalons précédents ("server-only" hors du pipeline Next.js).
 *
 * Comme pour les jalons précédents, pas de vérification rouge par
 * sabotage sur les fonctions SQL elles-mêmes (pas d'accès psql direct) :
 * les assertions vérifient des transitions et des valeurs exactes,
 * robustes au contenu déjà présent en base. Les propositions/votes
 * "de la semaine passée" nécessaires pour tester la résolution sont
 * insérés directement (service_role, hors RLS) plutôt que via
 * proposer_decision_diplomatique(), qui ne permet que la semaine en
 * cours.
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

/** Lundi (UTC, "YYYY-MM-DD") de la semaine courante décalée de
 * `decalageSemaines` semaines — même convention que debutSemaineIso()
 * (src/lib/game/semaineIso.ts) et date_trunc('week', ...) côté SQL. */
function semaine(decalageSemaines = 0): string {
  const maintenant = new Date();
  const jour = maintenant.getUTCDay();
  const joursDepuisLundi = jour === 0 ? 6 : jour - 1;
  const lundi = new Date(
    Date.UTC(
      maintenant.getUTCFullYear(),
      maintenant.getUTCMonth(),
      maintenant.getUTCDate() - joursDepuisLundi + decalageSemaines * 7
    )
  );
  return lundi.toISOString().slice(0, 10);
}

async function creerCompteAvecVille(prefixe: string, paysId: string, population = 1) {
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
    p_country_id: paysId,
    p_nom_ville: `${prefixe}-ville`,
    p_region_id: null,
  });
  if (erreurVille) {
    throw new Error(`Impossible de créer la ville de ${prefixe} : ${erreurVille.message}`);
  }

  if (population !== 1) {
    const { error: erreurPop } = await supabaseAdmin
      .from("cities")
      .update({ population, population_max: population })
      .eq("id", ville.id);
    if (erreurPop) throw new Error(`Impossible de fixer la population de ${prefixe} : ${erreurPop.message}`);
  }

  return { userId, email, motDePasse, villeId: ville.id as string };
}

async function supprimerCompte(userId: string) {
  await supabaseAdmin.auth.admin.deleteUser(userId);
}

async function connecter(page: import("@playwright/test").Page, email: string, motDePasse: string) {
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(motDePasse);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

test.describe.configure({ mode: "serial" });

test.describe("Jalon 13 — France contre Allemagne", () => {
  test("soutenir_decision_diplomatique valide la position, compte pour/contre séparément, refuse doublon et sans proposition", async () => {
    const presidente = await creerCompteAvecVille("j13-vote-pres", "JP", 9_000_000);
    const a = await creerCompteAvecVille("j13-vote-a", "JP", 1);
    const b = await creerCompteAvecVille("j13-vote-b", "JP", 1);
    const c = await creerCompteAvecVille("j13-vote-c", "JP", 1);
    const orpheline = await creerCompteAvecVille("j13-vote-orph", "AU", 1);
    try {
      await supabaseAdmin.rpc("verifier_president", { p_country_id: "JP" });

      const { error: erreurSansProposition } = await supabaseAdmin.rpc("soutenir_decision_diplomatique", {
        p_joueur_id: orpheline.userId,
        p_position: "pour",
      });
      expect(erreurSansProposition?.code).toBe("P0016");

      await supabaseAdmin.rpc("proposer_decision_diplomatique", {
        p_president_id: presidente.userId,
        p_pays_cible_id: "KR",
        p_categorie: "rivalite",
      });

      const { error: erreurPositionInvalide } = await supabaseAdmin.rpc("soutenir_decision_diplomatique", {
        p_joueur_id: a.userId,
        p_position: "peut-etre",
      });
      expect(erreurPositionInvalide?.code).toBe("P0014");

      const { error: eA } = await supabaseAdmin.rpc("soutenir_decision_diplomatique", {
        p_joueur_id: a.userId,
        p_position: "pour",
      });
      expect(eA).toBeNull();
      const { error: eB } = await supabaseAdmin.rpc("soutenir_decision_diplomatique", {
        p_joueur_id: b.userId,
        p_position: "pour",
      });
      expect(eB).toBeNull();
      const { error: eC } = await supabaseAdmin.rpc("soutenir_decision_diplomatique", {
        p_joueur_id: c.userId,
        p_position: "contre",
      });
      expect(eC).toBeNull();

      // Sabotage : A vote une deuxième fois la même semaine.
      const { error: erreurDoublon } = await supabaseAdmin.rpc("soutenir_decision_diplomatique", {
        p_joueur_id: a.userId,
        p_position: "contre",
      });
      expect(erreurDoublon?.code).toBe("23505");

      const { data: resultat } = await supabaseAdmin.rpc("resultat_decision_semaine", {
        p_country_id: "JP",
        p_semaine: null,
      });
      const ligne = Array.isArray(resultat) ? resultat[0] : resultat;
      expect(ligne.pays_cible_id).toBe("KR");
      expect(ligne.nb_pour).toBe(2); // A et B
      expect(ligne.nb_contre).toBe(1); // C, pas le doublon de A
    } finally {
      await supprimerCompte(presidente.userId);
      await supprimerCompte(a.userId);
      await supprimerCompte(b.userId);
      await supprimerCompte(c.userId);
      await supprimerCompte(orpheline.userId);
    }
  });

  test("resoudre_decision_diplomatique adopte à la majorité et déclenche un conflit de rivalité, idempotente ; rejette à l'égalité sans conflit", async () => {
    const presidenteJP = await creerCompteAvecVille("j13-resout-jp", "JP", 9_000_000);
    try {
      // Semaine passée déjà close : insérée directement (service_role,
      // hors RLS), proposer_decision_diplomatique() ne permet que la
      // semaine en cours.
      const { data: propositionAdoptee, error: erreurInsertion } = await supabaseAdmin
        .from("propositions_diplomatiques")
        .insert({
          country_id: "JP",
          pays_cible_id: "KR",
          categorie: "rivalite",
          semaine: semaine(-1),
          proposee_par_ville_id: presidenteJP.villeId,
        })
        .select()
        .single();
      expect(erreurInsertion).toBeNull();

      const votants = await Promise.all([
        creerCompteAvecVille("j13-resout-pour1", "JP", 1),
        creerCompteAvecVille("j13-resout-pour2", "JP", 1),
        creerCompteAvecVille("j13-resout-contre1", "JP", 1),
      ]);
      const { error: erreurVotes } = await supabaseAdmin.from("votes_diplomatie").insert([
        { joueur_id: votants[0].userId, country_id: "JP", semaine: semaine(-1), position: "pour" },
        { joueur_id: votants[1].userId, country_id: "JP", semaine: semaine(-1), position: "pour" },
        { joueur_id: votants[2].userId, country_id: "JP", semaine: semaine(-1), position: "contre" },
      ]);
      expect(erreurVotes).toBeNull();

      const { error: erreurResolution } = await supabaseAdmin.rpc("resoudre_decision_diplomatique", {
        p_country_id: "JP",
      });
      expect(erreurResolution).toBeNull();

      const { data: resultatDiplo } = await supabaseAdmin
        .from("resultats_diplomatiques")
        .select("nb_pour, nb_contre, adoptee")
        .eq("proposition_id", propositionAdoptee.id)
        .single();
      expect(resultatDiplo?.nb_pour).toBe(2);
      expect(resultatDiplo?.nb_contre).toBe(1);
      expect(resultatDiplo?.adoptee).toBe(true);

      const { data: conflit } = await supabaseAdmin
        .from("conflits")
        .select("pays_attaquant_id, pays_defenseur_id, statut")
        .eq("pays_attaquant_id", "JP")
        .eq("pays_defenseur_id", "KR")
        .single();
      expect(conflit?.statut).toBe("en_cours");

      // Idempotence : un deuxième appel ne duplique ni le résultat ni le conflit.
      await supabaseAdmin.rpc("resoudre_decision_diplomatique", { p_country_id: "JP" });
      const { data: resultatsApresRejeu } = await supabaseAdmin
        .from("resultats_diplomatiques")
        .select("id")
        .eq("proposition_id", propositionAdoptee.id);
      expect(resultatsApresRejeu).toHaveLength(1);
      const { data: conflitsApresRejeu } = await supabaseAdmin
        .from("conflits")
        .select("id")
        .eq("pays_attaquant_id", "JP")
        .eq("pays_defenseur_id", "KR")
        .eq("statut", "en_cours");
      expect(conflitsApresRejeu).toHaveLength(1);

      for (const v of votants) await supprimerCompte(v.userId);
    } finally {
      await supprimerCompte(presidenteJP.userId);
      // Nettoyage des lignes "globales" (non liées à un compte) : sans
      // ça, un conflit JP-KR "en_cours" resterait en base indéfiniment
      // et ferait échouer tout re-run (contrainte unique
      // conflits_paire_active_unique, insensible à la semaine).
      await supabaseAdmin.from("conflits").delete().eq("pays_attaquant_id", "JP").eq("pays_defenseur_id", "KR");
      await supabaseAdmin.from("resultats_diplomatiques").delete().eq("country_id", "JP");
      await supabaseAdmin.from("votes_diplomatie").delete().eq("country_id", "JP");
      await supabaseAdmin.from("propositions_diplomatiques").delete().eq("country_id", "JP");
    }

    // Cas rejet : pays isolé, majorité contre, aucun conflit créé.
    const presidentePT = await creerCompteAvecVille("j13-rejet-pt", "PT", 9_000_000);
    try {
      const { data: propositionRejetee, error: erreurInsertion } = await supabaseAdmin
        .from("propositions_diplomatiques")
        .insert({
          country_id: "PT",
          pays_cible_id: "ES",
          categorie: "rivalite",
          semaine: semaine(-1),
          proposee_par_ville_id: presidentePT.villeId,
        })
        .select()
        .single();
      expect(erreurInsertion).toBeNull();

      const votants = await Promise.all([
        creerCompteAvecVille("j13-rejet-pour1", "PT", 1),
        creerCompteAvecVille("j13-rejet-contre1", "PT", 1),
        creerCompteAvecVille("j13-rejet-contre2", "PT", 1),
      ]);
      await supabaseAdmin.from("votes_diplomatie").insert([
        { joueur_id: votants[0].userId, country_id: "PT", semaine: semaine(-1), position: "pour" },
        { joueur_id: votants[1].userId, country_id: "PT", semaine: semaine(-1), position: "contre" },
        { joueur_id: votants[2].userId, country_id: "PT", semaine: semaine(-1), position: "contre" },
      ]);

      await supabaseAdmin.rpc("resoudre_decision_diplomatique", { p_country_id: "PT" });

      const { data: resultatDiplo } = await supabaseAdmin
        .from("resultats_diplomatiques")
        .select("adoptee")
        .eq("proposition_id", propositionRejetee.id)
        .single();
      expect(resultatDiplo?.adoptee).toBe(false);

      const { data: conflit } = await supabaseAdmin
        .from("conflits")
        .select("id")
        .eq("pays_attaquant_id", "PT")
        .eq("pays_defenseur_id", "ES");
      expect(conflit).toHaveLength(0);

      for (const v of votants) await supprimerCompte(v.userId);
    } finally {
      await supprimerCompte(presidentePT.userId);
      await supabaseAdmin.from("resultats_diplomatiques").delete().eq("country_id", "PT");
      await supabaseAdmin.from("votes_diplomatie").delete().eq("country_id", "PT");
      await supabaseAdmin.from("propositions_diplomatiques").delete().eq("country_id", "PT");
    }
  });

  test("effort_national dérive de l'activité et des ressources nationales ; resoudre_conflits_en_cours applique le bonus défensif de 50 %", async () => {
    const attaquant1 = await creerCompteAvecVille("j13-eff-au1", "AU", 1);
    const attaquant2 = await creerCompteAvecVille("j13-eff-au2", "AU", 1);
    const defenseur1 = await creerCompteAvecVille("j13-eff-nz1", "NZ", 1);
    try {
      // Activité (Jalon 9, activite_7j_de) : insérée directement, jours
      // distincts dans les 7 derniers jours — plus simple et déterministe
      // que d'enchaîner de vraies visites sur plusieurs jours calendaires.
      const jour = (decalage: number) => {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - decalage);
        return d.toISOString().slice(0, 10);
      };
      await supabaseAdmin.from("visites").insert([
        { visiteur_id: attaquant1.userId, ville_id: attaquant1.villeId, jour: jour(0) },
        { visiteur_id: attaquant1.userId, ville_id: attaquant1.villeId, jour: jour(1) },
        { visiteur_id: attaquant1.userId, ville_id: attaquant1.villeId, jour: jour(2) },
        { visiteur_id: attaquant2.userId, ville_id: attaquant2.villeId, jour: jour(0) },
        { visiteur_id: attaquant2.userId, ville_id: attaquant2.villeId, jour: jour(1) },
        { visiteur_id: defenseur1.userId, ville_id: defenseur1.villeId, jour: jour(0) },
      ]);
      // Ressources nationales (Jalon 10, ressources_pays) : 16 votes
      // "industrie" pour l'attaquant, répartis sur 16 semaines passées
      // distinctes (un seul joueur, votes_pays n'autorise qu'un vote par
      // semaine et par joueur, pas par pays) => total 16,
      // floor(sqrt(16)) = 4 de bonus. Rien côté défenseur.
      await supabaseAdmin.from("votes_pays").insert(
        Array.from({ length: 16 }, (_, i) => ({
          joueur_id: attaquant1.userId,
          country_id: "AU",
          categorie: "industrie",
          semaine: semaine(-1 - i),
        }))
      );

      // effort_national(AU) = activité (3 + 2 = 5) + floor(sqrt(16)) = 4 => 9
      // effort_national(NZ) = activité (1) + floor(sqrt(0)) = 0 => 1
      const { data: effortAU, error: erreurAU } = await supabaseAdmin.rpc("effort_national", {
        p_country_id: "AU",
      });
      expect(erreurAU).toBeNull();
      expect(effortAU).toBe(9);
      const { data: effortNZ, error: erreurNZ } = await supabaseAdmin.rpc("effort_national", {
        p_country_id: "NZ",
      });
      expect(erreurNZ).toBeNull();
      expect(effortNZ).toBe(1);

      // Conflit déjà arrivé à échéance : resoudre_conflits_en_cours doit
      // le clôturer immédiatement à son prochain appel. Bonus défensif
      // 50 % : seuil floor(1 * 1.5) = 1 ; 9 > 1 => l'attaquant l'emporte.
      const { data: conflit, error: erreurInsertion } = await supabaseAdmin
        .from("conflits")
        .insert({
          pays_attaquant_id: "AU",
          pays_defenseur_id: "NZ",
          fin: new Date(Date.now() - 1000).toISOString(),
        })
        .select()
        .single();
      expect(erreurInsertion).toBeNull();

      // Depuis la grille (effet unitaire faible/cumul/plafond/paliers,
      // voir migration 0032) : effort_attaquant/defenseur sont figés par
      // resoudre_conflits_en_cours(), plus recalculés à la volée par
      // conflit_pays() — avant son premier appel, ils valent 0.
      const { data: conflitEnCours } = await supabaseAdmin.rpc("conflit_pays", { p_country_id: "AU" });
      const ligneEnCours = Array.isArray(conflitEnCours) ? conflitEnCours[0] : conflitEnCours;
      expect(ligneEnCours.statut).toBe("en_cours");
      expect(ligneEnCours.effort_attaquant).toBe(0);
      expect(ligneEnCours.effort_defenseur).toBe(0);
      expect(ligneEnCours.jours_gagnes_attaquant).toBe(0);
      expect(ligneEnCours.jours_gagnes_defenseur).toBe(0);

      const { error: erreurResolution } = await supabaseAdmin.rpc("resoudre_conflits_en_cours");
      expect(erreurResolution).toBeNull();

      const { data: conflitTermine } = await supabaseAdmin
        .from("conflits")
        .select("statut, resultat, effort_attaquant, effort_defenseur, jours_gagnes_attaquant, jours_gagnes_defenseur")
        .eq("id", conflit.id)
        .single();
      expect(conflitTermine?.statut).toBe("termine");
      expect(conflitTermine?.resultat).toBe("attaquant");
      expect(conflitTermine?.effort_attaquant).toBe(9);
      expect(conflitTermine?.effort_defenseur).toBe(1);
      // Une seule journée traitée ici (debut et fin le même jour calendaire
      // dans ce test) : l'attaquant a gagné cette unique journée.
      expect(conflitTermine?.jours_gagnes_attaquant).toBe(1);
      expect(conflitTermine?.jours_gagnes_defenseur).toBe(0);

      // Idempotence : un deuxième appel ne change plus rien (déjà "termine").
      await supabaseAdmin.rpc("resoudre_conflits_en_cours");
      const { data: conflitApresRejeu } = await supabaseAdmin
        .from("conflits")
        .select("statut, resultat")
        .eq("id", conflit.id)
        .single();
      expect(conflitApresRejeu?.statut).toBe("termine");
      expect(conflitApresRejeu?.resultat).toBe("attaquant");
    } finally {
      await supabaseAdmin.from("conflits").delete().eq("pays_attaquant_id", "AU").eq("pays_defenseur_id", "NZ");
      await supabaseAdmin.from("votes_pays").delete().eq("country_id", "AU");
      for (const j of [attaquant1, attaquant2, defenseur1]) await supprimerCompte(j.userId);
    }
  });

  test("la page /pays affiche le vote pour/contre et l'effort automatique d'un conflit en cours", async ({ page }) => {
    test.setTimeout(90_000);
    const presidente = await creerCompteAvecVille("j13-ui-pres", "MX", 9_000_000);
    try {
      await supabaseAdmin.rpc("verifier_president", { p_country_id: "MX" });
      await supabaseAdmin.rpc("proposer_decision_diplomatique", {
        p_president_id: presidente.userId,
        p_pays_cible_id: "AR",
        p_categorie: "rivalite",
      });
      const { error: erreurConflit } = await supabaseAdmin.from("conflits").insert({
        pays_attaquant_id: "MX",
        pays_defenseur_id: "AR",
        fin: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      });
      expect(erreurConflit).toBeNull();

      await connecter(page, presidente.email, presidente.motDePasse);
      await expect(page).toHaveURL(/\/ville$/, { timeout: 40_000 });

      await page.goto("/pays");
      await expect(page.getByRole("heading", { name: "Mexique" })).toBeVisible({ timeout: 20_000 });

      // Vote pour/contre sur la décision diplomatique.
      await expect(page.getByText("Rivalité · Argentine")).toBeVisible({ timeout: 20_000 });
      await page.getByRole("button", { name: "Pour", exact: true }).click();
      await expect(page.getByText("Tu as voté")).toBeVisible({ timeout: 20_000 });

      // Conflit en cours, effort affiché automatiquement (aucune action
      // citoyenne à cliquer — voir docs/A-INTEGRER.md §12).
      await expect(page.getByText("Mexique contre Argentine")).toBeVisible();
      await expect(page.getByText("Effort de l'attaquant")).toBeVisible();
      await expect(page.getByText("Effort du défenseur")).toBeVisible();
    } finally {
      await supprimerCompte(presidente.userId);
      // Même raison qu'ailleurs : la ligne "conflit en_cours" ne
      // s'efface pas toute seule, elle bloquerait la contrainte unique
      // conflits_paire_active_unique à un prochain re-run.
      await supabaseAdmin.from("conflits").delete().eq("pays_attaquant_id", "MX").eq("pays_defenseur_id", "AR");
      await supabaseAdmin.from("votes_diplomatie").delete().eq("country_id", "MX");
      await supabaseAdmin.from("propositions_diplomatiques").delete().eq("country_id", "MX");
    }
  });
});
