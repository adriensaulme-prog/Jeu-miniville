import { redirect } from "next/navigation";
import { getLocale, traduire } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { RegionForm } from "./RegionForm";

export default async function RegionPage() {
  const locale = await getLocale();
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

  const colonneNom = locale === "fr" ? "nom_fr" : "nom_en";
  const { data: ville } = await supabase
    .from("cities")
    .select(`id, country_id, region_id, region_choisie_le, region:regions(nom:${colonneNom})`)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!ville) {
    redirect("/ville/creer");
  }

  const { data: regions } = await supabase
    .from("regions")
    .select(`id, nom:${colonneNom}`)
    .eq("country_id", ville.country_id)
    .order(colonneNom);

  const regionActuelle = Array.isArray(ville.region) ? ville.region[0] : ville.region;
  let joursRestants = 0;
  if (ville.region_id && ville.region_choisie_le) {
    const ecoule = (Date.now() - new Date(ville.region_choisie_le).getTime()) / (24 * 60 * 60 * 1000);
    joursRestants = Math.max(0, Math.ceil(30 - ecoule));
  }

  return (
    <main className="screen nobar" aria-label={traduire(locale, "region.titre")}>
      <div className="center-card">
        <span className="eyebrow">{traduire(locale, ville.region_id ? "region.changerTitre" : "region.titre")}</span>
        <p className="lead">{traduire(locale, "region.introduction")}</p>
        {regionActuelle ? (
          <p className="note">
            {traduire(locale, "region.actuelle")} : <b>{regionActuelle.nom}</b>
          </p>
        ) : null}
        <RegionForm
          locale={locale}
          regions={regions ?? []}
          regionActuelleId={ville.region_id}
          joursRestants={joursRestants}
        />
      </div>
    </main>
  );
}
