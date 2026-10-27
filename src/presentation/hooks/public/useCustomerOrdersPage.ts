import { useEffect, useRef, useState } from 'react';
import { useApplicationServices } from '../global/useApplicationServices';
import type { SavedCustomerOrder } from '../../../application/dtos/orders';

export function useCustomerOrdersPage() {
  const useCases = useApplicationServices();
  const [orders, setOrders] = useState<SavedCustomerOrder[]>(() => useCases.orders.listSaved.execute());
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const completedTokensRef = useRef(new Set<string>());
  const lastStatusesRef = useRef(new Map<string, string>());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );

  async function enableNotifications() {
    if (typeof Notification === 'undefined') return;
    try {
      setNotificationPermission(await Notification.requestPermission());
    } catch {
      setNotificationPermission(Notification.permission);
    }
  }

  useEffect(() => {
    const syncPermission = () => setNotificationPermission(
      typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
    );
    window.addEventListener('focus', syncPermission);
    return () => window.removeEventListener('focus', syncPermission);
  }, []);


  useEffect(() => {
    if (orders.length === 0) return;
    let active = true;
    const controllers = new Map<string, AbortController>();
    const streams: EventSource[] = [];
    const baseUrl = (import.meta.env.VITE_API_URL || 'https://trailer-do-pastel.onrender.com').replace(/\/$/, '');

    const refresh = async (order: SavedCustomerOrder) => {
      if (!active || completedTokensRef.current.has(order.trackingToken)) return;
      const previous = controllers.get(order.trackingToken);
      previous?.abort();
      const controller = new AbortController();
      controllers.set(order.trackingToken, controller);
      try {
        const current = await useCases.orders.track.execute({
          trackingToken: order.trackingToken,
          signal: controller.signal,
        });
        if (!active || controller.signal.aborted) return;
        const previousStatus = lastStatusesRef.current.get(order.trackingToken) ?? order.status;
        lastStatusesRef.current.set(order.trackingToken, current.status);
        setStatuses((old) => ({ ...old, [order.trackingToken]: current.status }));
        if (previousStatus !== 'COMPLETED' && current.status === 'COMPLETED' &&
            typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            const notification = new Notification('Trailer do Pastel — Pedido pronto!', {
              body: 'Seu pedido #' + order.id.slice(0, 8) + ' está pronto para retirada.',
              tag: 'trailer-pedido-' + order.id,
            });
            notification.onclick = () => { window.focus(); notification.close(); };
          } catch {
            // Navegadores podem impedir notificações mesmo com permissão.
          }
        }
        if (current.status === 'COMPLETED' || current.status === 'CANCELED') {
          completedTokensRef.current.add(order.trackingToken);
          const stream = streams.find((source) => source.url.endsWith(
            '/orders/tracking/' + encodeURIComponent(order.trackingToken) + '/events',
          ));
          stream?.close();
        }
      } catch {
        // Ao reconectar, EventSource torna a disparar onopen e sincroniza.
      } finally {
        if (controllers.get(order.trackingToken) === controller) controllers.delete(order.trackingToken);
      }
    };

    for (const order of orders) {
      if (order.status === 'COMPLETED' || order.status === 'CANCELED' ||
          completedTokensRef.current.has(order.trackingToken)) continue;
      const stream = new EventSource(baseUrl + '/orders/tracking/' +
        encodeURIComponent(order.trackingToken) + '/events');
      streams.push(stream);
      stream.onopen = () => { void refresh(order); };
      stream.onmessage = () => { void refresh(order); };
      void refresh(order);
    }
    const onFocus = () => { for (const order of orders) void refresh(order); };
    window.addEventListener('focus', onFocus);
    return () => {
      active = false;
      streams.forEach((stream) => stream.close());
      controllers.forEach((controller) => controller.abort());
      window.removeEventListener('focus', onFocus);
    };
  }, [orders, useCases]);

  function removeSavedOrder(token: string) {
    completedTokensRef.current.delete(token);
    lastStatusesRef.current.delete(token);
    setOrders(useCases.orders.removeSaved.execute(token));
    setStatuses((previous) => {
      const next = { ...previous };
      delete next[token];
      return next;
    });
  }

  return { orders, statuses, removeSavedOrder, notificationPermission, enableNotifications };
}
