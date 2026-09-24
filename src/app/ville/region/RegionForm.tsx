"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { traduire, type DictionaryKey, type Locale } from "@/lib/i18n/dictionaries";
import { definirRegion, type EtatDefinirRegion } from "./actions";

type Region = { id: string; nom: string };

function BoutonValider({ locale, disabled }: { locale: Locale; disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || disabled} className="btn primary block">
      {traduire(locale, "region.bouton")}
    </button>
  );
}

export function RegionForm({
  locale,
  regions,
  regionActuelleId,
  joursRestants,
}: {
  locale: Locale;
  regions: Region[];
  regionActuelleId: string | null;
  joursRestants: number;
}) {
  const [etat, action] = useActionState<EtatDefinirRegion, FormData>(definirRegion, null);
  const enDelai = regionActuelleId !== null && joursRestants > 0;

  if (enDelai) {
    return (
      <p className="note">
        {traduire(locale, "region.delaiRestant")} {joursRestants} {traduire(locale, "region.jours")}.
      </p>
    );
  }

  return (
    <form action={action} className="field">
      <div className="field">
        <select name="regionId" required defaultValue={regionActuelleId ?? ""} className="select">
          <option value="" disabled>
            {traduire(locale, "creationVille.regionPlaceholder")}
          </option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nom}
            </option>
          ))}
        </select>
      </div>
      {regionActuelleId ? <p className="note">{traduire(locale, "region.changerNote")}</p> : null}
      {etat?.erreur ? (
        <p className="note" style={{ color: "var(--bad)" }}>
          {traduire(locale, etat.erreur as DictionaryKey)}
        </p>
      ) : null}
      <BoutonValider locale={locale} disabled={false} />
    </form>
  );
}
