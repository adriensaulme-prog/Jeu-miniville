import Link from "next/link";
import { getLocale, traduire } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";

export default async function Home() {
  const locale = await getLocale();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold text-blue-600">
        {traduire(locale, "accueil.titre")}{" "}
        <span className="text-base font-normal text-gray-500">
          {traduire(locale, "accueil.nomProvisoire")}
        </span>
      </h1>
      <p className="max-w-md text-gray-600">{traduire(locale, "accueil.description")}</p>

      {user ? (
        <Link
          href="/ville"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {traduire(locale, "accueil.voirMaVille")}
        </Link>
      ) : (
        <div className="flex gap-3">
          <Link
            href="/inscription"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {traduire(locale, "accueil.creerCompte")}
          </Link>
          <Link
            href="/connexion"
            className="rounded border border-blue-600 px-4 py-2 text-blue-600 hover:bg-blue-50"
          >
            {traduire(locale, "accueil.seConnecter")}
          </Link>
        </div>
      )}
    </main>
  );
}
