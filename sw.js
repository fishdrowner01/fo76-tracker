
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('fo76-green-v1').then((cache) => cache.addAll([
    './','./index.html','./style.css','./arts/thumbs.svg',
    './icons/icon-192.png','./icons/icon-512.png'
  ])));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});
