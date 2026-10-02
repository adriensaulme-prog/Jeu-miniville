"use client";

import { useEffect, useState } from "react";
import { traduire, type DictionaryKey, type Locale } from "@/lib/i18n/dictionaries";
import { verifierDisponibilite, type ResultatDisponibilite } from "@/app/ville/creer/disponibilite";

/**
 * Indication « ✓ disponible / ✗ déjà pris » sous un champ de nom, avec
 * un petit délai après la dernière frappe pour ne pas interroger la base
 * à chaque lettre. Purement informatif (docs/A-INTEGRER.md §8).
 */
export function IndicationDisponibilite({
  locale,
  type,
  valeur,
  sauf = false,
}: {
  locale: Locale;
  type: "pseudo" | "ville";
  valeur: string;
  sauf?: boolean;
}) {
  const [resultat, setResultat] = useState<ResultatDisponibilite | "verification" | null>(null);

  useEffect(() => {
    if (valeur.trim() === "") {
      setResultat(null);
      return;
    }
    setResultat("verification");
    let annule = false;
    const minuteur = setTimeout(async () => {
      const r = await verifierDisponibilite(type, valeur, sauf);
      if (!annule) setResultat(r);
    }, 400);
    return () => {
      annule = true;
      clearTimeout(minuteur);
    };
  }, [type, valeur, sauf]);

  if (resultat === null) return null;
  if (resultat === "verification") return <p className="note">{traduire(locale, "nom.verification")}</p>;
  if (resultat.etat === "disponible")
    return (
      <p className="note" style={{ color: "var(--good)" }}>
        ✓ {traduire(locale, "nom.disponible")}
      </p>
    );
  const cle: DictionaryKey = resultat.etat === "pris" ? "nom.pris" : (`nom.erreur.${resultat.erreur}` as DictionaryKey);
  return (
    <p className="note" style={{ color: "var(--bad)" }}>
      ✗ {traduire(locale, cle)}
    </p>
  );
}
