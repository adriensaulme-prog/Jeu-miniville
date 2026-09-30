import { describe, expect, it } from "vitest";
import { CATALOGUE_MONUMENTS, nbMonumentsDebloques, seuilMonument, typeMonument } from "@/lib/game/monuments";

describe("catalogue", () => {
  it("16 paliers, tous les seuils du document (§19)", () => {
    expect(CATALOGUE_MONUMENTS).toHaveLength(16);
    expect(CATALOGUE_MONUMENTS.map((p) => p.seuil)).toEqual([
      10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000,
    ]);
  });

  it("aucun doublon de type", () => {
    const types = CATALOGUE_MONUMENTS.map((p) => p.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("seuilMonument/typeMonument renvoient null au-delà du 16e palier (catalogue fini, pas de suite)", () => {
    expect(seuilMonument(16)).toBeNull();
    expect(typeMonument(16)).toBeNull();
    expect(seuilMonument(0)).toBe(10);
    expect(typeMonument(15)).toBe("monument_ultime");
  });
});

describe("nbMonumentsDebloques", () => {
  it("0 en dessous du premier seuil, croît à chaque palier franchi", () => {
    expect(nbMonumentsDebloques(0)).toBe(0);
    expect(nbMonumentsDebloques(9)).toBe(0);
    expect(nbMonumentsDebloques(10)).toBe(1);
    expect(nbMonumentsDebloques(24)).toBe(1);
    expect(nbMonumentsDebloques(25)).toBe(2);
  });

  it("plafonne à 16 même très au-delà du dernier seuil", () => {
    expect(nbMonumentsDebloques(1_000_000)).toBe(16);
    expect(nbMonumentsDebloques(50_000_000)).toBe(16);
  });
});
