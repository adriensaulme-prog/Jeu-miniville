"use client";

import { useEffect, useRef } from "react";
import { creerSceneVille, type ControleurSceneVille } from "@/lib/ville3d/scene";

/**
 * Le vrai canvas WebGL/Three.js — isolé de SceneVilleFond.tsx pour
 * pouvoir être chargé en différé (`next/dynamic`, `ssr: false`) :
 * Three.js ne doit jamais faire partie du paquet initial du layout
 * (budget de poids, voir docs/DECISIONS.md, contrainte "application
 * légère"). Le texte de la page s'affiche donc avant que ce module ne
 * soit téléchargé.
 */
export function CanvasVilleInterne({
  onControleur,
}: {
  onControleur: (controleur: ControleurSceneVille | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const controleur = creerSceneVille(canvas);
    onControleur(controleur);
    return () => {
      onControleur(null);
      controleur.dispose();
    };
    // onControleur est un callback stable (défini une fois dans
    // SceneVilleFond) ; le canvas ne se recrée qu'au (dé)montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} aria-label="Vue 3D de la ville affichée" />;
}

export default CanvasVilleInterne;
