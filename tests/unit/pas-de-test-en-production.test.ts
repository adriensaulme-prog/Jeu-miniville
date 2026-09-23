import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

/**
 * Garde-fou "jamais en production" pour les villes de test
 * (docs/GUIDE-METHODE.md, section "Les villes de test"). Ignoré par
 * défaut — ce projet n'a qu'un seul environnement Supabase pour
 * l'instant (dev/recette), donc l'exécuter contre lui serait un faux
 * positif rassurant sans rien vérifier de réel.
 *
 * À exécuter explicitement contre l'environnement de production, une
 * fois qu'il existera et sera distinct de celui de dev/recette (voir
 * docs/DECISIONS.md §10, déploiement Vercel toujours en attente) :
 *
 *   VERIFIER_PROD=true npx vitest run tests/unit/pas-de-test-en-production.test.ts
 *
 * avec NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY pointant
 * vers le projet Supabase de production dans l'environnement d'exécution
 * (pas nécessairement .env.local).
 */
describe.skipIf(process.env.VERIFIER_PROD !== "true")(
  "aucune ville de test en production",
  () => {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    it("ne trouve aucune ville avec is_test = true", async () => {
      const { data, error } = await supabaseAdmin
        .from("cities")
        .select("id")
        .eq("is_test", true)
        .limit(1);
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it("ne trouve aucun profil avec is_test = true", async () => {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("is_test", true)
        .limit(1);
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
  }
);
