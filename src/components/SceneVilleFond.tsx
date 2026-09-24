"use client";

import dynamic from "next/dynamic";
import { createContext, useContext, useRef } from "react";
import type { ControleurSceneVille, ParametresVille } from "@/lib/ville3d/scene";

/**
 * Une seule scène Three.js, montée une fois dans le layout racine et
 * partagée par toutes les pages du jeu (Jalon 7, "Un jeu agréable à
 * regarder" — voir docs/DECISIONS.md §4). Les pages ne recréent plus
 * leur propre canvas : elles annoncent la ville à afficher via
 * useSceneVille()/SincroniserScene, ce qui évite de reconstruire le
 * contexte WebGL à chaque navigation.
 *
 * Le canvas lui-même (CanvasVilleInterne, qui importe Three.js) est
 * chargé en différé : ce fichier-ci ne doit jamais faire grossir le
 * paquet initial du layout (contrainte "application légère",
 * docs/A-INTEGRER.md §4) — le texte de chaque page s'affiche donc avant
 * que la 3D ne soit prête. Les appels à definirVille() reçus avant que
 * le canvas soit monté sont mémorisés et rejoués dès qu'il l'est.
 */
interface ContexteScene {
  definirVille(params: ParametresVille): void;
  definirDate(date: Date | null): void;
}

const SceneVilleContext = createContext<ContexteScene | null>(null);

export function useSceneVille(): ContexteScene {
  const ctx = useContext(SceneVilleContext);
  if (!ctx) throw new Error("useSceneVille() doit être appelé sous <SceneVilleFond>.");
  return ctx;
}

const CanvasVilleInterne = dynamic(() => import("./CanvasVilleInterne"), { ssr: false });

/** Ville affichée par défaut tant qu'aucune page n'a annoncé la sienne. */
const VILLE_PAR_DEFAUT: ParametresVille = {
  seed: "accueil",
  populationMax: 1200,
  pays: { latitude: 46.6, longitude: 2.35, fuseauHoraire: "Europe/Paris" },
};

export function SceneVilleFond({ children }: { children: React.ReactNode }) {
  const controleurRef = useRef<ControleurSceneVille | null>(null);
  const enAttenteRef = useRef<ParametresVille>(VILLE_PAR_DEFAUT);
  const dateForceeRef = useRef<Date | null>(null);

  const contexte: ContexteScene = {
    definirVille(params) {
      enAttenteRef.current = params;
      controleurRef.current?.definirVille(params);
    },
    definirDate(date) {
      dateForceeRef.current = date;
      controleurRef.current?.definirDate(date);
    },
  };

  return (
    <SceneVilleContext.Provider value={contexte}>
      <div className="scene">
        <CanvasVilleInterne
          onControleur={(controleur) => {
            controleurRef.current = controleur;
            if (controleur) {
              controleur.definirVille(enAttenteRef.current);
              controleur.definirDate(dateForceeRef.current);
            }
          }}
        />
      </div>
      {children}
    </SceneVilleContext.Provider>
  );
}
