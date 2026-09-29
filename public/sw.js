// Service Worker do Aplicativo Operação Acolhida (SUFAI)
const CACHE_NAME = 'operacao-acolhida-sufai-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/portal-migrante.html',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Acolhida App SW] Armazenando cache estático para funcionamento offline');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[Acolhida App SW] Cache parcial:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Acolhida App SW] Limpando versão de cache antiga:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Requisições para a API: tenta buscar da rede; se falhar (sem internet no abrigo), responde amigavelmente
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({
            offline: true,
            mensagem: 'Dispositivo offline. Os dados do seu cadastro foram retidos no celular e serão sincronizados automaticamente assim que você se conectar à rede do P Trg ou Wi-Fi.',
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      })
    );
    return;
  }

  // Network-First com Fallback para Cache para páginas e assets do App
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/portal-migrante.html');
          }
        });
      })
  );
});
