import { describe, expect, it } from "vitest";
import { Geo } from "@/lib/ville3d/geometrie";
import { ECHELLE_MONUMENT, buildMonument } from "@/lib/ville3d/monuments";
import type { TamponAO } from "@/lib/ville3d/mobilier";
import { CATALOGUE_MONUMENTS } from "@/lib/game/monuments";

/**
 * Monuments agrandis (demande d'Adrien, 02/10/2026) : lisibles de loin
 * (4 à 15 m de haut) sans jamais déborder sur leur voisin dans le secteur
 * (espacement ≥ 40 m, voir emplacements.ts).
 */
describe("taille des monuments", () => {
  it("de 4 m (palier 0) à 15 m (derniers paliers), socle bien en deçà de l'espacement", () => {
    expect(ECHELLE_MONUMENT).toBeGreaterThanOrEqual(2);
    for (let palier = 0; palier < CATALOGUE_MONUMENTS.length; palier++) {
      const ao: TamponAO[] = [];
      buildMonument(new Geo(), 0, 0, CATALOGUE_MONUMENTS[palier].type, palier, ao, 1);
      expect(ao).toHaveLength(1);
      const { x0, x1, h } = ao[0];
      expect(h).toBeGreaterThanOrEqual(4 - 1e-9);
      expect(h).toBeLessThanOrEqual(15.5);
      expect(x1 - x0).toBeLessThan(12); // largeur de l'emprise, très en dessous de 40 m d'espacement
    }
  });

  it("plus un palier est haut, plus le monument est grand (jusqu'au plafond de taille)", () => {
    const taille = (palier: number) => {
      const ao: TamponAO[] = [];
      buildMonument(new Geo(), 0, 0, "obelisque", palier, ao, 1);
      return ao[0].h;
    };
    expect(taille(1)).toBeGreaterThan(taille(0));
    expect(taille(8)).toBeGreaterThan(taille(4));
    expect(taille(15)).toBe(taille(8));
  });
});
