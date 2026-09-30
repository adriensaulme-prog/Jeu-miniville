import { describe, expect, it } from "vitest";
import { palierGuerre, PALIERS_GUERRE } from "@/lib/game/conflits";

describe("palierGuerre", () => {
  it("calme à 0 journée gagnée", () => {
    expect(palierGuerre(0)).toBe("calme");
  });

  it("monte de palier progressivement avec le nombre de journées gagnées", () => {
    expect(palierGuerre(1)).toBe("tensions");
    expect(palierGuerre(2)).toBe("escarmouches");
    expect(palierGuerre(3)).toBe("conflit_ouvert");
    expect(palierGuerre(4)).toBe("conflit_ouvert");
    expect(palierGuerre(5)).toBe("guerre_totale");
    expect(palierGuerre(6)).toBe("guerre_totale");
    expect(palierGuerre(7)).toBe("victoire_ecrasante");
  });

  it("plafonne à victoire_ecrasante au-delà de 7 (garde-fou, ne devrait jamais arriver)", () => {
    expect(palierGuerre(100)).toBe("victoire_ecrasante");
  });

  it("couvre tous les paliers déclarés, dans l'ordre croissant", () => {
    const seuils = [0, 1, 2, 3, 5, 7];
    const paliersObtenus = seuils.map(palierGuerre);
    expect(paliersObtenus).toEqual(PALIERS_GUERRE);
  });
});
