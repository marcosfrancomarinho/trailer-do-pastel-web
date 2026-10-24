import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cartTotal, toOrderPayload, type CartItem } from '../../domain/cart'
import { brl } from '../../api'
import { restaurantAdapter } from '../../infrastructure/http/restaurant-adapter'
import type { Addition, Category, Product, RestaurantTable, TableOrders } from '../../domain/models'
import { useActionDialog } from '../molecules/ActionDialog'
import TableReceipt from './TableReceipt'

type Props = { token: string; products: Product[]; categories: Category[] }
const orderStatusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em preparo',
  COMPLETED: 'Pronto',
  CANCELED: 'Cancelado',
}
const TABLE_ORDER_NAME = 'Trailer do Pastel'
const TABLE_ORDER_PHONE = '99984636486'
const field = 'min-h-11 w-full rounded-xl border border-[#63899a] bg-[#edf8fc] px-3 py-2 text-[#102c40]'
const button = 'min-h-11 rounded-xl bg-[#ffca28] px-4 py-2 font-bold text-[#09283b] disabled:opacity-50'

export default function AdminTables({ token, products, categories }: Props) {
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [readyTables, setReadyTables] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<string | null>(null)
  const [tableView, setTableView] = useState<'orders' | 'new'>('orders')
  const selectionRequest = useRef(0)
  const cartPanelRef = useRef<HTMLElement | null>(null)
  const [cartFocusRequest, setCartFocusRequest] = useState(0)
  const [details, setDetails] = useState<TableOrders | null>(null)
  const [printTable, setPrintTable] = useState<TableOrders | null>(null)
  const [number, setNumber] = useState('')
  const [showCreateTable, setShowCreateTable] = useState(false)
  const [observation, setObservation] = useState('')
  const [product, setProduct] = useState<Product | null>(null)
  const [additions, setAdditions] = useState<Addition[]>([])
  const [additionsBusy, setAdditionsBusy] = useState(false)
  const [amounts, setAmounts] = useState<Record<string, number>>({})
  const [quantity, setQuantity] = useState(1)
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const draftCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const filteredProducts = useMemo(() => products.filter(item =>
    (category === 'all' || item.categoryId === category) &&
    (item.name + ' ' + item.description).toLowerCase().includes(search.toLowerCase())
  ), [products, category, search])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { confirm, notify, dialog } = useActionDialog()

  const refresh = useCallback(async (tableId?: string | null) => {
    const list = await restaurantAdapter.tables(token)
    setTables(list)
    const occupied = list.filter(table => table.status === 'OCCUPIED')
    const results = await Promise.allSettled(
      occupied.map(table => restaurantAdapter.tableOrders(token, table.id))
    )
    setReadyTables(previous => {
      const ready = new Set<string>()
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const orders = result.value.orders
          if (orders.length > 0 && orders.every(order => order.status === 'COMPLETED')) {
            ready.add(occupied[index].id)
          }
        } else if (previous.has(occupied[index].id)) {
          ready.add(occupied[index].id)
        }
      })
      return ready
    })
    if (tableId) setDetails(await restaurantAdapter.tableOrders(token, tableId))
  }, [token])

  useEffect(() => {
    let active = true
    const update = () => {
      if (document.visibilityState !== 'visible') return
      void refresh().catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : 'Erro ao carregar mesas.')
      })
    }
    update()
    const interval = window.setInterval(update, 15_000)
    document.addEventListener('visibilitychange', update)
    return () => {
      active = false
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', update)
    }
  }, [refresh])

  function closeTable() {
    ++selectionRequest.current
    setSelected(null)
    setDetails(null)
    setProduct(null)
    setError('')
  }

  useEffect(() => {
    if (!selected) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !product && !printTable) closeTable()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected, product, printTable])

  async function openTable(id: string) {
    const request = ++selectionRequest.current
    if (selected === id) {
      closeTable()
      return
    }
    setSelected(id)
    setDetails(null)
    setProduct(null)
    setCart([])
    setError('')
    try {
      const result = await restaurantAdapter.tableOrders(token, id)
      if (selectionRequest.current === request) {
        setDetails(result)
        setTableView(result.orders.length ? 'orders' : 'new')
      }
    } catch (cause) {
      if (selectionRequest.current === request) {
        setError(cause instanceof Error ? cause.message : 'Erro ao abrir mesa.')
      }
    }
  }

  async function createTable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = Number(number)
    if (!Number.isInteger(value) || value < 1) return
    setBusy(true); setError('')
    try {
      await restaurantAdapter.createTable(token, value)
      setNumber('')
      setShowCreateTable(false)
      await refresh(selected)
      notify({ title: 'Mesa cadastrada', message: 'A mesa ' + value + ' foi criada.', tone: 'success' })
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao cadastrar mesa.') }
    finally { setBusy(false) }
  }

  async function chooseProduct(item: Product) {
    if (!item.available) return
    setProduct(item)
    setAmounts({})
    setQuantity(1)
    setAdditions([])
    setAdditionsBusy(true)
    try { setAdditions(await restaurantAdapter.additions(item.id)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao buscar adicionais.'); setProduct(null) }
    finally { setAdditionsBusy(false) }
  }

  useEffect(() => {
    if (cartFocusRequest === 0 || product) return
    const frame = window.requestAnimationFrame(() => {
      cartPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [cartFocusRequest, product])

  function addProduct() {
    if (!product || additionsBusy) return
    const selectedAdditions = additions.filter(item => item.available && (amounts[item.id] ?? 0) > 0)
      .map(addition => ({ addition, quantity: amounts[addition.id] }))
    const key = product.id + ':' + selectedAdditions.map(item => item.addition.id + '-' + item.quantity).sort().join(',')
    setCart(previous => {
      const existing = previous.find(item => item.key === key)
      return existing
        ? previous.map(item => item.key === key ? { ...item, quantity: item.quantity + quantity } : item)
        : [...previous, { key, product, quantity, additions: selectedAdditions }]
    })
    setProduct(null)
    setCartFocusRequest(value => value + 1)
  }

  async function createOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || !cart.length || busy) return
    let payload
    try { payload = toOrderPayload(TABLE_ORDER_NAME, TABLE_ORDER_PHONE, cart) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Confira os dados do pedido.'); return }
    setBusy(true); setError('')
    try {
      await restaurantAdapter.create({
        ...payload,
        observation: observation.trim() || null,
        tableId: selected,
      }, token)
      setCart([])
      setObservation('')
      await refresh(selected)
      setTableView('orders')
      notify({ title: 'Pedido lançado', message: 'Os produtos foram vinculados à mesa.', tone: 'success' })
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao lançar pedido.') }
    finally { setBusy(false) }
  }

  async function release() {
    if (!selected || busy) return
    const tableId = selected
    setBusy(true)
    setError('')
    try {
      // Consulta o estado atual, pois a comanda pode ter mudado desde a abertura do modal.
      const current = await restaurantAdapter.tableOrders(token, tableId)
      setDetails(current)
      const unfinished = current.orders.filter(order =>
        ['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status)
      )
      if (unfinished.length > 0) {
        notify({
          title: 'Não é possível liberar a mesa',
          message: 'Esta mesa possui ' + unfinished.length +
            (unfinished.length === 1 ? ' pedido pendente ou em preparo. ' : ' pedidos pendentes ou em preparo. ') +
            'Conclua ou cancele esses pedidos antes de liberar a mesa.',
          tone: 'error',
        })
        setTableView('orders')
        return
      }
      const approved = await confirm({
        title: 'Liberar mesa?',
        message: 'A sessão será encerrada e o valor consumido ficará no histórico.',
        confirmLabel: 'Liberar mesa',
      })
      if (!approved) return
      const result = await restaurantAdapter.releaseTable(token, tableId)
      await refresh(tableId)
      notify({ title: 'Mesa liberada', message: 'Total encerrado: ' + brl(result.closedTotal), tone: 'success' })
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível liberar a mesa.'
      setError(message)
      notify({ title: 'Não foi possível liberar a mesa', message, tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  async function archiveTable() {
    if (!selected || !details || details.status !== 'FREE' || busy) return
    const tableId = selected
    const tableNumber = details.number
    const approved = await confirm({
      title: 'Retirar mesa de uso?',
      message: 'A mesa ' + tableNumber + ' deixará de aparecer no mapa. Seus pedidos e históricos serão preservados no servidor, e o número poderá ser reutilizado.',
      confirmLabel: 'Retirar mesa',
      tone: 'warning',
    })
    if (!approved) return
    setBusy(true)
    setError('')
    try {
      await restaurantAdapter.archiveTable(token, tableId)
      setSelected(null)
      setDetails(null)
        await refresh()
      notify({
        title: 'Mesa retirada de uso',
        message: 'A mesa ' + tableNumber + ' foi arquivada com sucesso. O histórico foi preservado.',
        tone: 'success',
      })
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível retirar a mesa.'
      setError(message)
      notify({ title: 'Não foi possível retirar a mesa', message, tone: 'error' })
      // Se ela ficou ocupada após a consulta, refaz a situação exibida.
      try { await refresh(tableId) } catch { /* Mesa indisponível ou excluída em outra sessão. */ }
    } finally {
      setBusy(false)
    }
  }

  async function removeOrder(orderId: string) {
    if (!selected) return
    if (!await confirm({ title: 'Cancelar pedido da mesa?', message: 'Esta ação cancela o pedido e retira seu valor do consumo da mesa.', confirmLabel: 'Cancelar pedido' })) return
    setBusy(true); setError('')
    try { await restaurantAdapter.removeTableOrder(token, selected, orderId); await refresh(selected) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Erro ao cancelar pedido.') }
    finally { setBusy(false) }
  }


  return <section className="space-y-5 text-white">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-black">Mesas</h2>
        <span className="rounded-full bg-[#254b5d] px-2 py-1 text-xs font-bold text-slate-100">{tables.length} cadastradas</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-expanded={showCreateTable} aria-controls="new-table-form" onClick={() => setShowCreateTable(value => !value)} className="min-h-10 rounded-lg border border-[#63899a] px-3 text-sm font-bold text-white">{showCreateTable ? '✕ Fechar' : '+ Nova mesa'}</button>
      </div>
    </div>
    {showCreateTable && (
      <form id="new-table-form" onSubmit={event => void createTable(event)} className="flex w-full min-w-0 flex-col gap-3 rounded-xl border border-[#63899a] bg-[#14374d] p-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm font-bold">Número da nova mesa
          <input type="number" min="1" step="1" required autoFocus className={field + ' mt-1'} value={number} onChange={event => setNumber(event.target.value)} />
        </label>
        <button disabled={busy} type="submit" className={button + ' w-full sm:w-auto'}>{busy ? 'Cadastrando...' : 'Cadastrar mesa'}</button>
      </form>
    )}
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-slate-100" aria-label="Legenda de situação das mesas">
      <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#60dcaa]" aria-hidden="true" />Livre</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#ffce56]" aria-hidden="true" />Ocupada · Em andamento</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#61c7fa]" aria-hidden="true" />Ocupada · Pedidos prontos</span>
    </div>
    {error && <p role="alert" className="rounded-xl border border-red-400 bg-[#562932] p-3 text-white">{error}</p>}
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {tables.map(table => <button key={table.id} type="button" onClick={() => void openTable(table.id)}
        aria-expanded={selected === table.id}
        aria-haspopup="dialog"
        className={'flex min-h-16 flex-col justify-center gap-1 rounded-lg border px-3 py-2 text-left transition-all duration-200 ' +
          (table.status === 'FREE' ? 'border-[#60dcaa] bg-[#164734] text-white' : readyTables.has(table.id) ? 'border-[#61c7fa] bg-[#174b73] text-white' : 'border-[#ffce56] bg-[#544221] text-white') +
          (selected === table.id ? ' ring-2 ring-[#ffca28] shadow-lg' : ' hover:-translate-y-0.5')}>
        <span className="flex w-full items-center justify-between gap-1"><strong className="text-base">Mesa {table.number}</strong><span className="text-xs" aria-hidden="true">↗</span></span>
        <span className="text-xs font-semibold">{table.status === 'FREE' ? '● Livre' : readyTables.has(table.id) ? '✓ Prontos · Ocupada' : '● Ocupada'} · {brl(table.totalSpent)}</span>
      </button>)}
    </div>
    {tables.length === 0 && <p className="text-sm text-slate-300">Nenhuma mesa cadastrada.</p>}
    {selected && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-3 sm:p-4" onMouseDown={event => { if (event.target === event.currentTarget && !product && !printTable) closeTable() }}>
      <section role="dialog" aria-modal="true" aria-label={details ? 'Mesa ' + details.number : 'Detalhes da mesa'} className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#537d90] bg-[#112e43] shadow-2xl sm:max-h-[90dvh] sm:rounded-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#537d90] px-4 py-3 sm:px-5">
          <div className="min-w-0"><h3 className="text-xl font-black">{details ? 'Mesa ' + details.number : 'Abrindo mesa...'}</h3>{details && <p className="text-sm text-slate-200">{details.status === 'FREE' ? 'Livre' : 'Ocupada'} · {brl(details.totalSpent)}</p>}</div>
          <button type="button" onClick={closeTable} aria-label="Fechar detalhes da mesa" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#63899a] text-xl font-bold">✕</button>
        </header>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-5">
      {!details ? <p>Carregando detalhes...</p> : <>
        <div className="flex flex-wrap items-center gap-2 border-b border-[#345b70] pb-3">
          <button type="button" disabled={busy || details.orders.length === 0} onClick={() => setPrintTable(details)}
            className="min-h-10 rounded-lg border border-[#63899a] bg-[#1a4055] px-3 text-xs font-bold text-white disabled:opacity-40 sm:text-sm">🖨 Imprimir conta</button>
          {details.status === 'OCCUPIED' ? (
            <button disabled={busy} type="button" className="min-h-10 rounded-lg bg-[#ffca28] px-3 text-xs font-bold text-[#09283b] disabled:opacity-50 sm:text-sm" onClick={() => void release()}>Liberar mesa</button>
          ) : (
            <button disabled={busy} type="button" onClick={() => void archiveTable()}
              className="min-h-10 rounded-lg border border-[#a66c75] bg-[#442b36] px-3 text-xs font-bold text-white disabled:opacity-50 sm:text-sm">Retirar de uso</button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#0b2536] p-1.5" role="tablist" aria-label={'Visualização da mesa ' + details.number}>
          <button type="button" role="tab" aria-selected={tableView === 'orders'} onClick={() => setTableView('orders')}
            className={'min-h-12 rounded-lg px-2 py-2 text-sm font-black transition ' + (tableView === 'orders' ? 'bg-[#ffca28] text-[#09283b]' : 'text-slate-200 hover:bg-[#23485d]')}>
            Pedidos ({details.orders.length})
          </button>
          <button type="button" role="tab" aria-selected={tableView === 'new'} onClick={() => setTableView('new')}
            className={'min-h-12 rounded-lg px-2 py-2 text-sm font-black transition ' + (tableView === 'new' ? 'bg-[#ffca28] text-[#09283b]' : 'text-slate-200 hover:bg-[#23485d]')}>
            + Novo pedido{draftCount > 0 ? ' (' + draftCount + ')' : ''}
          </button>
        </div>
        {tableView === 'orders' && <div role="tabpanel" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-base font-black">Pedidos já enviados</h4>
            <span className="text-xs text-slate-300">Consumo da mesa: {brl(details.totalSpent)}</span>
          </div>
          {details.orders.length === 0 && <p className="rounded-lg bg-[#193e53] px-3 py-2 text-sm text-slate-300">Nenhum pedido nesta comanda.</p>}
          {details.orders.map((order, index) => <details key={order.id} className={'group rounded-xl border ' + (order.status === 'COMPLETED' ? 'border-[#52dd91] bg-[#164e37]' : 'border-[#466b7f] bg-[#193e53]')}>
            <summary className="flex cursor-pointer list-none items-center gap-2 p-3 marker:hidden">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#2a5267] text-xs font-black">{index + 1}</span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm">{order.status === 'COMPLETED' ? '✓ Pronto · ' : ''}Pedido #{order.id.slice(0, 8)}</strong>
                <span className="block truncate text-xs text-slate-200">{order.items.reduce((sum, item) => sum + item.quantity, 0)} itens · {orderStatusLabels[order.status] ?? order.status}</span>
              </span>
              <strong className="shrink-0 text-sm text-amber-200">{brl(order.total)}</strong>
              <span className="text-xs text-cyan-100 group-open:rotate-180" aria-hidden="true">▼</span>
            </summary>
            <div className="space-y-2 border-t border-[#466b7f] px-3 py-3">
              {order.createdBy && <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#527b8e] bg-[#102f43] p-2.5" aria-label={'Pedido lançado por ' + order.createdBy.name}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ffca28] text-sm font-black text-[#102c40]" aria-hidden="true">{order.createdBy.name.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('')}</span>
                <div className="min-w-0"><p className="truncate text-sm font-bold text-white">{order.createdBy.name}</p><p className="text-xs text-slate-300">{order.createdBy.role === 'ADMIN' ? 'Administrador' : 'Funcionário'} · Lançou o pedido</p></div>
              </div>}
              {order.items.map((item, itemIndex) => <div key={itemIndex} className="text-sm text-white">
                <p className="font-bold">{item.quantity}× {item.productName}</p>
                {item.additions.map((extra, extraIndex) => <p key={extraIndex} className="pl-3 text-xs text-slate-200">+ {extra.quantity}× {extra.additionName}</p>)}
              </div>)}
              {order.observation && <p className="rounded-lg bg-[#433922] p-2 text-xs text-amber-100">Obs.: {order.observation}</p>}
              {['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status) && <button type="button" disabled={busy} onClick={() => void removeOrder(order.id)} className="min-h-10 rounded-lg border border-red-300 px-3 text-xs font-bold text-red-100 disabled:opacity-40">Cancelar pedido</button>}
            </div>
          </details>)}
          <button type="button" onClick={() => setTableView('new')} className="min-h-11 w-full rounded-lg border border-[#63899a] bg-[#193e53] px-4 text-sm font-bold text-white">+ Adicionar outro pedido</button>
        </div>}
        {tableView === 'new' && <div role="tabpanel" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div><h4 className="text-base font-black">Novo pedido</h4><p className="text-xs text-slate-300">Selecione os produtos para esta mesa</p></div>
          </div>
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,330px)]">
            <aside id="table-cart-summary" ref={cartPanelRef} className="order-table-cart-panel min-w-0 scroll-mt-3 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1">
          <form onSubmit={event => void createOrder(event)} className="grid gap-3 rounded-xl border border-[#527b8e] bg-[#193e53] p-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="flex items-center justify-between gap-2 sm:col-span-2 lg:col-span-1">
              <h4 className="text-base font-black text-white">Pedido em montagem</h4>
              <span className="rounded-md bg-[#ffca28] px-2 py-1 text-xs font-black text-[#102c40]">{cart.reduce((sum, item) => sum + item.quantity, 0)} itens</span>
            </div>
            <div className="space-y-2 sm:col-span-2">
              {cart.map((item, index) => <div key={item.key} className="rounded-lg border border-[#4f7286] bg-[#102c40] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1"><span className="mb-1 block text-[11px] font-bold text-slate-300">Item {index + 1}</span><strong className="block break-words text-sm leading-snug text-white">{item.product.name}</strong></div>
                  <strong className="shrink-0 text-sm text-amber-200">{brl(item.quantity * (Number(item.product.price) + item.additions.reduce((total, extra) => total + Number(extra.addition.price) * extra.quantity, 0)))}</strong>
                </div>
                {item.additions.map(extra => <p key={extra.addition.id} className="text-sm text-slate-200">+ {extra.quantity}× {extra.addition.name}</p>)}
                <div className="mt-3 flex items-center gap-2 border-t border-[#345a70] pt-2">
                  <button type="button" aria-label="Diminuir quantidade" onClick={() => setCart(items => items.map(value => value.key === item.key ? { ...value, quantity: value.quantity - 1 } : value).filter(value => value.quantity > 0))} className="grid h-9 w-9 place-items-center rounded-lg bg-[#ffca28] font-bold text-[#102c40]">−</button>
                  <span className="min-w-6 text-center text-sm font-black">{item.quantity}</span>
                  <button type="button" aria-label="Aumentar quantidade" onClick={() => setCart(items => items.map(value => value.key === item.key ? { ...value, quantity: value.quantity + 1 } : value))} className="grid h-9 w-9 place-items-center rounded-lg bg-[#ffca28] font-bold text-[#102c40]">+</button>
                  <button type="button" onClick={() => setCart(items => items.filter(value => value.key !== item.key))} className="ml-auto text-xs font-bold text-red-200 underline">Remover</button>
                </div>
              </div>)}
              {cart.length === 0 && <p className="text-sm text-slate-200">Nenhum produto adicionado.</p>}
            </div>
            <label className="text-sm font-bold sm:col-span-2">Observações<textarea maxLength={500} rows={2} className={field + ' mt-1'} value={observation} onChange={event => setObservation(event.target.value)} /></label>
            <div className="flex items-center justify-between gap-3 rounded-lg border-t border-[#547b8e] pt-3 sm:col-span-2"><span className="font-black">Total do pedido</span><strong className="text-lg text-amber-200">{brl(cartTotal(cart))}</strong></div>
            <button disabled={busy || cart.length === 0} className={button + ' sm:col-span-2'} type="submit">{busy ? 'Salvando...' : 'Enviar pedido à mesa ' + details.number}</button>
          </form>
            </aside>
            <div className="min-w-0 space-y-3 lg:col-start-1 lg:row-start-1">
          <div className="space-y-2">
            <label htmlFor="table-product-search" className="block text-xs font-bold text-slate-200">Adicionar produtos</label>
            <input id="table-product-search" className={field + ' text-sm'} placeholder="Buscar pelo nome do produto..." value={search} onChange={event => setSearch(event.target.value)} />
            <div className="flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain pb-2" role="group" aria-label="Filtrar produtos por categoria">
              <button type="button" aria-pressed={category === 'all'} onClick={() => setCategory('all')}
                className={'min-h-10 shrink-0 whitespace-nowrap rounded-lg px-4 text-sm font-bold ' + (category === 'all' ? 'bg-[#ffca28] text-[#09283b]' : 'border border-[#63899a] bg-[#1b4055] text-white')}>Todos</button>
              {categories.map(item => <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => setCategory(item.id)}
                className={'min-h-10 shrink-0 whitespace-nowrap rounded-lg px-4 text-sm font-bold ' + (category === item.id ? 'bg-[#ffca28] text-[#09283b]' : 'border border-[#63899a] bg-[#1b4055] text-white')}>{item.name}</button>)}
            </div>
            <p className="text-xs text-slate-300">{filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {filteredProducts.map(item => <article key={item.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-[#49758b] bg-[#193b50] p-3">
              <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#26546a]">
                {item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" /> : <span className="text-3xl" aria-hidden="true">🥟</span>}
              </div>
              <div className="min-w-0 flex-1">
                <h5 className="line-clamp-2 text-sm font-extrabold leading-tight text-white">{item.name}</h5>
                <p className="mt-1 text-base font-black text-amber-200">{brl(item.price)}</p>
                {!item.available && <span className="text-xs font-bold text-red-200">Indisponível</span>}
              </div>
              <button type="button" disabled={!item.available} aria-label={'Adicionar ' + item.name}
                onClick={() => void chooseProduct(item)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#ffca28] text-2xl font-black text-[#102c40] disabled:opacity-40">+</button>
            </article>)}
          </div>
          {filteredProducts.length === 0 && <p className="text-sm text-white">Nenhum produto encontrado.</p>}

            </div>
          </div>
        </div>}
      </>}
        </div>
      </section>
    </div>}
    {product && (
      <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80 sm:items-center sm:p-4" onMouseDown={event => { if (event.target === event.currentTarget) setProduct(null) }}>
        <section role="dialog" aria-modal="true" aria-label={'Personalizar ' + product.name} className="product-customizer-modal flex max-h-[93dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-[#608ba0] bg-[#102c40] text-white shadow-2xl sm:rounded-3xl">
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[#41687c] p-5">
            <div><p className="text-xs font-black tracking-wider text-[#8be9fb]">MONTE DO SEU JEITO · MESA {details?.number}</p><h3 className="mt-2 text-2xl font-black text-white">{product.name}</h3><p className="mt-2 text-sm text-[#d4e8f2]">{product.description}</p></div>
            <button type="button" aria-label="Fechar" onClick={() => setProduct(null)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#28546b] text-white">✕</button>
          </header>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
            <h4 className="font-black text-white">Adicionais</h4>
            {additionsBusy ? <p>Carregando adicionais...</p> : additions.filter(item => item.available).length === 0 ? <p className="rounded-xl bg-[#20475d] p-3 text-white">Sem adicionais para este produto.</p> : additions.filter(item => item.available).map(item => <div key={item.id} className="flex items-center justify-between gap-3 border-b border-[#48758b] py-3">
              <div><strong className="text-white">{item.name}</strong><p className="text-sm text-[#c8e7f4]">+ {brl(item.price)}</p></div>
              <div className="flex items-center gap-2"><button type="button" aria-label={'Remover ' + item.name} onClick={() => setAmounts(values => ({ ...values, [item.id]: Math.max(0, (values[item.id] || 0) - 1) }))} className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffdc86] text-lg font-bold text-[#102b40]">−</button><span className="w-6 text-center font-bold text-white">{amounts[item.id] || 0}</span><button type="button" aria-label={'Adicionar ' + item.name} onClick={() => setAmounts(values => ({ ...values, [item.id]: (values[item.id] || 0) + 1 }))} className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffdc86] text-lg font-bold text-[#102b40]">+</button></div>
            </div>)}
            <div className="flex items-center justify-between gap-3 pt-3"><strong className="text-white">Quantidade</strong><div className="flex items-center gap-3"><button type="button" onClick={() => setQuantity(value => Math.max(1, value - 1))} className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffdc86] font-bold text-[#102b40]">−</button><strong className="text-white">{quantity}</strong><button type="button" onClick={() => setQuantity(value => value + 1)} className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffdc86] font-bold text-[#102b40]">+</button></div></div>
          </div>
          <footer className="shrink-0 border-t border-[#41687c] bg-[#102c40] p-5"><button type="button" disabled={additionsBusy} onClick={addProduct} className="min-h-12 w-full rounded-xl bg-[#ffca28] p-3 font-black text-[#102b40]">Adicionar · {brl(quantity * (Number(product.price) + additions.reduce((total, extra) => total + Number(extra.price) * (amounts[extra.id] || 0), 0)))}</button></footer>
        </section>
      </div>
    )}
    {printTable && <TableReceipt table={printTable} onClose={() => setPrintTable(null)} />}
    {dialog}
  </section>
}
