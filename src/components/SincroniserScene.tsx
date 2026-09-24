"use client";

import { useEffect } from "react";
import { useSceneVille } from "./SceneVilleFond";
import type { ParametresVille } from "@/lib/ville3d/scene";

/**
 * Pont entre une page serveur (qui a les données) et la scène 3D
 * persistante (qui vit dans le layout, voir SceneVilleFond.tsx). Ne
 * rend rien : annonce juste "voici la ville à afficher" à chaque
 * changement de ses props.
 */
export function SincroniserScene(props: ParametresVille) {
  const { definirVille } = useSceneVille();
  const { seed, populationMax, pays } = props;

  useEffect(() => {
    definirVille({ seed, populationMax, pays });
    // definirVille est stable (issue du ref dans SceneVilleFond) : seules
    // les vraies données de la ville doivent redéclencher l'appel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, populationMax, pays.latitude, pays.longitude, pays.fuseauHoraire]);

  return null;
}
