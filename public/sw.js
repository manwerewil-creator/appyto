// Minimal, install-enabling service worker.
//
// History: a previous worker broke Google OAuth by intercepting navigations and
// serving stale JS. This one is deliberately narrow — it exists so the browser
// offers "Install app", and it ONLY ever touches content-hashed static assets
// (which can be cached forever because their filename changes on every build).
// It NEVER responds to navigations, /auth, /api, POSTs, or cross-origin
// requests — those always hit the network, so the login flow can't regress.
const CACHE = "featers-static-v4";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Hard bypass: anything that isn't a same-origin GET for a static asset.
  if (
    request.method !== "GET" ||
    request.mode === "navigate" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth")
  ) {
    return; // do not call respondWith → browser handles it normally
  }

  const isHashedAsset =
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:css|js|woff2?|png|jpg|jpeg|gif|svg|webp|ico)$/.test(url.pathname);
  if (!isHashedAsset) return;

  event.respondWith(
    caches.match(request).then((hit) =>
      hit ||
      fetch(request).then((res) => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        }
        return res;
      }),
    ),
  );
});
