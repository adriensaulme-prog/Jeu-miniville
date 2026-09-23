import { describe, expect, it } from "vitest";
import { dictionaries, locales } from "@/lib/i18n/dictionaries";

/**
 * Vérifie la règle i18n de GUIDE-METHODE.md §9 : toute clé de traduction
 * a ses deux langues remplies. Pas de test jetable — protège contre une
 * clé fr ajoutée sans son équivalent en (ou l'inverse) dans tous les
 * jalons suivants.
 */
describe("dictionnaires i18n", () => {
  const clesParLocale = Object.fromEntries(
    locales.map((locale) => [locale, Object.keys(dictionaries[locale]).sort()])
  );

  it("a au moins une clé", () => {
    expect(clesParLocale.fr.length).toBeGreaterThan(0);
  });

  it("a exactement les mêmes clés en fr et en en", () => {
    expect(clesParLocale.en).toEqual(clesParLocale.fr);
  });

  it("n'a aucune valeur vide", () => {
    for (const locale of locales) {
      for (const [cle, valeur] of Object.entries(dictionaries[locale])) {
        expect(valeur.trim(), `${locale}.${cle}`).not.toBe("");
      }
    }
  });
});
