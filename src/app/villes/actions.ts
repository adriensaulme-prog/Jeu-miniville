"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Visite une autre ville : +1 population, une fois par (visiteur,
 * ville, jour). Toute la logique — y compris l'interdiction de se
 * visiter soi-même et l'anti-abus quotidien — vit dans la fonction SQL
 * visiter_ville() (anti-triche, docs/DECISIONS.md §1 point 2), jamais
 * ici : cette action ne fait que l'appeler et rafraîchir la page.
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

  // 23505 (unique_violation) = déjà visitée aujourd'hui : pas une
  // vraie erreur, l'affichage se corrige tout seul au revalidate
  // ci-dessous (le bouton "Visiter" disparaît pour cette ville).
  if (error && error.code !== "23505") {
    console.error("visiterVille a échoué :", error.message);
  }

  revalidatePath("/villes");
}
