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
  const destination = new URL('/pedidos', self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find((client) => {
      try { return new URL(client.url).origin === self.location.origin; }
      catch { return false; }
    });
    if (existing) {
      try {
        const navigated = await existing.navigate(destination);
        if (navigated) {
          await navigated.focus();
          return;
        }
      } catch {
        // Alguns navegadores móveis não permitem navegar uma janela existente.
      }
    }
    await self.clients.openWindow(destination);
  })());
});
