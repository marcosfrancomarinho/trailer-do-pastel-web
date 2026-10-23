import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { restaurant } from '../../application/container'
import { brl } from '../../api'
import type { Product, Addition, Category } from '../../domain/models'
type Kind = 'product' | 'addition' | 'category'
type Item = Product | Addition | Category
type Props = { kind: Kind; token: string; refreshCatalog: () => Promise<void> }
const field = 'mt-1 w-full rounded-xl border-2 border-cyan-200 bg-white px-4 py-3'
export default function AdminManage({kind, token, refreshCatalog}: Props) {
  const [items,setItems]=useState<Item[]>([])
  const [categories,setCategories]=useState<Category[]>([])
  const [additions,setAdditions]=useState<Addition[]>([])
  const [editing,setEditing]=useState<string|null>(null)
  const [name,setName]=useState('')
  const [description,setDescription]=useState('')
  const [price,setPrice]=useState('')
  const [categoryId,setCategoryId]=useState('')
  const [imageUrl,setImageUrl]=useState('')
  const [available,setAvailable]=useState(true)
  const [additionIds,setAdditionIds]=useState<string[]>([])
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')
  const path=kind==='product'?'/products':kind==='addition'?'/additions':'/categories'
  async function reload() {
    try {
      const [data,cats,adds]=await Promise.all([restaurant.listRecords(path.slice(1) as 'products' | 'additions' | 'categories') as Promise<Item[]>,restaurant.listRecords('categories') as Promise<Category[]>,restaurant.listRecords('additions') as Promise<Addition[]>])
      setItems(data);setCategories(cats);setAdditions(adds)
    } catch(e){setError(e instanceof Error?e.message:'Erro ao carregar cadastros.')}
  }
  useEffect(()=>{void reload()},[kind])
  async function startEdit(item:Item) {
    setEditing(item.id);setName(item.name);setError('');setMessage('')
    if('price' in item){setPrice(item.price);setAvailable(item.available)}
    if('description' in item){
      setDescription(item.description);setCategoryId(item.categoryId);setImageUrl(item.imageUrl||'')
      try {const extras=await restaurant.additions(item.id);setAdditionIds(extras.map(a=>a.id))}
      catch(e){setError(e instanceof Error?e.message:'Erro ao consultar adicionais.')}
    }
  }
  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!editing)return
    setBusy(true);setError('');setMessage('')
    const body=kind==='category'?{name}:kind==='addition'?{name,price,available}:{name,description,price,available,categoryId,imageUrl:imageUrl.trim()||null,additionIds}
    try {
      await restaurant.updateRecord(path.slice(1) as 'products' | 'additions' | 'categories', editing, token, body)
      setEditing(null);setMessage('Cadastro atualizado!');await reload();await refreshCatalog()
    }catch(e){setError(e instanceof Error?e.message:'Erro ao salvar.')}finally{setBusy(false)}
  }
  async function remove(item:Item){
    if(!window.confirm('Excluir '+item.name+'? Esta ação não pode ser desfeita.'))return
    setBusy(true);setError('');setMessage('')
    try{
      await restaurant.removeRecord(path.slice(1) as 'products' | 'additions' | 'categories', item.id, token)
      setMessage('Cadastro excluído.');setEditing(null);await reload();await refreshCatalog()
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível excluir. Talvez o registro esteja em uso.')}finally{setBusy(false)}
  }
  return <section className="rounded-3xl border-2 border-[#0b4063] bg-white p-4 sm:p-7">
    <div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-2xl font-black">{kind==='product'?'Produtos':kind==='addition'?'Adicionais':'Categorias'}</h2><button type="button" onClick={()=>void reload()} className="rounded-xl border px-3 py-2 text-sm font-bold">Atualizar</button></div>
    {error&&<p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}{message&&<p role="status" className="mb-3 rounded-xl bg-green-50 p-3">{message}</p>}
    {editing&&<form onSubmit={e=>void save(e)} className="mb-6 grid gap-3 rounded-2xl bg-cyan-50 p-4 sm:grid-cols-2">
      <h3 className="font-black sm:col-span-2">Editar cadastro</h3>
      <label className="text-sm font-bold">Nome<input required className={field} value={name} onChange={e=>setName(e.target.value)}/></label>
      {kind!=='category'&&<><label className="text-sm font-bold">Preço<input required type="number" min="0" step="0.01" className={field} value={price} onChange={e=>setPrice(e.target.value)}/></label><label className="flex items-center gap-2"><input type="checkbox" checked={available} onChange={e=>setAvailable(e.target.checked)}/> Disponível</label></>}
      {kind==='product'&&<>
        <label className="text-sm font-bold">Descrição<input className={field} value={description} onChange={e=>setDescription(e.target.value)}/></label>
        <label className="text-sm font-bold">Categoria<select required className={field} value={categoryId} onChange={e=>setCategoryId(e.target.value)}><option value="">Selecione</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="text-sm font-bold sm:col-span-2">URL da imagem<input type="url" className={field} value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://..."/></label>
        <fieldset className="sm:col-span-2"><legend className="font-bold">Adicionais permitidos</legend><div className="grid gap-2 sm:grid-cols-2">{additions.map(a=><label key={a.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={additionIds.includes(a.id)} onChange={e=>setAdditionIds(ids=>e.target.checked?[...ids,a.id]:ids.filter(id=>id!==a.id))}/>{a.name} ({brl(a.price)})</label>)}</div></fieldset>
      </>}
      <div className="flex flex-wrap gap-2 sm:col-span-2"><button disabled={busy} type="submit" className="rounded-xl bg-[#ffc629] px-5 py-3 font-bold">Salvar alterações</button><button type="button" onClick={()=>setEditing(null)} className="rounded-xl border px-5 py-3">Cancelar</button></div>
    </form>}
    <div className="grid gap-3">{items.map(item=><div key={item.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-100 p-3 sm:p-4">
      <div className="min-w-0"><p className="break-words font-extrabold">{item.name}</p>{'price' in item&&<p className="text-sm text-slate-600">{brl(item.price)} · {item.available?'Disponível':'Indisponível'}</p>}</div>
      <div className="flex gap-2"><button disabled={busy} onClick={()=>void startEdit(item)} className="rounded-xl bg-cyan-100 px-3 py-2 text-sm font-bold">Editar</button><button disabled={busy} onClick={()=>void remove(item)} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">Excluir</button></div>
    </div>)}{items.length===0&&<p className="py-6 text-center text-slate-500">Nenhum cadastro encontrado.</p>}</div>
  </section>
}
