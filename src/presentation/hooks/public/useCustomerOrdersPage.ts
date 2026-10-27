import { useEffect, useRef, useState } from 'react';
import { useApplicationServices } from '../global/useApplicationServices';
import type { SavedCustomerOrder } from '../../../application/dtos/orders';

export function useCustomerOrdersPage() {
  const useCases = useApplicationServices();
  const [orders, setOrders] = useState<SavedCustomerOrder[]>(() => useCases.orders.listSaved.execute());
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const completedTokensRef = useRef(new Set<string>());
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
        setStatuses((old) => ({ ...old, [order.trackingToken]: current.status }));
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
    setOrders(useCases.orders.removeSaved.execute(token));
    setStatuses((previous) => {
      const next = { ...previous };
      delete next[token];
      return next;
    });
  }

  function removeAllSavedOrders() {
    for (const order of orders) useCases.orders.removeSaved.execute(order.trackingToken);
    completedTokensRef.current.clear();
    setStatuses({});
    setOrders([]);
  }

  return { orders, statuses, removeSavedOrder, removeAllSavedOrders };
}
