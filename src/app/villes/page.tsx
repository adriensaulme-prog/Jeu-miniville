import { redirect } from "next/navigation";
import { getLocale, traduire } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { visiterVille } from "./actions";

export default async function VillesPage() {
  const locale = await getLocale();
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: profil } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profil) {
    redirect("/ville/creer");
  }

  type LigneVille = {
    id: string;
    nom: string;
    population: number;
    pays: { nom: string } | { nom: string }[] | null;
  };

  const colonneNomPays = locale === "fr" ? "nom_fr" : "nom_en";
  const { data } = await supabase
    .from("cities")
    .select(`id, nom, population, pays:countries(nom:${colonneNomPays})`)
    .neq("owner_id", user.id)
    .order("population", { ascending: false });
  const villes = (data ?? []) as LigneVille[];

  const aujourdhui = new Date().toISOString().slice(0, 10);
  const { data: visitesDuJour } = await supabase
    .from("visites")
    .select("ville_id")
    .eq("visiteur_id", user.id)
    .eq("jour", aujourdhui);
  const villesDejaVisitees = new Set((visitesDuJour ?? []).map((v) => v.ville_id));

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">{traduire(locale, "villes.titre")}</h1>
        <p className="text-sm text-gray-600">{traduire(locale, "villes.introduction")}</p>
      </div>

      {villes.length === 0 ? (
        <p className="text-sm text-gray-500">
          {traduire(locale, "villes.aucuneAutreVille")}
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
              <th className="py-2">{traduire(locale, "villes.nom")}</th>
              <th className="py-2">{traduire(locale, "villes.pays")}</th>
              <th className="py-2">{traduire(locale, "villes.population")}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {villes.map((ville) => {
              const nomPays = Array.isArray(ville.pays) ? ville.pays[0]?.nom : ville.pays?.nom;
              const dejaVisitee = villesDejaVisitees.has(ville.id);
              return (
                <tr key={ville.id} className="border-b border-gray-100">
                  <td className="py-2 font-medium">{ville.nom}</td>
                  <td className="py-2 text-gray-600">{nomPays}</td>
                  <td className="py-2 text-gray-600">{ville.population}</td>
                  <td className="py-2 text-right">
                    {dejaVisitee ? (
                      <span className="text-xs text-gray-400">
                        {traduire(locale, "villes.dejaVisitee")}
                      </span>
                    ) : (
                      <form action={visiterVille}>
                        <input type="hidden" name="villeId" value={ville.id} />
                        <button
                          type="submit"
                          className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                        >
                          {traduire(locale, "villes.visiter")}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
