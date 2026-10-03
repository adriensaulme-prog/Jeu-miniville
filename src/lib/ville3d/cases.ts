/**
 * Cases candidates d'une ville, dans l'ordre de distance au croisement
 * central (0 = la plus centrale). Extrait de planifierBlocs() pour que
 * d'autres calculs — la place des monuments dans les cours des premiers
 * blocs (A-INTEGRER §33) — lisent exactement le même ordre que le rendu.
 * Pur : ne dépend que de la graine de la ville, jamais de sa population.
 */
import { rngFrom } from "./aleatoire";

export interface CaseOrdonnee {
  bi: number;
  bj: number;
  d: number;
}

/**
 * Toutes les cases d'une grille [-M, M[², triées par distance au centre
 * + aléa stable propre à chaque case (pas un générateur séquentiel :
 * agrandir la grille ne réordonne jamais les cases déjà classées).
 */
export function casesTriees(key: string, M: number): CaseOrdonnee[] {
  const cases: CaseOrdonnee[] = [];
  for (let bi = -M; bi < M; bi++)
    for (let bj = -M; bj < M; bj++) {
      const jit = (rngFrom(key + "|ordre|" + bi + "," + bj)() - 0.5) * 0.7;
      cases.push({ bi, bj, d: Math.hypot(bi + 0.5, bj + 0.5) + jit });
    }
  cases.sort((a, b) => a.d - b.d || a.bi - b.bi || a.bj - b.bj);
  return cases;
}

/** Les `n` cases les plus centrales (n petit : une grille de 6 suffit largement). */
export function casesCentrales(key: string, n: number): CaseOrdonnee[] {
  return casesTriees(key, 6).slice(0, n);
}
