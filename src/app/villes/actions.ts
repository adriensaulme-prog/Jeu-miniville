"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Activite } from "@/lib/game/activites";
import { PALIERS_ATTAQUES, type PalierAttaques } from "@/lib/game/antiville";

/**
 * Visite une ville (la sienne comprise depuis le Jalon 13 ter) : +1
 * population, jusqu'à 3 fois par jour et par (visiteur, ville), avec un
 * délai minimum d'une heure entre deux visites de la même ville. Toute
 * la logique — délai, plafond quotidien — vit dans la fonction SQL
 * visiter_ville() (Jalon 13 ter, docs/DECISIONS.md §4 ; déviations
 * assumées du cahier des charges §3/§26, demandées par Adrien).
 *
 * Appelée directement (pas via `<form action={...}>`) par
 * `VisiteAutomatique` (docs/A-INTEGRER.md §15) : ouvrir la page d'une
 * ville déclenche la visite toute seule après un court délai, plus
 * besoin de cliquer un bouton "Visiter".
 */
export async function visiterVille(villeId: string): Promise<{ succes: boolean; gain: number }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data, error } = await supabaseAdmin.rpc("visiter_ville", {
    p_visiteur_id: user.id,
    p_ville_id: villeId,
  });

  // P0018 (délai d'une heure non écoulé) et P0019 (plafond quotidien de
  // 3 visites atteint) : pas de vraies erreurs, l'affichage se corrige
  // tout seul au revalidate ci-dessous (compte à rebours ou compteur) —
  // en pratique jamais atteints ici puisque VisiteAutomatique ne
  // déclenche l'appel que lorsque la page a déjà déterminé que la
  // visite est possible, mais la fonction SQL reste la seule autorité.
  if (error && !["P0018", "P0019"].includes(error.code ?? "")) {
    console.error("visiterVille a échoué :", error.message);
  }

  revalidatePath("/villes");
  revalidatePath("/ville");

  // Jalon 18 : le gain n'est plus garanti (crise du Résidentiel) — le
  // vrai chiffre vient de visiter_ville() elle-même, jamais reconstitué
  // côté client.
  const gain = typeof (data as { gain?: number } | null)?.gain === "number" ? (data as { gain: number }).gain : 0;
  return { succes: !error, gain };
}

/**
 * Choisit l'activité d'une visite (Jalon 17, docs/SYSTEME-DEVELOPPEMENT.md
 * §9 point 1) : remplace l'activité tirée au sort par visiter_ville()
 * sur la toute dernière visite du joueur pour cette ville, dans les
 * 5 minutes qui suivent (choisir_activite_visite(), anti-triche côté
 * SQL). Adrien, 27/09/2026 : la visite elle-même reste automatique
 * pour la population, ce choix est une action séparée et facultative.
 */
export async function choisirActiviteVisite(villeId: string, activite: Activite): Promise<{ succes: boolean }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { error } = await supabaseAdmin.rpc("choisir_activite_visite", {
    p_visiteur_id: user.id,
    p_ville_id: villeId,
    p_activite: activite,
  });

  if (error) {
    console.error("choisirActiviteVisite a échoué :", error.message);
  }

  revalidatePath("/villes");
  revalidatePath("/ville");

  return { succes: !error };
}

/**
 * Le maire choisit l'activité recommandée aux visiteurs (ou l'efface),
 * via definir_recommandation() — seul le propriétaire de la ville peut
 * l'appeler avec effet (vérifié côté SQL).
 */
export async function definirRecommandation(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const villeId = String(formData.get("villeId") ?? "");
  if (!villeId) {
    return;
  }
  const activiteBrute = String(formData.get("activite") ?? "");
  const activite = activiteBrute === "" ? null : activiteBrute;

  const { error } = await supabaseAdmin.rpc("definir_recommandation", {
    p_owner_id: user.id,
    p_ville_id: villeId,
    p_activite: activite,
  });

  if (error) {
    console.error("definirRecommandation a échoué :", error.message);
  }

  revalidatePath("/ville");
  revalidatePath("/villes");
}

/**
 * Le maire choisit le thème visuel de sa ville (bibliothèque de
 * bâtiments 4/4, docs/BATIMENTS-ET-PACKS.md §4) — purement cosmétique,
 * réservé au propriétaire (definir_theme_ville(), anti-triche côté
 * SQL). Pas de restriction de paiement pour l'instant : la boutique
 * n'existe pas encore (docs/DECISIONS.md §4, journal de ce jalon).
 */
export async function definirTheme(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const villeId = String(formData.get("villeId") ?? "");
  const theme = String(formData.get("theme") ?? "");
  if (!villeId || !theme) {
    return;
  }

  const { error } = await supabaseAdmin.rpc("definir_theme_ville", {
    p_owner_id: user.id,
    p_ville_id: villeId,
    p_theme: theme,
  });

  if (error) {
    console.error("definirTheme a échoué :", error.message);
  }

  revalidatePath("/ville");
  revalidatePath("/villes");
}

/**
 * Le maire choisit un mégaprojet parmi les options du palier tout
 * juste débloqué (docs/SYSTEME-DEVELOPPEMENT.md §6, Jalon 20 1/3) —
 * réservé au propriétaire de la ville, un seul choix par palier,
 * jamais modifiable ensuite (choisir_megaprojet(), anti-triche côté
 * SQL).
 */
export async function choisirMegaprojet(
  villeId: string,
  palier: number,
  type: string
): Promise<{ succes: boolean }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { error } = await supabaseAdmin.rpc("choisir_megaprojet", {
    p_owner_id: user.id,
    p_ville_id: villeId,
    p_palier: palier,
    p_type: type,
  });

  if (error) {
    console.error("choisirMegaprojet a échoué :", error.message);
  }

  revalidatePath("/ville");
  revalidatePath("/villes");

  return { succes: !error };
}

/**
 * Influence une autre ville : +1 influence, au plus une fois par
 * (joueur, ville, jour) et au plus 5 fois par (joueur, jour) tous
 * cibles confondues. Comme visiterVille, toute la logique vit dans la
 * fonction SQL influencer_ville() — cette action ne fait que l'appeler
 * et rafraîchir la page.
 */
export async function influencerVille(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const villeId = String(formData.get("villeId") ?? "");
  if (!villeId) {
    return;
  }

  const { error } = await supabaseAdmin.rpc("influencer_ville", {
    p_joueur_id: user.id,
    p_ville_id: villeId,
  });

  // 23505 (déjà influencée aujourd'hui), P0001 (quota de 5 atteint),
  // P0002 (ville en grève, Jalon 4) et P0020 (deux actions trop
  // rapprochées, Jalon 14 — normalement jamais atteint par un humain,
  // seulement par un double-submit ou un script) : pas de vraies
  // erreurs, l'affichage se corrige au revalidate.
  if (error && !["23505", "P0001", "P0002", "P0020"].includes(error.code ?? "")) {
    console.error("influencerVille a échoué :", error.message);
  }

  revalidatePath("/villes");
}

export type EtatActionAntiVille =
  | {
      statut: "succes";
      palier: PalierAttaques;
      perte: number | null;
      dureeHeures: number | null;
      /** A-INTEGRER §34 : la visite comptée dans la minute précédente a été annulée. */
      visiteAnnulee: boolean;
    }
  | { statut: "quota" }
  | { statut: "erreur" }
  | null;

const TYPES_ACTION_ANTIVILLE = ["greve", "contamination", "propagande"] as const;

/**
 * Lance une action AntiVille (grève, contamination ou propagande)
 * contre une autre ville. Toute la logique — quota quotidien, paliers
 * cumulés, défense selon les jauges — vit dans la fonction SQL
 * lancer_action_antiville() (docs/DECISIONS.md §4, Jalons 4 et 18).
 * Contrairement à visiterVille/influencerVille, le résultat est
 * affiché explicitement (pas silencieusement absorbé) : le joueur doit
 * voir l'effet réel de son action (réduit par la défense, plafonné...).
 *
 * Jalon 18 : l'ancienne "protection anti-harcèlement" (statut
 * "protection", code P0003) est retirée — remplacée par le système de
 * paliers cumulés par ville (voir la migration 0024).
 */
export async function lancerActionAntiVille(
  _etatPrecedent: EtatActionAntiVille,
  formData: FormData
): Promise<EtatActionAntiVille> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const villeId = String(formData.get("villeId") ?? "");
  const typeAction = String(formData.get("typeAction") ?? "");
  if (
    !villeId ||
    !(TYPES_ACTION_ANTIVILLE as readonly string[]).includes(typeAction)
  ) {
    return { statut: "erreur" };
  }

  const { data, error } = await supabaseAdmin.rpc("lancer_action_antiville", {
    p_attaquant_id: user.id,
    p_ville_id: villeId,
    p_type_action: typeAction,
  });

  revalidatePath("/villes");
  revalidatePath("/ville");

  if (error) {
    if (error.code === "P0001") {
      return { statut: "quota" };
    }
    console.error("lancerActionAntiVille a échoué :", error.message);
    return { statut: "erreur" };
  }

  const resultat = data as {
    palier?: string;
    perte?: number | null;
    duree_heures?: number | null;
    visite_annulee?: boolean;
  } | null;
  const palier = PALIERS_ATTAQUES.includes(resultat?.palier as PalierAttaques)
    ? (resultat!.palier as PalierAttaques)
    : "calme";
  return {
    statut: "succes",
    palier,
    perte: resultat?.perte ?? null,
    dureeHeures: resultat?.duree_heures ?? null,
    visiteAnnulee: resultat?.visite_annulee === true,
  };
}

/**
 * Propose un jumelage entre sa ville et une autre. Toute la logique —
 * résolution de "sa" ville, quota de 3 jumelages actifs, interdiction
 * d'une deuxième proposition vers une ville déjà en attente/jumelée —
 * vit dans la fonction SQL proposer_jumelage() (docs/DECISIONS.md §4,
 * Jalon 5).
 */
export async function proposerJumelage(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const villeId = String(formData.get("villeId") ?? "");
  if (!villeId) {
    return;
  }

  const { error } = await supabaseAdmin.rpc("proposer_jumelage", {
    p_proposant_id: user.id,
    p_ville_ciblee_id: villeId,
  });

  // 23505 (déjà en_attente/actif avec cette ville) et P0008 (quota de
  // 3 atteint) : pas de vraies erreurs, l'affichage se corrige au
  // revalidate ci-dessous.
  if (error && !["23505", "P0008"].includes(error.code ?? "")) {
    console.error("proposerJumelage a échoué :", error.message);
  }

  revalidatePath("/villes");
}
