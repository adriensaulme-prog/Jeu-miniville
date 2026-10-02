import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, traduire } from "@/lib/i18n";
import { libelleNiveau } from "@/lib/game/niveauVille";
import { ordinal } from "@/lib/game/ordinal";
import { QUOTA_VILLES_SUIVIES } from "@/lib/game/suivi";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { exigerRegionChoisie } from "@/lib/supabase/gardes";
import { SincroniserScene } from "@/components/SincroniserScene";
import { PanneauFlottant } from "@/components/PanneauFlottant";
import { BoutonSuivre } from "@/components/BoutonSuivre";

const PAYS_PAR_DEFAUT = { latitude: 46.6, longitude: 2.35, fuseauHoraire: "Europe/Paris" };

type VilleSuivie = {
  id: string;
  nom: string;
  population: number;
  niveau: number;
  pays: { nom: string } | { nom: string }[] | null;
  owner: { pseudo: string } | { pseudo: string }[] | null;
};

const un = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

/**
 * Villes suivies (docs/A-INTEGRER.md §26 D) : la liste personnelle de
 * villes d'autres joueurs que l'on a choisi de suivre, avec leur rang dans
 * leur pays et dans le monde. Unilatéral : l'autre joueur n'est pas
 * prévenu et ne voit pas qui le suit. Quota : QUOTA_VILLES_SUIVIES.
 */
export default async function SuiviPage() {
  const locale = await getLocale();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profil } = await supabase.from("users").select("id, city_id").eq("id", user.id).maybeSingle();
  if (!profil) redirect("/ville/creer");
  await exigerRegionChoisie(supabase, user.id);
  const maVilleId = profil!.city_id as string;

  const colonneNomPays = locale === "fr" ? "nom_fr" : "nom_en";
  const { data: maVille } = await supabase
    .from("cities")
    .select(`population_max, pays:countries(latitude, longitude, fuseau_horaire)`)
    .eq("id", maVilleId)
    .maybeSingle();
  const paysBrut = un(
    maVille?.pays as unknown as { latitude: number | null; longitude: number | null; fuseau_horaire: string | null } | null
  );
  const pays =
    paysBrut?.latitude != null && paysBrut?.longitude != null && paysBrut?.fuseau_horaire
      ? { latitude: paysBrut.latitude, longitude: paysBrut.longitude, fuseauHoraire: paysBrut.fuseau_horaire }
      : PAYS_PAR_DEFAUT;

  const { data: suivis } = await supabase.from("villes_suivies").select("ville_id").eq("joueur_id", user.id);
  const ids = (suivis ?? []).map((s) => s.ville_id as string);

  let villes: VilleSuivie[] = [];
  const rangs = new Map<string, { pays: number; monde: number }>();
  if (ids.length > 0) {
    const { data } = await supabase
      .from("cities")
      .select(
        `id, nom, population, niveau, pays:countries(nom:${colonneNomPays}), owner:users!cities_owner_id_fkey(pseudo)`
      )
      .in("id", ids)
      .order("population", { ascending: false });
    villes = (data ?? []) as VilleSuivie[];
    const { data: rangsBruts } = await supabase.rpc("villes_suivies_rangs", { p_joueur_id: user.id });
    for (const r of (rangsBruts ?? []) as { ville_id: string; rang_pays: number; rang_monde: number }[]) {
      rangs.set(r.ville_id, { pays: r.rang_pays, monde: r.rang_monde });
    }
  }

  const nf = new Intl.NumberFormat(locale);
  return (
    <main className="screen" aria-label={traduire(locale, "suivi.titre")}>
      <SincroniserScene seed={maVilleId} populationMax={maVille?.population_max ?? 1} pays={pays} />
      <PanneauFlottant locale={locale} className="dock dock-float dock-left">
        <div className="head-row">
          <h2 className="h2">{traduire(locale, "suivi.titre")}</h2>
          <span className="badge">
            {villes.length}/{QUOTA_VILLES_SUIVIES}
          </span>
        </div>
        <p className="note">{traduire(locale, "suivi.explication")}</p>
        {villes.length === 0 ? (
          <p className="empty">{traduire(locale, "suivi.vide")}</p>
        ) : (
          <ol className="list">
            {villes.map((v) => {
              const r = rangs.get(v.id);
              return (
                <li key={v.id} className="suivi-ligne">
                  <Link href={`/villes?ville=${v.id}`} className="rowbtn">
                    <span className="nm">{v.nom}</span>
                    <span className="pp">{nf.format(v.population)}</span>
                    <span className="meta">
                      {un(v.pays)?.nom ?? ""} · {libelleNiveau(v.niveau, locale)}
                      {r ? (
                        <>
                          {" "}
                          · {ordinal(r.pays, locale)} {traduire(locale, "suivi.dansLePays")} · {ordinal(r.monde, locale)}{" "}
                          {traduire(locale, "suivi.dansLeMonde")}
                          {r.pays === 1 ? (
                            <span className="badge pres">{traduire(locale, "classement.president")}</span>
                          ) : null}
                        </>
                      ) : null}
                    </span>
                  </Link>
                  <BoutonSuivre locale={locale} villeId={v.id} suivie />
                </li>
              );
            })}
          </ol>
        )}
        <p className="note">
          <Link href="/villes" style={{ color: "var(--focus)" }}>
            {traduire(locale, "suivi.trouverDesVilles")} →
          </Link>
        </p>
      </PanneauFlottant>
    </main>
  );
}
