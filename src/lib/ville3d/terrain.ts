/**
 * Terrain : cours, parcs, parkings, blocs, routes, campagne. Porté
 * depuis docs/prototypes/prototype-ville-3d.html.
 */

import type { RNG } from "./aleatoire";
import { pick, rngFrom, rr } from "./aleatoire";
import {
  APART_FLOOR_EVERY,
  APART_FROM,
  BS,
  COL,
  LOT,
  MAT,
  PER_FLOOR,
  PERIOD,
  SW,
  T,
  blockX0,
  hex,
} from "./constantes";
import { box, cylinder, flat, type Geo } from "./geometrie";
import { car, conifer, tree, type TamponAO } from "./mobilier";
import { buildApart, buildHouse, buildTower, type Facade, type Rect } from "./batiments";

export interface Bloc {
  bi: number;
  bj: number;
  d: number;
  openAt: number;
  gap: number;
  towerAt: number;
  active: boolean;
}

export interface Stats {
  maxFloors: number;
  towers: number;
  active: number;
  center?: [number, number];
  extent?: number;
  next?: number;
  /** Demi-taille du carré qui contient la ville : pilote brouillard, ombres, occlusion et caméra. */
  cityR?: number;
}

const lotRect = (bx0: number, bz0: number, lc: number, lr: number): Rect => [
  bx0 + SW + lc * LOT,
  bz0 + SW + lr * LOT,
  bx0 + SW + (lc + 1) * LOT,
  bz0 + SW + (lr + 1) * LOT,
];

export function buildCourtyard(g: Geo, rect: Rect, r: RNG, ao: TamponAO[]) {
  const [x0, z0, x1, z1] = rect;
  const cx = (x0 + x1) / 2,
    cz = (z0 + z1) / 2;
  const w = 1.7,
    inset = 2.2,
    y = 0.17;
  flat(g, x0 + inset, z0 + inset, x1 - inset, z0 + inset + w, y, COL.paving, MAT.PAVING);
  flat(g, x0 + inset, z1 - inset - w, x1 - inset, z1 - inset, y, COL.paving, MAT.PAVING);
  flat(g, x0 + inset, z0 + inset + w, x0 + inset + w, z1 - inset - w, y, COL.paving, MAT.PAVING);
  flat(g, x1 - inset - w, z0 + inset + w, x1 - inset, z1 - inset - w, y, COL.paving, MAT.PAVING);
  cylinder(g, cx, 0.15, cz, 2.8, 0.55, 20, COL.stone, MAT.PLAIN, MAT.PLAIN, COL.stone);
  cylinder(g, cx, 0.15, cz, 2.4, 0.5, 20, COL.stone, MAT.PLAIN, MAT.WATER, COL.water);
  cylinder(g, cx, 0.6, cz, 0.35, 1.2, 10, COL.stone, MAT.PLAIN, MAT.PLAIN, COL.stone);
  const pts: [number, number][] = [
    [x0 + 5, z0 + 5],
    [x1 - 5, z0 + 5],
    [x0 + 5, z1 - 5],
    [x1 - 5, z1 - 5],
    [cx + rr(r, -6, 6), z0 + 5],
    [cx + rr(r, -6, 6), z1 - 5],
  ];
  for (const [tx, tz] of pts) if (r() < 0.85) tree(g, tx, tz, 0.15, rr(r, 0.9, 1.2), r, ao);
}

export function buildPark(g: Geo, rect: Rect, r: RNG, ao: TamponAO[], vacant?: boolean) {
  const [x0, z0, x1, z1] = rect;
  const cx = (x0 + x1) / 2,
    cz = (z0 + z1) / 2;
  if (vacant) {
    if (r() < 0.5) tree(g, rr(r, x0 + 3, x1 - 3), rr(r, z0 + 3, z1 - 3), 0.15, rr(r, 0.8, 1.1), r, ao);
    return;
  }
  flat(g, cx - 0.9, z0 + 0.6, cx + 0.9, z1 - 0.6, 0.17, COL.paving, MAT.PAVING);
  for (let i = 0; i < 4; i++) {
    const tx = rr(r, x0 + 2.5, x1 - 2.5),
      tz = rr(r, z0 + 2.5, z1 - 2.5);
    if (Math.abs(tx - cx) < 2.2) continue;
    tree(g, tx, tz, 0.15, rr(r, 0.9, 1.25), r, ao);
  }
  box(g, cx + 1.3, 0.15, cz - 1, cx + 1.8, 0.6, cz + 1, { c: hex("#7a5a3e"), m: MAT.TRUNK });
}

export function buildParking(g: Geo, rect: Rect, front: Facade, r: RNG, seed: number) {
  const [x0, z0, x1, z1] = rect;
  const i = 0.5,
    X0 = x0 + i,
    Z0 = z0 + i,
    X1 = x1 - i,
    Z1 = z1 - i;
  const depth = front === "-z" || front === "+z" ? Z1 - Z0 : X1 - X0;
  const uv = (x: number, z: number): [number, number] => {
    if (front === "-z") return [x - X0, z - Z0];
    if (front === "+z") return [x - X0, Z1 - z];
    if (front === "-x") return [z - Z0, x - X0];
    return [z - Z0, X1 - x];
  };
  flat(g, X0, Z0, X1, Z1, 0.17, COL.road, MAT.PARKING, seed + Math.min(depth, 99) / 100, uv);
  const along = front === "-z" || front === "+z";
  const len = along ? X1 - X0 : Z1 - Z0;
  const n = Math.floor(len / 2.6);
  for (let row = 0; row < 2; row++) {
    for (let k = 0; k < n; k++) {
      if (r() > 0.55) continue;
      const u = (k + 0.5) * 2.6,
        v = row === 0 ? 2.7 : depth - 2.7;
      let x: number, z: number;
      if (front === "-z") {
        x = X0 + u;
        z = Z0 + v;
      } else if (front === "+z") {
        x = X0 + u;
        z = Z1 - v;
      } else if (front === "-x") {
        z = Z0 + u;
        x = X0 + v;
      } else {
        z = Z0 + u;
        x = X1 - v;
      }
      car(g, x, z, !along, r, 0.17);
    }
  }
}

export function buildBlock(
  g: Geo,
  b: Bloc,
  C: number,
  key: string,
  ao: TamponAO[],
  stats: Stats,
  glow: { x: number; z: number }[],
  ev: number[]
) {
  const r = rngFrom(key + "|bloc|" + b.bi + "," + b.bj);
  const bx0 = blockX0(b.bi),
    bz0 = blockX0(b.bj);
  const seed = Math.floor(r() * 900) + 50;

  box(g, bx0, 0, bz0, bx0 + BS, 0.15, bz0 + BS, { c: COL.lawn, m: MAT.PLAIN, topM: MAT.LAWN, topC: COL.lawn, seed });
  const sh = 0.2,
    sc = COL.sidewalk;
  box(g, bx0, 0, bz0, bx0 + BS, sh, bz0 + SW, { c: sc, m: MAT.SIDEWALK });
  box(g, bx0, 0, bz0 + BS - SW, bx0 + BS, sh, bz0 + BS, { c: sc, m: MAT.SIDEWALK });
  box(g, bx0, 0, bz0 + SW, bx0 + SW, sh, bz0 + BS - SW, { c: sc, m: MAT.SIDEWALK });
  box(g, bx0 + BS - SW, 0, bz0 + SW, bx0 + BS, sh, bz0 + BS - SW, { c: sc, m: MAT.SIDEWALK });

  // arbres d'alignement
  const streetTree = (x: number, z: number) => {
    if (r() < 0.7) tree(g, x, z, sh, rr(r, 0.75, 0.9), r, ao);
  };
  for (let k = 1; k < 6; k++) {
    const t = 6 + k * 9.2;
    streetTree(bx0 + t, bz0 + 1.2);
    streetTree(bx0 + t, bz0 + BS - 1.2);
    streetTree(bx0 + 1.2, bz0 + t);
    streetTree(bx0 + BS - 1.2, bz0 + t);
  }

  // lampadaires le long des trottoirs (éclairent la chaussée la nuit)
  const lamp = (x: number, z: number, hx: number, hz: number) => {
    box(g, x - 0.09, sh, z - 0.09, x + 0.09, sh + 5.6, z + 0.09, { c: hex("#3b4148"), m: MAT.PLAIN });
    box(
      g,
      Math.min(x, x + hx) - 0.07,
      sh + 5.5,
      Math.min(z, z + hz) - 0.07,
      Math.max(x, x + hx) + 0.07,
      sh + 5.64,
      Math.max(z, z + hz) + 0.07,
      { c: hex("#3b4148"), m: MAT.PLAIN }
    );
    box(g, x + hx - 0.3, sh + 5.3, z + hz - 0.3, x + hx + 0.3, sh + 5.5, z + hz + 0.3, {
      c: hex("#fff1d0"),
      m: MAT.LAMP,
    });
    glow.push({ x: x + hx * 2.2, z: z + hz * 2.2 });
  };
  for (const t of [10, 29, 48]) {
    lamp(bx0 + t, bz0 + 0.5, 0, -1.1);
    lamp(bx0 + t, bz0 + BS - 0.5, 0, 1.1);
    lamp(bx0 + 0.5, bz0 + t, -1.1, 0);
    lamp(bx0 + BS - 0.5, bz0 + t, 1.1, 0);
  }

  // où va le gratte-ciel (un côté du bloc, 2x2 parcelles)
  const side = Math.floor(r() * 4);
  const towerSets: { lots: [number, number][]; inner: Facade }[] = [
    { lots: [[1, 0], [2, 0], [1, 1], [2, 1]], inner: "+z" },
    { lots: [[1, 3], [2, 3], [1, 2], [2, 2]], inner: "-z" },
    { lots: [[0, 1], [0, 2], [1, 1], [1, 2]], inner: "+x" },
    { lots: [[3, 1], [3, 2], [2, 1], [2, 2]], inner: "-x" },
  ];
  const ts = towerSets[side];
  const inTower = (lc: number, lr: number) => ts.lots.some(([a, bb]) => a === lc && bb === lr);

  const perim: [number, number][] = [],
    interior: [number, number][] = [];
  for (let lc = 0; lc < 4; lc++)
    for (let lr = 0; lr < 4; lr++) {
      if (inTower(lc, lr)) continue;
      const edge = lc === 0 || lc === 3 || lr === 0 || lr === 3;
      (edge ? perim : interior).push([lc, lr]);
    }
  for (let i = perim.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [perim[i], perim[j]] = [perim[j], perim[i]];
  }

  // Toutes les décisions de forme sont tirées ici, AVANT de savoir ce qui est construit :
  // ainsi une maison déjà posée ne change jamais d'aspect quand la ville grandit.
  const fronts: Facade[] = perim.map(([lc, lr]) => {
    const f: Facade[] = [];
    if (lr === 0) f.push("-z");
    if (lr === 3) f.push("+z");
    if (lc === 0) f.push("-x");
    if (lc === 3) f.push("+x");
    return f[Math.floor(r() * f.length)];
  });
  const parkingIdx = 6 + Math.floor(r() * (perim.length - 6));
  // Tours plus hautes au centre ; les blocs lointains plafonnent à 14 étages
  // (silhouette dense au centre, quelle que soit la taille de la ville).
  const dCenter = Math.hypot(b.bi + 0.5, b.bj + 0.5);
  const cap = Math.max(14, Math.round(40 - dCenter * 8 + (r() * 4 - 2)));
  const jitter = Math.floor(r() * 3);
  const lotRng = (lc: number, lr: number) => rngFrom(key + "|lot|" + b.bi + "," + b.bj + "|" + lc + "," + lr);

  const gap = b.gap;
  perim.forEach(([lc, lr], idx) => {
    const rect = lotRect(bx0, bz0, lc, lr),
      front = fronts[idx],
      lr_ = lotRng(lc, lr);
    const lotSeed = (seed + idx * 7) % 999;
    if (idx < 4) {
      const at = b.openAt + gap * idx * 0.2;
      ev.push(at);
      if (C >= at) buildHouse(g, rect, front, lr_, ao, lotSeed);
      else buildPark(g, rect, lr_, ao, true);
    } else if (idx < 6) {
      const start = Math.max(APART_FROM, b.openAt + gap * (0.8 + 0.1 * (idx - 4)));
      ev.push(start);
      if (C >= start) {
        const fl = Math.min(7, 2 + Math.floor((C - start) / APART_FLOOR_EVERY)) - (lotSeed % 2);
        ev.push(start + (Math.floor((C - start) / APART_FLOOR_EVERY) + 1) * APART_FLOOR_EVERY);
        buildApart(g, rect, front, Math.max(2, fl), lr_, ao, lotSeed);
      } else buildPark(g, rect, lr_, ao, true);
    } else if (idx === parkingIdx && C >= APART_FROM) buildParking(g, rect, front, lr_, lotSeed);
    else buildPark(g, rect, lr_, ao);
  });

  // cour commune au centre du bloc
  if (interior.length) {
    const xs = interior.map(([lc, lr]) => lotRect(bx0, bz0, lc, lr));
    const rect: Rect = [
      Math.min(...xs.map((q) => q[0])),
      Math.min(...xs.map((q) => q[1])),
      Math.max(...xs.map((q) => q[2])),
      Math.max(...xs.map((q) => q[3])),
    ];
    buildCourtyard(g, rect, lotRng(9, 9), ao);
  }

  // Emplacement du gratte-ciel : square public tant que le chantier n'a pas démarré,
  // puis un étage tous les 500 habitants depuis le début du chantier.
  const tl = ts.lots.map(([lc, lr]) => lotRect(bx0, bz0, lc, lr));
  const trect: Rect = [
    Math.min(...tl.map((q) => q[0])),
    Math.min(...tl.map((q) => q[1])),
    Math.max(...tl.map((q) => q[2])),
    Math.max(...tl.map((q) => q[3])),
  ];
  ev.push(b.towerAt);
  if (C >= b.towerAt) {
    const F = Math.max(0, Math.min(cap, Math.floor((C - b.towerAt) / PER_FLOOR) + jitter));
    if (F < cap) ev.push(b.towerAt + (F - jitter + 1) * PER_FLOOR);
    buildTower(g, trect, ts.inner, F, cap, lotRng(8, 8), ao, seed);
    stats.maxFloors = Math.max(stats.maxFloors, F);
    stats.towers++;
  } else {
    buildSquare(g, trect, lotRng(7, 7), ao);
  }
}

/** Square public (emplacement réservé au futur gratte-ciel). */
export function buildSquare(g: Geo, rect: Rect, r: RNG, ao: TamponAO[]) {
  const [x0, z0, x1, z1] = rect;
  const cx = (x0 + x1) / 2,
    cz = (z0 + z1) / 2,
    y = 0.17,
    w = 1.8;
  flat(g, x0 + 1, cz - w / 2, x1 - 1, cz + w / 2, y, COL.paving, MAT.PAVING);
  flat(g, cx - w / 2, z0 + 1, cx + w / 2, z1 - 1, y, COL.paving, MAT.PAVING);
  flat(g, cx - 4, cz - 4, cx + 4, cz + 4, y + 0.005, COL.paving, MAT.PAVING);
  cylinder(g, cx, 0.15, cz, 1.2, 0.7, 14, COL.stone, MAT.PLAIN, MAT.PLAIN, COL.stone);
  cylinder(g, cx, 0.85, cz, 0.35, 2.2, 10, hex("#8e8a80"), MAT.PLAIN, MAT.PLAIN, hex("#8e8a80"));
  for (const [qx, qz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    const tx = cx + qx * rr(r, 6.5, 9.5),
      tz = cz + qz * rr(r, 6.5, 9.5);
    tree(g, tx, tz, 0.15, rr(r, 1.0, 1.3), r, ao);
    if (r() < 0.6) tree(g, cx + qx * rr(r, 3, 11), cz + qz * rr(r, 10, 12), 0.15, rr(r, 0.8, 1.1), r, ao);
    box(g, cx + qx * 3.2 - 0.9, 0.15, cz + qz * 1.6 - 0.25, cx + qx * 3.2 + 0.9, 0.6, cz + qz * 1.6 + 0.25, {
      c: hex("#7a5a3e"),
      m: MAT.TRUNK,
    });
  }
}

export function buildIdleBlock(g: Geo, b: Bloc, key: string, ao: TamponAO[]) {
  const r = rngFrom(key + "|friche|" + b.bi + "," + b.bj);
  const bx0 = blockX0(b.bi),
    bz0 = blockX0(b.bj);
  const n = 3 + Math.floor(r() * 5);
  for (let i = 0; i < n; i++) tree(g, bx0 + rr(r, 6, BS - 6), bz0 + rr(r, 6, BS - 6), 0, rr(r, 0.9, 1.3), r, ao);
}

/**
 * Forêts à positions fixes (tirées une fois par ville, un générateur par
 * forêt et par arbre) : quand la ville s'étend, elle efface les arbres qui
 * tombent sur son emprise sans déplacer les autres.
 */
export function buildCountryside(g: Geo, key: string, ao: TamponAO[], cityR: number) {
  for (let k = 0; k < 110; k++) {
    const r = rngFrom(key + "|foret|" + k);
    const a = r() * Math.PI * 2,
      d = rr(r, 200, 1500);
    const cx = Math.cos(a) * d,
      cz = Math.sin(a) * d;
    const n = 6 + Math.floor(r() * 14),
      spread = rr(r, 10, 26);
    const coni = r() < 0.5;
    for (let i = 0; i < n; i++) {
      const q = rngFrom(key + "|arbre|" + k + "|" + i);
      const x = cx + rr(q, -spread, spread),
        z = cz + rr(q, -spread, spread);
      if (Math.max(Math.abs(x), Math.abs(z)) < cityR + 14) continue;
      if (Math.abs(x) < 12 || Math.abs(z) < 12) continue;
      if (coni && q() < 0.8) conifer(g, x, z, rr(q, 0.9, 1.25), q, ao);
      else tree(g, x, z, 0, rr(q, 1.1, 1.6), q, ao);
    }
  }
}

/**
 * Rues autour de chaque bloc actif, plus les deux grands axes qui
 * traversent toute la ville (elle est née à leur croisement). Cases de rue
 * repérées par des indices entiers (ti, tj) centrés sur x = ti·T ; une rue
 * tous les PERIOD cases. Une voiture par case, avec son propre générateur :
 * ouvrir un bloc ne déplace pas celles déjà garées ailleurs.
 */
export function buildRoadsAndTraffic(g: Geo, activeBlocks: Bloc[], key: string, rayonEnCases: number) {
  const tiles = new Set<string>();
  const m5 = (v: number) => ((v % PERIOD) + PERIOD) % PERIOD;
  for (const bl of activeBlocks) {
    for (let ti = PERIOD * bl.bi; ti <= PERIOD * bl.bi + PERIOD; ti++)
      for (let tj = PERIOD * bl.bj; tj <= PERIOD * bl.bj + PERIOD; tj++) {
        if (m5(ti) === 0 || m5(tj) === 0) tiles.add(ti + "," + tj);
      }
  }
  for (let t = -rayonEnCases; t <= rayonEnCases; t++) {
    tiles.add("0," + t);
    tiles.add(t + ",0");
  }
  const list = [...tiles].map((k) => k.split(",").map(Number)).sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  for (const [ti, tj] of list) {
    const x0 = ti * T - T / 2,
      z0 = tj * T - T / 2;
    flat(g, x0, z0, x0 + T, z0 + T, 0.03, COL.road, MAT.ROAD);
    const ri = m5(ti) === 0,
      rj = m5(tj) === 0;
    if (ri && rj) continue;
    const rc = rngFrom(key + "|voiture|" + ti + "," + tj);
    if (rc() < 0.42) {
      const lane = rc() < 0.5 ? -3.2 : 3.2;
      const t = rr(rc, 3, 13);
      if (ri) car(g, x0 + T / 2 + lane, z0 + t, false, rc); // rue orientée Z
      else car(g, x0 + t, z0 + T / 2 + lane, true, rc);
    }
  }
}

/** Routes de campagne : les deux axes centraux repartent du bord actuel de la ville vers l'horizon, bordés d'arbres. */
export function buildCountryRoads(g: Geo, key: string, ao: TamponAO[], cityR: number) {
  const hw = 5,
    far = 3800,
    y = 0.03,
    E = cityR;
  flat(g, -hw, -far, hw, -E, y, COL.road, MAT.ROAD);
  flat(g, -hw, E, hw, far, y, COL.road, MAT.ROAD);
  flat(g, -far, -hw, -E, hw, y, COL.road, MAT.ROAD);
  flat(g, E, -hw, far, hw, y, COL.road, MAT.ROAD);
  for (const sgn of [-1, 1]) {
    for (let i = 0; i < 68; i++) {
      const d = 190 + i * 21;
      if (d < E + 14) continue;
      const q = rngFrom(key + "|bord|" + sgn + "|" + i);
      const side = q() < 0.5 ? -1 : 1,
        off = side * rr(q, 7.5, 9.5),
        jd = rr(q, -4, 4);
      if (q() < 0.8) tree(g, off, sgn * (d + jd), 0, rr(q, 1.0, 1.35), q, ao);
      if (q() < 0.8) tree(g, sgn * (d - jd), -off, 0, rr(q, 1.0, 1.35), q, ao);
      if (q() < 0.12) car(g, q() < 0.5 ? -2.2 : 2.2, sgn * (d + 6), false, q);
      if (q() < 0.12) car(g, sgn * (d + 6), q() < 0.5 ? -2.2 : 2.2, true, q);
    }
  }
}
