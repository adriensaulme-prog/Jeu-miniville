"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

const CATEGORIES_VOTE = ["industrie", "techno", "culture", "commerce"] as const;

/**
 * Vote hebdomadaire pour une catégorie de ressource. Toute la logique
 * (résolution du pays du joueur, un seul vote par joueur et par
 * semaine ISO) vit dans la fonction SQL voter_pays() (Jalon 10,
 * docs/DECISIONS.md §4) — cette action ne fait que l'appeler et
 * rafraîchir la page.
 */
export async function voterPays(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const categorie = String(formData.get("categorie") ?? "");
  if (!(CATEGORIES_VOTE as readonly string[]).includes(categorie)) {
    return;
  }

  const { error } = await supabaseAdmin.rpc("voter_pays", {
    p_joueur_id: user.id,
    p_categorie: categorie,
  });

  // 23505 (unique_violation) = déjà voté cette semaine : pas une vraie
  // erreur, l'affichage se corrige tout seul au revalidate ci-dessous.
  if (error && error.code !== "23505") {
    console.error("voterPays a échoué :", error.message);
  }

  revalidatePath("/pays");
}
