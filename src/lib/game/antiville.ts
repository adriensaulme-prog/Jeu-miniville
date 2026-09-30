/**
 * Paliers AntiVille selon le nombre d'attaques reçues aujourd'hui par
 * une ville, tous attaquants confondus (Jalon 18,
 * docs/SYSTEME-DEVELOPPEMENT.md §6bis). Copie TypeScript de
 * palier_attaques() (supabase/migrations/0024_...), à tenir
 * synchronisée — source de vérité pour l'affichage seulement, jamais
 * pour calculer un effet réel (ça, c'est côté serveur).
 */
export type PalierAttaques = "calme" | "incidents" | "troubles" | "emeutes" | "crise" | "sinistree";

export const PALIERS_ATTAQUES: readonly PalierAttaques[] = [
  "calme",
  "incidents",
  "troubles",
  "emeutes",
  "crise",
  "sinistree",
];

export function palierAttaques(nb: number): PalierAttaques {
  if (nb >= 1000) return "sinistree";
  if (nb >= 500) return "crise";
  if (nb >= 100) return "emeutes";
  if (nb >= 10) return "troubles";
  if (nb >= 1) return "incidents";
  return "calme";
}
