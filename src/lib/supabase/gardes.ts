import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Garde-fou commun aux pages du jeu (Ma ville, Villes, Jumelages,
 * Classement) : une ville créée avant le Jalon 8 n'a pas encore de
 * région (`region_id` nul, CLASSEMENTS.md §1) — redirige vers l'écran
 * dédié tant que le choix n'est pas fait, comme /ville/creer le fait
 * déjà pour un profil sans ville. À appeler après avoir vérifié que le
 * profil existe.
 */
export async function exigerRegionChoisie(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data } = await supabase.from("cities").select("region_id").eq("owner_id", userId).maybeSingle();
  if (data && data.region_id === null) {
    redirect("/ville/region");
  }
}
