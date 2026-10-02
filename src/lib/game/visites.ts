/**
 * Visites : plafond quotidien (docs/A-INTEGRER.md §27 A). Miroir de
 * public.plafond_visites_quotidien() (supabase/migrations/0039_...,
 * source de vérité : le serveur refuse au-delà, P0019) — tests/unit/
 * visites.test.ts vérifie que les deux valeurs restent identiques.
 */
export const QUOTA_VISITE_QUOTIDIEN = 8;

/**
 * « Visite fraîche » (docs/A-INTEGRER.md §27 B) : tant que la dernière
 * visite a moins de 2 minutes, les choix d'activité sont affichés d'emblée
 * sous le « +1 visite ». Au-delà (mais toujours dans la fenêtre de grâce
 * de 5 minutes de choisir_activite_visite()), ils restent accessibles
 * derrière le bouton « Changer ».
 */
export const DUREE_VISITE_FRAICHE_MS = 2 * 60 * 1000;
