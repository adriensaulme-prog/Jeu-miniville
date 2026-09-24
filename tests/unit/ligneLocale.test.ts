import { describe, expect, it } from "vitest";
import { ligneLocale } from "@/lib/game/ligneLocale";

const FRANCE = { nom: "France", latitude: 46.6, longitude: 2.35, fuseauHoraire: "Europe/Paris" };

describe("ligneLocale", () => {
  it("annonce 'jour' en plein midi solaire d'été", () => {
    const midi = new Date("2026-06-21T12:00:00+02:00");
    const ligne = ligneLocale(FRANCE, "fr", midi);
    expect(ligne).toContain("France");
    expect(ligne).toContain("jour");
  });

  it("annonce 'nuit' en plein minuit", () => {
    const minuit = new Date("2026-06-21T00:30:00+02:00");
    expect(ligneLocale(FRANCE, "fr", minuit)).toContain("nuit");
  });

  it("distingue lever et coucher du soleil (même élévation, heures différentes)", () => {
    const matin = new Date("2026-03-20T07:15:00+01:00");
    const soir = new Date("2026-03-20T18:45:00+01:00");
    expect(ligneLocale(FRANCE, "fr", matin)).toContain("lever du soleil");
    expect(ligneLocale(FRANCE, "fr", soir)).toContain("coucher du soleil");
  });

  it("traduit le descripteur du ciel en anglais", () => {
    const midi = new Date("2026-06-21T12:00:00+02:00");
    expect(ligneLocale(FRANCE, "en", midi)).toContain("day");
  });

  it("formate l'heure sur deux chiffres (HH:MM)", () => {
    const matin = new Date("2026-06-21T08:05:00+02:00");
    expect(ligneLocale(FRANCE, "fr", matin)).toMatch(/\d{2}:\d{2}/);
  });
});
