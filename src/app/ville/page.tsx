import { redirect } from "next/navigation";
import { getLocale, traduire } from "@/lib/i18n";
import { libelleNiveau } from "@/lib/game/niveauVille";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export default async function VillePage() {
  const locale = await getLocale();
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  // Déclenche le bonus quotidien de jumelage (idempotent) avant de lire
  // les statistiques, pour que cette page affiche un bonus fraîchement
  // accordé sans attendre un passage par /jumelages — voir
  // reclamer_bonus_jumelages() (Jalon 5, docs/DECISIONS.md §4).
  await supabaseAdmin.rpc("reclamer_bonus_jumelages", { p_joueur_id: user.id });

  type LigneVille = {
    nom: string;
    population: number;
    influence: number;
    activite: number;
    niveau: number;
    pays: { nom: string } | { nom: string }[] | null;
  };

  const colonneNomPays = locale === "fr" ? "nom_fr" : "nom_en";
  const { data } = await supabase
    .from("cities")
    .select(`nom, population, influence, activite, niveau, pays:countries(nom:${colonneNomPays})`)
    .eq("owner_id", user.id)
    .maybeSingle();
  const ville = data as LigneVille | null;

  if (!ville) {
    redirect("/ville/creer");
  }

  const nomPays = Array.isArray(ville.pays) ? ville.pays[0]?.nom : ville.pays?.nom;

  const stats: Array<{ cle: "ville.population" | "ville.influence" | "ville.activite"; valeur: number }> = [
    { cle: "ville.population", valeur: ville.population },
    { cle: "ville.influence", valeur: ville.influence },
    { cle: "ville.activite", valeur: ville.activite },
  ];

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">{ville.nom}</h1>
        <p className="text-sm text-gray-500">
          {traduire(locale, "ville.pays")} : {nomPays} —{" "}
          {traduire(locale, "ville.niveau")} : {libelleNiveau(ville.niveau, locale)}
        </p>
      </div>
      <dl className="grid grid-cols-3 gap-4 text-center">
        {stats.map(({ cle, valeur }) => (
          <div key={cle} className="rounded border border-gray-200 p-4">
            <dt className="text-xs uppercase text-gray-500">{traduire(locale, cle)}</dt>
            <dd className="text-2xl font-semibold">{valeur}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
