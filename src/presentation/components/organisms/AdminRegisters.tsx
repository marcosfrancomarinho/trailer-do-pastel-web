import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../../../infrastructure/http/api-client'
import type { Addition, Category } from '../../../domain/models'

type Section = 'product' | 'addition' | 'user' | 'category'
type Props = { token: string; section: Section; onProductCreated: () => Promise<void> }
const inputClass = 'mt-2 w-full rounded-xl border-2 border-[#9ec9d9] bg-white px-4 py-3 outline-cyan-400'
const labelClass = 'block text-sm font-bold text-[#143b50]'

export default function AdminRegisters({ token, section, onProductCreated }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [additions, setAdditions] = useState<Addition[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [additionIds, setAdditionIds] = useState<string[]>([])
  const [password, setPassword] = useState('')
  const [available, setAvailable] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function loadOptions() {
    try {
      const [cats, adds] = await Promise.all([
        api<Category[]>('/categories'),
        api<Addition[]>('/additions'),
      ])
      setCategories(cats)
      setAdditions(adds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar categorias e adicionais.')
    }
  }
  useEffect(() => { void loadOptions() }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    const path = section === 'product' ? '/products' : section === 'addition' ? '/additions' : section === 'category' ? '/categories' : '/users'
    const body = section === 'product'
      ? { name: name.trim(), description: description.trim(), price, categoryId, additionIds, available }
      : section === 'addition'
        ? { name: name.trim(), price, available }
        : section === 'category' ? { name: name.trim() } : { name: name.trim(), password }
    try {
      await api<{ id: string }>(path, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: JSON.stringify(body),
      })
      setSuccess(section === 'product' ? 'Produto cadastrado com sucesso!' : section === 'addition' ? 'Adicional cadastrado com sucesso!' : section === 'category' ? 'Categoria cadastrada com sucesso!' : 'Usuário cadastrado com sucesso!')
      setName(''); setPassword(''); setPrice(''); setDescription(''); setAdditionIds([]); setAvailable(true)
      if (section === 'product' || section === 'category') await onProductCreated()
      if (section === 'addition') await loadOptions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao realizar cadastro.')
    } finally {
      setSaving(false)
    }
  }

  return <section className="mt-0 rounded-3xl border-2 border-[#0b4063] bg-white p-5 shadow-[5px_6px_0_#0b4063] sm:p-7">
    <p className="text-xs font-black tracking-widest text-[#008b9e]">GERENCIAMENTO</p>
    <h2 className="mt-2 text-2xl font-black">{section === "product" ? "Cadastrar produto" : section === "addition" ? "Cadastrar adicional" : section === "category" ? "Cadastrar categoria" : "Cadastrar usuário"}</h2>
    <p className="mt-2 text-sm text-[#557383]">Cadastre produtos, adicionais e usuários diretamente no painel.</p>
    <form onSubmit={e => void handleSubmit(e)} className="grid gap-5 sm:grid-cols-2">
      <label className={labelClass}>{section === 'user' ? 'Nome do usuário' : section === 'addition' ? 'Nome do adicional' : section === 'category' ? 'Nome da categoria' : 'Nome do produto'}
        <input className={inputClass} required value={name} onChange={e => setName(e.target.value)} placeholder="Nome" />
      </label>
      {section === 'category' ? null : section === 'user'
        ? <label className={labelClass}>Senha
          <input className={inputClass} type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
        </label>
        : <>
          <label className={labelClass}>Preço (R$)
            <input className={inputClass} type="number" step="0.01" min="0.01" required value={price} onChange={e => setPrice(e.target.value)} placeholder="12.50" />
          </label>
          {section === 'product' && <>
            <label className={labelClass}>Descrição
              <input className={inputClass} required value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex.: Pastel de carne com temperos" />
            </label>
            <label className={labelClass}>Categoria
              <select className={inputClass} required value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                <option value="">Selecione uma categoria</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <fieldset className="sm:col-span-2">
              <legend className="mb-3 text-sm font-bold text-[#143b50]">Adicionais permitidos (opcional)</legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {additions.map(a => <label key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-cyan-100 p-3 text-sm">
                  <span><input type="checkbox" disabled={!a.available} checked={additionIds.includes(a.id)}
                    onChange={e => setAdditionIds(ids => e.target.checked ? [...ids, a.id] : ids.filter(id => id !== a.id))}
                    className="mr-2 accent-[#0079b6]" />{a.name}</span>
                  <span className="text-[#557383]">R$ {Number(a.price).toFixed(2).replace('.', ',')}</span>
                </label>)}
                {additions.length === 0 && <p className="text-sm text-[#557383]">Ainda não há adicionais cadastrados.</p>}
              </div>
            </fieldset>
          </>}
          <label className="flex items-center gap-3 text-sm font-bold sm:col-span-2">
            <input type="checkbox" checked={available} onChange={e => setAvailable(e.target.checked)} className="accent-[#0079b6]" />
            Disponível no cardápio
          </label>
        </>}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{error}</p>}
      {success && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-700 sm:col-span-2">{success}</p>}
      <button disabled={saving} type="submit" className="rounded-full bg-[#ffc629] px-7 py-3 font-extrabold text-[#113548] disabled:opacity-60 sm:col-span-2">
        {saving ? 'Salvando...' : section === 'product' ? 'Cadastrar produto' : section === 'addition' ? 'Cadastrar adicional' : section === 'category' ? 'Cadastrar categoria' : 'Cadastrar usuário'}
      </button>
    </form>
  </section>
}
