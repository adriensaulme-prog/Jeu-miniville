import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale, traduire } from "@/lib/i18n";
import { progressionNiveau, libelleNiveau } from "@/lib/game/niveauVille";
import { ligneLocale } from "@/lib/game/ligneLocale";
import { ordinal } from "@/lib/game/ordinal";
import type { Activite } from "@/lib/game/activites";
import { premierRangZone, type VocationsBlocs } from "@/lib/ville3d/generer";
import type { VocationQuartier } from "@/lib/ville3d/quartiers";
import { typeMonument } from "@/lib/game/monuments";
import type { MegaprojetConstruit, MonumentDebloque } from "@/lib/ville3d/terrain";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { SincroniserScene } from "@/components/SincroniserScene";
import { PanneauFlottant } from "@/components/PanneauFlottant";
import { BoutonPartager } from "@/components/BoutonPartager";
import {
  cheminPartage,
  evenementPartageable,
  libelleEvenement,
  type EvenementBulletin,
} from "@/components/evenements";

/**
 * Page publique d'une ville (docs/A-INTEGRER.md §26 C, cahier des charges
 * §24) : lecture seule, SANS connexion, partageable. `/v/<id>` montre la
 * ville ; `/v/<id>?evenement=<id>` met en avant un événement précis. Elle
 * ne lit que des données déjà publiques (RLS `lecture_publique`) et
 * n'écrit jamais rien — pas d'attribution opportuniste de vocations ou
 * de monuments ici, ce qui n'est pas encore calculé apparaît à la
 * prochaine visite du maire.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAYS_PAR_DEFAUT = { latitude: 46.6, longitude: 2.35, fuseauHoraire: "Europe/Paris" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ evenement?: string }>;
};

async function chargerVille(id: string, locale: "fr" | "en") {
  if (!UUID.test(id)) return null;
  const supabase = await createSupabaseServerClient();
  const colonneNomPays = locale === "fr" ? "nom_fr" : "nom_en";
  const { data } = await supabase
    .from("cities")
    .select(
      `id, nom, population, population_max, influence, niveau, theme, country_id, pays:countries(nom:${colonneNomPays}, latitude, longitude, fuseau_horaire), owner:users!cities_owner_id_fkey(pseudo)`
    )
    .eq("id", id)
    .maybeSingle();
  return data ? { supabase, ville: data } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();
  const charge = await chargerVille(id, locale);
  if (!charge) return { title: "jeu_miniville" };
  const nom = charge.ville.nom as string;
  const description = traduire(locale, "partage.descriptionMeta");
  return {
    title: `${nom} — jeu_miniville`,
    description,
    openGraph: { title: `${nom} — jeu_miniville`, description, type: "website", siteName: "jeu_miniville" },
  };
}

export default async function VillePubliquePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { evenement: evenementId } = await searchParams;
  const locale = await getLocale();
  const charge = await chargerVille(id, locale);
  if (!charge) notFound();
  const { supabase, ville } = charge;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let estMaVille = false;
  if (user) {
    const { data: profil } = await supabase.from("users").select("city_id").eq("id", user.id).maybeSingle();
    estMaVille = profil?.city_id === ville.id;
  }

  const paysBrut = Array.isArray(ville.pays) ? ville.pays[0] : ville.pays;
  const nomPays = paysBrut?.nom ?? "";
  const pays =
    paysBrut?.latitude != null && paysBrut?.longitude != null && paysBrut?.fuseau_horaire
      ? { latitude: paysBrut.latitude, longitude: paysBrut.longitude, fuseauHoraire: paysBrut.fuseau_horaire }
      : PAYS_PAR_DEFAUT;
  const pseudo = (Array.isArray(ville.owner) ? ville.owner[0] : ville.owner)?.pseudo ?? "";

  const { count: nbVillesDevant } = await supabase
    .from("cities")
    .select("id", { count: "exact", head: true })
    .eq("country_id", ville.country_id)
    .gt("population", ville.population);
  const rang = (nbVillesDevant ?? 0) + 1;

  // Données du rendu 3D : tables publiques en lecture seule (aucun calcul opportuniste).
  const { data: blocsBruts } = await supabase.from("city_blocks").select("rang, vocation, zonee").eq("ville_id", ville.id);
  const vocations: VocationsBlocs = new Map(
    (blocsBruts ?? []).map((b) => [b.rang as number, b.vocation as VocationQuartier])
  );
  const zonageDepuisRang = premierRangZone((blocsBruts ?? []) as { rang: number; zonee: boolean }[]);
  const { data: jaugesBrutes } = await supabase.rpc("jauges_ville", { p_ville_id: ville.id });
  const elanEnergie =
    ((jaugesBrutes ?? []) as { activite: Activite; elan: number }[]).find((j) => j.activite === "energie")?.elan ?? 0;
  const { data: megaprojetsBruts } = await supabase.rpc("etat_megaprojets", { p_ville_id: ville.id });
  const megaprojets: MegaprojetConstruit[] = (
    (megaprojetsBruts ?? []) as { palier: number; type: string; activite: string; statut: string }[]
  )
    .filter((c) => c.statut === "construit")
    .map((c) => ({ palier: c.palier, type: c.type, activite: c.activite }));
  const { count: nbTechnologies } = await supabase
    .from("technologies")
    .select("id", { count: "exact", head: true })
    .eq("ville_id", ville.id);
  const { data: monumentsBruts } = await supabase.from("monuments").select("palier").eq("ville_id", ville.id);
  const monuments: MonumentDebloque[] = [];
  for (const m of monumentsBruts ?? []) {
    const type = typeMonument(m.palier as number);
    if (type) monuments.push({ palier: m.palier as number, type });
  }

  // Événements partageables (réussites) : les plus récents + celui demandé par le lien.
  const { data: evenementsBruts } = await supabase
    .from("city_events")
    .select("id, type, activite, type_action, valeur, created_at")
    .eq("ville_id", ville.id)
    .in("type", ["megaprojet_construit", "technologie_debloquee", "monument_debloque"])
    .order("created_at", { ascending: false })
    .limit(12);
  const evenements = ((evenementsBruts ?? []) as EvenementBulletin[]).filter(evenementPartageable);
  let evenementMisEnAvant = evenementId && UUID.test(evenementId) ? evenements.find((e) => e.id === evenementId) : undefined;
  if (evenementId && UUID.test(evenementId) && !evenementMisEnAvant) {
    const { data: unique } = await supabase
      .from("city_events")
      .select("id, type, activite, type_action, valeur, created_at")
      .eq("id", evenementId)
      .eq("ville_id", ville.id)
      .maybeSingle();
    if (unique && evenementPartageable(unique as EvenementBulletin)) evenementMisEnAvant = unique as EvenementBulletin;
  }
  const texteMisEnAvant = evenementMisEnAvant ? libelleEvenement(locale, evenementMisEnAvant) : null;

  const progression = progressionNiveau(ville.population_max);
  const nf = new Intl.NumberFormat(locale);

  return (
    <main className="screen" aria-label={ville.nom}>
      <SincroniserScene
        seed={ville.id}
        populationMax={ville.population_max}
        pays={pays}
        vocations={vocations}
        elanEnergie={elanEnergie}
        megaprojets={megaprojets}
        nbTechnologies={nbTechnologies ?? 0}
        monuments={monuments}
        theme={ville.theme}
        zonageDepuisRang={zonageDepuisRang}
      />
      <PanneauFlottant locale={locale} className="dock dock-float dock-left">
        <div className="head-row">
          <span className="eyebrow">{traduire(locale, "partage.villePublique")}</span>
          <span className="badge">
            {ordinal(rang, locale)} {traduire(locale, "classement.dans")} {nomPays}
          </span>
        </div>
        <h1 className="sign">
          <span>{ville.nom}</span>
        </h1>
        <p className="sign-sub">{ligneLocale({ nom: nomPays, ...pays }, locale)}</p>
        <p className="note">
          {traduire(locale, "partage.maire")} {pseudo}
        </p>

        {texteMisEnAvant ? (
          <div className="partage-evenement-mis-en-avant" role="status">
            <b>{traduire(locale, "partage.evenement")}</b>
            <p>{texteMisEnAvant}</p>
          </div>
        ) : evenementId ? (
          <p className="note">{traduire(locale, "partage.evenementIntrouvable")}</p>
        ) : null}

        <div className="stage">
          <div className="stage-top">
            <span className="stage-name">{libelleNiveau(progression.niveau, locale)}</span>
          </div>
        </div>
        <div className="tiles">
          <div className="tile">
            <b>{nf.format(ville.population)}</b>
            <span>{traduire(locale, "ville.population")}</span>
          </div>
          <div className="tile">
            <b>{nf.format(ville.influence)}</b>
            <span>{traduire(locale, "ville.influence")}</span>
          </div>
        </div>

        {evenements.length > 0 ? (
          <div className="note">
            <b>{traduire(locale, "partage.reussites")}</b>
            <ul className="bulletin-liste">
              {evenements.map((e) => {
                const texte = libelleEvenement(locale, e)!;
                return (
                  <li key={e.id}>
                    {texte}{" "}
                    <BoutonPartager
                      locale={locale}
                      chemin={cheminPartage(ville.id, e.id)}
                      titre={texte}
                      className="btn small partage-evenement"
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="row">
          <BoutonPartager
            locale={locale}
            chemin={cheminPartage(ville.id)}
            titre={`${ville.nom} — jeu_miniville`}
            libelle={traduire(locale, "partage.partagerVille")}
            className="btn small"
          />
        </div>

        {user ? (
          <Link
            href={estMaVille ? "/ville" : `/villes?ville=${ville.id}`}
            className="btn primary block"
          >
            {estMaVille ? traduire(locale, "partage.voirMaVille") : traduire(locale, "partage.visiter")}
          </Link>
        ) : (
          <div className="partage-invitation">
            <p className="note">{traduire(locale, "partage.invitation")}</p>
            <div className="row">
              <Link href="/inscription" className="btn primary">
                {traduire(locale, "accueil.creerCompte")}
              </Link>
              <Link href="/connexion" className="btn">
                {traduire(locale, "partage.seConnecter")}
              </Link>
            </div>
          </div>
        )}
      </PanneauFlottant>
    </main>
  );
}
