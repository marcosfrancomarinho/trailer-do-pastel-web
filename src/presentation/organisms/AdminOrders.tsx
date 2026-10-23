import { useCallback, useEffect, useState } from 'react'
import { restaurant } from '../../application/container'
import type { OrderHistoryItem, PendingOrder } from '../../domain/models'
import { brl } from '../../api'

type Tab = 'PENDING' | 'COMPLETED' | 'CANCELED'
type Order = PendingOrder | OrderHistoryItem

const tabs: { status: Tab; label: string }[] = [
  { status: 'PENDING', label: 'Pendentes' },
  { status: 'COMPLETED', label: 'Concluídos' },
  { status: 'CANCELED', label: 'Cancelados' },
]

const actions = [
  { status: 'CONFIRMED', label: 'Aceitar' },
  { status: 'PREPARING', label: 'Preparar' },
  { status: 'READY', label: 'Pronto' },
  { status: 'COMPLETED', label: 'Concluir' },
  { status: 'CANCELED', label: 'Cancelar' },
] as const

function OrderCard({
  order,
  busy,
  onStatusChange,
}: {
  order: Order
  busy: boolean
  onStatusChange: (id: string, status: string) => Promise<void>
}) {
  return (
    <article className="rounded-2xl border border-cyan-800 bg-[#112e43] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-cyan-300">PEDIDO #{order.id.slice(0, 8)}</p>
          <h3 className="mt-2 text-xl font-black text-white">{order.customerName}</h3>
          <p className="text-sm text-slate-200">{order.customerPhone}</p>
        </div>
        <strong className="text-lg text-amber-300">{brl(order.total)}</strong>
      </div>

      <div className="my-4 space-y-3 border-t border-cyan-900 pt-4">
        {order.items.map((item, index) => (
          <div key={index} className="text-sm text-slate-100">
            <strong>{item.quantity}× {item.productName}</strong>
            {item.additions.map((extra, extraIndex) => (
              <p key={extraIndex} className="text-slate-300">
                + {extra.quantity}× {extra.additionName}
              </p>
            ))}
          </div>
        ))}
      </div>

      {order.status === 'PENDING' ? (
        <div className="flex flex-wrap gap-2">
          {actions.map(action => (
            <button
              key={action.status}
              type="button"
              disabled={busy}
              onClick={() => void onStatusChange(order.id, action.status)}
              className={
                'rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50 ' +
                (action.status === 'CANCELED'
                  ? 'bg-red-100 text-red-900'
                  : 'bg-cyan-100 text-slate-900')
              }
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <span
            className={
              'inline-block rounded-full px-3 py-1 text-xs font-extrabold ' +
              (order.status === 'COMPLETED'
                ? 'bg-emerald-200 text-emerald-950'
                : 'bg-red-200 text-red-950')
            }
          >
            {order.status === 'COMPLETED' ? 'CONCLUÍDO' : 'CANCELADO'}
          </span>
          {'histories' in order && (
            <details className="mt-3 text-sm text-slate-200">
              <summary className="cursor-pointer font-semibold">Ver histórico de alterações</summary>
              <ol className="mt-2 space-y-1 border-l-2 border-cyan-700 pl-3">
                {order.histories.map((entry, index) => (
                  <li key={index}>
                    {entry.status} · {new Date(entry.changedAt).toLocaleString('pt-BR')}
                  </li>
                ))}
              </ol>
            </details>
          )}
        </div>
      )}
    </article>
  )
}

export default function AdminOrders({ token }: { token: string }) {
  const [tab, setTab] = useState<Tab>('PENDING')
  const [pending, setPending] = useState<PendingOrder[]>([])
  const [history, setHistory] = useState<OrderHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const [pendingResult, historyResult] = await Promise.all([
      restaurant.pendingOrders(token),
      restaurant.orderHistory(token),
    ])
    setPending(pendingResult)
    setHistory(historyResult)
  }, [token])

  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined

    const poll = async () => {
      try {
        const [nextPending, nextHistory] = await Promise.all([
          restaurant.pendingOrders(token),
          restaurant.orderHistory(token),
        ])
        if (!active) return
        setPending(nextPending)
        setHistory(nextHistory)
        setError('')
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Falha ao consultar pedidos.')
      } finally {
        if (active) {
          setLoading(false)
          timer = setTimeout(() => { void poll() }, 5000)
        }
      }
    }

    void poll()
    return () => {
      active = false
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [token])

  const updateStatus = async (id: string, status: string) => {
    setBusyId(id)
    setError('')
    try {
      await restaurant.updateOrderStatus(token, id, status)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o pedido.')
    } finally {
      setBusyId('')
    }
  }

  const orders: Order[] = tab === 'PENDING'
    ? pending
    : history.filter(order => order.status === tab)

  return (
    <section aria-label="Gerenciar pedidos" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Pedidos</h2>
          <p className="mt-1 text-sm text-slate-300">Atualização automática a cada 5 segundos.</p>
        </div>
        <button
          type="button"
          onClick={() => void refresh().catch(cause => setError(cause instanceof Error ? cause.message : 'Falha ao atualizar.'))}
          className="rounded-xl border border-cyan-400 bg-[#153e55] px-4 py-2 font-bold text-white hover:bg-[#245a74]"
        >
          Atualizar agora
        </button>
      </div>

      <div role="tablist" aria-label="Filtrar pedidos" className="grid grid-cols-3 gap-2">
        {tabs.map(option => (
          <button
            key={option.status}
            type="button"
            role="tab"
            aria-selected={tab === option.status}
            onClick={() => setTab(option.status)}
            className={
              'rounded-xl px-2 py-3 text-xs font-extrabold sm:text-sm ' +
              (tab === option.status
                ? 'bg-[#ffca28] text-[#09283b]'
                : 'border border-cyan-800 bg-[#173d55] text-white hover:bg-[#255570]')
            }
          >
            {option.label} ({option.status === 'PENDING'
              ? pending.length
              : history.filter(order => order.status === option.status).length})
          </button>
        ))}
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-100 p-3 text-sm font-semibold text-red-900">{error}</p>}
      {loading && <p className="text-slate-200">Carregando pedidos...</p>}
      {!loading && orders.length === 0 && (
        <p className="rounded-2xl border border-cyan-900 bg-[#112e43] p-8 text-center text-slate-200">
          Nenhum pedido nesta categoria.
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {orders.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            busy={busyId === order.id}
            onStatusChange={updateStatus}
          />
        ))}
      </div>
    </section>
  )
}
