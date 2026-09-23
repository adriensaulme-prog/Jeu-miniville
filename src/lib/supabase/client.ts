import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase côté navigateur. Utilise la clé publique "anon" —
 * les règles de sécurité (Row Level Security) sont ce qui protège les
 * données, pas le secret de cette clé.
 *
 * Ne jamais importer server.ts depuis un composant client, et
 * inversement : server.ts porte la clé service_role qui contourne RLS.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
