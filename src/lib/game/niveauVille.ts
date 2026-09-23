import { dictionaries, type Locale } from "@/lib/i18n/dictionaries";

/**
 * Niveau visuel d'une ville : 0=Hameau … 5=Métropole (cahier des
 * charges §2). Les seuils de population qui font passer d'un niveau à
 * l'autre restent à équilibrer (docs/DECISIONS.md §10 point 2, Jalon 2)
 * — au Jalon 1, une ville naît toujours au niveau 0.
 */
export const NIVEAU_MIN = 0;
export const NIVEAU_MAX = 5;

export function libelleNiveau(niveau: number, locale: Locale): string {
  if (!Number.isInteger(niveau) || niveau < NIVEAU_MIN || niveau > NIVEAU_MAX) {
    throw new RangeError(
      `niveau de ville invalide : ${niveau} (attendu un entier entre ${NIVEAU_MIN} et ${NIVEAU_MAX})`
    );
  }
  const cle = `niveau.${niveau}` as keyof (typeof dictionaries)[Locale];
  return dictionaries[locale][cle];
}
