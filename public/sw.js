/* pic-tool Service Worker — shell cache, network-first, versioned assets bypass */
const CACHE = 'pic-tool-v1';
// 只预缓存首屏壳资源，不缓存体积巨大的 WASM
const CORE_ASSETS = [
  '/',
  '/favicon.svg'
];

// 小体积且需要离线可用的清单：这些永远 network-first，不写进缓存，
// 避免 manifest 变更（图标/名称/PWA 元数据）被 SW 锁在旧版
const ALWAYS_NETWORK = [
  '/manifest.json',
  '/sw.js'
];
const isAlwaysNetwork = (path) => ALWAYS_NETWORK.includes(path);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch(() => null);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      );
    })
  );
});

// 是否「带版本号的产物」——这些靠 CDN/ETag 强缓存即可，SW 不参与，避免旧版残留
const isVersioned = (path) =>
  /\/_astro\//.test(path) || /\.wasm(\?|$)/.test(path) || /-[\w]{8,}\.(?:js|css|woff2?)$/.test(path);

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // 带版本号的资源：直接走网络（CDN 强缓存），SW 不干预
  if (isVersioned(url.pathname)) return;

  // manifest / sw 自身：永远走网络，保证 PWA 元数据与 SW 更新及时生效
  if (isAlwaysNetwork(url.pathname)) return;

  // Navigation: network-first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // 其它同源静态资源：cache-first
  const isStatic = /\.(?:css|js|png|jpg|jpeg|svg|webp|gif|worker\.js|woff2?)$/i.test(url.pathname);
  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});
