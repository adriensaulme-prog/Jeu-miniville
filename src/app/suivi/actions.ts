"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Suivre / ne plus suivre une ville (docs/A-INTEGRER.md §26 D). Même
 * schéma que les autres actions du jeu : l'identité vient de la session,
 * l'écriture passe par une fonction SQL `security definer` qui revérifie
 * tout (ville existante, pas la sienne, quota).
 */
async function utilisateur() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  return user;
}

function rafraichir(villeId: string) {
  revalidatePath("/suivi");
  revalidatePath("/villes");
  revalidatePath(`/v/${villeId}`);
}

export async function suivreVille(formData: FormData) {
  const user = await utilisateur();
  const villeId = String(formData.get("villeId") ?? "");
  if (!villeId) return;
  const { error } = await supabaseAdmin.rpc("suivre_ville", { p_joueur_id: user.id, p_ville_id: villeId });
  // P0029 (quota atteint), P0005 (sa propre ville), P0004 (ville disparue) :
  // pas de vraies erreurs, l'affichage se corrige à la revalidation.
  if (error && !["P0029", "P0005", "P0004"].includes(error.code ?? "")) {
    console.error("suivreVille a échoué :", error.message);
  }
  rafraichir(villeId);
}

export async function nePlusSuivreVille(formData: FormData) {
  const user = await utilisateur();
  const villeId = String(formData.get("villeId") ?? "");
  if (!villeId) return;
  const { error } = await supabaseAdmin.rpc("ne_plus_suivre_ville", { p_joueur_id: user.id, p_ville_id: villeId });
  if (error) console.error("nePlusSuivreVille a échoué :", error.message);
  rafraichir(villeId);
}
