// Service Worker caching strategy
// - Development (localhost/127.0.0.1): Network-first with no-store (effectively network-only),
//   no precache. Cache is used only as a fallback if any exists from previous runs.
// - Production: Network-first with cache fallback. Successful GET responses are cached for offline use.

const DEV_HOSTS = ['localhost', '127.0.0.1'];
const IS_DEV = DEV_HOSTS.includes(self.location.hostname);

const VERSION = "r20251020.3"

const CACHE_NAME = `blackjack-pwa-${VERSION}${IS_DEV ? '-dev' : ''}`;

// In dev, avoid precache to prevent cache getting in the way during iteration
const urlsToCache = IS_DEV
  ? []
  : [
      './index.html',
      './manifest.json',
      './assets/css/style.css',
      './assets/js/script.js',
      './assets/js/game.js',
      './assets/js/i18n.js',
      './assets/js/score-manager.js',
      'https://cdn.tailwindcss.com',
      'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap'
    ];

// インストール時にキャッシュを作成
self.addEventListener('install', (event) => {
  if (urlsToCache.length > 0) {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('[SW] Pre-caching resources', { IS_DEV, count: urlsToCache.length });
          return cache.addAll(urlsToCache);
        })
        .catch((error) => {
          console.error('[SW] Failed to cache resources:', error);
        })
    );
  }
  self.skipWaiting();
});

// 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// フェッチリクエストをインターセプト
self.addEventListener('fetch', (event) => {
  // Only handle GET requests; let the browser handle others (POST, etc.)
  if (event.request.method !== 'GET') {
    return;
  }

  const request = event.request;

  // Network-first strategy: try network, then fall back to cache on failure
  event.respondWith(
    fetch(request, IS_DEV ? { cache: 'no-store' } : { cache: 'reload' })
      .then((networkResponse) => {
        // Optionally cache successful same-origin basic responses in production
        if (
          !IS_DEV &&
          networkResponse &&
          networkResponse.status === 200 &&
          (networkResponse.type === 'basic' || networkResponse.type === 'default')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // Generic offline fallback
          return new Response('Offline - Content not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});

// メッセージイベントを処理（キャッシュの更新など）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
