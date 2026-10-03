/**
 * Place des monuments d'influence DANS la ville (docs/A-INTEGRER.md §33,
 * demande d'Adrien du 02/10/2026) : « les monuments ne sont pas placés dans
 * la ville mais en extérieur ». Ils retrouvent leur intention d'origine
 * (§19 : près du centre, zone symbolique), abandonnée au sous-jalon 25a
 * qui les avait mis dans une ceinture à 450 m.
 *
 * Règle : le monument du palier p occupe la COUR COMMUNE de la case numéro
 * ⌊p / 2⌋ dans l'ordre de distance au centre (cases.ts), deux monuments par
 * cour, l'un au bout de chaque moitié de la cour. 16 paliers => les 8 cases
 * les plus centrales. Ces cases ne dépendent que de la graine de la ville :
 * un monument ne se déplace jamais, que la ville grandisse ou que le bloc
 * ne soit pas encore ouvert (la case est alors une friche au cœur de la
 * ville, et le monument y attend son bloc). Fonction pure, lue à la fois par
 * le rendu 3D et par le bouton « Voir où il est ».
 */
import { casesCentrales } from "./cases";
import { rectCourBloc } from "./terrain";

export const MONUMENTS_PAR_COUR = 2;
const NB_CASES = 8; // 16 paliers / 2 par cour

export interface PlaceMonument {
  x: number;
  z: number;
  /** Case (bloc) dont la cour accueille ce monument. */
  bi: number;
  bj: number;
}

/**
 * Positions des monuments des `paliers` donnés. `Map` palier -> place. Les
 * rectangles de cour sont calculés une fois par case (voir rectCourBloc :
 * un calcul léger sur une géométrie jetable).
 */
export function placesMonuments(key: string, paliers: readonly number[]): Map<number, PlaceMonument> {
  const cases = casesCentrales(key, NB_CASES);
  const cours = new Map<number, [number, number, number, number] | null>();
  const places = new Map<number, PlaceMonument>();
  for (const palier of paliers) {
    const p = ((palier % 16) + 16) % 16;
    const indice = Math.floor(p / MONUMENTS_PAR_COUR) % NB_CASES;
    const c = cases[indice];
    if (!cours.has(indice)) cours.set(indice, rectCourBloc(key, c.bi, c.bj));
    const rect = cours.get(indice);
    if (!rect) {
      // Jamais en pratique (un bloc a toujours au moins deux parcelles intérieures) : centre du bloc.
      places.set(palier, { x: c.bi * 80 + 8 + 32, z: c.bj * 80 + 8 + 32, bi: c.bi, bj: c.bj });
      continue;
    }
    const [x0, z0, x1, z1] = rect;
    const cx = (x0 + x1) / 2,
      cz = (z0 + z1) / 2;
    const dx = x1 - x0,
      dz = z1 - z0;
    // Les deux monuments sont posés le long du grand côté de la cour, au quart de sa longueur.
    const signe = p % MONUMENTS_PAR_COUR === 0 ? -1 : 1;
    places.set(
      palier,
      dx >= dz
        ? { x: cx + signe * (dx / 4), z: cz, bi: c.bi, bj: c.bj }
        : { x: cx, z: cz + signe * (dz / 4), bi: c.bi, bj: c.bj }
    );
  }
  return places;
}
