import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PAGES_PROTEGEES = ["/ville", "/villes", "/jumelages"];

/**
 * Rafraîchit le cookie de session Supabase à chaque requête (pattern
 * recommandé par Supabase pour Next.js App Router — sans ça, un jeton
 * expiré resterait dans les cookies jusqu'à l'appel client suivant) et
 * protège les pages qui exigent d'être connecté.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const estProtegee = PAGES_PROTEGEES.some((chemin) =>
    request.nextUrl.pathname.startsWith(chemin)
  );

  if (!user && estProtegee) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("redirection", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
