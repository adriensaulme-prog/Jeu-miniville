/**
 * Géométrie bas niveau, portée quasi telle quelle depuis
 * docs/prototypes/prototype-ville-3d.html. La classe Geo accumule des
 * sommets/indices dans de simples tableaux, sans toucher au rendu —
 * c'est src/lib/ville3d/scene.ts qui les transforme en
 * THREE.BufferGeometry. Format d'un sommet : position(3), normale(3),
 * couleur(3), matériau(1), u(1), v(1), graine(1) = 13 flottants.
 */

import type { Couleur } from "./constantes";
import { MAT } from "./constantes";
import type { RNG } from "./aleatoire";

export class Geo {
  V: number[] = [];
  I: number[] = [];
  n = 0;

  v(
    x: number,
    y: number,
    z: number,
    nx: number,
    ny: number,
    nz: number,
    c: Couleur,
    m: number,
    u: number,
    w: number,
    s: number
  ): number {
    this.V.push(x, y, z, nx, ny, nz, c[0], c[1], c[2], m, u, w, s);
    return this.n++;
  }
  q(a: number, b: number, c: number, d: number) {
    this.I.push(a, b, c, a, c, d);
  }
  t(a: number, b: number, c: number) {
    this.I.push(a, b, c);
  }
}

export interface OptionsBoite {
  c: Couleur;
  m: number;
  seed?: number;
  base?: number;
  front?: "-z" | "+z" | "-x" | "+x";
  frontM?: number;
  sides?: boolean;
  top?: boolean;
  topM?: number;
  topC?: Couleur;
}

export function box(
  g: Geo,
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
  o: OptionsBoite
) {
  const s = o.seed || 0,
    base = o.base != null ? o.base : y0,
    c = o.c,
    m = o.m;
  const fm = (side: string) => (o.front === side && o.frontM != null ? o.frontM : m);
  const wx = x1 - x0,
    wz = z1 - z0;
  let w = s + Math.min(wx, 99) / 100;
  let a: number, b: number, cc: number, d: number, mm: number;
  if (o.sides !== false) {
    mm = fm("-z");
    a = g.v(x0, y0, z0, 0, 0, -1, c, mm, 0, y0 - base, w);
    b = g.v(x1, y0, z0, 0, 0, -1, c, mm, wx, y0 - base, w);
    cc = g.v(x1, y1, z0, 0, 0, -1, c, mm, wx, y1 - base, w);
    d = g.v(x0, y1, z0, 0, 0, -1, c, mm, 0, y1 - base, w);
    g.q(a, b, cc, d);
    mm = fm("+z");
    a = g.v(x1, y0, z1, 0, 0, 1, c, mm, 0, y0 - base, w);
    b = g.v(x0, y0, z1, 0, 0, 1, c, mm, wx, y0 - base, w);
    cc = g.v(x0, y1, z1, 0, 0, 1, c, mm, wx, y1 - base, w);
    d = g.v(x1, y1, z1, 0, 0, 1, c, mm, 0, y1 - base, w);
    g.q(a, b, cc, d);
    w = s + Math.min(wz, 99) / 100;
    mm = fm("-x");
    a = g.v(x0, y0, z1, -1, 0, 0, c, mm, 0, y0 - base, w);
    b = g.v(x0, y0, z0, -1, 0, 0, c, mm, wz, y0 - base, w);
    cc = g.v(x0, y1, z0, -1, 0, 0, c, mm, wz, y1 - base, w);
    d = g.v(x0, y1, z1, -1, 0, 0, c, mm, 0, y1 - base, w);
    g.q(a, b, cc, d);
    mm = fm("+x");
    a = g.v(x1, y0, z0, 1, 0, 0, c, mm, 0, y0 - base, w);
    b = g.v(x1, y0, z1, 1, 0, 0, c, mm, wz, y0 - base, w);
    cc = g.v(x1, y1, z1, 1, 0, 0, c, mm, wz, y1 - base, w);
    d = g.v(x1, y1, z0, 1, 0, 0, c, mm, 0, y1 - base, w);
    g.q(a, b, cc, d);
  }
  if (o.top !== false) {
    const tm = o.topM != null ? o.topM : m,
      tc = o.topC || c;
    a = g.v(x0, y1, z0, 0, 1, 0, tc, tm, x0, z0, s);
    b = g.v(x1, y1, z0, 0, 1, 0, tc, tm, x1, z0, s);
    cc = g.v(x1, y1, z1, 0, 1, 0, tc, tm, x1, z1, s);
    d = g.v(x0, y1, z1, 0, 1, 0, tc, tm, x0, z1, s);
    g.q(a, b, cc, d);
  }
}

/** Quad horizontal ; uvFn(x, z) -> [u, v]. */
export function flat(
  g: Geo,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  y: number,
  c: Couleur,
  m: number,
  w?: number,
  uvFn?: (x: number, z: number) => [number, number]
) {
  const f = uvFn || ((x: number, z: number): [number, number] => [x, z]);
  const p = ([
    [x0, z0],
    [x1, z0],
    [x1, z1],
    [x0, z1],
  ] as [number, number][]).map(([x, z]) => {
    const [u, v] = f(x, z);
    return g.v(x, y, z, 0, 1, 0, c, m, u, v, w || 0);
  });
  g.q(p[0], p[1], p[2], p[3]);
}

function norm(v: readonly [number, number, number]): [number, number, number] {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}
export function shadeC(c: Couleur, f: number): Couleur {
  return [Math.min(1, c[0] * f), Math.min(1, c[1] * f), Math.min(1, c[2] * f)];
}
export { norm };

/** Toit à deux pans ; faîtage le long de X si alongX, sinon le long de Z. Renvoie la hauteur du faîtage. */
export function gableRoof(
  g: Geo,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  yE: number,
  pitch: number,
  ov: number,
  alongX: boolean,
  roofC: Couleur,
  wallC: Couleur,
  seed: number
): number {
  const tp = Math.tan(pitch);
  if (alongX) {
    const zc = (z0 + z1) / 2,
      hs = (z1 - z0) / 2,
      yR = yE + hs * tp,
      drop = ov * tp;
    const L = Math.hypot(hs + ov, (hs + ov) * tp);
    const n1 = norm([0, hs, -hs * tp]),
      n2 = norm([0, hs, hs * tp]);
    let a = g.v(x0 - ov, yE - drop, z0 - ov, ...n1, roofC, MAT.TILES, x0 - ov, 0, seed);
    let b = g.v(x1 + ov, yE - drop, z0 - ov, ...n1, roofC, MAT.TILES, x1 + ov, 0, seed);
    let c = g.v(x1 + ov, yR, zc, ...n1, roofC, MAT.TILES, x1 + ov, L, seed);
    let d = g.v(x0 - ov, yR, zc, ...n1, roofC, MAT.TILES, x0 - ov, L, seed);
    g.q(a, b, c, d);
    a = g.v(x1 + ov, yE - drop, z1 + ov, ...n2, roofC, MAT.TILES, x1 + ov, 0, seed);
    b = g.v(x0 - ov, yE - drop, z1 + ov, ...n2, roofC, MAT.TILES, x0 - ov, 0, seed);
    c = g.v(x0 - ov, yR, zc, ...n2, roofC, MAT.TILES, x0 - ov, L, seed);
    d = g.v(x1 + ov, yR, zc, ...n2, roofC, MAT.TILES, x1 + ov, L, seed);
    g.q(a, b, c, d);
    a = g.v(x0, yE, z0, -1, 0, 0, wallC, MAT.PLAIN, 0, 0, seed);
    b = g.v(x0, yE, z1, -1, 0, 0, wallC, MAT.PLAIN, 0, 0, seed);
    c = g.v(x0, yR, zc, -1, 0, 0, wallC, MAT.PLAIN, 0, 0, seed);
    g.t(a, b, c);
    a = g.v(x1, yE, z0, 1, 0, 0, wallC, MAT.PLAIN, 0, 0, seed);
    b = g.v(x1, yE, z1, 1, 0, 0, wallC, MAT.PLAIN, 0, 0, seed);
    c = g.v(x1, yR, zc, 1, 0, 0, wallC, MAT.PLAIN, 0, 0, seed);
    g.t(a, b, c);
    box(g, x0 - ov, yR - 0.05, zc - 0.18, x1 + ov, yR + 0.16, zc + 0.18, {
      c: shadeC(roofC, 0.8),
      m: MAT.PLAIN,
      seed,
    });
    return yR;
  } else {
    const xc = (x0 + x1) / 2,
      hs = (x1 - x0) / 2,
      yR = yE + hs * tp,
      drop = ov * tp;
    const L = Math.hypot(hs + ov, (hs + ov) * tp);
    const n1 = norm([-hs * tp, hs, 0]),
      n2 = norm([hs * tp, hs, 0]);
    let a = g.v(x0 - ov, yE - drop, z1 + ov, ...n1, roofC, MAT.TILES, z1 + ov, 0, seed);
    let b = g.v(x0 - ov, yE - drop, z0 - ov, ...n1, roofC, MAT.TILES, z0 - ov, 0, seed);
    let c = g.v(xc, yR, z0 - ov, ...n1, roofC, MAT.TILES, z0 - ov, L, seed);
    let d = g.v(xc, yR, z1 + ov, ...n1, roofC, MAT.TILES, z1 + ov, L, seed);
    g.q(a, b, c, d);
    a = g.v(x1 + ov, yE - drop, z0 - ov, ...n2, roofC, MAT.TILES, z0 - ov, 0, seed);
    b = g.v(x1 + ov, yE - drop, z1 + ov, ...n2, roofC, MAT.TILES, z1 + ov, 0, seed);
    c = g.v(xc, yR, z1 + ov, ...n2, roofC, MAT.TILES, z1 + ov, L, seed);
    d = g.v(xc, yR, z0 - ov, ...n2, roofC, MAT.TILES, z0 - ov, L, seed);
    g.q(a, b, c, d);
    a = g.v(x0, yE, z0, 0, 0, -1, wallC, MAT.PLAIN, 0, 0, seed);
    b = g.v(x1, yE, z0, 0, 0, -1, wallC, MAT.PLAIN, 0, 0, seed);
    c = g.v(xc, yR, z0, 0, 0, -1, wallC, MAT.PLAIN, 0, 0, seed);
    g.t(a, b, c);
    a = g.v(x0, yE, z1, 0, 0, 1, wallC, MAT.PLAIN, 0, 0, seed);
    b = g.v(x1, yE, z1, 0, 0, 1, wallC, MAT.PLAIN, 0, 0, seed);
    c = g.v(xc, yR, z1, 0, 0, 1, wallC, MAT.PLAIN, 0, 0, seed);
    g.t(a, b, c);
    box(g, xc - 0.18, yR - 0.05, z0 - ov, xc + 0.18, yR + 0.16, z1 + ov, {
      c: shadeC(roofC, 0.8),
      m: MAT.PLAIN,
      seed,
    });
    return yR;
  }
}

export function cylinder(
  g: Geo,
  cx: number,
  y0: number,
  cz: number,
  r: number,
  h: number,
  seg: number,
  c: Couleur,
  m: number,
  topM: number | null,
  topC: Couleur | null,
  rTop?: number
) {
  const rt = rTop != null ? rTop : r;
  const ring0: number[] = [],
    ring1: number[] = [];
  const slope = (r - rt) / h;
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2,
      ca = Math.cos(a),
      sa = Math.sin(a);
    const n = norm([ca, slope, sa]);
    ring0.push(g.v(cx + ca * r, y0, cz + sa * r, n[0], n[1], n[2], c, m, a * r, 0, 0));
    ring1.push(g.v(cx + ca * rt, y0 + h, cz + sa * rt, n[0], n[1], n[2], c, m, a * r, h, 0));
  }
  for (let i = 0; i < seg; i++) g.q(ring0[i], ring0[i + 1], ring1[i + 1], ring1[i]);
  if (topM != null && rt > 0) {
    const ctr = g.v(cx, y0 + h, cz, 0, 1, 0, topC || c, topM, cx, cz, 0);
    const rim: number[] = [];
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const x = cx + Math.cos(a) * rt,
        z = cz + Math.sin(a) * rt;
      rim.push(g.v(x, y0 + h, z, 0, 1, 0, topC || c, topM, x, z, 0));
    }
    for (let i = 0; i < seg; i++) g.t(ctr, rim[i], rim[i + 1]);
  }
}

// Icosphère (base unitaire, subdivisée une fois) pour les feuillages.
const ICO = (() => {
  const t = (1 + Math.sqrt(5)) / 2;
  const verts: [number, number, number][] = (
    [
      [-1, t, 0],
      [1, t, 0],
      [-1, -t, 0],
      [1, -t, 0],
      [0, -1, t],
      [0, 1, t],
      [0, -1, -t],
      [0, 1, -t],
      [t, 0, -1],
      [t, 0, 1],
      [-t, 0, -1],
      [-t, 0, 1],
    ] as [number, number, number][]
  ).map(norm);
  const faces: [number, number, number][] = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ];
  const cache = new Map<string, number>();
  const mid = (a: number, b: number) => {
    const k = a < b ? a + "_" + b : b + "_" + a;
    const cached = cache.get(k);
    if (cached != null) return cached;
    const p = norm([
      (verts[a][0] + verts[b][0]) / 2,
      (verts[a][1] + verts[b][1]) / 2,
      (verts[a][2] + verts[b][2]) / 2,
    ]);
    verts.push(p);
    cache.set(k, verts.length - 1);
    return verts.length - 1;
  };
  const nf: [number, number, number][] = [];
  for (const [a, b, c] of faces) {
    const ab = mid(a, b),
      bc = mid(b, c),
      ca = mid(c, a);
    nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
  }
  return { verts, faces: nf };
})();

export function blob(
  g: Geo,
  cx: number,
  cy: number,
  cz: number,
  rx: number,
  ry: number,
  rz: number,
  c: Couleur,
  m: number,
  r: RNG
) {
  const idx = ICO.verts.map((p) => {
    const j = 0.82 + 0.3 * r();
    const x = cx + p[0] * rx * j,
      y = cy + p[1] * ry * j,
      z = cz + p[2] * rz * j;
    return g.v(x, y, z, p[0], p[1], p[2], c, m, 0, 0, 0);
  });
  for (const [a, b, d] of ICO.faces) g.t(idx[a], idx[b], idx[d]);
}
