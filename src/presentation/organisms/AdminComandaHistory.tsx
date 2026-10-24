import { useEffect, useState } from 'react'
import { brl } from '../../api'
import type { ClosedComanda } from '../../domain/models'
import { restaurantAdapter } from '../../infrastructure/http/restaurant-adapter'
import { printComandaReport } from './print-comanda-report'

const dateKey = (value: string | Date) => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date(value))
const dateTime = (value: string) => new Date(value).toLocaleString('pt-BR', {
  timeZone: 'America/Fortaleza', dateStyle: 'short', timeStyle: 'short',
})

export default function AdminComandaHistory({ token }: { token: string }) {
  const [date, setDate] = useState(dateKey(new Date()))
  const [comandas, setComandas] = useState<ClosedComanda[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [requestedDate, setRequestedDate] = useState(date)
  const [refreshKey, setRefreshKey] = useState(0)
  const [originFilter, setOriginFilter] = useState<'ALL' | 'TABLE' | 'ONLINE'>('ALL')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    async function load() {
      try {
        const result = await restaurantAdapter.closedComandas(token, requestedDate)
        if (active) setComandas(result.comandas)
      } catch (cause) {
        if (active) {
          setComandas([])
          const message = cause instanceof Error ? cause.message : 'Falha ao carregar o histórico.'
          setError(/404|not found|não encontrada/i.test(message)
            ? 'A rota de histórico de comandas não está disponível no servidor. É necessário publicar a atualização do backend.'
            : message)
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [token, requestedDate, refreshKey])

  const visibleComandas = comandas.filter(item => originFilter === 'ALL' || (item.origin ?? 'TABLE') === originFilter)
  const total = visibleComandas.reduce((sum, item) => sum + Number(item.session.closedTotal ?? 0), 0)
  const completedOrders = visibleComandas.flatMap(({ tableNumber, session }) =>
    session.orders.filter(order => order.status === 'COMPLETED')
      .map(order => ({ tableNumber, session, order }))
  )

  return <section className="min-w-0 space-y-4 rounded-2xl border border-[#426b80] bg-[#112e43] p-3 text-white sm:p-5">
    <div>
      <h2 className="text-xl font-black">Histórico de comandas</h2>
      <p className="mt-1 text-sm text-slate-300">Consulte comandas de mesa e pedidos online concluídos ou cancelados pela data de finalização.</p>
    </div>
    <div className="flex flex-wrap items-end gap-3 rounded-xl bg-[#193e53] p-3">
      <label className="min-w-0 flex-1 text-sm font-bold">
        Data de finalização
        <input type="date" lang="pt-BR" value={date} max={dateKey(new Date())}
          onChange={event => setDate(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-lg border border-[#84a8b9] bg-white px-3 text-[#123449]" />
      </label>
      <button type="button" disabled={loading || !date} onClick={() => { setExpanded(null); setRequestedDate(date); setRefreshKey(value => value + 1) }}
        className="min-h-11 rounded-lg bg-[#ffca28] px-4 text-sm font-bold text-[#102c40] disabled:opacity-55">Buscar por data</button>
    </div>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar origem dos pedidos">
      {([{ value: 'ALL', label: 'Todas' }, { value: 'TABLE', label: 'Mesas' }, { value: 'ONLINE', label: 'Online' }] as const).map(option =>
        <button key={option.value} type="button" aria-pressed={originFilter === option.value} onClick={() => { setOriginFilter(option.value); setExpanded(null) }}
          className={'rounded-lg border px-4 py-2 text-sm font-bold ' + (originFilter === option.value ? 'border-amber-300 bg-[#ffca28] text-[#102c40]' : 'border-[#648da0] text-slate-100')}>
          {option.label}
        </button>)}
    </div>
    {error && <p role="alert" className="rounded-lg bg-[#563039] p-3 text-sm text-white">{error}</p>}
    {loading ? <p role="status" className="p-3 text-slate-200">Carregando histórico...</p> : <>
      <div className="flex flex-wrap justify-between gap-3 rounded-xl border border-[#426b80] p-3">
        <span className="text-sm font-bold">{visibleComandas.length} {visibleComandas.length === 1 ? 'registro finalizado' : 'registros finalizados'}</span>
        <strong className="text-amber-200">Total realizado: {brl(total)}</strong>
      </div>
      <button type="button" disabled={loading || !!error || completedOrders.length === 0 || date !== requestedDate}
        onClick={() => printComandaReport(visibleComandas, requestedDate)}
        className="min-h-11 w-full rounded-xl border border-[#ffca28] bg-[#ffca28] px-4 py-2 text-sm font-bold text-[#102c40] disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto">
        🖨️ Imprimir relatório de realizados
      </button>
      {!error && visibleComandas.length === 0 && <p className="rounded-xl bg-[#193e53] p-5 text-center text-sm text-slate-200">Nenhuma comanda ou pedido online finalizado na data selecionada.</p>}
      <div className="space-y-2">
        {visibleComandas.map(({ tableNumber, session, origin }) => <article key={session.id} className="overflow-hidden rounded-xl border border-[#426b80] bg-[#193e53]">
          <button type="button" aria-expanded={expanded === session.id} onClick={() => setExpanded(value => value === session.id ? null : session.id)}
            className="flex min-h-16 w-full items-center justify-between gap-3 p-3 text-left">
            <div className="min-w-0">
              <strong className="block">{origin === 'ONLINE' || tableNumber == null ? 'Pedido online' : `Mesa ${tableNumber}`}</strong>
              <span className="block text-xs text-slate-200">{session.closedAt ? dateTime(session.closedAt) : ''}</span>
              <span className="block break-all text-xs text-slate-300">Comanda: {session.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="shrink-0 text-right">
              <strong className="block text-amber-200">{brl(session.closedTotal ?? 0)}</strong>
              <span className="text-xs text-slate-300">{expanded === session.id ? 'Ocultar ▲' : 'Detalhes ▼'}</span>
            </div>
          </button>
          {expanded === session.id && <div className="space-y-3 border-t border-[#426b80] p-3 text-sm">
            <p className="break-all text-slate-200">ID da comanda: {session.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-slate-300">Abertura: {dateTime(session.openedAt)}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {([
                { title: 'Realizados', status: 'COMPLETED', style: 'border-emerald-500/70 bg-[#133f39]', heading: 'text-emerald-200' },
                { title: 'Cancelados', status: 'CANCELED', style: 'border-red-400/80 bg-[#482a33]', heading: 'text-red-200' },
              ] as const).map(group => {
                const orders = session.orders.filter(order => order.status === group.status)
                return <section key={group.status} className={'min-w-0 rounded-xl border-2 p-3 ' + group.style}>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className={'font-bold ' + group.heading}>{group.title}</h3>
                    <span className={'text-xs font-bold ' + group.heading}>{orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}</span>
                  </div>
                  {orders.length === 0 ? <p className="text-xs text-slate-300">Nenhum pedido {group.status === 'CANCELED' ? 'cancelado' : 'concluído'}.</p> :
                    <div className="space-y-2">
                      {orders.map(order => <div key={order.id} className={'rounded-lg border p-3 ' + (group.status === 'CANCELED' ? 'border-red-400 bg-[#562733]' : 'border-emerald-500/60 bg-[#102f32]')}>
                        <div className="flex flex-wrap justify-between gap-2">
                          <strong>Pedido #{order.id.slice(0, 8).toUpperCase()}</strong>
                          <strong>{brl(order.total)}</strong>
                        </div>
                        <p className={'mt-1 text-xs font-bold ' + group.heading}>{group.status === 'CANCELED' ? 'Cancelado' : 'Concluído'}</p>
                        <div className="mt-2 space-y-1">
                          {order.items.map((item, index) => <div key={index}>
                            <p>{item.quantity}× {item.productName}</p>
                            {item.additions.map((addition, i) => <p key={i} className="pl-3 text-xs text-slate-300">+ {addition.quantity}× {addition.additionName}</p>)}
                          </div>)}
                        </div>
                        {order.observation && <p className="mt-2 text-xs text-amber-100">Obs.: {order.observation}</p>}
                      </div>)}
                    </div>}
                </section>
              })}
            </div>
            {session.orders.some(order => order.status !== 'COMPLETED' && order.status !== 'CANCELED') &&
              <p className="text-xs text-slate-300">Outros pedidos: {session.orders.filter(order => order.status !== 'COMPLETED' && order.status !== 'CANCELED').length} com status diferente de concluído ou cancelado.</p>}
          </div>}
        </article>)}
      </div>
    </>}

  </section>
}
