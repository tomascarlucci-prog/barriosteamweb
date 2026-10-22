// Archivo Service Worker para la PWA de Barrios Team
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Instalado correctamente');
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    console.log('[Service Worker] Activado');
});

self.addEventListener('fetch', (e) => {
    // Permite que las peticiones fluyan normalmente a la red
    e.respondWith(
        fetch(e.request).catch(() => {
            // Aquí puedes manejar fallback offline si lo deseas en el futuro
        })
    );
});