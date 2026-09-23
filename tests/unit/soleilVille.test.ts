import { describe, expect, it } from "vitest";
import {
  heureDansLeFuseau,
  jourDeLAnnee,
  momentDeLaJournee,
  positionSoleil,
} from "@/lib/game/soleilVille";

describe("heureDansLeFuseau", () => {
  it("donne midi à Paris pour 12h00 UTC en hiver (UTC+1, pas d'heure d'été)", () => {
    const date = new Date(Date.UTC(2026, 0, 15, 12, 0, 0));
    const h = heureDansLeFuseau(date, "Europe/Paris");
    expect(h.heure).toBeCloseTo(13, 1);
    expect(h.decalageUtc).toBe(1);
  });

  it("donne un fuseau différent pour Tokyo à la même date UTC", () => {
    const date = new Date(Date.UTC(2026, 0, 15, 12, 0, 0));
    const h = heureDansLeFuseau(date, "Asia/Tokyo");
    expect(h.heure).toBeCloseTo(21, 1);
    expect(h.decalageUtc).toBe(9);
  });
});

describe("positionSoleil", () => {
  it("place le soleil nettement plus haut à midi solaire qu'à minuit, pour Paris en été", () => {
    // Décalage 0 et longitude 0 pour isoler "heure solaire = heure locale".
    const jour = jourDeLAnnee(2026, 6, 21); // solstice d'été
    const midi = positionSoleil(46.6, 0, 0, 12, jour);
    const minuit = positionSoleil(46.6, 0, 0, 0, jour);
    expect(midi.elevation).toBeGreaterThan(60);
    expect(minuit.elevation).toBeLessThan(-15);
  });

  it("l'azimut passe d'environ l'est le matin à environ l'ouest l'après-midi", () => {
    const jour = jourDeLAnnee(2026, 3, 20); // équinoxe
    const matin = positionSoleil(46.6, 0, 0, 7, jour);
    const soir = positionSoleil(46.6, 0, 0, 17, jour);
    expect(matin.azimut).toBeLessThan(180);
    expect(soir.azimut).toBeGreaterThan(180);
  });
});

describe("momentDeLaJournee", () => {
  it("catégorise correctement les quatre plages", () => {
    expect(momentDeLaJournee(45)).toBe("jour");
    expect(momentDeLaJournee(0)).toBe("lever_coucher");
    expect(momentDeLaJournee(-5)).toBe("aube_crepuscule");
    expect(momentDeLaJournee(-20)).toBe("nuit");
  });

  it("sabotage : les bornes exactes retombent du bon côté", () => {
    expect(momentDeLaJournee(12.0001)).toBe("jour");
    expect(momentDeLaJournee(12)).toBe("lever_coucher");
    expect(momentDeLaJournee(-1.9999)).toBe("lever_coucher");
    expect(momentDeLaJournee(-2)).toBe("aube_crepuscule");
  });
});
