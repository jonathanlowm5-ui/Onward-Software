/*
 * Kill-switch service worker.
 *
 * A previous deployment on this domain registered a service worker that keeps
 * serving its old cached app shell (so new deploys never appear). Serving this
 * file at the same path makes the browser update the SW to this version, which
 * unregisters itself, purges all caches, and reloads open tabs — restoring the
 * normal "always fetch the latest from the server" behaviour. Harmless if no
 * old SW exists.
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) { /* ignore */ }
      try {
        await self.registration.unregister();
      } catch (e) { /* ignore */ }
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => c.navigate(c.url));
    })()
  );
});

// Never serve from cache — always hit the network.
self.addEventListener('fetch', () => {});
