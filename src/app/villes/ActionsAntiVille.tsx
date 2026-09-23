"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { traduire, type Locale } from "@/lib/i18n/dictionaries";
import { lancerActionAntiVille, type EtatActionAntiVille } from "./actions";

function BoutonAction({
  name,
  value,
  label,
}: {
  name: string;
  value: string;
  label: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
    >
      {label}
    </button>
  );
}

function messagePourEtat(etat: EtatActionAntiVille, locale: Locale): string | null {
  if (!etat) return null;
  switch (etat.statut) {
    case "succes":
      return traduire(
        locale,
        etat.effetReduit ? "villes.antiVilleReussieEffetReduit" : "villes.antiVilleReussie"
      );
    case "protection":
      return traduire(locale, "villes.antiVilleProtection");
    case "quota":
      return traduire(locale, "villes.antiVilleQuota");
    case "erreur":
      return traduire(locale, "villes.antiVilleErreur");
  }
}

export function ActionsAntiVille({
  locale,
  villeId,
  protectionActive,
  quotaAtteint,
}: {
  locale: Locale;
  villeId: string;
  protectionActive: boolean;
  quotaAtteint: boolean;
}) {
  const [etat, action] = useActionState<EtatActionAntiVille, FormData>(
    lancerActionAntiVille,
    null
  );

  if (quotaAtteint) {
    return (
      <span className="text-xs text-gray-400">
        {traduire(locale, "villes.quotaAntiVilleAtteint")}
      </span>
    );
  }

  if (protectionActive) {
    return (
      <span className="text-xs text-gray-400">
        {traduire(locale, "villes.protectionActive")}
      </span>
    );
  }

  const message = messagePourEtat(etat, locale);

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="villeId" value={villeId} />
      <div className="flex gap-1">
        <BoutonAction name="typeAction" value="greve" label={traduire(locale, "villes.greve")} />
        <BoutonAction
          name="typeAction"
          value="contamination"
          label={traduire(locale, "villes.contamination")}
        />
        <BoutonAction
          name="typeAction"
          value="propagande"
          label={traduire(locale, "villes.propagande")}
        />
      </div>
      {message ? <p className="max-w-[16rem] text-right text-xs text-gray-500">{message}</p> : null}
    </form>
  );
}
