// BROKR® Service Worker
const CACHE = 'brokr-v1';
const OFFLINE_URLS = ['/', '/index.html'];

// ── INSTALL ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

// ── ACTIVATE ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH: network first, fallback to cache ──
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── PUSH NOTIFICATIONS ──
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'BROKR®';
  const options = {
    body: data.body || 'Tu tarea está lista.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Ver ahora' },
      { action: 'close', title: 'Cerrar' }
    ]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// ── NOTIFICATION CLICK ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'close') return;
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      const existing = cs.find(c => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(url); }
      else clients.openWindow(url);
    })
  );
});
