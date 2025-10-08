
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('fo76-green-191').then((cache) => cache.addAll([
    './','./index.html','./style-186.css','./icons/icon-192.png','./icons/icon-512.png'
  ])));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n !== 'fo76-green-191').map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});
