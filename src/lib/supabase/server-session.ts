import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase côté serveur, lié à la session du visiteur (cookies),
 * clé "anon" — donc soumis à Row Level Security, contrairement à
 * server.ts (service_role, anti-triche, voir son commentaire). Sert à
 * savoir "qui est connecté", jamais à écrire une donnée de jeu sensible.
 *
 * Utilisable dans un composant serveur (lecture seule des cookies :
 * l'écriture échoue silencieusement, c'est le middleware qui rafraîchit
 * la session) ou une action serveur (lecture + écriture).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Appelé depuis un composant serveur (lecture seule) : sans
            // effet, le middleware se charge du rafraîchissement.
          }
        },
      },
    }
  );
}
