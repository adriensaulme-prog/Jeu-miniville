/**
 * Bâtiments : maisons, immeubles, gratte-ciel — catalogue de modèles
 * (docs/BATIMENTS-ET-PACKS.md, jalon "La bibliothèque de bâtiments").
 * Le modèle d'origine de chaque famille (porté depuis
 * docs/prototypes/prototype-ville-3d.html) reste le premier modèle du
 * pack "classique" ; les autres sont de nouvelles variantes ajoutées
 * pour cette étape.
 *
 * Portée assumée pour cette première passe (voir docs/DECISIONS.md §4,
 * journal de ce jalon) : 6 maisons, 4 immeubles, 2 tours — l'objectif
 * "~30 modèles" du document sera atteint en plusieurs passes ;
 * l'infrastructure (types, sélection stable, showroom, tests) est
 * conçue pour qu'ajouter un modèle plus tard soit juste une entrée de
 * plus dans un tableau. Le mobilier urbain (arbres/voitures) n'est pas
 * repris en catalogue ici, il reste géré par mobilier.ts.
 */

import type { RNG } from "./aleatoire";
import { pick, rr } from "./aleatoire";
import {
  APART_WALLS,
  COL,
  FLOOR_H,
  GLASS_TINTS,
  HOUSE_ROOFS,
  HOUSE_WALLS,
  LOT,
  MAT,
  PODIUM_H,
  hex,
} from "./constantes";
import { box, cylinder, flat, gableRoof, shadeC, type Geo } from "./geometrie";
import { car, crane, tree, type TamponAO } from "./mobilier";
import {
  choisirModele,
  type Facade,
  type ModeleImmeuble,
  type ModeleMaison,
  type ModeleTour,
  type Rect,
} from "./catalogue";

export type { Facade, Rect };

/** Place un rectangle (largeur le long de la façade, profondeur) dans une parcelle, collé côté rue. */
export function placeInLot(
  rect: Rect,
  front: Facade,
  width: number,
  depth: number,
  setback: number,
  lateral?: number
): Rect {
  const [x0, z0, x1, z1] = rect;
  const cx = (x0 + x1) / 2 + (lateral || 0),
    cz = (z0 + z1) / 2 + (lateral || 0);
  switch (front) {
    case "-z":
      return [cx - width / 2, z0 + setback, cx + width / 2, z0 + setback + depth];
    case "+z":
      return [cx - width / 2, z1 - setback - depth, cx + width / 2, z1 - setback];
    case "-x":
      return [x0 + setback, cz - width / 2, x0 + setback + depth, cz + width / 2];
    default:
      return [x1 - setback - depth, cz - width / 2, x1 - setback, cz + width / 2];
  }
}

/**
 * Décor de jardin partagé par les modèles de maisons : allée jusqu'à la
 * porte, haies (pas toujours), arbre au fond, voiture garée (une fois
 * sur deux). Extrait tel quel de l'ancien buildHouse() unique.
 */
function decorJardin(g: Geo, rect: Rect, fp: Rect, front: Facade, r: RNG, ao: TamponAO[], haie = true) {
  const alongX = front === "-z" || front === "+z";
  const [x0, z0, x1, z1] = rect;
  const dc = alongX ? (fp[0] + fp[2]) / 2 : (fp[1] + fp[3]) / 2;
  const pathY = 0.17;
  if (front === "-z") flat(g, dc - 0.6, z0, dc + 0.6, fp[1], pathY, COL.paving, MAT.PAVING);
  if (front === "+z") flat(g, dc - 0.6, fp[3], dc + 0.6, z1, pathY, COL.paving, MAT.PAVING);
  if (front === "-x") flat(g, x0, dc - 0.6, fp[0], dc + 0.6, pathY, COL.paving, MAT.PAVING);
  if (front === "+x") flat(g, fp[2], dc - 0.6, x1, dc + 0.6, pathY, COL.paving, MAT.PAVING);

  if (haie) {
    const hedgeC = hex("#3f6f33");
    if (r() < 0.75) {
      const hH = 0.95,
        t = 0.55,
        y = 0.15;
      if (alongX) {
        box(g, x0 + 0.2, y, z0 + 0.3, x0 + 0.2 + t, y + hH, z1 - 0.3, { c: hedgeC, m: MAT.FOLIAGE });
        box(g, x1 - 0.2 - t, y, z0 + 0.3, x1 - 0.2, y + hH, z1 - 0.3, { c: hedgeC, m: MAT.FOLIAGE });
      } else {
        box(g, x0 + 0.3, y, z0 + 0.2, x1 - 0.3, y + hH, z0 + 0.2 + t, { c: hedgeC, m: MAT.FOLIAGE });
        box(g, x0 + 0.3, y, z1 - 0.2 - t, x1 - 0.3, y + hH, z1 - 0.2, { c: hedgeC, m: MAT.FOLIAGE });
      }
    }
  }
  const back = placeInLot(rect, front, 2, 2, LOT - 3.2, rr(r, -3.5, 3.5));
  tree(g, (back[0] + back[2]) / 2, (back[1] + back[3]) / 2, 0.15, rr(r, 0.8, 1.05), r, ao);
  if (r() < 0.5) {
    const sideOff = alongX ? (fp[2] + 2.0 < x1 - 1.5 ? 1 : -1) : fp[3] + 2.0 < z1 - 1.5 ? 1 : -1;
    if (front === "-z") car(g, sideOff > 0 ? fp[2] + 1.6 : fp[0] - 1.6, z0 + 2.6, false, r, 0.16);
    if (front === "+z") car(g, sideOff > 0 ? fp[2] + 1.6 : fp[0] - 1.6, z1 - 2.6, false, r, 0.16);
    if (front === "-x") car(g, x0 + 2.6, sideOff > 0 ? fp[3] + 1.6 : fp[1] - 1.6, true, r, 0.16);
    if (front === "+x") car(g, x1 - 2.6, sideOff > 0 ? fp[3] + 1.6 : fp[1] - 1.6, true, r, 0.16);
  }
}

// ---------------------------------------------------------------------
// Catalogue « Maisons »
// ---------------------------------------------------------------------

/** maison-pavillon : le modèle d'origine (1-2 étages, toit à deux pans, lucarne parfois). */
function construireMaisonPavillon(g: Geo, rect: Rect, front: Facade, r: RNG, ao: TamponAO[], seed: number) {
  const wallC = pick(r, HOUSE_WALLS),
    roofC = pick(r, HOUSE_ROOFS);
  const floors = r() < 0.6 ? 2 : 1;
  const wallH = floors === 2 ? 5.7 : 3.0;
  const width = rr(r, 8.2, 9.4),
    depth = rr(r, 7.6, 9.0);
  const lateral = rr(r, -1.2, 1.2);
  const fp = placeInLot(rect, front, width, depth, 3.4, lateral);
  const y0 = 0.15;
  box(g, fp[0], y0, fp[1], fp[2], y0 + wallH, fp[3], {
    c: wallC,
    m: MAT.HOUSE,
    front,
    frontM: MAT.HOUSE_FRONT,
    top: false,
    seed,
    base: y0,
  });
  const alongX = front === "-z" || front === "+z";
  const yR = gableRoof(g, fp[0], fp[1], fp[2], fp[3], y0 + wallH, 0.62, 0.45, alongX, roofC, wallC, seed);
  if (r() < 0.6) {
    const cxp = alongX ? fp[0] + (fp[2] - fp[0]) * rr(r, 0.2, 0.8) : (fp[0] + fp[2]) / 2 + rr(r, -1, 1);
    const czp = alongX ? (fp[1] + fp[3]) / 2 + rr(r, -1, 1) : fp[1] + (fp[3] - fp[1]) * rr(r, 0.2, 0.8);
    box(g, cxp - 0.4, yR - 1.4, czp - 0.4, cxp + 0.4, yR + 0.9, czp + 0.4, {
      c: shadeC(wallC, 0.85),
      m: MAT.PLAIN,
      seed,
    });
  }
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h: wallH });
  decorJardin(g, rect, fp, front, r, ao);
}

/** maison-longere : plain-pied, basse et allongée, sans étage ni lucarne — appentis attenant. */
function construireMaisonLongere(g: Geo, rect: Rect, front: Facade, r: RNG, ao: TamponAO[], seed: number) {
  const wallC = pick(r, HOUSE_WALLS),
    roofC = pick(r, HOUSE_ROOFS);
  const wallH = 3.0;
  const width = rr(r, 11.5, 13.2),
    depth = rr(r, 5.8, 6.8);
  const alongX = front === "-z" || front === "+z";
  const fp = placeInLot(rect, front, width, depth, 3.6, rr(r, -0.6, 0.6));
  const y0 = 0.15;
  box(g, fp[0], y0, fp[1], fp[2], y0 + wallH, fp[3], {
    c: wallC,
    m: MAT.HOUSE,
    front,
    frontM: MAT.HOUSE_FRONT,
    top: false,
    seed,
    base: y0,
  });
  gableRoof(g, fp[0], fp[1], fp[2], fp[3], y0 + wallH, 0.42, 0.4, alongX, roofC, wallC, seed);
  // appentis (remise) accolé à un pignon
  const appH = 2.1;
  if (alongX) {
    box(g, fp[0] - 2.6, y0, fp[1] + 0.6, fp[0], y0 + appH, fp[3] - 0.6, {
      c: shadeC(wallC, 0.9),
      m: MAT.PLAIN,
      topM: MAT.FLATROOF,
      topC: COL.roofGray,
      seed,
    });
  } else {
    box(g, fp[0] + 0.6, y0, fp[1] - 2.6, fp[2] - 0.6, y0 + appH, fp[1], {
      c: shadeC(wallC, 0.9),
      m: MAT.PLAIN,
      topM: MAT.FLATROOF,
      topC: COL.roofGray,
      seed,
    });
  }
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h: wallH });
  decorJardin(g, rect, fp, front, r, ao);
}

/** maison-ville : étroite, 2-3 étages, toit-terrasse (parapet) — mitoyenne, jardin minimal. */
function construireMaisonVille(g: Geo, rect: Rect, front: Facade, r: RNG, ao: TamponAO[], seed: number) {
  const wallC = pick(r, HOUSE_WALLS);
  const floors = r() < 0.5 ? 3 : 2;
  const wallH = floors * 2.85;
  const width = rr(r, 6.4, 7.4),
    depth = rr(r, 8.2, 9.4);
  const fp = placeInLot(rect, front, width, depth, 3.2, 0);
  const y0 = 0.15;
  box(g, fp[0], y0, fp[1], fp[2], y0 + wallH, fp[3], {
    c: wallC,
    m: MAT.HOUSE,
    front,
    frontM: MAT.HOUSE_FRONT,
    topM: MAT.FLATROOF,
    topC: COL.roofGray,
    seed,
    base: y0,
  });
  const t = 0.22,
    ph = 0.55,
    yt = y0 + wallH,
    pc = shadeC(wallC, 0.92);
  box(g, fp[0], yt, fp[1], fp[2], yt + ph, fp[1] + t, { c: pc, m: MAT.PLAIN, seed });
  box(g, fp[0], yt, fp[3] - t, fp[2], yt + ph, fp[3], { c: pc, m: MAT.PLAIN, seed });
  box(g, fp[0], yt, fp[1] + t, fp[0] + t, yt + ph, fp[3] - t, { c: pc, m: MAT.PLAIN, seed });
  box(g, fp[2] - t, yt, fp[1] + t, fp[2], yt + ph, fp[3] - t, { c: pc, m: MAT.PLAIN, seed });
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h: wallH });
  decorJardin(g, rect, fp, front, r, ao, false);
}

/** maison-chalet : bois, toit très pentu, petit auvent en façade. */
function construireMaisonChalet(g: Geo, rect: Rect, front: Facade, r: RNG, ao: TamponAO[], seed: number) {
  const wallC = pick(r, [hex("#a9713f"), hex("#8f5c33"), hex("#c99361"), hex("#7a4d2c")]);
  const roofC = pick(r, HOUSE_ROOFS);
  const floors = r() < 0.5 ? 2 : 1;
  const wallH = floors === 2 ? 5.3 : 2.9;
  const width = rr(r, 8.0, 9.2),
    depth = rr(r, 7.4, 8.6);
  const alongX = front === "-z" || front === "+z";
  const fp = placeInLot(rect, front, width, depth, 3.4, rr(r, -1, 1));
  const y0 = 0.15;
  box(g, fp[0], y0, fp[1], fp[2], y0 + wallH, fp[3], {
    c: wallC,
    m: MAT.HOUSE,
    front,
    frontM: MAT.HOUSE_FRONT,
    top: false,
    seed,
    base: y0,
  });
  gableRoof(g, fp[0], fp[1], fp[2], fp[3], y0 + wallH, 0.95, 0.85, alongX, roofC, wallC, seed);
  // petit auvent en façade, sur deux poteaux
  const dc = alongX ? (fp[0] + fp[2]) / 2 : (fp[1] + fp[3]) / 2;
  const auventY = y0 + wallH * 0.55;
  if (front === "-z") {
    box(g, dc - 1.6, auventY, fp[1] - 1.6, dc + 1.6, auventY + 0.15, fp[1], { c: shadeC(roofC, 0.9), m: MAT.PLAIN });
    box(g, dc - 1.5, y0, fp[1] - 1.55, dc - 1.35, auventY, fp[1] - 1.4, { c: COL.trunk, m: MAT.TRUNK });
    box(g, dc + 1.35, y0, fp[1] - 1.55, dc + 1.5, auventY, fp[1] - 1.4, { c: COL.trunk, m: MAT.TRUNK });
  }
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h: wallH });
  decorJardin(g, rect, fp, front, r, ao);
}

/** maison-toit-plat : architecte, cube sobre, grande façade vitrée, toit-terrasse. */
function construireMaisonToitPlat(g: Geo, rect: Rect, front: Facade, r: RNG, ao: TamponAO[], seed: number) {
  const wallC = pick(r, [hex("#e7e4dc"), hex("#d8d3c6"), hex("#c9c4b6"), hex("#3a3e42")]);
  const wallH = r() < 0.5 ? 5.6 : 3.0;
  const width = rr(r, 8.6, 9.8),
    depth = rr(r, 8.0, 9.2);
  const fp = placeInLot(rect, front, width, depth, 3.2, rr(r, -0.8, 0.8));
  const y0 = 0.15;
  box(g, fp[0], y0, fp[1], fp[2], y0 + wallH, fp[3], {
    c: wallC,
    m: MAT.HOUSE,
    front,
    frontM: MAT.GLASS,
    topM: MAT.FLATROOF,
    topC: COL.roofGray,
    seed,
    base: y0,
  });
  // léger débord de toit (casquette) sur la façade
  const alongX = front === "-z" || front === "+z";
  const capOv = 0.6;
  if (front === "-z") box(g, fp[0] - capOv, y0 + wallH, fp[1] - capOv, fp[2] + capOv, y0 + wallH + 0.14, fp[1], { c: shadeC(wallC, 0.85), m: MAT.PLAIN });
  if (front === "+z") box(g, fp[0] - capOv, y0 + wallH, fp[3], fp[2] + capOv, y0 + wallH + 0.14, fp[3] + capOv, { c: shadeC(wallC, 0.85), m: MAT.PLAIN });
  if (front === "-x") box(g, fp[0] - capOv, y0 + wallH, fp[1] - capOv, fp[0], y0 + wallH + 0.14, fp[3] + capOv, { c: shadeC(wallC, 0.85), m: MAT.PLAIN });
  if (front === "+x") box(g, fp[2], y0 + wallH, fp[1] - capOv, fp[2] + capOv, y0 + wallH + 0.14, fp[3] + capOv, { c: shadeC(wallC, 0.85), m: MAT.PLAIN });
  void alongX;
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h: wallH });
  decorJardin(g, rect, fp, front, r, ao, false);
}

/** maison-veranda : pavillon classique avec une véranda vitrée accolée sur un côté. */
function construireMaisonVeranda(g: Geo, rect: Rect, front: Facade, r: RNG, ao: TamponAO[], seed: number) {
  const wallC = pick(r, HOUSE_WALLS),
    roofC = pick(r, HOUSE_ROOFS);
  const wallH = 3.0;
  const width = rr(r, 8.0, 9.0),
    depth = rr(r, 7.4, 8.4);
  const alongX = front === "-z" || front === "+z";
  const fp = placeInLot(rect, front, width, depth, 3.4, rr(r, -1, 1));
  const y0 = 0.15;
  box(g, fp[0], y0, fp[1], fp[2], y0 + wallH, fp[3], {
    c: wallC,
    m: MAT.HOUSE,
    front,
    frontM: MAT.HOUSE_FRONT,
    top: false,
    seed,
    base: y0,
  });
  gableRoof(g, fp[0], fp[1], fp[2], fp[3], y0 + wallH, 0.55, 0.42, alongX, roofC, wallC, seed);
  const tint = pick(r, GLASS_TINTS);
  const vH = 2.4;
  if (alongX) {
    box(g, fp[2], y0, fp[1] + 1, fp[2] + 2.4, y0 + vH, fp[3] - 1, {
      c: tint,
      m: MAT.GLASS,
      topM: MAT.FLATROOF,
      topC: COL.roofGray,
    });
  } else {
    box(g, fp[0] + 1, y0, fp[3], fp[2] - 1, y0 + vH, fp[3] + 2.4, {
      c: tint,
      m: MAT.GLASS,
      topM: MAT.FLATROOF,
      topC: COL.roofGray,
    });
  }
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h: wallH });
  decorJardin(g, rect, fp, front, r, ao);
}

/** maison-mitoyenne : étroite, murs mitoyens nus (pas de haie sur les côtés), toit à deux pans court. */
function construireMaisonMitoyenne(g: Geo, rect: Rect, front: Facade, r: RNG, ao: TamponAO[], seed: number) {
  const wallC = pick(r, HOUSE_WALLS),
    roofC = pick(r, HOUSE_ROOFS);
  const floors = r() < 0.5 ? 2 : 1;
  const wallH = floors === 2 ? 5.4 : 2.9;
  const width = rr(r, 6.6, 7.6),
    depth = rr(r, 8.6, 9.8);
  const alongX = front === "-z" || front === "+z";
  const fp = placeInLot(rect, front, width, depth, 3.0, 0);
  const y0 = 0.15;
  box(g, fp[0], y0, fp[1], fp[2], y0 + wallH, fp[3], {
    c: wallC,
    m: MAT.HOUSE,
    front,
    frontM: MAT.HOUSE_FRONT,
    top: false,
    seed,
    base: y0,
  });
  gableRoof(g, fp[0], fp[1], fp[2], fp[3], y0 + wallH, 0.4, 0.25, alongX, roofC, wallC, seed);
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h: wallH });
  decorJardin(g, rect, fp, front, r, ao, false);
}

/** maison-mediterraneenne : murs clairs, toit bas en tuiles, petite terrasse pavée devant. */
function construireMaisonMediterraneenne(g: Geo, rect: Rect, front: Facade, r: RNG, ao: TamponAO[], seed: number) {
  const wallC = pick(r, [hex("#f2ead9"), hex("#eee0c4"), hex("#e7d3ab"), hex("#f5efe4")]);
  const roofC = pick(r, [hex("#c07a3e"), hex("#b06a34"), hex("#c98a4c")]);
  const wallH = r() < 0.4 ? 5.4 : 2.9;
  const width = rr(r, 8.4, 9.6),
    depth = rr(r, 7.6, 8.8);
  const alongX = front === "-z" || front === "+z";
  const fp = placeInLot(rect, front, width, depth, 3.6, rr(r, -1, 1));
  const y0 = 0.15;
  box(g, fp[0], y0, fp[1], fp[2], y0 + wallH, fp[3], {
    c: wallC,
    m: MAT.HOUSE,
    front,
    frontM: MAT.HOUSE_FRONT,
    top: false,
    seed,
    base: y0,
  });
  gableRoof(g, fp[0], fp[1], fp[2], fp[3], y0 + wallH, 0.32, 0.55, alongX, roofC, wallC, seed);
  // terrasse pavée devant l'entrée
  const dc = alongX ? (fp[0] + fp[2]) / 2 : (fp[1] + fp[3]) / 2;
  if (front === "-z") flat(g, dc - 2.2, fp[1] - 2.6, dc + 2.2, fp[1], 0.17, COL.paving, MAT.PAVING);
  if (front === "+z") flat(g, dc - 2.2, fp[3], dc + 2.2, fp[3] + 2.6, 0.17, COL.paving, MAT.PAVING);
  if (front === "-x") flat(g, fp[0] - 2.6, dc - 2.2, fp[0], dc + 2.2, 0.17, COL.paving, MAT.PAVING);
  if (front === "+x") flat(g, fp[2], dc - 2.2, fp[2] + 2.6, dc + 2.2, 0.17, COL.paving, MAT.PAVING);
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h: wallH });
  decorJardin(g, rect, fp, front, r, ao, false);
}

/** maison-fermette : pierre, plain-pied, petite dépendance attenante (pas d'appentis en bois comme la longère). */
function construireMaisonFermette(g: Geo, rect: Rect, front: Facade, r: RNG, ao: TamponAO[], seed: number) {
  const wallC = pick(r, [hex("#c9c0ad"), hex("#bdb29a"), hex("#d3c9b3")]);
  const roofC = pick(r, HOUSE_ROOFS);
  const wallH = 2.9;
  const width = rr(r, 9.0, 10.2),
    depth = rr(r, 7.0, 8.0);
  const alongX = front === "-z" || front === "+z";
  const fp = placeInLot(rect, front, width, depth, 3.6, rr(r, -0.8, 0.8));
  const y0 = 0.15;
  box(g, fp[0], y0, fp[1], fp[2], y0 + wallH, fp[3], {
    c: wallC,
    m: MAT.HOUSE,
    front,
    frontM: MAT.HOUSE_FRONT,
    top: false,
    seed,
    base: y0,
  });
  gableRoof(g, fp[0], fp[1], fp[2], fp[3], y0 + wallH, 0.5, 0.4, alongX, roofC, wallC, seed);
  // petite dépendance en pierre, plus basse, contre un pignon
  const depH = 2.0;
  if (alongX) {
    box(g, fp[2], y0, fp[1] + 0.8, fp[2] + 3.4, y0 + depH, fp[3] - 0.8, {
      c: shadeC(wallC, 0.92),
      m: MAT.PLAIN,
      topM: MAT.TILES,
      topC: roofC,
      seed,
    });
  } else {
    box(g, fp[0] + 0.8, y0, fp[1] - 3.4, fp[2] - 0.8, y0 + depH, fp[1], {
      c: shadeC(wallC, 0.92),
      m: MAT.PLAIN,
      topM: MAT.TILES,
      topC: roofC,
      seed,
    });
  }
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h: wallH });
  decorJardin(g, rect, fp, front, r, ao);
}

/** maison-duplex : deux volumes accolés de hauteurs légèrement différentes, chacun son toit à deux pans. */
function construireMaisonDuplex(g: Geo, rect: Rect, front: Facade, r: RNG, ao: TamponAO[], seed: number) {
  const wallC = pick(r, HOUSE_WALLS),
    wallC2 = pick(r, HOUSE_WALLS),
    roofC = pick(r, HOUSE_ROOFS);
  const alongX = front === "-z" || front === "+z";
  const width = rr(r, 10.5, 11.8),
    depth = rr(r, 7.4, 8.4);
  const fp = placeInLot(rect, front, width, depth, 3.4, 0);
  const y0 = 0.15;
  const midX = alongX ? (fp[0] + fp[2]) / 2 : null;
  const midZ = !alongX ? (fp[1] + fp[3]) / 2 : null;
  const h1 = 3.0,
    h2 = 3.4;
  if (alongX) {
    box(g, fp[0], y0, fp[1], midX!, y0 + h1, fp[3], { c: wallC, m: MAT.HOUSE, front, frontM: MAT.HOUSE_FRONT, top: false, seed, base: y0 });
    box(g, midX!, y0, fp[1], fp[2], y0 + h2, fp[3], { c: wallC2, m: MAT.HOUSE, front, frontM: MAT.HOUSE_FRONT, top: false, seed, base: y0 });
    gableRoof(g, fp[0], fp[1], midX!, fp[3], y0 + h1, 0.5, 0.3, false, roofC, wallC, seed);
    gableRoof(g, midX!, fp[1], fp[2], fp[3], y0 + h2, 0.5, 0.3, false, roofC, wallC2, seed);
  } else {
    box(g, fp[0], y0, fp[1], fp[2], y0 + h1, midZ!, { c: wallC, m: MAT.HOUSE, front, frontM: MAT.HOUSE_FRONT, top: false, seed, base: y0 });
    box(g, fp[0], y0, midZ!, fp[2], y0 + h2, fp[3], { c: wallC2, m: MAT.HOUSE, front, frontM: MAT.HOUSE_FRONT, top: false, seed, base: y0 });
    gableRoof(g, fp[0], fp[1], fp[2], midZ!, y0 + h1, 0.5, 0.3, true, roofC, wallC, seed);
    gableRoof(g, fp[0], midZ!, fp[2], fp[3], y0 + h2, 0.5, 0.3, true, roofC, wallC2, seed);
  }
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h: h2 });
  decorJardin(g, rect, fp, front, r, ao, false);
}

/** maison-split-level : deux volumes à toit plat, décalés en hauteur (effet "demi-niveau"). */
function construireMaisonSplitLevel(g: Geo, rect: Rect, front: Facade, r: RNG, ao: TamponAO[], seed: number) {
  const wallC = pick(r, [hex("#e2ddd0"), hex("#d6cfc0"), hex("#3f4448"), hex("#5a4f43")]);
  const alongX = front === "-z" || front === "+z";
  const width = rr(r, 9.2, 10.4),
    depth = rr(r, 7.6, 8.8);
  const fp = placeInLot(rect, front, width, depth, 3.4, 0);
  const y0 = 0.15;
  const hBas = 2.6,
    hHaut = 5.2;
  const frac = 0.45;
  if (alongX) {
    const midX = fp[0] + (fp[2] - fp[0]) * frac;
    box(g, fp[0], y0, fp[1], midX, y0 + hBas, fp[3], { c: shadeC(wallC, 0.92), m: MAT.HOUSE, front, frontM: MAT.HOUSE_FRONT, topM: MAT.FLATROOF, topC: COL.roofGray, seed, base: y0 });
    box(g, midX, y0, fp[1], fp[2], y0 + hHaut, fp[3], { c: wallC, m: MAT.HOUSE, front, frontM: MAT.HOUSE_FRONT, topM: MAT.FLATROOF, topC: COL.roofGray, seed, base: y0 });
  } else {
    const midZ = fp[1] + (fp[3] - fp[1]) * frac;
    box(g, fp[0], y0, fp[1], fp[2], y0 + hBas, midZ, { c: shadeC(wallC, 0.92), m: MAT.HOUSE, front, frontM: MAT.HOUSE_FRONT, topM: MAT.FLATROOF, topC: COL.roofGray, seed, base: y0 });
    box(g, fp[0], y0, midZ, fp[2], y0 + hHaut, fp[3], { c: wallC, m: MAT.HOUSE, front, frontM: MAT.HOUSE_FRONT, topM: MAT.FLATROOF, topC: COL.roofGray, seed, base: y0 });
  }
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h: hHaut });
  decorJardin(g, rect, fp, front, r, ao, false);
}

/** maison-cottage : deux lucarnes (au lieu d'une), murs clairs, petit porche couvert sur poteaux devant l'entrée. */
function construireMaisonCottage(g: Geo, rect: Rect, front: Facade, r: RNG, ao: TamponAO[], seed: number) {
  const wallC = pick(r, [hex("#f3ecdd"), hex("#eee5d2"), hex("#e8ddc6")]);
  const roofC = pick(r, HOUSE_ROOFS);
  const wallH = 3.0;
  const width = rr(r, 8.6, 9.8),
    depth = rr(r, 7.8, 9.0);
  const alongX = front === "-z" || front === "+z";
  const fp = placeInLot(rect, front, width, depth, 3.6, rr(r, -0.6, 0.6));
  const y0 = 0.15;
  box(g, fp[0], y0, fp[1], fp[2], y0 + wallH, fp[3], { c: wallC, m: MAT.HOUSE, front, frontM: MAT.HOUSE_FRONT, top: false, seed, base: y0 });
  const yR = gableRoof(g, fp[0], fp[1], fp[2], fp[3], y0 + wallH, 0.6, 0.45, alongX, roofC, wallC, seed);
  for (const t of [0.32, 0.68]) {
    const cxp = alongX ? fp[0] + (fp[2] - fp[0]) * t : (fp[0] + fp[2]) / 2;
    const czp = alongX ? (fp[1] + fp[3]) / 2 : fp[1] + (fp[3] - fp[1]) * t;
    box(g, cxp - 0.38, yR - 1.2, czp - 0.38, cxp + 0.38, yR + 0.7, czp + 0.38, { c: shadeC(wallC, 0.85), m: MAT.PLAIN, seed });
  }
  // porche couvert sur deux poteaux, devant l'entrée.
  const dc = alongX ? (fp[0] + fp[2]) / 2 : (fp[1] + fp[3]) / 2;
  const pY = y0 + 2.1;
  if (front === "-z") {
    box(g, dc - 1.4, pY, fp[1] - 1.4, dc + 1.4, pY + 0.14, fp[1], { c: shadeC(roofC, 0.9), m: MAT.PLAIN });
    box(g, dc - 1.3, y0, fp[1] - 1.3, dc - 1.15, pY, fp[1] - 1.15, { c: COL.trunk, m: MAT.TRUNK });
    box(g, dc + 1.15, y0, fp[1] - 1.3, dc + 1.3, pY, fp[1] - 1.15, { c: COL.trunk, m: MAT.TRUNK });
  }
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h: wallH });
  decorJardin(g, rect, fp, front, r, ao);
}

// stadeMin à 0 pour tous les modèles "classique" de cette passe (voir
// docs/DECISIONS.md §4, journal de ce jalon) : le niveau d'une ville
// n'est PAS figé une fois une parcelle construite — le faire varier
// changerait l'apparence d'une maison déjà posée dès que la ville
// franchit un seuil de niveau, exactement le défaut que la stabilité du
// catalogue doit éviter. `stadeMin` reste dans l'infrastructure pour un
// futur pack premium à débloquer par niveau, juste inexploité ici.
export const MODELES_MAISONS: readonly ModeleMaison[] = [
  { id: "maison-pavillon", pack: "classique", poids: 3, stadeMin: 0, construire: construireMaisonPavillon },
  { id: "maison-longere", pack: "classique", poids: 2, stadeMin: 0, construire: construireMaisonLongere },
  { id: "maison-ville", pack: "classique", poids: 2, stadeMin: 0, construire: construireMaisonVille },
  { id: "maison-chalet", pack: "classique", poids: 1.5, stadeMin: 0, construire: construireMaisonChalet },
  { id: "maison-toit-plat", pack: "classique", poids: 1.5, stadeMin: 0, construire: construireMaisonToitPlat },
  { id: "maison-veranda", pack: "classique", poids: 1.5, stadeMin: 0, construire: construireMaisonVeranda },
  { id: "maison-mitoyenne", pack: "classique", poids: 2, stadeMin: 0, construire: construireMaisonMitoyenne },
  {
    id: "maison-mediterraneenne",
    pack: "classique",
    poids: 1.5,
    stadeMin: 0,
    construire: construireMaisonMediterraneenne,
  },
  { id: "maison-fermette", pack: "classique", poids: 1.5, stadeMin: 0, construire: construireMaisonFermette },
  { id: "maison-duplex", pack: "classique", poids: 1.5, stadeMin: 0, construire: construireMaisonDuplex },
  { id: "maison-split-level", pack: "classique", poids: 1.5, stadeMin: 0, construire: construireMaisonSplitLevel },
  { id: "maison-cottage", pack: "classique", poids: 1.5, stadeMin: 0, construire: construireMaisonCottage },
];

export function buildHouse(
  g: Geo,
  rect: Rect,
  front: Facade,
  r: RNG,
  ao: TamponAO[],
  seed: number,
  cle = String(seed),
  niveauVille = 0,
  theme = "classique"
) {
  const modele = choisirModele(cle, MODELES_MAISONS, niveauVille, theme);
  modele.construire(g, rect, front, r, ao, seed);
}

// ---------------------------------------------------------------------
// Catalogue « Immeubles »
// ---------------------------------------------------------------------

function edicule(g: Geo, fp: Rect, yt: number, pc: [number, number, number], r: RNG, seed: number) {
  const ex = fp[0] + rr(r, 1.5, 6),
    ez = fp[1] + rr(r, 1.5, 5);
  box(g, ex, yt, ez, ex + 3.2, yt + 2.6, ez + 3.2, { c: pc, m: MAT.PLAIN, topM: MAT.FLATROOF, topC: COL.roofGray, seed });
  for (let i = 0; i < 2 + Math.floor(r() * 3); i++) {
    const ax = rr(r, fp[0] + 1, fp[2] - 2),
      az = rr(r, fp[1] + 1, fp[3] - 2);
    box(g, ax, yt, az, ax + 1.2, yt + 0.9, az + 0.9, { c: COL.metal, m: MAT.PLAIN });
  }
}

/** immeuble-balcons : le modèle d'origine, toit-terrasse simple, balcons filants possibles. */
function construireImmeubleBalcons(
  g: Geo,
  rect: Rect,
  front: Facade,
  floors: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
) {
  const wallC = pick(r, APART_WALLS);
  const fp = placeInLot(rect, front, 12.4, 11.2, 1.0, 0);
  const y0 = 0.15,
    h = floors * 3.0;
  box(g, fp[0], y0, fp[1], fp[2], y0 + h, fp[3], {
    c: wallC,
    m: MAT.APART,
    front,
    frontM: MAT.APART_FRONT,
    topM: MAT.FLATROOF,
    topC: COL.roofGray,
    seed,
    base: y0,
  });
  const t = 0.3,
    ph = 0.7,
    yt = y0 + h;
  const pc = shadeC(wallC, 0.95);
  box(g, fp[0], yt, fp[1], fp[2], yt + ph, fp[1] + t, { c: pc, m: MAT.PLAIN, seed });
  box(g, fp[0], yt, fp[3] - t, fp[2], yt + ph, fp[3], { c: pc, m: MAT.PLAIN, seed });
  box(g, fp[0], yt, fp[1] + t, fp[0] + t, yt + ph, fp[3] - t, { c: pc, m: MAT.PLAIN, seed });
  box(g, fp[2] - t, yt, fp[1] + t, fp[2], yt + ph, fp[3] - t, { c: pc, m: MAT.PLAIN, seed });
  edicule(g, fp, yt, pc, r, seed);
  if (r() < 0.55 && floors >= 3) {
    for (let f = 1; f < floors; f++) {
      const y = y0 + f * 3.0 - 0.12;
      const railC = hex("#9fb4c2");
      if (front === "-z") {
        box(g, fp[0] + 0.6, y, fp[1] - 1.2, fp[2] - 0.6, y + 0.18, fp[1], { c: COL.stone, m: MAT.PLAIN });
        box(g, fp[0] + 0.6, y + 0.18, fp[1] - 1.2, fp[2] - 0.6, y + 1.1, fp[1] - 1.12, { c: railC, m: MAT.DARKGLASS });
      }
      if (front === "+z") {
        box(g, fp[0] + 0.6, y, fp[3], fp[2] - 0.6, y + 0.18, fp[3] + 1.2, { c: COL.stone, m: MAT.PLAIN });
        box(g, fp[0] + 0.6, y + 0.18, fp[3] + 1.12, fp[2] - 0.6, y + 1.1, fp[3] + 1.2, { c: railC, m: MAT.DARKGLASS });
      }
      if (front === "-x") {
        box(g, fp[0] - 1.2, y, fp[1] + 0.6, fp[0], y + 0.18, fp[3] - 0.6, { c: COL.stone, m: MAT.PLAIN });
        box(g, fp[0] - 1.2, y + 0.18, fp[1] + 0.6, fp[0] - 1.12, y + 1.1, fp[3] - 0.6, { c: railC, m: MAT.DARKGLASS });
      }
      if (front === "+x") {
        box(g, fp[2], y, fp[1] + 0.6, fp[2] + 1.2, y + 0.18, fp[3] - 0.6, { c: COL.stone, m: MAT.PLAIN });
        box(g, fp[2] + 1.12, y + 0.18, fp[1] + 0.6, fp[2] + 1.2, y + 1.1, fp[3] - 0.6, { c: railC, m: MAT.DARKGLASS });
      }
    }
  }
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h });
}

/** immeuble-corniche : façade pierre, bandeau (corniche) marqué sous le toit. */
function construireImmeubleCorniche(
  g: Geo,
  rect: Rect,
  front: Facade,
  floors: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
) {
  const wallC = pick(r, [hex("#d8cdb4"), hex("#cfc2a2"), hex("#e0d6bf")]);
  const fp = placeInLot(rect, front, 12.0, 10.8, 1.0, 0);
  const y0 = 0.15,
    h = floors * 3.0;
  box(g, fp[0], y0, fp[1], fp[2], y0 + h, fp[3], {
    c: wallC,
    m: MAT.APART,
    front,
    frontM: MAT.APART_FRONT,
    top: false,
    seed,
    base: y0,
  });
  // corniche : léger débord tout autour, juste sous le toit
  const corC = shadeC(wallC, 1.08);
  box(g, fp[0] - 0.4, y0 + h - 0.5, fp[1] - 0.4, fp[2] + 0.4, y0 + h, fp[3] + 0.4, {
    c: corC,
    m: MAT.PLAIN,
    topM: MAT.FLATROOF,
    topC: COL.roofGray,
    seed,
  });
  const pc = shadeC(wallC, 0.95),
    yt = y0 + h;
  edicule(g, fp, yt, pc, r, seed);
  ao.push({ x0: fp[0] - 0.4, z0: fp[1] - 0.4, x1: fp[2] + 0.4, z1: fp[3] + 0.4, w: 1, h });
}

/** immeuble-briques : brique rouge, volume en gradin (dernier étage en retrait). */
function construireImmeubleBriques(
  g: Geo,
  rect: Rect,
  front: Facade,
  floors: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
) {
  const wallC = pick(r, [hex("#b5583c"), hex("#a24932"), hex("#c26847")]);
  const fp = placeInLot(rect, front, 11.8, 10.6, 1.2, 0);
  const y0 = 0.15;
  const floorsBas = Math.max(1, floors - 1);
  const hBas = floorsBas * 3.0;
  box(g, fp[0], y0, fp[1], fp[2], y0 + hBas, fp[3], {
    c: wallC,
    m: MAT.APART,
    front,
    frontM: MAT.APART_FRONT,
    top: false,
    seed,
    base: y0,
  });
  const retrait = 1.3;
  const fpHaut: Rect = [fp[0] + retrait, fp[1] + retrait, fp[2] - retrait, fp[3] - retrait];
  const yt1 = y0 + hBas;
  if (floors > floorsBas) {
    box(g, fpHaut[0], yt1, fpHaut[1], fpHaut[2], yt1 + 3.0, fpHaut[3], {
      c: shadeC(wallC, 1.05),
      m: MAT.APART,
      topM: MAT.FLATROOF,
      topC: COL.roofGray,
      seed,
      base: yt1,
    });
  }
  const yt = yt1 + (floors > floorsBas ? 3.0 : 0);
  const pc = shadeC(wallC, 0.85);
  edicule(g, floors > floorsBas ? fpHaut : fp, yt, pc, r, seed);
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h: hBas });
  if (floors > floorsBas) ao.push({ x0: fpHaut[0], z0: fpHaut[1], x1: fpHaut[2], z1: fpHaut[3], w: 1, h: 3.0 });
}

/** immeuble-toit-terrasse : grand toit-terrasse aménagé (jardinières, garde-corps complet). */
function construireImmeubleToitTerrasse(
  g: Geo,
  rect: Rect,
  front: Facade,
  floors: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
) {
  const wallC = pick(r, APART_WALLS);
  const fp = placeInLot(rect, front, 12.2, 11.0, 1.0, 0);
  const y0 = 0.15,
    h = floors * 3.0;
  box(g, fp[0], y0, fp[1], fp[2], y0 + h, fp[3], {
    c: wallC,
    m: MAT.APART,
    front,
    frontM: MAT.APART_FRONT,
    topM: MAT.FLATROOF,
    topC: hex("#7fae5f"),
    seed,
    base: y0,
  });
  const t = 0.25,
    ph = 0.85,
    yt = y0 + h,
    railC = hex("#9fb4c2");
  box(g, fp[0], yt, fp[1], fp[2], yt + ph, fp[1] + t, { c: railC, m: MAT.DARKGLASS, seed });
  box(g, fp[0], yt, fp[3] - t, fp[2], yt + ph, fp[3], { c: railC, m: MAT.DARKGLASS, seed });
  box(g, fp[0], yt, fp[1] + t, fp[0] + t, yt + ph, fp[3] - t, { c: railC, m: MAT.DARKGLASS, seed });
  box(g, fp[2] - t, yt, fp[1] + t, fp[2], yt + ph, fp[3] - t, { c: railC, m: MAT.DARKGLASS, seed });
  // jardinières
  for (let i = 0; i < 3; i++) {
    const jx = rr(r, fp[0] + 1.5, fp[2] - 1.5),
      jz = rr(r, fp[1] + 1.5, fp[3] - 1.5);
    box(g, jx, yt, jz, jx + 1.4, yt + 0.5, jz + 1.4, { c: hex("#6b5540"), m: MAT.PLAIN });
    tree(g, jx + 0.7, jz + 0.7, yt + 0.5, 0.4, r, ao);
  }
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h });
}

/** immeuble-art-deco : façade claire, pilastres verticaux en léger relief, sommet à degrés. */
function construireImmeubleArtDeco(
  g: Geo,
  rect: Rect,
  front: Facade,
  floors: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
) {
  const wallC = pick(r, [hex("#ece3d1"), hex("#e4d8be"), hex("#ddd0b2")]);
  const accent = shadeC(wallC, 0.8);
  const fp = placeInLot(rect, front, 11.6, 10.4, 1.2, 0);
  const y0 = 0.15,
    h = floors * 3.0;
  box(g, fp[0], y0, fp[1], fp[2], y0 + h, fp[3], {
    c: wallC,
    m: MAT.APART,
    front,
    frontM: MAT.APART_FRONT,
    top: false,
    seed,
    base: y0,
  });
  // pilastres verticaux (bandes en léger relief) sur la façade rue.
  const alongX = front === "-z" || front === "+z";
  const nPil = 4;
  for (let i = 1; i < nPil; i++) {
    const t = i / nPil;
    if (alongX) {
      const px = fp[0] + (fp[2] - fp[0]) * t;
      const z = front === "-z" ? fp[1] : fp[3] - 0.15;
      box(g, px - 0.25, y0, z, px + 0.25, y0 + h, z + 0.15, { c: accent, m: MAT.PLAIN });
    } else {
      const pz = fp[1] + (fp[3] - fp[1]) * t;
      const x = front === "-x" ? fp[0] : fp[2] - 0.15;
      box(g, x, y0, pz - 0.25, x + 0.15, y0 + h, pz + 0.25, { c: accent, m: MAT.PLAIN });
    }
  }
  // sommet à degrés (retrait progressif des 2 derniers niveaux).
  let yTop = y0 + h,
    retrait = 0;
  const marches = Math.min(2, Math.max(0, floors - 2));
  for (let k = 0; k < marches; k++) {
    retrait += 1.0;
    const fpm: Rect = [fp[0] + retrait, fp[1] + retrait, fp[2] - retrait, fp[3] - retrait];
    box(g, fpm[0], yTop, fpm[1], fpm[2], yTop + 1.6, fpm[3], {
      c: wallC,
      m: MAT.APART,
      topM: MAT.FLATROOF,
      topC: COL.roofGray,
      seed,
      base: yTop,
    });
    yTop += 1.6;
  }
  if (marches === 0) {
    box(g, fp[0], yTop, fp[1], fp[2], yTop + 0.01, fp[3], { c: wallC, m: MAT.PLAIN, topM: MAT.FLATROOF, topC: COL.roofGray });
  }
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h });
}

/** immeuble-barre : longue façade uniforme, sans relief, grille régulière de climatiseurs — logement social sobre. */
function construireImmeubleBarre(
  g: Geo,
  rect: Rect,
  front: Facade,
  floors: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
) {
  const wallC = pick(r, [hex("#d8d5cc"), hex("#cfcabd"), hex("#e0ddd2")]);
  const fp = placeInLot(rect, front, 13.0, 9.6, 0.8, 0);
  const y0 = 0.15,
    h = floors * 3.0;
  box(g, fp[0], y0, fp[1], fp[2], y0 + h, fp[3], {
    c: wallC,
    m: MAT.APART,
    front,
    frontM: MAT.APART_FRONT,
    topM: MAT.FLATROOF,
    topC: COL.roofGray,
    seed,
    base: y0,
  });
  const alongX = front === "-z" || front === "+z";
  const z = front === "-z" ? fp[1] - 0.05 : front === "+z" ? fp[3] + 0.05 - 1.0 : null;
  for (let f = 0; f < floors; f++) {
    for (let i = 0; i < 4; i++) {
      const t = 0.15 + i * 0.24;
      const y = y0 + f * 3.0 + 0.5;
      if (alongX && z !== null) {
        const x = fp[0] + (fp[2] - fp[0]) * t;
        box(g, x, y, z, x + 1.0, y + 0.7, z + 1.0, { c: COL.metal, m: MAT.PLAIN });
      } else if (!alongX) {
        const zz = fp[1] + (fp[3] - fp[1]) * t;
        const x = front === "-x" ? fp[0] - 0.05 : fp[2] + 0.05 - 1.0;
        box(g, x, y, zz, x + 1.0, y + 0.7, zz + 1.0, { c: COL.metal, m: MAT.PLAIN });
      }
    }
  }
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h });
}

/** immeuble-loggias : loggias (balcons encastrés) en damier plutôt que des balcons filants. */
function construireImmeubleLoggias(
  g: Geo,
  rect: Rect,
  front: Facade,
  floors: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
) {
  const wallC = pick(r, APART_WALLS);
  const fp = placeInLot(rect, front, 12.0, 11.0, 1.0, 0);
  const y0 = 0.15,
    h = floors * 3.0;
  box(g, fp[0], y0, fp[1], fp[2], y0 + h, fp[3], {
    c: wallC,
    m: MAT.APART,
    front,
    frontM: MAT.APART_FRONT,
    topM: MAT.FLATROOF,
    topC: COL.roofGray,
    seed,
    base: y0,
  });
  const alongX = front === "-z" || front === "+z";
  const lw = 2.2,
    lh = 2.0,
    ld = 1.1;
  for (let f = 0; f < floors; f++) {
    const y = y0 + f * 3.0 + 0.5;
    for (let i = 0; i < 3; i++) {
      if ((f + i) % 2 !== 0) continue;
      const t = 0.2 + i * 0.3;
      if (alongX) {
        const x = fp[0] + (fp[2] - fp[0]) * t;
        const z0 = front === "-z" ? fp[1] : fp[3] - ld;
        box(g, x - lw / 2, y, z0, x + lw / 2, y + lh, z0 + ld, { c: shadeC(wallC, 0.75), m: MAT.PLAIN, sides: false });
      } else {
        const z = fp[1] + (fp[3] - fp[1]) * t;
        const x0 = front === "-x" ? fp[0] : fp[2] - ld;
        box(g, x0, y, z - lw / 2, x0 + ld, y + lh, z + lw / 2, { c: shadeC(wallC, 0.75), m: MAT.PLAIN, sides: false });
      }
    }
  }
  const pc = shadeC(wallC, 0.95);
  edicule(g, fp, y0 + h, pc, r, seed);
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h });
}

/** immeuble-gradins-multiples : retrait tous les 2 étages ("wedding cake"), plus prononcé que immeuble-briques. */
function construireImmeubleGradinsMultiples(
  g: Geo,
  rect: Rect,
  front: Facade,
  floors: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
) {
  const wallC = pick(r, APART_WALLS);
  const fp0 = placeInLot(rect, front, 12.6, 11.4, 0.8, 0);
  const y0 = 0.15;
  let cur: Rect = fp0;
  let y = y0;
  let etagesRestants = floors;
  let dernierY = y0;
  while (etagesRestants > 0) {
    const n = Math.min(2, etagesRestants);
    const h = n * 3.0;
    box(g, cur[0], y, cur[1], cur[2], y + h, cur[3], {
      c: wallC,
      m: MAT.APART,
      front,
      frontM: MAT.APART_FRONT,
      topM: MAT.FLATROOF,
      topC: COL.roofGray,
      seed,
      base: y,
    });
    ao.push({ x0: cur[0], z0: cur[1], x1: cur[2], z1: cur[3], w: 1, h: y + h - y0 });
    y += h;
    dernierY = y;
    etagesRestants -= n;
    if (etagesRestants > 0) {
      const retrait = 0.9;
      cur = [cur[0] + retrait, cur[1] + retrait, cur[2] - retrait, cur[3] - retrait];
    }
  }
  const pc = shadeC(wallC, 0.9);
  edicule(g, cur, dernierY, pc, r, seed);
}

/** immeuble-vitree : façade rue entièrement vitrée (mur-rideau), reste des murs classiques. */
function construireImmeubleVitree(
  g: Geo,
  rect: Rect,
  front: Facade,
  floors: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
) {
  const wallC = pick(r, [hex("#d4d0c4"), hex("#c7c2b3")]);
  const tint = pick(r, GLASS_TINTS);
  const fp = placeInLot(rect, front, 12.0, 10.8, 1.0, 0);
  const y0 = 0.15,
    h = floors * 3.0;
  box(g, fp[0], y0, fp[1], fp[2], y0 + h, fp[3], {
    c: wallC,
    m: MAT.APART,
    top: false,
    seed,
    base: y0,
  });
  // mur-rideau vitré sur la façade rue uniquement.
  const t = 0.12;
  if (front === "-z") box(g, fp[0] + 0.3, y0, fp[1] - t, fp[2] - 0.3, y0 + h, fp[1], { c: tint, m: MAT.GLASS });
  if (front === "+z") box(g, fp[0] + 0.3, y0, fp[3], fp[2] - 0.3, y0 + h, fp[3] + t, { c: tint, m: MAT.GLASS });
  if (front === "-x") box(g, fp[0] - t, y0, fp[1] + 0.3, fp[0], y0 + h, fp[3] - 0.3, { c: tint, m: MAT.GLASS });
  if (front === "+x") box(g, fp[2], y0, fp[1] + 0.3, fp[2] + t, y0 + h, fp[3] - 0.3, { c: tint, m: MAT.GLASS });
  const pc = shadeC(wallC, 0.9);
  box(g, fp[0], y0 + h, fp[1], fp[2], y0 + h + 0.3, fp[3], { c: pc, m: MAT.PLAIN, topM: MAT.FLATROOF, topC: COL.roofGray, seed });
  edicule(g, fp, y0 + h + 0.3, pc, r, seed);
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h });
}

/**
 * immeuble-haussmannien : façade en pierre claire uniforme, garde-corps
 * en fer forgé filants au 2e et au dernier étage, étage mansardé en
 * zinc avec lucarne — pack "haussmannien" (docs/BATIMENTS-ET-PACKS.md
 * §4), premier pack de thème, choisi en priorité par Adrien.
 */
function construireImmeubleHaussmannien(
  g: Geo,
  rect: Rect,
  front: Facade,
  floors: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
) {
  const wallC = pick(r, [hex("#e9e0cd"), hex("#e3dac4"), hex("#ded3ba")]);
  const ferC = hex("#2d2f33"),
    zincC = hex("#6b7278");
  const fp = placeInLot(rect, front, 12.2, 11.0, 1.0, 0);
  const y0 = 0.15,
    hCorps = Math.max(2, floors - 1) * 3.0;
  box(g, fp[0], y0, fp[1], fp[2], y0 + hCorps, fp[3], {
    c: wallC,
    m: MAT.APART,
    front,
    frontM: MAT.APART_FRONT,
    topM: MAT.FLATROOF,
    topC: zincC,
    seed,
    base: y0,
  });
  // garde-corps filants (fer forgé) au 2e étage et sous la mansarde.
  const railC = ferC;
  for (const f of [1, Math.max(1, Math.floor(hCorps / 3) - 1)]) {
    const y = y0 + f * 3.0 - 0.1;
    if (y >= y0 + hCorps - 0.2) continue;
    if (front === "-z") box(g, fp[0] + 0.4, y, fp[1] - 0.14, fp[2] - 0.4, y + 0.85, fp[1], { c: railC, m: MAT.DARKGLASS });
    if (front === "+z") box(g, fp[0] + 0.4, y, fp[3], fp[2] - 0.4, y + 0.85, fp[3] + 0.14, { c: railC, m: MAT.DARKGLASS });
    if (front === "-x") box(g, fp[0] - 0.14, y, fp[1] + 0.4, fp[0], y + 0.85, fp[3] - 0.4, { c: railC, m: MAT.DARKGLASS });
    if (front === "+x") box(g, fp[2], y, fp[1] + 0.4, fp[2] + 0.14, y + 0.85, fp[3] - 0.4, { c: railC, m: MAT.DARKGLASS });
  }
  // étage mansardé : bandeau en léger retrait, puis toit en zinc à deux pans, lucarne.
  const retrait = 0.7;
  const fpm: Rect = [fp[0] + retrait, fp[1] + retrait, fp[2] - retrait, fp[3] - retrait];
  const yMansarde = y0 + hCorps;
  box(g, fpm[0], yMansarde, fpm[1], fpm[2], yMansarde + 1.8, fpm[3], {
    c: zincC,
    m: MAT.TILES,
    top: false,
    seed,
  });
  const alongX = front === "-z" || front === "+z";
  const yR = gableRoof(g, fpm[0], fpm[1], fpm[2], fpm[3], yMansarde + 1.8, 0.5, 0.3, alongX, zincC, zincC, seed);
  const cxp = (fpm[0] + fpm[2]) / 2,
    czp = (fpm[1] + fpm[3]) / 2;
  box(g, cxp - 0.5, yR - 1.1, czp - 0.5, cxp + 0.5, yR + 0.5, czp + 0.5, { c: shadeC(zincC, 0.9), m: MAT.PLAIN, seed });
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h: hCorps + 2.6 });
}

/** immeuble-haussmannien-angle : même archétype, avec un petit oriel arrondi (tourelle d'angle) sur un coin. */
function construireImmeubleHaussmannienAngle(
  g: Geo,
  rect: Rect,
  front: Facade,
  floors: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
) {
  construireImmeubleHaussmannien(g, rect, front, floors, r, ao, seed);
  const wallC = pick(r, [hex("#e9e0cd"), hex("#e3dac4")]);
  const fp = placeInLot(rect, front, 12.2, 11.0, 1.0, 0);
  const y0 = 0.15,
    hCorps = Math.max(2, floors - 1) * 3.0;
  const cx = fp[0],
    cz = fp[1];
  cylinder(g, cx, y0, cz, 1.3, hCorps + 1.0, 12, wallC, MAT.APART, MAT.TILES, hex("#6b7278"), 0.6);
}

// Même choix que MODELES_MAISONS ci-dessus : stadeMin à 0 partout pour
// cette passe, afin qu'un immeuble déjà construit ne change jamais
// d'aspect quand le niveau de la ville progresse.
export const MODELES_IMMEUBLES: readonly ModeleImmeuble[] = [
  { id: "immeuble-balcons", pack: "classique", poids: 3, stadeMin: 0, construire: construireImmeubleBalcons },
  { id: "immeuble-corniche", pack: "classique", poids: 2, stadeMin: 0, construire: construireImmeubleCorniche },
  { id: "immeuble-briques", pack: "classique", poids: 2, stadeMin: 0, construire: construireImmeubleBriques },
  {
    id: "immeuble-toit-terrasse",
    pack: "classique",
    poids: 1.5,
    stadeMin: 0,
    construire: construireImmeubleToitTerrasse,
  },
  { id: "immeuble-art-deco", pack: "classique", poids: 1.5, stadeMin: 0, construire: construireImmeubleArtDeco },
  { id: "immeuble-barre", pack: "classique", poids: 1.5, stadeMin: 0, construire: construireImmeubleBarre },
  { id: "immeuble-loggias", pack: "classique", poids: 1.5, stadeMin: 0, construire: construireImmeubleLoggias },
  {
    id: "immeuble-gradins-multiples",
    pack: "classique",
    poids: 1.5,
    stadeMin: 0,
    construire: construireImmeubleGradinsMultiples,
  },
  { id: "immeuble-vitree", pack: "classique", poids: 1.5, stadeMin: 0, construire: construireImmeubleVitree },
  // Pack "haussmannien" — voir docs/BATIMENTS-ET-PACKS.md §4. Partiel :
  // seuls les immeubles ont un modèle dédié, maisons/tours retombent
  // sur "classique" (choisirModele()).
  { id: "immeuble-haussmannien", pack: "haussmannien", poids: 3, stadeMin: 0, construire: construireImmeubleHaussmannien },
  {
    id: "immeuble-haussmannien-angle",
    pack: "haussmannien",
    poids: 1,
    stadeMin: 0,
    construire: construireImmeubleHaussmannienAngle,
  },
];

export function buildApart(
  g: Geo,
  rect: Rect,
  front: Facade,
  floors: number,
  r: RNG,
  ao: TamponAO[],
  seed: number,
  cle = String(seed),
  niveauVille = 0,
  theme = "classique"
) {
  const modele = choisirModele(cle, MODELES_IMMEUBLES, niveauVille, theme);
  modele.construire(g, rect, front, floors, r, ao, seed);
}

// ---------------------------------------------------------------------
// Catalogue « Tours »
// ---------------------------------------------------------------------

/** Profil du gratte-ciel « tour-verre » : il monte étage par étage en suivant toujours le même plan. */
export function towerSegments(capShaft: number) {
  const s1 = Math.round(capShaft * 0.55),
    s2 = Math.round(capShaft * 0.82);
  return [
    { from: 0, to: s1, size: 21 },
    { from: s1, to: s2, size: 16 },
    { from: s2, to: capShaft, size: 11.5 },
  ];
}

function chantierGratteCiel(g: Geo, x0: number, z0: number, x1: number, z1: number, r: RNG, seed: number) {
  flat(g, x0 + 0.5, z0 + 0.5, x1 - 0.5, z1 - 0.5, 0.17, COL.dirt, MAT.DIRT);
  const fh = 2.1,
    ft = 0.12;
  box(g, x0 + 0.5, 0.15, z0 + 0.5, x1 - 0.5, 0.15 + fh, z0 + 0.5 + ft, { c: COL.fence, m: MAT.FENCE, seed });
  box(g, x0 + 0.5, 0.15, z1 - 0.5 - ft, x1 - 0.5, 0.15 + fh, z1 - 0.5, { c: COL.fence, m: MAT.FENCE, seed });
  box(g, x0 + 0.5, 0.15, z0 + 0.5, x0 + 0.5 + ft, 0.15 + fh, z1 - 0.5, { c: COL.fence, m: MAT.FENCE, seed });
  box(g, x1 - 0.5 - ft, 0.15, z0 + 0.5, x1 - 0.5, 0.15 + fh, z1 - 0.5, { c: COL.fence, m: MAT.FENCE, seed });
  box(g, x0 + 3, 0.17, z0 + 3, x0 + 9, 2.8, z0 + 5.4, { c: COL.container, m: MAT.PLAIN, seed });
  box(g, x0 + 3, 2.8, z0 + 3, x0 + 9, 5.4, z0 + 5.4, { c: hex("#2f6f9f"), m: MAT.PLAIN, seed });
  for (let i = 0; i < 4; i++) {
    const px = rr(r, x0 + 8, x1 - 6),
      pz = rr(r, z0 + 8, z1 - 6);
    box(g, px, 0.17, pz, px + rr(r, 1.5, 3), 0.17 + rr(r, 0.4, 1.1), pz + rr(r, 1, 2), {
      c: pick(r, [COL.concrete, hex("#9c7b55"), hex("#6f7378")]),
      m: MAT.CONCRETE,
    });
  }
}

function grueChantier(g: Geo, rect: Rect, innerSide: Facade, top: number, seed: number) {
  const [x0, z0, x1, z1] = rect;
  const cx = (x0 + x1) / 2,
    cz = (z0 + z1) / 2;
  let mx = cx,
    mz = cz,
    jibX = true,
    sign = 1;
  const off = (x1 - x0) / 2 + 4.5;
  if (innerSide === "+z") {
    mz = cz + off;
    mx = cx - 6;
    jibX = false;
    sign = -1;
  }
  if (innerSide === "-z") {
    mz = cz - off;
    mx = cx + 6;
    jibX = false;
    sign = 1;
  }
  if (innerSide === "+x") {
    mx = cx + off;
    mz = cz + 6;
    jibX = true;
    sign = -1;
  }
  if (innerSide === "-x") {
    mx = cx - off;
    mz = cz - 6;
    jibX = true;
    sign = 1;
  }
  crane(g, mx, mz, Math.max(top + 12, 22), jibX, sign, seed);
}

function couronnement(g: Geo, cx: number, cz: number, hs: number, top: number, tint: [number, number, number], r: RNG, seed: number) {
  const variant = r();
  const pH = 1.1;
  box(g, cx - hs, top, cz - hs, cx + hs, top + pH, cz - hs + 0.35, { c: shadeC(tint, 0.7), m: MAT.PLAIN });
  box(g, cx - hs, top, cz + hs - 0.35, cx + hs, top + pH, cz + hs, { c: shadeC(tint, 0.7), m: MAT.PLAIN });
  box(g, cx - hs, top, cz - hs, cx - hs + 0.35, top + pH, cz + hs, { c: shadeC(tint, 0.7), m: MAT.PLAIN });
  box(g, cx + hs - 0.35, top, cz - hs, cx + hs, top + pH, cz + hs, { c: shadeC(tint, 0.7), m: MAT.PLAIN });
  if (variant < 0.45) {
    flat(g, cx - hs + 0.6, cz - hs + 0.6, cx + hs - 0.6, cz + hs - 0.6, top + 0.05, COL.helipad, MAT.HELIPAD, 0, (x, z) => [
      (x - cx) / (hs - 0.6),
      (z - cz) / (hs - 0.6),
    ]);
  } else {
    box(g, cx - 3.2, top, cz - 3.2, cx + 3.2, top + 4.2, cz + 3.2, {
      c: tint,
      m: MAT.GLASS,
      topM: MAT.FLATROOF,
      topC: COL.roofGray,
      seed,
      base: top,
    });
    box(g, cx - 0.3, top + 4.2, cz - 0.3, cx + 0.3, top + 18, cz + 0.3, { c: COL.metal, m: MAT.PLAIN });
    box(g, cx - 0.45, top + 18, cz - 0.45, cx + 0.45, top + 18.9, cz + 0.45, { c: COL.beacon, m: MAT.BEACON });
  }
}

/** tour-verre : le modèle d'origine — socle podium + fût vitré en 3 paliers de largeur. */
function construireTourVerre(
  g: Geo,
  rect: Rect,
  innerSide: Facade,
  F: number,
  cap: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
): number {
  const [x0, z0, x1, z1] = rect;
  const cx = (x0 + x1) / 2,
    cz = (z0 + z1) / 2;
  const tint = pick(r, GLASS_TINTS);
  const podC = shadeC(pick(r, [hex("#d9d3c8"), hex("#c8c9cc"), hex("#b8b0a4"), hex("#e3dccf")]), 1);
  const y0 = 0.15;
  const underConstruction = F < cap;
  let top = y0;

  if (F === 0) {
    chantierGratteCiel(g, x0, z0, x1, z1, r, seed);
    top = 6;
  } else {
    const podFloors = Math.min(F, 3);
    const podH = podFloors * PODIUM_H;
    box(g, x0 + 1, y0, z0 + 1, x1 - 1, y0 + podH, z1 - 1, {
      c: podC,
      m: MAT.PODIUM,
      topM: MAT.FLATROOF,
      topC: COL.roofGray,
      seed,
      base: y0,
    });
    ao.push({ x0: x0 + 1, z0: z0 + 1, x1: x1 - 1, z1: z1 - 1, w: 1, h: podH });
    top = y0 + podH;

    const shaftFloors = Math.max(0, F - 3);
    const capShaft = Math.max(1, cap - 3);
    const shaftBase = y0 + 3 * PODIUM_H;
    if (shaftFloors > 0) {
      const skeleton = underConstruction ? Math.min(2, shaftFloors) : 0;
      const glassTo = shaftFloors - skeleton;
      const segs = towerSegments(capShaft);
      for (const s of segs) {
        const a = s.from,
          b = Math.min(s.to, glassTo);
        if (b <= a) continue;
        const hs = s.size / 2;
        box(g, cx - hs, shaftBase + a * FLOOR_H, cz - hs, cx + hs, shaftBase + b * FLOOR_H, cz + hs, {
          c: tint,
          m: MAT.GLASS,
          topM: MAT.FLATROOF,
          topC: COL.roofGray,
          seed,
          base: shaftBase,
        });
        ao.push({ x0: cx - hs, z0: cz - hs, x1: cx + hs, z1: cz + hs, w: 1, h: shaftBase + b * FLOOR_H });
      }
      top = shaftBase + glassTo * FLOOR_H;
      for (let k = 0; k < skeleton; k++) {
        const f = glassTo + k;
        const seg = segs.find((s) => f >= s.from && f < s.to) || segs[segs.length - 1];
        const hs = seg.size / 2;
        const yb = shaftBase + f * FLOOR_H;
        box(g, cx - hs, yb, cz - hs, cx + hs, yb + 0.35, cz + hs, { c: COL.concrete, m: MAT.CONCRETE });
        const n = Math.max(2, Math.round(seg.size / 5));
        for (let i = 0; i <= n; i++) {
          for (let j = 0; j <= n; j++) {
            if (i !== 0 && i !== n && j !== 0 && j !== n) continue;
            const px = cx - hs + 0.35 + (i / n) * (seg.size - 0.7),
              pz = cz - hs + 0.35 + (j / n) * (seg.size - 0.7);
            box(g, px - 0.35, yb + 0.35, pz - 0.35, px + 0.35, yb + FLOOR_H, pz + 0.35, {
              c: COL.concrete,
              m: MAT.CONCRETE,
              top: false,
            });
          }
        }
        top = yb + FLOOR_H;
      }
      if (skeleton > 0) {
        const seg = segs.find((s) => shaftFloors - 1 >= s.from && shaftFloors - 1 < s.to) || segs[segs.length - 1];
        const hs = seg.size / 2;
        box(g, cx - hs, top, cz - hs, cx + hs, top + 0.35, cz + hs, { c: COL.concrete, m: MAT.CONCRETE });
      }
    }

    if (!underConstruction) {
      const seg = towerSegments(capShaft)[2];
      couronnement(g, cx, cz, seg.size / 2, top, tint, r, seed);
    }
  }

  if (underConstruction) grueChantier(g, rect, innerSide, top, seed);
  return top;
}

/** tour-gradins : silhouette en retraits successifs (podium, puis 2 paliers en gradins) au lieu d'un fût continu. */
function construireTourGradins(
  g: Geo,
  rect: Rect,
  innerSide: Facade,
  F: number,
  cap: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
): number {
  const [x0, z0, x1, z1] = rect;
  const cx = (x0 + x1) / 2,
    cz = (z0 + z1) / 2;
  const tint = pick(r, GLASS_TINTS);
  const podC = shadeC(pick(r, [hex("#d9d3c8"), hex("#c8c9cc"), hex("#b8b0a4")]), 1);
  const y0 = 0.15;
  const underConstruction = F < cap;
  let top = y0;

  if (F === 0) {
    chantierGratteCiel(g, x0, z0, x1, z1, r, seed);
    return 6;
  }

  const podFloors = Math.min(F, 3);
  const podH = podFloors * PODIUM_H;
  box(g, x0 + 1, y0, z0 + 1, x1 - 1, y0 + podH, z1 - 1, {
    c: podC,
    m: MAT.PODIUM,
    topM: MAT.FLATROOF,
    topC: COL.roofGray,
    seed,
    base: y0,
  });
  ao.push({ x0: x0 + 1, z0: z0 + 1, x1: x1 - 1, z1: z1 - 1, w: 1, h: podH });
  top = y0 + podH;

  const shaftFloors = Math.max(0, F - 3);
  const capShaft = Math.max(1, cap - 3);
  const shaftBase = y0 + 3 * PODIUM_H;
  // 3 gradins de largeur décroissante, chacun sur un tiers des étages
  // restants (au lieu des 3 paliers de towerSegments()) — silhouette en
  // escalier plutôt qu'un fût continu qui se resserre progressivement.
  const gradins = [
    { from: 0, to: Math.round(capShaft / 3), size: 22 },
    { from: Math.round(capShaft / 3), to: Math.round((2 * capShaft) / 3), size: 15.5 },
    { from: Math.round((2 * capShaft) / 3), to: capShaft, size: 9.5 },
  ];
  if (shaftFloors > 0) {
    const skeleton = underConstruction ? Math.min(2, shaftFloors) : 0;
    const glassTo = shaftFloors - skeleton;
    for (const s of gradins) {
      const a = s.from,
        b = Math.min(s.to, glassTo);
      if (b <= a) continue;
      const hs = s.size / 2;
      box(g, cx - hs, shaftBase + a * FLOOR_H, cz - hs, cx + hs, shaftBase + b * FLOOR_H, cz + hs, {
        c: tint,
        m: MAT.GLASS,
        topM: MAT.FLATROOF,
        topC: COL.roofGray,
        seed,
        base: shaftBase,
      });
      // rebord horizontal marquant chaque retrait de gradin.
      if (a > 0) {
        box(g, cx - hs - 0.6, shaftBase + a * FLOOR_H - 0.3, cz - hs - 0.6, cx + hs + 0.6, shaftBase + a * FLOOR_H, cz + hs + 0.6, {
          c: shadeC(podC, 0.9),
          m: MAT.PLAIN,
        });
      }
      ao.push({ x0: cx - hs, z0: cz - hs, x1: cx + hs, z1: cz + hs, w: 1, h: shaftBase + b * FLOOR_H });
    }
    top = shaftBase + glassTo * FLOOR_H;
    for (let k = 0; k < skeleton; k++) {
      const f = glassTo + k;
      const seg = gradins.find((s) => f >= s.from && f < s.to) || gradins[gradins.length - 1];
      const hs = seg.size / 2;
      const yb = shaftBase + f * FLOOR_H;
      box(g, cx - hs, yb, cz - hs, cx + hs, yb + 0.35, cz + hs, { c: COL.concrete, m: MAT.CONCRETE });
      top = yb + FLOOR_H;
    }
  }

  if (!underConstruction) {
    const seg = gradins[2];
    couronnement(g, cx, cz, seg.size / 2, top, tint, r, seed);
  } else {
    grueChantier(g, rect, innerSide, top, seed);
  }
  return top;
}

/** tour-beton : brutaliste, bandeaux de béton apparent plutôt qu'un fût tout en verre, couronnement plat sobre. */
function construireTourBeton(
  g: Geo,
  rect: Rect,
  innerSide: Facade,
  F: number,
  cap: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
): number {
  const [x0, z0, x1, z1] = rect;
  const cx = (x0 + x1) / 2,
    cz = (z0 + z1) / 2;
  const betonC = pick(r, [hex("#aca79d"), hex("#9e988c"), hex("#b4afa3")]);
  const y0 = 0.15;
  const underConstruction = F < cap;
  let top = y0;

  if (F === 0) {
    chantierGratteCiel(g, x0, z0, x1, z1, r, seed);
    return 6;
  }

  const podFloors = Math.min(F, 3);
  const podH = podFloors * PODIUM_H;
  box(g, x0 + 1, y0, z0 + 1, x1 - 1, y0 + podH, z1 - 1, {
    c: betonC,
    m: MAT.CONCRETE,
    topM: MAT.FLATROOF,
    topC: COL.roofGray,
    seed,
    base: y0,
  });
  ao.push({ x0: x0 + 1, z0: z0 + 1, x1: x1 - 1, z1: z1 - 1, w: 1, h: podH });
  top = y0 + podH;

  const shaftFloors = Math.max(0, F - 3);
  const shaftBase = y0 + 3 * PODIUM_H;
  const hs = 13.5;
  if (shaftFloors > 0) {
    const skeleton = underConstruction ? Math.min(2, shaftFloors) : 0;
    const glassTo = shaftFloors - skeleton;
    // Bandeaux : dalle de béton apparente tous les 2 étages, panneau plus sombre entre les deux.
    for (let f = 0; f < glassTo; f++) {
      const yb = shaftBase + f * FLOOR_H;
      const dalle = f % 2 === 0;
      box(g, cx - hs, yb, cz - hs, cx + hs, yb + FLOOR_H, cz + hs, {
        c: dalle ? betonC : shadeC(betonC, 0.72),
        m: MAT.CONCRETE,
        topM: MAT.FLATROOF,
        topC: COL.roofGray,
        seed,
        base: shaftBase,
      });
    }
    ao.push({ x0: cx - hs, z0: cz - hs, x1: cx + hs, z1: cz + hs, w: 1, h: shaftBase + glassTo * FLOOR_H });
    top = shaftBase + glassTo * FLOOR_H;
    for (let k = 0; k < skeleton; k++) {
      const yb = shaftBase + (glassTo + k) * FLOOR_H;
      box(g, cx - hs, yb, cz - hs, cx + hs, yb + 0.35, cz + hs, { c: COL.concrete, m: MAT.CONCRETE });
      top = yb + FLOOR_H;
    }
  }

  if (!underConstruction) {
    box(g, cx - hs - 0.5, top, cz - hs - 0.5, cx + hs + 0.5, top + 1.0, cz + hs + 0.5, {
      c: shadeC(betonC, 0.65),
      m: MAT.CONCRETE,
    });
  } else {
    grueChantier(g, rect, innerSide, top, seed);
  }
  return top;
}

/** tour-fleche : fût vitré étroit, toujours couronné d'une longue flèche métallique (jamais d'héliport). */
function construireTourFleche(
  g: Geo,
  rect: Rect,
  innerSide: Facade,
  F: number,
  cap: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
): number {
  const [x0, z0, x1, z1] = rect;
  const cx = (x0 + x1) / 2,
    cz = (z0 + z1) / 2;
  const tint = pick(r, GLASS_TINTS);
  const podC = shadeC(pick(r, [hex("#d9d3c8"), hex("#c8c9cc"), hex("#b8b0a4")]), 1);
  const y0 = 0.15;
  const underConstruction = F < cap;
  let top = y0;

  if (F === 0) {
    chantierGratteCiel(g, x0, z0, x1, z1, r, seed);
    return 6;
  }

  const podFloors = Math.min(F, 3);
  const podH = podFloors * PODIUM_H;
  box(g, x0 + 1, y0, z0 + 1, x1 - 1, y0 + podH, z1 - 1, {
    c: podC,
    m: MAT.PODIUM,
    topM: MAT.FLATROOF,
    topC: COL.roofGray,
    seed,
    base: y0,
  });
  ao.push({ x0: x0 + 1, z0: z0 + 1, x1: x1 - 1, z1: z1 - 1, w: 1, h: podH });
  top = y0 + podH;

  const shaftFloors = Math.max(0, F - 3);
  const shaftBase = y0 + 3 * PODIUM_H;
  const hs = 9.5; // fût volontairement plus étroit que tour-verre
  if (shaftFloors > 0) {
    const skeleton = underConstruction ? Math.min(2, shaftFloors) : 0;
    const glassTo = shaftFloors - skeleton;
    if (glassTo > 0) {
      box(g, cx - hs, shaftBase, cz - hs, cx + hs, shaftBase + glassTo * FLOOR_H, cz + hs, {
        c: tint,
        m: MAT.GLASS,
        topM: MAT.FLATROOF,
        topC: COL.roofGray,
        seed,
        base: shaftBase,
      });
      ao.push({ x0: cx - hs, z0: cz - hs, x1: cx + hs, z1: cz + hs, w: 1, h: shaftBase + glassTo * FLOOR_H });
    }
    top = shaftBase + glassTo * FLOOR_H;
    for (let k = 0; k < skeleton; k++) {
      const yb = shaftBase + (glassTo + k) * FLOOR_H;
      box(g, cx - hs, yb, cz - hs, cx + hs, yb + 0.35, cz + hs, { c: COL.concrete, m: MAT.CONCRETE });
      const n = Math.max(2, Math.round((hs * 2) / 5));
      for (let i = 0; i <= n; i++) {
        for (let j = 0; j <= n; j++) {
          if (i !== 0 && i !== n && j !== 0 && j !== n) continue;
          const px = cx - hs + 0.35 + (i / n) * (hs * 2 - 0.7),
            pz = cz - hs + 0.35 + (j / n) * (hs * 2 - 0.7);
          box(g, px - 0.35, yb + 0.35, pz - 0.35, px + 0.35, yb + FLOOR_H, pz + 0.35, {
            c: COL.concrete,
            m: MAT.CONCRETE,
            top: false,
          });
        }
      }
      top = yb + FLOOR_H;
    }
  }

  if (!underConstruction) {
    // flèche métallique, toujours présente (contrairement à couronnement(), pas de tirage héliport/flèche).
    box(g, cx - hs, top, cz - hs, cx + hs, top + 0.9, cz + hs, { c: shadeC(tint, 0.7), m: MAT.PLAIN });
    box(g, cx - 0.35, top + 0.9, cz - 0.35, cx + 0.35, top + 22, cz + 0.35, { c: COL.metal, m: MAT.PLAIN });
    box(g, cx - 0.5, top + 22, cz - 0.5, cx + 0.5, top + 22.9, cz + 0.5, { c: COL.beacon, m: MAT.BEACON });
  } else {
    grueChantier(g, rect, innerSide, top, seed);
  }
  return top;
}

/** tour-obelisque : fût mince et uniforme du socle au sommet, sans paliers de largeur ni podium élargi. */
function construireTourObelisque(
  g: Geo,
  rect: Rect,
  innerSide: Facade,
  F: number,
  cap: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
): number {
  const [x0, z0, x1, z1] = rect;
  const cx = (x0 + x1) / 2,
    cz = (z0 + z1) / 2;
  const tint = pick(r, GLASS_TINTS);
  const y0 = 0.15;
  const underConstruction = F < cap;
  const hs = 8.0;

  if (F === 0) {
    chantierGratteCiel(g, x0, z0, x1, z1, r, seed);
    return 6;
  }

  const skeleton = underConstruction ? Math.min(3, F) : 0;
  const glassTo = F - skeleton;
  let top = y0;
  if (glassTo > 0) {
    box(g, cx - hs, y0, cz - hs, cx + hs, y0 + glassTo * FLOOR_H, cz + hs, {
      c: tint,
      m: MAT.GLASS,
      topM: MAT.FLATROOF,
      topC: COL.roofGray,
      seed,
      base: y0,
    });
    ao.push({ x0: cx - hs, z0: cz - hs, x1: cx + hs, z1: cz + hs, w: 1, h: y0 + glassTo * FLOOR_H });
  }
  top = y0 + glassTo * FLOOR_H;
  for (let k = 0; k < skeleton; k++) {
    const yb = y0 + (glassTo + k) * FLOOR_H;
    box(g, cx - hs, yb, cz - hs, cx + hs, yb + 0.3, cz + hs, { c: COL.concrete, m: MAT.CONCRETE });
    top = yb + FLOOR_H;
  }

  if (!underConstruction) {
    box(g, cx - 0.4, top, cz - 0.4, cx + 0.4, top + 12, cz + 0.4, { c: COL.metal, m: MAT.PLAIN });
    box(g, cx - 0.55, top + 12, cz - 0.55, cx + 0.55, top + 12.8, cz + 0.55, { c: COL.beacon, m: MAT.BEACON });
  } else {
    grueChantier(g, rect, innerSide, top, seed);
  }
  return top;
}

export const MODELES_TOURS: readonly ModeleTour[] = [
  { id: "tour-verre", pack: "classique", poids: 3, stadeMin: 0, construire: construireTourVerre },
  { id: "tour-gradins", pack: "classique", poids: 2, stadeMin: 0, construire: construireTourGradins },
  { id: "tour-beton", pack: "classique", poids: 1.5, stadeMin: 0, construire: construireTourBeton },
  { id: "tour-fleche", pack: "classique", poids: 1.5, stadeMin: 0, construire: construireTourFleche },
  { id: "tour-obelisque", pack: "classique", poids: 1, stadeMin: 0, construire: construireTourObelisque },
];

export function buildTower(
  g: Geo,
  rect: Rect,
  innerSide: Facade,
  F: number,
  cap: number,
  r: RNG,
  ao: TamponAO[],
  seed: number,
  cle = String(seed),
  niveauVille = 0,
  theme = "classique"
): number {
  const modele = choisirModele(cle, MODELES_TOURS, niveauVille, theme);
  return modele.construire(g, rect, innerSide, F, cap, r, ao, seed);
}
