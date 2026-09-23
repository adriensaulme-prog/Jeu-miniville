import Link from "next/link";
import { getLocale, traduire } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { deconnexion } from "@/lib/supabase/auth-actions";
import { LangSwitcher } from "./LangSwitcher";

export async function Nav() {
  const locale = await getLocale();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3 sm:px-8">
      <Link href="/" className="text-sm font-semibold text-blue-600">
        jeu_miniville
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/ville" className="text-gray-600 hover:text-gray-900">
              {traduire(locale, "nav.maVille")}
            </Link>
            <Link href="/villes" className="text-gray-600 hover:text-gray-900">
              {traduire(locale, "nav.villes")}
            </Link>
          </nav>
        ) : null}
        <LangSwitcher locale={locale} />
        {user ? (
          <form action={deconnexion}>
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              {traduire(locale, "nav.seDeconnecter")}
            </button>
          </form>
        ) : null}
      </div>
    </header>
  );
}
