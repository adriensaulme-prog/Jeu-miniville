/**
 * Occlusion ambiante au sol (précalculée) : pieds d'immeubles plus
 * sombres, halo de lumière autour des lampadaires la nuit. Porté depuis
 * docs/prototypes/prototype-ville-3d.html (blur/bakeAO). Pur (pas de
 * WebGL) — produit un tampon RG8 que scene.ts charge dans une texture.
 */

import type { TamponAO } from "./mobilier";

export const AO_RES = 512;
export const AO_EXT = 210;

export function blur(src: Float32Array, n: number, rad: number): Float32Array {
  const tmp = new Float32Array(n * n),
    out = new Float32Array(n * n),
    inv = 1 / (2 * rad + 1);
  for (let y = 0; y < n; y++) {
    let acc = 0;
    const row = y * n;
    for (let x = -rad; x <= rad; x++) acc += src[row + Math.min(n - 1, Math.max(0, x))];
    for (let x = 0; x < n; x++) {
      tmp[row + x] = acc * inv;
      acc += src[row + Math.min(n - 1, x + rad + 1)] - src[row + Math.max(0, x - rad)];
    }
  }
  for (let x = 0; x < n; x++) {
    let acc = 0;
    for (let y = -rad; y <= rad; y++) acc += tmp[Math.min(n - 1, Math.max(0, y)) * n + x];
    for (let y = 0; y < n; y++) {
      out[y * n + x] = acc * inv;
      acc += tmp[Math.min(n - 1, y + rad + 1) * n + x] - tmp[Math.max(0, y - rad) * n + x];
    }
  }
  return out;
}

export function bakeAO(stamps: TamponAO[], lamps: { x: number; z: number }[]): Uint8Array {
  const n = AO_RES,
    cell = (2 * AO_EXT) / n;
  const occ = new Float32Array(n * n),
    tall = new Float32Array(n * n);
  for (const s of stamps) {
    const i0 = Math.max(0, Math.floor((s.x0 + AO_EXT) / cell)),
      i1 = Math.min(n - 1, Math.ceil((s.x1 + AO_EXT) / cell));
    const j0 = Math.max(0, Math.floor((s.z0 + AO_EXT) / cell)),
      j1 = Math.min(n - 1, Math.ceil((s.z1 + AO_EXT) / cell));
    const tv = Math.min(1, (s.h || 0) / 70);
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        const k = j * n + i;
        if (s.w > occ[k]) occ[k] = s.w;
        if (tv > tall[k]) tall[k] = tv;
      }
  }
  let a = blur(occ, n, 3);
  a = blur(a, n, 3);
  let t = blur(tall, n, 11);
  t = blur(t, n, 11);
  const gl0 = new Float32Array(n * n);
  for (const l of lamps) {
    const i = Math.round((l.x + AO_EXT) / cell),
      j = Math.round((l.z + AO_EXT) / cell);
    for (let dj = -3; dj <= 3; dj++)
      for (let di = -3; di <= 3; di++) {
        const ii = i + di,
          jj = j + dj;
        if (ii < 0 || jj < 0 || ii >= n || jj >= n || di * di + dj * dj > 9) continue;
        gl0[jj * n + ii] = 1;
      }
  }
  let gw = blur(gl0, n, 4);
  gw = blur(gw, n, 4);
  const out = new Uint8Array(n * n * 2);
  for (let k = 0; k < n * n; k++) {
    out[2 * k] = Math.round(255 * Math.max(0.28, Math.min(1, 1 - 0.62 * a[k] - 0.4 * t[k])));
    out[2 * k + 1] = Math.round(255 * Math.min(1, gw[k] * 1.8));
  }
  return out;
}
