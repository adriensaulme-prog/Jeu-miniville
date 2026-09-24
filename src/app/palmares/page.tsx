import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, traduire } from "@/lib/i18n";
import type { DictionaryKey, Locale } from "@/lib/i18n/dictionaries";
import { ordinal } from "@/lib/game/ordinal";
import { depuisPourPeriode, type Periode } from "@/lib/game/periodePalmares";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { exigerRegionChoisie } from "@/lib/supabase/gardes";
import { SincroniserScene } from "@/components/SincroniserScene";

const PAYS_PAR_DEFAUT = { latitude: 46.6, longitude: 2.35, fuseauHoraire: "Europe/Paris" };
const TAILLE_AFFICHEE = 50;

type Vue = "mondial" | "national" | "regional";
type TypeClassement =
  | "croissance"
  | "pertes"
  | "influence"
  | "visites"
  | "attaques"
  | "generosite"
  | "jumelages";

const TYPES: TypeClassement[] = [
  "croissance",
  "pertes",
  "influence",
  "visites",
  "attaques",
  "generosite",
  "jumelages",
];
const PERIODES: Periode[] = ["jour", "semaine", "mois", "toujours"];

type LigneVille = { ville_id: string; nom: string; valeur: number; rang: number };
type LigneJoueur = { joueur_id: string; pseudo: string; valeur: number; rang: number };
type LigneJumelage = {
  jumelage_id: string;
  ville_a_id: string;
  ville_a_nom: string;
  ville_b_id: string;
  ville_b_nom: string;
  valeur: number;
  rang: number;
};

const UNITE: Record<TypeClassement, DictionaryKey> = {
  croissance: "palmares.uniteHabitantsGagnes",
  pertes: "palmares.uniteHabitantsPerdus",
  influence: "palmares.uniteInfluence",
  visites: "palmares.uniteVisitesRecues",
  attaques: "palmares.uniteAttaques",
  generosite: "palmares.uniteVisitesDonnees",
  jumelages: "palmares.uniteJumelage",
};

const LABEL_TYPE: Record<TypeClassement, DictionaryKey> = {
  croissance: "palmares.croissance",
  pertes: "palmares.pertes",
  influence: "palmares.influence",
  visites: "palmares.visites",
  attaques: "palmares.attaques",
  generosite: "palmares.generosite",
  jumelages: "palmares.jumelages",
};

const LABEL_PERIODE: Record<Periode, DictionaryKey> = {
  jour: "palmares.periode.jour",
  semaine: "palmares.periode.semaine",
  mois: "palmares.periode.mois",
  toujours: "palmares.periode.toujours",
};

const LABEL_ECHELLE: Record<Vue, DictionaryKey> = {
  mondial: "classement.mondial",
  national: "classement.national",
  regional: "classement.regional",
};

export default async function PalmaresPage({
  searchParams,
}: {
  searchParams: Promise<{ classement?: string; periode?: string; echelle?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const classement: TypeClassement = (TYPES as string[]).includes(params.classement ?? "")
    ? (params.classement as TypeClassement)
    : "croissance";
  const periode: Periode = (PERIODES as string[]).includes(params.periode ?? "")
    ? (params.periode as Periode)
    : "semaine";
  const echelle: Vue = params.echelle === "national" || params.echelle === "regional" ? params.echelle : "mondial";

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
      `id, population_max, country_id, region_id, pays:countries(nom:${colonneNomPays}, latitude, longitude, fuseau_horaire)`
    )
    .eq("id", maVilleId)
    .maybeSingle();
  type MaVille = {
    id: string;
    population_max: number;
    country_id: string;
    region_id: string;
    pays:
      | { nom: string; latitude: number | null; longitude: number | null; fuseau_horaire: string | null }
      | { nom: string; latitude: number | null; longitude: number | null; fuseau_horaire: string | null }[]
      | null;
  };
  const maVille = maVilleBrute as MaVille;
  const paysBrut = Array.isArray(maVille.pays) ? maVille.pays[0] : maVille.pays;
  const pays =
    paysBrut?.latitude != null && paysBrut?.longitude != null && paysBrut?.fuseau_horaire
      ? { latitude: paysBrut.latitude, longitude: paysBrut.longitude, fuseauHoraire: paysBrut.fuseau_horaire }
      : PAYS_PAR_DEFAUT;

  const p_depuis = depuisPourPeriode(periode);
  const p_country_id = echelle === "national" || echelle === "regional" ? maVille.country_id : null;
  const p_region_id = echelle === "regional" ? maVille.region_id : null;

  const { data: lignesBrutes, error: erreurPalmares } = await supabase.rpc(`palmares_${classement}`, {
    p_depuis,
    p_country_id,
    p_region_id,
  });
  if (erreurPalmares) console.error("Chargement du palmarès a échoué :", erreurPalmares.message);

  const lienVers = (c: TypeClassement, p: Periode, e: Vue) =>
    `/palmares?classement=${c}&periode=${p}&echelle=${e}`;

  return (
    <main className="screen" aria-label={traduire(locale, "palmares.titre")}>
      <SincroniserScene seed={maVilleId} populationMax={maVille.population_max} pays={pays} />
      <div className="dock dock-float dock-left">
        <div className="head-row">
          <h2 className="h2">{traduire(locale, "palmares.titre")}</h2>
        </div>

        <div className="row" role="tablist" aria-label={traduire(locale, "palmares.titre")}>
          {TYPES.map((t) => (
            <Link
              key={t}
              href={lienVers(t, periode, echelle)}
              className="btn small"
              style={
                classement === t
                  ? { borderColor: "var(--accent)", boxShadow: "inset 0 0 0 1px var(--accent)" }
                  : undefined
              }
              aria-current={classement === t ? "page" : undefined}
            >
              {traduire(locale, LABEL_TYPE[t])}
            </Link>
          ))}
        </div>

        <div className="row" role="tablist" aria-label={traduire(locale, "palmares.periode.jour")}>
          {PERIODES.map((p) => (
            <Link
              key={p}
              href={lienVers(classement, p, echelle)}
              className="btn small"
              style={
                periode === p
                  ? { borderColor: "var(--accent)", boxShadow: "inset 0 0 0 1px var(--accent)" }
                  : undefined
              }
              aria-current={periode === p ? "page" : undefined}
            >
              {traduire(locale, LABEL_PERIODE[p])}
            </Link>
          ))}
        </div>

        <div className="row" role="tablist" aria-label={traduire(locale, "classement.mondial")}>
          {(["mondial", "national", "regional"] as Vue[]).map((e) => (
            <Link
              key={e}
              href={lienVers(classement, periode, e)}
              className="btn small"
              style={
                echelle === e
                  ? { borderColor: "var(--accent)", boxShadow: "inset 0 0 0 1px var(--accent)" }
                  : undefined
              }
              aria-current={echelle === e ? "page" : undefined}
            >
              {traduire(locale, LABEL_ECHELLE[e])}
            </Link>
          ))}
        </div>

        {classement === "generosite" ? (
          <PalmaresJoueurs
            locale={locale}
            lignes={(lignesBrutes ?? []) as LigneJoueur[]}
            moiId={user.id}
            unite={traduire(locale, UNITE[classement])}
          />
        ) : classement === "jumelages" ? (
          <PalmaresJumelages
            locale={locale}
            lignes={(lignesBrutes ?? []) as LigneJumelage[]}
            maVilleId={maVilleId}
            unite={traduire(locale, UNITE[classement])}
          />
        ) : (
          <PalmaresVilles
            locale={locale}
            lignes={(lignesBrutes ?? []) as LigneVille[]}
            maVilleId={maVilleId}
            unite={traduire(locale, UNITE[classement])}
          />
        )}
      </div>
    </main>
  );
}

function PalmaresVilles({
  locale,
  lignes,
  maVilleId,
  unite,
}: {
  locale: Locale;
  lignes: LigneVille[];
  maVilleId: string;
  unite: string;
}) {
  const moi = lignes.find((l) => l.ville_id === maVilleId);
  return (
    <>
      {moi ? (
        <div className="card">
          <div className="spread">
            <span className="h3">{traduire(locale, "palmares.maPosition")}</span>
            <span className="badge pres">
              {ordinal(moi.rang, locale)} · {moi.valeur} {unite}
            </span>
          </div>
        </div>
      ) : null}
      {lignes.length === 0 ? (
        <p className="empty">{traduire(locale, "palmares.aucunResultat")}</p>
      ) : (
        <ol className="list">
          {lignes.slice(0, TAILLE_AFFICHEE).map((l) => {
            const estMoi = l.ville_id === maVilleId;
            const href = estMoi ? "/ville" : `/villes?ville=${l.ville_id}`;
            return (
              <li key={l.ville_id}>
                <Link href={href} className="rowbtn" aria-current={estMoi}>
                  <span className="rk">{l.rang}</span>
                  <span className="nm">{l.nom}</span>
                  <span className="pp">{new Intl.NumberFormat(locale).format(l.valeur)}</span>
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
    </>
  );
}

function PalmaresJoueurs({
  locale,
  lignes,
  moiId,
  unite,
}: {
  locale: Locale;
  lignes: LigneJoueur[];
  moiId: string;
  unite: string;
}) {
  const moi = lignes.find((l) => l.joueur_id === moiId);
  return (
    <>
      {moi ? (
        <div className="card">
          <div className="spread">
            <span className="h3">{traduire(locale, "palmares.maPosition")}</span>
            <span className="badge pres">
              {ordinal(moi.rang, locale)} · {moi.valeur} {unite}
            </span>
          </div>
        </div>
      ) : null}
      {lignes.length === 0 ? (
        <p className="empty">{traduire(locale, "palmares.aucunResultat")}</p>
      ) : (
        <ol className="list">
          {lignes.slice(0, TAILLE_AFFICHEE).map((l) => {
            const estMoi = l.joueur_id === moiId;
            return (
              <li key={l.joueur_id}>
                <span className="rowbtn" aria-current={estMoi}>
                  <span className="rk">{l.rang}</span>
                  <span className="nm">{l.pseudo}</span>
                  <span className="pp">{new Intl.NumberFormat(locale).format(l.valeur)}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}

function PalmaresJumelages({
  locale,
  lignes,
  maVilleId,
  unite,
}: {
  locale: Locale;
  lignes: LigneJumelage[];
  maVilleId: string;
  unite: string;
}) {
  const moi = lignes.find((l) => l.ville_a_id === maVilleId || l.ville_b_id === maVilleId);
  return (
    <>
      {moi ? (
        <div className="card">
          <div className="spread">
            <span className="h3">{traduire(locale, "palmares.maPosition")}</span>
            <span className="badge pres">
              {ordinal(moi.rang, locale)} · {moi.valeur} {unite}
            </span>
          </div>
        </div>
      ) : null}
      {lignes.length === 0 ? (
        <p className="empty">{traduire(locale, "palmares.aucunResultat")}</p>
      ) : (
        <ol className="list">
          {lignes.slice(0, TAILLE_AFFICHEE).map((l) => {
            const estMoi = l.ville_a_id === maVilleId || l.ville_b_id === maVilleId;
            return (
              <li key={l.jumelage_id}>
                <span className="rowbtn" aria-current={estMoi}>
                  <span className="rk">{l.rang}</span>
                  <span className="nm">
                    {l.ville_a_nom} · {l.ville_b_nom}
                  </span>
                  <span className="pp">{new Intl.NumberFormat(locale).format(l.valeur)}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
