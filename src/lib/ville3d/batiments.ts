/**
 * Bâtiments : maisons, immeubles, gratte-ciel. Porté depuis
 * docs/prototypes/prototype-ville-3d.html.
 */

import type { RNG } from "./aleatoire";
import { pick, rr } from "./aleatoire";
import { APART_WALLS, COL, FLOOR_H, GLASS_TINTS, HOUSE_ROOFS, HOUSE_WALLS, LOT, MAT, PODIUM_H, hex } from "./constantes";
import { box, flat, gableRoof, shadeC, type Geo } from "./geometrie";
import { car, crane, tree, type TamponAO } from "./mobilier";

export type Facade = "-z" | "+z" | "-x" | "+x";
export type Rect = [number, number, number, number];

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

export function buildHouse(g: Geo, rect: Rect, front: Facade, r: RNG, ao: TamponAO[], seed: number) {
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

  // allée jusqu'à la porte + haies + arbre au jardin
  const [x0, z0, x1, z1] = rect;
  const dc = alongX ? (fp[0] + fp[2]) / 2 : (fp[1] + fp[3]) / 2;
  const pathY = 0.17;
  if (front === "-z") flat(g, dc - 0.6, z0, dc + 0.6, fp[1], pathY, COL.paving, MAT.PAVING);
  if (front === "+z") flat(g, dc - 0.6, fp[3], dc + 0.6, z1, pathY, COL.paving, MAT.PAVING);
  if (front === "-x") flat(g, x0, dc - 0.6, fp[0], dc + 0.6, pathY, COL.paving, MAT.PAVING);
  if (front === "+x") flat(g, fp[2], dc - 0.6, x1, dc + 0.6, pathY, COL.paving, MAT.PAVING);

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
  // arbre du jardin, côté arrière
  const back = placeInLot(rect, front, 2, 2, LOT - 3.2, rr(r, -3.5, 3.5));
  tree(g, (back[0] + back[2]) / 2, (back[1] + back[3]) / 2, 0.15, rr(r, 0.8, 1.05), r, ao);
  // voiture garée devant (une fois sur deux)
  if (r() < 0.5) {
    const sideOff = alongX ? (fp[2] + 2.0 < x1 - 1.5 ? 1 : -1) : fp[3] + 2.0 < z1 - 1.5 ? 1 : -1;
    if (front === "-z") car(g, sideOff > 0 ? fp[2] + 1.6 : fp[0] - 1.6, z0 + 2.6, false, r, 0.16);
    if (front === "+z") car(g, sideOff > 0 ? fp[2] + 1.6 : fp[0] - 1.6, z1 - 2.6, false, r, 0.16);
    if (front === "-x") car(g, x0 + 2.6, sideOff > 0 ? fp[3] + 1.6 : fp[1] - 1.6, true, r, 0.16);
    if (front === "+x") car(g, x1 - 2.6, sideOff > 0 ? fp[3] + 1.6 : fp[1] - 1.6, true, r, 0.16);
  }
}

export function buildApart(g: Geo, rect: Rect, front: Facade, floors: number, r: RNG, ao: TamponAO[], seed: number) {
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
  // édicule d'escalier + climatiseurs
  const ex = fp[0] + rr(r, 1.5, 6),
    ez = fp[1] + rr(r, 1.5, 5);
  box(g, ex, yt, ez, ex + 3.2, yt + 2.6, ez + 3.2, { c: pc, m: MAT.PLAIN, topM: MAT.FLATROOF, topC: COL.roofGray, seed });
  for (let i = 0; i < 2 + Math.floor(r() * 3); i++) {
    const ax = rr(r, fp[0] + 1, fp[2] - 2),
      az = rr(r, fp[1] + 1, fp[3] - 2);
    box(g, ax, yt, az, ax + 1.2, yt + 0.9, az + 0.9, { c: COL.metal, m: MAT.PLAIN });
  }
  // balcons filants côté rue (une fois sur deux)
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

/** Profil du gratte-ciel : il monte étage par étage en suivant toujours le même plan. */
export function towerSegments(capShaft: number) {
  const s1 = Math.round(capShaft * 0.55),
    s2 = Math.round(capShaft * 0.82);
  return [
    { from: 0, to: s1, size: 21 },
    { from: s1, to: s2, size: 16 },
    { from: s2, to: capShaft, size: 11.5 },
  ];
}

export function buildTower(
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
    // chantier tout juste ouvert : terrain décapé, palissade, baraque de chantier
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
      // étages en cours : dalles et poteaux de béton, sans vitrage
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
      // couronnement : héliport ou édicule technique + antenne
      const seg = towerSegments(capShaft)[2];
      const hs = seg.size / 2;
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
  }

  if (underConstruction) {
    // grue plantée dans la cour, flèche au-dessus du bâtiment
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
  return top;
}
