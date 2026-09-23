/**
 * Types de données principales, calqués sur le cahier des charges §28.
 * Évolueront jalon après jalon — à garder synchronisé avec les
 * migrations dans supabase/migrations/.
 */

export interface User {
  id: string;
  pseudo: string;
  countryId: string;
  cityId: string;
  createdAt: string;
}

export interface City {
  id: string;
  nom: string;
  ownerId: string;
  countryId: string;
  population: number;
  influence: number;
  activite: number;
  niveau: number; // Hameau=0 → Métropole=5, seuils à équilibrer (voir DECISIONS.md §10)
}

export interface Country {
  id: string;
  nom: string;
  population: number;
  influence: number;
  activite: number;
  ressources: Record<string, number>;
  technologies: string[];
  avantages: string[];
  presidentId: string | null;
}

export interface Twinning {
  cityId: string;
  targetCityId: string;
  statutAcceptation: "en_attente" | "accepte" | "refuse";
  dates: { proposeLe: string; accepteLe?: string };
}
