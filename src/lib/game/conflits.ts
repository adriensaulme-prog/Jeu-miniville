/**
 * Paliers visibles d'un conflit pays selon le nombre de journées
 * gagnées par le camp en tête (0 à 7, un conflit dure 7 jours — Jalon
 * "Revoir les règles du jeu", docs/DECISIONS.md §10 point 22 et §4).
 * Copie TypeScript de la logique de resoudre_conflits_en_cours()
 * (supabase/migrations/0032_jalon_grille_guerre.sql), à tenir
 * synchronisée — affichage seulement, jamais pour calculer un effet
 * réel (ça, c'est côté serveur). Même principe que palierAttaques()
 * (src/lib/game/antiville.ts) pour AntiVille.
 */
export type PalierGuerre =
  | "calme"
  | "tensions"
  | "escarmouches"
  | "conflit_ouvert"
  | "guerre_totale"
  | "victoire_ecrasante";

export const PALIERS_GUERRE: readonly PalierGuerre[] = [
  "calme",
  "tensions",
  "escarmouches",
  "conflit_ouvert",
  "guerre_totale",
  "victoire_ecrasante",
];

export function palierGuerre(joursGagnesCampEnTete: number): PalierGuerre {
  if (joursGagnesCampEnTete >= 7) return "victoire_ecrasante";
  if (joursGagnesCampEnTete >= 5) return "guerre_totale";
  if (joursGagnesCampEnTete >= 3) return "conflit_ouvert";
  if (joursGagnesCampEnTete >= 2) return "escarmouches";
  if (joursGagnesCampEnTete >= 1) return "tensions";
  return "calme";
}
