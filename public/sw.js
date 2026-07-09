self.addEventListener('push', (event) => {
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = {};
    }
  }

  const title =
    typeof payload.title === 'string' && payload.title.trim()
      ? payload.title
      : 'Chamama update';

  const options = {
    body:
      typeof payload.body === 'string' && payload.body.trim()
        ? payload.body
        : 'Open notifications to view the latest update.',
    icon: typeof payload.icon === 'string' ? payload.icon : '/icon-192.png',
    badge: typeof payload.badge === 'string' ? payload.badge : '/badge-72.png',
    data: {
      url:
        typeof payload.url === 'string' && payload.url.startsWith('/')
          ? payload.url
          : '/notifications',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const fallbackUrl = '/notifications';
  const targetPath =
    event.notification.data &&
    typeof event.notification.data.url === 'string' &&
    event.notification.data.url.startsWith('/')
      ? event.notification.data.url
      : fallbackUrl;
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.href === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});
