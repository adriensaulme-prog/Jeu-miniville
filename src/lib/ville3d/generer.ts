/**
 * Orchestration : construit la géométrie complète d'une ville pour une
 * graine (identité stable — l'id de la ville) et une population (le
 * record `population_max`, jamais la population instantanée — voir
 * docs/DECISIONS.md §4, Jalon 6). Porté depuis
 * docs/prototypes/prototype-ville-3d.html (generate()), y compris la
 * croissance sans limite du Jalon 7bis : au-delà des 16 premiers blocs,
 * un bloc de plus tous les 5 000 habitants, du centre vers l'extérieur.
 */

import { rngFrom } from "./aleatoire";
import { BS, CITY_R_MIN, COL, MAT, T, blockX0, openAtK, towerAtK } from "./constantes";
import { flat, Geo } from "./geometrie";
import type { TamponAO } from "./mobilier";
import {
  buildBlock,
  buildCountryRoads,
  buildCountryside,
  buildIdleBlock,
  buildRoadsAndTraffic,
  type Bloc,
  type Stats,
} from "./terrain";

export interface ResultatGeneration {
  g: Geo;
  ao: TamponAO[];
  glow: { x: number; z: number }[];
  stats: Stats & { cityR: number };
}

const cleDe = (name: string) => (name || "").trim().toLowerCase() || "ville";

/**
 * Ordre d'ouverture des blocs d'une ville et seuils de chacun, à une
 * population donnée. Pur : c'est lui qui garantit qu'une ville qui grandit
 * ne déplace jamais un bloc déjà ouvert (tests/unit/ville3dCroissance.test.ts).
 */
export function planifierBlocs(name: string, C: number): { blocks: Bloc[]; K: number } {
  const key = cleDe(name);
  // Nombre de blocs ouverts à ce stade, puis candidats en anneaux autour
  // du croisement central (blocs repérés par des entiers relatifs).
  let K = 0;
  while (openAtK(K) <= C) K++;
  const M = Math.ceil(Math.sqrt(K + 40) / 2) + 3;
  const blocks: Bloc[] = [];
  for (let bi = -M; bi < M; bi++)
    for (let bj = -M; bj < M; bj++) {
      // Aléa d'ordre propre à chaque bloc (pas un générateur séquentiel) :
      // ajouter des candidats ne réordonne jamais les blocs déjà ouverts.
      const jit = (rngFrom(key + "|ordre|" + bi + "," + bj)() - 0.5) * 0.7;
      blocks.push({
        bi,
        bj,
        d: Math.hypot(bi + 0.5, bj + 0.5) + jit,
        openAt: 0,
        gap: 0,
        towerAt: 0,
        active: false,
      });
    }
  blocks.sort((a, b) => a.d - b.d || a.bi - b.bi || a.bj - b.bj);
  blocks.length = Math.min(blocks.length, K + 24);
  blocks.forEach((b, k) => {
    b.openAt = openAtK(k);
    b.gap = openAtK(k + 1) - b.openAt;
    b.towerAt = towerAtK(k);
    b.active = C >= b.openAt;
  });
  return { blocks, K };
}

export function generate(name: string, C: number): ResultatGeneration {
  const key = cleDe(name);
  const g = new Geo();
  const ao: TamponAO[] = [],
    glow: { x: number; z: number }[] = [],
    ev: number[] = [];
  const stats: Stats = { maxFloors: 0, towers: 0, active: 0 };
  flat(g, -4000, -4000, 4000, 4000, 0, COL.meadow, MAT.MEADOW);

  const { blocks, K } = planifierBlocs(name, C);
  blocks.forEach((b, k) => {
    if (k <= K) ev.push(b.openAt);
  });

  const act = blocks.filter((b) => b.active);
  stats.active = act.length;
  const bc = (i: number) => blockX0(i) + BS / 2;
  const cx = act.reduce((a, b) => a + bc(b.bi), 0) / act.length,
    cz = act.reduce((a, b) => a + bc(b.bj), 0) / act.length;
  let E = 0,
    R = 0;
  for (const b of act) {
    E = Math.max(E, Math.abs(bc(b.bi) - cx) + BS / 2 + 10, Math.abs(bc(b.bj) - cz) + BS / 2 + 10);
    R = Math.max(R, Math.abs(blockX0(b.bi)), Math.abs(blockX0(b.bi) + BS), Math.abs(blockX0(b.bj)), Math.abs(blockX0(b.bj) + BS));
  }
  const cityR = Math.max(CITY_R_MIN, R + 8);
  stats.center = [cx, cz];
  stats.extent = E;
  stats.cityR = cityR;

  const horsVille = (b: Bloc) =>
    Math.max(Math.abs(blockX0(b.bi)), Math.abs(blockX0(b.bi) + BS), Math.abs(blockX0(b.bj)), Math.abs(blockX0(b.bj) + BS)) >= cityR;

  buildRoadsAndTraffic(g, act, key, Math.ceil(cityR / T));
  for (const b of blocks) {
    if (b.active) buildBlock(g, b, C, key, ao, stats, glow, ev);
    else if (!horsVille(b)) buildIdleBlock(g, b, key, ao);
  }
  buildCountryside(g, key, ao, cityR);
  buildCountryRoads(g, key, ao, cityR);
  stats.next = ev.filter((t) => t > C).reduce((m, t) => Math.min(m, t), Infinity);
  return { g, ao, glow, stats: { ...stats, cityR } };
}
