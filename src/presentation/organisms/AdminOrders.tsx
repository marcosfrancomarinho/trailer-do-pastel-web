import { useCallback, useEffect, useRef, useState } from 'react'
import { restaurant } from '../../application/container'
import type { OrderHistoryItem, PendingOrder, PreparingOrder } from '../../domain/models'
import { brl } from '../../api'
import { restaurantDateKey, todayRestaurantDate } from '../../domain/order-date'
import OrderDetails from './OrderDetails'
import OrderReceipt from './OrderReceipt'
import { useActionDialog } from '../molecules/ActionDialog'
import { orderAlert } from '../audio/order-alert'

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
  if (status === 'PENDING') return { label: 'Aceitar pedido', next: 'PREPARING' }
  if (status === 'CONFIRMED') return { label: 'Iniciar preparo', next: 'PREPARING' }
  if (status === 'PREPARING') return { label: 'Concluir pedido', next: 'COMPLETED' }
  return null
}

function OrderCard({
  order,
  busy,
  onStatusChange,
  onOpen,
  onPrint,
}: {
  order: Order
  busy: boolean
  onStatusChange: (id: string, status: string) => Promise<void>
  onOpen: (order: Order) => void
  onPrint: (order: Order) => void
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
          {itemsCount} {itemsCount === 1 ? 'item' : 'itens'} · {new Date(order.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' })}
        </p>

        {order.observation && <p className="rounded-lg bg-[#3d3925] p-3 text-sm font-bold text-amber-100">📝 {order.observation}</p>}
        {order.tableNumber != null && <p className="inline-flex rounded-lg border border-amber-300 bg-[#57431f] px-3 py-1.5 text-sm font-black text-amber-100">🪑 Mesa {order.tableNumber}</p>}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => onOpen(order)}
            className="min-h-11 flex-1 rounded-xl border border-[#467991] bg-[#1a3d53] px-4 py-3 text-sm font-bold text-white hover:bg-[#27576f]"
            aria-label={'Ver detalhes do pedido ' + order.id.slice(0, 8)}
          >
            Detalhes
          </button>
          <button
            type="button"
            onClick={() => onPrint(order)}
            className="min-h-11 flex-1 rounded-xl border border-[#467991] bg-[#1a3d53] px-4 py-3 text-sm font-bold text-white hover:bg-[#27576f]"
            aria-label={'Imprimir pedido ' + order.id.slice(0, 8)}
          >
            🖨 Imprimir
          </button>
        </div>

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
              onClick={() => void onStatusChange(order.id, 'CANCELED')}
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
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Order[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [pending, setPending] = useState<PendingOrder[]>([])
  const [preparing, setPreparing] = useState<PreparingOrder[]>([])
  const [history, setHistory] = useState<OrderHistoryItem[]>([])
  const [busyId, setBusyId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [printId, setPrintId] = useState<string | null>(null)
  const [todayKey, setTodayKey] = useState(todayRestaurantDate)
  const [dateMode, setDateMode] = useState<'today' | 'custom'>('today')
  const [chosenDate, setChosenDate] = useState(todayRestaurantDate)
  const [soundEnabled, setSoundEnabled] = useState(() => window.localStorage.getItem('admin-order-sound') !== 'off')
  const [newOrderCount, setNewOrderCount] = useState(0)
  const [soundReady, setSoundReady] = useState(() => orderAlert.isReady())
  const soundEnabledRef = useRef(soundEnabled)
  soundEnabledRef.current = soundEnabled
  const seenPendingRef = useRef<Set<string>>(new Set())
  const seenDateRef = useRef('')
  const { confirm, notify, dialog } = useActionDialog()

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const visibleDate = dateMode === 'today' ? todayKey : chosenDate
  const currentFilterRef = useRef('')
  const currentFilter = token + '|' + tab + '|' + visibleDate
  currentFilterRef.current = currentFilter

  const onlyRequestedDay = useCallback(<T extends Order>(orders: T[], date: string): T[] =>
    orders.filter(order => restaurantDateKey(order.createdAt) === date), [])

  // O primeiro carregamento serve como referência: não toca para pedidos já existentes.
  const receivePending = useCallback((orders: PendingOrder[], date: string) => {
    const filtered = onlyRequestedDay(orders, date)
    const ids = new Set(filtered.map(order => order.id))
    if (seenDateRef.current !== date) {
      seenDateRef.current = date
      seenPendingRef.current = ids
    } else {
      const added = filtered.filter(order => !seenPendingRef.current.has(order.id))
      if (added.length > 0 && date === todayRestaurantDate()) {
        setNewOrderCount(previous => previous + added.length)
        if (soundEnabledRef.current) orderAlert.play()
      }
      for (const id of ids) seenPendingRef.current.add(id)
    }
    setPending(filtered)
  }, [onlyRequestedDay])

  // Mantém o áudio entre as telas. Se o navegador suspender a saída,
  // reativa no próximo gesto permitido pelo navegador.
  useEffect(() => {
    if (!soundEnabled) return
    let active = true
    const unlock = () => {
      if (orderAlert.isReady()) {
        if (active) setSoundReady(true)
        return
      }
      void orderAlert.enable().then(() => {
        if (active) setSoundReady(true)
      }).catch(() => {
        if (active) setSoundReady(false)
      })
    }
    document.addEventListener('pointerdown', unlock)
    document.addEventListener('keydown', unlock)
    document.addEventListener('visibilitychange', unlock)
    window.addEventListener('focus', unlock)
    return () => {
      active = false
      document.removeEventListener('pointerdown', unlock)
      document.removeEventListener('keydown', unlock)
      document.removeEventListener('visibilitychange', unlock)
      window.removeEventListener('focus', unlock)
    }
  }, [soundEnabled])

  const toggleSound = async () => {
    if (soundEnabled) {
      setSoundEnabled(false)
      setSoundReady(false)
      window.localStorage.setItem('admin-order-sound', 'off')
      orderAlert.close()
      return
    }
    try {
      await orderAlert.enable()
      setSoundEnabled(true)
      setSoundReady(true)
      window.localStorage.setItem('admin-order-sound', 'on')
      orderAlert.play()
    } catch {
      notify({
        title: 'Áudio bloqueado',
        message: 'Toque em Ativar som novamente e confira as permissões de áudio do navegador.',
        tone: 'error',
      })
    }
  }

  const unlockSound = async () => {
    try {
      await orderAlert.enable()
      setSoundReady(true)
    } catch {
      setSoundReady(false)
      notify({ title: 'Áudio bloqueado', message: 'Confira o volume do dispositivo e a permissão de som do site.', tone: 'error' })
    }
  }

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
    const filterKey = token + '|' + currentTab + '|' + date

    if (currentTab === 'pending') {
      const result = await restaurant.pendingOrders(token, date)
      if (currentFilterRef.current === filterKey) receivePending(result, date)
    } else if (currentTab === 'preparing') {
      const result = await restaurant.preparingOrders(token, date)
      if (currentFilterRef.current === filterKey) setPreparing(onlyRequestedDay(result, date))
    } else {
      const result = await restaurant.orderHistory(token, date)
      if (currentFilterRef.current === filterKey) setHistory(onlyRequestedDay(result, date))
    }
  }, [token, onlyRequestedDay, receivePending])

  // Apenas Pendentes usa polling. As demais abas consultam quando abertas.
  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined

    const load = async () => {
      try {
        if (tab === 'pending') {
          const result = await restaurant.pendingOrders(token, visibleDate)
          if (active && currentFilterRef.current === token + '|' + tab + '|' + visibleDate) receivePending(result, visibleDate)
        } else if (tab === 'preparing') {
          const result = await restaurant.preparingOrders(token, visibleDate)
          if (active && currentFilterRef.current === token + '|' + tab + '|' + visibleDate) setPreparing(onlyRequestedDay(result, visibleDate))
        } else {
          const result = await restaurant.orderHistory(token, visibleDate)
          if (active && currentFilterRef.current === token + '|' + tab + '|' + visibleDate) setHistory(onlyRequestedDay(result, visibleDate))
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
    setPrintId(null)
    void load()

    return () => {
      active = false
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [token, tab, visibleDate, onlyRequestedDay, receivePending])

  // Continua monitorando novos pedidos mesmo nas demais abas do painel.
  useEffect(() => {
    if (tab === 'pending') return
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const check = async () => {
      try {
        const orders = await restaurant.pendingOrders(token, todayKey)
        if (active) receivePending(orders, todayKey)
      } catch {
        // A tela atual mantém seu próprio tratamento de erro.
      } finally {
        if (active) timer = setTimeout(() => { void check() }, 5000)
      }
    }
    void check()
    return () => {
      active = false
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [tab, token, todayKey, receivePending])

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

    const actionLabel: Record<string, string> = {
      CONFIRMED: 'aceitar',
      PREPARING: 'iniciar o preparo de',
      COMPLETED: 'concluir',
      CANCELED: 'cancelar',
    }
    const verb = actionLabel[status] ?? 'alterar'
    const approved = await confirm({
      title: status === 'CANCELED' ? 'Cancelar pedido?' : 'Confirmar alteração?',
      message: 'Deseja ' + verb + ' o pedido #' + id.slice(0, 8) + '?',
      confirmLabel: status === 'CANCELED' ? 'Sim, cancelar' : 'Confirmar',
      tone: status === 'CANCELED' ? 'warning' : 'info',
    })
    if (!approved) return

    setBusyId(id)
    try {
      await restaurant.updateOrderStatus(token, id, status)
      await refresh()

    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Falha ao alterar status.'
      setError(message)
      notify({ title: 'Não foi possível atualizar', message, tone: 'error' })
    } finally {
      setBusyId('')
    }
  }

  // Busca global: consulta pedidos de todos os estados e datas, sem afetar o polling.
  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults([])
      setSearchLoading(false)
      setSearchError('')
      return
    }
    let active = true
    setSearchLoading(true)
    setSearchError('')
    void Promise.all([
      restaurant.pendingOrders(token),
      restaurant.preparingOrders(token),
      restaurant.orderHistory(token),
    ]).then(([allPending, allPreparing, allHistory]) => {
      if (!active) return
      setSearchResults([...allPending, ...allPreparing, ...allHistory])
    }).catch(cause => {
      if (active) setSearchError(cause instanceof Error ? cause.message : 'Erro na busca de pedidos.')
    }).finally(() => {
      if (active) setSearchLoading(false)
    })
    return () => { active = false }
  }, [token, debouncedSearch])

  const completed = history.filter(order => order.status === 'COMPLETED')
  const canceled = history.filter(order => order.status === 'CANCELED')
  const groups: Record<Tab, Order[]> = { pending, preparing, completed, canceled }
  const currentOrders = onlyRequestedDay(groups[tab], visibleDate)
  const normalizedSearch = debouncedSearch.toLocaleLowerCase('pt-BR')
  const searchDigits = debouncedSearch.replace(/\D/g, '')
  const filteredOrders = (debouncedSearch ? searchResults : currentOrders).filter(order => {
    if (!normalizedSearch) return true
    return order.customerName.toLocaleLowerCase('pt-BR').includes(normalizedSearch) ||
      order.customerPhone.toLocaleLowerCase('pt-BR').includes(normalizedSearch) ||
      (searchDigits.length >= 3 && order.customerPhone.replace(/\D/g, '').includes(searchDigits)) ||
      order.id.toLocaleLowerCase('pt-BR').includes(normalizedSearch) ||
      (order.tableNumber != null && (
        String(order.tableNumber) === normalizedSearch ||
        ('mesa ' + order.tableNumber).includes(normalizedSearch)
      ))
  })
  const selectedOrder = (debouncedSearch ? filteredOrders : currentOrders).find(order => order.id === selectedId)
  const printOrder = (debouncedSearch ? filteredOrders : currentOrders).find(order => order.id === printId)

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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { void toggleSound() }}
            aria-pressed={soundEnabled}
            className={
              'min-h-11 rounded-xl border px-4 py-2 text-sm font-bold ' +
              (soundEnabled
                ? 'border-[#ffca28] bg-[#ffca28] text-[#082739]'
                : 'border-[#56879d] bg-[#194258] text-white')
            }
          >
            {soundEnabled ? '🔔 Som ativado' : '🔕 Ativar som'}
          </button>
          <button
            type="button"
            onClick={() => { void refresh() }}
            className="min-h-11 rounded-xl border border-[#56879d] bg-[#194258] px-4 py-2 text-sm font-bold text-white hover:bg-[#24556c]"
          >
            Atualizar
          </button>
        </div>
      </div>

      {soundEnabled && !soundReady && (
        <button type="button" onClick={() => { void unlockSound() }}
          className="w-full rounded-xl border border-amber-300 bg-[#4b3d1b] px-4 py-3 text-left text-sm font-bold text-white">
          🔇 Som ainda não liberado pelo navegador. Toque aqui para liberar o áudio.
        </button>
      )}

      {newOrderCount > 0 && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-[#ffca28] bg-[#4b3d1b] px-4 py-3 text-sm font-bold text-white">
          <span>🔔 {newOrderCount} {newOrderCount === 1 ? 'novo pedido recebido' : 'novos pedidos recebidos'}</span>
          <button type="button" onClick={() => setNewOrderCount(0)} className="rounded-lg border border-[#ffe3a6] px-3 py-2 text-xs text-white">
            Dispensar
          </button>
        </div>
      )}

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
            Selecionar data
            <input
              type="date"
              lang="pt-BR"
              max={todayKey}
              value={chosenDate}
              onChange={event => {
                const date = event.target.value
                if (date && date <= todayKey) setChosenDate(date)
              }}
              className="min-h-11 rounded-lg border border-[#79a5ba] bg-white px-3 py-2 text-base font-bold text-[#09283b]"
              aria-label="Selecionar data dos pedidos no calendário"
            />
          </label>
        )}
        <span className="text-xs text-slate-300">
          Mostrando pedidos de {visibleDate.split('-').reverse().join('/')}
        </span>
      </div>

      <div className="rounded-xl border border-[#315970] bg-[#102b40] p-3">
        <label htmlFor="admin-order-search" className="mb-2 block text-sm font-bold text-slate-100">
          Buscar pedido
        </label>
        <div className="flex items-center gap-2">
          <input
            id="admin-order-search"
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Nome, telefone, pedido ou mesa"
            autoComplete="off"
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#79a5ba] bg-white px-3 py-2 text-base text-[#09283b] placeholder:text-slate-500"
          />
          {search && <button type="button" onClick={() => { setSearch(''); setDebouncedSearch('') }}
            className="min-h-11 rounded-xl border border-[#467991] px-3 text-sm font-bold text-white">
            Limpar
          </button>}
        </div>
        <p className="mt-2 text-xs text-slate-300">Ao pesquisar, procura em todas as datas e situações, inclusive pelo ID parcial.</p>
      </div>

      {!debouncedSearch && <div className="grid grid-cols-2 gap-2 lg:grid-cols-4" role="tablist" aria-label="Situação dos pedidos">
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
            {tab === option.id && <strong className="mt-1 block text-lg">{filteredOrders.length}</strong>}
          </button>
        ))}
      </div>

      {debouncedSearch && <p className="text-sm font-bold text-cyan-100">Resultados da busca em todos os pedidos ({filteredOrders.length})</p>}
      {searchError && <p role="alert" className="rounded-xl bg-[#522934] p-3 text-sm text-white">{searchError}</p>}
      {error && !debouncedSearch && <p role="alert" className="rounded-xl bg-[#522934] p-3 text-sm text-white">{error}</p>}
      {(debouncedSearch ? searchLoading : loading) ? (
        <p className="text-slate-200">Carregando pedidos...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="rounded-xl border border-[#345971] bg-[#112e43] p-6 text-center text-slate-200">
          {debouncedSearch ? 'Nenhum pedido encontrado para esta pesquisa.' : `Nenhum pedido em ${tabs.find(option => option.id === tab)?.label.toLowerCase()}.`}
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} busy={busyId === order.id} onStatusChange={changeStatus} onOpen={order => setSelectedId(order.id)} onPrint={order => setPrintId(order.id)} />
          ))}
        </div>
      )}
      {selectedOrder && <OrderDetails order={selectedOrder} onClose={() => setSelectedId(null)} />}
      {printOrder && <OrderReceipt order={printOrder} onClose={() => setPrintId(null)} />}
      {dialog}
    </section>
  )
}
