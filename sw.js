// Service Worker — Ticket Metrics PWA
var CACHE_NAME = 'ticket-metrics-v1';
var URLS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './stopwatch.png',
    './manifest.json',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css'
];

// Install: cachear arquivos essenciais
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(URLS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate: limpar caches antigos
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (names) {
            return Promise.all(
                names.filter(function (name) { return name !== CACHE_NAME; })
                    .map(function (name) { return caches.delete(name); })
            );
        })
    );
    self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', function (event) {
    event.respondWith(
        fetch(event.request).then(function (response) {
            // Atualizar cache com resposta nova
            if (response.status === 200) {
                var responseClone = response.clone();
                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(event.request, responseClone);
                });
            }
            return response;
        }).catch(function () {
            // Sem internet: usar cache
            return caches.match(event.request);
        })
    );
});
