"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export type EtatDefinirRegion = { erreur: string } | null;

/**
 * Choix initial de région (villes créées avant le Jalon 8) ou changement
 * volontaire (délai de 30 jours vérifié côté serveur par
 * definir_region() — CLASSEMENTS.md §1, docs/DECISIONS.md §4).
 */
export async function definirRegion(
  _etatPrecedent: EtatDefinirRegion,
  formData: FormData
): Promise<EtatDefinirRegion> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const regionId = String(formData.get("regionId") ?? "").trim();
  if (!regionId) {
    return { erreur: "region.erreurGenerique" };
  }

  const { error } = await supabaseAdmin.rpc("definir_region", {
    p_owner_id: user.id,
    p_region_id: regionId,
  });

  if (error) {
    return { erreur: "region.erreurGenerique" };
  }

  redirect("/ville");
}
