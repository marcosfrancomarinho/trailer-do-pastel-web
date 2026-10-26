import { useCallback, useEffect, useRef, useState } from 'react';
import { useApplicationServices } from '../global/useApplicationServices';
import { RestaurantDate } from '../../../application/utils/order-date.ts';
import type { PendingOrder, PreparingOrder } from '../../../application/dtos/orders';
import { orderAlert } from '../../../infrastructure/audio/order-alert';

type PrivateView = 'admin' | 'tables';
type AlertOrder = PendingOrder | PreparingOrder;

export interface PrivateNotificationsState {
  notificationsOn: boolean;
  cancelAlerts: AlertOrder[];
  pendingCount: number;
  newPendingCount: number;
  setOrdersVisible: (visible: boolean) => void;
  acknowledgeCancellation: (id: string) => void;
  dismissNew: () => void;
}

export function usePrivateNotifications(token: string, view: PrivateView): PrivateNotificationsState {
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
    if (newPendingCount === 0) return;
    const dismissTimer = window.setTimeout(dismissNew, 4000);
    return () => window.clearTimeout(dismissTimer);
  }, [newPendingCount, dismissNew]);

  useEffect(() => {
    const syncSoundPreference = () => {
      const enabled = useCases.notifications.getSoundPreference.execute();
      setNotificationsOn(enabled);
      if (!enabled) {
        setNewPendingCount(0);
        setCancelAlerts([]);
      }
    };
    window.addEventListener('admin-notification-preference', syncSoundPreference);
    window.addEventListener('storage', syncSoundPreference);
    return () => {
      window.removeEventListener('admin-notification-preference', syncSoundPreference);
      window.removeEventListener('storage', syncSoundPreference);
    };
  }, [useCases]);

  useEffect(() => {
    if (!token) {
      pendingSeenRef.current = null;
      setPendingCount(0);
      setNewPendingCount(0);
      return;
    }
    let active = true;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const checkPendingOrders = async () => {
      try {
        const pendingOrders = await useCases.orders.listPending.execute({ date: RestaurantDate.today() });
        if (!active) return;
        const pendingIds = new Set(pendingOrders.map((order) => order.id));
        const seenIds = pendingSeenRef.current;
        if (seenIds) {
          const arrivals = pendingOrders.filter((order) => !seenIds.has(order.id));
          if (
            arrivals.length &&
            (view !== 'admin' || !ordersVisibleRef.current) &&
            useCases.notifications.getSoundPreference.execute()
          ) {
            setNewPendingCount((count) => count + arrivals.length);
            orderAlert.play();
          }
          pendingOrders.forEach((order) => seenIds.add(order.id));
        } else {
          pendingSeenRef.current = pendingIds;
        }
        setPendingCount(pendingOrders.length);
      } catch {
        // Falhas transitórias não devem disparar alertas falsos.
      } finally {
        if (active) {
          refreshTimer = setTimeout(() => {
            void checkPendingOrders();
          }, 5000);
        }
      }
    };
    void checkPendingOrders();
    return () => {
      active = false;
      if (refreshTimer !== undefined) clearTimeout(refreshTimer);
    };
  }, [token, view, useCases]);

  useEffect(() => {
    if (!token) {
      preparationSnapshot.current = null;
      setCancelAlerts([]);
      return;
    }
    let active = true;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let daySnapshot = '';
    const checkCanceledOrders = async () => {
      try {
        const day = RestaurantDate.today();
        const [pending, ongoing, history] = await Promise.all([
          useCases.orders.listPending.execute({ date: day }),
          useCases.orders.listPreparing.execute({ date: day }),
          useCases.orders.listHistory.execute({ date: day }),
        ]);
        if (!active) return;
        const currentOrders = new Map([...pending, ...ongoing].map((order) => [order.id, order] as const));
        if (daySnapshot === day && preparationSnapshot.current) {
          const canceledOrders = useCases.orders.findCanceledTableOrders.execute({
            previous: preparationSnapshot.current,
            current: currentOrders,
            history,
            acknowledgedIds: acknowledgedCancellationIds.current,
          });
          if (canceledOrders.length && useCases.notifications.getSoundPreference.execute()) {
            setCancelAlerts((previous) => {
              const alertedIds = new Set(previous.map((order) => order.id));
              return [...previous, ...canceledOrders.filter((order) => !alertedIds.has(order.id))];
            });
            orderAlert.playCancellation();
          }
        }
        preparationSnapshot.current = currentOrders;
        daySnapshot = day;
      } catch {
        // Falha de consulta não redefine a referência, evitando falsos alertas.
      } finally {
        if (active) {
          refreshTimer = setTimeout(() => {
            void checkCanceledOrders();
          }, 5000);
        }
      }
    };
    void checkCanceledOrders();
    return () => {
      active = false;
      if (refreshTimer !== undefined) clearTimeout(refreshTimer);
    };
  }, [token, view, useCases]);

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
  }, [token, useCases]);

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
