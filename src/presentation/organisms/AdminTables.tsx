import { useCallback, useEffect, useState } from 'react'
import { brl } from '../../api'
import { restaurantAdapter } from '../../infrastructure/http/restaurant-adapter'
import type { Product, RestaurantTable, TableOrders, TableSessions } from '../../domain/models'
import { useActionDialog } from '../molecules/ActionDialog'

type Props = { token: string; products: Product[] }
const field = 'min-h-11 w-full rounded-xl border border-[#63899a] bg-[#edf8fc] px-3 py-2 text-[#102c40]'
const button = 'min-h-11 rounded-xl bg-[#ffca28] px-4 py-2 font-bold text-[#09283b] disabled:opacity-50'

export default function AdminTables({ token, products }: Props) {
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [details, setDetails] = useState<TableOrders | null>(null)
  const [sessions, setSessions] = useState<TableSessions | null>(null)
  const [number, setNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [observation, setObservation] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
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

  async function createOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || !productId) return
    setBusy(true); setError('')
    try {
      await restaurantAdapter.create({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        observation: observation.trim() || null,
        tableId: selected,
        items: [{ productId, quantity, additions: [] }],
      }, token)
      setObservation('')
      setQuantity(1)
      await refresh(selected)
      notify({ title: 'Pedido lançado', message: 'O pedido foi vinculado à mesa.', tone: 'success' })
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
        <form onSubmit={event => void createOrder(event)} className="grid gap-3 rounded-xl bg-[#193e53] p-4 sm:grid-cols-2">
          <h4 className="font-black sm:col-span-2">Lançar pedido na mesa</h4>
          <label className="text-sm font-bold">Nome do cliente<input required className={field + ' mt-1'} value={customerName} onChange={event => setCustomerName(event.target.value)}/></label>
          <label className="text-sm font-bold">Telefone<input required type="tel" className={field + ' mt-1'} value={customerPhone} onChange={event => setCustomerPhone(event.target.value)}/></label>
          <label className="text-sm font-bold">Produto<select required className={field + ' mt-1'} value={productId} onChange={event => setProductId(event.target.value)}>
            <option value="">Escolha o produto</option>{products.filter(product => product.available).map(product => <option value={product.id} key={product.id}>{product.name} — {brl(product.price)}</option>)}
          </select></label>
          <label className="text-sm font-bold">Quantidade<input required type="number" min="1" step="1" className={field + ' mt-1'} value={quantity} onChange={event => setQuantity(Number(event.target.value))}/></label>
          <label className="text-sm font-bold sm:col-span-2">Observações<textarea maxLength={500} rows={2} className={field + ' mt-1'} value={observation} onChange={event => setObservation(event.target.value)} /></label>
          <button disabled={busy} className={button + ' sm:col-span-2'} type="submit">{busy ? 'Salvando...' : 'Adicionar pedido à mesa'}</button>
        </form>
        {sessions && <div className="space-y-2"><h4 className="font-black">Sessões anteriores e atuais</h4>{sessions.sessions.map(session => <div key={session.id} className="rounded-xl border border-[#446d82] p-3 text-sm"><p>{new Date(session.openedAt).toLocaleString('pt-BR')} — {session.closedAt ? new Date(session.closedAt).toLocaleString('pt-BR') : 'Em andamento'}</p><p>{session.orders.length} pedidos · {session.closedTotal ? brl(session.closedTotal) : 'Aberta'}</p></div>)}</div>}
      </>}
    </div>}
    {dialog}
  </section>
}
