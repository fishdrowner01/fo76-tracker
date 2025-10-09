self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("fo76-206").then(c =>
      c.addAll(["./", "./index.html", "./style.css", ])
    )
  );
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter(n => n !== "fo76-206").map(n => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});
self.addEventListener("fetch", e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
