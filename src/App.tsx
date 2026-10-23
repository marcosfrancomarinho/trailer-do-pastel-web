import { useEffect, useMemo, useState } from 'react'
import { api, brl } from './api'
import AdminRegisters from './AdminRegisters'
import CartPage from './presentation/pages/CartPage'
import type { Addition, Category, CreatedOrder, OrderPayload, PendingOrder, Product } from './api'

type CartItem = { key: string; product: Product; quantity: number; additions: { addition: Addition; quantity: number }[] }
type View = 'menu' | 'cart' | 'tracking' | 'admin'
type AdminSection = 'orders' | 'product' | 'addition' | 'user'
const savedOrder = (): CreatedOrder | null => {
  try { const raw = localStorage.getItem('pastel-order'); return raw ? JSON.parse(raw) as CreatedOrder : null }
  catch { return null }
}

export default function App() {
  const [view, setView] = useState<View>('menu')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Product | null>(null)
  const [extras, setExtras] = useState<Addition[]>([])
  const [extrasBusy, setExtrasBusy] = useState(false)
  const [amounts, setAmounts] = useState<Record<string, number>>({})
  const [quantity, setQuantity] = useState(1)
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [order, setOrder] = useState<CreatedOrder | null>(savedOrder)
  const [adminName, setAdminName] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminToken, setAdminToken] = useState('')
  const [adminSection, setAdminSection] = useState<AdminSection>('orders')
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const [pending, setPending] = useState<PendingOrder[]>([])
  const [adminBusy, setAdminBusy] = useState(false)
  const [adminError, setAdminError] = useState('')

  async function loadCatalog() {
    setLoading(true); setError('')
    try {
      const [cats, prods] = await Promise.all([api<Category[]>('/categories'), api<Product[]>('/products')])
      setCategories(cats); setProducts(prods)
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao carregar o cardápio') }
    finally { setLoading(false) }
  }
  useEffect(() => { void loadCatalog() }, [])
  const visible = useMemo(() => products.filter(p =>
    (filter === 'all' || p.categoryId === filter) &&
    (p.name + ' ' + p.description).toLowerCase().includes(search.toLowerCase())
  ), [products, filter, search])
  const total = cart.reduce((sum, item) => sum + item.quantity * (Number(item.product.price) +
    item.additions.reduce((n, a) => n + Number(a.addition.price) * a.quantity, 0)), 0)
  const cartCount = cart.reduce((n, item) => n + item.quantity, 0)
  function go(next: View) { setView(next); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  async function choose(product: Product) {
    if (!product.available) return
    setSelected(product); setExtras([]); setAmounts({}); setQuantity(1); setExtrasBusy(true)
    try { setExtras(await api<Addition[]>('/products/' + encodeURIComponent(product.id) + '/additions')) }
    catch (err) { setError(err instanceof Error ? err.message : 'Falha ao carregar adicionais'); setSelected(null) }
    finally { setExtrasBusy(false) }
  }
  function addItem() {
    if (!selected || extrasBusy) return
    const additions = extras.filter(a => a.available && (amounts[a.id] || 0) > 0)
      .map(addition => ({ addition, quantity: amounts[addition.id] }))
    const key = selected.id + ':' + additions.map(a => a.addition.id + '-' + a.quantity).sort().join(',')
    setCart(previous => {
      const exists = previous.find(p => p.key === key)
      return exists ? previous.map(p => p.key === key ? { ...p, quantity: p.quantity + quantity } : p)
        : [...previous, { key, product: selected, quantity, additions }]
    })
    setSelected(null)
  }
  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!cart.length || sending) return
    setSending(true); setError('')
    const body: OrderPayload = {
      customerName: customerName.trim(), customerPhone: customerPhone.trim(),
      items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity,
        additions: item.additions.map(a => ({ additionId: a.addition.id, quantity: a.quantity })) }))
    }
    try {
      const result = await api<CreatedOrder>('/orders', { method: 'POST', body: JSON.stringify(body) })
      localStorage.setItem('pastel-order', JSON.stringify(result))
      setOrder(result); setCart([]); go('tracking')
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível concluir o pedido') }
    finally { setSending(false) }
  }
  async function loadPending(token: string) {
    setAdminBusy(true); setAdminError('')
    try { setPending(await api<PendingOrder[]>('/orders/pending', { headers: { Authorization: 'Bearer ' + token } })) }
    catch (err) { setAdminError(err instanceof Error ? err.message : 'Erro ao buscar pedidos') }
    finally { setAdminBusy(false) }
  }
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setAdminBusy(true); setAdminError('')
    try {
      const logged = await api<{ name: string; accessToken: string }>('/login', {
        method: 'POST', body: JSON.stringify({ name: adminName, password: adminPassword })
      })
      setAdminToken(logged.accessToken); setAdminPassword('')
      await loadPending(logged.accessToken)
    } catch (err) { setAdminError(err instanceof Error ? err.message : 'Não foi possível entrar'); setAdminBusy(false) }
  }
  return <div className="restaurant-app min-h-screen overflow-x-hidden">
    <header className="restaurant-header sticky top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2.5 md:py-3">
        <button className="brand-mark flex items-center gap-3 text-left" onClick={() => go('menu')} aria-label="Trailer do Pastel - ir ao cardápio">
          <span className="brand-symbol" aria-hidden="true">🍍</span><span className="brand-letters">TRAILER DO PASTEL</span>
        </button>
        <nav className="hidden gap-2 text-sm font-bold sm:flex" aria-label="Navegação principal">
          <button onClick={() => go('menu')} className={view === 'menu' ? 'nav-active' : ''}>Cardápio</button>
          <button onClick={() => go('tracking')} className={view === 'tracking' ? 'nav-active' : ''}>Meu pedido</button>
        </nav>
        <button onClick={() => go('cart')} className="cart-header-button" aria-label={'Abrir carrinho com ' + cartCount + ' itens'}>🛒 <span className="hidden sm:inline">Carrinho</span>{cartCount > 0 && <b>{cartCount}</b>}</button>
      </div>
    </header>
    {view === 'menu' && <>
      <section className="restaurant-hero">
        <span className="sea-flower sea-flower-left" aria-hidden="true">✿</span><span className="sea-flower sea-flower-right" aria-hidden="true">✿</span>
        <div className="hero-inner mx-auto grid max-w-6xl items-center gap-8 px-5 py-10 md:grid-cols-[1fr_0.95fr] md:py-20">
          <div className="relative z-10">
            <span className="hero-eyebrow">⚓ BEM-VINDO AO TRAILER DO PASTEL</span>
            <h1 className="hero-headline">UM MAR DE <span>SABOR!</span></h1>
            <p className="hero-description">Pastéis crocantes, recheios caprichados e muita diversão. Escolha seus favoritos e faça seu pedido!</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })} className="restaurant-primary">VER CARDÁPIO <span aria-hidden="true">↗</span></button>
              <span className="hero-kicker">★ Recheio de verdade<br/>★ Feito na hora</span>
            </div>
          </div>
          <div className="hero-illustration spongebob-stage" aria-label="Bob Esponja em destaque no cardápio">
            <div className="spongebob-backdrop" aria-hidden="true"><span>✿</span><span>✿</span><span>○</span></div>
            <img className="spongebob-character" src="https://commons.wikimedia.org/wiki/Special:FilePath/SpongeBob_SquarePants_character.png" alt="Bob Esponja sorrindo" />
            <div className="hero-sticker">PASTEL<br/><strong>DO FUNDO DO MAR!</strong></div>
          </div>
        </div>
      </section>
      <div className="service-strip"><span>🥟 Pastéis caprichados</span><span>🥤 Bebidas geladas</span><span>💛 Peça sem cadastro</span></div>
      <main id="menu" className="menu-section mx-auto max-w-6xl px-4 py-10 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black tracking-widest text-[#008b9e]">NOSSO CARDÁPIO</p><h2 className="mt-2 text-4xl font-black">Nosso <span className="italic text-[#008b9e]">cardápio</span></h2><p className="mt-2 text-[#557383]">Escolha seu favorito e adicione aquele recheio extra.</p></div><span className="rounded-full bg-[#ffe39a] px-4 py-2 text-sm font-semibold text-[#16435b]">{products.length} produtos</span></div>
        <div className="my-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="category-filters flex max-w-full gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible"><button onClick={() => setFilter('all')} className={'shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold ' + (filter === 'all' ? 'bg-[#ffc629] text-[#113548]' : 'bg-white text-[#416476]')}>Todos</button>{categories.map(c => <button key={c.id} onClick={() => setFilter(c.id)} className={'rounded-full px-5 py-2 text-sm font-bold ' + (filter === c.id ? 'bg-[#ffc629] text-[#113548]' : 'bg-white text-[#416476]')}>{c.name}</button>)}</div><input aria-label="Buscar produto" placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-full border border-cyan-100 bg-white px-5 py-3 outline-cyan-400 sm:w-64"/></div>
        {error && <div role="alert" className="mb-5 rounded-2xl bg-red-50 p-4 text-red-700">{error} <button onClick={() => void loadCatalog()} className="underline">Tentar novamente</button></div>}
        {loading ? <div className="py-20 text-center">Carregando o cardápio...</div> : visible.length === 0 ? <div className="py-20 text-center">Nenhum produto encontrado.</div> :
        <div className="product-grid grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visible.map(p => {
          const category = categories.find(c => c.id === p.categoryId)?.name || 'Especial'
          const drink = /suco|refrigerante|bebida/i.test(category)
          const juice = /suco/i.test(category)
          return <article key={p.id} className={'menu-product-card wooden-product-card ' + (!p.available ? 'product-unavailable ' : '') + (drink ? 'drink-product-card' : 'pastel-product-card')}>
            <div className="wooden-card-top">
              <span className="wood-nail" aria-hidden="true">●</span>
              <span className="wooden-category">{category}</span>
              <span className="wood-nail" aria-hidden="true">●</span>
            </div>
            <div className="product-art-area">
              <span className="product-art-flower" aria-hidden="true">✿</span>
              <span className="product-art-icon" role="img" aria-label={juice ? 'Suco' : drink ? 'Refrigerante' : 'Pastel'}>{juice ? '🧃' : drink ? '🥤' : '🥟'}</span>
              <span className={'product-availability ' + (!p.available ? 'is-unavailable' : '')}>{p.available ? (drink ? 'GELADINHO' : 'FEITO NA HORA') : 'INDISPONÍVEL'}</span>
            </div>
            <div className="product-card-body">
              <h3>{p.name}</h3>
              <p className="product-card-description">{p.description}</p>
              <div className="product-card-bottom">
                <div className="product-price"><small>A PARTIR DE</small><strong>{brl(p.price)}</strong></div>
                <button type="button" disabled={!p.available} onClick={() => void choose(p)} className="product-add-action" aria-label={'Adicionar ' + p.name}>
                  <span aria-hidden="true">+</span><span>Adicionar</span>
                </button>
              </div>
            </div>
          </article>
        })}</div>}
      </main>
    </>}
    {view === 'cart' && <CartPage cart={cart} total={total} customerName={customerName} setCustomerName={setCustomerName} customerPhone={customerPhone} setCustomerPhone={setCustomerPhone} sending={sending} error={error} checkout={checkout} go={go} setCart={setCart} />}
    {view === 'tracking' && <main className="inner-page mx-auto max-w-3xl px-4 py-16"><p className="font-black tracking-widest text-[#008b9e]">ACOMPANHAMENTO</p><h1 className="mt-3 text-4xl font-black">Meu pedido</h1>{order ? <div className="mt-8 rounded-3xl bg-white p-7 shadow-sm"><div className="mb-4 flex items-center justify-between"><span className="text-sm text-[#557383]">Pedido #{order.id.slice(0,8)}</span><span className="rounded-full bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">{order.status}</span></div><p className="text-xl font-extrabold">Pedido recebido!</p><p className="mt-2 text-[#557383]">Seu pedido foi enviado para a pastelaria. Guarde o código abaixo.</p><div className="mt-5 break-all rounded-xl bg-[#e8faff] p-4 font-mono text-sm">{order.trackingToken}</div><p className="mt-5 font-black">Total confirmado: {brl(order.total)}</p><p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">A consulta automática de status estará disponível quando o backend implementar GET /orders/tracking/:token. Por enquanto, esta tela mostra o estado retornado na criação.</p></div> : <div className="mt-8 rounded-3xl bg-white p-10 text-center">Você ainda não fez nenhum pedido neste navegador. <button className="font-bold text-[#008b9e]" onClick={() => go('menu')}>Ver cardápio</button></div>}</main>}
    {view === 'admin' && <main className="inner-page mx-auto max-w-5xl px-4 py-14"><p className="font-bold tracking-widest text-[#008b9e]">GESTÃO DA PASTELARIA</p><h1 className="mt-3 text-4xl font-black">Painel administrativo</h1>{!adminToken ? <form onSubmit={e => void login(e)} className="mx-auto mt-8 max-w-md space-y-4 rounded-3xl bg-white p-7 shadow-sm"><h2 className="text-xl font-black">Entrar</h2><input required autoComplete="username" value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Usuário" className="w-full rounded-xl border border-cyan-100 p-3"/><input required type="password" autoComplete="current-password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Senha" className="w-full rounded-xl border border-cyan-100 p-3"/>{adminError && <p role="alert" className="text-sm text-red-600">{adminError}</p>}<button disabled={adminBusy} className="w-full rounded-full bg-[#ffc629] py-3 font-bold text-[#113548]">Entrar</button></form> :
      <div className="admin-layout mt-8 grid min-w-0 gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="md:hidden">
          <button type="button" aria-label={adminMenuOpen ? 'Fechar menu administrativo' : 'Abrir menu administrativo'}
            aria-expanded={adminMenuOpen} aria-controls="admin-navigation" onClick={() => setAdminMenuOpen(open => !open)}
            className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-cyan-200 bg-white px-4 py-3 font-bold text-[#143b50] shadow-sm">
            <span className="flex items-center gap-3"><span aria-hidden="true" className="text-xl">{adminMenuOpen ? '✕' : '☰'}</span> Menu administrativo</span>
            <span className="text-xs text-[#557383]">{adminSection === 'orders' ? 'Pedidos' : adminSection === 'product' ? 'Produtos' : adminSection === 'addition' ? 'Adicionais' : 'Usuários'}</span>
          </button>
        </div>
        <aside id="admin-navigation" aria-label="Menu administrativo" className={(adminMenuOpen ? 'block ' : 'hidden ') + 'admin-sidebar h-fit rounded-3xl border border-cyan-100 bg-white p-3 shadow-sm md:sticky md:top-24 md:block'}>
          <p className="px-3 pb-3 pt-2 text-xs font-black uppercase tracking-widest text-[#557383]">Gerenciamento</p>
          <nav className="grid grid-cols-1 gap-2" aria-label="Seções do painel">
            {([['orders', '📋', 'Pedidos'], ['product', '🥟', 'Produtos'], ['addition', '🧀', 'Adicionais'], ['user', '👤', 'Usuários']] as const).map(([key, icon, label]) =>
              <button key={key} type="button" aria-current={adminSection === key ? 'page' : undefined} onClick={() => { setAdminSection(key); setAdminError(''); setAdminMenuOpen(false) }}
                className={'flex min-h-12 items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-bold transition ' + (adminSection === key ? 'bg-[#ffc629] text-[#143b50] shadow-sm' : 'text-[#416476] hover:bg-cyan-50')}>
                <span aria-hidden="true">{icon}</span><span>{label}</span>
              </button>)}
          </nav>
          <button type="button" className="mt-3 w-full rounded-xl border border-cyan-200 px-3 py-3 text-sm font-bold text-[#143b50] hover:bg-cyan-50"
            onClick={() => {setAdminToken(''); setPending([]); setAdminSection('orders'); setAdminMenuOpen(false)}}>Sair do painel</button>
        </aside>
        <section className="min-w-0">
          {adminSection === 'orders' ? <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-2xl font-black">Pedidos</h2><span className="mt-2 inline-block rounded-full bg-[#ffe39a] px-4 py-2 text-sm font-bold text-[#16435b]">{pending.length} pedidos pendentes</span></div>
              <button className="rounded-full border border-cyan-200 bg-white px-4 py-2 font-bold" onClick={() => void loadPending(adminToken)}>Atualizar</button>
            </div>
            {adminError && <p role="alert" className="mb-5 text-red-600">{adminError}</p>}
            {adminBusy && <p>Carregando pedidos...</p>}{!adminBusy && pending.length===0 && <p className="rounded-2xl bg-white p-8 text-center">Nenhum pedido pendente.</p>}<div className="grid gap-4 md:grid-cols-2">{pending.map(p => <article key={p.id} className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex justify-between gap-3"><div><p className="text-xs font-bold text-[#008b9e]">PEDIDO #{p.id.slice(0,8)}</p><h2 className="mt-2 text-xl font-black">{p.customerName}</h2><p className="text-sm text-[#557383]">{p.customerPhone}</p></div><strong>{brl(p.total)}</strong></div><div className="my-4 border-t border-cyan-100 pt-3">{p.items.map((item,i) => <div key={i} className="mb-3 text-sm"><strong>{item.quantity}× {item.productName}</strong>{item.additions.map((a,j) => <p key={j} className="text-[#557383]">+ {a.quantity}× {a.additionName}</p>)}</div>)}</div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">PENDENTE</span></article>)}</div><p className="mt-8 text-sm text-[#557383]">A alteração de status depende de uma nova rota no backend.</p>
          </> : <AdminRegisters key={adminSection} section={adminSection} token={adminToken} onProductCreated={loadCatalog} />}
        </section>
      </div>}
    </main>}
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation" onMouseDown={e => {if(e.target===e.currentTarget) setSelected(null)}}><div role="dialog" aria-modal="true" aria-label={'Personalizar '+selected.name} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[#f8f5eb] p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black text-[#008b9e]">MONTE DO SEU JEITO</p><h2 className="mt-2 text-2xl font-black">{selected.name}</h2><p className="mt-2 text-sm text-[#557383]">{selected.description}</p></div><button onClick={() => setSelected(null)} className="rounded-full bg-white px-3 py-2" aria-label="Fechar">✕</button></div><div className="my-6 border-t border-cyan-100 pt-5"><h3 className="mb-3 font-black">Adicionais</h3>{extrasBusy ? <p>Carregando adicionais...</p> : extras.filter(a => a.available).length===0 ? <p className="text-sm text-[#557383]">Sem adicionais para este produto.</p> : extras.filter(a => a.available).map(a => <div key={a.id} className="flex items-center justify-between border-b border-cyan-100 py-3"><div><b>{a.name}</b><p className="text-sm text-[#557383]">+ {brl(a.price)}</p></div><div className="flex items-center gap-3"><button aria-label={'Remover '+a.name} onClick={() => setAmounts(p => ({...p,[a.id]:Math.max(0,(p[a.id]||0)-1)}))} className="rounded-lg bg-[#ffe39a] px-3 py-1">−</button><span>{amounts[a.id]||0}</span><button aria-label={'Adicionar '+a.name} onClick={() => setAmounts(p => ({...p,[a.id]:(p[a.id]||0)+1}))} className="rounded-lg bg-[#ffe39a] px-3 py-1">+</button></div></div>)}</div><div className="flex items-center justify-between"><span className="font-bold">Quantidade</span><div className="flex items-center gap-4"><button onClick={() => setQuantity(n => Math.max(1,n-1))} className="rounded-lg bg-[#ffe39a] px-3 py-1">−</button><b>{quantity}</b><button onClick={() => setQuantity(n => n+1)} className="rounded-lg bg-[#ffe39a] px-3 py-1">+</button></div></div><button disabled={extrasBusy} onClick={addItem} className="mt-6 w-full rounded-full bg-[#ffc629] py-4 font-black text-[#113548] disabled:opacity-50">Adicionar • {brl(quantity*(Number(selected.price)+extras.reduce((n,a)=>n+Number(a.price)*(amounts[a.id]||0),0)))}</button></div></div>}
    <footer className="restaurant-footer mt-16 px-4 py-8 text-center text-xs">🍍 TRAILER DO PASTEL · UM MAR DE SABOR · <button className="underline" onClick={() => go('admin')}>Área administrativa</button><div className="mt-4 flex justify-center gap-5 sm:hidden"><button onClick={() => go('menu')}>Cardápio</button><button onClick={() => go('tracking')}>Meu pedido</button></div></footer>
  </div>
}
