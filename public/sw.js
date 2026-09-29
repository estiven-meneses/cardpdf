const CACHE = 'cardpdf-v5';
const PRECACHE = [
    './',
    './index.html',
    './icon.svg',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-192-maskable.png',
    './icons/icon-512-maskable.png',
    './icons/apple-touch-icon.png'
];

function isPassthrough(url) {
    return url.pathname.startsWith('/__log') || url.pathname.startsWith('/api/');
}

// Solo se cachea lo propio. Lo de fuera (Supabase, fuentes) pasa directo:
// las URLs firmadas de las fotos privadas caducan y no deben quedar en disco.
function isSameOrigin(url) {
    return url.origin === self.location.origin;
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then((cache) => cache.addAll(PRECACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (!url.protocol.startsWith('http') || !isSameOrigin(url) || isPassthrough(url)) return;

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE).then((cache) => cache.put('./index.html', copy));
                    return response;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => {
            const networked = fetch(request)
                .then((response) => {
                    if (response && response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => cached);
            return cached || networked;
        })
    );
});
