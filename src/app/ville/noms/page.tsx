import { redirect } from "next/navigation";
import { getLocale, traduire } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { RenommerForm } from "./RenommerForm";

export default async function NomsPage() {
  const locale = await getLocale();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profil } = await supabase.from("users").select("pseudo_a_changer").eq("id", user.id).maybeSingle();
  const { data: ville } = await supabase.from("cities").select("nom_a_changer").eq("owner_id", user.id).maybeSingle();
  if (!profil) redirect("/ville/creer");

  const changerPseudo = profil.pseudo_a_changer === true;
  const changerVille = ville?.nom_a_changer === true;
  if (!changerPseudo && !changerVille) redirect("/ville");

  return (
    <main className="screen nobar" aria-label={traduire(locale, "noms.titre")}>
      <div className="center-card">
        <span className="eyebrow">{traduire(locale, "noms.titre")}</span>
        <p className="lead">{traduire(locale, "noms.introduction")}</p>
        <RenommerForm locale={locale} changerPseudo={changerPseudo} changerVille={changerVille} />
      </div>
    </main>
  );
}
