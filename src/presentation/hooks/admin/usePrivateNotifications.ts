import { useCallback, useEffect, useRef, useState } from 'react';
import { useApplicationServices } from '../global/useApplicationServices';
import { RestaurantDate } from '../../../application/utils/order-date.ts';
import type { PendingOrder, PreparingOrder } from '../../../application/dtos/orders';
import { orderAlert } from '../../../infrastructure/audio/order-alert';

type PrivateView = 'admin' | 'tables' | 'comandas';
type AlertOrder = PendingOrder | PreparingOrder;

export function usePrivateNotifications(token: string, view: PrivateView) {
  const useCases = useApplicationServices();
  const [notificationsOn, setNotificationsOn] = useState(() => useCases.notifications.getSoundPreference.execute());
  const [cancelAlerts, setCancelAlerts] = useState<AlertOrder[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [newPendingCount, setNewPendingCount] = useState(0);
  const pendingSeenRef = useRef<Set<string> | null>(null);
  const preparationSnapshot = useRef<Map<string, AlertOrder> | null>(null);
  const acknowledgedCancellationIds = useRef(new Set<string>());
  const ordersVisibleRef = useRef(true);

  const setOrdersVisible = useCallback((visible: boolean) => {
    ordersVisibleRef.current = visible;
  }, []);
  const acknowledgeCancellation = useCallback((id: string) => {
    acknowledgedCancellationIds.current.add(id);
    setCancelAlerts((previous) => previous.filter((order) => order.id !== id));
  }, []);
  const dismissNew = useCallback(() => setNewPendingCount(0), []);

  useEffect(() => {
    const sync = () => {
      const enabled = useCases.notifications.getSoundPreference.execute();
      setNotificationsOn(enabled);
      if (!enabled) {
        setNewPendingCount(0);
        setCancelAlerts([]);
      }
    };
    window.addEventListener('admin-notification-preference', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('admin-notification-preference', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      pendingSeenRef.current = null;
      setPendingCount(0);
      setNewPendingCount(0);
      return;
    }
    let active = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      try {
        const results = await useCases.orders.listPending.execute({ date: RestaurantDate.today() });
        if (!active) return;
        const ids = new Set(results.map((order) => order.id));
        const seen = pendingSeenRef.current;
        if (seen) {
          const arrivals = results.filter((order) => !seen.has(order.id));
          if (
            arrivals.length &&
            (view !== 'admin' || !ordersVisibleRef.current) &&
            useCases.notifications.getSoundPreference.execute()
          ) {
            setNewPendingCount((count) => count + arrivals.length);
            orderAlert.play();
          }
          results.forEach((order) => seen.add(order.id));
        } else {
          pendingSeenRef.current = ids;
        }
        setPendingCount(results.length);
      } catch {
        // Falhas transitórias não devem disparar alertas falsos.
      } finally {
        if (active)
          timeout = setTimeout(() => {
            void check();
          }, 5000);
      }
    };
    void check();
    return () => {
      active = false;
      if (timeout) clearTimeout(timeout);
    };
  }, [token, view]);

  useEffect(() => {
    if (!token) {
      preparationSnapshot.current = null;
      setCancelAlerts([]);
      return;
    }
    let active = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let daySnapshot = '';
    const check = async () => {
      try {
        const day = RestaurantDate.today();
        const [pending, ongoing, history] = await Promise.all([
          useCases.orders.listPending.execute({ date: day }),
          useCases.orders.listPreparing.execute({ date: day }),
          useCases.orders.listHistory.execute({ date: day }),
        ]);
        if (!active) return;
        const current = new Map([...pending, ...ongoing].map((order) => [order.id, order] as const));
        if (daySnapshot === day && preparationSnapshot.current) {
          const matches = useCases.orders.findCanceledTableOrders.execute({
            previous: preparationSnapshot.current,
            current,
            history,
            acknowledgedIds: acknowledgedCancellationIds.current,
          });
          if (matches.length && useCases.notifications.getSoundPreference.execute()) {
            setCancelAlerts((previous) => {
              const already = new Set(previous.map((order) => order.id));
              return [...previous, ...matches.filter((order) => !already.has(order.id))];
            });
            orderAlert.playCancellation();
          }
        }
        preparationSnapshot.current = current;
        daySnapshot = day;
      } catch {
        // Falha de consulta não redefine a referência, evitando falsos alertas.
      } finally {
        if (active)
          timeout = setTimeout(() => {
            void check();
          }, 5000);
      }
    };
    void check();
    return () => {
      active = false;
      if (timeout) clearTimeout(timeout);
    };
  }, [token, view]);

  useEffect(() => {
    if (!token) return;
    const unlock = () => {
      if (!useCases.notifications.getSoundPreference.execute()) return;
      void orderAlert.enable().catch(() => {});
    };
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
    return () => {
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, [token]);

  return {
    notificationsOn,
    cancelAlerts,
    pendingCount,
    newPendingCount,
    setOrdersVisible,
    acknowledgeCancellation,
    dismissNew,
  };
}
