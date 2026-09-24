"use client";

import { useRouter } from "next/navigation";
import { traduire, type Locale } from "@/lib/i18n/dictionaries";

export function SelecteurPays({
  locale,
  paysActuel,
  pays,
}: {
  locale: Locale;
  paysActuel: string;
  pays: { id: string; nom: string }[];
}) {
  const router = useRouter();
  return (
    <select
      className="select"
      aria-label={traduire(locale, "pays.autrePays")}
      defaultValue={paysActuel}
      onChange={(e) => router.push(`/pays?pays=${e.target.value}`)}
    >
      {pays.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nom}
        </option>
      ))}
    </select>
  );
}
