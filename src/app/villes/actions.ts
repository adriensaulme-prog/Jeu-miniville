"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Visite une autre ville : +1 population, jusqu'à 3 fois par jour et
 * par (visiteur, ville), avec un délai minimum d'une heure entre deux
 * visites de la même ville. Toute la logique — y compris l'interdiction
 * de se visiter soi-même, le délai et le plafond quotidien — vit dans
 * la fonction SQL visiter_ville() (Jalon 13 bis, docs/DECISIONS.md §4 ;
 * déviation assumée du cahier des charges §3/§26, demandée par Adrien).
 * Cette action ne fait que l'appeler et rafraîchir la page.
 */
export async function visiterVille(formData: FormData) {
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

  const { error } = await supabaseAdmin.rpc("visiter_ville", {
    p_visiteur_id: user.id,
    p_ville_id: villeId,
  });

  // P0018 (délai d'une heure non écoulé) et P0019 (plafond quotidien de
  // 3 visites atteint) : pas de vraies erreurs, l'affichage se corrige
  // tout seul au revalidate ci-dessous (compte à rebours ou compteur).
  if (error && !["P0018", "P0019"].includes(error.code ?? "")) {
    console.error("visiterVille a échoué :", error.message);
  }

  revalidatePath("/villes");
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

  // 23505 (déjà influencée aujourd'hui), P0001 (quota de 5 atteint) et
  // P0002 (ville en grève, Jalon 4) : pas de vraies erreurs, l'affichage
  // se corrige au revalidate.
  if (error && !["23505", "P0001", "P0002"].includes(error.code ?? "")) {
    console.error("influencerVille a échoué :", error.message);
  }

  revalidatePath("/villes");
}

export type EtatActionAntiVille =
  | { statut: "succes"; effetReduit: boolean }
  | { statut: "protection" }
  | { statut: "quota" }
  | { statut: "erreur" }
  | null;

const TYPES_ACTION_ANTIVILLE = ["greve", "contamination", "propagande"] as const;

/**
 * Lance une action AntiVille (grève, contamination ou propagande)
 * contre une autre ville. Toute la logique — quota quotidien, blocage
 * par la protection anti-harcèlement, calcul de l'effet — vit dans la
 * fonction SQL lancer_action_antiville() (docs/DECISIONS.md §4, Jalon
 * 4). Contrairement à visiterVille/influencerVille, le résultat est
 * affiché explicitement (pas silencieusement absorbé) : se faire
 * bloquer par la protection ou le quota est un événement normal du jeu
 * que le joueur doit voir, pas une erreur à cacher.
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

  if (error) {
    if (error.code === "P0003") {
      return { statut: "protection" };
    }
    if (error.code === "P0001") {
      return { statut: "quota" };
    }
    console.error("lancerActionAntiVille a échoué :", error.message);
    return { statut: "erreur" };
  }

  const effetReduit = Boolean((data as { effet_reduit?: boolean } | null)?.effet_reduit);
  return { statut: "succes", effetReduit };
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
