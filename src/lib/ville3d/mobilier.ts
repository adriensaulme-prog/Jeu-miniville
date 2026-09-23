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
