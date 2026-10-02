import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, traduire } from "@/lib/i18n";
import { libelleNiveau, progressionNiveau } from "@/lib/game/niveauVille";
import { ligneLocale } from "@/lib/game/ligneLocale";
import { activitesDisponibles, type Activite } from "@/lib/game/activites";
import { palierAttaques, type PalierAttaques } from "@/lib/game/antiville";
import { palierVisites, palierInfluence, type PalierPopularite, type PalierRenommee } from "@/lib/game/popularite";
import { palierJumelage } from "@/lib/game/jumelages";
import { nbMegaprojetsOuverts } from "@/lib/game/megaprojets";
import { typeMonument } from "@/lib/game/monuments";
import type { VocationsBlocs } from "@/lib/ville3d/generer";
import type { VocationQuartier } from "@/lib/ville3d/quartiers";
import type { MegaprojetConstruit, MonumentDebloque } from "@/lib/ville3d/terrain";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { exigerRegionChoisie } from "@/lib/supabase/gardes";
import { FiltreVilles } from "./FiltreVilles";
import { ActionsAntiVille } from "./ActionsAntiVille";
import { SincroniserScene } from "@/components/SincroniserScene";
import { PanneauFlottant } from "@/components/PanneauFlottant";
import { VisiteAutomatique } from "@/components/VisiteAutomatique";
import { JaugesActivites, EMOJI_ACTIVITE } from "@/components/JaugesActivites";
import { ChoisirActivite } from "@/components/ChoisirActivite";
import { BulletinMunicipal, type EvenementBulletin } from "@/components/BulletinMunicipal";
import { Megaprojets, type EtatMegaprojet } from "@/components/Megaprojets";
import { Technologies } from "@/components/Technologies";
import { Monuments } from "@/components/Monuments";
import { influencerVille, proposerJumelage } from "./actions";

const QUOTA_VISITE_QUOTIDIEN = 3;
const DELAI_VISITE_MINUTES = 60;
const GAIN_VISITE = 1;
const QUOTA_INFLUENCE_QUOTIDIEN = 5;
const QUOTA_ANTIVILLE_QUOTIDIEN = 3;
const QUOTA_JUMELAGES_ACTIFS = 3;
const PAYS_PAR_DEFAUT = { latitude: 46.6, longitude: 2.35, fuseauHoraire: "Europe/Paris" };

type LigneVille = {
  id: string;
  nom: string;
  population: number;
  population_max: number;
  niveau: number;
  influence: number;
  influence_max: number;
  greve_jusqua: string | null;
  recommandation_activite: Activite | null;
  theme: string;
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

  const colonneNomPays = locale === "fr" ? "nom_fr" : "nom_en";
  const maintenant = new Date();
  const aujourdhui = maintenant.toISOString().slice(0, 10);
  const ilUneHeureEnArriere = new Date(maintenant.getTime() - DELAI_VISITE_MINUTES * 60 * 1000).toISOString();

  // Chargement en vagues parallèles plutôt qu'une trentaine d'allers-retours
  // Supabase à la suite (≈100-400 ms chacun, voir DECISIONS.md §4, journal
  // « Rapidité de /ville et /villes »). L'ordre RELATIF des écritures
  // opportunistes et des lectures qui les consomment est celui d'origine ;
  // seul ce qui est indépendant est lancé ensemble.
  //
  // Vague 1 — tout ce qui ne dépend que de l'utilisateur : profil, garde
  // de région/noms (voir gardes.ts : « à appeler après avoir vérifié que
  // le profil existe », or sans profil elle ne redirige jamais — le test
  // `!profil` ci-dessous garde donc la priorité), liste des villes, pays
  // et les quotas/historiques du jour.
  // Jalon 13 bis : jusqu'à QUOTA_VISITE_QUOTIDIEN visites par jour et par
  // (visiteur, ville), avec un délai minimum entre deux visites de la
  // même ville — deux requêtes séparées, comme pour les actions AntiVille
  // (compteur du jour + fenêtre récente pour la protection).
  const [
    { data: profil },
    { data, error: erreurListe },
    { data: listePays },
    { data: visitesRecentes },
    { data: visitesDuJour },
    { data: actionsInfluenceDuJour },
    { data: actionsAntiVilleAujourdhui },
  ] = await Promise.all([
    supabase.from("users").select("id, city_id").eq("id", user.id).maybeSingle(),
    supabase
      .from("cities")
      .select(
        `id, nom, population, population_max, niveau, influence, influence_max, greve_jusqua, recommandation_activite, theme, country_id, pays:countries(nom:${colonneNomPays}, latitude, longitude, fuseau_horaire), owner:users!cities_owner_id_fkey(pseudo)`
      )
      .order("population", { ascending: false }),
    supabase.from("countries").select(`id, nom:${colonneNomPays}`).order(colonneNomPays),
    supabase
      .from("visites")
      .select("ville_id, created_at")
      .eq("visiteur_id", user.id)
      .gte("created_at", ilUneHeureEnArriere),
    supabase.from("visites").select("ville_id").eq("visiteur_id", user.id).eq("jour", aujourdhui),
    supabase.from("actions_influence").select("ville_id").eq("joueur_id", user.id).eq("jour", aujourdhui),
    supabase.from("actions_antiville").select("ville_id").eq("attaquant_id", user.id).eq("jour", aujourdhui),
    exigerRegionChoisie(supabase, user.id),
  ]);

  if (!profil) {
    redirect("/ville/creer");
  }
  const maVilleId = profil!.city_id as string;

  if (erreurListe) console.error("Chargement des villes a échoué :", erreurListe.message);
  const toutesLesVilles = (data ?? []) as LigneVille[];

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

  const derniereVisiteParVille = new Map<string, string>();
  for (const v of visitesRecentes ?? []) {
    const existante = derniereVisiteParVille.get(v.ville_id);
    if (!existante || v.created_at > existante) derniereVisiteParVille.set(v.ville_id, v.created_at);
  }

  const nbVisitesAujourdhuiParVille = new Map<string, number>();
  for (const v of visitesDuJour ?? []) {
    nbVisitesAujourdhuiParVille.set(v.ville_id, (nbVisitesAujourdhuiParVille.get(v.ville_id) ?? 0) + 1);
  }
  const villesIndisponibles = new Set(
    toutesLesVilles
      .map((v) => v.id)
      .filter(
        (id) =>
          derniereVisiteParVille.has(id) || (nbVisitesAujourdhuiParVille.get(id) ?? 0) >= QUOTA_VISITE_QUOTIDIEN
      )
  );

  const villesDejaInfluencees = new Set((actionsInfluenceDuJour ?? []).map((a) => a.ville_id));
  const actionsInfluenceRestantes = QUOTA_INFLUENCE_QUOTIDIEN - villesDejaInfluencees.size;

  const nbAntiVilleUtilisees = (actionsAntiVilleAujourdhui ?? []).length;
  const quotaAntiVilleAtteint = nbAntiVilleUtilisees >= QUOTA_ANTIVILLE_QUOTIDIEN;

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

  // Réponse neutre pour les lectures sans objet (pas de ville sélectionnée,
  // pas de ville à afficher...) : garde les Promise.all à plat.
  const vide = Promise.resolve({ data: null, count: null });
  const ilCinqMinutes = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  // Vague 2 — pour la ville du panneau détail (`villeSelectionnee`) et/ou la
  // ville affichée en 3D (celle du panneau, sinon « Ma ville »), toujours la
  // même quand une ville est sélectionnée :
  //  - lectures qui doivent voir l'état AVANT les écritures de la vague 4 :
  //    les jauges (l'Énergie dépend des mégaprojets construits), la liste
  //    des villes déjà lue plus haut (population avant la manifestation) ;
  //  - lectures sans lien avec les écritures opportunistes (jumelages,
  //    activité de la dernière visite, paliers du jour, points de Recherche
  //    — un simple comptage de visites) ;
  //  - verifier_manifestation (Jalon 18 : tirage quotidien, même logique
  //    opportuniste que verifier_president(), Jalon 11 : pas de tâche
  //    planifiée dans ce projet) : elle doit précéder avancer_megaprojets
  //    (ordre d'origine) et la lecture du bulletin ;
  //  - assigner_vocations_blocs (Jalon 19) : indépendante de tout le reste.
  const [
    { data: mesJumelages },
    { data: jaugesBrutes },
    { data: pointsBruts },
    { data: derniereVisiteActivite },
    { data: nbAttaques },
    { data: nbVisitesRecues },
    { data: nbInfluenceRecue },
  ] = await Promise.all([
    supabase
      .from("jumelages")
      .select("id, ville_proposante_id, ville_ciblee_id, statut")
      .or(`ville_proposante_id.eq.${maVilleId},ville_ciblee_id.eq.${maVilleId}`)
      .in("statut", ["en_attente", "actif"]),
    // Jalon 17 (docs/SYSTEME-DEVELOPPEMENT.md §9 point 1) : les 7 jauges
    // de développement de la ville affichée.
    villeAffichee3D ? supabase.rpc("jauges_ville", { p_ville_id: villeAffichee3D.id }) : vide,
    villeAffichee3D
      ? supabase.rpc("stock_ville", { p_ville_id: villeAffichee3D.id, p_activite: "recherche" })
      : vide,
    // Activité de la dernière visite du joueur (si récente — fenêtre de
    // grâce de 5 minutes, cohérente avec choisir_activite_visite() côté
    // SQL) pour proposer de la changer.
    villeSelectionnee
      ? supabase
          .from("visites")
          .select("activite, activite_verrouillee")
          .eq("visiteur_id", user.id)
          .eq("ville_id", villeSelectionnee.id)
          .gte("created_at", ilCinqMinutes)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : vide,
    // Jalon 18 : palier d'attaques du jour ; Jalon 22 (docs/DECISIONS.md §10
    // point 22) : paliers de popularité/renommée, affichage seulement.
    villeSelectionnee
      ? supabase.rpc("attaques_recues_aujourdhui", { p_ville_id: villeSelectionnee.id })
      : vide,
    villeSelectionnee
      ? supabase.rpc("visites_recues_aujourdhui", { p_ville_id: villeSelectionnee.id })
      : vide,
    villeSelectionnee
      ? supabase.rpc("actions_influence_recues_aujourdhui", { p_ville_id: villeSelectionnee.id })
      : vide,
    villeSelectionnee ? supabaseAdmin.rpc("verifier_manifestation", { p_ville_id: villeSelectionnee.id }) : vide,
    villeAffichee3D ? supabaseAdmin.rpc("assigner_vocations_blocs", { p_ville_id: villeAffichee3D.id }) : vide,
  ]);

  const statutJumelageParVille = new Map<string, "actif" | "envoye" | "recu">();
  const jumelageIdParVille = new Map<string, string>();
  let nbJumelagesActifs = 0;
  for (const j of mesJumelages ?? []) {
    const autreVilleId = j.ville_proposante_id === maVilleId ? j.ville_ciblee_id : j.ville_proposante_id;
    if (j.statut === "actif") {
      statutJumelageParVille.set(autreVilleId, "actif");
      jumelageIdParVille.set(autreVilleId, j.id);
      nbJumelagesActifs++;
    } else {
      statutJumelageParVille.set(
        autreVilleId,
        j.ville_proposante_id === maVilleId ? "envoye" : "recu"
      );
    }
  }
  const quotaJumelagesAtteint = nbJumelagesActifs >= QUOTA_JUMELAGES_ACTIFS;

  const jauges = (jaugesBrutes ?? []) as { activite: Activite; elan: number; jauge: number }[];
  const elanEnergie3D = jauges.find((j) => j.activite === "energie")?.elan ?? 0;
  const pointsRecherche3D = typeof pointsBruts === "number" ? pointsBruts : 0;
  const activiteActuelle = (derniereVisiteActivite?.activite ?? null) as Activite | null;
  const activiteVerrouillee = derniereVisiteActivite?.activite_verrouillee ?? false;
  const palierAttaquesVille: PalierAttaques = palierAttaques(typeof nbAttaques === "number" ? nbAttaques : 0);
  const palierVisitesVille: PalierPopularite = palierVisites(typeof nbVisitesRecues === "number" ? nbVisitesRecues : 0);
  const palierInfluenceVille: PalierRenommee = palierInfluence(typeof nbInfluenceRecue === "number" ? nbInfluenceRecue : 0);

  // Jalon 20 (docs/SYSTEME-DEVELOPPEMENT.md §6, docs/A-INTEGRER.md §19) :
  // construit les mégaprojets financés, débloque les technologies et les
  // monuments déjà atteints (opportuniste, même logique qu'au-dessus ; les
  // trois sont indépendants entre eux). Elles écrivent dans city_events :
  // avec une ville sélectionnée, le bulletin ci-dessous est lu AVANT (ordre
  // d'origine : leurs événements n'y apparaissent qu'au chargement suivant)
  // et elles ne partent qu'ensuite ; sans ville sélectionnée il n'y a pas
  // de bulletin, elles partent avec le reste.
  const avancerVilleAffichee = () =>
    villeAffichee3D
      ? Promise.all([
          supabaseAdmin.rpc("avancer_megaprojets", { p_ville_id: villeAffichee3D.id }),
          supabaseAdmin.rpc("avancer_technologies", { p_ville_id: villeAffichee3D.id }),
          supabaseAdmin.rpc("avancer_monuments", { p_ville_id: villeAffichee3D.id }),
        ])
      : Promise.resolve([]);

  // Vague 3 — jours de bonus des jumelages actifs (dépend de la vague 2),
  // blocs écrits par assigner_vocations_blocs, bulletin municipal de la
  // ville du panneau détail.
  const [{ data: joursBonusBruts }, { data: blocsBruts }, { data: evenements }] = await Promise.all([
    // Jalon 22 (docs/DECISIONS.md §10 point 22) : palier de solidité de
    // chaque jumelage actif, dérivé du cumul de jours où son bonus a déjà
    // été accordé — affichage seulement, aucun effet ajouté.
    nbJumelagesActifs > 0 ? supabase.rpc("jours_bonus_jumelages_ville", { p_ville_id: maVilleId }) : vide,
    // Jalon 19 (docs/SYSTEME-DEVELOPPEMENT.md §7) : vocation des blocs déjà
    // ouverts, pour le rendu 3D.
    villeAffichee3D
      ? supabase.from("city_blocks").select("rang, vocation").eq("ville_id", villeAffichee3D.id)
      : vide,
    villeSelectionnee
      ? supabase
          .from("city_events")
          .select("id, type, activite, type_action, valeur, created_at")
          .eq("ville_id", villeSelectionnee.id)
          .order("created_at", { ascending: false })
          .limit(8)
      : vide,
    villeSelectionnee ? Promise.resolve([]) : avancerVilleAffichee(),
  ]);
  const evenementsBulletin = (evenements ?? []) as EvenementBulletin[];

  const joursBonusParJumelage = new Map<string, number>();
  for (const ligne of (joursBonusBruts ?? []) as { jumelage_id: string; jours: number }[]) {
    joursBonusParJumelage.set(ligne.jumelage_id, ligne.jours);
  }

  const vocations3D: VocationsBlocs = new Map(
    (blocsBruts ?? []).map((b: { rang: number; vocation: string }) => [b.rang, b.vocation as VocationQuartier])
  );

  // Vague 4 — avec une ville sélectionnée, les écritures de mégaprojets,
  // technologies et monuments partent maintenant (voir plus haut).
  if (villeSelectionnee) await avancerVilleAffichee();

  // Vague 5 — lecture de ce que la vague 4 a écrit : état de tous les
  // chantiers, technologies et monuments débloqués, pour la ville affichée
  // en 3D (catalogue des monuments fini et connu côté client,
  // monuments.ts : une simple liste suffit).
  const [{ data: megaprojetsBruts }, { count: nbTechnologiesBrut }, { data: monumentsBruts }] =
    await Promise.all([
      villeAffichee3D ? supabase.rpc("etat_megaprojets", { p_ville_id: villeAffichee3D.id }) : vide,
      villeAffichee3D
        ? supabase.from("technologies").select("id", { count: "exact", head: true }).eq("ville_id", villeAffichee3D.id)
        : vide,
      villeAffichee3D ? supabase.from("monuments").select("palier").eq("ville_id", villeAffichee3D.id) : vide,
    ]);

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
  const megaprojetsConstruits: MegaprojetConstruit[] = chantiers
    .filter((c) => c.statut === "construit")
    .map((c) => ({ palier: c.palier, type: c.type, activite: c.activite }));

  const nbTechnologiesDebloquees3D = nbTechnologiesBrut ?? 0;
  const nbMonumentsDebloques3D = monumentsBruts?.length ?? 0;
  const monumentsDebloques3D: MonumentDebloque[] = [];
  for (const m of monumentsBruts ?? []) {
    const type = typeMonument(m.palier as number);
    if (type) monumentsDebloques3D.push({ palier: m.palier as number, type });
  }

  return (
    <main className={`screen${villeSelectionnee ? " detail" : ""}`} aria-label={traduire(locale, "villes.titre")}>
      {villeAffichee3D ? (
        <SincroniserScene
          seed={villeAffichee3D.id}
          populationMax={villeAffichee3D.population_max}
          pays={pays3D}
          vocations={vocations3D}
          elanEnergie={elanEnergie3D}
          megaprojets={megaprojetsConstruits}
          nbTechnologies={nbTechnologiesDebloquees3D}
          monuments={monumentsDebloques3D}
          theme={villeAffichee3D.theme}
        />
      ) : null}

      <PanneauFlottant locale={locale} className="dock dock-float dock-left">
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
                      {villesIndisponibles.has(v.id) ? (
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
      </PanneauFlottant>

      {villeSelectionnee ? (
        <PanneauFlottant locale={locale} className="dock dock-float dock-right" ariaLabel={traduire(locale, "villes.enVisite")}>
          {(() => {
            const c = villeSelectionnee;
            const pseudo = unwrap(c.owner)?.pseudo ?? "";
            const nbVisitesAujourdhui = nbVisitesAujourdhuiParVille.get(c.id) ?? 0;
            const plafondVisiteAtteint = nbVisitesAujourdhui >= QUOTA_VISITE_QUOTIDIEN;
            const derniereVisite = derniereVisiteParVille.get(c.id);
            const minutesAvantRevisite = derniereVisite
              ? Math.max(
                  1,
                  Math.ceil(
                    (new Date(derniereVisite).getTime() + DELAI_VISITE_MINUTES * 60 * 1000 - maintenant.getTime()) /
                      60_000
                  )
                )
              : null;
            const dejaInfluencee = villesDejaInfluencees.has(c.id);
            const estEnGreve = !!c.greve_jusqua && new Date(c.greve_jusqua) > maintenant;
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
                <p className="note">
                  {c.recommandation_activite ? (
                    <>
                      <span className="badge info">
                        {EMOJI_ACTIVITE[c.recommandation_activite]} {traduire(locale, "activite.recommandation")}{" "}
                        {traduire(locale, `activite.${c.recommandation_activite}`)}
                      </span>
                    </>
                  ) : (
                    traduire(locale, "activite.recommandationAucune")
                  )}
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

                <JaugesActivites locale={locale} jauges={jauges} />
                <ChoisirActivite
                  locale={locale}
                  villeId={c.id}
                  activiteActuelle={activiteActuelle}
                  verrouillee={activiteVerrouillee}
                  activitesDisponibles={activitesDisponibles(c.niveau)}
                />
                <Megaprojets
                  locale={locale}
                  villeId={c.id}
                  estMaire={c.id === maVilleId}
                  nbOuverts={nbMegaprojetsOuverts(c.population_max)}
                  chantiers={etatMegaprojets}
                />
                <Technologies
                  locale={locale}
                  paliersDebloques={nbTechnologiesDebloquees3D}
                  pointsRecherche={pointsRecherche3D}
                />
                <Monuments locale={locale} paliersDebloques={nbMonumentsDebloques3D} influenceMax={c.influence_max} />

                <div className="actions">
                  <div className="act">
                    <span className="h3">{traduire(locale, "villes.visiter")}</span>
                    <p>
                      +{GAIN_VISITE} {traduire(locale, "ville.population").toLowerCase()} ·{" "}
                      <span className="counter">
                        {nbVisitesAujourdhui}/{QUOTA_VISITE_QUOTIDIEN}
                      </span>
                    </p>
                    {palierVisitesVille !== "calme" ? (
                      <p className="note">
                        <span className="badge">{traduire(locale, `popularite.palier.${palierVisitesVille}`)}</span>
                      </p>
                    ) : null}
                    {plafondVisiteAtteint ? (
                      <p className="note">{traduire(locale, "villes.quotaAtteint")}</p>
                    ) : minutesAvantRevisite !== null ? (
                      <p className="note">
                        {traduire(locale, "villes.revisiterDans")} {minutesAvantRevisite} min
                      </p>
                    ) : (
                      <VisiteAutomatique locale={locale} villeId={c.id} peutVisiter />
                    )}
                  </div>

                  <div className="act">
                    <span className="h3">{traduire(locale, "villes.influencer")}</span>
                    <p>
                      +1 {traduire(locale, "ville.influence").toLowerCase()} ·{" "}
                      <span className="counter">
                        {actionsInfluenceRestantes}/{QUOTA_INFLUENCE_QUOTIDIEN}
                      </span>
                    </p>
                    {palierInfluenceVille !== "calme" ? (
                      <p className="note">
                        <span className="badge">{traduire(locale, `renommee.palier.${palierInfluenceVille}`)}</span>
                      </p>
                    ) : null}
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
                {palierAttaquesVille !== "calme" ? (
                  <p className="note">
                    <span className="badge warn">
                      {traduire(locale, "villes.antiVillePalier")} {traduire(locale, `villes.palier.${palierAttaquesVille}`)}
                    </span>
                  </p>
                ) : null}
                <ActionsAntiVille locale={locale} villeId={c.id} quotaAtteint={quotaAntiVilleAtteint} />
                <p className="note">{traduire(locale, "villes.pasDeDestruction")}</p>
                <BulletinMunicipal locale={locale} evenements={evenementsBulletin} />

                <div className="row">
                  {statutJum === "actif" ? (
                    <>
                      <span className="badge good">{traduire(locale, "jumelages.jumeleeAvecTaVille")}</span>
                      <span className="badge">
                        {traduire(
                          locale,
                          `jumelages.palier.${palierJumelage(joursBonusParJumelage.get(jumelageIdParVille.get(c.id) ?? "") ?? 0)}`
                        )}
                      </span>
                    </>
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
        </PanneauFlottant>
      ) : null}
    </main>
  );
}
