import { describe, expect, it } from "vitest";
import { palierVisites, palierInfluence, PALIERS_POPULARITE, PALIERS_RENOMMEE } from "@/lib/game/popularite";

describe("palierVisites", () => {
  it("calme à 0 visite reçue", () => {
    expect(palierVisites(0)).toBe("calme");
  });

  it("monte de palier progressivement", () => {
    expect(palierVisites(1)).toBe("frequentee");
    expect(palierVisites(4)).toBe("frequentee");
    expect(palierVisites(5)).toBe("tres_frequentee");
    expect(palierVisites(14)).toBe("tres_frequentee");
    expect(palierVisites(15)).toBe("en_vogue");
    expect(palierVisites(49)).toBe("en_vogue");
    expect(palierVisites(50)).toBe("virale");
    expect(palierVisites(1000)).toBe("virale");
  });

  it("couvre tous les paliers déclarés, dans l'ordre croissant", () => {
    const seuils = [0, 1, 5, 15, 50];
    expect(seuils.map(palierVisites)).toEqual(PALIERS_POPULARITE);
  });
});

describe("palierInfluence", () => {
  it("calme à 0 action d'influence reçue", () => {
    expect(palierInfluence(0)).toBe("calme");
  });

  it("monte de palier progressivement", () => {
    expect(palierInfluence(1)).toBe("respectee");
    expect(palierInfluence(5)).toBe("renommee");
    expect(palierInfluence(15)).toBe("celebre");
    expect(palierInfluence(50)).toBe("legendaire");
  });

  it("couvre tous les paliers déclarés, dans l'ordre croissant", () => {
    const seuils = [0, 1, 5, 15, 50];
    expect(seuils.map(palierInfluence)).toEqual(PALIERS_RENOMMEE);
  });
});
