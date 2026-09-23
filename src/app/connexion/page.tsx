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
    <main className="mx-auto flex max-w-sm flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold">{traduire(locale, "connexion.titre")}</h1>
      <ConnexionForm locale={locale} redirection={redirection} />
      <p className="text-sm text-gray-500">
        {traduire(locale, "connexion.pasDeCompte")}{" "}
        <Link href="/inscription" className="text-blue-600 hover:underline">
          {traduire(locale, "connexion.lienInscription")}
        </Link>
      </p>
    </main>
  );
}
