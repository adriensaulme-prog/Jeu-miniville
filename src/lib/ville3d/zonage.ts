/**
 * Zonage des quartiers (docs/A-INTEGRER.md §25, sous-jalon 25b, choix
 * d'Adrien : « quartiers par secteur »).
 *
 * Contrainte de départ : une ville grandit du centre vers l'extérieur et
 * un bloc ouvert ne bouge jamais. Un anneau parfait (tours, puis
 * commerces, puis maisons) est donc impossible : les maisons d'un anneau
 * extérieur devraient exister avant les commerces du milieu. À la place :
 *   - un CŒUR de COEUR_BLOCS blocs, toujours résidentiel (→ gratte-ciels
 *     quand la ville grandit) ;
 *   - un SECTEUR D'ANGLE de 36° propre à chaque activité (commerce,
 *     industrie, loisirs, recherche, services — l'ordre alphabétique de
 *     la migration 0026) dans la moitié nord, le RÉSIDENTIEL gardant tout
 *     le reste (moitié sud et cœur) : la ville se lit en quartiers.
 *
 * Rejeu : la vocation de chaque rang vient de la base (city_blocks,
 * assignée selon l'activité la plus en retard — règle inchangée) ; la
 * POSITION de chaque rang est recalculée ici, à l'identique à chaque
 * affichage, rang après rang. Le choix du rang r ne dépend que des rangs
 * déjà placés (< r) et d'un domaine de candidats de taille fixe
 * (r + FENETRE) : une ville qui grandit ne déplace jamais un bloc ouvert.
 * Les blocs nés avant le zonage (city_blocks.zonee = false) gardent leur
 * emplacement historique (rang = case dans l'ordre de distance).
 */

import type { VocationQuartier } from "./quartiers";

/** Nombre de cases les plus centrales réservées au résidentiel. */
export const COEUR_BLOCS = 5;

/** Taille de la fenêtre de candidats : le bloc de rang r choisit parmi les r + FENETRE cases les plus proches. */
export const FENETRE_CANDIDATS = 24;

/** Largeur d'angle (degrés) du secteur de chaque activité. */
export const LARGEUR_SECTEUR = 36;

/** Activités de quartier, dans l'ordre fixe qui donne leur secteur (voir la migration 0026). */
export const ACTIVITES_QUARTIER: readonly VocationQuartier[] = ["commerce", "industrie", "loisirs", "recherche", "services"];

/**
 * Au-delà de cette case (dans l'ordre de distance), un bloc zoné n'a
 * jamais de gratte-ciel : les maisons restent durablement en périphérie
 * (§25 : « un bloc en périphérie finira lui aussi par recevoir une tour
 * si la ville grandit assez, ce qui contredit l'idée de garder les
 * maisons en périphérie »). Les blocs historiques ne sont pas touchés.
 */
export const TOURS_CASE_MAX = 24;

export interface CaseCandidate {
  bi: number;
  bj: number;
}

/** Angle (0..360°) de la case vue du croisement central. */
export function angleCase(c: CaseCandidate): number {
  const a = (Math.atan2(c.bj + 0.5, c.bi + 0.5) * 180) / Math.PI;
  return (a + 360) % 360;
}

/** Secteur d'angle [min, max[ d'une activité, ou null pour le résidentiel / une vocation inconnue. */
export function secteurActivite(v: VocationQuartier): [number, number] | null {
  const i = ACTIVITES_QUARTIER.indexOf(v);
  return i < 0 ? null : [i * LARGEUR_SECTEUR, (i + 1) * LARGEUR_SECTEUR];
}

/**
 * Case choisie pour un bloc de vocation `voc` : `cases` est la liste
 * ordonnée par distance (0 = la plus centrale), `libre[i]` dit si la case
 * est disponible. Ne regarde que les `rang + FENETRE_CANDIDATS` premières.
 *   - résidentiel : une case libre du cœur, sinon la plus proche dans la
 *     moitié résidentielle (angle ≥ 180°), sinon la plus proche ;
 *   - activité : la case libre la plus proche (hors cœur) dans son
 *     secteur, sinon la plus proche hors cœur, sinon la plus proche.
 */
export function choisirCase(cases: readonly CaseCandidate[], libre: readonly boolean[], rang: number, voc: VocationQuartier): number {
  const n = Math.min(cases.length, rang + FENETRE_CANDIDATS);
  const premiere = (ok: (i: number) => boolean) => {
    for (let i = 0; i < n; i++) if (libre[i] && ok(i)) return i;
    return -1;
  };
  let s: number;
  const secteur = secteurActivite(voc);
  if (!secteur) {
    s = premiere((i) => i < COEUR_BLOCS);
    if (s < 0) s = premiere((i) => angleCase(cases[i]) >= 180);
  } else {
    s = premiere((i) => i >= COEUR_BLOCS && angleCase(cases[i]) >= secteur[0] && angleCase(cases[i]) < secteur[1]);
    if (s < 0) s = premiere((i) => i >= COEUR_BLOCS);
  }
  if (s < 0) s = premiere(() => true);
  return s;
}
