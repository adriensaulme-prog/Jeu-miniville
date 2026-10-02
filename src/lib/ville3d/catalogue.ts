/**
 * Bibliothèque de bâtiments : infrastructure du catalogue
 * (docs/BATIMENTS-ET-PACKS.md, jalon "La bibliothèque de bâtiments"
 * après le Jalon 22 — voir docs/DECISIONS.md §4 pour le journal complet
 * des choix de cette étape).
 *
 * Choix de stabilité (tranché avec Adrien avant de coder, AskUserQuestion
 * du 30/09/2026) : le jeu n'a pas encore de vrais joueurs en production,
 * et Adrien est explicitement d'accord pour qu'une ville change
 * d'apparence quand son propriétaire active un pack — donc pas de
 * nouvelle table qui mémoriserait "pour toujours" le modèle de chaque
 * parcelle (ça alourdirait chaque écriture en base pour une garantie
 * qu'on ne demande plus). À la place : un tirage par HACHAGE STABLE,
 * fonction pure de (graine de la ville, position de la parcelle,
 * identifiant du modèle) — insensible à l'ORDRE des modèles dans le
 * tableau (les identifiants sont triés avant le tirage), mais avec une
 * limite assumée : ajouter un nouveau modèle au catalogue peut, de
 * façon rare, faire basculer une parcelle déjà construite vers ce
 * nouveau modèle (si son tirage "gagne" contre l'ancien choix). Pas une
 * garantie à 100 %, documentée comme telle plutôt que fausse promesse.
 */
import { hashStr, type RNG } from "./aleatoire";
import type { Geo } from "./geometrie";
import type { TamponAO } from "./mobilier";

export type Facade = "-z" | "+z" | "-x" | "+x";
export type Rect = [number, number, number, number];

export interface FicheModele<TConstruire> {
  /** Identifiant stable, jamais réutilisé (docs/BATIMENTS-ET-PACKS.md §2). */
  id: string;
  /** Pack auquel appartient ce modèle ("classique" pour le pack de base gratuit). */
  pack: string;
  /** Fréquence relative d'apparition parmi les modèles disponibles. */
  poids: number;
  /** Niveau minimal de la ville (0 = Hameau … 6 = Mégapole, voir niveauVille.ts) requis pour apparaître. */
  stadeMin: number;
  construire: TConstruire;
}

/** Hachage déterministe (même FNV-1a que hashStr()/rngFrom(), aleatoire.ts) d'une clé texte vers [0, 1). */
export function hashUnit(...parties: (string | number)[]): number {
  return hashStr(parties.join("|")) / 4294967296;
}

/**
 * Choisit un modèle dans le catalogue pour une parcelle donnée.
 * - Filtre par niveau de ville (stadeMin) puis par pack actif ; si le
 *   pack actif n'a aucun modèle pour cette famille, retombe sur le pack
 *   "classique" (docs/BATIMENTS-ET-PACKS.md §2, "un pack peut être
 *   partiel").
 * - Tirage pondéré par `poids`, sur un ordre trié par id (stable quel
 *   que soit l'ordre d'écriture du tableau de modèles).
 */
export function choisirModele<T extends { id: string; pack: string; poids: number; stadeMin: number }>(
  cle: string,
  modeles: readonly T[],
  niveauVille: number,
  packActif = "classique"
): T {
  const disponibles = modeles.filter((m) => m.stadeMin <= niveauVille);
  const duPack = disponibles.filter((m) => m.pack === packActif);
  const candidats = (duPack.length > 0 ? duPack : disponibles.filter((m) => m.pack === "classique")).slice().sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  );
  if (candidats.length === 0) {
    throw new Error(`choisirModele: aucun modèle disponible (pack=${packActif}, niveau=${niveauVille})`);
  }
  const totalPoids = candidats.reduce((s, m) => s + m.poids, 0);
  const u = hashUnit(cle, "choix-modele") * totalPoids;
  let cumul = 0;
  for (const m of candidats) {
    cumul += m.poids;
    if (u < cumul) return m;
  }
  return candidats[candidats.length - 1];
}

export type ConstruireMaison = (g: Geo, rect: Rect, front: Facade, r: RNG, ao: TamponAO[], seed: number) => void;
export type ConstruireImmeuble = (
  g: Geo,
  rect: Rect,
  front: Facade,
  floors: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
) => void;
export type ConstruireTour = (
  g: Geo,
  rect: Rect,
  innerSide: Facade,
  F: number,
  cap: number,
  r: RNG,
  ao: TamponAO[],
  seed: number
) => number;

export type ModeleMaison = FicheModele<ConstruireMaison>;
export type ModeleImmeuble = FicheModele<ConstruireImmeuble>;
export type ModeleTour = FicheModele<ConstruireTour>;
