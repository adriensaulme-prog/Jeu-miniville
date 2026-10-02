"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { validerNomVille, validerPseudo, type ErreurNom } from "@/lib/game/nomsUniques";

export type ResultatDisponibilite = { etat: "disponible" } | { etat: "pris" } | { etat: "invalide"; erreur: ErreurNom };

/**
 * « ✓ disponible / ✗ déjà pris » pendant la saisie (docs/A-INTEGRER.md
 * §8). Réservé aux comptes connectés (évite d'offrir un moteur de
 * recherche de pseudos au public). Informatif seulement : c'est l'index
 * unique de la base qui tranche au moment de valider.
 * `sauf` : on ignore le joueur lui-même (écran de rattrapage).
 */
export async function verifierDisponibilite(
  type: "pseudo" | "ville",
  nom: string,
  sauf = false
): Promise<ResultatDisponibilite> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { etat: "invalide", erreur: "nomVide" };

  const erreur = type === "pseudo" ? validerPseudo(nom) : validerNomVille(nom);
  if (erreur) return { etat: "invalide", erreur };

  const { data } = await supabaseAdmin.rpc("nom_disponible", {
    p_type: type,
    p_nom: nom,
    p_sauf_user_id: sauf ? user.id : null,
  });
  return data === true ? { etat: "disponible" } : { etat: "pris" };
}
