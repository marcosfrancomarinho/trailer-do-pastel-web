import { useEffect, useState } from 'react'
import { restaurantAdapter } from '../../infrastructure/http/restaurant-adapter'
import type { RestaurantUser } from '../../domain/models'
import { useActionDialog } from '../molecules/ActionDialog'

export default function AdminUsers({ token }: { token: string }) {
  const [users, setUsers] = useState<RestaurantUser[]>([])
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const { confirm, notify, dialog } = useActionDialog()

  async function refresh() {
    setError('')
    try { setUsers(await restaurantAdapter.users(token)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao consultar usuários.') }
  }
  useEffect(() => { void refresh() }, [token])

  async function remove(user: RestaurantUser) {
    if (!await confirm({
      title: 'Excluir usuário?',
      message: 'O usuário ' + user.name + ' perderá acesso ao painel.',
      confirmLabel: 'Excluir usuário',
      tone: 'warning',
    })) return
    setBusy(user.id)
    try {
      await restaurantAdapter.removeUser(token, user.id)
      await refresh()
      notify({ title: 'Usuário excluído', message: user.name + ' foi removido.', tone: 'success' })
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao excluir usuário.') }
    finally { setBusy('') }
  }

  return <section className="space-y-4 text-white">
    <div className="flex items-center justify-between gap-2"><h2 className="text-2xl font-black">Gerenciar usuários</h2><button type="button" className="rounded-xl bg-[#ffca28] px-4 py-2 font-bold text-[#09283b]" onClick={() => void refresh()}>Atualizar</button></div>
    <p className="text-sm text-slate-200">Somente administradores podem listar ou excluir contas.</p>
    {error && <p role="alert" className="rounded-xl bg-[#562c37] p-3">{error}</p>}
    {users.map(user => <article key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#51778b] bg-[#14374d] p-4">
      <div><strong className="block">{user.name}</strong><p className="text-sm text-slate-200">{user.role === 'ADMIN' ? 'Administrador' : 'Funcionário'}</p></div>
      <button type="button" disabled={Boolean(busy)} onClick={() => void remove(user)} className="min-h-11 rounded-xl border border-red-300 bg-[#512832] px-4 text-sm font-bold text-white disabled:opacity-50">Excluir</button>
    </article>)}
    {users.length === 0 && !error && <p className="text-sm text-slate-200">Nenhum usuário listado.</p>}
    {dialog}
  </section>
}
