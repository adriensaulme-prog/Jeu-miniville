import Link from "next/link";
import { getLocale, traduire } from "@/lib/i18n";
import { InscriptionForm } from "./InscriptionForm";

export default async function InscriptionPage() {
  const locale = await getLocale();

  return (
    <main className="screen nobar" aria-label={traduire(locale, "inscription.titre")}>
      <div className="center-card">
        <h1 className="h2">{traduire(locale, "inscription.titre")}</h1>
        <InscriptionForm locale={locale} />
        <p className="note">
          {traduire(locale, "inscription.dejaCompte")}{" "}
          <Link href="/connexion" style={{ color: "var(--focus)" }}>
            {traduire(locale, "inscription.lienConnexion")}
          </Link>
        </p>
      </div>
    </main>
  );
}
