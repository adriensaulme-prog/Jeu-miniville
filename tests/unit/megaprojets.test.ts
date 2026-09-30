import { describe, expect, it } from "vitest";
import {
  CATALOGUE_MEGAPROJETS,
  coutMegaprojet,
  nbMegaprojetsOuverts,
  optionsPalier,
  seuilMegaprojet,
} from "@/lib/game/megaprojets";

describe("seuilMegaprojet / nbMegaprojetsOuverts", () => {
  it("les 5 premiers paliers correspondent aux stades du cahier des charges", () => {
    expect(seuilMegaprojet(0)).toBe(5000);
    expect(seuilMegaprojet(1)).toBe(15000);
    expect(seuilMegaprojet(2)).toBe(40000);
    expect(seuilMegaprojet(3)).toBe(100000);
    expect(seuilMegaprojet(4)).toBe(250000);
  });

  it("un palier de plus tous les 50 000 habitants au-delà de la Mégapole", () => {
    expect(seuilMegaprojet(5)).toBe(300000);
    expect(seuilMegaprojet(6)).toBe(350000);
  });

  it("nbMegaprojetsOuverts est l'inverse de seuilMegaprojet", () => {
    for (let palier = 0; palier < 10; palier++) {
      const seuil = seuilMegaprojet(palier);
      expect(nbMegaprojetsOuverts(seuil)).toBe(palier + 1);
      expect(nbMegaprojetsOuverts(seuil - 1)).toBe(palier);
    }
  });
});

describe("catalogue", () => {
  it("chaque palier de 0 à 4 a 3 ou 4 options, toutes avec un type et une activité", () => {
    for (let palier = 0; palier <= 4; palier++) {
      const options = optionsPalier(palier);
      expect(options.length).toBeGreaterThanOrEqual(3);
      for (const o of options) {
        expect(o.type).toBeTruthy();
        expect(o.activite).toBeTruthy();
      }
    }
  });

  it("au-delà du palier 4, réutilise le catalogue de la Mégapole", () => {
    expect(optionsPalier(7)).toBe(CATALOGUE_MEGAPROJETS[4]);
  });

  it("aucun doublon de type dans tout le catalogue", () => {
    const tous = Object.values(CATALOGUE_MEGAPROJETS).flat().map((o) => o.type);
    expect(new Set(tous).size).toBe(tous.length);
  });
});

describe("coutMegaprojet", () => {
  it("coûts des 5 premiers paliers, tels que donnés par le document", () => {
    expect(coutMegaprojet(0)).toEqual({ materiaux: 400, revenus: 400, points: 250 });
    expect(coutMegaprojet(1)).toEqual({ materiaux: 1200, revenus: 1200, points: 750 });
    expect(coutMegaprojet(2)).toEqual({ materiaux: 3200, revenus: 3200, points: 2000 });
    expect(coutMegaprojet(3)).toEqual({ materiaux: 8000, revenus: 8000, points: 5000 });
    expect(coutMegaprojet(4)).toEqual({ materiaux: 12000, revenus: 12000, points: 7500 });
  });

  it("×1,5 à chaque palier suivant la Mégapole", () => {
    expect(coutMegaprojet(5).materiaux).toBe(Math.round(12000 * 1.5));
    expect(coutMegaprojet(6).materiaux).toBe(Math.round(12000 * 1.5 * 1.5));
  });
});
