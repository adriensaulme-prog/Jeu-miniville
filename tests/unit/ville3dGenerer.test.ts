import { describe, expect, it } from "vitest";
import { generate } from "@/lib/ville3d/generer";
import { STAGE_AT } from "@/lib/ville3d/constantes";

describe("generate (rendu 3D)", () => {
  it("est déterministe : même graine, même population => exactement la même géométrie", () => {
    const a = generate("bonneuil-matours", 25000);
    const b = generate("bonneuil-matours", 25000);
    expect(b.g.n).toBe(a.g.n);
    expect(b.g.V).toEqual(a.g.V);
    expect(b.g.I).toEqual(a.g.I);
  });

  it("deux graines différentes donnent des villes différentes", () => {
    const a = generate("ville-a", 10000);
    const b = generate("ville-b", 10000);
    expect(a.g.V).not.toEqual(b.g.V);
  });

  it("produit toujours des triangles valides (indices multiples de 3, dans les bornes)", () => {
    const { g } = generate("verification-indices", 40000);
    expect(g.I.length % 3).toBe(0);
    // Un seul expect() sur un booléen agrégé : appeler expect() par indice
    // (potentiellement des centaines de milliers) coûte cher en overhead
    // d'assertion pour un gain de diagnostic nul ici.
    const tousValides = g.I.every((i) => i >= 0 && i < g.n);
    expect(tousValides).toBe(true);
  });

  it("plus la population est grande, plus il y a de blocs actifs et de sommets", () => {
    const hameau = generate("croissance", 1);
    const metropole = generate("croissance", 100000);
    expect(metropole.stats.active).toBeGreaterThan(hameau.stats.active);
    expect(metropole.g.n).toBeGreaterThan(hameau.g.n);
  });

  it("sabotage : ne plante pas aux bornes (population 0, très grande population)", () => {
    expect(() => generate("borne-basse", 0)).not.toThrow();
    expect(() => generate("borne-haute", 500000)).not.toThrow();
  });

  it("un gratte-ciel n'apparaît qu'à partir du seuil du niveau Ville (population_max)", () => {
    const [, , , seuilVille] = STAGE_AT; // [Hameau, Village, Bourg, Ville, ...]
    const avant = generate("avant-gratte-ciel", seuilVille - 1);
    const apres = generate("avant-gratte-ciel", seuilVille + 100);
    expect(avant.stats.towers).toBe(0);
    expect(apres.stats.towers).toBeGreaterThan(0);
  });
});
