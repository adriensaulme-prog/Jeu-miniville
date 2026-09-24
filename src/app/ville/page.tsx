import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, traduire } from "@/lib/i18n";
import { progressionNiveau, libelleNiveau } from "@/lib/game/niveauVille";
import { ligneLocale } from "@/lib/game/ligneLocale";
import { ordinal } from "@/lib/game/ordinal";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { SincroniserScene } from "@/components/SincroniserScene";

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
    country_id: string;
    region_id: string | null;
    pays:
      | { nom: string; latitude: number | null; longitude: number | null; fuseau_horaire: string | null }
      | { nom: string; latitude: number | null; longitude: number | null; fuseau_horaire: string | null }[]
      | null;
    region: { nom: string } | { nom: string }[] | null;
  };

  const colonneNomPays = locale === "fr" ? "nom_fr" : "nom_en";
  const { data } = await supabase
    .from("cities")
    .select(
      `id, nom, population, population_max, influence, activite, country_id, region_id, pays:countries(nom:${colonneNomPays}, latitude, longitude, fuseau_horaire), region:regions(nom:${colonneNomPays})`
    )
    .eq("owner_id", user.id)
    .maybeSingle();
  const ville = data as LigneVille | null;

  if (!ville) {
    redirect("/ville/creer");
  }
  if (!ville.region_id) {
    redirect("/ville/region");
  }

  const nomRegion = (Array.isArray(ville.region) ? ville.region[0] : ville.region)?.nom ?? "";
  const paysBrut = Array.isArray(ville.pays) ? ville.pays[0] : ville.pays;
  const nomPays = paysBrut?.nom ?? "";
  const pays =
    paysBrut?.latitude != null && paysBrut?.longitude != null && paysBrut?.fuseau_horaire
      ? { latitude: paysBrut.latitude, longitude: paysBrut.longitude, fuseauHoraire: paysBrut.fuseau_horaire }
      : PAYS_PAR_DEFAUT;

  const { count: nbVillesDevant } = await supabase
    .from("cities")
    .select("id", { count: "exact", head: true })
    .eq("country_id", ville.country_id)
    .gt("population", ville.population);
  const rang = (nbVillesDevant ?? 0) + 1;
  const president = rang === 1;

  const progression = progressionNiveau(ville.population_max);
  const nomNiveauSuivant =
    progression.seuilSuivant != null ? libelleNiveau(progression.niveau + 1, locale) : null;

  const stats: Array<{ cle: "ville.population" | "ville.influence" | "ville.activite"; valeur: number }> = [
    { cle: "ville.population", valeur: ville.population },
    { cle: "ville.influence", valeur: ville.influence },
    { cle: "ville.activite", valeur: ville.activite },
  ];

  return (
    <main className="screen" aria-label={traduire(locale, "villes.maVille")}>
      <SincroniserScene seed={ville.id} populationMax={ville.population_max} pays={pays} />
      <div className="dock dock-float dock-left">
        <div className="head-row">
          <span className="eyebrow">{traduire(locale, "villes.maVille")}</span>
          {president ? (
            <span className="badge pres">{traduire(locale, "classement.president")}</span>
          ) : (
            <span className="badge">
              {ordinal(rang, locale)} {traduire(locale, "classement.dans")} {nomPays}
            </span>
          )}
        </div>
        <h1 className="sign">
          <span>{ville.nom}</span>
        </h1>
        <p className="sign-sub">{ligneLocale({ nom: nomPays, ...pays }, locale)}</p>
        <p className="note">
          {traduire(locale, "region.actuelle")} : {nomRegion} ·{" "}
          <Link href="/ville/region" style={{ color: "var(--focus)" }}>
            {traduire(locale, "region.changerBouton")}
          </Link>
        </p>
        <div className="stage">
          <div className="stage-top">
            <span className="stage-name">{libelleNiveau(progression.niveau, locale)}</span>
            <span className="stage-next">
              {nomNiveauSuivant
                ? `${nomNiveauSuivant} ${traduire(locale, "ville.seuilA")} ${new Intl.NumberFormat(locale).format(
                    progression.seuilSuivant!
                  )} ${traduire(locale, "ville.habitantsAbrege")}`
                : traduire(locale, "ville.stadeMaximal")}
            </span>
          </div>
          <div
            className="bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progression.pourcentage)}
          >
            <i style={{ width: `${progression.pourcentage}%` }} />
          </div>
        </div>
        <div className="tiles">
          {stats.map(({ cle, valeur }) => (
            <div key={cle} className="tile">
              <b>{new Intl.NumberFormat(locale).format(valeur)}</b>
              <span>{traduire(locale, cle)}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
