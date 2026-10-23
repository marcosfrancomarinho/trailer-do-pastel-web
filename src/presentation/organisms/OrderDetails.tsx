import { useEffect } from 'react'
import type { OrderHistoryItem, PendingOrder, PreparingOrder } from '../../domain/models'
import { brl } from '../../api'

export type AdminOrder = PendingOrder | PreparingOrder | OrderHistoryItem

const names: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em preparo',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
}

const date = (value: string) => new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' })

export default function OrderDetails({
  order,
  onClose,
}: {
  order: AdminOrder
  onClose: () => void
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
        className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[#467991] bg-[#102c40] p-5 text-white shadow-2xl sm:p-7"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-cyan-200">Detalhes do pedido</p>
            <h2 id="order-details-title" className="mt-1 text-2xl font-black">
              #{order.id.slice(0, 8)}
            </h2>
            <p className="mt-1 text-sm text-slate-300">{names[order.status] ?? order.status}</p>
          </div>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Fechar detalhes do pedido"
            className="rounded-xl border border-[#467991] bg-[#24465a] px-3 py-2 font-bold text-white"
          >
            ✕
          </button>
        </header>

        <div className="mt-5 rounded-xl bg-[#1b4056] p-4">
          <h3 className="font-extrabold">{order.customerName}</h3>
          <p className="text-sm text-slate-200">{order.customerPhone}</p>
          <p className="mt-2 text-xs text-slate-300">Feito em {date(order.createdAt)}</p>
          {'updatedAt' in order && (
            <p className="text-xs text-slate-300">Atualizado em {date(order.updatedAt)}</p>
          )}
        </div>

        <h3 className="mt-6 mb-3 text-lg font-extrabold">Itens do pedido</h3>
        <div className="divide-y divide-[#365f74] rounded-xl border border-[#365f74]">
          {order.items.map((item, index) => (
            <div key={index} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-4">
                <strong>{item.quantity}× {item.productName}</strong>
                <span className="shrink-0 font-bold">{brl(Number(item.unitPrice) * item.quantity)}</span>
              </div>
              {item.additions.map((addition, extraIndex) => (
                <div key={extraIndex} className="flex justify-between gap-4 pl-3 text-sm text-slate-200">
                  <span>+ {addition.quantity}× {addition.additionName}</span>
                  <span className="shrink-0">{brl(Number(addition.unitPrice) * addition.quantity * item.quantity)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#467991] pt-4 text-lg">
          <span className="font-bold">Total do pedido</span>
          <strong className="text-amber-300">{brl(order.total)}</strong>
        </div>

        {'histories' in order && order.histories.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 font-extrabold">Histórico do pedido</h3>
            <ol className="space-y-2 text-sm text-slate-200">
              {order.histories.map((entry, index) => (
                <li key={index} className="flex flex-wrap justify-between gap-2 rounded-lg bg-[#1b4056] p-3">
                  <span>{names[entry.status] ?? entry.status}</span>
                  <time>{date(entry.changedAt)}</time>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>
    </div>
  )
}
