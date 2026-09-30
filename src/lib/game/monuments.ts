/**
 * Monuments d'influence (docs/A-INTEGRER.md §19, Jalon 20 3/3).
 * Catalogue fini de 16 paliers — source de vérité pour l'affichage ;
 * le calcul réel (déblocage) vit côté serveur
 * (supabase/migrations/0030_..., anti-triche) — à tenir synchronisé si
 * ces chiffres changent.
 */

export type TypeMonument =
  | "borne_commemorative"
  | "banc_public"
  | "fontaine_simple"
  | "buste"
  | "obelisque"
  | "arc_triomphe_miniature"
  | "horloge_municipale"
  | "fontaine_monumentale"
  | "statue_equestre"
  | "mur_remerciements"
  | "arche_monumentale"
  | "tour_observatoire"
  | "statue_emblematique"
  | "temple_national"
  | "statue_geante"
  | "monument_ultime";

export interface PalierMonument {
  seuil: number;
  type: TypeMonument;
}

/** Les 16 paliers du document (§19), dans l'ordre — catalogue fini, pas de "puis ×2" au-delà. */
export const CATALOGUE_MONUMENTS: PalierMonument[] = [
  { seuil: 10, type: "borne_commemorative" },
  { seuil: 25, type: "banc_public" },
  { seuil: 50, type: "fontaine_simple" },
  { seuil: 100, type: "buste" },
  { seuil: 250, type: "obelisque" },
  { seuil: 500, type: "arc_triomphe_miniature" },
  { seuil: 1000, type: "horloge_municipale" },
  { seuil: 2500, type: "fontaine_monumentale" },
  { seuil: 5000, type: "statue_equestre" },
  { seuil: 10000, type: "mur_remerciements" },
  { seuil: 25000, type: "arche_monumentale" },
  { seuil: 50000, type: "tour_observatoire" },
  { seuil: 100000, type: "statue_emblematique" },
  { seuil: 250000, type: "temple_national" },
  { seuil: 500000, type: "statue_geante" },
  { seuil: 1000000, type: "monument_ultime" },
];

export function seuilMonument(palier: number): number | null {
  return CATALOGUE_MONUMENTS[palier]?.seuil ?? null;
}

export function typeMonument(palier: number): TypeMonument | null {
  return CATALOGUE_MONUMENTS[palier]?.type ?? null;
}

/** Combien de paliers un record d'influence donné débloque (0 à 16). */
export function nbMonumentsDebloques(influenceMax: number): number {
  let n = 0;
  while (n < CATALOGUE_MONUMENTS.length && influenceMax >= CATALOGUE_MONUMENTS[n].seuil) n++;
  return n;
}
