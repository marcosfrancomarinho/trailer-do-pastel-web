import { useEffect, useState } from 'react';
import { useApplicationServices } from '../global/useApplicationServices';
import type { SavedCustomerOrder } from '../../../application/dtos/orders';

export function useOrdersPage() {
  const useCases = useApplicationServices();
  const [orders, setOrders] = useState<SavedCustomerOrder[]>(() => useCases.orders.listSaved.execute());
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (orders.length === 0) return;
    let active = true;
    let pageHidden = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | null = null;

    const stop = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      controller?.abort();
      controller = null;
    };
    const refresh = async () => {
      if (!active || pageHidden || document.visibilityState !== 'visible' || controller) return;
      const request = new AbortController();
      controller = request;
      try {
        const responses = await Promise.allSettled(
          orders.map((order) => useCases.orders.track.execute({ trackingToken: order.trackingToken, signal: request.signal })),
        );
        if (active && !pageHidden && !request.signal.aborted && document.visibilityState === 'visible') {
          const next: Record<string, string> = {};
          responses.forEach((response, index) => {
            if (response.status === 'fulfilled') next[orders[index].trackingToken] = response.value.status;
          });
          setStatuses((previous) => ({ ...previous, ...next }));
        }
      } finally {
        if (controller === request) {
          controller = null;
          if (active && !pageHidden && document.visibilityState === 'visible') {
            timer = setTimeout(() => {
              void refresh();
            }, 5000);
          }
        }
      }
    };
    const resume = () => {
      if (!active || pageHidden || document.visibilityState !== 'visible') return;
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      if (!controller) void refresh();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') stop();
      else resume();
    };
    const onPageHide = () => {
      pageHidden = true;
      stop();
    };
    const onPageShow = () => {
      pageHidden = false;
      resume();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('focus', resume);
    resume();
    return () => {
      active = false;
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('focus', resume);
    };
  }, [orders]);

  function removeSavedOrder(token: string) {
    setOrders(useCases.orders.removeSaved.execute(token));
    setStatuses((previous) => {
      const next = { ...previous };
      delete next[token];
      return next;
    });
  }

  return { orders, statuses, removeSavedOrder };
}
