/**
 * Suivi de villes (docs/A-INTEGRER.md §26 D). Miroir du quota de
 * suivre_ville() (supabase/migrations/0041_..., source de vérité : le
 * serveur refuse au-delà, P0029) ; tests/unit/suivi.test.ts vérifie la
 * parité avec la migration.
 */
export const QUOTA_VILLES_SUIVIES = 50;
