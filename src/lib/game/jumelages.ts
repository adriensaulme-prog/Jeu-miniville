/**
 * Palier de solidité d'un jumelage selon le nombre cumulé de jours où
 * son bonus quotidien a été accordé (Jalon 22, docs/DECISIONS.md §10
 * point 22 et §4 — grille effet unitaire faible/cumul/plafond/paliers,
 * appliquée ici sans plafond : un jumelage a déjà un effet minuscule
 * et intrinsèquement borné à une fois par jour, voir
 * reclamer_bonus_jumelages(), Jalon 5). Copie TypeScript de
 * jours_bonus_jumelages_ville() (supabase/migrations/0033_...), à
 * tenir synchronisée — affichage seulement.
 */
export type PalierJumelage = "naissant" | "solide" | "indefectible" | "legendaire";

export const PALIERS_JUMELAGE: readonly PalierJumelage[] = [
  "naissant",
  "solide",
  "indefectible",
  "legendaire",
];

export function palierJumelage(joursBonus: number): PalierJumelage {
  if (joursBonus >= 90) return "legendaire";
  if (joursBonus >= 30) return "indefectible";
  if (joursBonus >= 7) return "solide";
  return "naissant";
}
