import { describe, expect, it } from "vitest";
import { hashStr, pick, rngFrom, rr } from "@/lib/ville3d/aleatoire";

describe("hashStr", () => {
  it("est déterministe : la même chaîne donne toujours le même hash", () => {
    expect(hashStr("Bonneuil-Matours")).toBe(hashStr("Bonneuil-Matours"));
  });

  it("des chaînes différentes donnent (presque toujours) des hash différents", () => {
    expect(hashStr("ville-a")).not.toBe(hashStr("ville-b"));
  });
});

describe("rngFrom", () => {
  it("même graine => même suite de nombres (identité visuelle stable d'une ville)", () => {
    const suiteA = Array.from({ length: 20 }, rngFrom("ma-ville"));
    const suiteB = Array.from({ length: 20 }, rngFrom("ma-ville"));
    expect(suiteA).toEqual(suiteB);
  });

  it("graines différentes => suites différentes", () => {
    const suiteA = Array.from({ length: 20 }, rngFrom("ville-a"));
    const suiteB = Array.from({ length: 20 }, rngFrom("ville-b"));
    expect(suiteA).not.toEqual(suiteB);
  });

  it("reste dans [0, 1)", () => {
    const r = rngFrom("bornes");
    for (let i = 0; i < 500; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("pick / rr", () => {
  it("pick choisit toujours un élément du tableau fourni", () => {
    const r = rngFrom("choix");
    const options = ["a", "b", "c"];
    for (let i = 0; i < 50; i++) {
      expect(options).toContain(pick(r, options));
    }
  });

  it("rr reste dans l'intervalle [a, b)", () => {
    const r = rngFrom("intervalle");
    for (let i = 0; i < 200; i++) {
      const v = rr(r, 5, 9);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThan(9);
    }
  });
});
