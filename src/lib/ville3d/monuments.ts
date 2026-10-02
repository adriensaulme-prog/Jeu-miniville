/**
 * Monuments d'influence (Jalon 20 3/3, docs/A-INTEGRER.md §19) : des
 * repères modestes (bornes, bustes, statues...) — volontairement plus
 * petits et plus sobres que les mégaprojets (des bâtiments civiques),
 * pour qu'on les distingue au premier coup d'œil. Bâtiments simples
 * pour cette première passe, même philosophie que les mégaprojets et
 * les technologies : un socle, une silhouette parmi trois archétypes
 * selon le type, une teinte dorée/bronze commune plutôt que liée à une
 * activité (les monuments ne sont rattachés à aucune activité).
 */
import { COL, MAT, hex } from "./constantes";
import { box, cylinder, shadeC, type Geo } from "./geometrie";
import type { TamponAO } from "./mobilier";

const ACCENT = hex("#c9a227");

/**
 * Échelle des monuments. D'abord conçus « modestes » (2 à 6 m de haut pour
 * des blocs de 64 m), ils n'étaient presque pas visibles de loin : Adrien a
 * demandé de les agrandir nettement (02/10/2026). Un seul coefficient, mêmes
 * silhouettes : 4 m (palier 0) à 15 m (derniers paliers) de haut, socle de
 * 2,75 à 5 m de rayon — toujours très en deçà de l'espacement des monuments
 * dans leur secteur (≥ 40 m, voir emplacements.ts).
 */
export const ECHELLE_MONUMENT = 2.5;

function hashType(type: string): number {
  let h = 0;
  for (let i = 0; i < type.length; i++) h += type.charCodeAt(i);
  return h;
}

export function buildMonument(g: Geo, cx: number, cz: number, type: string, palier: number, ao: TamponAO[], seed: number) {
  const rSocle = (1.1 + Math.min(palier, 8) * 0.12) * ECHELLE_MONUMENT;
  const h = (1.6 + Math.min(palier, 8) * 0.55) * ECHELLE_MONUMENT;
  const y0 = 0.15;
  const epaisseurSocle = 0.3 * ECHELLE_MONUMENT;

  cylinder(g, cx, y0, cz, rSocle, epaisseurSocle, 12, COL.stone, MAT.PLAIN, MAT.PAVING, COL.paving);

  const silhouette = hashType(type) % 3;
  if (silhouette === 0) {
    // Colonne/obélisque : fût effilé vers le haut.
    cylinder(g, cx, y0 + epaisseurSocle, cz, rSocle * 0.55, h, 10, shadeC(ACCENT, 0.85), MAT.PLAIN, MAT.PLAIN, ACCENT, rSocle * 0.12);
  } else if (silhouette === 1) {
    // Statue/buste : socle carré + volume compact au sommet.
    const w = rSocle * 0.65;
    box(g, cx - w, y0 + epaisseurSocle, cz - w, cx + w, y0 + epaisseurSocle + h * 0.7, cz + w, { c: shadeC(ACCENT, 0.75), m: MAT.CONCRETE, seed });
    cylinder(g, cx, y0 + epaisseurSocle + h * 0.7, cz, w * 0.7, h * 0.3, 10, ACCENT, MAT.PLAIN, MAT.PLAIN, ACCENT, w * 0.3);
  } else {
    // Arche/fontaine : deux piliers reliés par un linteau bas.
    const half = rSocle * 0.6,
      pw = rSocle * 0.18;
    box(g, cx - half - pw, y0 + epaisseurSocle, cz - pw, cx - half + pw, y0 + epaisseurSocle + h, cz + pw, { c: shadeC(ACCENT, 0.8), m: MAT.PLAIN, seed });
    box(g, cx + half - pw, y0 + epaisseurSocle, cz - pw, cx + half + pw, y0 + epaisseurSocle + h, cz + pw, { c: shadeC(ACCENT, 0.8), m: MAT.PLAIN, seed });
    box(g, cx - half - pw, y0 + epaisseurSocle + h - epaisseurSocle, cz - pw, cx + half + pw, y0 + epaisseurSocle + h, cz + pw, { c: ACCENT, m: MAT.PLAIN, seed });
  }

  ao.push({ x0: cx - rSocle, z0: cz - rSocle, x1: cx + rSocle, z1: cz + rSocle, w: 1, h });
}
