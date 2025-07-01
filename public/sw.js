const CACHE_NAME = "leirisonda-v1.0.0";
const urlsToCache = [
  "/",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Leirisonda cache opened");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("Leirisonda files cached");
        return self.skipWaiting();
      }),
  );
});

// Fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    }),
  );
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        return self.clients.claim();
      }),
  );
});

// Push notification event (for future use)
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "Nova notificação da Leirisonda",
    icon: "/manifest-icon-192.png",
    badge: "/manifest-icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(self.registration.showNotification("Leirisonda", options));
});
