// Minimal service worker — just enough to make the app installable and
// keep static assets available offline. Deliberately does NOT cache pages
// or API/server-action responses, since this app's data is always
// per-session and dynamic — caching HTML here would show stale onboarding
// state after a task is marked done elsewhere.
const CACHE_NAME = "onboardingbuddy-static-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Only cache same-origin static build assets and icons — never HTML
  // documents, API routes, or server actions.
  const isStaticAsset = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");
  if (event.request.method !== "GET" || !isStaticAsset) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    }),
  );
});
