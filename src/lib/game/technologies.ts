/**
 * Technologies de Recherche (docs/SYSTEME-DEVELOPPEMENT.md §6, Jalon 20
 * 2/3). Catalogue et formule de seuil — source de vérité pour
 * l'affichage ; le calcul réel (déblocage) vit côté serveur
 * (supabase/migrations/0029_..., anti-triche) — à tenir synchronisé si
 * ces chiffres changent.
 */

export type TypeTechnologie =
  | "eclairage_led"
  | "panneaux_solaires_toits"
  | "tramway"
  | "toits_vegetalises"
  | "drones";

/** Les 5 premiers paliers, dans l'ordre où le document les cite. Au-delà, pas encore d'effet visuel défini. */
export const CATALOGUE_TECHNOLOGIES: TypeTechnologie[] = [
  "eclairage_led",
  "panneaux_solaires_toits",
  "tramway",
  "toits_vegetalises",
  "drones",
];

export function typeTechnologie(palier: number): TypeTechnologie | null {
  return CATALOGUE_TECHNOLOGIES[palier] ?? null;
}

export function seuilTechnologie(palier: number): number {
  if (palier <= 0) return 100;
  if (palier === 1) return 300;
  if (palier === 2) return 800;
  if (palier === 3) return 2000;
  if (palier === 4) return 5000;
  return Math.round(5000 * 2 ** (palier - 4));
}

/** Un booléen par technologie nommée, dérivé du nombre de paliers déjà débloqués (cumulatif, jamais un palier sauté). */
export interface TechnologiesVille {
  eclairageLed: boolean;
  panneauxSolairesToits: boolean;
  tramway: boolean;
  toitsVegetalises: boolean;
  drones: boolean;
}

export function technologiesDepuisPalier(nbDebloquees: number): TechnologiesVille {
  return {
    eclairageLed: nbDebloquees > 0,
    panneauxSolairesToits: nbDebloquees > 1,
    tramway: nbDebloquees > 2,
    toitsVegetalises: nbDebloquees > 3,
    drones: nbDebloquees > 4,
  };
}
