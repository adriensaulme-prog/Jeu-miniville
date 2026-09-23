import { redirect } from "next/navigation";
import { getLocale, traduire } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { CreerVilleForm } from "./CreerVilleForm";

export default async function CreerVillePage() {
  const locale = await getLocale();
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: profilExistant } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profilExistant) {
    redirect("/ville");
  }

  const colonneNom = locale === "fr" ? "nom_fr" : "nom_en";
  const { data: pays } = await supabase
    .from("countries")
    .select(`id, nom:${colonneNom}`)
    .order(colonneNom);

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold">{traduire(locale, "creationVille.titre")}</h1>
      <p className="text-sm text-gray-600">
        {traduire(locale, "creationVille.introduction")}
      </p>
      <CreerVilleForm locale={locale} pays={pays ?? []} />
    </main>
  );
}
