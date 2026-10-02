/**
 * Tris de la liste /villes (docs/A-INTEGRER.md §26 E, « découverte des
 * petites villes neuves »). Le tri par défaut reste la population
 * décroissante (choix d'Adrien depuis le Jalon 2) ; deux tris
 * alternatifs remettent en avant les villes qui ont besoin de visites :
 *   - « recentes » : les plus récemment créées d'abord ;
 *   - « a_visiter » : les moins visitées ces 7 derniers jours d'abord
 *     (puis les plus récentes), hors sa propre ville.
 * Pur, sans accès base : la page lui fournit les données.
 */
export type TriVilles = "population" | "recentes" | "a_visiter";

export const TRIS_VILLES: readonly TriVilles[] = ["population", "recentes", "a_visiter"];

export function triValide(valeur: string | undefined | null): TriVilles {
  return TRIS_VILLES.includes(valeur as TriVilles) ? (valeur as TriVilles) : "population";
}

export interface VilleTriable {
  id: string;
  population: number;
  created_at: string;
}

/** Nouvelle liste triée (la liste d'entrée n'est pas modifiée). */
export function trierVilles<T extends VilleTriable>(
  villes: readonly T[],
  tri: TriVilles,
  visitesRecues7j: ReadonlyMap<string, number>,
  maVilleId: string
): T[] {
  const parRecence = (a: T, b: T) => b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id);
  const copie = [...villes];
  if (tri === "recentes") return copie.sort(parRecence);
  if (tri === "a_visiter") {
    return copie
      .filter((v) => v.id !== maVilleId)
      .sort(
        (a, b) =>
          (visitesRecues7j.get(a.id) ?? 0) - (visitesRecues7j.get(b.id) ?? 0) || parRecence(a, b)
      );
  }
  return copie.sort((a, b) => b.population - a.population || a.id.localeCompare(b.id));
}
