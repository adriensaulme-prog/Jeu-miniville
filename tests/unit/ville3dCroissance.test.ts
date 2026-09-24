import { describe, expect, it } from "vitest";
import { generate, planifierBlocs } from "@/lib/ville3d/generer";
import { dimensionsAO } from "@/lib/ville3d/ao";
import { BLOCK_OPEN, CITY_R_MIN, TOWER_AFTER_OPEN, openAtK, towerAtK } from "@/lib/ville3d/constantes";

/**
 * Jalon 7bis : la ville ne s'arrête jamais de grandir (docs/A-INTEGRER.md
 * §2). Les 16 premiers blocs suivent BLOCK_OPEN, puis un bloc de plus
 * tous les 5 000 habitants, sans limite.
 */
describe("seuils d'ouverture des blocs", () => {
  it("les 16 premiers blocs gardent exactement les seuils d'avant le Jalon 7bis", () => {
    for (let k = 0; k < BLOCK_OPEN.length; k++) expect(openAtK(k)).toBe(BLOCK_OPEN[k]);
  });

  it("au-delà, un bloc de plus tous les 5 000 habitants", () => {
    expect(openAtK(16)).toBe(45000);
    expect(openAtK(17)).toBe(50000);
    expect(openAtK(27)).toBe(100000);
  });

  it("un chantier de gratte-ciel ne démarre jamais moins de 12 000 habitants après l'ouverture de son bloc", () => {
    for (let k = 0; k < 200; k++) expect(towerAtK(k)).toBeGreaterThanOrEqual(openAtK(k) + TOWER_AFTER_OPEN);
  });

  it("repères de la spécification : ~28 blocs à 100 000 habitants, ~58 à 250 000", () => {
    expect(generate("reperes", 100000).stats.active).toBe(28);
    expect(generate("reperes", 250000).stats.active).toBe(58);
  });

  it("la ville continue de grandir au-delà de 40 000 habitants (plus de plafond à 16 blocs)", () => {
    const a = generate("sans-limite", 40000).stats.active;
    const b = generate("sans-limite", 120000).stats.active;
    expect(a).toBe(16);
    expect(b).toBeGreaterThan(a);
  });
});

describe("stabilité : une ville qui grandit ne déplace jamais ce qui est déjà construit", () => {
  const cle = (b: { bi: number; bj: number }) => `${b.bi},${b.bj}`;

  it("chaque bloc ouvert le reste, au même endroit et avec les mêmes seuils, quand la population augmente", () => {
    const paliers = [1, 800, 5000, 20000, 40000, 45000, 100000, 250000, 500000];
    for (const graine of ["stable-a", "stable-b", "bonneuil-matours"]) {
      for (let i = 0; i < paliers.length - 1; i++) {
        const avant = planifierBlocs(graine, paliers[i]).blocks.filter((b) => b.active);
        const apres = new Map(planifierBlocs(graine, paliers[i + 1]).blocks.map((b) => [cle(b), b]));
        for (const b of avant) {
          const meme = apres.get(cle(b));
          expect(meme?.active, `${graine} : bloc ${cle(b)} perdu entre ${paliers[i]} et ${paliers[i + 1]}`).toBe(true);
          expect(meme?.openAt).toBe(b.openAt);
          expect(meme?.towerAt).toBe(b.towerAt);
        }
      }
    }
  });

  it("la ville naît au croisement central et s'étend du centre vers l'extérieur", () => {
    const { blocks } = planifierBlocs("centre", 250000);
    const actifs = blocks.filter((b) => b.active);
    // Le premier bloc touche le croisement des deux grands axes.
    expect([-1, 0]).toContain(actifs[0].bi);
    expect([-1, 0]).toContain(actifs[0].bj);
    // En moyenne, les blocs ouverts tard sont plus loin que les premiers.
    const dist = (b: { bi: number; bj: number }) => Math.hypot(b.bi + 0.5, b.bj + 0.5);
    const moyenne = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
    expect(moyenne(actifs.slice(-10).map(dist))).toBeGreaterThan(moyenne(actifs.slice(0, 10).map(dist)));
  });
});

describe("rayon de ville : brouillard, ombres et occlusion suivent la taille réelle", () => {
  it("jamais sous le plancher, même pour un hameau", () => {
    expect(generate("rayon", 1).stats.cityR).toBe(CITY_R_MIN);
  });

  it("grandit avec la ville", () => {
    const petit = generate("rayon", 40000).stats.cityR;
    const grand = generate("rayon", 500000).stats.cityR;
    expect(grand).toBeGreaterThan(petit);
  });

  it("la carte d'occlusion couvre toute la ville, plus finement au-delà de 300 m", () => {
    for (const C of [1, 100000, 500000]) {
      const { cityR } = generate("occlusion", C).stats;
      expect(dimensionsAO(cityR).ext).toBeGreaterThan(cityR);
    }
    expect(dimensionsAO(CITY_R_MIN).res).toBe(512);
    expect(dimensionsAO(480).res).toBe(1024);
  });
});
