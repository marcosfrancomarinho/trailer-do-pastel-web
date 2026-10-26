import { useEffect, useRef, useState } from 'react';
import { useApplicationServices } from '../global/useApplicationServices';
import type { SavedCustomerOrder } from '../../../application/dtos/orders';

export function useOrdersPage() {
  const useCases = useApplicationServices();
  const [orders, setOrders] = useState<SavedCustomerOrder[]>(() => useCases.orders.listSaved.execute());
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const completedTokensRef = useRef(new Set<string>());

  useEffect(() => {
    if (orders.length === 0) return;
    const needsTracking = (order: SavedCustomerOrder) =>
      order.status !== 'COMPLETED' && !completedTokensRef.current.has(order.trackingToken);
    let active = true;
    let pageHidden = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let currentRequest: AbortController | null = null;

    const stop = () => {
      if (refreshTimer !== undefined) clearTimeout(refreshTimer);
      refreshTimer = undefined;
      currentRequest?.abort();
      currentRequest = null;
    };
    const refresh = async () => {
      if (!active || pageHidden || document.visibilityState !== 'visible' || currentRequest) return;
      const ordersToTrack = orders.filter(needsTracking);
      if (ordersToTrack.length === 0) return;

      const request = new AbortController();
      currentRequest = request;
      try {
        const trackingRequests = ordersToTrack.map((order) =>
          useCases.orders.track.execute({ trackingToken: order.trackingToken, signal: request.signal }),
        );
        const responses = await Promise.allSettled(trackingRequests);
        const canApplyResults = active && !pageHidden && !request.signal.aborted && document.visibilityState === 'visible';
        if (canApplyResults) {
          const next: Record<string, string> = {};
          responses.forEach((response, index) => {
            if (response.status !== 'fulfilled') return;
            const trackingToken = ordersToTrack[index].trackingToken;
            next[trackingToken] = response.value.status;
            if (response.value.status === 'COMPLETED') completedTokensRef.current.add(trackingToken);
          });
          setStatuses((previous) => ({ ...previous, ...next }));
        }
      } finally {
        if (currentRequest === request) {
          currentRequest = null;
          const hasOrdersToTrack = orders.some(needsTracking);
          if (active && !pageHidden && document.visibilityState === 'visible' && hasOrdersToTrack) {
            refreshTimer = setTimeout(() => {
              void refresh();
            }, 5000);
          }
        }
      }
    };
    const resume = () => {
      if (!active || pageHidden || document.visibilityState !== 'visible') return;
      if (refreshTimer !== undefined) clearTimeout(refreshTimer);
      refreshTimer = undefined;
      if (!currentRequest) void refresh();
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

  return { orders, statuses, removeSavedOrder };
}
