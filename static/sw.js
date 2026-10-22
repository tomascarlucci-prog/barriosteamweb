// Este archivo es obligatorio para que el celular reconozca la web como App (PWA)
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Instalado');
});

self.addEventListener('fetch', (e) => {
    // Permite que la app funcione aunque haya micro-cortes de internet
});