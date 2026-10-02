"use client";

import { useActionState, useState } from "react";
import { traduire, type DictionaryKey, type Locale } from "@/lib/i18n/dictionaries";
import { IndicationDisponibilite } from "@/components/ChampNom";
import { PSEUDO_MAX, VILLE_MAX } from "@/lib/game/nomsUniques";
import { renommer, type EtatRenommage } from "./actions";

export function RenommerForm({
  locale,
  changerPseudo,
  changerVille,
}: {
  locale: Locale;
  changerPseudo: boolean;
  changerVille: boolean;
}) {
  const [etat, action, enCours] = useActionState<EtatRenommage, FormData>(renommer, null);
  const [pseudo, setPseudo] = useState("");
  const [nomVille, setNomVille] = useState("");

  return (
    <form action={action} className="field">
      {changerPseudo ? (
        <div className="field">
          <label htmlFor="pseudo">{traduire(locale, "noms.pseudo")}</label>
          <input
            id="pseudo"
            name="pseudo"
            required
            maxLength={PSEUDO_MAX}
            className="input"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
          />
          <IndicationDisponibilite locale={locale} type="pseudo" valeur={pseudo} sauf />
        </div>
      ) : null}
      {changerVille ? (
        <div className="field">
          <label htmlFor="nomVille">{traduire(locale, "noms.ville")}</label>
          <div className="sign small">
            <input
              id="nomVille"
              name="nomVille"
              required
              maxLength={VILLE_MAX}
              value={nomVille}
              onChange={(e) => setNomVille(e.target.value)}
            />
          </div>
          <IndicationDisponibilite locale={locale} type="ville" valeur={nomVille} sauf />
        </div>
      ) : null}
      {etat?.erreur ? (
        <p className="note" style={{ color: "var(--bad)" }}>
          {traduire(locale, etat.erreur as DictionaryKey)}
        </p>
      ) : null}
      <button type="submit" disabled={enCours} className="btn primary block">
        {traduire(locale, "noms.bouton")}
      </button>
    </form>
  );
}
