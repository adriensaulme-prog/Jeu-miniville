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
  isTest: boolean; // Jalon 6 — jamais true en production, voir GUIDE-METHODE.md
}

export interface City {
  id: string;
  nom: string;
  ownerId: string;
  countryId: string;
  population: number;
  populationMax: number; // Jalon 6 — record jamais atteint ; base du niveau, jamais la population du moment
  influence: number;
  activite: number;
  niveau: number; // Hameau=0 → Métropole=5, seuils fixés au Jalon 6 (voir DECISIONS.md §8)
  isTest: boolean; // Jalon 6 — jamais true en production
}

export interface Country {
  id: string; // code ISO 3166-1 alpha-2, ex. "FR"
  // nom : étendu en nomFr/nomEn dès le Jalon 1 pour respecter la règle
  // i18n de GUIDE-METHODE.md §9 (toute chaîne affichée a ses deux
  // traductions dès sa création) — voir docs/DECISIONS.md §4, Jalon 1.
  nomFr: string;
  nomEn: string;
  // Jalon 6 — position du soleil à l'heure réelle du pays de la ville
  // (docs/DECISIONS.md §8). Nullable : pas encore renseigné pour tous
  // les territoires ISO 3166-1.
  latitude: number | null;
  longitude: number | null;
  fuseauHoraire: string | null; // identifiant IANA, ex. "Europe/Paris"
  population: number;
  influence: number;
  activite: number;
  ressources: Record<string, number>;
  technologies: string[];
  avantages: string[];
  presidentId: string | null;
}

export interface Twinning {
  villeProposanteId: string;
  villeCibleeId: string;
  statut: "en_attente" | "actif" | "refuse" | "annule";
  createdAt: string;
  accepteLe: string | null;
}
