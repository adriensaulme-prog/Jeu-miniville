/**
 * Paliers visibles de popularité/renommée d'une ville selon le nombre
 * de visites/actions d'influence reçues AUJOURD'HUI, tous visiteurs
 * confondus (Jalon 22, docs/DECISIONS.md §10 point 22 et §4 — grille
 * déjà appliquée à AntiVille au Jalon 18 et à la guerre au Jalon 21).
 *
 * Différence assumée : contrairement à AntiVille/guerre, visites et
 * influence sont des effets POSITIFS déjà plafonnés PAR JOUEUR (visites :
 * QUOTA_VISITE_QUOTIDIEN par jour et par ville ; 5 actions d'influence/jour)
 * — purement informatif ici, aucun plafond ajouté (choix d'Adrien,
 * 28/09/2026) : une ville très visitée continue de grandir sans limite.
 *
 * Seuils de visites : calibrés au Jalon 22 pour un plafond de 3 visites par
 * jour et par visiteur (5 / 15 / 50). Le plafond est passé à 8 (A-INTEGRER
 * §27 A) : un même nombre de visiteurs peut maintenant produire 8/3 fois plus
 * de visites, donc les seuils (sauf le premier) suivent le plafond, arrondis
 * — 13 / 40 / 133 à 8 par jour. Ils se recalculent d'eux-mêmes si le
 * plafond change encore. Le palier d'influence (5 actions/jour/joueur) n'a
 * pas bougé. Copie TypeScript de
 * visites_recues_aujourdhui()/actions_influence_recues_aujourdhui()
 * (supabase/migrations/0033_...), à tenir synchronisée — affichage
 * seulement, comme palierAttaques() (src/lib/game/antiville.ts).
 */
import { QUOTA_VISITE_QUOTIDIEN } from "@/lib/game/visites";

export type PalierPopularite = "calme" | "frequentee" | "tres_frequentee" | "en_vogue" | "virale";

export const PALIERS_POPULARITE: readonly PalierPopularite[] = [
  "calme",
  "frequentee",
  "tres_frequentee",
  "en_vogue",
  "virale",
];

/** Plafond de visites sur lequel les seuils d'origine (5 / 15 / 50) ont été calibrés (Jalon 22). */
const PLAFOND_VISITES_DE_REFERENCE = 3;

const miseALEchelle = (seuilDeReference: number) =>
  Math.round((seuilDeReference * QUOTA_VISITE_QUOTIDIEN) / PLAFOND_VISITES_DE_REFERENCE);

/** Visites reçues aujourd'hui à partir desquelles chaque palier commence. */
export const SEUILS_POPULARITE = {
  frequentee: 1,
  tres_frequentee: miseALEchelle(5),
  en_vogue: miseALEchelle(15),
  virale: miseALEchelle(50),
} as const;

export function palierVisites(nb: number): PalierPopularite {
  if (nb >= SEUILS_POPULARITE.virale) return "virale";
  if (nb >= SEUILS_POPULARITE.en_vogue) return "en_vogue";
  if (nb >= SEUILS_POPULARITE.tres_frequentee) return "tres_frequentee";
  if (nb >= SEUILS_POPULARITE.frequentee) return "frequentee";
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
