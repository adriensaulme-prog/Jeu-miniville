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

export function ActionsAntiVille({
  locale,
  villeId,
  quotaAtteint,
}: {
  locale: Locale;
  villeId: string;
  quotaAtteint: boolean;
}) {
  const [etat, action] = useActionState<EtatActionAntiVille, FormData>(
    lancerActionAntiVille,
    null
  );

  if (quotaAtteint) {
    return <p className="note">{traduire(locale, "villes.quotaAntiVilleAtteint")}</p>;
  }

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
      {etat?.statut === "succes" ? (
        <p className="note">
          {traduire(locale, "villes.antiVilleReussie")}{" "}
          {etat.perte !== null ? (
            <>
              {traduire(locale, "villes.antiVillePerteInfligee")} {etat.perte}.{" "}
            </>
          ) : null}
          {etat.dureeHeures !== null ? (
            <>
              {traduire(locale, "villes.antiVilleDureeBlocage")} {Math.round(etat.dureeHeures * 10) / 10} h.{" "}
            </>
          ) : null}
          {traduire(locale, "villes.antiVillePalier")} {traduire(locale, `villes.palier.${etat.palier}`)}
        </p>
      ) : etat?.statut === "quota" ? (
        <p className="note">{traduire(locale, "villes.antiVilleQuota")}</p>
      ) : etat?.statut === "erreur" ? (
        <p className="note">{traduire(locale, "villes.antiVilleErreur")}</p>
      ) : null}
    </form>
  );
}
