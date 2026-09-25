import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, traduire } from "@/lib/i18n";
import type { DictionaryKey } from "@/lib/i18n/dictionaries";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { exigerRegionChoisie } from "@/lib/supabase/gardes";
import { debutSemaineIso } from "@/lib/game/semaineIso";
import { SincroniserScene } from "@/components/SincroniserScene";
import { SelecteurPays } from "./SelecteurPays";
import { voterPays } from "./actions";

const PAYS_PAR_DEFAUT = { latitude: 46.6, longitude: 2.35, fuseauHoraire: "Europe/Paris" };
const TAILLE_TOP = 10;

type StatsPays = {
  nb_villes: number;
  population_totale: number;
  influence_totale: number;
  activite_moyenne: number;
};

type VillePrincipale = { id: string; nom: string; population: number };

type Categorie = "industrie" | "techno" | "culture" | "commerce";
const CATEGORIES: Categorie[] = ["industrie", "techno", "culture", "commerce"];
const LABEL_CATEGORIE: Record<Categorie, DictionaryKey> = {
  industrie: "pays.categorie.industrie",
  techno: "pays.categorie.techno",
  culture: "pays.categorie.culture",
  commerce: "pays.categorie.commerce",
};

type ResultatVote = { categorie: Categorie; nb_votes: number; pourcentage: number };
type RessourcePays = { categorie: Categorie; total: number };

export default async function PaysPage({
  searchParams,
}: {
  searchParams: Promise<{ pays?: string }>;
}) {
  const locale = await getLocale();
  const { pays: paysDemande } = await searchParams;
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
  await exigerRegionChoisie(supabase, user.id);
  const maVilleId = profil!.city_id as string;

  const colonneNomPays = locale === "fr" ? "nom_fr" : "nom_en";
  const { data: maVilleBrute } = await supabase
    .from("cities")
    .select(
      `id, population_max, country_id, pays:countries(nom:${colonneNomPays}, latitude, longitude, fuseau_horaire)`
    )
    .eq("id", maVilleId)
    .maybeSingle();
  type MaVille = {
    id: string;
    population_max: number;
    country_id: string;
    pays:
      | { nom: string; latitude: number | null; longitude: number | null; fuseau_horaire: string | null }
      | { nom: string; latitude: number | null; longitude: number | null; fuseau_horaire: string | null }[]
      | null;
  };
  const maVille = maVilleBrute as MaVille;
  const paysBrut = Array.isArray(maVille.pays) ? maVille.pays[0] : maVille.pays;
  const pays3D =
    paysBrut?.latitude != null && paysBrut?.longitude != null && paysBrut?.fuseau_horaire
      ? { latitude: paysBrut.latitude, longitude: paysBrut.longitude, fuseauHoraire: paysBrut.fuseau_horaire }
      : PAYS_PAR_DEFAUT;

  const { data: listePays } = await supabase
    .from("countries")
    .select(`id, nom:${colonneNomPays}`)
    .order(colonneNomPays);
  const idsValides = new Set((listePays ?? []).map((p) => p.id));
  const countryId = paysDemande && idsValides.has(paysDemande) ? paysDemande : maVille.country_id;
  const nomPaysAffiche = (listePays ?? []).find((p) => p.id === countryId)?.nom ?? countryId;

  const { data: statsBrutes, error: erreurStats } = await supabase.rpc("stats_pays", {
    p_country_id: countryId,
  });
  if (erreurStats) console.error("Chargement des statistiques du pays a échoué :", erreurStats.message);
  const stats = (Array.isArray(statsBrutes) ? statsBrutes[0] : statsBrutes) as StatsPays | undefined;

  const { data: villesPrincipalesBrutes } = await supabase
    .from("cities")
    .select("id, nom, population")
    .eq("country_id", countryId)
    .order("population", { ascending: false })
    .limit(TAILLE_TOP);
  const villesPrincipales = (villesPrincipalesBrutes ?? []) as VillePrincipale[];

  const { data: resultatsBrutes } = await supabase.rpc("resultats_vote_semaine", {
    p_country_id: countryId,
    p_semaine: null,
  });
  const resultats = (resultatsBrutes ?? []) as ResultatVote[];

  const { data: ressourcesBrutes } = await supabase.rpc("ressources_pays", { p_country_id: countryId });
  const ressources = (ressourcesBrutes ?? []) as RessourcePays[];

  // Le vote n'est proposé que pour son propre pays — voter pour un pays
  // qu'on ne représente pas n'aurait pas de sens.
  const estMonPays = countryId === maVille.country_id;
  let monVoteCetteSemaine: Categorie | null = null;
  if (estMonPays) {
    const { data: monVote } = await supabase
      .from("votes_pays")
      .select("categorie")
      .eq("joueur_id", user.id)
      .eq("semaine", debutSemaineIso())
      .maybeSingle();
    monVoteCetteSemaine = (monVote?.categorie as Categorie | undefined) ?? null;
  }

  return (
    <main className="screen" aria-label={traduire(locale, "pays.eyebrow")}>
      <SincroniserScene seed={maVilleId} populationMax={maVille.population_max} pays={pays3D} />
      <div className="dock dock-float dock-left">
        <div className="head-row">
          <span className="eyebrow">{traduire(locale, "pays.eyebrow")}</span>
        </div>
        <h1 className="sign">
          <span>{nomPaysAffiche}</span>
        </h1>

        <div className="row">
          <SelecteurPays locale={locale} paysActuel={countryId} pays={(listePays ?? []) as { id: string; nom: string }[]} />
        </div>

        <div className="tiles">
          <div className="tile">
            <b>{new Intl.NumberFormat(locale).format(stats?.population_totale ?? 0)}</b>
            <span>{traduire(locale, "ville.population")}</span>
          </div>
          <div className="tile">
            <b>{new Intl.NumberFormat(locale).format(stats?.influence_totale ?? 0)}</b>
            <span>{traduire(locale, "ville.influence")}</span>
          </div>
          <div className="tile">
            <b>{new Intl.NumberFormat(locale).format(stats?.activite_moyenne ?? 0)}</b>
            <span>{traduire(locale, "ville.activite")}</span>
          </div>
          <div className="tile">
            <b>{new Intl.NumberFormat(locale).format(stats?.nb_villes ?? 0)}</b>
            <span>{traduire(locale, "pays.nbVilles")}</span>
          </div>
        </div>

        <div className="head-row">
          <h2 className="h3">{traduire(locale, "pays.villesPrincipales")}</h2>
        </div>
        {villesPrincipales.length === 0 ? (
          <p className="empty">{traduire(locale, "pays.aucuneVille")}</p>
        ) : (
          <ol className="list">
            {villesPrincipales.map((v, i) => {
              const estMoi = v.id === maVilleId;
              const href = estMoi ? "/ville" : `/villes?ville=${v.id}`;
              return (
                <li key={v.id}>
                  <Link href={href} className="rowbtn" aria-current={estMoi}>
                    <span className="rk">{i + 1}</span>
                    <span className="nm">{v.nom}</span>
                    <span className="pp">{new Intl.NumberFormat(locale).format(v.population)}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
        <p className="note">
          <Link href={`/villes?pays=${countryId}`}>{traduire(locale, "pays.voirToutesLesVilles")}</Link>
        </p>

        {estMonPays ? (
          <>
            <div className="head-row">
              <h2 className="h3">{traduire(locale, "pays.vote.titre")}</h2>
            </div>
            {monVoteCetteSemaine ? (
              <p className="note">
                {traduire(locale, "pays.vote.dejaVote")} <b>{traduire(locale, LABEL_CATEGORIE[monVoteCetteSemaine])}</b>.
              </p>
            ) : (
              <>
                <p className="note">{traduire(locale, "pays.vote.instruction")}</p>
                <div className="row">
                  {CATEGORIES.map((c) => (
                    <form key={c} action={voterPays}>
                      <input type="hidden" name="categorie" value={c} />
                      <button className="btn small" type="submit">
                        {traduire(locale, LABEL_CATEGORIE[c])}
                      </button>
                    </form>
                  ))}
                </div>
              </>
            )}
          </>
        ) : null}

        <div className="head-row">
          <h2 className="h3">{traduire(locale, "pays.resultats.titre")}</h2>
        </div>
        <ol className="list">
          {resultats.map((r) => (
            <li key={r.categorie}>
              <span className="rowbtn">
                <span className="nm">{traduire(locale, LABEL_CATEGORIE[r.categorie])}</span>
                <span className="pp">{r.pourcentage}%</span>
                <span className="meta">
                  {new Intl.NumberFormat(locale).format(r.nb_votes)}
                </span>
              </span>
            </li>
          ))}
        </ol>

        <div className="head-row">
          <h2 className="h3">{traduire(locale, "pays.ressources.titre")}</h2>
        </div>
        <div className="tiles">
          {ressources.map((r) => (
            <div key={r.categorie} className="tile">
              <b>{new Intl.NumberFormat(locale).format(r.total)}</b>
              <span>{traduire(locale, LABEL_CATEGORIE[r.categorie])}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
