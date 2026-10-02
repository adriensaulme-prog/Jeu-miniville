"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { validerNomVille, validerPseudo } from "@/lib/game/nomsUniques";

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
  const regionId = String(formData.get("regionId") ?? "").trim();

  if (!pseudo || !nomVille || !countryId || !regionId) {
    return { erreur: "creationVille.erreurChamps" };
  }

  // Règles de format (longueur, noms réservés, mots interdits) : voir
  // src/lib/game/nomsUniques.ts. L'unicité, elle, est garantie par la base.
  const erreurFormat = validerPseudo(pseudo) ?? validerNomVille(nomVille);
  if (erreurFormat) {
    return { erreur: `nom.erreur.${erreurFormat}` };
  }

  const { error } = await supabaseAdmin.rpc("creer_ville", {
    p_owner_id: user.id,
    p_pseudo: pseudo,
    p_country_id: countryId,
    p_nom_ville: nomVille,
    p_region_id: regionId,
  });

  if (error) {
    // Un compte qui a déjà un profil (double soumission, retour en
    // arrière) : pas une vraie erreur pour le joueur, direction sa ville.
    if (error.code === "23505") {
      redirect("/ville");
    }
    if (error.code === "P0027") return { erreur: "nom.erreur.pseudoPris" };
    if (error.code === "P0028") return { erreur: "nom.erreur.villePris" };
    return { erreur: "creationVille.erreurGenerique" };
  }

  redirect("/ville");
}
