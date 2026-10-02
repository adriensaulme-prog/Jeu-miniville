import { describe, expect, it } from "vitest";
import {
  palierVisites,
  palierInfluence,
  PALIERS_POPULARITE,
  PALIERS_RENOMMEE,
  SEUILS_POPULARITE,
} from "@/lib/game/popularite";
import { QUOTA_VISITE_QUOTIDIEN } from "@/lib/game/visites";

describe("palierVisites", () => {
  it("calme à 0 visite reçue", () => {
    expect(palierVisites(0)).toBe("calme");
  });

  it("monte de palier progressivement (seuils 1 / 13 / 40 / 133 avec un plafond de 8 visites par jour)", () => {
    expect(QUOTA_VISITE_QUOTIDIEN).toBe(8); // les valeurs ci-dessous supposent ce plafond
    expect(palierVisites(1)).toBe("frequentee");
    expect(palierVisites(12)).toBe("frequentee");
    expect(palierVisites(13)).toBe("tres_frequentee");
    expect(palierVisites(39)).toBe("tres_frequentee");
    expect(palierVisites(40)).toBe("en_vogue");
    expect(palierVisites(132)).toBe("en_vogue");
    expect(palierVisites(133)).toBe("virale");
    expect(palierVisites(1000)).toBe("virale");
  });

  it("les seuils suivent le plafond de visites : 8/3 des seuils d'origine (5 / 15 / 50), arrondis", () => {
    const facteur = QUOTA_VISITE_QUOTIDIEN / 3;
    expect(SEUILS_POPULARITE.frequentee).toBe(1);
    expect(SEUILS_POPULARITE.tres_frequentee).toBe(Math.round(5 * facteur));
    expect(SEUILS_POPULARITE.en_vogue).toBe(Math.round(15 * facteur));
    expect(SEUILS_POPULARITE.virale).toBe(Math.round(50 * facteur));
    // Toujours strictement croissants : aucun palier ne se confond avec le suivant.
    const s = Object.values(SEUILS_POPULARITE);
    expect([...s].sort((a, b) => a - b)).toEqual(s);
    expect(new Set(s).size).toBe(s.length);
  });

  it("couvre tous les paliers déclarés, dans l'ordre croissant", () => {
    const seuils = [0, ...Object.values(SEUILS_POPULARITE)];
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
