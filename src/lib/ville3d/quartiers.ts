/**
 * Bâtiments des quartiers Industrie, Commerce, Services et Recherche
 * (Jalon 19, docs/SYSTEME-DEVELOPPEMENT.md §7). Loisirs réutilise
 * buildPark() (Jalon 6bis) pour son premier stade, et buildStade()
 * ci-dessous pour le second.
 *
 * Trois niveaux par vocation (0 simple, 1 développée, 2 grand
 * complexe), au lieu des deux du premier passage — retour de test
 * d'Adrien (docs/A-INTEGRER.md §20 A, 27/09/2026) : le niveau de détail
 * doit se rapprocher de celui des maisons (plusieurs éléments
 * optionnels tirés au sort, pas juste une géométrie mise à l'échelle).
 * Voir docs/DECISIONS.md §4, journal du Jalon 19.
 */
import type { RNG } from "./aleatoire";
import { pick, rr } from "./aleatoire";
import {
  COL,
  COMMERCE_ENSEIGNE,
  COMMERCE_WALLS,
  FUMEE,
  INDUSTRIE_ACCENT,
  INDUSTRIE_FENCE,
  INDUSTRIE_WALLS,
  MAT,
  RECHERCHE_DOME,
  RECHERCHE_WALLS,
  SERVICES_CROIX,
  SERVICES_WALLS,
  hex,
} from "./constantes";
import { blob, box, cylinder, flat, shadeC, type Geo } from "./geometrie";
import { car, type TamponAO } from "./mobilier";
import { placeInLot, type Facade, type Rect } from "./batiments";

/** Panache de fumée (deux boules empilées, comme le feuillage d'un arbre) au sommet d'une cheminée. */
function fumee(g: Geo, x: number, y: number, z: number, r: RNG) {
  blob(g, x, y, z, 0.9, 0.7, 0.9, FUMEE, MAT.FOLIAGE, r);
  blob(g, x + rr(r, -0.3, 0.5), y + 0.9, z + rr(r, -0.3, 0.5), 0.65, 0.55, 0.65, shadeC(FUMEE, 1.03), MAT.FOLIAGE, r);
}

/** Petit segment de clôture grillagée, comme autour d'un chantier (batiments.ts) mais plus bas. */
function clotureBasse(g: Geo, x0: number, z0: number, x1: number, z1: number, seed: number) {
  const fh = 1.3,
    ft = 0.08,
    y0 = 0.15;
  if (Math.abs(x1 - x0) > Math.abs(z1 - z0)) {
    box(g, x0, y0, z0 - ft / 2, x1, y0 + fh, z0 + ft / 2, { c: INDUSTRIE_FENCE, m: MAT.FENCE, seed });
  } else {
    box(g, x0 - ft / 2, y0, z0, x0 + ft / 2, y0 + fh, z1, { c: INDUSTRIE_FENCE, m: MAT.FENCE, seed });
  }
}

export function buildIndustrie(
  g: Geo,
  rect: Rect,
  front: Facade,
  niveau: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
) {
  const wallC = pick(r, INDUSTRIE_WALLS);
  const width = rr(r, 8.6, 9.6) + niveau * rr(r, 0.5, 1.1),
    depth = rr(r, 7.6, 9.2) + niveau * rr(r, 0.4, 1.0);
  const fp = placeInLot(rect, front, width, depth, 3.0, rr(r, -1, 1));
  const y0 = 0.15,
    h = niveau === 0 ? rr(r, 3.4, 4.0) : niveau === 1 ? rr(r, 5.2, 6.0) : rr(r, 6.6, 7.6);
  box(g, fp[0], y0, fp[1], fp[2], y0 + h, fp[3], {
    c: wallC,
    m: MAT.CONCRETE,
    topM: MAT.FLATROOF,
    topC: COL.roofGray,
    seed,
    base: y0,
  });
  // bandeau clair sous le toit, façon entrepôt
  box(g, fp[0], y0 + h - 0.6, fp[1], fp[2], y0 + h, fp[3], { c: shadeC(wallC, 1.08), m: MAT.PLAIN, top: false, seed });
  if (niveau >= 1) {
    // lanterneaux en shed sur le toit (rythme de type usine)
    const n = 2 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) {
      const lx = fp[0] + (fp[2] - fp[0]) * ((i + 0.5) / n);
      box(g, lx - 0.9, y0 + h, fp[1] + 1, lx + 0.9, y0 + h + 0.7, fp[3] - 1, {
        c: shadeC(wallC, 1.15),
        m: MAT.PLAIN,
        seed: seed + i,
      });
    }
    const cx = fp[0] + (fp[2] - fp[0]) * rr(r, 0.2, 0.35),
      cz = fp[1] + (fp[3] - fp[1]) * rr(r, 0.2, 0.35);
    cylinder(g, cx, y0 + h, cz, 0.55, rr(r, 4, 5.5), 10, INDUSTRIE_ACCENT, MAT.PLAIN, MAT.PLAIN, INDUSTRIE_ACCENT);
    // silo secondaire
    const sx = fp[0] + (fp[2] - fp[0]) * rr(r, 0.65, 0.8);
    cylinder(g, sx, y0, cz, 1.1, h * 0.85, 12, shadeC(wallC, 1.1), MAT.PLAIN, MAT.FLATROOF, COL.roofGray);
  }
  if (niveau >= 2) {
    // grand complexe : cheminée fumante + réservoirs de stockage + palettes + clôture
    const cheminee = shadeC(COL.concrete, 0.88);
    const chx = fp[0] + (fp[2] - fp[0]) * rr(r, 0.82, 0.92),
      chz = fp[1] + (fp[3] - fp[1]) * rr(r, 0.72, 0.85);
    const chH = h + rr(r, 4, 6);
    cylinder(g, chx, y0, chz, 0.7, chH, 10, cheminee, MAT.PLAIN, MAT.PLAIN, cheminee);
    fumee(g, chx, y0 + chH + 0.3, chz, r);
    for (let i = 0; i < 2; i++) {
      const tx = fp[0] + (fp[2] - fp[0]) * (0.08 + i * 0.12),
        tz = fp[3] + rr(r, 1.4, 2.2);
      if (tz < rect[3] - 1) {
        cylinder(g, tx, y0, tz, 0.9, rr(r, 3.2, 4.2), 10, shadeC(wallC, 1.05), MAT.PLAIN, MAT.PLAIN, shadeC(wallC, 1.05));
      }
    }
    const palette = hex("#7a5a3e");
    for (let i = 0; i < 3; i++) {
      const px = rr(r, fp[0] - 2.5, fp[0] - 0.5),
        pz = rr(r, fp[1] + 1, fp[3] - 1);
      if (px > rect[0] + 0.5) {
        box(g, px, y0, pz, px + rr(r, 0.9, 1.4), y0 + rr(r, 0.5, 1.1), pz + rr(r, 0.9, 1.3), {
          c: pick(r, [palette, shadeC(palette, 1.15)]),
          m: MAT.CONCRETE,
        });
      }
    }
    if (r() < 0.7) clotureBasse(g, rect[0] + 0.4, rect[1] + 0.4, rect[0] + 0.4, rect[3] - 0.4, seed);
  }
  if (niveau >= 1 && r() < 0.5) car(g, fp[0] - rr(r, 1.8, 2.6), (fp[1] + fp[3]) / 2, false, r, 0.15);
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h });
}

export function buildCommerce(
  g: Geo,
  rect: Rect,
  front: Facade,
  niveau: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
) {
  const wallC = pick(r, COMMERCE_WALLS);
  const enseigneC = pick(r, COMMERCE_ENSEIGNE);
  const width = rr(r, 8.2, 9.4) + niveau * rr(r, 0.5, 1.2),
    depth = rr(r, 7.4, 8.8) + niveau * rr(r, 0.3, 0.8);
  const fp = placeInLot(rect, front, width, depth, 3.2, rr(r, -1, 1));
  const y0 = 0.15,
    floors = niveau === 0 ? 1 : niveau === 1 ? 3 + Math.floor(r() * 2) : 4 + Math.floor(r() * 2),
    h = floors * (niveau === 0 ? 3.8 : 3.0);
  box(g, fp[0], y0, fp[1], fp[2], y0 + h, fp[3], {
    c: wallC,
    m: MAT.APART,
    front,
    frontM: niveau >= 1 ? MAT.GLASS : MAT.APART_FRONT,
    topM: MAT.FLATROOF,
    topC: COL.roofGray,
    seed,
    base: y0,
  });
  // bandeau enseigne coloré au rez-de-chaussée
  box(g, fp[0], y0 + 0.1, fp[1], fp[2], y0 + 0.85, fp[3], { c: enseigneC, m: MAT.PLAIN, top: false, seed });
  if (niveau === 0 && r() < 0.6) {
    // auvent devant la vitrine
    const [x0, z0, x1, z1] = rect;
    const dc = front === "-z" || front === "+z" ? (fp[0] + fp[2]) / 2 : (fp[1] + fp[3]) / 2;
    if (front === "-z") box(g, dc - width / 2, y0 + 0.9, z0 + 1.4, dc + width / 2, y0 + 1.1, fp[1], { c: enseigneC, m: MAT.PLAIN });
    if (front === "+z") box(g, dc - width / 2, y0 + 0.9, fp[3], dc + width / 2, y0 + 1.1, z1 - 1.4, { c: enseigneC, m: MAT.PLAIN });
    if (front === "-x") box(g, x0 + 1.4, y0 + 0.9, dc - width / 2, fp[0], y0 + 1.1, dc + width / 2, { c: enseigneC, m: MAT.PLAIN });
    if (front === "+x") box(g, fp[2], y0 + 0.9, dc - width / 2, x1 - 1.4, y0 + 1.1, dc + width / 2, { c: enseigneC, m: MAT.PLAIN });
  }
  if (niveau >= 1) {
    // second bandeau, près du toit — silhouette "grand magasin"
    box(g, fp[0], y0 + h - 0.55, fp[1], fp[2], y0 + h - 0.1, fp[3], {
      c: shadeC(enseigneC, 1.1),
      m: MAT.PLAIN,
      top: false,
      seed,
    });
  }
  if (niveau >= 2) {
    // centre commercial : parvis pavé + quelques voitures + climatiseurs en toiture
    const [x0, z0, x1, z1] = rect;
    const parvisZ = front === "-z" ? [z0, fp[1]] : front === "+z" ? [fp[3], z1] : null;
    if (parvisZ) flat(g, fp[0] - 1, parvisZ[0], fp[2] + 1, parvisZ[1], 0.17, COL.paving, MAT.PAVING);
    for (let i = 0; i < 2; i++) {
      const cxp = fp[0] + (fp[2] - fp[0]) * (0.25 + i * 0.4);
      if (front === "-z") car(g, cxp, z0 + rr(r, 1.4, 2.2), true, r, 0.17);
      if (front === "+z") car(g, cxp, z1 - rr(r, 1.4, 2.2), true, r, 0.17);
    }
    for (let i = 0; i < 2 + Math.floor(r() * 2); i++) {
      const ax = rr(r, fp[0] + 1, fp[2] - 2),
        az = rr(r, fp[1] + 1, fp[3] - 2);
      box(g, ax, y0 + h, az, ax + 1.1, y0 + h + 0.8, az + 0.8, { c: COL.metal, m: MAT.PLAIN });
    }
  }
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h });
}

export function buildServices(
  g: Geo,
  rect: Rect,
  front: Facade,
  niveau: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
) {
  const wallC = pick(r, SERVICES_WALLS);
  const width = rr(r, 8.6, 9.6) + niveau * rr(r, 0.5, 1.1),
    depth = rr(r, 7.6, 9) + niveau * rr(r, 0.4, 0.9);
  const fp = placeInLot(rect, front, width, depth, 3.0, rr(r, -1, 1));
  const y0 = 0.15,
    h = niveau === 0 ? rr(r, 3.8, 4.4) : niveau === 1 ? rr(r, 6.6, 7.6) : rr(r, 8.2, 9.4);
  box(g, fp[0], y0, fp[1], fp[2], y0 + h, fp[3], {
    c: wallC,
    m: MAT.PLAIN,
    topM: MAT.FLATROOF,
    topC: COL.roofGray,
    seed,
    base: y0,
  });
  // croix (école : discrète sur la façade ; hôpital : bien visible, plus
  // grande encore pour le grand complexe) — seulement sur les façades
  // nord/sud, où la profondeur de la parcelle laisse de la marge pour
  // la poser devant le mur sans le traverser.
  const cx = (fp[0] + fp[2]) / 2,
    cs = niveau === 0 ? 0.6 : niveau === 1 ? 1.3 : 1.7,
    cyBase = y0 + h * (niveau === 0 ? 0.5 : 0.58);
  if (front === "-z" || front === "+z") {
    const zz = front === "-z" ? fp[1] - 0.03 : fp[3] + 0.03;
    const zLo = Math.min(zz, zz + 0.06),
      zHi = Math.max(zz, zz + 0.06);
    box(g, cx - cs * 0.15, cyBase, zLo, cx + cs * 0.15, cyBase + cs, zHi, { c: SERVICES_CROIX, m: MAT.PLAIN });
    box(g, cx - cs * 0.5, cyBase + cs * 0.35, zLo, cx + cs * 0.5, cyBase + cs * 0.65, zHi, { c: SERVICES_CROIX, m: MAT.PLAIN });
  }
  if (niveau >= 2) {
    // aile secondaire (hôpital agrandi) + emplacement ambulance + repère héliporté sur le toit
    const wingW = width * 0.55,
      wingD = depth * 0.6,
      side = r() < 0.5 ? -1 : 1;
    const wx0 = side > 0 ? fp[2] : fp[0] - wingW,
      wx1 = side > 0 ? fp[2] + wingW : fp[0];
    box(g, wx0, y0, fp[1] + (depth - wingD) / 2, wx1, y0 + h * 0.6, fp[1] + (depth - wingD) / 2 + wingD, {
      c: shadeC(wallC, 0.97),
      m: MAT.PLAIN,
      topM: MAT.FLATROOF,
      topC: COL.roofGray,
      seed,
      base: y0,
    });
    flat(g, cx - 1.6, fp[3] + 0.3, cx + 1.6, fp[3] + 3.3, y0 + h + 0.02, COL.helipad, MAT.HELIPAD);
    box(g, cx - 0.5, y0 + h + 0.03, fp[3] + 1.4, cx + 0.5, y0 + h + 0.06, fp[3] + 1.9, { c: SERVICES_CROIX, m: MAT.PLAIN, top: false });
    if (r() < 0.6) car(g, fp[2] + 1.6, fp[1] + 1.5, false, r, 0.15);
  }
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h });
}

export function buildRecherche(
  g: Geo,
  rect: Rect,
  front: Facade,
  niveau: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
) {
  const wallC = pick(r, RECHERCHE_WALLS);
  const width = rr(r, 8.4, 9.4) + niveau * rr(r, 0.5, 1.1),
    depth = rr(r, 7.4, 8.8) + niveau * rr(r, 0.4, 0.9);
  const fp = placeInLot(rect, front, width, depth, 3.0, rr(r, -1, 1));
  const y0 = 0.15,
    h = niveau === 0 ? rr(r, 3.6, 4.2) : niveau === 1 ? rr(r, 6.0, 6.8) : rr(r, 7.2, 8.2);
  box(g, fp[0], y0, fp[1], fp[2], y0 + h, fp[3], {
    c: wallC,
    m: MAT.PLAIN,
    topM: MAT.FLATROOF,
    topC: COL.roofGray,
    seed,
    base: y0,
  });
  if (niveau >= 1) {
    // dôme d'observatoire, décalé sur un coin du toit
    const dx = fp[0] + (fp[2] - fp[0]) * rr(r, 0.65, 0.8),
      dz = fp[1] + (fp[3] - fp[1]) * rr(r, 0.2, 0.35);
    cylinder(g, dx, y0 + h, dz, 1.4, 0.3, 14, shadeC(RECHERCHE_DOME, 0.9), MAT.PLAIN, null, null);
    // demi-sphère approximée par un cône tronqué + capuchon
    cylinder(g, dx, y0 + h + 0.3, dz, 1.3, 1.1, 14, RECHERCHE_DOME, MAT.GLASS, MAT.GLASS, RECHERCHE_DOME, 0.15);
  }
  if (niveau >= 2) {
    // campus : second dôme plus petit, panneaux solaires en toiture, antenne
    const dx2 = fp[0] + (fp[2] - fp[0]) * rr(r, 0.18, 0.32),
      dz2 = fp[1] + (fp[3] - fp[1]) * rr(r, 0.65, 0.8);
    cylinder(g, dx2, y0 + h, dz2, 0.85, 0.7, 12, RECHERCHE_DOME, MAT.GLASS, MAT.GLASS, RECHERCHE_DOME, 0.1);
    const px = fp[0] + (fp[2] - fp[0]) * rr(r, 0.35, 0.55),
      pz = fp[1] + (fp[3] - fp[1]) * rr(r, 0.4, 0.55);
    box(g, px - 1.6, y0 + h, pz - 1.1, px + 1.6, y0 + h + 0.12, pz + 1.1, {
      c: shadeC(RECHERCHE_DOME, 0.55),
      m: MAT.PLAIN,
      seed,
    });
    const ax = fp[0] + (fp[2] - fp[0]) * 0.92;
    box(g, ax - 0.08, y0 + h, dz2, ax + 0.08, y0 + h + 2.4, dz2 + 0.16, { c: COL.metal, m: MAT.PLAIN });
  }
  ao.push({ x0: fp[0], z0: fp[1], x1: fp[2], z1: fp[3], w: 1, h });
}

/** Loisirs, second stade : un stade simplifié (gradins ovales + pelouse). */
export function buildStade(g: Geo, rect: Rect, r: RNG, ao: TamponAO[], seed: number) {
  const [x0, z0, x1, z1] = rect;
  const cx = (x0 + x1) / 2,
    cz = (z0 + z1) / 2;
  const rx = (x1 - x0) / 2 - 1.5,
    rz = (z1 - z0) / 2 - 1.5;
  flat(g, cx - rx * 0.6, cz - rz * 0.4, cx + rx * 0.6, cz + rz * 0.4, 0.17, COL.lawn, MAT.LAWN, seed);
  const segs = 16;
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2,
      a1 = ((i + 1) / segs) * Math.PI * 2;
    const ex0 = cx + Math.cos(a0) * rx,
      ez0 = cz + Math.sin(a0) * rz * 0.85;
    const ex1 = cx + Math.cos(a1) * rx,
      ez1 = cz + Math.sin(a1) * rz * 0.85;
    const ix0 = cx + Math.cos(a0) * rx * 0.78,
      iz0 = cz + Math.sin(a0) * rz * 0.68;
    const ix1 = cx + Math.cos(a1) * rx * 0.78,
      iz1 = cz + Math.sin(a1) * rz * 0.68;
    box(g, Math.min(ex0, ix0, ex1, ix1) - 0.02, 0.15, Math.min(ez0, iz0, ez1, iz1) - 0.02, Math.max(ex0, ix0, ex1, ix1) + 0.02, 2.4, Math.max(ez0, iz0, ez1, iz1) + 0.02, {
      c: shadeC(COL.concrete, 0.95 + 0.05 * ((i % 2) as number)),
      m: MAT.CONCRETE,
      seed: seed + i,
    });
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + rr(r, -0.1, 0.1);
    const px = cx + Math.cos(a) * rx * 1.05,
      pz = cz + Math.sin(a) * rz * 0.95;
    box(g, px - 0.25, 2.4, pz - 0.25, px + 0.25, 8.5, pz + 0.25, { c: COL.metal, m: MAT.PLAIN });
  }
  ao.push({ x0: cx - rx, z0: cz - rz, x1: cx + rx, z1: cz + rz, w: 1, h: 2.4 });
}

export type VocationQuartier = "residentiel" | "industrie" | "commerce" | "loisirs" | "services" | "recherche";
