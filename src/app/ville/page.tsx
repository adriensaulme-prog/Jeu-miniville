import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, traduire } from "@/lib/i18n";
import { progressionNiveau, libelleNiveau } from "@/lib/game/niveauVille";
import { ligneLocale } from "@/lib/game/ligneLocale";
import { ordinal } from "@/lib/game/ordinal";
import { ACTIVITES, activitesDisponibles, type Activite } from "@/lib/game/activites";
import { palierAttaques } from "@/lib/game/antiville";
import { palierVisites, palierInfluence } from "@/lib/game/popularite";
import { nbMegaprojetsOuverts } from "@/lib/game/megaprojets";
import type { VocationsBlocs } from "@/lib/ville3d/generer";
import type { VocationQuartier } from "@/lib/ville3d/quartiers";
import { typeMonument } from "@/lib/game/monuments";
import type { MegaprojetConstruit, MonumentDebloque } from "@/lib/ville3d/terrain";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { SincroniserScene } from "@/components/SincroniserScene";
import { PanneauFlottant } from "@/components/PanneauFlottant";
import { VisiteAutomatique } from "@/components/VisiteAutomatique";
import { JaugesActivites, EMOJI_ACTIVITE } from "@/components/JaugesActivites";
import { ChoisirActivite } from "@/components/ChoisirActivite";
import { BulletinMunicipal, type EvenementBulletin } from "@/components/BulletinMunicipal";
import { Megaprojets, type EtatMegaprojet } from "@/components/Megaprojets";
import { Technologies } from "@/components/Technologies";
import { Monuments } from "@/components/Monuments";
import { definirRecommandation, definirTheme } from "@/app/villes/actions";
import { THEMES } from "@/lib/game/themes";

// Repli si le pays de la ville n'a pas encore de géo/fuseau renseignés
// (quelques territoires ISO 3166-1 sur 250 — voir DECISIONS.md §4,
// Jalon 6). Mêmes valeurs que le prototype par défaut (France).
const PAYS_PAR_DEFAUT = { latitude: 46.6, longitude: 2.35, fuseauHoraire: "Europe/Paris" };
const QUOTA_VISITE_QUOTIDIEN = 3;
const DELAI_VISITE_MINUTES = 60;
const GAIN_VISITE = 1;

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
    influence_max: number;
    activite: number;
    recommandation_activite: Activite | null;
    theme: string;
    country_id: string;
    region_id: string | null;
    pays:
      | { nom: string; latitude: number | null; longitude: number | null; fuseau_horaire: string | null }
      | { nom: string; latitude: number | null; longitude: number | null; fuseau_horaire: string | null }[]
      | null;
    region: { nom: string } | { nom: string }[] | null;
  };

  const colonneNomPays = locale === "fr" ? "nom_fr" : "nom_en";
  const { data, error: erreurVille } = await supabase
    .from("cities")
    .select(
      `id, nom, population, population_max, influence, influence_max, activite, recommandation_activite, theme, country_id, region_id, pays:countries(nom:${colonneNomPays}, latitude, longitude, fuseau_horaire), region:regions(nom:${colonneNomPays})`
    )
    .eq("owner_id", user.id)
    .maybeSingle();
  const ville = data as LigneVille | null;

  // Ne rediriger vers /ville/creer que si la ville n'existe vraiment
  // pas (data et error tous les deux vides) : une vraie erreur de
  // requête (ex. colonne pas encore migrée) ne doit jamais être confondue
  // avec "pas de ville", sous peine de boucle de redirection avec
  // /ville/creer (qui renvoie ici dès qu'un profil existe).
  if (erreurVille) {
    console.error("Chargement de Ma ville a échoué :", erreurVille.message);
  }
  if (!ville && !erreurVille) {
    redirect("/ville/creer");
  }
  if (!ville) {
    return (
      <main className="screen" aria-label={traduire(locale, "villes.maVille")}>
        <p className="note">{traduire(locale, "erreurs.generique")}</p>
      </main>
    );
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

  // Chargement en 4 vagues parallèles plutôt qu'une vingtaine d'allers-retours
  // Supabase à la suite (≈100-400 ms chacun, voir DECISIONS.md §4, journal
  // « Rapidité de /ville et /villes »). L'ordre RELATIF des écritures
  // opportunistes et des lectures qui les consomment est celui d'origine ;
  // seul ce qui est indépendant est lancé ensemble :
  //
  //  - vague 1 : lectures qui doivent voir l'état AVANT toute écriture
  //    opportuniste (population/rang avant verifier_manifestation, jauges
  //    avant avancer_megaprojets dont l'Énergie dépend) + lectures sans
  //    lien avec elles (visites, paliers du jour) + verifier_president
  //    (lit les populations, donc avant la manifestation, qui les modifie) ;
  //  - vague 2 : assigner_vocations_blocs, avancer_megaprojets,
  //    avancer_technologies, avancer_monuments (mutuellement indépendantes :
  //    tables distinctes, aucune ne lit ce que les autres écrivent) ;
  //  - vague 3 : verifier_manifestation (lit les mégaprojets construits :
  //    Stade, centrales) et les lectures qui consomment les écritures de la
  //    vague 2 (blocs, mégaprojets, technologies, monuments) ;
  //  - vague 4 : le bulletin municipal, qui lit city_events, écrit par la
  //    manifestation, les mégaprojets, les technologies et les monuments.
  const maintenant = new Date();
  const aujourdhui = maintenant.toISOString().slice(0, 10);
  const ilCinqMinutes = new Date(maintenant.getTime() - 5 * 60 * 1000).toISOString();
  // Auto-visite de sa propre ville (Jalon 13 ter, docs/A-INTEGRER.md
  // §16) : même délai d'une heure et plafond de 3/jour que pour visiter
  // une autre ville (Jalon 13 bis), même compteur (visiteur_id,
  // ville_id) — ici les deux valent l'id du joueur et de sa ville.
  const ilUneHeureEnArriere = new Date(maintenant.getTime() - DELAI_VISITE_MINUTES * 60 * 1000).toISOString();

  const [
    { count: nbVillesDevant },
    { data: activiteVecue },
    { data: jaugesBrutes },
    { data: derniereVisiteActivite },
    { data: nbAttaques },
    { data: nbVisitesRecues },
    { data: nbInfluenceRecue },
    { data: pointsRechercheBruts },
    { data: mesVisitesRecentes },
    { count: nbVisitesAujourdhui },
  ] = await Promise.all([
    supabase
      .from("cities")
      .select("id", { count: "exact", head: true })
      .eq("country_id", ville.country_id)
      .gt("population", ville.population),
    // Activité (7j) calculée à la volée (Jalon 9) : la colonne
    // cities.activite n'a jamais eu de vraie définition (toujours 0 pour
    // une ville réelle, voir DECISIONS.md §4, journal du Jalon 9).
    supabase.rpc("activite_ville", { p_ville_id: ville.id }),
    // Jalon 17 (docs/SYSTEME-DEVELOPPEMENT.md §9 point 1) : les 7 jauges
    // de développement de sa propre ville.
    supabase.rpc("jauges_ville", { p_ville_id: ville.id }),
    supabase
      .from("visites")
      .select("activite, activite_verrouillee")
      .eq("visiteur_id", user.id)
      .eq("ville_id", ville.id)
      .gte("created_at", ilCinqMinutes)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Jalon 18 : attaques reçues aujourd'hui, pour le palier affiché.
    supabase.rpc("attaques_recues_aujourdhui", { p_ville_id: ville.id }),
    // Jalon 22 (docs/DECISIONS.md §10 point 22) : paliers de
    // popularité/renommée, affichage seulement — aucun plafond ajouté.
    supabase.rpc("visites_recues_aujourdhui", { p_ville_id: ville.id }),
    supabase.rpc("actions_influence_recues_aujourdhui", { p_ville_id: ville.id }),
    // Points de Recherche déjà accumulés (Jalon 20 2/3) : un simple
    // comptage de visites, que avancer_technologies() ne modifie pas.
    supabase.rpc("stock_ville", { p_ville_id: ville.id, p_activite: "recherche" }),
    supabase
      .from("visites")
      .select("created_at")
      .eq("visiteur_id", user.id)
      .eq("ville_id", ville.id)
      .gte("created_at", ilUneHeureEnArriere),
    supabase
      .from("visites")
      .select("id", { count: "exact", head: true })
      .eq("visiteur_id", user.id)
      .eq("ville_id", ville.id)
      .eq("jour", aujourdhui),
    // Tient à jour l'historique des présidences (Jalon 11) — idempotente,
    // sans effet si la ville n°1 du pays n'a pas changé depuis le dernier
    // appel. Le badge "Président" ci-dessous reste calculé en direct sur
    // le rang (toujours exact) ; cette table ne sert qu'à retenir
    // "depuis quand" et les mandats précédents (voir DECISIONS.md §4,
    // Jalon 11). Résultat non lu ici.
    supabaseAdmin.rpc("verifier_president", { p_country_id: ville.country_id }),
  ]);
  const rang = (nbVillesDevant ?? 0) + 1;
  const president = rang === 1;

  const activite = typeof activiteVecue === "number" ? activiteVecue : ville.activite;

  const progression = progressionNiveau(ville.population_max);
  const nomNiveauSuivant =
    progression.seuilSuivant != null ? libelleNiveau(progression.niveau + 1, locale) : null;

  const jauges = (jaugesBrutes ?? []) as { activite: Activite; elan: number; jauge: number }[];
  const activitesDeCetteVille = activitesDisponibles(progression.niveau);
  const elanEnergie = jauges.find((j) => j.activite === "energie")?.elan ?? 0;

  const activiteActuelle = (derniereVisiteActivite?.activite ?? null) as Activite | null;
  const activiteVerrouillee = derniereVisiteActivite?.activite_verrouillee ?? false;
  const palierAttaquesVille = palierAttaques(typeof nbAttaques === "number" ? nbAttaques : 0);
  const palierVisitesVille = palierVisites(typeof nbVisitesRecues === "number" ? nbVisitesRecues : 0);
  const palierInfluenceVille = palierInfluence(typeof nbInfluenceRecue === "number" ? nbInfluenceRecue : 0);
  const pointsRecherche = typeof pointsRechercheBruts === "number" ? pointsRechercheBruts : 0;

  const derniereVisite = (mesVisitesRecentes ?? []).reduce<string | null>(
    (max, v) => (!max || v.created_at > max ? v.created_at : max),
    null
  );
  const minutesAvantRevisite = derniereVisite
    ? Math.max(
        1,
        Math.ceil((new Date(derniereVisite).getTime() + DELAI_VISITE_MINUTES * 60 * 1000 - maintenant.getTime()) / 60_000)
      )
    : null;
  const plafondVisiteAtteint = (nbVisitesAujourdhui ?? 0) >= QUOTA_VISITE_QUOTIDIEN;

  // Vague 2 — écritures opportunistes, indépendantes entre elles :
  //  - Jalon 19 (docs/SYSTEME-DEVELOPPEMENT.md §7) : vocation des blocs
  //    déjà ouverts, lue ensuite pour le rendu 3D ;
  //  - Jalon 20 (1/3, §6) : construit les mégaprojets financés ;
  //  - Jalon 20 (2/3, §6) : débloque les technologies déjà financées ;
  //  - Jalon 20 (3/3, docs/A-INTEGRER.md §19) : débloque les monuments
  //    déjà atteints.
  await Promise.all([
    supabaseAdmin.rpc("assigner_vocations_blocs", { p_ville_id: ville.id }),
    supabaseAdmin.rpc("avancer_megaprojets", { p_ville_id: ville.id }),
    supabaseAdmin.rpc("avancer_technologies", { p_ville_id: ville.id }),
    supabaseAdmin.rpc("avancer_monuments", { p_ville_id: ville.id }),
  ]);

  // Vague 3 — tirage quotidien de manifestation (Jalon 18, opportuniste,
  // comme verifier_president ci-dessus ; après avancer_megaprojets, dont
  // le Stade réduit les pertes) et lecture de ce que la vague 2 a écrit.
  // Catalogue des monuments fini et connu côté client (monuments.ts) :
  // pas besoin d'une fonction de lecture dédiée, une simple liste suffit.
  const [
    { data: blocsBruts },
    { data: megaprojetsBruts },
    { count: nbTechnologiesDebloquees },
    { data: monumentsBruts },
  ] = await Promise.all([
    supabase.from("city_blocks").select("rang, vocation").eq("ville_id", ville.id),
    supabase.rpc("etat_megaprojets", { p_ville_id: ville.id }),
    supabase.from("technologies").select("id", { count: "exact", head: true }).eq("ville_id", ville.id),
    supabase.from("monuments").select("palier").eq("ville_id", ville.id),
    supabaseAdmin.rpc("verifier_manifestation", { p_ville_id: ville.id }),
  ]);

  // Vague 4 — bulletin municipal de sa propre ville : les attaques reçues
  // et l'éventuelle manifestation valent aussi d'être vues sur "Ma ville",
  // pas seulement en visitant.
  const { data: evenements } = await supabase
    .from("city_events")
    .select("id, type, activite, type_action, valeur, created_at")
    .eq("ville_id", ville.id)
    .order("created_at", { ascending: false })
    .limit(8);
  const evenementsBulletin = (evenements ?? []) as EvenementBulletin[];

  const vocations: VocationsBlocs = new Map(
    (blocsBruts ?? []).map((b) => [b.rang as number, b.vocation as VocationQuartier])
  );

  const chantiers = (megaprojetsBruts ?? []) as {
    palier: number;
    type: string;
    activite: string;
    statut: "en_chantier" | "construit";
    points: number;
    cout_points: number;
    materiaux: number;
    cout_materiaux: number;
    revenus: number;
    cout_revenus: number;
  }[];
  const etatMegaprojets: EtatMegaprojet[] = chantiers.map((c) => ({
    palier: c.palier,
    type: c.type as EtatMegaprojet["type"],
    activite: c.activite,
    statut: c.statut,
    points: c.points,
    coutPoints: c.cout_points,
    materiaux: c.materiaux,
    coutMateriaux: c.cout_materiaux,
    revenus: c.revenus,
    coutRevenus: c.cout_revenus,
  }));
  const nbMegaprojetsDebloques = nbMegaprojetsOuverts(ville.population_max);
  const megaprojetsConstruits: MegaprojetConstruit[] = chantiers
    .filter((c) => c.statut === "construit")
    .map((c) => ({ palier: c.palier, type: c.type, activite: c.activite }));

  const nbMonumentsDebloquesVille = monumentsBruts?.length ?? 0;
  const monumentsDebloques: MonumentDebloque[] = [];
  for (const m of monumentsBruts ?? []) {
    const type = typeMonument(m.palier as number);
    if (type) monumentsDebloques.push({ palier: m.palier as number, type });
  }

  const stats: Array<{ cle: "ville.population" | "ville.influence" | "ville.activite"; valeur: number }> = [
    { cle: "ville.population", valeur: ville.population },
    { cle: "ville.influence", valeur: ville.influence },
    { cle: "ville.activite", valeur: activite },
  ];

  return (
    <main className="screen" aria-label={traduire(locale, "villes.maVille")}>
      <SincroniserScene
        seed={ville.id}
        populationMax={ville.population_max}
        pays={pays}
        vocations={vocations}
        elanEnergie={elanEnergie}
        megaprojets={megaprojetsConstruits}
        nbTechnologies={nbTechnologiesDebloquees ?? 0}
        monuments={monumentsDebloques}
        theme={ville.theme}
      />
      <PanneauFlottant locale={locale} className="dock dock-float dock-left">
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
        <form action={definirRecommandation} className="row">
          <input type="hidden" name="villeId" value={ville.id} />
          <label className="field" style={{ flex: 1 }}>
            <span>{traduire(locale, "activite.recommandation")}</span>
            <select name="activite" className="select" defaultValue={ville.recommandation_activite ?? ""}>
              <option value="">{traduire(locale, "activite.aucuneRecommandation")}</option>
              {ACTIVITES.filter((a) => activitesDeCetteVille.includes(a)).map((a) => (
                <option key={a} value={a}>
                  {EMOJI_ACTIVITE[a]} {traduire(locale, `activite.${a}`)}
                </option>
              ))}
            </select>
          </label>
          <button className="btn small" type="submit">
            {traduire(locale, "activite.definirRecommandation")}
          </button>
        </form>
        <form action={definirTheme} className="row">
          <input type="hidden" name="villeId" value={ville.id} />
          <label className="field" style={{ flex: 1 }}>
            <span>{traduire(locale, "theme.titre")}</span>
            <select name="theme" className="select" defaultValue={ville.theme}>
              {THEMES.map((t) => (
                <option key={t} value={t}>
                  {traduire(locale, `theme.${t}`)}
                </option>
              ))}
            </select>
          </label>
          <button className="btn small" type="submit">
            {traduire(locale, "theme.appliquer")}
          </button>
        </form>
        <p className="note">
          {traduire(locale, "region.actuelle")} : {nomRegion} ·{" "}
          <Link href="/ville/region" style={{ color: "var(--focus)" }}>
            {traduire(locale, "region.changerBouton")}
          </Link>
        </p>
        <p className="note">
          <Link href="/pays" style={{ color: "var(--focus)" }}>
            {traduire(locale, "pays.voirMonPays")} {nomPays} →
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
        <JaugesActivites locale={locale} jauges={jauges} />
        <ChoisirActivite
          locale={locale}
          villeId={ville.id}
          activiteActuelle={activiteActuelle}
          verrouillee={activiteVerrouillee}
          activitesDisponibles={activitesDeCetteVille}
        />
        <Megaprojets
          locale={locale}
          villeId={ville.id}
          estMaire={true}
          nbOuverts={nbMegaprojetsDebloques}
          chantiers={etatMegaprojets}
        />
        <Technologies locale={locale} paliersDebloques={nbTechnologiesDebloquees ?? 0} pointsRecherche={pointsRecherche} />
        <Monuments locale={locale} paliersDebloques={nbMonumentsDebloquesVille} influenceMax={ville.influence_max} />
        <div className="act">
          <span className="h3">{traduire(locale, "villes.visiter")}</span>
          <p>
            +{GAIN_VISITE} {traduire(locale, "ville.population").toLowerCase()} ·{" "}
            <span className="counter">
              {nbVisitesAujourdhui ?? 0}/{QUOTA_VISITE_QUOTIDIEN}
            </span>
          </p>
          {plafondVisiteAtteint ? (
            <p className="note">{traduire(locale, "villes.quotaAtteint")}</p>
          ) : minutesAvantRevisite !== null ? (
            <p className="note">
              {traduire(locale, "villes.revisiterDans")} {minutesAvantRevisite} min
            </p>
          ) : (
            <VisiteAutomatique locale={locale} villeId={ville.id} peutVisiter />
          )}
        </div>
        {palierAttaquesVille !== "calme" ? (
          <p className="note">
            <span className="badge warn">
              {traduire(locale, "villes.antiVillePalier")} {traduire(locale, `villes.palier.${palierAttaquesVille}`)}
            </span>
          </p>
        ) : null}
        {palierVisitesVille !== "calme" || palierInfluenceVille !== "calme" ? (
          <p className="note">
            {palierVisitesVille !== "calme" ? (
              <span className="badge">{traduire(locale, `popularite.palier.${palierVisitesVille}`)}</span>
            ) : null}{" "}
            {palierInfluenceVille !== "calme" ? (
              <span className="badge">{traduire(locale, `renommee.palier.${palierInfluenceVille}`)}</span>
            ) : null}
          </p>
        ) : null}
        <BulletinMunicipal locale={locale} evenements={evenementsBulletin} />
      </PanneauFlottant>
    </main>
  );
}
