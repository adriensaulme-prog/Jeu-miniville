import Link from "next/link";
import { getLocale, traduire } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { SincroniserScene } from "@/components/SincroniserScene";

const PAYS_PAR_DEFAUT = { latitude: 46.6, longitude: 2.35, fuseauHoraire: "Europe/Paris" };

export default async function Home() {
  const locale = await getLocale();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="screen nobar" aria-label={traduire(locale, "accueil.titre")}>
      <SincroniserScene seed="accueil" populationMax={1200} pays={PAYS_PAR_DEFAUT} />
      <div className="center-card hero">
        <span className="eyebrow">jeu_miniville</span>
        <h1 className="display">{traduire(locale, "accueil.titre")}</h1>
        <p className="lead">{traduire(locale, "accueil.description")}</p>
        {user ? (
          <Link href="/ville" className="btn primary block">
            {traduire(locale, "accueil.voirMaVille")}
          </Link>
        ) : (
          <div className="row">
            <Link href="/inscription" className="btn primary">
              {traduire(locale, "accueil.creerCompte")}
            </Link>
            <Link href="/connexion" className="btn">
              {traduire(locale, "accueil.seConnecter")}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
