import { useEffect, useState } from 'react'
import { restaurantAdapter } from '../../infrastructure/http/restaurant-adapter'
import type { StoreState } from '../../domain/models'
import { useActionDialog } from '../molecules/ActionDialog'

export default function AdminStore({ token }: { token: string }) {
  const [store, setStore] = useState<StoreState | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { confirm, notify, dialog } = useActionDialog()

  useEffect(() => {
    let active = true
    restaurantAdapter.storeStatus().then(result => { if (active) setStore(result) })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Erro ao consultar loja.') })
    return () => { active = false }
  }, [])

  async function change(open: boolean) {
    const approved = await confirm({
      title: open ? 'Abrir a loja?' : 'Fechar a loja?',
      message: open ? 'O cardápio voltará a aceitar pedidos dos clientes.' : 'Clientes não poderão enviar novos pedidos enquanto a loja estiver fechada.',
      confirmLabel: open ? 'Abrir loja' : 'Fechar loja',
    })
    if (!approved) return
    setBusy(true); setError('')
    try {
      const next = await restaurantAdapter.setStoreOpen(token, open)
      setStore(next)
      notify({ title: open ? 'Loja aberta' : 'Loja fechada', message: open ? 'Os clientes já podem fazer pedidos.' : 'Novos pedidos públicos foram bloqueados.', tone: 'success' })
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao alterar funcionamento.') }
    finally { setBusy(false) }
  }

  return <section className="space-y-5 rounded-2xl border border-[#47778b] bg-[#112e43] p-5 text-white">
    <h2 className="text-2xl font-black">Funcionamento da loja</h2>
    <p className="text-slate-200">Controle quando o cardápio aceita novos pedidos para retirada.</p>
    <div role="status" className={'rounded-xl border-2 p-5 ' + (store?.status === 'OPEN' ? 'border-green-400 bg-[#174635]' : 'border-amber-400 bg-[#4a3925]')}>
      <strong className="text-xl">{store ? store.status === 'OPEN' ? '🟢 Loja aberta' : '🔴 Loja fechada' : 'Consultando status...'}</strong>
      {store && <p className="mt-2 text-sm text-slate-200">Atualizado em {new Date(store.updatedAt).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' })}</p>}
    </div>
    {error && <p role="alert" className="rounded-lg bg-[#5f2835] p-3">{error}</p>}
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={busy || !store || store.status === 'OPEN'} onClick={() => void change(true)} className="min-h-12 rounded-xl bg-green-300 px-5 font-black text-[#10382b] disabled:opacity-40">Abrir loja</button>
      <button type="button" disabled={busy || !store || store.status === 'CLOSED'} onClick={() => void change(false)} className="min-h-12 rounded-xl bg-amber-300 px-5 font-black text-[#422910] disabled:opacity-40">Fechar loja</button>
      <button type="button" onClick={() => void restaurantAdapter.storeStatus().then(setStore).catch(cause => setError(String(cause)))} className="min-h-12 rounded-xl border border-[#668a9f] px-5 font-bold">Atualizar</button>
    </div>
    {dialog}
  </section>
}
