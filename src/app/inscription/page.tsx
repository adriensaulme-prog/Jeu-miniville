import Link from "next/link";
import { getLocale, traduire } from "@/lib/i18n";
import { InscriptionForm } from "./InscriptionForm";

export default async function InscriptionPage() {
  const locale = await getLocale();

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold">{traduire(locale, "inscription.titre")}</h1>
      <InscriptionForm locale={locale} />
      <p className="text-sm text-gray-500">
        {traduire(locale, "inscription.dejaCompte")}{" "}
        <Link href="/connexion" className="text-blue-600 hover:underline">
          {traduire(locale, "inscription.lienConnexion")}
        </Link>
      </p>
    </main>
  );
}
