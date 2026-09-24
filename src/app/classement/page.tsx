import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, traduire } from "@/lib/i18n";
import { ordinal } from "@/lib/game/ordinal";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { exigerRegionChoisie } from "@/lib/supabase/gardes";
import { SincroniserScene } from "@/components/SincroniserScene";

const PAYS_PAR_DEFAUT = { latitude: 46.6, longitude: 2.35, fuseauHoraire: "Europe/Paris" };
const TAILLE_TOP = 100;

type Vue = "mondial" | "national" | "regional";

type LigneClassement = {
  id: string;
  nom: string;
  population: number;
  population_max: number;
};

export default async function ClassementPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string }>;
}) {
  const locale = await getLocale();
  const { vue: vueBrute } = await searchParams;
  const vue: Vue = vueBrute === "national" || vueBrute === "regional" ? vueBrute : "mondial";
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
      `id, population, population_max, country_id, region_id, pays:countries(nom:${colonneNomPays}, latitude, longitude, fuseau_horaire), region:regions(nom:${colonneNomPays})`
    )
    .eq("id", maVilleId)
    .maybeSingle();
  type MaVille = {
    id: string;
    population: number;
    population_max: number;
    country_id: string;
    region_id: string;
    pays: { nom: string; latitude: number | null; longitude: number | null; fuseau_horaire: string | null } | { nom: string; latitude: number | null; longitude: number | null; fuseau_horaire: string | null }[] | null;
    region: { nom: string } | { nom: string }[] | null;
  };
  const maVille = maVilleBrute as MaVille;
  const paysBrut = Array.isArray(maVille.pays) ? maVille.pays[0] : maVille.pays;
  const nomPays = paysBrut?.nom ?? "";
  const nomRegion = (Array.isArray(maVille.region) ? maVille.region[0] : maVille.region)?.nom ?? "";
  const pays =
    paysBrut?.latitude != null && paysBrut?.longitude != null && paysBrut?.fuseau_horaire
      ? { latitude: paysBrut.latitude, longitude: paysBrut.longitude, fuseauHoraire: paysBrut.fuseau_horaire }
      : PAYS_PAR_DEFAUT;

  let requete = supabase.from("cities").select("id, nom, population, population_max").order("population", { ascending: false });
  if (vue === "national") requete = requete.eq("country_id", maVille.country_id);
  if (vue === "regional") requete = requete.eq("region_id", maVille.region_id);
  const { data: topBrut } = await requete.limit(TAILLE_TOP);
  const top = (topBrut ?? []) as LigneClassement[];

  // "Ma position" : mon rang exact dans cette échelle, même hors du top 100
  // (nombre de villes strictement devant moi + 1 — même méthode que le
  // badge de rang de Ma ville, docs/DECISIONS.md §4, Jalon 7).
  let requeteDevant = supabase.from("cities").select("id", { count: "exact", head: true });
  if (vue === "national") requeteDevant = requeteDevant.eq("country_id", maVille.country_id);
  if (vue === "regional") requeteDevant = requeteDevant.eq("region_id", maVille.region_id);
  const { count: nbVillesDevant } = await requeteDevant.gt("population", maVille.population);
  const monRang = (nbVillesDevant ?? 0) + 1;

  const ONGLETS: { cle: Vue; label: string }[] = [
    { cle: "mondial", label: traduire(locale, "classement.mondial") },
    { cle: "national", label: traduire(locale, "classement.national") },
    { cle: "regional", label: traduire(locale, "classement.regional") },
  ];

  return (
    <main className="screen" aria-label={traduire(locale, "classement.titre")}>
      <SincroniserScene seed={maVilleId} populationMax={maVille.population_max} pays={pays} />
      <div className="dock dock-float dock-left">
        <div className="head-row">
          <h2 className="h2">{traduire(locale, "classement.titre")}</h2>
        </div>
        <div className="row" role="tablist">
          {ONGLETS.map((o) => (
            <Link
              key={o.cle}
              href={o.cle === "mondial" ? "/classement" : `/classement?vue=${o.cle}`}
              className="btn small"
              style={
                vue === o.cle
                  ? { borderColor: "var(--accent)", boxShadow: "inset 0 0 0 1px var(--accent)" }
                  : undefined
              }
              aria-current={vue === o.cle ? "page" : undefined}
            >
              {o.label}
            </Link>
          ))}
        </div>
        {vue === "regional" ? (
          <p className="note">{nomRegion} ({nomPays})</p>
        ) : vue === "national" ? (
          <p className="note">{nomPays}</p>
        ) : null}

        <div className="card">
          <div className="spread">
            <span className="h3">{traduire(locale, "classement.maPosition")}</span>
            <span className="badge pres">{ordinal(monRang, locale)}</span>
          </div>
        </div>

        {top.length === 0 ? (
          <p className="empty">{traduire(locale, "classement.aucuneVille")}</p>
        ) : (
          <ol className="list">
            {top.map((v, i) => {
              const estMoi = v.id === maVilleId;
              const href = estMoi ? "/ville" : `/villes?ville=${v.id}`;
              return (
                <li key={v.id}>
                  <Link href={href} className="rowbtn" aria-current={estMoi}>
                    <span className="rk">{i + 1}</span>
                    <span className="nm">{v.nom}</span>
                    <span className="pp">{new Intl.NumberFormat(locale).format(v.population)}</span>
                    {estMoi ? (
                      <span className="meta">
                        <span className="badge">{traduire(locale, "villes.maVille")}</span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </main>
  );
}
