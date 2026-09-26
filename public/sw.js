// Service worker minimal : rend l'app installable (condition PWA) et
// offre un mode hors-ligne dégradé — jamais de données périmées servies
// quand le réseau fonctionne (jeu multijoueur, la fraîcheur compte),
// mais quelque chose à afficher si la connexion tombe en cours de
// session (Jalon 15, "Jouable partout").
//
// Stratégie de cache à affiner jalon après jalon si besoin
// (implémentation libre pour Claude Code, voir docs/DECISIONS.md §3) :
// - Pages (navigation) : réseau d'abord, mis en cache au passage ;
//   secours sur la dernière version connue en cache si le réseau
//   échoue, puis sur la page d'accueil en tout dernier recours.
// - Assets statiques (JS/CSS/images/polices same-origin) : cache
//   d'abord (ils changent rarement, un nom de fichier changé par le
//   build invalide déjà le cache tout seul), rafraîchis en arrière-plan
//   sans bloquer l'affichage.
// - Tout le reste (Supabase, Server Actions, requêtes cross-origin) :
//   jamais mis en cache, toujours le réseau — ce sont les données de
//   jeu elles-mêmes, jamais servies périmées.

const CACHE_NAME = "jeu-miniville-shell-v2";
const SHELL_URLS = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Jamais de cache pour autre chose que GET, ou hors de notre origine
  // (Supabase, Server Actions) : toujours le réseau, sans interception.
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((reponse) => {
          const copie = reponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copie));
          return reponse;
        })
        .catch(
          async () =>
            (await caches.match(request)) ||
            (await caches.match("/")) ||
            Response.error()
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cache) => {
      const reseau = fetch(request)
        .then((reponse) => {
          const copie = reponse.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, copie));
          return reponse;
        })
        .catch(() => cache);
      return cache || reseau;
    })
  );
});
