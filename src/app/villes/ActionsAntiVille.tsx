"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { traduire, type Locale } from "@/lib/i18n/dictionaries";
import { lancerActionAntiVille, type EtatActionAntiVille } from "./actions";

function BoutonAction({
  name,
  value,
  label,
  note,
}: {
  name: string;
  value: string;
  label: string;
  note: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={pending} className="btn">
      {label}
      <small>{note}</small>
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
    return <p className="note">{traduire(locale, "villes.quotaAntiVilleAtteint")}</p>;
  }

  if (protectionActive) {
    return <p className="note">{traduire(locale, "villes.protectionActive")}</p>;
  }

  const message = messagePourEtat(etat, locale);

  return (
    <form action={action} className="row" style={{ display: "grid", gap: 8 }}>
      <input type="hidden" name="villeId" value={villeId} />
      <div className="anti">
        <BoutonAction
          name="typeAction"
          value="greve"
          label={traduire(locale, "villes.greve")}
          note={traduire(locale, "villes.greveNote")}
        />
        <BoutonAction
          name="typeAction"
          value="contamination"
          label={traduire(locale, "villes.contamination")}
          note={traduire(locale, "villes.contaminationNote")}
        />
        <BoutonAction
          name="typeAction"
          value="propagande"
          label={traduire(locale, "villes.propagande")}
          note={traduire(locale, "villes.propagandeNote")}
        />
      </div>
      {message ? <p className="note">{message}</p> : null}
    </form>
  );
}
