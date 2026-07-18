const CACHE_NAME = "mls-app-v3";
const APP_SHELL = ["/portal", "/login", "/manifest.webmanifest", "/mls-app-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => undefined);
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/portal")))
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
