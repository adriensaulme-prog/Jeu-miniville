/**
 * Thèmes visuels disponibles (bibliothèque de bâtiments 4/4,
 * docs/BATIMENTS-ET-PACKS.md §4). Copie TypeScript de la contrainte
 * `cities.theme` (supabase/migrations/0034_...), à tenir synchronisée.
 * "classique" est le pack de base gratuit ; les autres sont partiels
 * (voir src/lib/ville3d/catalogue.ts) — une famille sans modèle dédié
 * retombe sur "classique".
 */
export const THEMES = ["classique", "haussmannien"] as const;
export type Theme = (typeof THEMES)[number];
