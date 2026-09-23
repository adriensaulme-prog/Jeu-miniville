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
  id: string; // code ISO 3166-1 alpha-2, ex. "FR"
  // nom : étendu en nomFr/nomEn dès le Jalon 1 pour respecter la règle
  // i18n de GUIDE-METHODE.md §9 (toute chaîne affichée a ses deux
  // traductions dès sa création) — voir docs/DECISIONS.md §4, Jalon 1.
  nomFr: string;
  nomEn: string;
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
