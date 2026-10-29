import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { CartItem } from '../../../application/dtos/cart';
import { brl } from '../../../shared/formatters/currency';
import { useApplicationServices } from '../global/useApplicationServices';
import { TableHasUnfinishedOrdersError } from '../../../application/errors/table-has-unfinished-orders-error.ts';
import type { Addition, Category, Product } from '../../../application/dtos/catalog';
import type { RestaurantTable, TableOrders } from '../../../application/dtos/tables';
import { useActionDialog } from '../../components/shared/ActionDialog';
import { usePrivateContext } from '../global/usePrivateContext';
import { ORDER_EVENT, ORDER_STREAM_READY } from '../../../infrastructure/http/order-event-stream';

const TABLE_ORDER_NAME = 'Trailer do Pastel';
const TABLE_ORDER_PHONE = '99984636486';
const PRODUCTS_PAGE_SIZE = 24;

export function useTableOverview() {
  const useCases = useApplicationServices();
  const { session } = usePrivateContext();
  const token = session?.token ?? '';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogError, setCatalogError] = useState('');
  const [storeClosed, setStoreClosed] = useState(false);

  const syncStoreStatus = useCallback(async () => {
    const store = await useCases.store.getStatus.execute();
    setStoreClosed(store.status === 'CLOSED');
    return store.status === 'CLOSED';
  }, [useCases]);

  useEffect(() => {
    void syncStoreStatus().catch(() => {});
    const onEvent = (event: Event) => {
      if (event.type === ORDER_STREAM_READY || (event instanceof CustomEvent && ['STORE_OPENED', 'STORE_CLOSED'].includes(event.detail?.type))) {
        void syncStoreStatus().catch(() => {});
      }
    };
    window.addEventListener(ORDER_EVENT, onEvent);
    window.addEventListener(ORDER_STREAM_READY, onEvent);
    window.addEventListener('focus', syncStoreStatus);
    return () => {
      window.removeEventListener(ORDER_EVENT, onEvent);
      window.removeEventListener(ORDER_STREAM_READY, onEvent);
      window.removeEventListener('focus', syncStoreStatus);
    };
  }, [syncStoreStatus]);

  const loadCatalog = useCallback(async () => {
    setCatalogError('');
    try {
      const catalog = await useCases.catalog.listCatalog.execute();
      setCategories(catalog.categories);
      setProducts(catalog.products);
    } catch (cause) {
      setCatalogError(cause instanceof Error ? cause.message : 'Falha ao carregar o cardápio.');
    }
  }, [useCases]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [readyTables, setReadyTables] = useState<Set<string>>(new Set());
  const [tableOrderStatuses, setTableOrderStatuses] = useState<Map<string, 'PENDING' | 'PREPARING' | 'COMPLETED'>>(new Map());
  const readyTablesRef = useRef(readyTables);
  const [selected, setSelected] = useState<string | null>(null);
  const [tableView, setTableView] = useState<'orders' | 'new'>('orders');
  const selectionRequest = useRef(0);
  const selectedRef = useRef<string | null>(null);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  const refreshInFlight = useRef<Promise<void> | null>(null);
  const cartPanelRef = useRef<HTMLElement | null>(null);
  const [cartFocusRequest, setCartFocusRequest] = useState(0);
  const [details, setDetails] = useState<TableOrders | null>(null);
  const [printTable, setPrintTable] = useState<TableOrders | null>(null);
  const [number, setNumber] = useState('');
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [observation, setObservation] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [additions, setAdditions] = useState<Addition[]>([]);
  const [additionsBusy, setAdditionsBusy] = useState(false);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [visibleProductCount, setVisibleProductCount] = useState(PRODUCTS_PAGE_SIZE);
  const draftCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const filteredProducts = useMemo(() => {
    const searchTerm = search.toLowerCase();
    return products.filter((item) => {
      const matchesCategory = category === 'all' || item.categoryId === category;
      const matchesSearch = `${item.name} ${item.description}`.toLowerCase().includes(searchTerm);
      return matchesCategory && matchesSearch;
    });
  }, [products, category, search]);
  const visibleProducts = filteredProducts.slice(0, visibleProductCount);
  const hasMoreProducts = visibleProductCount < filteredProducts.length;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Avisos temporários não devem ocupar permanentemente o mapa de mesas.
  useEffect(() => {
    if (!error) return;
    const timeout = window.setTimeout(() => setError(''), 5_000);
    return () => window.clearTimeout(timeout);
  }, [error]);
  const { confirm, notify, dialog } = useActionDialog();
  const availableAdditions = additions.filter((item) => item.available);
  const additionsPrice = additions.reduce((total, extra) => total + Number(extra.price) * (amounts[extra.id] || 0), 0);
  const customProductPrice = product ? quantity * (Number(product.price) + additionsPrice) : 0;

  const refresh = useCallback(
    (tableId?: string | null): Promise<void> => {
      // Deduplica GETs quando o POST e o SSE disparam atualizações ao mesmo tempo.
      if (refreshInFlight.current) return refreshInFlight.current;
      const request = (async () => {
        const currentTableId = tableId ?? selectedRef.current;
        const [overview, tableOrders] = await Promise.all([
          useCases.tables.listOverview.execute(readyTablesRef.current),
          currentTableId ? useCases.tables.listOrders.execute({ tableId: currentTableId }) : Promise.resolve(null),
        ]);
        setTables(overview.tables);
        readyTablesRef.current = overview.readyTableIds;
        setReadyTables(overview.readyTableIds);
        setTableOrderStatuses(overview.tableOrderStatuses);
        if (tableOrders && selectedRef.current === currentTableId) setDetails(tableOrders);
      })();
      refreshInFlight.current = request;
      void request.finally(() => {
        if (refreshInFlight.current === request) refreshInFlight.current = null;
      }).catch(() => {});
      return request;
    },
    [token, useCases],
  );

  useEffect(() => {
    let active = true;
    const update = () => {
      if (document.visibilityState !== 'visible') return;
      void refresh().catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Erro ao carregar mesas.');
      });
    };
    update();
    const onVisibility = () => { if (document.visibilityState === 'visible') update(); };
    window.addEventListener(ORDER_EVENT, update);
    window.addEventListener(ORDER_STREAM_READY, update);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      active = false;
      window.removeEventListener(ORDER_EVENT, update);
      window.removeEventListener(ORDER_STREAM_READY, update);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh]);

  function closeTable() {
    ++selectionRequest.current;
    setSelected(null);
    setDetails(null);
    setProduct(null);
    setError('');
  }

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !product && !printTable) closeTable();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected, product, printTable]);

  async function openTable(id: string) {
    const request = ++selectionRequest.current;
    if (selected === id) {
      closeTable();
      return;
    }
    setSelected(id);
    setDetails(null);
    setProduct(null);
    setCart([]);
    setVisibleProductCount(PRODUCTS_PAGE_SIZE);
    setError('');
    try {
      const tableOrders = await useCases.tables.listOrders.execute({ tableId: id });
      if (selectionRequest.current === request) {
        setDetails(tableOrders);
        setTableView(tableOrders.orders.length ? 'orders' : 'new');
      }
    } catch (cause) {
      if (selectionRequest.current === request) {
        setError(cause instanceof Error ? cause.message : 'Erro ao abrir mesa.');
      }
    }
  }

  function updateSearch(value: string) {
    setSearch(value);
    setVisibleProductCount(PRODUCTS_PAGE_SIZE);
  }

  function updateCategory(value: string) {
    setCategory(value);
    setVisibleProductCount(PRODUCTS_PAGE_SIZE);
  }

  function loadMoreProducts() {
    setVisibleProductCount((count) => count + PRODUCTS_PAGE_SIZE);
  }

  async function createTable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(number);
    if (!Number.isInteger(value) || value < 1) return;
    setBusy(true);
    setError('');
    try {
      await useCases.tables.create.execute({ number: value });
      setNumber('');
      setShowCreateTable(false);
      await refresh(selected);
      notify({ title: 'Mesa cadastrada', message: 'A mesa ' + value + ' foi criada.', tone: 'success' });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao cadastrar mesa.');
    } finally {
      setBusy(false);
    }
  }

  async function chooseProduct(item: Product) {
    if (!item.available) return;
    setProduct(item);
    setAmounts({});
    setQuantity(1);
    setAdditions([]);
    setAdditionsBusy(true);
    try {
      const productAdditions = await useCases.catalog.listProductAdditions.execute(item.id);
      setAdditions(productAdditions);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao buscar adicionais.');
      setProduct(null);
    } finally {
      setAdditionsBusy(false);
    }
  }

  useEffect(() => {
    if (cartFocusRequest === 0 || product) return;
    const frame = window.requestAnimationFrame(() => {
      cartPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [cartFocusRequest, product]);

  function addProduct() {
    if (!product || additionsBusy) return;
    setCart((currentCart) => {
      const updatedCart = useCases.cart.addItem.execute({ cart: currentCart, product, additions, amounts, quantity });
      return updatedCart;
    });
    setProduct(null);
    setCartFocusRequest((value) => value + 1);
  }

  function changeItemQuantity(key: string, change: number) {
    setCart((items) => {
      const updatedItems = items.map((item) => (item.key === key ? { ...item, quantity: item.quantity + change } : item));
      return updatedItems.filter((item) => item.quantity > 0);
    });
  }

  function removeItem(key: string) {
    setCart((items) => items.filter((item) => item.key !== key));
  }

  function changeAdditionAmount(id: string, change: number) {
    setAmounts((values) => ({
      ...values,
      [id]: Math.max(0, (values[id] || 0) + change),
    }));
  }

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !cart.length || busy) return;
    setBusy(true);
    setError('');
    try {
      if (await syncStoreStatus()) {
        notify({ title: 'Loja fechada', message: 'Abra a loja na administração antes de enviar pedidos de mesa.', tone: 'error' });
        return;
      }
      await useCases.orders.createForTable.execute({
        tableId: selected,
        customerName: TABLE_ORDER_NAME,
        customerPhone: TABLE_ORDER_PHONE,
        cart,
        observation,
      });
      setCart([]);
      setObservation('');
      // A criação já foi confirmada: mostre a aba de pedidos sem esperar dois GETs.
      setTableView('orders');
      notify({ title: 'Pedido lançado', message: 'Os produtos foram vinculados à mesa.', tone: 'success' });
      // Atualiza os dados em segundo plano; o SSE também notifica outros operadores.
      void refresh(selected).catch((cause) => {
        setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar a mesa.');
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Falha ao lançar pedido.';
      setError(message);
      notify({ title: 'Pedido não enviado', message, tone: 'error' });
      void syncStoreStatus().catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  async function release() {
    if (!selected || busy) return;
    const tableId = selected;
    setBusy(true);
    setError('');
    try {
      // Consulta o estado atual, pois a comanda pode ter mudado desde a abertura do modal.
      const { table, unfinishedCount } = await useCases.tables.getReleaseStatus.execute({ tableId });
      setDetails(table);
      if (unfinishedCount > 0) throw new TableHasUnfinishedOrdersError(unfinishedCount);
      const approved = await confirm({
        title: 'Liberar mesa?',
        message: 'A sessão será encerrada e o valor consumido ficará no histórico.',
        confirmLabel: 'Liberar mesa',
      });
      if (!approved) return;
      const result = await useCases.tables.release.execute({ tableId });
      await refresh(tableId);
      notify({ title: 'Mesa liberada', message: 'Total encerrado: ' + brl(result.closedTotal), tone: 'success' });
    } catch (cause) {
      if (cause instanceof TableHasUnfinishedOrdersError) {
        notify({
          title: 'Não é possível liberar a mesa',
          message:
            'Esta mesa possui ' +
            cause.count +
            (cause.count === 1 ? ' pedido pendente ou em preparo. ' : ' pedidos pendentes ou em preparo. ') +
            'Conclua ou cancele esses pedidos antes de liberar a mesa.',
          tone: 'error',
        });
        setTableView('orders');
        return;
      }
      const message = cause instanceof Error ? cause.message : 'Não foi possível liberar a mesa.';
      setError(message);
      notify({ title: 'Não foi possível liberar a mesa', message, tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function archiveTable() {
    if (!selected || !details || details.status !== 'FREE' || busy) return;
    const tableId = selected;
    const tableNumber = details.number;
    const approved = await confirm({
      title: 'Retirar mesa de uso?',
      message:
        'A mesa ' +
        tableNumber +
        ' deixará de aparecer no mapa. Seus pedidos e históricos serão preservados no servidor, e o número poderá ser reutilizado.',
      confirmLabel: 'Retirar mesa',
      tone: 'warning',
    });
    if (!approved) return;
    setBusy(true);
    setError('');
    try {
      await useCases.tables.archive.execute({ tableId });
      setSelected(null);
      setDetails(null);
      setTables((previous) => previous.filter((table) => table.id !== tableId));
      // SSE atualiza as outras sessões; não recarrega o mapa inteiro aqui.
      notify({
        title: 'Mesa retirada de uso',
        message: 'A mesa ' + tableNumber + ' foi arquivada com sucesso. O histórico foi preservado.',
        tone: 'success',
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível retirar a mesa.';
      setError(message);
      notify({ title: 'Não foi possível retirar a mesa', message, tone: 'error' });
      // Se ela ficou ocupada após a consulta, refaz a situação exibida.
      try {
        await refresh(tableId);
      } catch {
        // Mesa indisponível ou excluída em outra sessão.
      }
    } finally {
      setBusy(false);
    }
  }

  async function removeOrder(orderId: string) {
    if (!selected) return;
    const approved = await confirm({
      title: 'Cancelar pedido da mesa?',
      message: 'Esta ação cancela o pedido e retira seu valor do consumo da mesa.',
      confirmLabel: 'Cancelar pedido',
    });
    if (!approved) return;

    setBusy(true);
    setError('');
    try {
      await useCases.tables.removeOrder.execute({ tableId: selected, orderId });
      await refresh(selected);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erro ao cancelar pedido.');
    } finally {
      setBusy(false);
    }
  }

  return {
    categories,
    catalogError,
    storeClosed,
    loadCatalog,
    tables,
    readyTables,
    tableOrderStatuses,
    selected,
    tableView,
    setTableView,
    cartPanelRef,
    draftCount,
    details,
    printTable,
    setPrintTable,
    number,
    setNumber,
    showCreateTable,
    setShowCreateTable,
    observation,
    setObservation,
    product,
    setProduct,
    additions,
    additionsBusy,
    amounts,
    quantity,
    setQuantity,
    cart,
    search,
    updateSearch,
    category,
    updateCategory,
    filteredProducts,
    visibleProducts,
    hasMoreProducts,
    busy,
    error,
    dialog,
    availableAdditions,
    customProductPrice,
    closeTable,
    openTable,
    createTable,
    chooseProduct,
    addProduct,
    loadMoreProducts,
    createOrder,
    release,
    archiveTable,
    removeOrder,
    changeItemQuantity,
    removeItem,
    changeAdditionAmount,
  };
}
