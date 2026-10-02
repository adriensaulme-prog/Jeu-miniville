import { describe, expect, it } from "vitest";
import { SECTIONS_REGLES } from "@/lib/game/regles";
import { QUOTA_VISITE_QUOTIDIEN } from "@/lib/game/visites";
import { locales } from "@/lib/i18n/dictionaries";

/** A-INTEGRER §27 C : règles du jeu en FR et EN dès la v1. */
describe("règles du jeu", () => {
  it("chaque section existe dans toutes les langues, avec un titre et du texte", () => {
    expect(SECTIONS_REGLES.length).toBeGreaterThanOrEqual(5);
    for (const s of SECTIONS_REGLES) {
      for (const l of locales) {
        expect(s.titre[l].trim().length).toBeGreaterThan(0);
        expect(s.paragraphes[l].length).toBeGreaterThan(0);
        for (const p of s.paragraphes[l]) expect(p.trim().length).toBeGreaterThan(20);
      }
      // Même nombre de paragraphes dans chaque langue : une traduction ne saute rien.
      const tailles = new Set(locales.map((l) => s.paragraphes[l].length));
      expect(tailles.size).toBe(1);
    }
  });

  it("les identifiants de section sont uniques", () => {
    const ids = SECTIONS_REGLES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("le plafond de visites cité vient de la constante, dans les deux langues", () => {
    const visites = SECTIONS_REGLES.find((s) => s.id === "visites")!;
    for (const l of locales) expect(visites.paragraphes[l].join(" ")).toContain(String(QUOTA_VISITE_QUOTIDIEN));
  });
});
