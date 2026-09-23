"use client";

import { useEffect, useRef } from "react";
import { creerSceneVille, type ControleurSceneVille, type ParametresPays } from "@/lib/ville3d/scene";

export interface VilleSceneProps {
  /** Identité stable de la ville (son id) — même ville, toujours la même forme. */
  seed: string;
  /** population_max de la ville (jamais la population instantanée). */
  populationMax: number;
  pays: ParametresPays;
}

/**
 * Rendu 3D temps réel d'une ville (Jalon 6bis, docs/DECISIONS.md §4).
 * Glisser pour tourner/incliner la caméra, Maj+glisser pour déplacer,
 * molette ou pincement pour zoomer.
 */
export function VilleScene({ seed, populationMax, pays }: VilleSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controleurRef = useRef<ControleurSceneVille | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const controleur = creerSceneVille(canvas);
    controleurRef.current = controleur;
    return () => {
      controleur.dispose();
      controleurRef.current = null;
    };
    // Le canvas ne change jamais après le montage : la scène ne se
    // recrée pas à chaque changement de props, voir l'effet ci-dessous.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    controleurRef.current?.definirVille({ seed, populationMax, pays });
  }, [seed, populationMax, pays]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Vue 3D de la ville"
      className="block h-full w-full touch-none"
    />
  );
}
