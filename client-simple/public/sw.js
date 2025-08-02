// Service Worker for PWA functionality
const CACHE_NAME = 'my-bookmarks-v1';
const urlsToCache = [
  '/',
  '/share',
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Handle share target
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SHARE_TARGET') {
    // Handle shared content
    const { url, title, text } = event.data.data;
    // You can process the shared data here
  }
});