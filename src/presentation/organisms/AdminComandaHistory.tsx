import { useEffect, useMemo, useState } from 'react'
import { brl } from '../../api'
import type { RestaurantTable, TableSession } from '../../domain/models'
import { restaurantAdapter } from '../../infrastructure/http/restaurant-adapter'

type ClosedComanda = { table: RestaurantTable; session: TableSession }
const dateKey = (value: string | Date) => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date(value))
const dateTime = (value: string) => new Date(value).toLocaleString('pt-BR', {
  timeZone: 'America/Fortaleza', dateStyle: 'short', timeStyle: 'short',
})

export default function AdminComandaHistory({ token }: { token: string }) {
  const [date, setDate] = useState(dateKey(new Date()))
  const [allDates, setAllDates] = useState(false)
  const [comandas, setComandas] = useState<ClosedComanda[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    async function load() {
      try {
        const tables = await restaurantAdapter.tables(token)
        const results = await Promise.allSettled(tables.map(table =>
          restaurantAdapter.tableSessions(token, table.id)
        ))
        if (!active) return
        const success = results.flatMap((result, index) =>
          result.status === 'fulfilled'
            ? result.value.sessions.filter(session => session.closedAt !== null)
              .map(session => ({ table: tables[index], session }))
            : []
        )
        success.sort((a, b) => (b.session.closedAt ?? '').localeCompare(a.session.closedAt ?? ''))
        setComandas(success)
        if (results.some(result => result.status === 'rejected')) {
          setError('Algumas mesas não puderam ser consultadas. O histórico pode estar incompleto.')
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Falha ao carregar o histórico.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [token])

  const filtered = useMemo(() =>
    comandas.filter(item => allDates || (item.session.closedAt && dateKey(item.session.closedAt) === date)),
    [comandas, allDates, date]
  )
  const total = filtered.reduce((sum, item) => sum + Number(item.session.closedTotal ?? 0), 0)

  return <section className="min-w-0 space-y-4 rounded-2xl border border-[#426b80] bg-[#112e43] p-3 text-white sm:p-5">
    <div>
      <h2 className="text-xl font-black">Histórico de comandas</h2>
      <p className="mt-1 text-sm text-slate-300">Consulte as comandas encerradas e seus pedidos.</p>
    </div>
    <div className="flex flex-wrap items-end gap-3 rounded-xl bg-[#193e53] p-3">
      <label className="min-w-0 flex-1 text-sm font-bold">
        Data de encerramento
        <input type="date" lang="pt-BR" value={date} max={dateKey(new Date())}
          disabled={allDates} onChange={event => setDate(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-lg border border-[#84a8b9] bg-white px-3 text-[#123449] disabled:opacity-50" />
      </label>
      <button type="button" aria-pressed={allDates} onClick={() => setAllDates(value => !value)}
        className={'min-h-11 rounded-lg px-4 text-sm font-bold ' + (allDates ? 'bg-[#ffca28] text-[#102c40]' : 'border border-[#7294a7] text-white')}>
        {allDates ? 'Todas as datas ✓' : 'Todas as datas'}
      </button>
    </div>
    {error && <p role="alert" className="rounded-lg bg-[#563039] p-3 text-sm text-white">{error}</p>}
    {loading ? <p role="status" className="p-3 text-slate-200">Carregando histórico...</p> : <>
      <div className="flex flex-wrap justify-between gap-3 rounded-xl border border-[#426b80] p-3">
        <span className="text-sm font-bold">{filtered.length} {filtered.length === 1 ? 'comanda encerrada' : 'comandas encerradas'}</span>
        <strong className="text-amber-200">Total: {brl(total)}</strong>
      </div>
      {filtered.length === 0 && <p className="rounded-xl bg-[#193e53] p-5 text-center text-sm text-slate-200">Nenhuma comanda encerrada nesta data.</p>}
      <div className="space-y-2">
        {filtered.map(({ table, session }) => <article key={session.id} className="overflow-hidden rounded-xl border border-[#426b80] bg-[#193e53]">
          <button type="button" aria-expanded={expanded === session.id} onClick={() => setExpanded(value => value === session.id ? null : session.id)}
            className="flex min-h-16 w-full items-center justify-between gap-3 p-3 text-left">
            <div className="min-w-0">
              <strong className="block">Mesa {table.number}</strong>
              <span className="block text-xs text-slate-200">{session.closedAt ? dateTime(session.closedAt) : ''}</span>
              <span className="block break-all text-xs text-slate-300">Comanda: {session.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="shrink-0 text-right">
              <strong className="block text-amber-200">{brl(session.closedTotal ?? 0)}</strong>
              <span className="text-xs text-slate-300">{expanded === session.id ? 'Ocultar ▲' : 'Detalhes ▼'}</span>
            </div>
          </button>
          {expanded === session.id && <div className="space-y-3 border-t border-[#426b80] p-3 text-sm">
            <p className="break-all text-slate-200">ID completo da comanda: {session.id}</p>
            <p className="text-slate-300">Abertura: {dateTime(session.openedAt)}</p>
            {session.orders.length === 0 && <p>Nenhum pedido registrado.</p>}
            {session.orders.map(order => <div key={order.id} className="rounded-lg bg-[#102c40] p-3">
              <div className="flex justify-between gap-2"><strong>Pedido #{order.id.slice(0, 8)}</strong><strong>{brl(order.total)}</strong></div>
              <p className="mt-1 text-xs text-slate-300">{order.status === 'COMPLETED' ? 'Concluído' : order.status === 'CANCELED' ? 'Cancelado' : order.status}</p>
              <div className="mt-2 space-y-1">
                {order.items.map((item, index) => <div key={index}>
                  <p>{item.quantity}× {item.productName}</p>
                  {item.additions.map((addition, i) => <p key={i} className="pl-3 text-xs text-slate-300">+ {addition.quantity}× {addition.additionName}</p>)}
                </div>)}
              </div>
              {order.observation && <p className="mt-2 text-xs text-amber-100">Obs.: {order.observation}</p>}
            </div>)}
          </div>}
        </article>)}
      </div>
    </>}
  </section>
