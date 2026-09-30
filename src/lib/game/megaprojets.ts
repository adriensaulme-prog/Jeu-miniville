/**
 * Mégaprojets du maire (docs/SYSTEME-DEVELOPPEMENT.md §6, Jalon 20 1/3).
 * Catalogue et formules — source de vérité pour l'affichage ; le calcul
 * réel (financement, construction) vit côté serveur
 * (supabase/migrations/0028_..., anti-triche) — à tenir synchronisé si
 * ces chiffres changent.
 */
import type { Activite } from "./activites";

export type TypeMegaprojet =
  | "grande_ecole"
  | "parc_sports"
  | "marche_couvert"
  | "hopital"
  | "stade"
  | "centrale_solaire"
  | "zone_logistique"
  | "technopole"
  | "gare_tgv"
  | "parc_eolien"
  | "opera"
  | "tour_emblematique"
  | "aeroport"
  | "centre_recherche"
  | "centrale"
  | "grand_stade"
  | "centrale_nouvelle_generation"
  | "siege_international";

export interface OptionMegaprojet {
  type: TypeMegaprojet;
  activite: Activite;
}

/** Palier 0 = Bourg (5 000 hab.) ... palier 4 = Mégapole (250 000) ; au-delà, mêmes options (palier 4 réutilisé). */
export const CATALOGUE_MEGAPROJETS: Record<number, OptionMegaprojet[]> = {
  0: [
    { type: "grande_ecole", activite: "services" },
    { type: "parc_sports", activite: "loisirs" },
    { type: "marche_couvert", activite: "commerce" },
  ],
  1: [
    { type: "hopital", activite: "services" },
    { type: "stade", activite: "loisirs" },
    { type: "centrale_solaire", activite: "energie" },
    { type: "zone_logistique", activite: "industrie" },
  ],
  2: [
    { type: "technopole", activite: "recherche" },
    { type: "gare_tgv", activite: "commerce" },
    { type: "parc_eolien", activite: "energie" },
    { type: "opera", activite: "loisirs" },
  ],
  3: [
    { type: "tour_emblematique", activite: "residentiel" },
    { type: "aeroport", activite: "commerce" },
    { type: "centre_recherche", activite: "recherche" },
    { type: "centrale", activite: "energie" },
  ],
  4: [
    { type: "grand_stade", activite: "loisirs" },
    { type: "centrale_nouvelle_generation", activite: "energie" },
    { type: "siege_international", activite: "commerce" },
  ],
};

export function optionsPalier(palier: number): OptionMegaprojet[] {
  return CATALOGUE_MEGAPROJETS[Math.min(palier, 4)];
}

export function seuilMegaprojet(palier: number): number {
  if (palier <= 0) return 5000;
  if (palier === 1) return 15000;
  if (palier === 2) return 40000;
  if (palier === 3) return 100000;
  if (palier === 4) return 250000;
  return 250000 + 50000 * (palier - 4);
}

export function nbMegaprojetsOuverts(population: number): number {
  if (population < 5000) return 0;
  if (population < 15000) return 1;
  if (population < 40000) return 2;
  if (population < 100000) return 3;
  if (population < 250000) return 4;
  return 5 + Math.floor((population - 250000) / 50000);
}

export interface CoutMegaprojet {
  materiaux: number;
  revenus: number;
  points: number;
}

export function coutMegaprojet(palier: number): CoutMegaprojet {
  const base =
    palier <= 0 ? 400 : palier === 1 ? 1200 : palier === 2 ? 3200 : palier === 3 ? 8000 : 12000 * 1.5 ** Math.max(palier - 4, 0);
  const basePoints =
    palier <= 0 ? 250 : palier === 1 ? 750 : palier === 2 ? 2000 : palier === 3 ? 5000 : 7500 * 1.5 ** Math.max(palier - 4, 0);
  return {
    materiaux: Math.round(base),
    revenus: Math.round(base),
    points: Math.round(basePoints),
  };
}
