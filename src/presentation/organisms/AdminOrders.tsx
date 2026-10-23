import { useCallback, useEffect, useState } from 'react'
import { restaurant } from '../../application/container'
import type { OrderHistoryItem, PendingOrder, PreparingOrder } from '../../domain/models'
import { brl } from '../../api'
import { todayRestaurantDate } from '../../domain/order-date'
import OrderDetails from './OrderDetails'

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
  onOpen,
}: {
  order: Order
  busy: boolean
  onStatusChange: (id: string, status: string) => Promise<void>
  onOpen: (order: Order) => void
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

        <button
          type="button"
          onClick={() => onOpen(order)}
          className="w-full rounded-xl border border-[#467991] bg-[#1a3d53] p-3 text-left text-sm font-bold text-white hover:bg-[#27576f]"
          aria-label={'Ver detalhes do pedido ' + order.id.slice(0, 8)}
        >
          Ver detalhes do pedido →
        </button>

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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [todayKey, setTodayKey] = useState(todayRestaurantDate)
  const [dateMode, setDateMode] = useState<'today' | 'custom'>('today')
  const [chosenDate, setChosenDate] = useState(todayRestaurantDate)

  const visibleDate = dateMode === 'today' ? todayKey : chosenDate

  // Atualiza apenas a data local; não consulta pedidos em segundo plano.
  useEffect(() => {
    const updateDay = () => setTodayKey(todayRestaurantDate())
    const timer = window.setInterval(updateDay, 30_000)
    window.addEventListener('focus', updateDay)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', updateDay)
    }
  }, [])

  const fetchTab = useCallback(async (currentTab: Tab, date: string) => {
    if (currentTab === 'pending') {
      const result = await restaurant.pendingOrders(token, date)
      setPending(result)
    } else if (currentTab === 'preparing') {
      const result = await restaurant.preparingOrders(token, date)
      setPreparing(result)
    } else {
      const result = await restaurant.orderHistory(token, date)
      setHistory(result)
    }
  }, [token])

  // Apenas Pendentes usa polling. As demais abas consultam quando abertas.
  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined

    const load = async () => {
      try {
        if (tab === 'pending') {
          const result = await restaurant.pendingOrders(token, visibleDate)
          if (active) setPending(result)
        } else if (tab === 'preparing') {
          const result = await restaurant.preparingOrders(token, visibleDate)
          if (active) setPreparing(result)
        } else {
          const result = await restaurant.orderHistory(token, visibleDate)
          if (active) setHistory(result)
        }
        if (active) setError('')
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Falha ao buscar pedidos.')
        }
      } finally {
        if (active) {
          setLoading(false)
          if (tab === 'pending') timer = setTimeout(() => { void load() }, 5000)
        }
      }
    }

    setLoading(true)
    setPending([])
    setPreparing([])
    setHistory([])
    setSelectedId(null)
    void load()

    return () => {
      active = false
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [token, tab, visibleDate])

  const refresh = async () => {
    setLoading(true)
    try {
      await fetchTab(tab, visibleDate)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar os pedidos.')
    } finally {
      setLoading(false)
    }
  }

  const changeStatus = async (id: string, status: string) => {
    if (busyId) return
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
  const selectedOrder = currentOrders.find(order => order.id === selectedId)

  return (
    <section className="space-y-5" aria-label="Painel de pedidos">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Pedidos</h2>
          <p className="text-sm text-slate-300">
            {tab === 'pending'
              ? 'Pendentes atualizados automaticamente a cada 5 segundos.'
              : 'Atualizados ao abrir esta aba ou clicar em Atualizar.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { void refresh() }}
          className="rounded-xl border border-[#56879d] bg-[#194258] px-4 py-2 text-sm font-bold text-white hover:bg-[#24556c]"
        >
          Atualizar
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[#315970] bg-[#102b40] p-3">
        <div className="flex gap-2" role="group" aria-label="Período dos pedidos">
          <button
            type="button"
            aria-pressed={dateMode === 'today'}
            onClick={() => setDateMode('today')}
            className={
              'rounded-lg px-4 py-2 text-sm font-bold ' +
              (dateMode === 'today'
                ? 'bg-[#ffca28] text-[#082739]'
                : 'border border-[#467991] bg-[#1b4258] text-white')
            }
          >
            Hoje
          </button>
          <button
            type="button"
            aria-pressed={dateMode === 'custom'}
            onClick={() => { setChosenDate(visibleDate); setDateMode('custom') }}
            className={
              'rounded-lg px-4 py-2 text-sm font-bold ' +
              (dateMode === 'custom'
                ? 'bg-[#ffca28] text-[#082739]'
                : 'border border-[#467991] bg-[#1b4258] text-white')
            }
          >
            Outra data
          </button>
        </div>
        {dateMode === 'custom' && (
          <label className="flex flex-col gap-1 text-xs font-bold text-slate-200">
            Data do pedido
            <input
              type="date"
              value={chosenDate}
              max={todayKey}
              onChange={event => setChosenDate(event.target.value)}
              className="rounded-lg border border-[#467991] bg-white px-3 py-2 text-sm text-[#09283b]"
            />
          </label>
        )}
        <span className="text-xs text-slate-300">
          Mostrando pedidos de {visibleDate.split('-').reverse().join('/')}
        </span>
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
            {tab === option.id && <strong className="mt-1 block text-lg">{currentOrders.length}</strong>}
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
            <OrderCard key={order.id} order={order} busy={busyId === order.id} onStatusChange={changeStatus} onOpen={order => setSelectedId(order.id)} />
          ))}
        </div>
      )}
      {selectedOrder && <OrderDetails order={selectedOrder} onClose={() => setSelectedId(null)} />}
    </section>
  )
}
