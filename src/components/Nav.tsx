import Link from "next/link";
import { getLocale, traduire } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { deconnexion } from "@/lib/supabase/auth-actions";
import { LangSwitcher } from "./LangSwitcher";
import { NavTabs } from "./NavTabs";

export async function Nav() {
  const locale = await getLocale();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          jeu_miniville
        </Link>
        {user ? <NavTabs locale={locale} className="tabs" tabClassName="tab" /> : null}
        <div className="who">
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
    </>
  );
}
