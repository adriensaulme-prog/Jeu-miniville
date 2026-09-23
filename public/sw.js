// Service worker minimal : rend l'app installable (condition PWA) et met
// en cache le strict nécessaire pour un démarrage hors-ligne dégradé.
// Stratégie de cache à affiner jalon après jalon (implémentation libre
// pour Claude Code, voir docs/DECISIONS.md §3).

const CACHE_NAME = "jeu-miniville-shell-v1";
const SHELL_URLS = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
