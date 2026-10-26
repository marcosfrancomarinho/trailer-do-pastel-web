import { useEffect } from 'react';
import type { OrderHistoryItem, PendingOrder, PreparingOrder } from '../../../application/dtos/orders';
import { brl } from '../../../shared/formatters/currency';
import { useOrderSessionId } from '../../hooks/admin/useOrderSessionId';
import CopyId from '../shared/CopyId';

export type AdminOrder = PendingOrder | PreparingOrder | OrderHistoryItem;

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em preparo',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
};

const statusStyles: Record<string, string> = {
  PENDING: 'border-amber-300 bg-amber-300/15 text-amber-100',
  CONFIRMED: 'border-cyan-300 bg-cyan-300/15 text-cyan-100',
  PREPARING: 'border-cyan-300 bg-cyan-300/15 text-cyan-100',
  COMPLETED: 'border-emerald-300 bg-emerald-300/15 text-emerald-100',
  CANCELED: 'border-red-300 bg-red-300/15 text-red-100',
};

const formatDateTime = (value: string) => new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' });

export default function OrderDetails({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  const { sessionId: comandaId, loading: comandaLoading } = useOrderSessionId(order.tableId, order.id);
  const isTableOrder = order.tableId != null || order.tableNumber != null;
  const itemsCount = order.items.reduce((total, item) => total + item.quantity, 0);
  const observation = order.observation?.trim();
  let originLabel = 'Pedido online';
  if (isTableOrder) {
    originLabel = order.tableNumber != null ? `Mesa ${order.tableNumber}` : 'Pedido de mesa';
  }
  let comandaLabel = 'Não disponível';
  if (comandaLoading) comandaLabel = 'Carregando...';
  else if (comandaId) comandaLabel = comandaId.slice(0, 8).toUpperCase();

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div
      role='presentation'
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role='dialog'
        aria-modal='true'
        aria-labelledby='order-details-title'
        className='flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#467991] bg-[#102c40] text-white shadow-2xl'
      >
        <header className='flex shrink-0 items-start justify-between gap-3 border-b border-[#365f74] px-4 py-4 sm:px-6'>
          <div className='min-w-0'>
            <p className='text-xs font-black uppercase tracking-wider text-cyan-200'>Detalhes do pedido</p>
            <div className='mt-2 flex flex-wrap items-center gap-2'>
              <h2 id='order-details-title' className='text-xl font-black sm:text-2xl'>
                <CopyId id={order.id} label={'#' + order.id.slice(0, 8)} />
              </h2>
              <span className={'rounded-full border px-2.5 py-1 text-xs font-extrabold ' + (statusStyles[order.status] ?? 'border-slate-400 text-slate-100')}>
                {statusLabels[order.status] ?? order.status}
              </span>
            </div>
          </div>
          <button
            type='button'
            autoFocus
            onClick={onClose}
            aria-label='Fechar detalhes do pedido'
            className='grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#467991] bg-[#24465a] text-lg font-bold text-white hover:bg-[#315970] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300'
          >
            ✕
          </button>
        </header>

        <div className='min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5'>
          <section aria-label='Informações do pedido' className='grid gap-3 sm:grid-cols-2'>
            <div className='rounded-xl border border-[#365f74] bg-[#18394e] p-4'>
              <p className='text-xs font-bold uppercase tracking-wide text-cyan-200'>Cliente</p>
              <strong className='mt-1 block break-words text-lg font-black'>{order.customerName}</strong>
              {!isTableOrder && order.customerPhone && <p className='mt-1 text-sm text-slate-200'>{order.customerPhone}</p>}
            </div>
            <div className='rounded-xl border border-[#365f74] bg-[#18394e] p-4'>
              <p className='text-xs font-bold uppercase tracking-wide text-cyan-200'>Origem</p>
              <strong className={'mt-1 block text-lg font-black ' + (isTableOrder ? 'text-amber-200' : 'text-cyan-100')}>
                {originLabel}
              </strong>
              {order.tableId != null && <p className='mt-1 break-words text-sm text-slate-200'>Comanda: {comandaLabel}</p>}
            </div>
          </section>

          <div className='grid gap-3 text-sm sm:grid-cols-2'>
            <div className='rounded-lg border border-[#365f74] px-3 py-2'>
              <p className='text-xs font-bold uppercase tracking-wide text-slate-300'>Feito em</p>
              <time dateTime={order.createdAt} className='mt-1 block font-semibold'>{formatDateTime(order.createdAt)}</time>
            </div>
            {'updatedAt' in order && (
              <div className='rounded-lg border border-[#365f74] px-3 py-2'>
                <p className='text-xs font-bold uppercase tracking-wide text-slate-300'>Atualizado em</p>
                <time dateTime={order.updatedAt} className='mt-1 block font-semibold'>{formatDateTime(order.updatedAt)}</time>
              </div>
            )}
          </div>

          {observation && (
            <aside aria-label='Observação do pedido' className='rounded-xl border-l-4 border-red-400 bg-[#512832] p-4'>
              <div className='flex items-center gap-2 text-red-100'>
                <span aria-hidden='true' className='grid h-6 w-6 place-items-center rounded-full bg-red-500 text-sm font-black text-white'>
                  !
                </span>
                <h3 className='font-black'>Observação</h3>
              </div>
              <p className='mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-white'>{observation}</p>
            </aside>
          )}

          <section aria-labelledby='order-items-title'>
            <div className='flex items-center justify-between gap-3'>
              <h3 id='order-items-title' className='text-lg font-black'>Itens do pedido</h3>
              <span className='rounded-full border border-[#467991] bg-[#1b4056] px-2.5 py-1 text-xs font-bold text-cyan-100'>
                {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
              </span>
            </div>
            <div className='mt-3 space-y-2'>
              {order.items.map((item, index) => (
                <div key={index} className='rounded-xl border border-[#365f74] bg-[#16384c] p-3 sm:p-4'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex min-w-0 items-start gap-2'>
                      <span className='grid h-7 min-w-7 place-items-center rounded-md bg-[#27576f] px-1 text-xs font-black text-cyan-100'>
                        {item.quantity}×
                      </span>
                      <strong className='break-words leading-7'>{item.productName}</strong>
                    </div>
                    <strong className='shrink-0 font-black text-amber-200'>{brl(Number(item.unitPrice) * item.quantity)}</strong>
                  </div>
                  {item.additions.length > 0 && (
                    <ul className='mt-3 space-y-1 border-l-2 border-cyan-400/60 pl-3 text-sm text-slate-200'>
                      {item.additions.map((addition, extraIndex) => (
                        <li key={extraIndex} className='flex items-start justify-between gap-3'>
                          <span className='min-w-0 break-words'>+ {addition.quantity}× {addition.additionName}</span>
                          <span className='shrink-0'>{brl(Number(addition.unitPrice) * addition.quantity * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>

          {'histories' in order && order.histories.length > 0 && (
            <section aria-labelledby='order-history-title'>
              <h3 id='order-history-title' className='mb-3 font-black'>Histórico do pedido</h3>
              <ol className='space-y-2 text-sm'>
                {order.histories.map((entry, index) => (
                  <li key={index} className='flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#365f74] bg-[#18394e] px-3 py-2'>
                    <span className='font-bold'>{statusLabels[entry.status] ?? entry.status}</span>
                    <time dateTime={entry.changedAt} className='text-slate-300'>{formatDateTime(entry.changedAt)}</time>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <footer className='flex shrink-0 items-center justify-between gap-3 border-t border-[#467991] bg-[#173b50] px-4 py-4 sm:px-6'>
          <span className='font-bold text-slate-100'>Total do pedido</span>
          <strong className='text-2xl font-black text-amber-300'>{brl(order.total)}</strong>
        </footer>
      </section>
    </div>
  );
}
