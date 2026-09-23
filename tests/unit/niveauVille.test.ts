import { describe, expect, it } from "vitest";
import { libelleNiveau, NIVEAU_MAX, NIVEAU_MIN } from "@/lib/game/niveauVille";

describe("libelleNiveau", () => {
  it("donne Hameau au niveau 0 en français", () => {
    expect(libelleNiveau(0, "fr")).toBe("Hameau");
  });

  it("donne Metropolis au niveau 5 en anglais", () => {
    expect(libelleNiveau(5, "en")).toBe("Metropolis");
  });

  it("couvre tous les niveaux de la plage annoncée, dans les deux langues", () => {
    for (let niveau = NIVEAU_MIN; niveau <= NIVEAU_MAX; niveau++) {
      expect(libelleNiveau(niveau, "fr")).not.toBe("");
      expect(libelleNiveau(niveau, "en")).not.toBe("");
    }
  });

  it("refuse un niveau hors plage (sabotage : détecter une ville avec un niveau invalide)", () => {
    expect(() => libelleNiveau(-1, "fr")).toThrow(RangeError);
    expect(() => libelleNiveau(6, "fr")).toThrow(RangeError);
  });

  it("refuse un niveau non entier", () => {
    expect(() => libelleNiveau(1.5, "fr")).toThrow(RangeError);
  });
});
