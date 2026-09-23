import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase côté serveur uniquement (route handlers, server
 * actions, Edge Functions). Porte la clé service_role : elle contourne
 * Row Level Security, donc toute règle du jeu qui doit être infalsifiable
 * (population, influence, résultats de vote/guerre — cahier des charges
 * §26 Anti-triche) passe par ce client, jamais par celui du navigateur.
 *
 * Le paquet "server-only" fait échouer le build si ce fichier est
 * importé par erreur depuis du code client.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);
