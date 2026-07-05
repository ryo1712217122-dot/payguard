const CACHE_NAME = 'payguard-v33';
const urlsToCache = ['./', 'index.html', 'manifest.json', 'icon-192.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// キャッシュを優先するが、HTMLは常にネットワークから取得
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // HTMLファイルやルートアクセスは常にネットワーク優先
  if (event.request.destination === 'document' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  // その他はキャッシュ優先
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

// 通知スケジューリング
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = event.data;
    self.registration.showNotification(title, {
      body,
      tag,
      vibrate: [200, 100, 200],
      data: { url: '/' }
    });
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow('/');
    })
  );
});

// Build trigger: 2026-07-05T19:56:00
