import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase côté navigateur. Utilise la clé publique "anon" —
 * les règles de sécurité (Row Level Security) sont ce qui protège les
 * données, pas le secret de cette clé.
 *
 * createBrowserClient (paquet @supabase/ssr), pas le createClient brut
 * de @supabase/supabase-js : la session doit être écrite dans un cookie
 * (pas seulement localStorage) pour que le serveur (middleware,
 * composants et actions serveur — voir server-session.ts) sache "qui
 * est connecté" après un signIn fait ici.
 *
 * Ne jamais importer server.ts depuis un composant client, et
 * inversement : server.ts porte la clé service_role qui contourne RLS.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
