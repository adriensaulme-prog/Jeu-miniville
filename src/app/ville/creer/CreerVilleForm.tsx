"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { traduire, type DictionaryKey, type Locale } from "@/lib/i18n/dictionaries";
import { creerVille, type EtatCreationVille } from "./actions";

type Pays = { id: string; nom: string };

function BoutonValider({ locale }: { locale: Locale }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {traduire(locale, "creationVille.bouton")}
    </button>
  );
}

export function CreerVilleForm({
  locale,
  pays,
}: {
  locale: Locale;
  pays: Pays[];
}) {
  const [etat, action] = useActionState<EtatCreationVille, FormData>(creerVille, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        {traduire(locale, "creationVille.pseudo")}
        <input
          name="pseudo"
          required
          maxLength={40}
          className="rounded border border-gray-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {traduire(locale, "creationVille.nomVille")}
        <input
          name="nomVille"
          required
          maxLength={40}
          className="rounded border border-gray-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {traduire(locale, "creationVille.pays")}
        <select
          name="countryId"
          required
          defaultValue=""
          className="rounded border border-gray-300 px-3 py-2"
        >
          <option value="" disabled>
            {traduire(locale, "creationVille.paysPlaceholder")}
          </option>
          {pays.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom}
            </option>
          ))}
        </select>
      </label>
      {etat?.erreur ? (
        <p className="text-sm text-red-600">
          {traduire(locale, etat.erreur as DictionaryKey)}
        </p>
      ) : null}
      <BoutonValider locale={locale} />
    </form>
  );
}
