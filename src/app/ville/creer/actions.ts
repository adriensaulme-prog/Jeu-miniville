"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export type EtatCreationVille = { erreur: string } | null;

/**
 * Crée le profil joueur et sa ville (cahier des charges §2 : "à la
 * création du compte, le joueur choisit le nom de sa ville et son
 * pays"). N'écrit jamais population/influence/activité/niveau depuis
 * une valeur envoyée par le client — creer_ville() les fixe elle-même
 * (docs/DECISIONS.md §1 point 2, anti-triche).
 */
export async function creerVille(
  _etatPrecedent: EtatCreationVille,
  formData: FormData
): Promise<EtatCreationVille> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const pseudo = String(formData.get("pseudo") ?? "").trim();
  const nomVille = String(formData.get("nomVille") ?? "").trim();
  const countryId = String(formData.get("countryId") ?? "").trim();

  if (!pseudo || !nomVille || !countryId) {
    return { erreur: "creationVille.erreurChamps" };
  }

  const { error } = await supabaseAdmin.rpc("creer_ville", {
    p_owner_id: user.id,
    p_pseudo: pseudo,
    p_country_id: countryId,
    p_nom_ville: nomVille,
  });

  if (error) {
    // Un compte qui a déjà un profil (double soumission, retour en
    // arrière) : pas une vraie erreur pour le joueur, direction sa ville.
    if (error.code === "23505") {
      redirect("/ville");
    }
    return { erreur: "creationVille.erreurGenerique" };
  }

  redirect("/ville");
}
