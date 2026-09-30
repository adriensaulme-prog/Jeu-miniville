/**
 * Installations d'Énergie, hors de la ville (docs/SYSTEME-DEVELOPPEMENT.md
 * §7) : panneaux solaires et éoliennes en nombre proportionnel aux
 * points, puis une centrale au-delà d'un seuil. Placées par
 * buildEnergieCampagne() (terrain.ts), à des emplacements fixes tirés
 * une fois par ville — comme les forêts de buildCountryside() — pour
 * qu'une installation déjà visible ne se déplace jamais quand l'élan
 * grandit.
 *
 * Retour de test d'Adrien sur le premier passage (docs/A-INTEGRER.md
 * §20 A, 27/09/2026) : l'éolienne en particulier manquait de présence
 * visuelle (mât + nacelle + pales minimalistes). Enrichi ici : mât à
 * bande d'avertissement, nacelle avec nez, pales à deux segments
 * (racine large, pointe effilée), balise clignotante ; panneaux
 * solaires posés en petite ferme de plusieurs unités plutôt qu'une
 * seule ; centrale avec un second bâtiment technique et des pylônes de
 * raccordement.
 */
import type { RNG } from "./aleatoire";
import { pick, rr } from "./aleatoire";
import {
  CENTRALE_ACCENT,
  CENTRALE_WALLS,
  COL,
  EOLIENNE_MAT,
  MAT,
  PANNEAU_CADRE,
  PANNEAU_CELLULE,
} from "./constantes";
import { box, cylinder, shadeC, type Geo } from "./geometrie";
import type { TamponAO } from "./mobilier";

/** Pale à deux segments (racine large, pointe effilée), quad dans un plan vertical de z constant. */
function pale(g: Geo, cx: number, cy: number, cz: number, theta: number, len: number, w: number, seed: number) {
  const dx = Math.sin(theta),
    dy = Math.cos(theta);
  const px = -dy,
    py = dx;
  const n: [number, number, number] = [0, 0, 1];
  const quad = (l0: number, l1: number, w0: number, w1: number, u0: number, u1: number) => {
    const a = g.v(cx + px * (w0 / 2) + dx * l0, cy + py * (w0 / 2) + dy * l0, cz, ...n, EOLIENNE_MAT, MAT.PLAIN, u0, 0, seed);
    const b = g.v(cx - px * (w0 / 2) + dx * l0, cy - py * (w0 / 2) + dy * l0, cz, ...n, EOLIENNE_MAT, MAT.PLAIN, u0, 1, seed);
    const c = g.v(cx - px * (w1 / 2) + dx * l1, cy - py * (w1 / 2) + dy * l1, cz, ...n, EOLIENNE_MAT, MAT.PLAIN, u1, 1, seed);
    const d = g.v(cx + px * (w1 / 2) + dx * l1, cy + py * (w1 / 2) + dy * l1, cz, ...n, EOLIENNE_MAT, MAT.PLAIN, u1, 0, seed);
    g.q(a, b, c, d);
  };
  const mid = len * 0.35;
  quad(0, mid, w, w * 0.55, 0, 0.5);
  quad(mid, len, w * 0.55, w * 0.12, 0.5, 1);
}

export function buildEolienne(g: Geo, cx: number, cz: number, r: RNG, ao: TamponAO[], seed: number) {
  const h = rr(r, 10, 14);
  cylinder(g, cx, 0, cz, 0.32, h, 10, EOLIENNE_MAT, MAT.PLAIN, MAT.PLAIN, EOLIENNE_MAT, 0.15);
  // bande d'avertissement (rouge/blanc), obligatoire sur les mâts réels
  cylinder(g, cx, h * 0.88, cz, 0.19, h * 0.05, 10, COL.beacon, MAT.PAINT, null, null, 0.17);
  // nacelle (corps + nez conique) et balise clignotante
  box(g, cx - 0.4, h - 0.05, cz - 1.1, cx + 0.4, h + 0.55, cz + 0.25, { c: EOLIENNE_MAT, m: MAT.PLAIN, seed });
  cylinder(g, cx, h + 0.1, cz - 1.1, 0.35, 0.5, 8, shadeC(EOLIENNE_MAT, 0.94), MAT.PLAIN, null, null, 0.05);
  box(g, cx - 0.12, h + 0.56, cz - 0.15, cx + 0.12, h + 0.7, cz + 0.15, { c: COL.beacon, m: MAT.BEACON });
  const a0 = r() * Math.PI * 2;
  for (let i = 0; i < 3; i++)
    pale(g, cx, h + 0.15, cz - 1.15, a0 + (i * Math.PI * 2) / 3, rr(r, 4.6, 5.6), 0.5, seed + i);
  // socle bétonné au pied du mât
  cylinder(g, cx, 0, cz, 1.1, 0.15, 12, COL.concrete, MAT.CONCRETE, MAT.CONCRETE, COL.concrete);
  ao.push({ x0: cx - 1.1, z0: cz - 1.1, x1: cx + 1.1, z1: cz + 1.1, w: 1, h: 1.5 });
}

/** Un panneau tilté (formule identique à un pan de toit, voir gableRoof), sur un pied court. */
function panneau(g: Geo, cx: number, cz: number, rot: number, r: RNG, seed: number) {
  const w = rr(r, 3.0, 3.6),
    d = rr(r, 1.8, 2.2),
    tilt = 0.45,
    legH = 0.85;
  box(g, cx - 0.1, 0, cz - 0.1, cx + 0.1, legH, cz + 0.1, { c: PANNEAU_CADRE, m: MAT.PLAIN, seed });
  const cosT = Math.cos(tilt),
    sinT = Math.sin(tilt),
    cosR = Math.cos(rot),
    sinR = Math.sin(rot);
  const pt = (lx: number, ly: number): [number, number, number] => {
    const dy = ly * sinT,
      dz = ly * cosT;
    return [cx + lx * cosR + dz * sinR, legH + dy, cz - lx * sinR + dz * cosR];
  };
  const n0: [number, number, number] = [0, cosT, -sinT];
  const n: [number, number, number] = [n0[0] * cosR + n0[2] * sinR, n0[1], -n0[0] * sinR + n0[2] * cosR];
  const p00 = pt(-w / 2, -d / 2),
    p10 = pt(w / 2, -d / 2),
    p11 = pt(w / 2, d / 2),
    p01 = pt(-w / 2, d / 2);
  const a = g.v(...p00, ...n, PANNEAU_CELLULE, MAT.PLAIN, 0, 0, seed);
  const b = g.v(...p10, ...n, PANNEAU_CELLULE, MAT.PLAIN, w, 0, seed);
  const cc = g.v(...p11, ...n, PANNEAU_CELLULE, MAT.PLAIN, w, d, seed);
  const dd = g.v(...p01, ...n, PANNEAU_CELLULE, MAT.PLAIN, 0, d, seed);
  g.q(a, b, cc, dd);
}

/** Petite ferme solaire : plusieurs panneaux alignés plutôt qu'une seule unité. */
export function buildPanneauSolaire(g: Geo, cx: number, cz: number, r: RNG, ao: TamponAO[], seed: number) {
  const rot = r() * Math.PI * 2,
    n = 3 + Math.floor(r() * 3),
    pas = 4.6;
  const dx = Math.cos(rot),
    dz = Math.sin(rot);
  const start = -((n - 1) * pas) / 2;
  for (let i = 0; i < n; i++) {
    const off = start + i * pas;
    panneau(g, cx + dx * off, cz + dz * off, rot, r, seed + i);
  }
  // petit boîtier onduleur en bout de rangée
  const ex = cx + dx * (start - 1.4),
    ez = cz + dz * (start - 1.4);
  box(g, ex - 0.3, 0, ez - 0.3, ex + 0.3, 0.9, ez + 0.3, { c: PANNEAU_CADRE, m: MAT.PLAIN, seed });
  const half = ((n - 1) * pas) / 2 + 2.4;
  ao.push({ x0: cx - half, z0: cz - half, x1: cx + half, z1: cz + half, w: 1, h: 2.2 });
}

/** Pylône de raccordement simplifié, entre la centrale et la ville. */
function pylone(g: Geo, cx: number, cz: number, h: number, seed: number) {
  box(g, cx - 0.22, 0, cz - 0.22, cx + 0.22, h, cz + 0.22, { c: COL.metal, m: MAT.LATTICE, seed, base: 0 });
  box(g, cx - 1.6, h - 0.15, cz - 0.15, cx + 1.6, h + 0.15, cz + 0.15, { c: COL.metal, m: MAT.LATTICE, seed });
}

export function buildCentraleEnergie(g: Geo, cx: number, cz: number, r: RNG, ao: TamponAO[], seed: number) {
  const wallC = pick(r, CENTRALE_WALLS);
  const w = 13,
    d = 10,
    h = 6.5;
  box(g, cx - w / 2, 0.15, cz - d / 2, cx + w / 2, 0.15 + h, cz + d / 2, {
    c: wallC,
    m: MAT.CONCRETE,
    topM: MAT.FLATROOF,
    topC: COL.roofGray,
    seed,
    base: 0.15,
  });
  box(g, cx - w / 2, 0.15 + h - 0.7, cz - d / 2, cx + w / 2, 0.15 + h, cz + d / 2, {
    c: CENTRALE_ACCENT,
    m: MAT.PLAIN,
    top: false,
    seed,
  });
  const tx = cx + w / 2 - 2.2;
  cylinder(g, tx, 0.15, cz, 1.5, 11, 14, wallC, MAT.PLAIN, MAT.FLATROOF, COL.roofGray, 1.1);
  cylinder(g, tx, 0.15 + 11, cz, 0.65, 1.4, 10, CENTRALE_ACCENT, MAT.PLAIN, MAT.PLAIN, CENTRALE_ACCENT);
  // second réservoir, un peu plus petit
  const tx2 = cx + w / 2 - 5.4;
  cylinder(g, tx2, 0.15, cz - d / 2 - 1.6, 1.15, 8.5, 12, shadeC(wallC, 1.05), MAT.PLAIN, MAT.FLATROOF, COL.roofGray, 0.9);
  // bâtiment technique séparé (poste de contrôle)
  const bx = cx - w / 2 - 4.5;
  box(g, bx - 2.6, 0.15, cz - 2.2, bx + 2.6, 0.15 + 3.2, cz + 2.2, {
    c: shadeC(wallC, 0.95),
    m: MAT.CONCRETE,
    topM: MAT.FLATROOF,
    topC: COL.roofGray,
    seed: seed + 1,
    base: 0.15,
  });
  // clôture basse tout autour du site
  const fh = 1.3,
    ft = 0.08,
    x0 = cx - w / 2 - 6.5,
    x1 = cx + w / 2 + 1.5,
    z0 = cz - d / 2 - 3,
    z1 = cz + d / 2 + 1.5;
  box(g, x0, 0.15, z0 - ft / 2, x1, 0.15 + fh, z0 + ft / 2, { c: COL.fence, m: MAT.FENCE, seed });
  box(g, x0, 0.15, z1 - ft / 2, x1, 0.15 + fh, z1 + ft / 2, { c: COL.fence, m: MAT.FENCE, seed });
  // pylônes de raccordement, en ligne vers la ville
  for (let i = 0; i < 2; i++) pylone(g, cx + w / 2 + 8 + i * 14, cz, rr(r, 7, 9), seed + 2 + i);
  ao.push({ x0: x0 - 1, z0: z0 - 1, x1: x1 + 1, z1: z1 + 1, w: 1, h });
}
