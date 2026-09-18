// Minimal service worker: exists mainly so Chrome/Android treats Swyp as an
// installable PWA. Deliberately network-first / no aggressive caching, since
// this app's data changes constantly.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
