"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { validerNomVille, validerPseudo } from "@/lib/game/nomsUniques";

export type EtatRenommage = { erreur: string } | null;

/**
 * Écran de rattrapage (docs/A-INTEGRER.md §8) : le joueur dont le pseudo
 * et/ou le nom de ville en doublon a été marqué par la migration 0035
 * en choisit de nouveaux. Seuls les champs présents dans le formulaire
 * (donc ceux qui sont réellement à changer) sont traités.
 */
export async function renommer(_etat: EtatRenommage, formData: FormData): Promise<EtatRenommage> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const pseudo = formData.get("pseudo");
  const nomVille = formData.get("nomVille");

  if (typeof pseudo === "string") {
    const erreur = validerPseudo(pseudo);
    if (erreur) return { erreur: `nom.erreur.${erreur}` };
  }
  if (typeof nomVille === "string") {
    const erreur = validerNomVille(nomVille);
    if (erreur) return { erreur: `nom.erreur.${erreur}` };
  }

  if (typeof pseudo === "string") {
    const { error } = await supabaseAdmin.rpc("renommer_pseudo", { p_user_id: user.id, p_pseudo: pseudo.trim() });
    if (error) return { erreur: error.code === "P0027" ? "nom.erreur.pseudoPris" : "noms.erreurGenerique" };
  }
  if (typeof nomVille === "string") {
    const { error } = await supabaseAdmin.rpc("renommer_ville", { p_owner_id: user.id, p_nom: nomVille.trim() });
    if (error) return { erreur: error.code === "P0028" ? "nom.erreur.villePris" : "noms.erreurGenerique" };
  }

  redirect("/ville");
}
