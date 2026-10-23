import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { restaurant } from '../../application/container'
import { brl } from '../../api'
import { useActionDialog } from '../molecules/ActionDialog'
import type { Addition, Category, Product } from '../../domain/models'

type Kind = 'product' | 'addition' | 'category'
type Item = Product | Addition | Category
type Props = { kind: Kind; token: string; refreshCatalog: () => Promise<void> }

const inputClass = 'mt-2 min-h-12 w-full rounded-xl border border-[#8eaec0] bg-white px-4 py-3 text-[#102b40]'
const labelClass = 'block min-w-0 text-sm font-semibold text-white'
const kindRoute: Record<Kind, 'products' | 'additions' | 'categories'> = {
  product: 'products',
  addition: 'additions',
  category: 'categories',
}

export default function AdminManage({ kind, token, refreshCatalog }: Props) {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [additions, setAdditions] = useState<Addition[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [available, setAvailable] = useState(true)
  const [additionIds, setAdditionIds] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const { confirm, notify, dialog } = useActionDialog()

  async function reload() {
    try {
      const [records, cats, adds] = await Promise.all([
        restaurant.listRecords(kindRoute[kind]) as Promise<Item[]>,
        restaurant.listRecords('categories') as Promise<Category[]>,
        restaurant.listRecords('additions') as Promise<Addition[]>,
      ])
      setItems(records)
      setCategories(cats)
      setAdditions(adds)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar cadastros.')
    }
  }

  useEffect(() => { void reload() }, [kind])

  useEffect(() => {
    if (!editing) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) setEditing(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [editing, busy])

  async function startEdit(item: Item) {
    setEditing(item.id)
    setError('')
    setMessage('')
    setName(item.name)
    setAdditionIds([])
    if ('price' in item) {
      setPrice(item.price)
      setAvailable(item.available)
    }
    if ('description' in item) {
      setDescription(item.description)
      setCategoryId(item.categoryId)
      setImageUrl(item.imageUrl ?? '')
      try {
        const extras = await restaurant.additions(item.id)
        setAdditionIds(extras.map(extra => extra.id))
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Falha ao carregar adicionais.')
      }
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing || busy) return

    const body = kind === 'category'
      ? { name }
      : kind === 'addition'
        ? { name, price, available }
        : { name, description, price, categoryId, imageUrl: imageUrl.trim() || null, additionIds, available }

    setBusy(true)
    setError('')
    try {
      await restaurant.updateRecord(kindRoute[kind], editing, token, body)
      setEditing(null)
      setMessage('Cadastro atualizado com sucesso.')
      notify({ title: 'Alteração salva', message: 'As informações foram atualizadas com sucesso.', tone: 'success' })
      await reload()
      await refreshCatalog()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(item: Item) {
    const approved = await confirm({
      title: 'Excluir cadastro?',
      message: 'Deseja excluir "' + item.name + '"? Essa ação não pode ser desfeita.',
      confirmLabel: 'Sim, excluir',
    })
    if (!approved) return
    setBusy(true)
    setError('')
    try {
      await restaurant.removeRecord(kindRoute[kind], item.id, token)
      setMessage('Cadastro excluído.')
      notify({ title: 'Cadastro excluído', message: 'O cadastro foi excluído com sucesso.', tone: 'success' })
      await reload()
      await refreshCatalog()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível excluir. O cadastro pode estar em uso.')
    } finally {
      setBusy(false)
    }
  }

  const heading = kind === 'product' ? 'Produtos' : kind === 'addition' ? 'Adicionais' : 'Categorias'

  return (
    <section className="rounded-2xl border border-[#365b70] bg-[#112e43] p-4 text-white sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-black sm:text-2xl">{heading}</h2>
        <button type="button" onClick={() => void reload()} className="min-h-11 rounded-xl border border-[#6a98ad] px-4 py-2 text-sm font-bold text-white">
          Atualizar
        </button>
      </div>

      {message && <p role="status" className="mb-4 rounded-xl bg-[#24583d] p-3 text-sm font-semibold text-white">{message}</p>}
      {error && !editing && <p role="alert" className="mb-4 rounded-xl bg-[#5b2832] p-3 text-sm font-semibold text-white">{error}</p>}

      <div className="grid gap-3">
        {items.map(item => (
          <article key={item.id} className="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-xl border border-[#37637b] bg-[#19394f] p-4 sm:p-5">
            <div className="min-w-0 flex-1">
              <h3 className="break-words text-base font-extrabold text-white">{item.name}</h3>
              {'price' in item && (
                <p className="mt-1 text-sm text-slate-200">
                  {brl(item.price)} · {item.available ? 'Disponível' : 'Indisponível'}
                </p>
              )}
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                disabled={busy}
                onClick={() => void startEdit(item)}
                className="min-h-11 flex-1 rounded-xl bg-[#b6e8f5] px-4 py-2 text-sm font-extrabold text-[#0c3044] sm:flex-none"
              >
                Editar
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove(item)}
                className="min-h-11 flex-1 rounded-xl bg-[#fbe0dc] px-4 py-2 text-sm font-extrabold text-[#7c202c] sm:flex-none"
              >
                Excluir
              </button>
            </div>
          </article>
        ))}
        {items.length === 0 && <p className="py-8 text-center text-slate-200">Nenhum cadastro encontrado.</p>}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4"
          onMouseDown={event => {
            if (event.target === event.currentTarget && !busy) setEditing(null)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-catalog-title"
            className="flex max-h-[96dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-[#4b7b93] bg-[#102b40] shadow-2xl sm:max-h-[90dvh] sm:rounded-3xl"
          >
            <header className="flex items-center justify-between gap-3 border-b border-[#31566e] px-5 py-4 sm:px-7">
              <h2 id="edit-catalog-title" className="text-xl font-black">
                Editar {kind === 'product' ? 'produto' : kind === 'addition' ? 'adicional' : 'categoria'}
              </h2>
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditing(null)}
                aria-label="Fechar edição"
                className="min-h-11 min-w-11 rounded-xl bg-[#21485d] text-lg font-bold text-white"
              >
                ✕
              </button>
            </header>

            <form onSubmit={event => void save(event)} className="min-h-0 overflow-y-auto p-5 sm:p-7">
              {error && <p role="alert" className="mb-4 rounded-xl bg-[#5b2832] p-3 text-sm font-semibold text-white">{error}</p>}
              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>
                  Nome
                  <input required autoFocus className={inputClass} value={name} onChange={event => setName(event.target.value)} />
                </label>

                {kind !== 'category' && (
                  <>
                    <label className={labelClass}>
                      Preço (R$)
                      <input required type="number" step="0.01" min="0.01" className={inputClass} value={price} onChange={event => setPrice(event.target.value)} />
                    </label>
                    <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[#47778f] bg-[#1b4056] p-3 text-sm font-bold text-white sm:col-span-2">
                      <input type="checkbox" checked={available} onChange={event => setAvailable(event.target.checked)} className="h-5 w-5 accent-[#ffca28]" />
                      Disponível no cardápio
                    </label>
                  </>
                )}

                {kind === 'product' && (
                  <>
                    <label className={labelClass}>
                      Descrição
                      <input className={inputClass} value={description} onChange={event => setDescription(event.target.value)} />
                    </label>
                    <label className={labelClass}>
                      Categoria
                      <select required className={inputClass} value={categoryId} onChange={event => setCategoryId(event.target.value)}>
                        <option value="">Selecione a categoria</option>
                        {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                      </select>
                    </label>
                    <label className={labelClass + ' sm:col-span-2'}>
                      URL da imagem
                      <input type="url" className={inputClass} value={imageUrl} onChange={event => setImageUrl(event.target.value)} placeholder="https://..." />
                    </label>
                    <fieldset className="rounded-xl border border-[#47778f] p-4 sm:col-span-2">
                      <legend className="px-2 text-sm font-bold text-white">Adicionais permitidos</legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {additions.map(addition => (
                          <label key={addition.id} className="flex items-center gap-3 rounded-lg bg-[#20475e] p-3 text-sm text-white">
                            <input
                              type="checkbox"
                              checked={additionIds.includes(addition.id)}
                              onChange={event => setAdditionIds(ids => event.target.checked ? [...ids, addition.id] : ids.filter(id => id !== addition.id))}
                              className="h-5 w-5 accent-[#ffca28]"
                            />
                            {addition.name} ({brl(addition.price)})
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </>
                )}
              </div>
              <footer className="sticky bottom-0 mt-6 flex flex-col-reverse gap-3 bg-[#102b40] pt-4 sm:flex-row sm:justify-end">
                <button type="button" disabled={busy} onClick={() => setEditing(null)} className="min-h-12 rounded-xl border border-[#7a9bab] px-5 py-3 font-bold text-white">
                  Voltar
                </button>
                <button type="submit" disabled={busy} className="min-h-12 rounded-xl bg-[#ffca28] px-6 py-3 font-extrabold text-[#082739] disabled:opacity-60">
                  {busy ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
      {dialog}
    </section>
  )
}
