import { useCallback, useEffect, useMemo, useState } from 'react'
import { cartTotal, toOrderPayload, type CartItem } from '../../domain/cart'
import { brl } from '../../api'
import { restaurantAdapter } from '../../infrastructure/http/restaurant-adapter'
import type { Addition, Category, Product, RestaurantTable, TableOrders, TableSessions } from '../../domain/models'
import { useActionDialog } from '../molecules/ActionDialog'

type Props = { token: string; products: Product[]; categories: Category[] }
const TABLE_ORDER_NAME = 'Trailer do Pastel'
const TABLE_ORDER_PHONE = '99984636486'
const field = 'min-h-11 w-full rounded-xl border border-[#63899a] bg-[#edf8fc] px-3 py-2 text-[#102c40]'
const button = 'min-h-11 rounded-xl bg-[#ffca28] px-4 py-2 font-bold text-[#09283b] disabled:opacity-50'

export default function AdminTables({ token, products, categories }: Props) {
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [details, setDetails] = useState<TableOrders | null>(null)
  const [sessions, setSessions] = useState<TableSessions | null>(null)
  const [number, setNumber] = useState('')
  const [observation, setObservation] = useState('')
  const [product, setProduct] = useState<Product | null>(null)
  const [additions, setAdditions] = useState<Addition[]>([])
  const [additionsBusy, setAdditionsBusy] = useState(false)
  const [amounts, setAmounts] = useState<Record<string, number>>({})
  const [quantity, setQuantity] = useState(1)
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [addedMessage, setAddedMessage] = useState('')
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
    if (tableId) setDetails(await restaurantAdapter.tableOrders(token, tableId))
  }, [token])

  useEffect(() => {
    let active = true
    restaurantAdapter.tables(token).then(list => { if (active) setTables(list) })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Erro ao carregar mesas.') })
    return () => { active = false }
  }, [token])

  async function openTable(id: string) {
    setSelected(id)
    setSessions(null)
    setDetails(null)
    setCart([])
    setAddedMessage('')
    setError('')
    try { setDetails(await restaurantAdapter.tableOrders(token, id)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Erro ao abrir mesa.') }
  }

  async function createTable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = Number(number)
    if (!Number.isInteger(value) || value < 1) return
    setBusy(true); setError('')
    try {
      await restaurantAdapter.createTable(token, value)
      setNumber('')
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
    setAddedMessage(quantity + '× ' + product.name + ' adicionado ao pedido da mesa.')
    setProduct(null)
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
      setAddedMessage('')
      await refresh(selected)
      notify({ title: 'Pedido lançado', message: 'Os produtos foram vinculados à mesa.', tone: 'success' })
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao lançar pedido.') }
    finally { setBusy(false) }
  }

  async function release() {
    if (!selected) return
    if (!await confirm({ title: 'Liberar mesa?', message: 'A sessão será encerrada e o valor consumido ficará no histórico.', confirmLabel: 'Liberar mesa' })) return
    setBusy(true); setError('')
    try {
      const result = await restaurantAdapter.releaseTable(token, selected)
      await refresh(selected)
      notify({ title: 'Mesa liberada', message: 'Total encerrado: ' + brl(result.closedTotal), tone: 'success' })
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível liberar a mesa.') }
    finally { setBusy(false) }
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
      setSessions(null)
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

  async function showSessions() {
    if (!selected) return
    try { setSessions(await restaurantAdapter.tableSessions(token, selected)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Erro ao carregar histórico.') }
  }

  return <section className="space-y-5 text-white">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-2xl font-black">Mapa de mesas</h2><p className="text-sm text-slate-300">Verde: livre · Amarelo: ocupada · Mesas livres podem ser retiradas de uso</p></div>
      <button className={button} type="button" onClick={() => void refresh(selected).catch(cause => setError(String(cause)))}>Atualizar</button>
    </div>
    <form onSubmit={event => void createTable(event)} className="flex flex-wrap items-end gap-2 rounded-xl bg-[#14374d] p-4">
      <label className="text-sm font-bold">Número da nova mesa
        <input type="number" min="1" step="1" required className={field + ' mt-2'} value={number} onChange={event => setNumber(event.target.value)} />
      </label>
      <button disabled={busy} type="submit" className={button}>Cadastrar mesa</button>
    </form>
    {error && <p role="alert" className="rounded-xl border border-red-400 bg-[#562932] p-3 text-white">{error}</p>}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {tables.map(table => <button key={table.id} type="button" onClick={() => void openTable(table.id)}
        className={'min-h-32 rounded-2xl border-2 p-3 text-left transition ' +
          (table.status === 'FREE' ? 'border-[#60dcaa] bg-[#164734] text-white' : 'border-[#ffce56] bg-[#544221] text-white') +
          (selected === table.id ? ' outline outline-2 outline-white' : '')}>
        <strong className="block text-xl">Mesa {table.number}</strong>
        <span className="mt-2 block text-sm font-bold">{table.status === 'FREE' ? '✓ Livre' : '● Ocupada'}</span>
        <span className="mt-2 block font-black">{brl(table.totalSpent)}</span>
      </button>)}
    </div>
    {tables.length === 0 && <p className="text-sm text-slate-300">Nenhuma mesa cadastrada.</p>}
    {selected && <div className="space-y-4 rounded-2xl border border-[#537d90] bg-[#112e43] p-4 sm:p-6">
      {!details ? <p>Carregando detalhes...</p> : <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="text-xl font-black">Mesa {details.number}</h3><p className="text-sm text-slate-200">{details.status === 'FREE' ? 'Livre' : 'Ocupada'} · Total consumido: <strong>{brl(details.totalSpent)}</strong></p></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={button} onClick={() => void showSessions()}>Histórico</button>
            {details.status === 'OCCUPIED' ? (
              <button disabled={busy} type="button" className={button} onClick={() => void release()}>Liberar mesa</button>
            ) : (
              <button
                disabled={busy}
                type="button"
                className="min-h-11 rounded-xl border border-red-300 bg-[#572b36] px-4 py-2 font-bold text-white disabled:opacity-50"
                onClick={() => void archiveTable()}
              >
                Retirar mesa de uso
              </button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-black">Pedidos vinculados</h4>
          {details.orders.length === 0 && <p className="text-sm text-slate-300">Nenhum pedido nesta sessão.</p>}
          {details.orders.map(order => <div key={order.id} className="rounded-xl border border-[#466b7f] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><strong>#{order.id.slice(0,8)} · {order.customerName}</strong><strong>{brl(order.total)}</strong></div>
            <p className="text-xs text-slate-200">{order.status} · {order.items.map(item => item.quantity + '× ' + item.productName).join(', ')}</p>
            {order.observation && <p className="mt-1 text-sm text-amber-200">Obs.: {order.observation}</p>}
            {order.status !== 'CANCELED' && <button type="button" disabled={busy} onClick={() => void removeOrder(order.id)} className="mt-2 text-sm font-bold text-red-200 underline">Cancelar pedido</button>}
          </div>)}
        </div>
        <div className="space-y-4 border-t border-[#486f83] pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h4 className="text-xl font-black">Cardápio da mesa {details.number}</h4><p className="text-sm text-slate-200">Escolha produtos e adicionais como no cardápio do cliente.</p></div>
            <a href="#table-cart-summary" className="rounded-full bg-[#ffca28] px-4 py-2 font-black text-[#102b40]">Ver comanda · {draftCount} itens · {brl(cartTotal(cart))}</a>
          </div>
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,330px)]">
            <aside id="table-cart-summary" className="order-table-cart-panel min-w-0 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1">
          <form onSubmit={event => void createOrder(event)} className="grid gap-3 rounded-xl border border-[#527b8e] bg-[#193e53] p-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="flex items-center justify-between gap-2 sm:col-span-2 lg:col-span-1 lg:col-span-1">
              <div><p className="text-xs font-bold text-cyan-200">COMANDA EM MONTAGEM</p><h4 className="text-lg font-black text-white">Mesa {details.number}</h4></div>
              <span className="rounded-full bg-[#ffca28] px-3 py-1 text-xs font-black text-[#102c40]">{cart.reduce((sum, item) => sum + item.quantity, 0)} itens</span>
            </div>
            {addedMessage && <p role="status" className="rounded-lg border border-green-400 bg-[#164735] p-2 text-xs font-bold text-white sm:col-span-2 lg:col-span-1">✓ {addedMessage}</p>}
            <div className="space-y-2 sm:col-span-2">
              {cart.map(item => <div key={item.key} className="rounded-xl border border-[#63899a] bg-[#102c40] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>{item.quantity}× {item.product.name}</strong><span>{brl(item.quantity * (Number(item.product.price) + item.additions.reduce((total, extra) => total + Number(extra.addition.price) * extra.quantity, 0)))}</span>
                </div>
                {item.additions.map(extra => <p key={extra.addition.id} className="text-sm text-slate-200">+ {extra.quantity}× {extra.addition.name}</p>)}
                <div className="mt-2 flex items-center gap-3">
                  <button type="button" aria-label="Diminuir quantidade" onClick={() => setCart(items => items.map(value => value.key === item.key ? { ...value, quantity: value.quantity - 1 } : value).filter(value => value.quantity > 0))} className="rounded-lg bg-[#ffca28] px-3 py-1 font-bold text-[#102c40]">−</button>
                  <button type="button" aria-label="Aumentar quantidade" onClick={() => setCart(items => items.map(value => value.key === item.key ? { ...value, quantity: value.quantity + 1 } : value))} className="rounded-lg bg-[#ffca28] px-3 py-1 font-bold text-[#102c40]">+</button>
                  <button type="button" onClick={() => setCart(items => items.filter(value => value.key !== item.key))} className="ml-auto text-sm font-bold text-red-200 underline">Remover</button>
                </div>
              </div>)}
              {cart.length === 0 && <p className="text-sm text-slate-200">Selecione um produto acima para começar.</p>}
            </div>
            <p className="rounded-lg border border-[#547b8e] bg-[#102c40] p-3 text-sm text-slate-200 sm:col-span-2 lg:col-span-1">Pedido interno vinculado à mesa, sem necessidade de informar nome ou telefone do cliente.</p>
            <label className="text-sm font-bold sm:col-span-2">Observações<textarea maxLength={500} rows={2} className={field + ' mt-1'} value={observation} onChange={event => setObservation(event.target.value)} /></label>
            <div className="flex items-center justify-between gap-3 rounded-lg border-t border-[#547b8e] pt-3 sm:col-span-2"><span className="font-black">Total do pedido</span><strong className="text-lg text-amber-200">{brl(cartTotal(cart))}</strong></div>
            <button disabled={busy || cart.length === 0} className={button + ' sm:col-span-2'} type="submit">{busy ? 'Salvando...' : 'Enviar pedido para mesa ' + details.number}</button>
          </form>
            </aside>
            <div className="min-w-0 space-y-3 lg:col-start-1 lg:row-start-1">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setCategory('all')} className={category === 'all' ? button : 'min-h-11 rounded-xl border border-[#63899a] px-3 text-white'}>Todos</button>
            {categories.map(item => <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={category === item.id ? button : 'min-h-11 rounded-xl border border-[#63899a] px-3 text-white'}>{item.name}</button>)}
          </div>
          <input className={field} aria-label="Buscar produto da mesa" placeholder="Buscar produto..." value={search} onChange={event => setSearch(event.target.value)} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-2">
            {filteredProducts.map(item => <article key={item.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-[#49758b] bg-[#193b50] p-2.5 shadow-sm">
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
        </div>
        {sessions && <div className="space-y-2"><h4 className="font-black">Sessões anteriores e atuais</h4>{sessions.sessions.map(session => <div key={session.id} className="rounded-xl border border-[#446d82] p-3 text-sm"><p>{new Date(session.openedAt).toLocaleString('pt-BR')} — {session.closedAt ? new Date(session.closedAt).toLocaleString('pt-BR') : 'Em andamento'}</p><p>{session.orders.length} pedidos · {session.closedTotal ? brl(session.closedTotal) : 'Aberta'}</p></div>)}</div>}
      </>}
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
    {dialog}
  </section>
}
