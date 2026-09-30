import { describe, expect, it } from "vitest";
import { palierJumelage, PALIERS_JUMELAGE } from "@/lib/game/jumelages";

describe("palierJumelage", () => {
  it("naissant à 0 jour de bonus cumulé", () => {
    expect(palierJumelage(0)).toBe("naissant");
  });

  it("monte de palier progressivement avec le cumul de jours", () => {
    expect(palierJumelage(6)).toBe("naissant");
    expect(palierJumelage(7)).toBe("solide");
    expect(palierJumelage(29)).toBe("solide");
    expect(palierJumelage(30)).toBe("indefectible");
    expect(palierJumelage(89)).toBe("indefectible");
    expect(palierJumelage(90)).toBe("legendaire");
    expect(palierJumelage(1000)).toBe("legendaire");
  });

  it("couvre tous les paliers déclarés, dans l'ordre croissant", () => {
    const seuils = [0, 7, 30, 90];
    expect(seuils.map(palierJumelage)).toEqual(PALIERS_JUMELAGE);
  });
});
