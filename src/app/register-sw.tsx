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

    if (process.env.NODE_ENV !== "production") {
      // En développement (npm run dev), ne JAMAIS enregistrer le service
      // worker : les chunks et le HTML changent à chaque compilation/HMR,
      // et un service worker déjà actif les met en cache et sert des
      // versions périmées, ce qui bloque toute la page avec ERR_FAILED
      // dans Chrome (bug vécu par Adrien les 24 et 25/09/2026). On se
      // nettoie plutôt soi-même : si un service worker (ou un cache) d'une
      // session précédente traîne encore pour localhost, on le retire, ce
      // qui guérit le problème tout seul au rechargement suivant, sans
      // manipulation dans les DevTools.
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
      if (window.caches) {
        caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Échec de l'enregistrement du service worker :", err);
    });
  }, []);

  return null;
}
