import Link from "next/link";
import { getLocale, traduire } from "@/lib/i18n";
import { ConnexionForm } from "./ConnexionForm";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ redirection?: string }>;
}) {
  const locale = await getLocale();
  const { redirection } = await searchParams;

  return (
    <main className="screen nobar" aria-label={traduire(locale, "connexion.titre")}>
      <div className="center-card">
        <h1 className="h2">{traduire(locale, "connexion.titre")}</h1>
        <ConnexionForm locale={locale} redirection={redirection} />
        <p className="note">
          {traduire(locale, "connexion.pasDeCompte")}{" "}
          <Link href="/inscription" style={{ color: "var(--focus)" }}>
            {traduire(locale, "connexion.lienInscription")}
          </Link>
        </p>
      </div>
    </main>
  );
}
