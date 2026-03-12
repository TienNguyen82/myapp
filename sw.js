const CACHE_NAME = "sandtable-static-v1";
const STATIC_ASSETS = [
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./sw.js"
];

// Cài service worker mới và kích hoạt ngay
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// Chiếm quyền điều khiển ngay, đồng thời dọn cache cũ
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

// Không cache HTML để mỗi lần sửa index là thấy ngay
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Chỉ xử lý GET
  if (req.method !== "GET") return;

  // Không can thiệp API nội mạng của Pi
  // Ví dụ: http://192.168.4.1:5000/...
  if (url.port === "5000") {
    return;
  }

  // Luôn lấy mới với trang HTML / navigation
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(
      fetch(req).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Asset tĩnh: ưu tiên cache trước
  if (
    req.destination === "image" ||
    req.destination === "style" ||
    req.destination === "script" ||
    req.destination === "manifest"
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;

        return fetch(req).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return response;
        });
      })
    );
    return;
  }
});
