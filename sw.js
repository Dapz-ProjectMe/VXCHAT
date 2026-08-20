const CACHE = "vxchat-v5";

const ASSETS = [
  "./",
  "./index.html",
  "./login.html",
  "./register.html",
  "./chat.html",
  "./css/style.css",
  "./js/config.js",
  "./js/auth.js",
  "./js/chat.js",
  "./manifest.json"
];

// ===============================
// INSTALL
// ===============================
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );

  self.skipWaiting();
});

// ===============================
// ACTIVATE
// ===============================
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

// ===============================
// FETCH / OFFLINE CACHE
// ===============================
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();

        caches.open(CACHE).then(cache => {
          cache.put(event.request, copy);
        });

        return response;
      })
      .catch(() =>
        caches.match(event.request).then(
          cached =>
            cached ||
            new Response("Offline", {
              status: 503,
              headers: {
                "Content-Type": "text/plain"
              }
            })
        )
      )
  );
});

// ===============================
// PUSH NOTIFICATION
// ===============================
self.addEventListener("push", event => {
  let data = {
    title: "VXCHAT",
    body: "Kamu menerima pesan baru.",
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    url: "./chat.html"
  };

  try {
    if (event.data) {
      data = {
        ...data,
        ...event.data.json()
      };
    }
  } catch (error) {
    console.error("Push data error:", error);
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: "vxchat-message",
      renotify: true,
      data: {
        url: data.url
      }
    })
  );
});

// ===============================
// NOTIFICATION CLICK
// ===============================
self.addEventListener("notificationclick", event => {
  event.notification.close();

  const url = event.notification.data?.url || "./chat.html";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(windowClients => {

      for (const client of windowClients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
