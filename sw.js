const CACHE_NAME = "myapp-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET") return;

  // Không cache API Pi
  if (url.hostname === "192.168.4.1" || url.port === "5000") {
    event.respondWith(fetch(req));
    return;
  }

  // HTML luôn lấy mới
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(
      fetch(req, { cache: "no-store" }).catch(() => caches.match(req))
    );
    return;
  }

  // Asset tĩnh: network-first
  event.respondWith(
    fetch(req)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return response;
      })
      .catch(() => caches.match(req))
  );
});