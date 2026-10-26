import { useEffect, useState } from 'react';
import { useApplicationServices } from '../global/useApplicationServices';
import type { ClosedComanda } from '../../../application/dtos/tables';
import { RestaurantDate } from '../../../application/utils/order-date.ts';
import { usePrivateContext } from '../global/usePrivateContext';

function historyErrorMessage(cause: unknown): string {
  const message = cause instanceof Error ? cause.message : 'Falha ao carregar o histórico.';
  const routeUnavailable = /404|not found|não encontrada/i.test(message);
  return routeUnavailable
    ? 'A rota de histórico de comandas não está disponível no servidor. É necessário publicar a atualização do backend.'
    : message;
}

export function useClosedComandaHistory() {
  const useCases = useApplicationServices();
  const { session } = usePrivateContext();
  const token = session?.token ?? '';
  const [date, setDate] = useState(RestaurantDate.today);
  const [comandas, setComandas] = useState<ClosedComanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [requestedDate, setRequestedDate] = useState(date);
  const [refreshKey, setRefreshKey] = useState(0);
  const [originFilter, setOriginFilter] = useState<'ALL' | 'TABLE' | 'ONLINE'>('ALL');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    async function loadHistory() {
      try {
        const history = await useCases.tables.listClosedComandas.execute({ date: requestedDate });
        if (active) setComandas(history.comandas);
      } catch (cause) {
        if (active) {
          setComandas([]);
          setError(historyErrorMessage(cause));
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadHistory();
    return () => {
      active = false;
    };
  }, [token, requestedDate, refreshKey]);

  const visibleComandas = comandas.filter((item) => {
    const origin = item.origin ?? 'TABLE';
    return originFilter === 'ALL' || origin === originFilter;
  });
  const total = visibleComandas.reduce((sum, item) => sum + Number(item.session.closedTotal ?? 0), 0);
  const completedOrders = visibleComandas.flatMap(({ tableNumber, session }) =>
    session.orders.filter((order) => order.status === 'COMPLETED').map((order) => ({ tableNumber, session, order })),
  );

  return {
    date,
    setDate,
    loading,
    error,
    expanded,
    setExpanded,
    requestedDate,
    setRequestedDate,
    setRefreshKey,
    originFilter,
    setOriginFilter,
    visibleComandas,
    total,
    completedOrders,
  };
}
