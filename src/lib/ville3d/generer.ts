/**
 * Orchestration : construit la géométrie complète d'une ville pour une
 * graine (identité stable — l'id de la ville) et une population (le
 * record `population_max`, jamais la population instantanée — voir
 * docs/DECISIONS.md §4, Jalon 6). Porté depuis
 * docs/prototypes/prototype-ville-3d.html (generate()).
 */

import { rngFrom } from "./aleatoire";
import { BN, BS, COL, HALF, MAT, PERIOD, T } from "./constantes";
import { flat, Geo } from "./geometrie";
import type { TamponAO } from "./mobilier";
import {
  BLOCK_OPEN,
  TOWER_FROM,
  TOWER_STAGGER,
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
  stats: Stats;
}

export function generate(name: string, C: number): ResultatGeneration {
  const key = (name || "").trim().toLowerCase() || "ville";
  const g = new Geo();
  const ao: TamponAO[] = [],
    glow: { x: number; z: number }[] = [],
    ev: number[] = [];
  const stats: Stats = { maxFloors: 0, towers: 0, active: 0 };
  flat(g, -1800, -1800, 1800, 1800, 0, COL.meadow, MAT.MEADOW);

  const r0 = rngFrom(key + "|ordre");
  const blocks: Bloc[] = [];
  for (let bi = 0; bi < BN; bi++)
    for (let bj = 0; bj < BN; bj++)
      blocks.push({
        bi,
        bj,
        d: Math.hypot(bi - 1.5, bj - 1.5) + (r0() - 0.5) * 0.7,
        openAt: 0,
        gap: 0,
        towerAt: 0,
        active: false,
      });
  blocks.sort((a, b) => a.d - b.d);
  blocks.forEach((b, k) => {
    b.openAt = BLOCK_OPEN[k];
    b.gap = (k + 1 < BLOCK_OPEN.length ? BLOCK_OPEN[k + 1] : BLOCK_OPEN[k] + 5000) - BLOCK_OPEN[k];
    b.towerAt = TOWER_FROM + k * TOWER_STAGGER;
    b.active = C >= b.openAt;
    ev.push(b.openAt);
  });
  const activeSet = new Set(blocks.filter((b) => b.active).map((b) => b.bi + "," + b.bj));
  stats.active = activeSet.size;
  {
    const act = blocks.filter((b) => b.active);
    const bc = (i: number) => -HALF + T * (i * PERIOD + 1) + BS / 2;
    const cx = act.reduce((a, b) => a + bc(b.bi), 0) / act.length,
      cz = act.reduce((a, b) => a + bc(b.bj), 0) / act.length;
    let E = 0;
    for (const b of act) E = Math.max(E, Math.abs(bc(b.bi) - cx) + BS / 2 + 10, Math.abs(bc(b.bj) - cz) + BS / 2 + 10);
    stats.center = [cx, cz];
    stats.extent = E;
  }

  buildRoadsAndTraffic(g, activeSet, key);
  for (const b of blocks) {
    if (b.active) buildBlock(g, b, C, key, ao, stats, glow, ev);
    else buildIdleBlock(g, b, key, ao);
  }
  buildCountryside(g, key, ao);
  buildCountryRoads(g, key, ao);
  stats.next = ev.filter((t) => t > C).reduce((m, t) => Math.min(m, t), Infinity);
  return { g, ao, glow, stats };
}
