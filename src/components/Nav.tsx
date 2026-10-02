import Link from "next/link";
import { getLocale, traduire } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { deconnexion } from "@/lib/supabase/auth-actions";
import { LangSwitcher } from "./LangSwitcher";
import { NavTabs } from "./NavTabs";
import { GuideDecouverte } from "./GuideDecouverte";
import { estNouveauJoueur } from "@/lib/game/guide";

export async function Nav() {
  const locale = await getLocale();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A-INTEGRER §26 B : pastille de notifications non lues (0 si la fonction
  // n'est pas encore installée ou en cas d'erreur : jamais bloquant).
  let nbNonLues = 0;
  if (user) {
    const { data } = await supabase.rpc("nb_notifications_non_lues", { p_joueur_id: user.id });
    nbNonLues = typeof data === "number" ? data : 0;
  }

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          jeu_miniville
        </Link>
        {user ? <NavTabs locale={locale} className="tabs" tabClassName="tab" /> : null}
        <div className="who">
          <Link href="/journal" className="regles-lien">
            {traduire(locale, "nav.journal")}
          </Link>
          <Link href="/regles" className="regles-lien">
            {traduire(locale, "nav.regles")}
          </Link>
          {user ? (
            <Link
              href="/notifications"
              className="cloche"
              aria-label={`${traduire(locale, "notifications.titre")}${nbNonLues > 0 ? ` (${nbNonLues})` : ""}`}
            >
              <span aria-hidden="true">🔔</span>
              {nbNonLues > 0 ? <b className="cloche-nb">{nbNonLues > 99 ? "99+" : nbNonLues}</b> : null}
            </Link>
          ) : null}
          <LangSwitcher locale={locale} />
          {user ? (
            <form action={deconnexion}>
              <button type="submit" className="btn small">
                {traduire(locale, "nav.seDeconnecter")}
              </button>
            </form>
          ) : null}
        </div>
      </header>
      {user ? <NavTabs locale={locale} className="tabbar" tabClassName="tab" /> : null}
      {user ? <GuideDecouverte locale={locale} nouveauJoueur={estNouveauJoueur(user.created_at)} /> : null}
    </>
  );
}
