import { redirect } from "next/navigation";
import { getLocale, traduire } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { ActionsAntiVille } from "./ActionsAntiVille";
import { influencerVille, visiterVille } from "./actions";

const QUOTA_INFLUENCE_QUOTIDIEN = 5;
const QUOTA_ANTIVILLE_QUOTIDIEN = 3;
const SEUIL_PROTECTION_ANTIVILLE = 2; // actions récentes (24h) contre une cible avant blocage

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
    influence: number;
    greve_jusqua: string | null;
    pays: { nom: string } | { nom: string }[] | null;
  };

  const colonneNomPays = locale === "fr" ? "nom_fr" : "nom_en";
  const { data } = await supabase
    .from("cities")
    .select(
      `id, nom, population, influence, greve_jusqua, pays:countries(nom:${colonneNomPays})`
    )
    .neq("owner_id", user.id)
    .order("population", { ascending: false });
  const villes = (data ?? []) as LigneVille[];

  const maintenant = new Date();
  const aujourdhui = maintenant.toISOString().slice(0, 10);
  const il24hEnArriere = new Date(maintenant.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const { data: visitesDuJour } = await supabase
    .from("visites")
    .select("ville_id")
    .eq("visiteur_id", user.id)
    .eq("jour", aujourdhui);
  const villesDejaVisitees = new Set((visitesDuJour ?? []).map((v) => v.ville_id));

  const { data: actionsInfluenceDuJour } = await supabase
    .from("actions_influence")
    .select("ville_id")
    .eq("joueur_id", user.id)
    .eq("jour", aujourdhui);
  const villesDejaInfluencees = new Set(
    (actionsInfluenceDuJour ?? []).map((a) => a.ville_id)
  );
  const actionsInfluenceRestantes =
    QUOTA_INFLUENCE_QUOTIDIEN - villesDejaInfluencees.size;

  const { data: actionsAntiVilleAujourdhui } = await supabase
    .from("actions_antiville")
    .select("ville_id")
    .eq("attaquant_id", user.id)
    .eq("jour", aujourdhui);
  const quotaAntiVilleAtteint =
    (actionsAntiVilleAujourdhui ?? []).length >= QUOTA_ANTIVILLE_QUOTIDIEN;

  const { data: actionsAntiVilleRecentes } = await supabase
    .from("actions_antiville")
    .select("ville_id")
    .eq("attaquant_id", user.id)
    .gte("created_at", il24hEnArriere);
  const nbActionsRecentesParVille = new Map<string, number>();
  for (const action of actionsAntiVilleRecentes ?? []) {
    nbActionsRecentesParVille.set(
      action.ville_id,
      (nbActionsRecentesParVille.get(action.ville_id) ?? 0) + 1
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">{traduire(locale, "villes.titre")}</h1>
        <p className="text-sm text-gray-600">{traduire(locale, "villes.introduction")}</p>
        <p className="mt-1 text-sm text-gray-600">
          {traduire(locale, "villes.actionsRestantes")} {actionsInfluenceRestantes}/
          {QUOTA_INFLUENCE_QUOTIDIEN}
        </p>
      </div>

      {villes.length === 0 ? (
        <p className="text-sm text-gray-500">
          {traduire(locale, "villes.aucuneAutreVille")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="py-2">{traduire(locale, "villes.nom")}</th>
                <th className="py-2">{traduire(locale, "villes.pays")}</th>
                <th className="py-2">{traduire(locale, "villes.population")}</th>
                <th className="py-2">{traduire(locale, "ville.influence")}</th>
                <th className="py-2" />
                <th className="py-2" />
                <th className="py-2 text-right">{traduire(locale, "villes.antiVille")}</th>
              </tr>
            </thead>
            <tbody>
              {villes.map((ville) => {
                const nomPays = Array.isArray(ville.pays) ? ville.pays[0]?.nom : ville.pays?.nom;
                const dejaVisitee = villesDejaVisitees.has(ville.id);
                const dejaInfluencee = villesDejaInfluencees.has(ville.id);
                const estEnGreve = !!ville.greve_jusqua && new Date(ville.greve_jusqua) > maintenant;
                const protectionActive =
                  (nbActionsRecentesParVille.get(ville.id) ?? 0) >= SEUIL_PROTECTION_ANTIVILLE;
                return (
                  <tr key={ville.id} className="border-b border-gray-100">
                    <td className="py-2 font-medium">
                      {ville.nom}
                      {estEnGreve ? (
                        <span className="ml-2 rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">
                          {traduire(locale, "villes.enGreve")}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 text-gray-600">{nomPays}</td>
                    <td className="py-2 text-gray-600">{ville.population}</td>
                    <td className="py-2 text-gray-600">{ville.influence}</td>
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
                    <td className="py-2 text-right">
                      {dejaInfluencee ? (
                        <span className="text-xs text-gray-400">
                          {traduire(locale, "villes.dejaInfluencee")}
                        </span>
                      ) : actionsInfluenceRestantes <= 0 ? (
                        <span className="text-xs text-gray-400">
                          {traduire(locale, "villes.quotaAtteint")}
                        </span>
                      ) : (
                        <form action={influencerVille}>
                          <input type="hidden" name="villeId" value={ville.id} />
                          <button
                            type="submit"
                            className="rounded bg-purple-600 px-3 py-1 text-xs text-white hover:bg-purple-700"
                          >
                            {traduire(locale, "villes.influencer")}
                          </button>
                        </form>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <ActionsAntiVille
                        locale={locale}
                        villeId={ville.id}
                        protectionActive={protectionActive}
                        quotaAtteint={quotaAntiVilleAtteint}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
