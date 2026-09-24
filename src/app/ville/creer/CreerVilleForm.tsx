"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { traduire, type DictionaryKey, type Locale } from "@/lib/i18n/dictionaries";
import { useSceneVille } from "@/components/SceneVilleFond";
import { creerVille, type EtatCreationVille } from "./actions";

type Pays = { id: string; nom: string };
type Region = { id: string; country_id: string; nom: string };

const PAYS_PAR_DEFAUT = { latitude: 46.6, longitude: 2.35, fuseauHoraire: "Europe/Paris" };

function BoutonValider({ locale }: { locale: Locale }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn primary block">
      {traduire(locale, "creationVille.bouton")}
    </button>
  );
}

export function CreerVilleForm({
  locale,
  pays,
  regions,
}: {
  locale: Locale;
  pays: Pays[];
  regions: Region[];
}) {
  const [etat, action] = useActionState<EtatCreationVille, FormData>(creerVille, null);
  const [nomVille, setNomVille] = useState("");
  const [paysChoisi, setPaysChoisi] = useState("");
  const { definirVille } = useSceneVille();
  const regionsDuPays = regions.filter((r) => r.country_id === paysChoisi);

  useEffect(() => {
    definirVille({ seed: "creation-preview", populationMax: 1, pays: PAYS_PAR_DEFAUT });
    // definirVille est stable ; ce prévisualise une fois au montage, la
    // ville d'aperçu ne change jamais de forme (seed fixe).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form action={action} className="field">
      <div className="field">
        <label htmlFor="pseudo">{traduire(locale, "creationVille.pseudo")}</label>
        <input id="pseudo" name="pseudo" required maxLength={40} className="input" />
      </div>
      <div className="field">
        <label htmlFor="nomVille">{traduire(locale, "creationVille.nomVille")}</label>
        <div className="sign small">
          <input
            id="nomVille"
            name="nomVille"
            required
            maxLength={40}
            value={nomVille}
            onChange={(e) => setNomVille(e.target.value)}
            placeholder={traduire(locale, "creationVille.nomVille")}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="countryId">{traduire(locale, "creationVille.pays")}</label>
        <select
          id="countryId"
          name="countryId"
          required
          defaultValue=""
          className="select"
          onChange={(e) => setPaysChoisi(e.target.value)}
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
      </div>
      {paysChoisi ? (
        <div className="field">
          <label htmlFor="regionId">{traduire(locale, "creationVille.region")}</label>
          <select id="regionId" name="regionId" required defaultValue="" className="select">
            <option value="" disabled>
              {traduire(locale, "creationVille.regionPlaceholder")}
            </option>
            {regionsDuPays.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nom}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <p className="note">{traduire(locale, "creationVille.note")}</p>
      {etat?.erreur ? (
        <p className="note" style={{ color: "var(--bad)" }}>
          {traduire(locale, etat.erreur as DictionaryKey)}
        </p>
      ) : null}
      <BoutonValider locale={locale} />
    </form>
  );
}
