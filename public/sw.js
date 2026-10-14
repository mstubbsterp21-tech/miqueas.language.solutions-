const CACHE_NAME = "mls-static-v5";
const APP_SHELL = ["/manifest.webmanifest", "/mls-app-icon.svg"];
const STATIC_ASSET = /^\/assets\/.*\.(?:js|css|png|jpe?g|webp|svg|woff2?)$/i;

// Never cache authenticated pages, personal records, or arbitrary same-origin GETs.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("mls-") && key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => new Response(
        '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>MLS offline</title><main style="font-family:system-ui;max-width:35rem;margin:10vh auto;padding:2rem"><h1>Connection unavailable</h1><p>Reconnect to the internet and reload MLS Portal to securely access your account.</p><button type="button" onclick="location.reload()">Try again</button></main></html>',
        { status: 503, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } }
      ))
    );
    return;
  }

  if (!STATIC_ASSET.test(url.pathname) && !APP_SHELL.includes(url.pathname)) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        const contentType = response.headers.get("content-type") || "";
        if (response.ok && response.type !== "opaque" && !/text\/html/i.test(contentType) && !/no-store|private/i.test(response.headers.get("cache-control") || "")) {
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone())).catch(() => undefined));
        }
        return response;
      })
      .catch(async () => (await caches.match(request)) || Response.error())
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { data = { body: event.data?.text() || "Open MLS for details." }; }
  event.waitUntil(self.registration.showNotification(data.title || "MLS Portal update", {
    body: data.body || "Open MLS for details.",
    icon: data.icon || "/apple-touch-icon.png",
    badge: data.badge || "/favicon-32x32.png",
    tag: data.tag || "mls-update",
    renotify: true,
    data: { url: data.url || "/portal?section=notifications", notificationId: data.notificationId || null },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/portal?section=notifications", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const open = clients.find((client) => client.url.startsWith(self.location.origin));
    if (open) {
      open.navigate(target);
      return open.focus();
    }
    return self.clients.openWindow(target);
  }));
});
