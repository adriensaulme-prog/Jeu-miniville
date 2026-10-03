import { describe, expect, it } from "vitest";
import {
  AXE_ENERGIE,
  AXE_MEGAPROJETS,
  CEINTURE,
  cleDe,
  emplacementCentrale,
  emplacementEnergie,
  emplacementMegaprojet,
} from "@/lib/ville3d/emplacements";
import { generate } from "@/lib/ville3d/generer";
import { PLAFOND_RENDU_POPULATION } from "@/lib/ville3d/constantes";
import { ENERGIE_MAX_INSTALLATIONS } from "@/lib/ville3d/constantes";

/**
 * A-INTEGRER §25 : Énergie et mégaprojets ont chacun leur secteur fixe,
 * au-delà de la ville la plus grande qu'on dessine, et ne se chevauchent
 * pas entre eux. (Les monuments, eux, sont dans la ville depuis le §33 :
 * voir tests/unit/monumentsVille.test.ts.)
 */
const normeMax = (p: { x: number; z: number }) => Math.max(Math.abs(p.x), Math.abs(p.z));
/** Angle (degrés, −180..180) de l'axe de secteur le plus proche, écart au centre du secteur. */
const ecartAAxe = (p: { x: number; z: number }, axeDeg: number) => {
  const a = (Math.atan2(p.z, p.x) * 180) / Math.PI;
  return Math.abs(((a - axeDeg + 540) % 360) - 180);
};
const distance = (p: { x: number; z: number }, q: { x: number; z: number }) => Math.hypot(p.x - q.x, p.z - q.z);

const CLES = ["ville-a", "0b7c4f3e-demo", "accueil"];

describe("emplacements de la campagne (§25)", () => {
  it("la ceinture est au-delà du rayon de la ville au plafond de rendu", () => {
    for (const cle of CLES) {
      const { stats } = generate(cle, PLAFOND_RENDU_POPULATION);
      expect(stats.cityR + 20).toBeLessThanOrEqual(CEINTURE);
    }
  });

  it("énergie et mégaprojets restent dans leur secteur (±30°) et hors de la ville", () => {
    for (const cle of CLES) {
      for (let k = 0; k < ENERGIE_MAX_INSTALLATIONS; k++) {
        const p = emplacementEnergie(cle, k);
        expect(normeMax(p)).toBeGreaterThanOrEqual(CEINTURE - 0.01);
        expect(ecartAAxe(p, AXE_ENERGIE)).toBeLessThanOrEqual(30.01);
      }
      const c = emplacementCentrale(cle);
      expect(normeMax(c)).toBeGreaterThanOrEqual(CEINTURE - 0.01);
      expect(ecartAAxe(c, AXE_ENERGIE)).toBeLessThanOrEqual(30.01);
      for (let palier = 0; palier < 39; palier++) {
        const p = emplacementMegaprojet(cle, palier);
        expect(normeMax(p)).toBeGreaterThanOrEqual(CEINTURE - 0.01);
        expect(ecartAAxe(p, AXE_MEGAPROJETS)).toBeLessThanOrEqual(30.01);
      }
    }
  });

  it("jamais deux mégaprojets à moins de 40 m l'un de l'autre", () => {
    for (const cle of CLES) {
      const mega = Array.from({ length: 39 }, (_, i) => emplacementMegaprojet(cle, i));
      for (let i = 0; i < mega.length; i++)
        for (let j = i + 1; j < mega.length; j++) expect(distance(mega[i], mega[j])).toBeGreaterThan(40);
    }
  });

  it("la position d'un palier ne dépend que de la ville et du palier : stable quand d'autres se débloquent", () => {
    expect(emplacementMegaprojet("ville-a", 2)).toEqual(emplacementMegaprojet("ville-a", 2));
    expect(emplacementEnergie("ville-a", 5)).toEqual(emplacementEnergie("ville-a", 5));
  });

  it("les paliers hauts sont plus loin que les bas (rangées successives)", () => {
    const proche = normeMax(emplacementMegaprojet("ville-a", 0));
    const loin = normeMax(emplacementMegaprojet("ville-a", 12));
    expect(loin).toBeGreaterThan(proche + 120);
  });

  it("la clé de ville normalisée (cleDe) est la même que celle du rendu : casse et espaces ignorés", () => {
    expect(cleDe("  Ville-A ")).toBe("ville-a");
    expect(cleDe("")).toBe("ville");
  });

  it("la géométrie générée est déterministe, quels que soient les monuments débloqués", () => {
    const avec = generate("ville-a", 20_000, undefined, 0, [], 0, [{ palier: 0, type: "borne_commemorative" }]);
    const avec2 = generate("ville-a", 20_000, undefined, 0, [], 0, [{ palier: 0, type: "borne_commemorative" }]);
    expect(avec2.g.V.length).toBe(avec.g.V.length);
  });
});
