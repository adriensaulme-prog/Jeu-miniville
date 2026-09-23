"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Accepte ou refuse une demande de jumelage reçue. Toute la logique —
 * vérifier que le joueur est bien la ville ciblée, revérifier le quota
 * de 3 jumelages actifs au moment d'accepter — vit dans la fonction SQL
 * repondre_jumelage() (docs/DECISIONS.md §4, Jalon 5).
 */
export async function repondreJumelage(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const jumelageId = String(formData.get("jumelageId") ?? "");
  const accepter = formData.get("accepter") === "true";
  if (!jumelageId) {
    return;
  }

  const { error } = await supabaseAdmin.rpc("repondre_jumelage", {
    p_joueur_id: user.id,
    p_jumelage_id: jumelageId,
    p_accepter: accepter,
  });

  if (error) {
    console.error("repondreJumelage a échoué :", error.message);
  }

  revalidatePath("/jumelages");
  revalidatePath("/villes");
}

/**
 * Annule un jumelage actif ou retire une proposition en attente — dans
 * les deux cas via annuler_jumelage() (SQL), qui vérifie que le joueur
 * fait bien partie de la relation.
 */
export async function annulerJumelage(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const jumelageId = String(formData.get("jumelageId") ?? "");
  if (!jumelageId) {
    return;
  }

  const { error } = await supabaseAdmin.rpc("annuler_jumelage", {
    p_joueur_id: user.id,
    p_jumelage_id: jumelageId,
  });

  if (error) {
    console.error("annulerJumelage a échoué :", error.message);
  }

  revalidatePath("/jumelages");
  revalidatePath("/villes");
}
