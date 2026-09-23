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
 * Seuils de population par niveau, provisoires ("seuils à équilibrer
 * pendant les tests" — cahier des charges §2, docs/DECISIONS.md §10
 * point 2). Source de vérité pour les tests unitaires ; à tenir
 * synchronisé avec la fonction SQL population_vers_niveau() dans
 * supabase/migrations/0003_jalon2_grandir_grace_aux_autres.sql, qui est
 * l'autorité réelle côté serveur (anti-triche — jamais recalculé côté
 * client pour une vraie ville).
 */
export const SEUILS_NIVEAU: readonly [niveau: number, populationMin: number][] = [
  [0, 0],
  [1, 5],
  [2, 15],
  [3, 30],
  [4, 60],
  [5, 120],
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
