const CACHE_NAME = "sisyphus-app-v1";

const urlsToCache = [
  "/",
  "/index.html"
];

// install

self.addEventListener("install", event => {

  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => {
      return cache.addAll(urlsToCache);
    })
  );

  self.skipWaiting();

});

// activate

self.addEventListener("activate", event => {

  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      );
    })
  );

  self.clients.claim();

});

// fetch

self.addEventListener("fetch", event => {

  const url = new URL(event.request.url);

  // không cache API của server

  if (url.hostname === "192.168.4.1") {
    return;
  }

  event.respondWith(

    caches.match(event.request)
    .then(response => {

      if (response) {
        return response;
      }

      return fetch(event.request)
      .then(networkResponse => {

        return caches.open(CACHE_NAME)
        .then(cache => {

          cache.put(event.request, networkResponse.clone());

          return networkResponse;

        });

      });

    })

  );

});