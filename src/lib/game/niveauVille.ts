import { dictionaries, type Locale } from "@/lib/i18n/dictionaries";

/**
 * Niveau visuel d'une ville : 0=Hameau … 5=Métropole (cahier des
 * charges §2).
 */
export const NIVEAU_MIN = 0;
export const NIVEAU_MAX = 5;

export function libelleNiveau(niveau: number, locale: Locale): string {
  if (!Number.isInteger(niveau) || niveau < NIVEAU_MIN || niveau > NIVEAU_MAX) {
    throw new RangeError(
      `niveau de ville invalide : ${niveau} (attendu un entier entre ${NIVEAU_MIN} et ${NIVEAU_MAX})`
    );
  }
  const cle = `niveau.${niveau}` as keyof (typeof dictionaries)[Locale];
  return dictionaries[locale][cle];
}

/**
 * Seuils de population par niveau — Métropole = 100 000 habitants,
 * décision d'Adrien (docs/DECISIONS.md §8 et §10 point 10). Calculés
 * sur `population_max` (le record jamais atteint), pas la population
 * du moment : une contamination ne fait jamais régresser le niveau
 * visuel d'une ville (cahier des charges §1 point 4, pas de destruction
 * permanente). Source de vérité pour les tests unitaires ; à tenir
 * synchronisé avec la fonction SQL population_vers_niveau() dans
 * supabase/migrations/0008_jalon6_donnees_rendu_3d.sql, qui est
 * l'autorité réelle côté serveur (anti-triche — jamais recalculé côté
 * client pour une vraie ville).
 */
export const SEUILS_NIVEAU: readonly [niveau: number, populationMin: number][] = [
  [0, 0],
  [1, 1000],
  [2, 5000],
  [3, 15000],
  [4, 40000],
  [5, 100000],
];

export function niveauPourPopulation(population: number): number {
  if (!Number.isInteger(population) || population < 0) {
    throw new RangeError(
      `population invalide : ${population} (attendu un entier positif ou nul)`
    );
  }
  let niveau = NIVEAU_MIN;
  for (const [n, seuil] of SEUILS_NIVEAU) {
    if (population >= seuil) {
      niveau = n;
    }
  }
  return niveau;
}

export interface ProgressionNiveau {
  niveau: number;
  /** 0 à 100 — position entre le seuil du niveau actuel et celui du suivant. */
  pourcentage: number;
  /** Seuil du niveau suivant, ou null si déjà au niveau maximal. */
  seuilSuivant: number | null;
}

/** Progression visuelle d'une ville vers son prochain niveau (barre de la page Ma ville / Villes). */
export function progressionNiveau(population: number): ProgressionNiveau {
  const niveau = niveauPourPopulation(population);
  const seuilActuel = SEUILS_NIVEAU[niveau][1];
  const seuilSuivantEntree = SEUILS_NIVEAU[niveau + 1];
  if (!seuilSuivantEntree) {
    return { niveau, pourcentage: 100, seuilSuivant: null };
  }
  const seuilSuivant = seuilSuivantEntree[1];
  const pourcentage = Math.max(
    2,
    Math.min(100, ((population - seuilActuel) / (seuilSuivant - seuilActuel)) * 100)
  );
  return { niveau, pourcentage, seuilSuivant };
}
