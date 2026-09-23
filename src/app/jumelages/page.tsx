import { redirect } from "next/navigation";
import { getLocale, traduire } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { annulerJumelage, repondreJumelage } from "./actions";

export default async function JumelagesPage() {
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
    .select("id, city_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profil) {
    redirect("/ville/creer");
  }
  const maVilleId = profil!.city_id as string;

  // Déclenche le bonus quotidien de jumelage (idempotent — voir
  // reclamer_bonus_jumelages()) avant de lire l'état, pour que le
  // rechargement de cette page montre immédiatement le résultat.
  const { data: resultatBonus } = await supabaseAdmin.rpc("reclamer_bonus_jumelages", {
    p_joueur_id: user.id,
  });
  const bonusAccordes = Number(
    (resultatBonus as { bonus_accordes?: number } | null)?.bonus_accordes ?? 0
  );

  type JumelageBrut = {
    id: string;
    ville_proposante_id: string;
    ville_ciblee_id: string;
    statut: "en_attente" | "actif";
    created_at: string;
  };

  const { data: jumelagesBruts } = await supabase
    .from("jumelages")
    .select("id, ville_proposante_id, ville_ciblee_id, statut, created_at")
    .or(`ville_proposante_id.eq.${maVilleId},ville_ciblee_id.eq.${maVilleId}`)
    .in("statut", ["en_attente", "actif"])
    .order("created_at", { ascending: false });
  const jumelages = (jumelagesBruts ?? []) as JumelageBrut[];

  const idsVillesLiees = new Set<string>();
  for (const j of jumelages) {
    idsVillesLiees.add(
      j.ville_proposante_id === maVilleId ? j.ville_ciblee_id : j.ville_proposante_id
    );
  }

  const { data: villesLiees } =
    idsVillesLiees.size > 0
      ? await supabase.from("cities").select("id, nom").in("id", Array.from(idsVillesLiees))
      : { data: [] as { id: string; nom: string }[] };
  const nomVilleParId = new Map((villesLiees ?? []).map((v) => [v.id, v.nom]));

  const actifs = jumelages.filter((j) => j.statut === "actif");
  const recues = jumelages.filter(
    (j) => j.statut === "en_attente" && j.ville_ciblee_id === maVilleId
  );
  const envoyees = jumelages.filter(
    (j) => j.statut === "en_attente" && j.ville_proposante_id === maVilleId
  );

  function nomAutreVille(j: JumelageBrut): string {
    const autreId = j.ville_proposante_id === maVilleId ? j.ville_ciblee_id : j.ville_proposante_id;
    return nomVilleParId.get(autreId) ?? "?";
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <div>
        <h1 className="text-2xl font-bold">{traduire(locale, "jumelages.titre")}</h1>
        <p className="text-sm text-gray-600">{traduire(locale, "jumelages.introduction")}</p>
        {bonusAccordes > 0 ? (
          <p className="mt-2 rounded bg-green-50 p-2 text-sm text-green-800">
            {traduire(locale, "jumelages.bonusAccordes")} {bonusAccordes}{" "}
            {traduire(locale, "jumelages.actifs").toLowerCase()}.
          </p>
        ) : null}
      </div>

      <section>
        <h2 className="mb-2 font-semibold">{traduire(locale, "jumelages.actifs")}</h2>
        {actifs.length === 0 ? (
          <p className="text-sm text-gray-500">
            {traduire(locale, "jumelages.aucunJumelageActif")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {actifs.map((j) => (
              <li
                key={j.id}
                className="flex items-center justify-between rounded border border-gray-200 p-3 text-sm"
              >
                <span>{nomAutreVille(j)}</span>
                <form action={annulerJumelage}>
                  <input type="hidden" name="jumelageId" value={j.id} />
                  <button
                    type="submit"
                    className="rounded bg-gray-200 px-3 py-1 text-xs text-gray-700 hover:bg-gray-300"
                  >
                    {traduire(locale, "jumelages.annuler")}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-semibold">{traduire(locale, "jumelages.recues")}</h2>
        {recues.length === 0 ? (
          <p className="text-sm text-gray-500">
            {traduire(locale, "jumelages.aucuneDemandeRecue")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recues.map((j) => (
              <li
                key={j.id}
                className="flex items-center justify-between rounded border border-gray-200 p-3 text-sm"
              >
                <span>{nomAutreVille(j)}</span>
                <div className="flex gap-2">
                  <form action={repondreJumelage}>
                    <input type="hidden" name="jumelageId" value={j.id} />
                    <input type="hidden" name="accepter" value="true" />
                    <button
                      type="submit"
                      className="rounded bg-teal-600 px-3 py-1 text-xs text-white hover:bg-teal-700"
                    >
                      {traduire(locale, "jumelages.accepter")}
                    </button>
                  </form>
                  <form action={repondreJumelage}>
                    <input type="hidden" name="jumelageId" value={j.id} />
                    <input type="hidden" name="accepter" value="false" />
                    <button
                      type="submit"
                      className="rounded bg-gray-200 px-3 py-1 text-xs text-gray-700 hover:bg-gray-300"
                    >
                      {traduire(locale, "jumelages.refuser")}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-semibold">{traduire(locale, "jumelages.envoyees")}</h2>
        {envoyees.length === 0 ? (
          <p className="text-sm text-gray-500">
            {traduire(locale, "jumelages.aucuneDemandeEnvoyee")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {envoyees.map((j) => (
              <li
                key={j.id}
                className="flex items-center justify-between rounded border border-gray-200 p-3 text-sm"
              >
                <span>{nomAutreVille(j)}</span>
                <form action={annulerJumelage}>
                  <input type="hidden" name="jumelageId" value={j.id} />
                  <button
                    type="submit"
                    className="rounded bg-gray-200 px-3 py-1 text-xs text-gray-700 hover:bg-gray-300"
                  >
                    {traduire(locale, "jumelages.annuler")}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
