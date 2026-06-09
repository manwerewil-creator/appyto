// KILL SWITCH — this service worker exists only to remove itself.
//
// A PWA service worker repeatedly broke the Google OAuth login flow (it
// intercepted the /auth/callback navigation and served stale JS bundles,
// which left the login button dead and bounced signed-in users back to
// /login). The offline caching it provided is not worth that risk for this
// app, so the worker has been retired.
//
// Browsers re-fetch sw.js on every navigation and byte-compare it, so any
// browser still running an OLD worker will pick THIS file up, activate it,
// and then unregister itself + wipe all caches. After one reload the page is
// served straight from the network with no worker in the way.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop every cache this origin ever created.
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      // Take control of open pages, then remove ourselves.
      await self.clients.claim();
      await self.registration.unregister();
      // Reload controlled pages so they load fresh, worker-free.
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        if ("navigate" in client) client.navigate(client.url);
      }
    })(),
  );
});

// Never intercept anything while we wind down.
