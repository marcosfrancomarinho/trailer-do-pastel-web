import { useAdminOrders, type Order, type Tab } from '../../hooks/admin/useAdminOrders';
import { brl } from '../../../shared/formatters/currency';
import OrderDetails from './OrderDetails';
import OrderReceipt from './OrderReceipt';
import BrazilianDateInput from '../shared/BrazilianDateInput';

const tabs: { id: Tab; label: string }[] = [
  { id: 'pending', label: 'Pendentes' },
  { id: 'preparing', label: 'Preparando' },
  { id: 'completed', label: 'Concluídos' },
  { id: 'canceled', label: 'Cancelados' },
];

const statusLabels: Record<string, string> = {
  PENDING: 'Aguardando aceite',
  CONFIRMED: 'Aceito',
  PREPARING: 'Em preparo',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
};

type ActionIcon = 'check' | 'preparing';

function nextAction(status: string): { label: string; next: string; icon: ActionIcon } | null {
  if (status === 'PENDING') return { label: 'Aceitar pedido', next: 'PREPARING', icon: 'check' };
  if (status === 'CONFIRMED') return { label: 'Iniciar preparo', next: 'PREPARING', icon: 'preparing' };
  if (status === 'PREPARING') return { label: 'Concluir pedido', next: 'COMPLETED', icon: 'check' };
  return null;
}

function StatusActionIcon({ icon }: { icon: ActionIcon }) {
  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className='h-5 w-5'
    >
      {icon === 'check' ? (
        <path d='m4.5 12 5 5 10-10' />
      ) : (
        <>
          <path d='M4 12h16l-1 8H5l-1-8Z' />
          <path d='M3 12h18' />
          <path d='M7 9c-1-1-1-2 0-3M12 9c-1-1-1-2 0-3M17 9c-1-1-1-2 0-3' />
        </>
      )}
    </svg>
  );
}

function OrderCard({
  order,
  busy,
  onStatusChange,
  onOpen,
  onPrint,
}: {
  order: Order;
  busy: boolean;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onOpen: (order: Order) => void;
  onPrint: (order: Order) => void;
}) {
  const action = nextAction(order.status);
  const itemsCount = order.items.reduce((total, item) => total + item.quantity, 0);
  const hasObservation = Boolean(order.observation?.trim());
  const isInternalOrder = order.tableId != null || order.tableNumber != null;
  let orderOriginLabel = 'Pedido online';
  if (isInternalOrder) {
    orderOriginLabel = order.tableNumber != null ? `Mesa ${order.tableNumber}` : 'Pedido de mesa';
  }
  const originBadgeStyle = isInternalOrder
    ? 'border-amber-300 bg-amber-300/10 text-amber-100'
    : 'border-cyan-300 bg-cyan-300/10 text-cyan-100';

  return (
    <article className='flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#37637b] bg-[#112e43] shadow-sm'>
      <div className='flex flex-wrap items-center justify-between gap-2 border-b border-[#31566e] px-2.5 py-1.5'>
        <span className='text-sm font-extrabold tracking-wider text-cyan-200'>#{order.id.slice(0, 8)}</span>
        <div className='flex items-center gap-1.5'>
          <span className='rounded-full bg-[#264c61] px-3 py-1 text-sm font-bold text-white'>{statusLabels[order.status]}</span>
          {hasObservation && (
            <span
              role='img'
              aria-label='Pedido com observação'
              title='Pedido com observação'
              className='grid h-7 w-7 shrink-0 place-items-center rounded-full border border-red-300 bg-red-700 text-white'
            >
              <svg
                aria-hidden='true'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinecap='round'
                className='h-4 w-4'
              >
                <path d='M12 5v9' />
                <path d='M12 18h.01' />
              </svg>
            </span>
          )}
        </div>
      </div>

      <div className='flex flex-1 flex-col gap-1.5 p-2.5'>
        <div className='flex flex-wrap items-start justify-between gap-2'>
          <div className='min-w-0'>
            <h3 className='break-words text-base font-black text-white'>{order.customerName}</h3>
          </div>
          <strong className='shrink-0 text-base font-black text-amber-300'>{brl(order.total)}</strong>
        </div>

        <p className='text-sm text-slate-300'>
          {itemsCount} {itemsCount === 1 ? 'item' : 'itens'} ·{' '}
          {new Date(order.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' })}
        </p>

        <span className={'inline-flex items-center gap-2 self-start rounded-lg border-2 px-2.5 py-1.5 text-sm font-bold ' + originBadgeStyle}>
          <svg
            aria-hidden='true'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='h-5 w-5 shrink-0'
          >
            {isInternalOrder ? (
              <>
                <path d='M4 8h16l-1 4H5L4 8Z' />
                <path d='m7 12-1 8m11-8 1 8' />
              </>
            ) : (
              <>
                <path d='M4 8h16l-1 12H5L4 8Z' />
                <path d='M9 9V6a3 3 0 0 1 6 0v3' />
              </>
            )}
          </svg>
          {orderOriginLabel}
        </span>
        <div className='mt-auto flex flex-wrap justify-end gap-1.5 pt-1' role='group' aria-label={'Ações do pedido ' + order.id.slice(0, 8)}>
          <button
            type='button'
            onClick={() => onOpen(order)}
            className='grid h-9 w-9 place-items-center rounded-lg border border-cyan-400 bg-cyan-700 text-lg leading-none text-white hover:bg-cyan-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300'
            aria-label={'Ver detalhes do pedido ' + order.id.slice(0, 8)}
            title='Ver detalhes'
          >
            <svg
              aria-hidden='true'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='h-5 w-5'
            >
              <path d='M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z' />
              <circle cx='12' cy='12' r='3' />
            </svg>
          </button>
          <button
            type='button'
            onClick={() => onPrint(order)}
            className='grid h-9 w-9 place-items-center rounded-lg border border-violet-400 bg-violet-700 text-lg leading-none text-white hover:bg-violet-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300'
            aria-label={'Imprimir pedido ' + order.id.slice(0, 8)}
            title='Imprimir pedido'
          >
            <svg
              aria-hidden='true'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='h-5 w-5'
            >
              <path d='M6 9V3h12v6' />
              <path d='M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2' />
              <path d='M6 14h12v7H6z' />
              <path d='M18 12h.01' />
            </svg>
          </button>
          {action && (
            <button
              type='button'
              disabled={busy}
              onClick={() => void onStatusChange(order.id, action.next)}
              aria-label={action.label + ' #' + order.id.slice(0, 8)}
              title={action.label}
              className='grid h-9 w-9 place-items-center rounded-lg bg-[#ffca28] text-lg font-extrabold leading-none text-[#082739] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:opacity-60'
            >
              <StatusActionIcon icon={action.icon} />
            </button>
          )}
          {order.status === 'PENDING' && (
            <button
              type='button'
              disabled={busy}
              onClick={() => void onStatusChange(order.id, 'COMPLETED')}
              aria-label={'Concluir pedido diretamente ' + order.id.slice(0, 8)}
              title='Concluir direto, sem passar pelo preparo'
              className='grid h-9 w-9 place-items-center rounded-lg border border-emerald-300 bg-[#146044] text-lg leading-none text-white hover:bg-[#187652] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 disabled:opacity-60'
            >
              <svg
                aria-hidden='true'
                viewBox='0 0 24 24'
                fill='currentColor'
                className='h-5 w-5 text-white'
              >
                <polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2' />
              </svg>
            </button>
          )}
          {action && (
            <button
              type='button'
              disabled={busy}
              onClick={() => void onStatusChange(order.id, 'CANCELED')}
              aria-label={'Cancelar pedido ' + order.id.slice(0, 8)}
              title='Cancelar pedido'
              className='grid h-9 w-9 place-items-center rounded-lg border border-red-300 bg-[#512832] text-lg font-bold leading-none text-white hover:bg-[#69333f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:opacity-60'
            >
              <span aria-hidden='true'>✕</span>
            </button>
        </div>
      </div>
    </article>
  );
}

export default function AdminOrders() {
  const {
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
  } = useAdminOrders();

  return (
    <section className='space-y-4' aria-label='Painel de pedidos'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='text-xl font-black text-white sm:text-2xl'>Pedidos</h2>
          <p className='text-xs text-slate-300'>
            {tab === 'pending' ? 'Atualização automática' : 'Consulte os pedidos por situação'}
          </p>
        </div>
        <div className='ml-auto flex items-center gap-2'>
          <button
            type='button'
            onClick={() => {
              void toggleSound();
            }}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? 'Desativar som e notificações' : 'Ativar som e notificações'}
            title={soundEnabled ? 'Desativar som e notificações' : 'Ativar som e notificações'}
            className={
              'grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition-colors sm:h-11 sm:w-11 ' +
              (soundEnabled ? 'border-[#ffca28]/60 bg-[#194258] text-[#ffca28]' : 'border-[#56879d] bg-[#194258] text-slate-300')
            }
          >
            <svg aria-hidden='true' viewBox='0 0 24 24' fill='none' stroke='currentColor'
              strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' className='h-5 w-5'>
              <path d='M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4' />
              {!soundEnabled && <path d='M3 3 21 21' />}
            </svg>
          </button>
          <button
              type='button'
              onClick={() => {
                void refresh();
              }}
              disabled={loading}
              aria-label='Atualizar pedidos'
              title='Atualizar pedidos'
              className='grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#56879d] bg-[#194258] text-white hover:bg-[#24556c] disabled:opacity-60 sm:h-11 sm:w-11'
            >
              <svg
                aria-hidden='true'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className={'h-5 w-5 ' + (loading ? 'animate-spin' : '')}
              >
                <path d='M20 11a8 8 0 1 0-2.35 5.65' />
                <path d='M20 4v7h-7' />
              </svg>
            </button>
        </div>
      </div>

      {soundEnabled && !soundReady && (
        <button
          type='button'
          onClick={() => {
            void unlockSound();
          }}
          className='w-full rounded-xl border border-amber-300 bg-[#4b3d1b] px-4 py-3 text-left text-sm font-bold text-white'
        >
          🔇 Som ainda não liberado pelo navegador. Toque aqui para liberar o áudio.
        </button>
      )}

      {newOrderCount > 0 && (
        <div
          role='status'
          className='flex items-center justify-between gap-3 rounded-xl border border-[#ffca28] bg-[#4b3d1b] px-4 py-3 text-sm font-bold text-white'
        >
          <span>
            🔔 {newOrderCount} {newOrderCount === 1 ? 'novo pedido recebido' : 'novos pedidos recebidos'}
          </span>
          <button
            type='button'
            onClick={() => setNewOrderCount(0)}
            className='rounded-lg border border-[#ffe3a6] px-3 py-2 text-xs text-white'
          >
            Dispensar
          </button>
        </div>
      )}

      <div className='flex flex-col gap-3 rounded-xl border border-[#315970] bg-[#102b40] p-3 sm:flex-row sm:items-center'>
        <div className='flex flex-wrap items-center gap-2' role='group' aria-label='Período dos pedidos'>
          <button
            type='button'
            aria-pressed={dateMode === 'today'}
            onClick={() => setDateMode('today')}
            className={
              'min-h-10 rounded-lg px-3 text-sm font-bold ' +
              (dateMode === 'today' ? 'bg-[#ffca28] text-[#082739]' : 'bg-[#1b4258] text-white')
            }
          >
            Hoje
          </button>
          <button
            type='button'
            aria-pressed={dateMode === 'custom'}
            onClick={() => {
              setChosenDate(visibleDate);
              setDateMode('custom');
            }}
            className={
              'min-h-10 rounded-lg px-3 text-sm font-bold ' +
              (dateMode === 'custom' ? 'bg-[#ffca28] text-[#082739]' : 'bg-[#1b4258] text-white')
            }
          >
            Outra data
          </button>
        </div>
        {dateMode === 'custom' && (
          <BrazilianDateInput
            id='admin-orders-date'
            maxDate={todayKey}
            value={chosenDate}
            onChange={setChosenDate}
            className='w-full sm:w-44'
            ariaLabel='Selecionar data dos pedidos'
          />
        )}
        <div className='relative min-w-0 flex-1'>
          <label className='sr-only' htmlFor='admin-order-search'>
            Buscar pedido
          </label>
          <input
            id='admin-order-search'
            type='search'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='⌕ Buscar nome, telefone, ID ou mesa'
            autoComplete='off'
            className='min-h-11 w-full rounded-lg border border-[#79a5ba] bg-white px-3 pr-12 text-sm text-[#09283b] placeholder:text-slate-500'
          />
          {search && (
            <button
              type='button'
              onClick={() => {
                setSearch('');
                setDebouncedSearch('');
              }}
              className='absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm font-bold text-[#09283b]'
              aria-label='Limpar busca'
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {!debouncedSearch && (
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-4' role='tablist' aria-label='Situação dos pedidos'>
          {tabs.map((option) => (
            <button
              key={option.id}
              type='button'
              role='tab'
              aria-selected={tab === option.id}
              onClick={() => setTab(option.id)}
              className={
                'min-h-12 min-w-0 rounded-lg border px-2 py-2 text-center text-xs font-bold leading-tight sm:px-3 sm:text-sm ' +
                (tab === option.id
                  ? 'border-[#ffca28] bg-[#ffca28] text-[#082739]'
                  : 'border-[#34637c] bg-[#173b51] text-white hover:bg-[#24536c]')
              }
            >
              <span className='block'>{option.label}</span>
              {tab === option.id && <strong className='block text-sm sm:text-lg'>{filteredOrders.length}</strong>}
            </button>
          ))}
        </div>
      )}

      {debouncedSearch && (
        <p className='text-sm font-bold text-cyan-100'>Resultados da busca na data selecionada ({filteredOrders.length})</p>
      )}
      {searchError && (
        <p role='alert' className='rounded-xl bg-[#522934] p-3 text-sm text-white'>
          {searchError}
        </p>
      )}
      {error && !debouncedSearch && (
        <p role='alert' className='rounded-xl bg-[#522934] p-3 text-sm text-white'>
          {error}
        </p>
      )}
      {(debouncedSearch ? searchLoading : loading) ? (
        <p className='text-slate-200'>Carregando pedidos...</p>
      ) : filteredOrders.length === 0 ? (
        <p className='rounded-xl border border-[#345971] bg-[#112e43] p-6 text-center text-slate-200'>
          {debouncedSearch
            ? 'Nenhum pedido encontrado para esta pesquisa.'
            : `Nenhum pedido em ${tabs.find((option) => option.id === tab)?.label.toLowerCase()}.`}
        </p>
      ) : (
        <div className='grid min-w-0 gap-2.5 md:grid-cols-2 lg:grid-cols-3'>
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              busy={busyId === order.id}
              onStatusChange={changeStatus}
              onOpen={(order) => setSelectedId(order.id)}
              onPrint={(order) => setPrintId(order.id)}
            />
          ))}
        </div>
      )}
      {selectedOrder && <OrderDetails order={selectedOrder} onClose={() => setSelectedId(null)} />}
      {printOrder && <OrderReceipt order={printOrder} onClose={() => setPrintId(null)} />}
      {dialog}
    </section>
  );
}
