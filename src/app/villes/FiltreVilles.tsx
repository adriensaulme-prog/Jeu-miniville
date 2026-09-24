"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useRef } from "react";
import { traduire, type Locale } from "@/lib/i18n/dictionaries";

export function FiltreVilles({
  locale,
  pays,
}: {
  locale: Locale;
  pays: { id: string; nom: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function majParam(cle: string, valeur: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valeur) params.set(cle, valeur);
    else params.delete(cle);
    params.delete("ville");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <>
      <div className="row">
        <select
          className="select"
          aria-label={traduire(locale, "villes.pays")}
          style={{ flex: 1 }}
          defaultValue={searchParams.get("pays") ?? "all"}
          onChange={(e) => majParam("pays", e.target.value === "all" ? "" : e.target.value)}
        >
          <option value="all">{traduire(locale, "villes.tousLesPays")}</option>
          {pays.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom}
            </option>
          ))}
        </select>
      </div>
      <div className="row">
        <input
          className="input"
          type="search"
          placeholder={traduire(locale, "villes.rechercherPlaceholder")}
          aria-label={traduire(locale, "villes.rechercherPlaceholder")}
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => {
            const valeur = e.target.value;
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => majParam("q", valeur), 250);
          }}
        />
      </div>
    </>
  );
}
