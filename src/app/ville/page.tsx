import { redirect } from "next/navigation";
import { getLocale, traduire } from "@/lib/i18n";
import { libelleNiveau } from "@/lib/game/niveauVille";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { VilleScene } from "@/components/VilleScene";

// Repli si le pays de la ville n'a pas encore de géo/fuseau renseignés
// (quelques territoires ISO 3166-1 sur 250 — voir DECISIONS.md §4,
// Jalon 6). Mêmes valeurs que le prototype par défaut (France).
const PAYS_PAR_DEFAUT = { latitude: 46.6, longitude: 2.35, fuseauHoraire: "Europe/Paris" };

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
    id: string;
    nom: string;
    population: number;
    population_max: number;
    influence: number;
    activite: number;
    niveau: number;
    pays:
      | { nom: string; latitude: number | null; longitude: number | null; fuseau_horaire: string | null }
      | { nom: string; latitude: number | null; longitude: number | null; fuseau_horaire: string | null }[]
      | null;
  };

  const colonneNomPays = locale === "fr" ? "nom_fr" : "nom_en";
  const { data } = await supabase
    .from("cities")
    .select(
      `id, nom, population, population_max, influence, activite, niveau, pays:countries(nom:${colonneNomPays}, latitude, longitude, fuseau_horaire)`
    )
    .eq("owner_id", user.id)
    .maybeSingle();
  const ville = data as LigneVille | null;

  if (!ville) {
    redirect("/ville/creer");
  }

  const paysBrut = Array.isArray(ville.pays) ? ville.pays[0] : ville.pays;
  const nomPays = paysBrut?.nom;
  const pays =
    paysBrut?.latitude != null && paysBrut?.longitude != null && paysBrut?.fuseau_horaire
      ? { latitude: paysBrut.latitude, longitude: paysBrut.longitude, fuseauHoraire: paysBrut.fuseau_horaire }
      : PAYS_PAR_DEFAUT;

  const stats: Array<{ cle: "ville.population" | "ville.influence" | "ville.activite"; valeur: number }> = [
    { cle: "ville.population", valeur: ville.population },
    { cle: "ville.influence", valeur: ville.influence },
    { cle: "ville.activite", valeur: ville.activite },
  ];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">{ville.nom}</h1>
        <p className="text-sm text-gray-500">
          {traduire(locale, "ville.pays")} : {nomPays} —{" "}
          {traduire(locale, "ville.niveau")} : {libelleNiveau(ville.niveau, locale)}
        </p>
      </div>
      <div className="aspect-video w-full overflow-hidden rounded border border-gray-200 bg-slate-900">
        <VilleScene seed={ville.id} populationMax={ville.population_max} pays={pays} />
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
