import { QueryClient } from '@tanstack/react-query';
import type { ApplicationServices } from '../../di/container';

// Queries are keyed by session, date and resource to avoid sharing user-specific data.
export const orderQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 0, refetchOnWindowFocus: false } },
});

export const orderQueryKeys = {
  all: ['admin-orders'] as const,
  pending: (session: string, date: string) => ['admin-orders', session, 'pending', date] as const,
  preparing: (session: string, date: string) => ['admin-orders', session, 'preparing', date] as const,
  history: (session: string, date: string) => ['admin-orders', session, 'history', date] as const,
};

export function getPendingOrders(services: ApplicationServices, token: string, date: string) {
  return orderQueryClient.fetchQuery({
    queryKey: orderQueryKeys.pending(token, date),
    queryFn: () => services.orders.listPending.execute({ date }),
  });
}

export function getPreparingOrders(services: ApplicationServices, token: string, date: string) {
  return orderQueryClient.fetchQuery({
    queryKey: orderQueryKeys.preparing(token, date),
    queryFn: () => services.orders.listPreparing.execute({ date }),
  });
}

export function getOrderHistory(services: ApplicationServices, token: string, date: string) {
  return orderQueryClient.fetchQuery({
    queryKey: orderQueryKeys.history(token, date),
    queryFn: () => services.orders.listHistory.execute({ date }),
  });
}

export function invalidateOrderQueries() {
  // Mark data stale but let the mounted event handlers choose which GETs to issue.
  return orderQueryClient.invalidateQueries({ queryKey: orderQueryKeys.all, refetchType: 'none' });
}
