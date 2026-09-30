/**
 * Mégaprojets construits (Jalon 20 1/3, docs/SYSTEME-DEVELOPPEMENT.md
 * §6) : "un bâtiment unique apparaît" — bâtiments volontairement
 * simples pour cette première passe (un socle, une silhouette parmi
 * trois archétypes selon le type, une couleur d'accent selon
 * l'activité du thème), pas encore le niveau de détail des
 * maisons/quartiers. Placés juste à l'extérieur de la ville par
 * buildMegaprojetsCampagne() (terrain.ts), à des emplacements fixes
 * par palier (un générateur par palier, comme les installations
 * d'Énergie) : un mégaprojet déjà construit ne se déplace jamais.
 */
import type { RNG } from "./aleatoire";
import { rr } from "./aleatoire";
import { COL, MAT, MEGAPROJET_ACCENT } from "./constantes";
import { box, cylinder, shadeC, type Geo } from "./geometrie";
import type { TamponAO } from "./mobilier";

/** Somme des codes de caractères, pour tirer une silhouette stable à partir du type (pas du hasard). */
function hashType(type: string): number {
  let h = 0;
  for (let i = 0; i < type.length; i++) h += type.charCodeAt(i);
  return h;
}

export function buildMegaprojet(
  g: Geo,
  cx: number,
  cz: number,
  type: string,
  activite: string,
  palier: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
) {
  const accent = MEGAPROJET_ACCENT[activite] ?? COL.stone;
  const rSocle = 2.4 + 0.4 * palier;
  const h = 4 + palier * 1.7;
  const y0 = 0.15;

  // Socle pavé, commun aux trois silhouettes.
  cylinder(g, cx, y0, cz, rSocle, 0.4, 16, COL.stone, MAT.PLAIN, MAT.PAVING, COL.paving);

  const silhouette = hashType(type) % 3;
  if (silhouette === 0) {
    // Tour : deux volumes empilés, le second plus étroit.
    const w1 = rSocle * 0.75,
      w2 = rSocle * 0.42;
    box(g, cx - w1, y0 + 0.4, cz - w1, cx + w1, y0 + 0.4 + h * 0.6, cz + w1, { c: shadeC(accent, 0.5), m: MAT.CONCRETE, seed });
    box(g, cx - w2, y0 + 0.4 + h * 0.6, cz - w2, cx + w2, y0 + 0.4 + h, cz + w2, { c: accent, m: MAT.PLAIN, seed });
  } else if (silhouette === 1) {
    // Dôme : cylindre + calotte.
    cylinder(g, cx, y0 + 0.4, cz, rSocle * 0.6, h * 0.65, 14, shadeC(accent, 0.55), MAT.CONCRETE, null, null);
    cylinder(g, cx, y0 + 0.4 + h * 0.65, cz, rSocle * 0.6, h * 0.3, 14, accent, MAT.PLAIN, MAT.PLAIN, accent, rSocle * 0.05);
  } else {
    // Arche : deux piliers reliés par un linteau.
    const half = rSocle * 0.65,
      pw = rSocle * 0.22;
    box(g, cx - half - pw, y0 + 0.4, cz - pw, cx - half + pw, y0 + 0.4 + h, cz + pw, { c: shadeC(accent, 0.55), m: MAT.CONCRETE, seed });
    box(g, cx + half - pw, y0 + 0.4, cz - pw, cx + half + pw, y0 + 0.4 + h, cz + pw, { c: shadeC(accent, 0.55), m: MAT.CONCRETE, seed });
    box(g, cx - half - pw, y0 + 0.4 + h - h * 0.22, cz - pw, cx + half + pw, y0 + 0.4 + h, cz + pw, { c: accent, m: MAT.PLAIN, seed });
  }

  // Petite fanion d'accent au sommet, pour repérer le thème de loin.
  box(g, cx - 0.08, y0 + 0.4 + h, cz - 0.08, cx + 0.08, y0 + 0.4 + h + 1.2, cz + 0.08, { c: COL.metal, m: MAT.PLAIN });
  box(g, cx + 0.08, y0 + 0.4 + h + 0.9, cz - 0.08, cx + 0.08 + rr(r, 0.6, 0.9), y0 + 0.4 + h + 1.15, cz + 0.08, {
    c: accent,
    m: MAT.PAINT,
  });

  ao.push({ x0: cx - rSocle, z0: cz - rSocle, x1: cx + rSocle, z1: cz + rSocle, w: 1, h });
}
