import { describe, expect, it } from "vitest";
import { generate, planifierBlocs } from "@/lib/ville3d/generer";
import { casesCentrales } from "@/lib/ville3d/cases";
import { PLAFOND_RENDU_POPULATION, blockX0, BS } from "@/lib/ville3d/constantes";
import { MONUMENTS_PAR_COUR, placesMonuments } from "@/lib/ville3d/monumentsVille";
import { CATALOGUE_MONUMENTS } from "@/lib/game/monuments";
import { ECHELLE_MONUMENT } from "@/lib/ville3d/monuments";

/**
 * A-INTEGRER §33 : les monuments sont DANS la ville, dans la cour des
 * premiers blocs (deux par cour), et ne bougent jamais.
 */
const PALIERS = CATALOGUE_MONUMENTS.map((_, i) => i);
const CLES = ["ville-a", "0b7c4f3e-demo", "accueil"];

describe("monuments dans la ville (§33)", () => {
  it("les 16 monuments tiennent dans les 8 cases les plus centrales, deux par cour", () => {
    for (const cle of CLES) {
      const places = placesMonuments(cle, PALIERS);
      expect(places.size).toBe(16);
      const parCase = new Map<string, number>();
      for (const p of places.values()) parCase.set(p.bi + "," + p.bj, (parCase.get(p.bi + "," + p.bj) ?? 0) + 1);
      expect(parCase.size).toBe(8);
      for (const n of parCase.values()) expect(n).toBe(MONUMENTS_PAR_COUR);
      const centrales = new Set(casesCentrales(cle, 8).map((c) => c.bi + "," + c.bj));
      for (const k of parCase.keys()) expect(centrales.has(k)).toBe(true);
    }
  });

  it("chaque monument est à l'intérieur de son bloc, sur la cour, et loin du bord", () => {
    for (const cle of CLES) {
      for (const p of placesMonuments(cle, PALIERS).values()) {
        const x0 = blockX0(p.bi),
          z0 = blockX0(p.bj);
        expect(p.x).toBeGreaterThan(x0 + 14);
        expect(p.x).toBeLessThan(x0 + BS - 14);
        expect(p.z).toBeGreaterThan(z0 + 14);
        expect(p.z).toBeLessThan(z0 + BS - 14);
      }
    }
  });

  it("deux monuments ne se touchent jamais, même les plus grands (socles de ~5 m de rayon)", () => {
    const rayonMax = (1.1 + 8 * 0.12) * ECHELLE_MONUMENT;
    for (const cle of CLES) {
      const places = [...placesMonuments(cle, PALIERS).values()];
      for (let i = 0; i < places.length; i++)
        for (let j = i + 1; j < places.length; j++) {
          expect(Math.hypot(places[i].x - places[j].x, places[i].z - places[j].z)).toBeGreaterThan(2 * rayonMax);
        }
    }
  });

  it("la position d'un palier ne dépend ni des autres paliers débloqués ni de la population", () => {
    const seul = placesMonuments("ville-a", [9]).get(9)!;
    const tous = placesMonuments("ville-a", PALIERS).get(9)!;
    expect(tous).toEqual(seul);
    // Même case quelle que soit la population : les cases centrales ne dépendent que de la graine.
    const petite = planifierBlocs("ville-a", 300).blocks.slice(0, 8).map((b) => b.bi + "," + b.bj);
    const grande = planifierBlocs("ville-a", PLAFOND_RENDU_POPULATION).blocks.slice(0, 8).map((b) => b.bi + "," + b.bj);
    expect(petite).toEqual(grande);
    expect(petite).toEqual(casesCentrales("ville-a", 8).map((c) => c.bi + "," + c.bj));
  });

  it("les monuments sont à l'intérieur de la ville : plus aucun à plus de 168 m du centre (rayon minimal d'une ville)", () => {
    for (const cle of CLES) {
      for (const p of placesMonuments(cle, PALIERS).values()) {
        expect(Math.max(Math.abs(p.x), Math.abs(p.z))).toBeLessThan(168);
      }
    }
  });

  it("le rendu pose bien les monuments et libère la cour (moins de décor, plus de monuments)", () => {
    const sans = generate("ville-a", 30000);
    const avec = generate("ville-a", 30000, undefined, 0, [], 0, [{ palier: 0, type: "borne_commemorative" }]);
    // Un monument de plus dans la géométrie, mais la fontaine et les arbres de la cour sont retirés.
    expect(avec.g.V.length).not.toBe(sans.g.V.length);
    const encore = generate("ville-a", 30000, undefined, 0, [], 0, [{ palier: 0, type: "borne_commemorative" }]);
    expect(encore.g.V.length).toBe(avec.g.V.length); // déterministe
  });
});
