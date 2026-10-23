import { useCallback, useEffect, useState } from 'react'
import { restaurant } from '../../application/container'
import type { OrderHistoryItem, PendingOrder, PreparingOrder } from '../../domain/models'
import { brl } from '../../api'

type Tab = 'pending' | 'preparing' | 'completed' | 'canceled'
type Order = PendingOrder | PreparingOrder | OrderHistoryItem

const tabs: { id: Tab; label: string }[] = [
  { id: 'pending', label: 'Pendentes' },
  { id: 'preparing', label: 'Em andamento' },
  { id: 'completed', label: 'Concluídos' },
  { id: 'canceled', label: 'Cancelados' },
]

const statusLabels: Record<string, string> = {
  PENDING: 'Aguardando aceite',
  CONFIRMED: 'Aceito',
  PREPARING: 'Em preparo',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
}

function nextAction(status: string): { label: string; next: string } | null {
  if (status === 'PENDING') return { label: 'Aceitar pedido', next: 'CONFIRMED' }
  if (status === 'CONFIRMED') return { label: 'Iniciar preparo', next: 'PREPARING' }
  if (status === 'PREPARING') return { label: 'Concluir pedido', next: 'COMPLETED' }
  return null
}

function OrderCard({
  order,
  busy,
  onStatusChange,
}: {
  order: Order
  busy: boolean
  onStatusChange: (id: string, status: string) => Promise<void>
}) {
  const action = nextAction(order.status)
  const itemsCount = order.items.reduce((total, item) => total + item.quantity, 0)

  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-[#37637b] bg-[#112e43] shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-[#31566e] px-4 py-3">
        <span className="text-xs font-extrabold tracking-wider text-cyan-200">
          #{order.id.slice(0, 8)}
        </span>
        <span className="rounded-full bg-[#264c61] px-3 py-1 text-xs font-bold text-white">
          {statusLabels[order.status]}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="break-words text-lg font-black text-white">{order.customerName}</h3>
            <p className="text-sm text-slate-300">{order.customerPhone}</p>
          </div>
          <strong className="shrink-0 text-lg font-black text-amber-300">{brl(order.total)}</strong>
        </div>

        <p className="text-sm text-slate-300">
          {itemsCount} {itemsCount === 1 ? 'item' : 'itens'} · {new Date(order.createdAt).toLocaleString('pt-BR')}
        </p>

        <details className="rounded-xl bg-[#1a3d53] p-3 text-sm text-slate-100">
          <summary className="cursor-pointer font-bold">Ver itens do pedido</summary>
          <ul className="mt-3 space-y-2">
            {order.items.map((item, index) => (
              <li key={index}>
                <span className="font-semibold">{item.quantity}× {item.productName}</span>
                {item.additions.map((addition, extraIndex) => (
                  <p className="pl-4 text-slate-300" key={extraIndex}>
                    + {addition.quantity}× {addition.additionName}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        </details>

        {'histories' in order && (
          <details className="rounded-xl border border-[#37637b] px-3 py-2 text-xs text-slate-200">
            <summary className="cursor-pointer font-semibold">Histórico de status</summary>
            <ol className="mt-2 space-y-1">
              {order.histories.map((entry, index) => (
                <li key={index}>
                  {statusLabels[entry.status] ?? entry.status} · {new Date(entry.changedAt).toLocaleString('pt-BR')}
                </li>
              ))}
            </ol>
          </details>
        )}

        {action && (
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onStatusChange(order.id, action.next)}
              className="flex-1 rounded-xl bg-[#ffca28] px-4 py-3 text-sm font-extrabold text-[#082739] disabled:opacity-60"
            >
              {busy ? 'Salvando...' : action.label}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (window.confirm('Cancelar este pedido?')) void onStatusChange(order.id, 'CANCELED')
              }}
              className="rounded-xl border border-red-300 bg-[#512832] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

export default function AdminOrders({ token }: { token: string }) {
  const [tab, setTab] = useState<Tab>('pending')
  const [pending, setPending] = useState<PendingOrder[]>([])
  const [preparing, setPreparing] = useState<PreparingOrder[]>([])
  const [history, setHistory] = useState<OrderHistoryItem[]>([])
  const [busyId, setBusyId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchOrders = useCallback(() => Promise.all([
    restaurant.pendingOrders(token),
    restaurant.preparingOrders(token),
    restaurant.orderHistory(token),
  ]), [token])

  const refresh = async () => {
    try {
      const [newPending, newPreparing, newHistory] = await fetchOrders()
      setPending(newPending)
      setPreparing(newPreparing)
      setHistory(newHistory)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível consultar os pedidos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined

    const poll = async () => {
      try {
        const [newPending, newPreparing, newHistory] = await fetchOrders()
        if (!active) return
        setPending(newPending)
        setPreparing(newPreparing)
        setHistory(newHistory)
        setError('')
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Falha ao atualizar pedidos.')
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
  }, [fetchOrders])

  const changeStatus = async (id: string, status: string) => {
    setBusyId(id)
    try {
      await restaurant.updateOrderStatus(token, id, status)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao alterar status.')
    } finally {
      setBusyId('')
    }
  }

  const completed = history.filter(order => order.status === 'COMPLETED')
  const canceled = history.filter(order => order.status === 'CANCELED')
  const groups: Record<Tab, Order[]> = { pending, preparing, completed, canceled }
  const currentOrders = groups[tab]

  return (
    <section className="space-y-5" aria-label="Painel de pedidos">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Pedidos</h2>
          <p className="text-sm text-slate-300">Atualização automática a cada 5 segundos</p>
        </div>
        <button
          type="button"
          onClick={() => { void refresh() }}
          className="rounded-xl border border-[#56879d] bg-[#194258] px-4 py-2 text-sm font-bold text-white hover:bg-[#24556c]"
        >
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4" role="tablist" aria-label="Situação dos pedidos">
        {tabs.map(option => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={tab === option.id}
            onClick={() => setTab(option.id)}
            className={
              'rounded-xl border px-3 py-3 text-left text-sm font-bold ' +
              (tab === option.id
                ? 'border-[#ffca28] bg-[#ffca28] text-[#082739]'
                : 'border-[#34637c] bg-[#173b51] text-white hover:bg-[#24536c]')
            }
          >
            <span className="block">{option.label}</span>
            <strong className="mt-1 block text-lg">{groups[option.id].length}</strong>
          </button>
        ))}
      </div>

      {error && <p role="alert" className="rounded-xl bg-[#522934] p-3 text-sm text-white">{error}</p>}
      {loading ? (
        <p className="text-slate-200">Carregando pedidos...</p>
      ) : currentOrders.length === 0 ? (
        <p className="rounded-xl border border-[#345971] bg-[#112e43] p-6 text-center text-slate-200">
          Nenhum pedido em {tabs.find(option => option.id === tab)?.label.toLowerCase()}.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {currentOrders.map(order => (
            <OrderCard key={order.id} order={order} busy={busyId === order.id} onStatusChange={changeStatus} />
          ))}
        </div>
      )}
    </section>
  )
}
