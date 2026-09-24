import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, traduire } from "@/lib/i18n";
import { libelleNiveau, progressionNiveau } from "@/lib/game/niveauVille";
import { ligneLocale } from "@/lib/game/ligneLocale";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { exigerRegionChoisie } from "@/lib/supabase/gardes";
import { FiltreVilles } from "./FiltreVilles";
import { ActionsAntiVille } from "./ActionsAntiVille";
import { SincroniserScene } from "@/components/SincroniserScene";
import { influencerVille, proposerJumelage, visiterVille } from "./actions";

const QUOTA_INFLUENCE_QUOTIDIEN = 5;
const QUOTA_ANTIVILLE_QUOTIDIEN = 3;
const SEUIL_PROTECTION_ANTIVILLE = 2;
const QUOTA_JUMELAGES_ACTIFS = 3;
const PAYS_PAR_DEFAUT = { latitude: 46.6, longitude: 2.35, fuseauHoraire: "Europe/Paris" };

type LigneVille = {
  id: string;
  nom: string;
  population: number;
  population_max: number;
  niveau: number;
  influence: number;
  greve_jusqua: string | null;
  country_id: string;
  pays: { nom: string; latitude: number | null; longitude: number | null; fuseau_horaire: string | null } | { nom: string; latitude: number | null; longitude: number | null; fuseau_horaire: string | null }[] | null;
  owner: { pseudo: string } | { pseudo: string }[] | null;
};

function unwrap<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default async function VillesPage({
  searchParams,
}: {
  searchParams: Promise<{ pays?: string; q?: string; ville?: string }>;
}) {
  const locale = await getLocale();
  const { pays: filtrePays, q: recherche, ville: villeSelectionneeId } = await searchParams;
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

  const colonneNomPays = locale === "fr" ? "nom_fr" : "nom_en";
  const { data, error: erreurListe } = await supabase
    .from("cities")
    .select(
      `id, nom, population, population_max, niveau, influence, greve_jusqua, country_id, pays:countries(nom:${colonneNomPays}, latitude, longitude, fuseau_horaire), owner:users!cities_owner_id_fkey(pseudo)`
    )
    .order("population", { ascending: false });
  if (erreurListe) console.error("Chargement des villes a échoué :", erreurListe.message);
  const toutesLesVilles = (data ?? []) as LigneVille[];

  const { data: listePays } = await supabase
    .from("countries")
    .select(`id, nom:${colonneNomPays}`)
    .order(colonneNomPays);

  // Statut "Président" : n°1 de son pays, calculé sur l'ensemble non
  // filtré (indépendant des filtres actuellement affichés).
  const presidents = new Set<string>();
  const meilleurParPays = new Map<string, { id: string; population: number }>();
  for (const v of toutesLesVilles) {
    const meilleur = meilleurParPays.get(v.country_id);
    if (!meilleur || v.population > meilleur.population) {
      meilleurParPays.set(v.country_id, { id: v.id, population: v.population });
    }
  }
  for (const m of meilleurParPays.values()) presidents.add(m.id);

  const villesAffichees = toutesLesVilles.filter((v) => {
    if (filtrePays && filtrePays !== "all" && v.country_id !== filtrePays) return false;
    if (recherche && !v.nom.toLowerCase().includes(recherche.toLowerCase())) return false;
    return true;
  });

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
  const villesDejaInfluencees = new Set((actionsInfluenceDuJour ?? []).map((a) => a.ville_id));
  const actionsInfluenceRestantes = QUOTA_INFLUENCE_QUOTIDIEN - villesDejaInfluencees.size;

  const { data: actionsAntiVilleAujourdhui } = await supabase
    .from("actions_antiville")
    .select("ville_id")
    .eq("attaquant_id", user.id)
    .eq("jour", aujourdhui);
  const nbAntiVilleUtilisees = (actionsAntiVilleAujourdhui ?? []).length;
  const quotaAntiVilleAtteint = nbAntiVilleUtilisees >= QUOTA_ANTIVILLE_QUOTIDIEN;

  const { data: actionsAntiVilleRecentes } = await supabase
    .from("actions_antiville")
    .select("ville_id")
    .eq("attaquant_id", user.id)
    .gte("created_at", il24hEnArriere);
  const nbActionsRecentesParVille = new Map<string, number>();
  for (const action of actionsAntiVilleRecentes ?? []) {
    nbActionsRecentesParVille.set(action.ville_id, (nbActionsRecentesParVille.get(action.ville_id) ?? 0) + 1);
  }

  const { data: mesJumelages } = await supabase
    .from("jumelages")
    .select("ville_proposante_id, ville_ciblee_id, statut")
    .or(`ville_proposante_id.eq.${maVilleId},ville_ciblee_id.eq.${maVilleId}`)
    .in("statut", ["en_attente", "actif"]);
  const statutJumelageParVille = new Map<string, "actif" | "envoye" | "recu">();
  let nbJumelagesActifs = 0;
  for (const j of mesJumelages ?? []) {
    const autreVilleId = j.ville_proposante_id === maVilleId ? j.ville_ciblee_id : j.ville_proposante_id;
    if (j.statut === "actif") {
      statutJumelageParVille.set(autreVilleId, "actif");
      nbJumelagesActifs++;
    } else {
      statutJumelageParVille.set(
        autreVilleId,
        j.ville_proposante_id === maVilleId ? "envoye" : "recu"
      );
    }
  }
  const quotaJumelagesAtteint = nbJumelagesActifs >= QUOTA_JUMELAGES_ACTIFS;

  const villeSelectionnee =
    villeSelectionneeId && villeSelectionneeId !== maVilleId
      ? (toutesLesVilles.find((v) => v.id === villeSelectionneeId) ?? null)
      : null;

  const paramsConserves = new URLSearchParams();
  if (filtrePays) paramsConserves.set("pays", filtrePays);
  if (recherche) paramsConserves.set("q", recherche);

  function paysDe(pays: LigneVille["pays"]) {
    const p = unwrap(pays);
    return {
      nom: p?.nom ?? "",
      latitude: p?.latitude ?? PAYS_PAR_DEFAUT.latitude,
      longitude: p?.longitude ?? PAYS_PAR_DEFAUT.longitude,
      fuseauHoraire: p?.fuseau_horaire ?? PAYS_PAR_DEFAUT.fuseauHoraire,
    };
  }

  const villeAffichee3D = villeSelectionnee ?? toutesLesVilles.find((v) => v.id === maVilleId) ?? null;
  const pays3D = villeAffichee3D ? paysDe(villeAffichee3D.pays) : PAYS_PAR_DEFAUT;

  return (
    <main className={`screen${villeSelectionnee ? " detail" : ""}`} aria-label={traduire(locale, "villes.titre")}>
      {villeAffichee3D ? (
        <SincroniserScene seed={villeAffichee3D.id} populationMax={villeAffichee3D.population_max} pays={pays3D} />
      ) : null}

      <div className="dock dock-float dock-left">
        <div className="head-row">
          <h2 className="h2">{traduire(locale, "villes.titre")}</h2>
        </div>
        <p className="note">
          {traduire(locale, "villes.actionsRestantes")} {actionsInfluenceRestantes}/{QUOTA_INFLUENCE_QUOTIDIEN}
        </p>
        <FiltreVilles locale={locale} pays={(listePays ?? []) as { id: string; nom: string }[]} />
        <ol className="list">
          {villesAffichees.length === 0 ? (
            <li>
              <p className="empty">{traduire(locale, "villes.aucuneVilleCorrespondante")}</p>
            </li>
          ) : (
            villesAffichees.map((v, i) => {
              const estMoi = v.id === maVilleId;
              const nomPays = unwrap(v.pays)?.nom ?? "";
              const statutJum = statutJumelageParVille.get(v.id);
              const href = estMoi
                ? "/ville"
                : `/villes?${new URLSearchParams({ ...Object.fromEntries(paramsConserves), ville: v.id }).toString()}`;
              return (
                <li key={v.id}>
                  <Link href={href} className="rowbtn" aria-current={villeSelectionneeId === v.id}>
                    <span className="rk">{i + 1}</span>
                    <span className="nm">{v.nom}</span>
                    <span className="pp">{new Intl.NumberFormat(locale).format(v.population)}</span>
                    <span className="meta">
                      {nomPays} · {libelleNiveau(v.niveau, locale)}
                      {presidents.has(v.id) ? (
                        <span className="badge pres">{traduire(locale, "classement.president")}</span>
                      ) : null}
                      {estMoi ? <span className="badge">{traduire(locale, "villes.maVille")}</span> : null}
                      {statutJum === "actif" ? (
                        <span className="badge good">{traduire(locale, "villes.jumelee")}</span>
                      ) : null}
                      {villesDejaVisitees.has(v.id) ? (
                        <span className="badge good">{traduire(locale, "villes.dejaVisitee")}</span>
                      ) : null}
                      {v.greve_jusqua && new Date(v.greve_jusqua) > maintenant ? (
                        <span className="badge bad">{traduire(locale, "villes.enGreve")}</span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              );
            })
          )}
        </ol>
      </div>

      {villeSelectionnee ? (
        <div className="dock dock-float dock-right" aria-label={traduire(locale, "villes.enVisite")}>
          {(() => {
            const c = villeSelectionnee;
            const pseudo = unwrap(c.owner)?.pseudo ?? "";
            const dejaVisitee = villesDejaVisitees.has(c.id);
            const dejaInfluencee = villesDejaInfluencees.has(c.id);
            const estEnGreve = !!c.greve_jusqua && new Date(c.greve_jusqua) > maintenant;
            const protectionActive = (nbActionsRecentesParVille.get(c.id) ?? 0) >= SEUIL_PROTECTION_ANTIVILLE;
            const progression = progressionNiveau(c.population_max);
            const statutJum = statutJumelageParVille.get(c.id);

            return (
              <>
                <div className="head-row">
                  <Link href={`/villes?${paramsConserves.toString()}`} className="btn small back">
                    {traduire(locale, "villes.retour")}
                  </Link>
                  <span className="eyebrow">{traduire(locale, "villes.enVisite")}</span>
                  {presidents.has(c.id) ? (
                    <span className="badge pres">{traduire(locale, "classement.president")}</span>
                  ) : null}
                </div>
                <h2 className="sign">
                  <span>{c.nom}</span>
                </h2>
                <p className="sign-sub">
                  {traduire(locale, "villes.deJoueur")} <b>{pseudo}</b> · {ligneLocale(paysDe(c.pays), locale)}
                </p>
                <div className="stage">
                  <div className="stage-top">
                    <span className="stage-name">{libelleNiveau(progression.niveau, locale)}</span>
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
                  <div className="tile">
                    <b>{new Intl.NumberFormat(locale).format(c.population)}</b>
                    <span>{traduire(locale, "ville.population")}</span>
                  </div>
                  <div className="tile">
                    <b>{new Intl.NumberFormat(locale).format(c.influence)}</b>
                    <span>{traduire(locale, "ville.influence")}</span>
                  </div>
                </div>

                <div className="actions">
                  {dejaVisitee ? (
                    <div className="act">
                      <span className="h3">{traduire(locale, "villes.visiteeAujourdhui")}</span>
                      <p>{traduire(locale, "villes.revenirDemain")}</p>
                      <button className="btn" type="button" disabled>
                        {traduire(locale, "villes.dejaVisitee")}
                      </button>
                    </div>
                  ) : (
                    <form action={visiterVille} className="act">
                      <input type="hidden" name="villeId" value={c.id} />
                      <span className="h3">{traduire(locale, "villes.visiter")}</span>
                      <p>+1 {traduire(locale, "ville.population").toLowerCase()}</p>
                      <button className="btn primary" type="submit">
                        {traduire(locale, "villes.visiter")}
                      </button>
                    </form>
                  )}

                  <div className="act">
                    <span className="h3">{traduire(locale, "villes.influencer")}</span>
                    <p>
                      +1 {traduire(locale, "ville.influence").toLowerCase()} ·{" "}
                      <span className="counter">
                        {actionsInfluenceRestantes}/{QUOTA_INFLUENCE_QUOTIDIEN}
                      </span>
                    </p>
                    {dejaInfluencee || actionsInfluenceRestantes <= 0 || estEnGreve ? (
                      <button className="btn" type="button" disabled>
                        {traduire(locale, dejaInfluencee ? "villes.dejaInfluencee" : "villes.quotaAtteint")}
                      </button>
                    ) : (
                      <form action={influencerVille}>
                        <input type="hidden" name="villeId" value={c.id} />
                        <button className="btn" type="submit">
                          {traduire(locale, "villes.influencer")}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                <div className="section-title">
                  <h3 className="h3">{traduire(locale, "villes.antiVille")}</h3>
                  <span className="counter">
                    {QUOTA_ANTIVILLE_QUOTIDIEN - nbAntiVilleUtilisees}/{QUOTA_ANTIVILLE_QUOTIDIEN}
                  </span>
                </div>
                {protectionActive ? (
                  <p className="note">
                    <span className="badge warn">{traduire(locale, "villes.protegee")}</span>{" "}
                    {traduire(locale, "villes.protegeeNote")}
                  </p>
                ) : null}
                <ActionsAntiVille
                  locale={locale}
                  villeId={c.id}
                  protectionActive={protectionActive}
                  quotaAtteint={quotaAntiVilleAtteint}
                />
                <p className="note">{traduire(locale, "villes.pasDeDestruction")}</p>

                <div className="row">
                  {statutJum === "actif" ? (
                    <span className="badge good">{traduire(locale, "jumelages.jumeleeAvecTaVille")}</span>
                  ) : statutJum === "envoye" ? (
                    <span className="badge">{traduire(locale, "jumelages.demandeEnvoyee")}</span>
                  ) : statutJum === "recu" ? (
                    <Link href="/jumelages" className="btn small">
                      {traduire(locale, "jumelages.recues")}
                    </Link>
                  ) : (
                    <form action={proposerJumelage}>
                      <input type="hidden" name="villeId" value={c.id} />
                      <button className="btn small" type="submit" disabled={quotaJumelagesAtteint}>
                        {traduire(locale, "villes.proposerJumelage")}
                      </button>
                    </form>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      ) : null}
    </main>
  );
}
