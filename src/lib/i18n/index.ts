import { cookies } from "next/headers";
import { defaultLocale, locales, traduire, type DictionaryKey, type Locale } from "./dictionaries";

// Réservé aux composants et actions serveur (dépend de next/headers) —
// un composant client doit importer directement depuis "./dictionaries".

export const LOCALE_COOKIE = "langue";

export { defaultLocale, locales, traduire, type DictionaryKey, type Locale };

export function estLocaleValide(valeur: string | undefined): valeur is Locale {
  return !!valeur && (locales as readonly string[]).includes(valeur);
}

/** Locale de la requête en cours (composants et actions serveur). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const valeur = store.get(LOCALE_COOKIE)?.value;
  return estLocaleValide(valeur) ? valeur : defaultLocale;
}
