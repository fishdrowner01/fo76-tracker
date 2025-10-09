self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('fo76-210').then((cache) => cache.addAll([
    './','./index.html','./style-194.css','./manifest.webmanifest'
  ])));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n !== 'fo76-210').map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});
