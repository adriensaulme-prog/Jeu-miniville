import { describe, expect, it } from "vitest";
import {
  AXE_ENERGIE,
  AXE_MEGAPROJETS,
  AXE_MONUMENTS,
  CEINTURE,
  cleDe,
  emplacementCentrale,
  emplacementEnergie,
  emplacementMegaprojet,
  emplacementMonument,
} from "@/lib/ville3d/emplacements";
import { generate } from "@/lib/ville3d/generer";
import { PLAFOND_RENDU_POPULATION } from "@/lib/ville3d/constantes";
import { CATALOGUE_MONUMENTS } from "@/lib/game/monuments";
import { ENERGIE_MAX_INSTALLATIONS } from "@/lib/ville3d/constantes";

/**
 * A-INTEGRER §25 : Énergie, mégaprojets et monuments ont chacun leur
 * secteur fixe, au-delà de la ville la plus grande qu'on dessine, et ne
 * se chevauchent pas entre eux.
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

  it("énergie, mégaprojets et monuments restent dans leur secteur (±30°) et hors de la ville", () => {
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
      for (let palier = 0; palier < CATALOGUE_MONUMENTS.length; palier++) {
        const p = emplacementMonument(cle, palier);
        expect(normeMax(p)).toBeGreaterThanOrEqual(CEINTURE - 0.01);
        expect(ecartAAxe(p, AXE_MONUMENTS)).toBeLessThanOrEqual(30.01);
      }
    }
  });

  it("les 16 monuments ne se chevauchent jamais (au moins 40 m entre deux) et jamais deux mégaprojets à moins de 40 m l'un de l'autre", () => {
    for (const cle of CLES) {
      const monuments = CATALOGUE_MONUMENTS.map((_, i) => emplacementMonument(cle, i));
      for (let i = 0; i < monuments.length; i++)
        for (let j = i + 1; j < monuments.length; j++) expect(distance(monuments[i], monuments[j])).toBeGreaterThan(40);
      const mega = Array.from({ length: 39 }, (_, i) => emplacementMegaprojet(cle, i));
      for (let i = 0; i < mega.length; i++)
        for (let j = i + 1; j < mega.length; j++) expect(distance(mega[i], mega[j])).toBeGreaterThan(40);
    }
  });

  it("la position d'un palier ne dépend que de la ville et du palier : stable quand d'autres se débloquent", () => {
    expect(emplacementMonument("ville-a", 3)).toEqual(emplacementMonument("ville-a", 3));
    expect(emplacementMegaprojet("ville-a", 2)).toEqual(emplacementMegaprojet("ville-a", 2));
    expect(emplacementEnergie("ville-a", 5)).toEqual(emplacementEnergie("ville-a", 5));
    expect(emplacementMonument("ville-a", 3)).not.toEqual(emplacementMonument("ville-b", 3));
  });

  it("les paliers hauts sont plus loin que les bas (rangées successives)", () => {
    const proche = normeMax(emplacementMonument("ville-a", 0));
    const loin = normeMax(emplacementMonument("ville-a", 15));
    expect(loin).toBeGreaterThan(proche + 120);
  });

  it("la clé de ville normalisée (cleDe) est la même que celle du rendu : casse et espaces ignorés", () => {
    expect(cleDe("  Ville-A ")).toBe("ville-a");
    expect(cleDe("")).toBe("ville");
  });

  it("la géométrie générée change quand on débloque un monument, et reste identique sinon (déterminisme)", () => {
    const sans = generate("ville-a", 20_000);
    const avec = generate("ville-a", 20_000, undefined, 0, [], 0, [{ palier: 0, type: "borne_commemorative" }]);
    const avec2 = generate("ville-a", 20_000, undefined, 0, [], 0, [{ palier: 0, type: "borne_commemorative" }]);
    expect(avec.g.V.length).toBeGreaterThan(sans.g.V.length);
    expect(avec2.g.V.length).toBe(avec.g.V.length);
  });
});
