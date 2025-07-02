const CACHE_NAME = "leirisonda-v2.0.1";
const urlsToCache = [
  "/",
  "/leirisonda-deploy/manifest.json",
  "/leirisonda-deploy/favicon-leirisonda.svg",
  "/leirisonda-deploy/pwa-style.css",
  "/leirisonda-deploy/assets/index-DnEsHg1H.js",
  "/leirisonda-deploy/assets/index-DFdR-byQ.css",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      // Cache hit - return response
      if (response) {
        return response;
      }
      return fetch(event.request);
    }),
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});
