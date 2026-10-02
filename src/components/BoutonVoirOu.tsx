"use client";

import { useSceneVille } from "./SceneVilleFond";

/** Événement écouté par PanneauFlottant : sur mobile, replie le panneau pour dégager la vue 3D. */
export const EVENEMENT_REDUIRE_PANNEAU = "jeu-miniville:reduire-panneau";

/**
 * « Voir où il est » (docs/A-INTEGRER.md §25) : demande à la scène 3D
 * persistante d'amener la caméra sur le point (x, z) et d'y poser un
 * repère lumineux. Sur mobile le panneau flottant est replié d'abord,
 * sinon il cacherait justement ce que le joueur veut voir.
 */
export function BoutonVoirOu({
  x,
  z,
  libelle,
  titre,
  className = "btn small",
}: {
  x: number;
  z: number;
  libelle: string;
  titre: string;
  className?: string;
}) {
  const { allerA } = useSceneVille();
  return (
    <button
      type="button"
      className={className}
      aria-label={titre}
      onClick={() => {
        window.dispatchEvent(new Event(EVENEMENT_REDUIRE_PANNEAU));
        allerA(x, z);
      }}
    >
      {libelle}
    </button>
  );
}
