// Firebase Cloud Messaging Service Worker
// Este ficheiro deve estar na pasta public para funcionar como service worker

importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js",
);

// Configuração Firebase - deve ser igual à configuração principal
firebase.initializeApp({
  apiKey: "AIzaSyC7BHkdQSdAoTzjM39vm90C9yejcoOPCjE",
  authDomain: "leirisonda-16f8b.firebaseapp.com",
  projectId: "leirisonda-16f8b",
  storageBucket: "leirisonda-16f8b.firebasestorage.app",
  messagingSenderId: "540456875574",
  appId: "1:540456875574:web:8a8fd4870cb4c943a40a97",
  measurementId: "G-R9W43EHH2C",
});

const messaging = firebase.messaging();

console.log("🔥 Firebase Messaging Service Worker inicializado");

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("📱 Mensagem push recebida em background:", payload);

  const notificationTitle =
    payload.notification?.title || "Leirisonda - Nova Notificação";
  const notificationOptions = {
    body: payload.notification?.body || "Tem uma nova notificação.",
    icon: "https://cdn.builder.io/api/v1/image/assets%2F24b5ff5dbb9f4bb493659e90291d92bc%2Fb4eb4a9e6feb44b09201dbb824b8737c?format=png&width=192",
    badge:
      "https://cdn.builder.io/api/v1/image/assets%2F24b5ff5dbb9f4bb493659e90291d92bc%2Fb4eb4a9e6feb44b09201dbb824b8737c?format=png&width=72",
    tag: payload.data?.type || "leirisonda-notification",
    data: payload.data,
    actions: [
      {
        action: "open",
        title: "Abrir App",
        icon: "https://cdn.builder.io/api/v1/image/assets%2F24b5ff5dbb9f4bb493659e90291d92bc%2Fb4eb4a9e6feb44b09201dbb824b8737c?format=png&width=96",
      },
      {
        action: "dismiss",
        title: "Dispensar",
        icon: "https://cdn.builder.io/api/v1/image/assets%2F24b5ff5dbb9f4bb493659e90291d92bc%2Fb4eb4a9e6feb44b09201dbb824b8737c?format=png&width=96",
      },
    ],
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("🔔 Notificação clicada:", event);

  event.notification.close();

  if (event.action === "open" || !event.action) {
    // Determinar URL baseado no tipo de notificação
    let targetUrl = "/dashboard";

    if (event.notification.data) {
      const data = event.notification.data;

      if (data.type === "new_work" && data.workId) {
        targetUrl = `/works/${data.workId}`;
      } else if (data.type === "work_assigned" && data.workId) {
        targetUrl = `/works/${data.workId}`;
      } else if (data.type === "work_updated" && data.workId) {
        targetUrl = `/works/${data.workId}`;
      } else if (data.type === "maintenance_assigned" && data.maintenanceId) {
        targetUrl = `/maintenance/${data.maintenanceId}`;
      }
    }

    // Abrir ou focar na janela da aplicação
    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((clientList) => {
          // Verificar se já há uma janela aberta
          for (const client of clientList) {
            if (
              client.url.includes(self.location.origin) &&
              "focus" in client
            ) {
              // Navegar para a URL desejada e focar
              client.postMessage({
                type: "NOTIFICATION_CLICK",
                url: targetUrl,
                data: event.notification.data,
              });
              return client.focus();
            }
          }

          // Se não há janela aberta, abrir nova
          if (clients.openWindow) {
            return clients.openWindow(self.location.origin + targetUrl);
          }
        }),
    );
  }
});

// Handle push events
self.addEventListener("push", (event) => {
  console.log("📱 Push event recebido:", event);

  if (event.data) {
    const data = event.data.json();
    console.log("📱 Dados do push:", data);

    const title = data.notification?.title || "Leirisonda";
    const options = {
      body: data.notification?.body || "Nova notificação",
      icon: "https://cdn.builder.io/api/v1/image/assets%2F24b5ff5dbb9f4bb493659e90291d92bc%2Fb4eb4a9e6feb44b09201dbb824b8737c?format=png&width=192",
      badge:
        "https://cdn.builder.io/api/v1/image/assets%2F24b5ff5dbb9f4bb493659e90291d92bc%2Fb4eb4a9e6feb44b09201dbb824b8737c?format=png&width=72",
      data: data.data || {},
      tag: data.data?.type || "leirisonda",
      actions: [
        {
          action: "open",
          title: "Abrir",
          icon: "https://cdn.builder.io/api/v1/image/assets%2F24b5ff5dbb9f4bb493659e90291d92bc%2Fb4eb4a9e6feb44b09201dbb824b8737c?format=png&width=96",
        },
      ],
      requireInteraction: true,
      vibrate: [200, 100, 200],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

console.log("🔔 Service Worker para notificações push configurado");
