"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker pour rendre l'app installable (PWA) sur
 * mobile (Android/iOS) et PC, sans passer par un store.
 *
 * Point d'implémentation, pas de design de jeu : Claude Code peut faire
 * évoluer cette stratégie de cache sans en référer à Adrien, tant que le
 * jeu reste jouable hors-ligne dégradé (voir docs/DECISIONS.md §3).
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Échec de l'enregistrement du service worker :", err);
    });
  }, []);

  return null;
}
