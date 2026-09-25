import Link from "next/link";
import { redirect } from "next/navigation";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getLocale, traduire } from "@/lib/i18n";
import type { DictionaryKey } from "@/lib/i18n/dictionaries";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { exigerRegionChoisie } from "@/lib/supabase/gardes";
import { debutSemaineIso } from "@/lib/game/semaineIso";
import { CartePays, type CarteRegionDonnees, type MarqueurVille } from "./CartePays";
import { SelecteurPays } from "./SelecteurPays";
import { voterPays, proposerDecisionDiplomatique, soutenirDecisionDiplomatique } from "./actions";

const TAILLE_TOP = 10;

/** Carte pré-générée (scripts/generer-cartes-pays.mjs, Jalon 9 ter) —
 * absente pour ~16 très petits territoires (hors couverture des
 * données sources) : page.tsx retombe alors sur une simple vignette,
 * comme prévu par docs/CARTE-DU-PAYS.md §2 pour "les petits pays". */
async function chargerCarte(countryId: string): Promise<{ viewBox: string; regions: CarteRegionDonnees[] } | null> {
  try {
    const contenu = await readFile(path.join(process.cwd(), "src/data/cartes", `${countryId}.json`), "utf8");
    return JSON.parse(contenu);
  } catch {
    return null;
  }
}

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

type CategorieDiplomatie = "alliance" | "paix" | "rivalite" | "embargo";
const CATEGORIES_DIPLOMATIE: CategorieDiplomatie[] = ["alliance", "paix", "rivalite", "embargo"];
const LABEL_DIPLOMATIE: Record<CategorieDiplomatie, DictionaryKey> = {
  alliance: "pays.diplomatie.alliance",
  paix: "pays.diplomatie.paix",
  rivalite: "pays.diplomatie.rivalite",
  embargo: "pays.diplomatie.embargo",
};
type ResultatDecision = {
  proposition_id: string;
  pays_cible_id: string;
  categorie: CategorieDiplomatie;
  proposee_par_ville_id: string;
  nb_soutiens: number;
};

type MandatBrut = {
  ville_id: string;
  debut: string;
  fin: string | null;
  ville: { nom: string } | { nom: string }[] | null;
};
type Mandat = { villeId: string; nom: string; debut: string; fin: string | null };

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
    .select("id, nom, country_id, region_id")
    .eq("id", maVilleId)
    .maybeSingle();
  type MaVille = { id: string; nom: string; country_id: string; region_id: string | null };
  const maVille = maVilleBrute as MaVille;

  const { data: listePays } = await supabase
    .from("countries")
    .select(`id, nom:${colonneNomPays}`)
    .order(colonneNomPays);
  const idsValides = new Set((listePays ?? []).map((p) => p.id));
  const countryId = paysDemande && idsValides.has(paysDemande) ? paysDemande : maVille.country_id;
  const nomPaysAffiche = (listePays ?? []).find((p) => p.id === countryId)?.nom ?? countryId;

  // Tient à jour l'historique des présidences pour le pays consulté
  // (Jalon 11) — idempotente, voir le commentaire dans /ville/page.tsx.
  await supabaseAdmin.rpc("verifier_president", { p_country_id: countryId });

  const { data: mandatsBrutes } = await supabase
    .from("presidents")
    .select("ville_id, debut, fin, ville:cities(nom)")
    .eq("country_id", countryId)
    .order("debut", { ascending: false });
  const mandats: Mandat[] = ((mandatsBrutes ?? []) as MandatBrut[]).map((m) => ({
    villeId: m.ville_id,
    nom: (Array.isArray(m.ville) ? m.ville[0] : m.ville)?.nom ?? "",
    debut: m.debut,
    fin: m.fin,
  }));
  const mandatActuel = mandats.find((m) => m.fin === null) ?? null;

  // Carte du pays (Jalon 9 ter) : population par région (couleur),
  // ville la plus peuplée de chaque région ("couronne"), et régions de
  // "ma ville" / de la présidente pour les pastilles.
  const carte = await chargerCarte(countryId);
  const { data: toutesLesVillesBrutes } = await supabase
    .from("cities")
    .select("id, nom, population, region_id")
    .eq("country_id", countryId);
  type VilleRegion = { id: string; nom: string; population: number; region_id: string | null };
  const toutesLesVilles = (toutesLesVillesBrutes ?? []) as VilleRegion[];

  const populationParRegion: Record<string, number> = {};
  const meilleureVilleParRegion = new Map<string, VilleRegion>();
  for (const v of toutesLesVilles) {
    if (!v.region_id) continue;
    populationParRegion[v.region_id] = (populationParRegion[v.region_id] ?? 0) + v.population;
    const meilleure = meilleureVilleParRegion.get(v.region_id);
    if (!meilleure || v.population > meilleure.population) meilleureVilleParRegion.set(v.region_id, v);
  }
  const populationMaxRegion = Math.max(0, ...Object.values(populationParRegion));

  const marqueurParRegion = new Map<string, MarqueurVille>();
  for (const [regionId, v] of meilleureVilleParRegion) {
    marqueurParRegion.set(regionId, {
      regionId,
      villeId: v.id,
      nom: v.nom,
      estMoi: false,
      estPresident: false,
      estPremiereDeRegion: true,
    });
  }
  if (mandatActuel) {
    const villePresidente = toutesLesVilles.find((v) => v.id === mandatActuel.villeId);
    if (villePresidente?.region_id) {
      const existant = marqueurParRegion.get(villePresidente.region_id);
      marqueurParRegion.set(villePresidente.region_id, {
        regionId: villePresidente.region_id,
        villeId: existant?.villeId ?? villePresidente.id,
        nom: existant?.nom ?? villePresidente.nom,
        estMoi: existant?.estMoi ?? false,
        estPresident: true,
        estPremiereDeRegion: true,
      });
    }
  }
  if (countryId === maVille.country_id && maVille.region_id) {
    const existant = marqueurParRegion.get(maVille.region_id);
    marqueurParRegion.set(maVille.region_id, {
      regionId: maVille.region_id,
      villeId: existant?.villeId ?? maVille.id,
      nom: existant?.nom ?? maVille.nom,
      estMoi: true,
      estPresident: existant?.estPresident ?? false,
      estPremiereDeRegion: existant?.estPremiereDeRegion ?? false,
    });
  }
  const marqueurs = [...marqueurParRegion.values()];

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

  // Décision diplomatique (Jalon 12) : seule la présidente en exercice
  // de son propre pays peut proposer une cible + une catégorie cette
  // semaine ; n'importe quel citoyen peut ensuite soutenir. Ce que la
  // décision *fait* une fois soutenue n'est pas encore défini (point
  // ouvert, DECISIONS.md §10) — laissé au Jalon 13.
  const jeSuisPresident = estMonPays && mandatActuel?.villeId === maVilleId;
  const { data: resultatDecisionBrut } = await supabase.rpc("resultat_decision_semaine", {
    p_country_id: countryId,
    p_semaine: null,
  });
  const resultatDecision = (
    Array.isArray(resultatDecisionBrut) ? resultatDecisionBrut[0] : resultatDecisionBrut
  ) as ResultatDecision | undefined;
  const nomPaysCible = resultatDecision
    ? ((listePays ?? []).find((p) => p.id === resultatDecision.pays_cible_id)?.nom ?? resultatDecision.pays_cible_id)
    : null;

  let aiSoutenu = false;
  if (estMonPays && resultatDecision) {
    const { data: monSoutien } = await supabase
      .from("votes_diplomatie")
      .select("id")
      .eq("joueur_id", user.id)
      .eq("semaine", debutSemaineIso())
      .maybeSingle();
    aiSoutenu = !!monSoutien;
  }

  return (
    <main className="screen" aria-label={traduire(locale, "pays.eyebrow")}>
      {carte ? (
        <CartePays
          viewBox={carte.viewBox}
          regions={carte.regions}
          populationParRegion={populationParRegion}
          populationMaxRegion={populationMaxRegion}
          marqueurs={marqueurs}
        />
      ) : (
        <div className="carte-pays carte-pays-vignette" aria-hidden="true">
          <span>{nomPaysAffiche}</span>
        </div>
      )}
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

        {mandatActuel ? (
          <p className="note">
            <span className="badge pres">{traduire(locale, "classement.president")}</span>{" "}
            <b>{mandatActuel.nom}</b> · {traduire(locale, "pays.president.depuis")}{" "}
            {new Intl.DateTimeFormat(locale).format(new Date(mandatActuel.debut))}
          </p>
        ) : null}

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
          <h2 className="h3">{traduire(locale, "pays.diplomatie.titre")}</h2>
        </div>
        {resultatDecision ? (
          <div className="card">
            <div className="spread">
              <span className="h3">
                {traduire(locale, LABEL_DIPLOMATIE[resultatDecision.categorie])} · {nomPaysCible}
              </span>
              <span className="badge">
                {new Intl.NumberFormat(locale).format(resultatDecision.nb_soutiens)}{" "}
                {traduire(locale, "pays.diplomatie.soutiens")}
              </span>
            </div>
            {estMonPays ? (
              aiSoutenu ? (
                <p className="note">{traduire(locale, "pays.diplomatie.dejaSoutenu")}</p>
              ) : (
                <form action={soutenirDecisionDiplomatique}>
                  <button className="btn small" type="submit">
                    {traduire(locale, "pays.diplomatie.soutenir")}
                  </button>
                </form>
              )
            ) : null}
          </div>
        ) : (
          <p className="empty">{traduire(locale, "pays.diplomatie.aucunePropositionCetteSemaine")}</p>
        )}
        {jeSuisPresident && !resultatDecision ? (
          <form action={proposerDecisionDiplomatique} className="row" style={{ flexWrap: "wrap" }}>
            <select name="paysCibleId" className="select" aria-label={traduire(locale, "pays.diplomatie.choisirCible")} required>
              <option value="">{traduire(locale, "pays.diplomatie.choisirCible")}</option>
              {(listePays ?? [])
                .filter((p) => p.id !== countryId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
            </select>
            <select name="categorie" className="select" aria-label={traduire(locale, "pays.diplomatie.choisirCategorie")} required>
              <option value="">{traduire(locale, "pays.diplomatie.choisirCategorie")}</option>
              {CATEGORIES_DIPLOMATIE.map((c) => (
                <option key={c} value={c}>
                  {traduire(locale, LABEL_DIPLOMATIE[c])}
                </option>
              ))}
            </select>
            <button className="btn small" type="submit">
              {traduire(locale, "pays.diplomatie.proposer")}
            </button>
          </form>
        ) : null}

        <div className="head-row">
          <h2 className="h3">{traduire(locale, "pays.resultats.titre")}</h2>
        </div>
        <ol className="list">
          {resultats.map((r, i) => (
            <li key={r.categorie}>
              <span className="rowbtn">
                <span className="rk">{i + 1}</span>
                <span className="nm">{traduire(locale, LABEL_CATEGORIE[r.categorie])}</span>
                <span className="pp">{r.pourcentage}%</span>
                <span className="meta">{new Intl.NumberFormat(locale).format(r.nb_votes)}</span>
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

        <div className="head-row">
          <h2 className="h3">{traduire(locale, "pays.president.historique")}</h2>
        </div>
        {mandats.length === 0 ? (
          <p className="empty">{traduire(locale, "pays.president.aucunHistorique")}</p>
        ) : (
          <ol className="list">
            {mandats.map((m, i) => (
              <li key={`${m.villeId}-${m.debut}`}>
                <span className="rowbtn">
                  <span className="rk">{mandats.length - i}</span>
                  <span className="nm">{m.nom}</span>
                  <span className="meta">
                    {new Intl.DateTimeFormat(locale).format(new Date(m.debut))}
                    {m.fin ? ` – ${new Intl.DateTimeFormat(locale).format(new Date(m.fin))}` : null}
                    {m.fin === null ? (
                      <span className="badge pres">{traduire(locale, "pays.president.enCours")}</span>
                    ) : null}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}
