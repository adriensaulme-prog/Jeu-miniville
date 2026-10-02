/**
 * Emplacements, dans la campagne autour de la ville, de ce qui n'est pas
 * dans un bloc : installations d'Énergie, mégaprojets, monuments
 * d'influence (docs/A-INTEGRER.md §25, point 5 + « voir où il est »).
 *
 * Avant le §25 chaque objet était posé à un ANGLE ALÉATOIRE sur 360° :
 * impossible de savoir où regarder. Désormais chaque famille a son
 * SECTEUR fixe, identique pour toutes les villes :
 *   - Énergie       : axe +x
 *   - Mégaprojets   : axe +z
 *   - Monuments     : axe −x
 *   (l'axe −z reste libre pour une famille future ; pas de boussole
 *   affichée, la caméra tourne : le joueur passe par « voir où il est »)
 * et se place à partir d'une CEINTURE fixe, jamais relative au rayon
 * courant de la ville (qui grandit) : un objet déjà visible ne bouge plus
 * jamais, et la ville ne peut plus l'avaler — la ceinture est au-delà du
 * rayon de la ville au plafond de rendu (PLAFOND_RENDU_POPULATION, rayon
 * 400), vérifié par tests/unit/ville3dEmplacements.test.ts.
 *
 * Fonctions pures : la scène 3D (terrain.ts) ET le panneau « voir où il
 * est » (client, caméra) lisent exactement la même position.
 */

import { rngFrom, rr } from "./aleatoire";

/** Nom de ville → clé de graine (même normalisation que generate()). */
export const cleDe = (name: string) => (name || "").trim().toLowerCase() || "ville";

/** Distance (norme du max, comme le rayon de ville) à partir de laquelle on pose quoi que ce soit. */
export const CEINTURE = 450;

/** Le brouillard de distance ne démarre jamais avant ce rayon (shaders.ts, uFogR) : sinon la ceinture serait déjà dans la brume. */
export const RAYON_BROUILLARD_MIN = 440;

const DEG = Math.PI / 180;

/** Demi-ouverture d'un secteur (degrés) : 30° de part et d'autre de l'axe = 60° de large. */
const DEMI_SECTEUR = 30;

export const AXE_ENERGIE = 0;
export const AXE_MEGAPROJETS = 90;
export const AXE_MONUMENTS = 180;

export interface Point {
  x: number;
  z: number;
}

/**
 * Point du secteur d'axe `axeDeg`, à l'angle `fraction` (−1..+1 de part
 * et d'autre de l'axe) et à la distance `d` en norme du max (|x| ou |z|
 * maximal) : en divisant par max(|cos|,|sin|) le point est exactement sur
 * le carré de rayon `d`, comme la ville.
 */
function dansSecteur(axeDeg: number, fraction: number, d: number): Point {
  const a = (axeDeg + fraction * DEMI_SECTEUR) * DEG;
  const c = Math.cos(a),
    s = Math.sin(a);
  const k = d / Math.max(Math.abs(c), Math.abs(s));
  return { x: c * k, z: s * k };
}

/** Installation d'Énergie n° k (0-based) : éolienne ou panneau solaire, au hasard stable dans son secteur. */
export function emplacementEnergie(key: string, k: number): Point {
  const r = rngFrom(key + "|energie|" + k);
  return dansSecteur(AXE_ENERGIE, r() * 2 - 1, CEINTURE + rr(r, 0, 250));
}

/** Centrale d'Énergie : même secteur, au plus près de la ville. */
export function emplacementCentrale(key: string): Point {
  const r = rngFrom(key + "|energie|centrale");
  return dansSecteur(AXE_ENERGIE, r() * 2 - 1, CEINTURE + rr(r, 0, 60));
}

/**
 * Mégaprojet du palier `palier` : grille de 3 colonnes d'angle × N rangées
 * qui s'éloignent (une rangée tous les 60 m) — deux paliers ne partagent
 * jamais la même case, donc jamais deux mégaprojets l'un sur l'autre. Au-delà
 * de 39 paliers (> 1,9 million d'habitants, hors du plafond de rendu) la
 * grille se rebouclera sur elle-même.
 */
export function emplacementMegaprojet(key: string, palier: number): Point {
  const case_ = palier % 39;
  const col = case_ % 3,
    rangee = Math.floor(case_ / 3);
  const r = rngFrom(key + "|megaprojet|" + palier);
  const fraction = (col - 1) * 0.62 + rr(r, -0.08, 0.08);
  return dansSecteur(AXE_MEGAPROJETS, fraction, CEINTURE + rangee * 60 + rr(r, 0, 12));
}

/**
 * Monument du palier `palier` (0..15) : grille de 4 colonnes × 4 rangées,
 * les paliers hauts plus loin (une rangée tous les 55 m). Case propre à
 * chaque palier : jamais deux monuments l'un sur l'autre.
 */
export function emplacementMonument(key: string, palier: number): Point {
  const case_ = palier % 16;
  const col = case_ % 4,
    rangee = Math.floor(case_ / 4);
  const r = rngFrom(key + "|monument|" + palier);
  const fraction = (col - 1.5) * 0.46 + rr(r, -0.05, 0.05);
  return dansSecteur(AXE_MONUMENTS, fraction, CEINTURE + rangee * 55 + rr(r, 0, 8));
}
