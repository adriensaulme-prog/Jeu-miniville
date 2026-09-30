import { describe, expect, it } from "vitest";
import {
  CATALOGUE_TECHNOLOGIES,
  seuilTechnologie,
  technologiesDepuisPalier,
  typeTechnologie,
} from "@/lib/game/technologies";

describe("seuilTechnologie", () => {
  it("les 5 premiers paliers correspondent aux chiffres du document", () => {
    expect(seuilTechnologie(0)).toBe(100);
    expect(seuilTechnologie(1)).toBe(300);
    expect(seuilTechnologie(2)).toBe(800);
    expect(seuilTechnologie(3)).toBe(2000);
    expect(seuilTechnologie(4)).toBe(5000);
  });

  it("×2 à chaque palier au-delà du 5e", () => {
    expect(seuilTechnologie(5)).toBe(10000);
    expect(seuilTechnologie(6)).toBe(20000);
  });

  it("strictement croissant (garantit que le déblocage serveur termine toujours)", () => {
    for (let p = 0; p < 15; p++) {
      expect(seuilTechnologie(p + 1)).toBeGreaterThan(seuilTechnologie(p));
    }
  });
});

describe("catalogue", () => {
  it("5 technologies nommées, une par palier de 0 à 4", () => {
    expect(CATALOGUE_TECHNOLOGIES).toHaveLength(5);
    for (let p = 0; p < 5; p++) {
      expect(typeTechnologie(p)).toBe(CATALOGUE_TECHNOLOGIES[p]);
    }
  });

  it("aucun effet visuel défini au-delà du 5e palier", () => {
    expect(typeTechnologie(5)).toBeNull();
  });
});

describe("technologiesDepuisPalier", () => {
  it("chaque technologie s'active exactement quand son palier est débloqué, jamais avant", () => {
    expect(technologiesDepuisPalier(0)).toEqual({
      eclairageLed: false,
      panneauxSolairesToits: false,
      tramway: false,
      toitsVegetalises: false,
      drones: false,
    });
    expect(technologiesDepuisPalier(1).eclairageLed).toBe(true);
    expect(technologiesDepuisPalier(1).panneauxSolairesToits).toBe(false);
    expect(technologiesDepuisPalier(5)).toEqual({
      eclairageLed: true,
      panneauxSolairesToits: true,
      tramway: true,
      toitsVegetalises: true,
      drones: true,
    });
  });
});
