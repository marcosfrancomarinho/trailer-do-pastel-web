import { useCallback, useEffect, useRef, useState } from 'react';
import { useApplicationServices } from '../global/useApplicationServices';
import type { OrderHistoryItem, PendingOrder, PreparingOrder } from '../../../application/dtos/orders';
import { RestaurantDate } from '../../../application/utils/order-date.ts';
import { orderAlert } from '../../../infrastructure/audio/order-alert';
import { useActionDialog } from '../../components/shared/ActionDialog';
import { usePrivateContext } from '../global/usePrivateContext';

export type Tab = 'pending' | 'preparing' | 'completed' | 'canceled';
export type Order = PendingOrder | PreparingOrder | OrderHistoryItem;

function ordersFromDate<T extends Order>(orders: T[], date: string): T[] {
  return orders.filter((order) => RestaurantDate.key(order.createdAt) === date);
}

function matchesOrderSearch(order: Order, search: string, phoneDigits: string): boolean {
  const matchesName = order.customerName.toLocaleLowerCase('pt-BR').includes(search);
  const matchesPhone = order.customerPhone.toLocaleLowerCase('pt-BR').includes(search);
  const matchesPhoneDigits = phoneDigits.length >= 3 && order.customerPhone.replace(/\D/g, '').includes(phoneDigits);
  const matchesId = order.id.toLocaleLowerCase('pt-BR').includes(search);
  const tableLabel = order.tableNumber == null ? '' : `mesa ${order.tableNumber}`;
  const matchesTable = tableLabel.includes(search);

  return matchesName || matchesPhone || matchesPhoneDigits || matchesId || matchesTable;
}

export function useOrderBoard() {
  const useCases = useApplicationServices();
  const { session } = usePrivateContext();
  const token = session?.token ?? '';
  const [tab, setTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Order[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [pending, setPending] = useState<PendingOrder[]>([]);
  const [preparing, setPreparing] = useState<PreparingOrder[]>([]);
  const [history, setHistory] = useState<OrderHistoryItem[]>([]);
  const [busyId, setBusyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [printId, setPrintId] = useState<string | null>(null);
  const [todayKey, setTodayKey] = useState(RestaurantDate.today);
  const [dateMode, setDateMode] = useState<'today' | 'custom'>('today');
  const [chosenDate, setChosenDate] = useState(RestaurantDate.today);
  const [soundEnabled, setSoundEnabled] = useState(() => useCases.notifications.getSoundPreference.execute());
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [soundReady, setSoundReady] = useState(() => orderAlert.isReady());

  useEffect(() => {
    if (newOrderCount === 0) return;
    const dismissTimer = window.setTimeout(() => setNewOrderCount(0), 4000);
    return () => window.clearTimeout(dismissTimer);
  }, [newOrderCount]);

  useEffect(() => {
    const syncPreference = () => {
      const enabled = useCases.notifications.getSoundPreference.execute();
      setSoundEnabled(enabled);
      if (!enabled) {
        setNewOrderCount(0);
        setSoundReady(false);
      }
    };
    window.addEventListener('admin-notification-preference', syncPreference);
    window.addEventListener('storage', syncPreference);
    return () => {
      window.removeEventListener('admin-notification-preference', syncPreference);
      window.removeEventListener('storage', syncPreference);
    };
  }, [useCases]);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const seenPendingRef = useRef<Set<string>>(new Set());
  const seenDateRef = useRef('');

  const { confirm, notify, dialog } = useActionDialog();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const visibleDate = dateMode === 'today' ? todayKey : chosenDate;
  const currentFilterRef = useRef('');
  const currentFilter = token + '|' + tab + '|' + visibleDate;
  currentFilterRef.current = currentFilter;

  // O primeiro carregamento serve como referência: não toca para pedidos já existentes.
  const receivePending = useCallback(
    (orders: PendingOrder[], date: string) => {
      const filtered = ordersFromDate(orders, date);
      const ids = new Set(filtered.map((order) => order.id));
      if (seenDateRef.current !== date) {
        seenDateRef.current = date;
        seenPendingRef.current = ids;
      } else {
        const added = filtered.filter((order) => !seenPendingRef.current.has(order.id));
        if (added.length > 0 && date === RestaurantDate.today() && soundEnabledRef.current) {
          setNewOrderCount((previous) => previous + added.length);
          orderAlert.play();
        }
        for (const id of ids) seenPendingRef.current.add(id);
      }
      setPending(filtered);
    },
    [],
  );

  // Mantém o áudio entre as telas. Se o navegador suspender a saída,
  // reativa no próximo gesto permitido pelo navegador.
  useEffect(() => {
    if (!soundEnabled) return;
    let active = true;
    const unlock = () => {
      if (orderAlert.isReady()) {
        if (active) setSoundReady(true);
        return;
      }
      void orderAlert
        .enable()
        .then(() => {
          if (active) setSoundReady(true);
        })
        .catch(() => {
          if (active) setSoundReady(false);
        });
    };
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', unlock);
    window.addEventListener('focus', unlock);
    return () => {
      active = false;
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('visibilitychange', unlock);
      window.removeEventListener('focus', unlock);
    };
  }, [soundEnabled]);

  const toggleSound = async () => {
    if (soundEnabled) {
      setSoundEnabled(false);
      setSoundReady(false);
      useCases.notifications.setSoundPreference.execute(false);
      orderAlert.close();
      return;
    }
    try {
      await orderAlert.enable();
      setSoundEnabled(true);
      setSoundReady(true);
      useCases.notifications.setSoundPreference.execute(true);
      orderAlert.play();
    } catch {
      notify({
        title: 'Áudio bloqueado',
        message: 'Toque em Ativar som novamente e confira as permissões de áudio do navegador.',
        tone: 'error',
      });
    }
  };

  const unlockSound = async () => {
    try {
      await orderAlert.enable();
      setSoundReady(true);
    } catch {
      setSoundReady(false);
      notify({
        title: 'Áudio bloqueado',
        message: 'Confira o volume do dispositivo e a permissão de som do site.',
        tone: 'error',
      });
    }
  };

  // Atualiza apenas a data local; não consulta pedidos em segundo plano.
  useEffect(() => {
    const updateDay = () => setTodayKey(RestaurantDate.today());
    const timer = window.setInterval(updateDay, 30_000);
    window.addEventListener('focus', updateDay);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', updateDay);
    };
  }, []);

  const fetchTab = useCallback(
    async (currentTab: Tab, date: string) => {
      const filterKey = token + '|' + currentTab + '|' + date;

      if (currentTab === 'pending') {
        const result = await useCases.orders.listPending.execute({ date });
        if (currentFilterRef.current === filterKey) receivePending(result, date);
      } else if (currentTab === 'preparing') {
        const result = await useCases.orders.listPreparing.execute({ date });
        if (currentFilterRef.current === filterKey) setPreparing(ordersFromDate(result, date));
      } else {
        const result = await useCases.orders.listHistory.execute({ date });
        if (currentFilterRef.current === filterKey) setHistory(ordersFromDate(result, date));
      }
    },
    [token, receivePending, useCases],
  );

  // Apenas Pendentes usa polling. As demais abas consultam quando abertas.
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      try {
        if (tab === 'pending') {
          const result = await useCases.orders.listPending.execute({ date: visibleDate });
          if (active && currentFilterRef.current === token + '|' + tab + '|' + visibleDate) receivePending(result, visibleDate);
        } else if (tab === 'preparing') {
          const result = await useCases.orders.listPreparing.execute({ date: visibleDate });
          if (active && currentFilterRef.current === token + '|' + tab + '|' + visibleDate)
            setPreparing(ordersFromDate(result, visibleDate));
        } else {
          const result = await useCases.orders.listHistory.execute({ date: visibleDate });
          if (active && currentFilterRef.current === token + '|' + tab + '|' + visibleDate)
            setHistory(ordersFromDate(result, visibleDate));
        }
        if (active) setError('');
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Falha ao buscar pedidos.');
        }
      } finally {
        if (active) {
          setLoading(false);
          if (tab === 'pending') {
            timer = setTimeout(() => {
              void load();
            }, 5000);
          }
        }
      }
    };

    setLoading(true);
    setPending([]);
    setPreparing([]);
    setHistory([]);
    setSelectedId(null);
    setPrintId(null);
    void load();

    return () => {
      active = false;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [token, tab, visibleDate, receivePending, useCases]);

  // Continua monitorando novos pedidos mesmo nas demais abas do painel.
  useEffect(() => {
    if (tab === 'pending') return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      try {
        const orders = await useCases.orders.listPending.execute({ date: todayKey });
        if (active) receivePending(orders, todayKey);
      } catch {
        // A tela atual mantém seu próprio tratamento de erro.
      } finally {
        if (active) {
          timer = setTimeout(() => {
            void check();
          }, 5000);
        }
      }
    };
    void check();
    return () => {
      active = false;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [tab, token, todayKey, receivePending, useCases]);

  const refresh = async () => {
    setLoading(true);
    try {
      await fetchTab(tab, visibleDate);
      // A busca usa uma lista própria; atualizá-la após alterar o status
      // impede que o card continue exibindo dados anteriores.
      if (debouncedSearch) {
        const [allPending, allPreparing, allHistory] = await Promise.all([
          useCases.orders.listPending.execute({ date: visibleDate }),
          useCases.orders.listPreparing.execute({ date: visibleDate }),
          useCases.orders.listHistory.execute({ date: visibleDate }),
        ]);
        setSearchResults(ordersFromDate([...allPending, ...allPreparing, ...allHistory], visibleDate));
      }
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar os pedidos.');
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (id: string, status: string) => {
    if (busyId) return;

    const actionLabel: Record<string, string> = {
      CONFIRMED: 'aceitar',
      PREPARING: 'iniciar o preparo de',
      COMPLETED: 'concluir',
      CANCELED: 'cancelar',
    };
    const verb = actionLabel[status] ?? 'alterar';
    const approved = await confirm({
      title: status === 'CANCELED' ? 'Cancelar pedido?' : status === 'COMPLETED' ? 'Concluir pedido?' : 'Confirmar alteração?',
      message:
        status === 'COMPLETED'
          ? 'Confirmar que o pedido #' + id.slice(0, 8) + ' já foi atendido? Ele será concluído sem passar pelo preparo.'
          : 'Deseja ' + verb + ' o pedido #' + id.slice(0, 8) + '?',
      confirmLabel: status === 'CANCELED' ? 'Sim, cancelar' : 'Confirmar',
      tone: status === 'CANCELED' ? 'warning' : 'info',
    });
    if (!approved) return;

    setBusyId(id);
    try {
      await useCases.orders.updateStatus.execute({ orderId: id, status });
      await refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Falha ao alterar status.';
      setError(message);
      notify({ title: 'Não foi possível atualizar', message, tone: 'error' });
    } finally {
      setBusyId('');
    }
  };

  // Busca global: consulta pedidos de todos os estados e datas, sem afetar o polling.
  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError('');
      return;
    }
    let active = true;
    setSearchLoading(true);
    setSearchError('');
    void Promise.all([
      useCases.orders.listPending.execute({ date: visibleDate }),
      useCases.orders.listPreparing.execute({ date: visibleDate }),
      useCases.orders.listHistory.execute({ date: visibleDate }),
    ])
      .then(([allPending, allPreparing, allHistory]) => {
        if (!active) return;
        setSearchResults(ordersFromDate([...allPending, ...allPreparing, ...allHistory], visibleDate));
      })
      .catch((cause) => {
        if (active) setSearchError(cause instanceof Error ? cause.message : 'Erro na busca de pedidos.');
      })
      .finally(() => {
        if (active) setSearchLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, debouncedSearch, visibleDate, useCases]);

  const completed = history.filter((order) => order.status === 'COMPLETED');
  const canceled = history.filter((order) => order.status === 'CANCELED');
  const groups: Record<Tab, Order[]> = { pending, preparing, completed, canceled };
  const currentOrders = ordersFromDate(groups[tab], visibleDate);
  const normalizedSearch = debouncedSearch.toLocaleLowerCase('pt-BR');
  const searchDigits = debouncedSearch.replace(/\D/g, '');
  const displayedOrders = debouncedSearch ? searchResults : currentOrders;
  const filteredOrders = displayedOrders.filter(
    (order) => !normalizedSearch || matchesOrderSearch(order, normalizedSearch, searchDigits),
  );
  const selectedOrder = (debouncedSearch ? filteredOrders : currentOrders).find((order) => order.id === selectedId);
  const printOrder = (debouncedSearch ? filteredOrders : currentOrders).find((order) => order.id === printId);

  return {
    tab,
    setTab,
    search,
    setSearch,
    debouncedSearch,
    setDebouncedSearch,
    searchLoading,
    searchError,
    busyId,
    loading,
    error,
    setSelectedId,
    setPrintId,
    todayKey,
    dateMode,
    setDateMode,
    chosenDate,
    setChosenDate,
    soundEnabled,
    newOrderCount,
    setNewOrderCount,
    soundReady,
    dialog,
    toggleSound,
    refresh,
    unlockSound,
    visibleDate,
    filteredOrders,
    changeStatus,
    selectedOrder,
    printOrder,
  };
}
