
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('fo76-green-200').then((cache) => cache.addAll([
    './','./index.html','./style-186.css','./icons/icon-192.png','./icons/icon-512.png','./arts/cap.svg','./arts/gold.svg'
  ])));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n !== 'fo76-green-200').map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});
