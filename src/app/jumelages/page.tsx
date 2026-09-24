import { redirect } from "next/navigation";
import { getLocale, traduire } from "@/lib/i18n";
import { libelleNiveau } from "@/lib/game/niveauVille";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { exigerRegionChoisie } from "@/lib/supabase/gardes";
import { SincroniserScene } from "@/components/SincroniserScene";
import { annulerJumelage, repondreJumelage } from "./actions";

const QUOTA_JUMELAGES_ACTIFS = 3;
const PAYS_PAR_DEFAUT = { latitude: 46.6, longitude: 2.35, fuseauHoraire: "Europe/Paris" };

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
  await exigerRegionChoisie(supabase, user.id);

  const { data: maVille } = await supabase
    .from("cities")
    .select("id, population_max")
    .eq("id", maVilleId)
    .maybeSingle();

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
    idsVillesLiees.add(j.ville_proposante_id === maVilleId ? j.ville_ciblee_id : j.ville_proposante_id);
  }

  const colonneNomPays = locale === "fr" ? "nom_fr" : "nom_en";
  const { data: villesLiees } =
    idsVillesLiees.size > 0
      ? await supabase
          .from("cities")
          .select(`id, nom, population, niveau, pays:countries(nom:${colonneNomPays})`)
          .in("id", Array.from(idsVillesLiees))
      : { data: [] as { id: string; nom: string; population: number; niveau: number; pays: { nom: string } | { nom: string }[] | null }[] };
  type VilleLiee = { id: string; nom: string; population: number; niveau: number; pays: { nom: string } | { nom: string }[] | null };
  const villeParId = new Map((villesLiees ?? []).map((v) => [v.id, v as VilleLiee]));

  function villeDe(j: JumelageBrut): VilleLiee | undefined {
    const autreId = j.ville_proposante_id === maVilleId ? j.ville_ciblee_id : j.ville_proposante_id;
    return villeParId.get(autreId);
  }

  const actifs = jumelages.filter((j) => j.statut === "actif");
  const recues = jumelages.filter((j) => j.statut === "en_attente" && j.ville_ciblee_id === maVilleId);
  const envoyees = jumelages.filter((j) => j.statut === "en_attente" && j.ville_proposante_id === maVilleId);

  function Carte({ j, boutons }: { j: JumelageBrut; boutons?: React.ReactNode }) {
    const v = villeDe(j);
    if (!v) return null;
    const nomPays = Array.isArray(v.pays) ? v.pays[0]?.nom : v.pays?.nom;
    return (
      <div className="card">
        <div className="spread">
          <div>
            <div className="h3">{v.nom}</div>
            <div className="note">
              {nomPays} · {libelleNiveau(v.niveau, locale)} · {new Intl.NumberFormat(locale).format(v.population)}{" "}
              {traduire(locale, "ville.habitantsAbrege")}
            </div>
          </div>
        </div>
        {boutons ? <div className="row">{boutons}</div> : null}
      </div>
    );
  }

  return (
    <main className="screen" aria-label={traduire(locale, "jumelages.titre")}>
      <SincroniserScene
        seed={maVilleId}
        populationMax={maVille?.population_max ?? 1}
        pays={PAYS_PAR_DEFAUT}
      />
      <div className="dock dock-float dock-left">
        <h2 className="h2">{traduire(locale, "jumelages.titre")}</h2>
        <p className="note">{traduire(locale, "jumelages.introduction")}</p>
        {bonusAccordes > 0 ? (
          <p className="toast">
            {traduire(locale, "jumelages.bonusAccordes")} {bonusAccordes}{" "}
            {traduire(locale, "jumelages.actifs").toLowerCase()}.
          </p>
        ) : null}

        <div className="section-title">
          <h3 className="h3">{traduire(locale, "jumelages.actifs")}</h3>
          <span className="counter">
            {actifs.length} / {QUOTA_JUMELAGES_ACTIFS}
          </span>
        </div>
        {actifs.length === 0 ? (
          <p className="empty">{traduire(locale, "jumelages.aucunJumelageActif")}</p>
        ) : (
          actifs.map((j) => (
            <Carte
              key={j.id}
              j={j}
              boutons={<span className="badge good">{traduire(locale, "jumelages.bonusAujourdhui")}</span>}
            />
          ))
        )}

        <div className="section-title">
          <h3 className="h3">{traduire(locale, "jumelages.recues")}</h3>
          <span className="counter">{recues.length}</span>
        </div>
        {recues.length === 0 ? (
          <p className="empty">{traduire(locale, "jumelages.aucuneDemandeRecue")}</p>
        ) : (
          recues.map((j) => (
            <Carte
              key={j.id}
              j={j}
              boutons={
                <>
                  <form action={repondreJumelage}>
                    <input type="hidden" name="jumelageId" value={j.id} />
                    <input type="hidden" name="accepter" value="true" />
                    <button type="submit" className="btn small primary" disabled={actifs.length >= QUOTA_JUMELAGES_ACTIFS}>
                      {traduire(locale, "jumelages.accepter")}
                    </button>
                  </form>
                  <form action={repondreJumelage}>
                    <input type="hidden" name="jumelageId" value={j.id} />
                    <input type="hidden" name="accepter" value="false" />
                    <button type="submit" className="btn small">
                      {traduire(locale, "jumelages.refuser")}
                    </button>
                  </form>
                </>
              }
            />
          ))
        )}

        <div className="section-title">
          <h3 className="h3">{traduire(locale, "jumelages.envoyees")}</h3>
          <span className="counter">{envoyees.length}</span>
        </div>
        {envoyees.length === 0 ? (
          <p className="empty">{traduire(locale, "jumelages.aucuneDemandeEnvoyee")}</p>
        ) : (
          envoyees.map((j) => (
            <Carte
              key={j.id}
              j={j}
              boutons={
                <form action={annulerJumelage}>
                  <input type="hidden" name="jumelageId" value={j.id} />
                  <button type="submit" className="btn small">
                    {traduire(locale, "jumelages.annuler")}
                  </button>
                </form>
              }
            />
          ))
        )}
      </div>
    </main>
  );
}
