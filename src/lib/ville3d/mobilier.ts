/**
 * Mobilier : arbres, voitures, grue. Porté depuis
 * docs/prototypes/prototype-ville-3d.html.
 */

import type { RNG } from "./aleatoire";
import { pick, rr } from "./aleatoire";
import { CAR_COLORS, CONIFER, COL, FOLIAGE, MAT, hex } from "./constantes";
import { blob, box, cylinder, shadeC, type Geo } from "./geometrie";

export interface TamponAO {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  w: number;
  h: number;
}

export function tree(g: Geo, x: number, z: number, y0: number, scale: number, r: RNG, ao: TamponAO[]) {
  const h = (4.5 + 2.5 * r()) * scale;
  box(g, x - 0.18 * scale, y0, z - 0.18 * scale, x + 0.18 * scale, y0 + h * 0.55, z + 0.18 * scale, {
    c: COL.trunk,
    m: MAT.TRUNK,
    top: false,
  });
  const col = pick(r, FOLIAGE);
  const R = (1.7 + 0.8 * r()) * scale;
  blob(g, x, y0 + h * 0.62, z, R, R * 0.95, R, col, MAT.FOLIAGE, r);
  if (r() < 0.75) {
    blob(
      g,
      x + rr(r, -0.8, 0.8) * scale,
      y0 + h * 0.84,
      z + rr(r, -0.8, 0.8) * scale,
      R * 0.75,
      R * 0.7,
      R * 0.75,
      shadeC(col, 1.08),
      MAT.FOLIAGE,
      r
    );
  }
  ao.push({ x0: x - R * 0.7, z0: z - R * 0.7, x1: x + R * 0.7, z1: z + R * 0.7, w: 0.35, h: 0 });
}

export function conifer(g: Geo, x: number, z: number, scale: number, r: RNG, ao: TamponAO[]) {
  const h = (8 + 6 * r()) * scale;
  box(g, x - 0.2, 0, z - 0.2, x + 0.2, h * 0.25, z + 0.2, { c: COL.trunk, m: MAT.TRUNK, top: false });
  const col = pick(r, CONIFER);
  cylinder(g, x, h * 0.18, z, 2.3 * scale, h * 0.55, 9, col, MAT.FOLIAGE, null, null, 0.9 * scale);
  cylinder(g, x, h * 0.55, z, 1.6 * scale, h * 0.45, 9, shadeC(col, 1.06), MAT.FOLIAGE, null, null, 0);
  ao.push({ x0: x - 1.5, z0: z - 1.5, x1: x + 1.5, z1: z + 1.5, w: 0.3, h: 0 });
}

export function car(g: Geo, x: number, z: number, alongX: boolean, r: RNG, y0?: number) {
  const c = pick(r, CAR_COLORS),
    L = rr(r, 4.1, 4.6),
    Wd = 1.8,
    y = y0 || 0.03;
  const hl = L / 2,
    hw = Wd / 2;
  const [ax, az] = alongX ? [hl, hw] : [hw, hl];
  box(g, x - ax * 0.92, y + 0.08, z - az * 0.92, x + ax * 0.92, y + 0.36, z + az * 0.92, {
    c: hex("#1c1d20"),
    m: MAT.PLAIN,
  });
  box(g, x - ax, y + 0.36, z - az, x + ax, y + 1.0, z + az, { c, m: MAT.PAINT });
  const [cx2, cz2] = alongX ? [hl * 0.52, hw * 0.88] : [hw * 0.88, hl * 0.52];
  const off = alongX ? [-0.25, 0] : [0, -0.25];
  box(g, x + off[0] - cx2, y + 1.0, z + off[1] - cz2, x + off[0] + cx2, y + 1.5, z + off[1] + cz2, {
    c: hex("#2a3440"),
    m: MAT.DARKGLASS,
    topM: MAT.PAINT,
    topC: c,
  });
}

/** banc : dossier + assise + deux pieds, posé le long d'un trottoir (alongX = orienté le long de X). */
export function banc(g: Geo, x: number, z: number, alongX: boolean, seed?: number) {
  const c = hex("#5b4632"),
    metalC = hex("#3b3e42");
  const L = 1.6,
    hl = L / 2;
  const y = 0.15;
  if (alongX) {
    box(g, x - hl, y + 0.32, z - 0.02, x + hl, y + 0.44, z + 0.3, { c, m: MAT.PLAIN, seed });
    box(g, x - hl, y + 0.44, z + 0.22, x + hl, y + 0.78, z + 0.3, { c, m: MAT.PLAIN, seed });
    box(g, x - hl + 0.15, y, z - 0.02, x - hl + 0.22, y + 0.32, z + 0.3, { c: metalC, m: MAT.PLAIN });
    box(g, x + hl - 0.22, y, z - 0.02, x + hl - 0.15, y + 0.32, z + 0.3, { c: metalC, m: MAT.PLAIN });
  } else {
    box(g, x - 0.02, y + 0.32, z - hl, x + 0.3, y + 0.44, z + hl, { c, m: MAT.PLAIN, seed });
    box(g, x + 0.22, y + 0.44, z - hl, x + 0.3, y + 0.78, z + hl, { c, m: MAT.PLAIN, seed });
    box(g, x - 0.02, y, z - hl + 0.15, x + 0.3, y + 0.32, z - hl + 0.22, { c: metalC, m: MAT.PLAIN });
    box(g, x - 0.02, y, z + hl - 0.22, x + 0.3, y + 0.32, z + hl - 0.15, { c: metalC, m: MAT.PLAIN });
  }
}

/** fontaine : bassin, eau, socle central — même forme que l'ancienne fontaine de buildCourtyard(), extraite en modèle réutilisable. */
export function fontaine(g: Geo, cx: number, cz: number) {
  cylinder(g, cx, 0.15, cz, 2.8, 0.55, 20, COL.stone, MAT.PLAIN, MAT.PLAIN, COL.stone);
  cylinder(g, cx, 0.15, cz, 2.4, 0.5, 20, COL.water, MAT.PLAIN, MAT.WATER, COL.water);
  cylinder(g, cx, 0.6, cz, 0.35, 1.2, 10, COL.stone, MAT.PLAIN, MAT.PLAIN, COL.stone);
  // petit jet au sommet du socle.
  cylinder(g, cx, 1.75, cz, 0.08, 0.5, 6, COL.water, MAT.WATER, MAT.WATER, COL.water);
}

/** abribus : poteau, auvent vitré, banc intégré — le long d'un trottoir. */
export function abribus(g: Geo, x: number, z: number, alongX: boolean) {
  const frameC = hex("#4a4f56"),
    glassC = hex("#a9c4d6");
  const w = 2.6,
    d = 1.1,
    h = 2.1;
  const hw = w / 2;
  if (alongX) {
    box(g, x - hw, 0.15, z, x - hw + 0.08, h, z + d, { c: frameC, m: MAT.PLAIN });
    box(g, x + hw - 0.08, 0.15, z, x + hw, h, z + d, { c: frameC, m: MAT.PLAIN });
    box(g, x - hw, h, z - 0.15, x + hw, h + 0.1, z + d, { c: frameC, m: MAT.PLAIN });
    box(g, x - hw + 0.1, 0.4, z + d - 0.06, x + hw - 0.1, h - 0.1, z + d, { c: glassC, m: MAT.DARKGLASS });
    banc(g, x, z + d * 0.35, alongX);
  } else {
    box(g, x, 0.15, z - hw, x + d, h, z - hw + 0.08, { c: frameC, m: MAT.PLAIN });
    box(g, x, 0.15, z + hw - 0.08, x + d, h, z + hw, { c: frameC, m: MAT.PLAIN });
    box(g, x - 0.15, h, z - hw, x + d, h + 0.1, z + hw, { c: frameC, m: MAT.PLAIN });
    box(g, x + d - 0.06, 0.4, z - hw + 0.1, x + d, h - 0.1, z + hw - 0.1, { c: glassC, m: MAT.DARKGLASS });
    banc(g, x + d * 0.35, z, alongX);
  }
}

/** kiosque : petit pavillon rond à toit pointu, dans un parc. */
export function kiosque(g: Geo, cx: number, cz: number, r: RNG) {
  const wallC = pick(r, [hex("#8a6b46"), hex("#6f8a63"), hex("#7a5a3e")]);
  const roofC = shadeC(wallC, 0.75);
  cylinder(g, cx, 0.15, cz, 2.2, 0.1, 12, COL.stone, MAT.PLAIN, MAT.PLAIN, COL.stone);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const px = cx + Math.cos(a) * 1.9,
      pz = cz + Math.sin(a) * 1.9;
    box(g, px - 0.09, 0.2, pz - 0.09, px + 0.09, 2.3, pz + 0.09, { c: wallC, m: MAT.TRUNK });
  }
  cylinder(g, cx, 2.3, cz, 2.4, 0.9, 10, roofC, MAT.TILES, null, null, 0);
}

export function crane(
  g: Geo,
  mx: number,
  mz: number,
  hMast: number,
  jibDirX: boolean,
  jibSign: number,
  seed: number
) {
  const cw = COL.crane;
  box(g, mx - 1, 0.15, mz - 1, mx + 1, hMast, mz + 1, { c: cw, m: MAT.LATTICE, base: 0.15, seed });
  box(g, mx - 1.6, 0.15, mz - 1.6, mx + 1.6, 1.2, mz + 1.6, { c: COL.concrete, m: MAT.CONCRETE });
  const jl = 36,
    cj = 11;
  const y0 = hMast,
    y1 = hMast + 2;
  if (jibDirX) {
    const a = jibSign > 0 ? mx + 1 : mx - 1 - jl,
      b = jibSign > 0 ? mx + 1 + jl : mx - 1;
    box(g, a, y0, mz - 1, b, y1, mz + 1, { c: cw, m: MAT.LATTICE, base: y0, seed });
    const ca = jibSign > 0 ? mx - 1 - cj : mx + 1,
      cb = jibSign > 0 ? mx - 1 : mx + 1 + cj;
    box(g, ca, y0, mz - 1, cb, y1, mz + 1, { c: cw, m: MAT.LATTICE, base: y0, seed });
    const wx = jibSign > 0 ? ca : cb - 3;
    box(g, wx, y0 - 2.2, mz - 1.2, wx + 3, y0 + 0.2, mz + 1.2, { c: COL.counterweight, m: MAT.CONCRETE });
    const hx = mx + jibSign * (jl * 0.62);
    box(g, hx - 0.05, y0 - 14, mz - 0.05, hx + 0.05, y0, mz + 0.05, { c: hex("#333333"), m: MAT.PLAIN });
    box(g, hx - 0.4, y0 - 15.2, mz - 0.4, hx + 0.4, y0 - 14, mz + 0.4, { c: hex("#d44a2c"), m: MAT.PAINT });
  } else {
    const a = jibSign > 0 ? mz + 1 : mz - 1 - jl,
      b = jibSign > 0 ? mz + 1 + jl : mz - 1;
    box(g, mx - 1, y0, a, mx + 1, y1, b, { c: cw, m: MAT.LATTICE, base: y0, seed });
    const ca = jibSign > 0 ? mz - 1 - cj : mz + 1,
      cb = jibSign > 0 ? mz - 1 : mz + 1 + cj;
    box(g, mx - 1, y0, ca, mx + 1, y1, cb, { c: cw, m: MAT.LATTICE, base: y0, seed });
    const wz = jibSign > 0 ? ca : cb - 3;
    box(g, mx - 1.2, y0 - 2.2, wz, mx + 1.2, y0 + 0.2, wz + 3, { c: COL.counterweight, m: MAT.CONCRETE });
    const hz = mz + jibSign * (jl * 0.62);
    box(g, mx - 0.05, y0 - 14, hz - 0.05, mx + 0.05, y0, hz + 0.05, { c: hex("#333333"), m: MAT.PLAIN });
    box(g, mx - 0.4, y0 - 15.2, hz - 0.4, mx + 0.4, y0 - 14, hz + 0.4, { c: hex("#d44a2c"), m: MAT.PAINT });
  }
  box(g, mx - 1.3, y1, mz - 1.3, mx + 1.3, y1 + 2.4, mz + 1.3, { c: hex("#e9e5d8"), m: MAT.PLAIN });
  box(g, mx - 0.4, y1, mz - 0.4, mx + 0.4, y1 + 7, mz + 0.4, { c: cw, m: MAT.LATTICE, base: y1, seed });
}
