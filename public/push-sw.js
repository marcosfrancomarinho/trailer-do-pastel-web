self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); } catch { return; }
  const title = typeof data.title === 'string' ? data.title : 'Trailer do Pastel';
  const url = data.url === '/pedidos' ? '/pedidos' : '/pedidos';
  event.waitUntil(self.registration.showNotification(title, {
    body: typeof data.body === 'string' ? data.body : 'Seu pedido está pronto para retirada!',
    tag: typeof data.tag === 'string' ? data.tag : 'trailer-pedido',
    icon: '/bob_esponja.svg',
    data: { url },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL('/pedidos', self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find((client) => client.url.startsWith(self.location.origin));
    if (existing) {
      await existing.navigate(url);
      await existing.focus();
    } else {
      await clients.openWindow(url);
    }
  })());
});
