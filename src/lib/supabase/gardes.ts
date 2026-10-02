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
  // Les deux lectures sont indépendantes : lancées ensemble (un aller-retour
  // Supabase au lieu de deux). La priorité des redirections reste la même.
  const [{ data }, { data: profil }] = await Promise.all([
    supabase.from("cities").select("region_id, nom_a_changer").eq("owner_id", userId).maybeSingle(),
    supabase.from("users").select("pseudo_a_changer").eq("id", userId).maybeSingle(),
  ]);
  if (data && data.region_id === null) {
    redirect("/ville/region");
  }
  // Doublon de nom détecté par la migration 0035 (docs/A-INTEGRER.md §8) :
  // même écran de rattrapage que pour la région, mais pour le nom de la
  // ville ou le pseudo.
  if (data?.nom_a_changer === true || profil?.pseudo_a_changer === true) {
    redirect("/ville/noms");
  }
}
