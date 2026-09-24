/**
 * Réglages du monde (1 unité = 1 mètre), portés depuis
 * docs/prototypes/prototype-ville-3d.html. Voir docs/DECISIONS.md §8 et
 * §4 (journal du Jalon 6bis).
 */

export const T = 16; // taille d'une case de la grille de rues
export const PERIOD = 5; // 4 cases de bloc + 1 case de rue
// Demi-taille minimale du carré qui contient la ville (l'ancienne grille
// fixe de 4×4 blocs) : sert de plancher au rayon de ville, même pour un
// hameau, pour que la campagne et le brouillard ne collent pas au centre.
export const CITY_R_MIN = 168;
export const BS = 4 * T; // côté d'un bloc : 64 m
export const SW = 3; // largeur de trottoir
export const LOT = (BS - 2 * SW) / 4; // 14,5 m
export const PODIUM_H = 4.2;
export const FLOOR_H = 3.6;

// Croissance pilotée par population_max (jamais la population
// instantanée — voir DECISIONS.md §4, Jalon 6). Métropole à 100 000
// habitants (choix d'Adrien). Doit rester synchronisé avec
// SEUILS_NIVEAU (src/lib/game/niveauVille.ts) et population_vers_niveau()
// (supabase/migrations/0008_jalon6_donnees_rendu_3d.sql).
export const STAGE_AT = [0, 1000, 5000, 15000, 40000, 100000];
export const BLOCK_OPEN = [
  0, 300, 800, 1500, 2500, 3800, 5500, 7500, 10000, 13000, 16500, 20500, 25000, 30000, 35000,
  40000,
];
export const APART_FROM = 5000; // petits immeubles à partir du Bourg
export const APART_FLOOR_EVERY = 6000; // +1 étage d'immeuble tous les 6 000 habitants (2 à 7)
export const TOWER_FROM = 15000; // premier gratte-ciel à partir de Ville, bloc du centre
export const TOWER_STAGGER = 4500; // puis un nouveau chantier de tour tous les 4 500 habitants
export const PER_FLOOR = 500; // +1 étage de gratte-ciel tous les 500 habitants
// Au-delà des 16 premiers blocs, la ville ne s'arrête plus : un bloc de
// plus tous les 5 000 habitants (Jalon 7bis, docs/A-INTEGRER.md §2).
export const BLOC_SUPPLEMENTAIRE_TOUS = 5000;
// Un chantier de gratte-ciel ne démarre jamais moins de 12 000 habitants
// après l'ouverture de son bloc (les blocs lointains se construisent d'abord).
export const TOWER_AFTER_OPEN = 12000;

/** Seuil de population à partir duquel le k-ième bloc (0 = le plus central) s'ouvre. */
export const openAtK = (k: number): number =>
  k < BLOCK_OPEN.length
    ? BLOCK_OPEN[k]
    : BLOCK_OPEN[BLOCK_OPEN.length - 1] + (k - BLOCK_OPEN.length + 1) * BLOC_SUPPLEMENTAIRE_TOUS;

/** Seuil de population du chantier de gratte-ciel du k-ième bloc. */
export const towerAtK = (k: number): number => Math.max(TOWER_FROM + k * TOWER_STAGGER, openAtK(k) + TOWER_AFTER_OPEN);

/** x (ou z) du bord d'un bloc d'indice entier relatif au croisement central : rues sur x = 80·k. */
export const blockX0 = (b: number): number => 8 + (PERIOD * T) * b;

export const MAT = {
  MEADOW: 0,
  ROAD: 1,
  SIDEWALK: 2,
  GLASS: 3,
  APART: 4,
  HOUSE: 5,
  TILES: 6,
  FLATROOF: 7,
  CONCRETE: 8,
  FOLIAGE: 9,
  TRUNK: 10,
  PAINT: 11,
  DARKGLASS: 12,
  LATTICE: 13,
  HELIPAD: 14,
  PODIUM: 15,
  PLAIN: 16,
  WATER: 17,
  PAVING: 18,
  PARKING: 19,
  LAWN: 20,
  BEACON: 21,
  HOUSE_FRONT: 22,
  APART_FRONT: 23,
  DIRT: 24,
  FENCE: 25,
  LAMP: 26,
} as const;

export type Couleur = [number, number, number];

export const hex = (h: string): Couleur => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];

export const COL = {
  meadow: hex("#7fa45a"),
  lawn: hex("#6fa049"),
  road: hex("#4c4e54"),
  sidewalk: hex("#cdc8bc"),
  paving: hex("#d6cdbb"),
  dirt: hex("#8f7152"),
  water: hex("#3f7ea3"),
  stone: hex("#bdb6a8"),
  trunk: hex("#6b4a33"),
  roofGray: hex("#9a9c9e"),
  concrete: hex("#b9b6b0"),
  crane: hex("#e3b236"),
  counterweight: hex("#8b8e91"),
  metal: hex("#8d949b"),
  beacon: hex("#ff3b30"),
  helipad: hex("#5d6166"),
  fence: hex("#2f6e8e"),
  container: hex("#e8e6e1"),
};

export const HOUSE_WALLS = ["#efe4cf", "#f3efe7", "#eedcaa", "#e9bda5", "#dcd8d0", "#cdd8e0", "#e4c68f"].map(hex);
export const HOUSE_ROOFS = ["#b0523a", "#a2432f", "#4d5560", "#7b4b36", "#3f454d", "#b9643f"].map(hex);
export const APART_WALLS = [
  "#e4d6bc",
  "#bb6a4f",
  "#efe6d3",
  "#cfc6b8",
  "#c97d59",
  "#e9c7bf",
  "#c1d7d0",
  "#d9c29a",
].map(hex);
export const GLASS_TINTS = ["#5d90bb", "#4c9c99", "#c9656e", "#a1b4c6", "#3d5f8c", "#6fa38c", "#9577b5", "#7fa9cf"].map(
  hex
);
export const CAR_COLORS = ["#b8352f", "#ececec", "#b5bac0", "#25272b", "#2e5b9b", "#e1b33a", "#3e7a4e", "#7a2f3a"].map(
  hex
);
export const FOLIAGE = ["#4d8a38", "#5d9a3f", "#3d7434", "#6ea64a", "#557f36"].map(hex);
export const CONIFER = ["#2e5c34", "#35683a", "#284f2f"].map(hex);
