/**
 * Paliers visibles de popularité/renommée d'une ville selon le nombre
 * de visites/actions d'influence reçues AUJOURD'HUI, tous visiteurs
 * confondus (Jalon 22, docs/DECISIONS.md §10 point 22 et §4 — grille
 * déjà appliquée à AntiVille au Jalon 18 et à la guerre au Jalon 21).
 *
 * Différence assumée : contrairement à AntiVille/guerre, visites et
 * influence sont des effets POSITIFS déjà plafonnés PAR JOUEUR (3
 * visites/jour, 5 actions d'influence/jour) — purement informatif ici,
 * aucun plafond ajouté (choix d'Adrien, 28/09/2026) : une ville très
 * visitée continue de grandir sans limite. Copie TypeScript de
 * visites_recues_aujourdhui()/actions_influence_recues_aujourdhui()
 * (supabase/migrations/0033_...), à tenir synchronisée — affichage
 * seulement, comme palierAttaques() (src/lib/game/antiville.ts).
 */
export type PalierPopularite = "calme" | "frequentee" | "tres_frequentee" | "en_vogue" | "virale";

export const PALIERS_POPULARITE: readonly PalierPopularite[] = [
  "calme",
  "frequentee",
  "tres_frequentee",
  "en_vogue",
  "virale",
];

export function palierVisites(nb: number): PalierPopularite {
  if (nb >= 50) return "virale";
  if (nb >= 15) return "en_vogue";
  if (nb >= 5) return "tres_frequentee";
  if (nb >= 1) return "frequentee";
  return "calme";
}

export type PalierRenommee = "calme" | "respectee" | "renommee" | "celebre" | "legendaire";

export const PALIERS_RENOMMEE: readonly PalierRenommee[] = [
  "calme",
  "respectee",
  "renommee",
  "celebre",
  "legendaire",
];

export function palierInfluence(nb: number): PalierRenommee {
  if (nb >= 50) return "legendaire";
  if (nb >= 15) return "celebre";
  if (nb >= 5) return "renommee";
  if (nb >= 1) return "respectee";
  return "calme";
}
