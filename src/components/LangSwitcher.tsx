"use client";

import { usePathname } from "next/navigation";
import { definirLocale } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n/dictionaries";

export function LangSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  return (
    <form action={definirLocale} className="flex gap-1 text-sm">
      <input type="hidden" name="retour" value={pathname} />
      {(["fr", "en"] as const).map((option) => (
        <button
          key={option}
          type="submit"
          name="locale"
          value={option}
          disabled={option === locale}
          className={
            option === locale
              ? "font-semibold text-blue-600"
              : "text-gray-400 hover:text-gray-600"
          }
        >
          {option.toUpperCase()}
        </button>
      ))}
    </form>
  );
}
