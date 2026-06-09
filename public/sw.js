// Minimal service worker — installable PWA + static asset caching.
// IMPORTANT: it must NOT touch navigations or auth, or it breaks the OAuth
// redirect/callback flow. So we only cache same-origin static assets.
const CACHE = "featers-v3";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Never intercept: navigations (let the browser/OAuth handle them), non-GET,
  // cross-origin, API calls, or auth routes.
  if (
    request.mode === "navigate" ||
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth")
  ) {
    return; // fall through to the network
  }

  // Cache-first for static build assets only.
  if (url.pathname.startsWith("/_next/static") || /\.(?:css|js|png|jpg|jpeg|gif|svg|ico|webp|woff2?)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(request).then((hit) =>
        hit || fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        }),
      ),
    );
  }
});
