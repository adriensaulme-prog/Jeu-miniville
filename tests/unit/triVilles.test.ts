import { describe, expect, it } from "vitest";
import { trierVilles, triValide, type VilleTriable } from "@/lib/game/triVilles";

/** A-INTEGRER §26 E : tris alternatifs de /villes. */
const v = (id: string, population: number, created_at: string): VilleTriable => ({ id, population, created_at });

const GROSSE = v("grosse", 5000, "2026-01-01T00:00:00Z");
const MOYENNE = v("moyenne", 300, "2026-06-01T00:00:00Z");
const NEUVE_A = v("neuve-a", 1, "2026-10-01T10:00:00Z");
const NEUVE_B = v("neuve-b", 1, "2026-10-02T10:00:00Z");
const MOI = v("moi", 40, "2026-03-01T00:00:00Z");
const TOUTES = [NEUVE_A, GROSSE, MOI, NEUVE_B, MOYENNE];

describe("tri de la liste des villes", () => {
  it("triValide : valeur inconnue ou absente => population (le tri par défaut d'Adrien)", () => {
    expect(triValide(undefined)).toBe("population");
    expect(triValide("n'importe quoi")).toBe("population");
    expect(triValide("recentes")).toBe("recentes");
    expect(triValide("a_visiter")).toBe("a_visiter");
  });

  it("population : décroissante, comme avant", () => {
    expect(trierVilles(TOUTES, "population", new Map(), "moi").map((x) => x.id)).toEqual([
      "grosse",
      "moyenne",
      "moi",
      "neuve-a",
      "neuve-b",
    ]);
  });

  it("récentes : la plus récemment créée d'abord", () => {
    expect(trierVilles(TOUTES, "recentes", new Map(), "moi").map((x) => x.id)).toEqual([
      "neuve-b",
      "neuve-a",
      "moyenne",
      "moi",
      "grosse",
    ]);
  });

  it("à visiter : les moins visitées sur 7 jours d'abord, à égalité les plus récentes, jamais sa propre ville", () => {
    const visites = new Map([
      ["grosse", 40],
      ["moyenne", 6],
      ["neuve-a", 1],
      ["moi", 0],
    ]);
    // neuve-b n'a aucune visite (absente du compteur) : la plus prioritaire.
    expect(trierVilles(TOUTES, "a_visiter", visites, "moi").map((x) => x.id)).toEqual([
      "neuve-b",
      "neuve-a",
      "moyenne",
      "grosse",
    ]);
  });

  it("à égalité de visites, la plus récente passe devant", () => {
    const r = trierVilles([NEUVE_A, NEUVE_B], "a_visiter", new Map(), "moi").map((x) => x.id);
    expect(r).toEqual(["neuve-b", "neuve-a"]);
  });

  it("la liste d'entrée n'est jamais modifiée", () => {
    const avant = TOUTES.map((x) => x.id);
    trierVilles(TOUTES, "recentes", new Map(), "moi");
    trierVilles(TOUTES, "a_visiter", new Map(), "moi");
    expect(TOUTES.map((x) => x.id)).toEqual(avant);
  });
});
