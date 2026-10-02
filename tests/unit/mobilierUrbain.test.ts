import { describe, expect, it } from "vitest";
import { Geo } from "@/lib/ville3d/geometrie";
import { rngFrom } from "@/lib/ville3d/aleatoire";
import { abribus, banc, fontaine, kiosque } from "@/lib/ville3d/mobilier";

function sansNaN(g: Geo): boolean {
  return g.V.every((v) => Number.isFinite(v));
}

describe("mobilier urbain (docs/BATIMENTS-ET-PACKS.md §3)", () => {
  it("banc produit une géométrie non vide et sans NaN, dans les deux orientations", () => {
    const g1 = new Geo();
    banc(g1, 10, 10, true);
    expect(g1.n).toBeGreaterThan(0);
    expect(sansNaN(g1)).toBe(true);

    const g2 = new Geo();
    banc(g2, 10, 10, false);
    expect(g2.n).toBeGreaterThan(0);
    expect(sansNaN(g2)).toBe(true);
  });

  it("fontaine produit une géométrie non vide et sans NaN", () => {
    const g = new Geo();
    fontaine(g, 0, 0);
    expect(g.n).toBeGreaterThan(0);
    expect(sansNaN(g)).toBe(true);
  });

  it("abribus produit une géométrie non vide et sans NaN, dans les deux orientations", () => {
    const g1 = new Geo();
    abribus(g1, 5, 5, true);
    expect(g1.n).toBeGreaterThan(0);
    expect(sansNaN(g1)).toBe(true);

    const g2 = new Geo();
    abribus(g2, 5, 5, false);
    expect(g2.n).toBeGreaterThan(0);
    expect(sansNaN(g2)).toBe(true);
  });

  it("kiosque produit une géométrie non vide et sans NaN", () => {
    const g = new Geo();
    kiosque(g, 0, 0, rngFrom("test-kiosque"));
    expect(g.n).toBeGreaterThan(0);
    expect(sansNaN(g)).toBe(true);
  });

  it("kiosque est déterministe : même graine, même géométrie", () => {
    const g1 = new Geo();
    kiosque(g1, 0, 0, rngFrom("meme-graine"));
    const g2 = new Geo();
    kiosque(g2, 0, 0, rngFrom("meme-graine"));
    expect(g2.V).toEqual(g1.V);
  });
});
