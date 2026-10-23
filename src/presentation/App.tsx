import { useEffect, useMemo, useState } from 'react'
import { api, brl } from '../api'
import { restaurant } from '../application/container'
import { cartTotal, toOrderPayload } from '../domain/cart'
import { trackOrder } from '../application/order-service'
import AdminOrders from './organisms/AdminOrders'
import CustomerOrders from './organisms/CustomerOrders'
import SiteHeader from './components/SiteHeader'
import SiteFooter from './components/SiteFooter'
import ProductCard from './components/ProductCard'
import AdminManage from './components/AdminManage'
import AdminRegisters from './components/organisms/AdminRegisters'
import type { Addition, Category, Product } from '../api'
import type { SavedCustomerOrder } from '../domain/models'

const ADMIN_SESSION_KEY = 'trailer-pastel-admin-session'

function readAdminSession(): string {
  try {
    const token = window.sessionStorage.getItem(ADMIN_SESSION_KEY) ?? ''
    if (!token) return ''

    // Não restaura credenciais expiradas, quando o token é um JWT.
    const payload = token.split('.')[1]
    if (payload) {
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
      const parsed = JSON.parse(window.atob(normalized)) as { exp?: number }
      if (typeof parsed.exp === 'number' && parsed.exp * 1000 <= Date.now()) {
        window.sessionStorage.removeItem(ADMIN_SESSION_KEY)
        return ''
      }
    }
    return token
  } catch {
    return ''
  }
}

function saveAdminSession(token: string): void {
  try {
    if (token) window.sessionStorage.setItem(ADMIN_SESSION_KEY, token)
    else window.sessionStorage.removeItem(ADMIN_SESSION_KEY)
  } catch {
    // Continua em memória quando o armazenamento do navegador está bloqueado.
  }
}

type CartItem = { key: string; product: Product; quantity: number; additions: { addition: Addition; quantity: number }[] }
type View = 'menu' | 'cart' | 'tracking' | 'admin'
type AdminSection = 'orders' | 'product' | 'addition' | 'user' | 'category' | 'manage-products' | 'manage-additions' | 'manage-categories'
export default function App() {
  const [adminToken, setAdminToken] = useState(readAdminSession)
  const [view, setView] = useState<View>(() => readAdminSession() ? 'admin' : 'menu')
  const [cartToast, setCartToast] = useState<{ message: string; id: number } | null>(null)
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
  const [orders, setOrders] = useState<SavedCustomerOrder[]>(() => restaurant.recentOrders())
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [trackingError, setTrackingError] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminSection, setAdminSection] = useState<AdminSection>('orders')
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const [adminBusy, setAdminBusy] = useState(false)
  const [adminError, setAdminError] = useState('')

  async function loadCatalog() {
    setLoading(true); setError('')
    try {
      const [cats, prods] = await restaurant.catalogList()
      setCategories(cats); setProducts(prods)
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao carregar o cardápio') }
    finally { setLoading(false) }
  }
  useEffect(() => { void loadCatalog() }, [])

  useEffect(() => {
    if (!cartToast) return
    const timeout = window.setTimeout(() => setCartToast(null), 2500)
    return () => window.clearTimeout(timeout)
  }, [cartToast])
  const visible = useMemo(() => products.filter(p =>
    (filter === 'all' || p.categoryId === filter) &&
    (p.name + ' ' + p.description).toLowerCase().includes(search.toLowerCase())
  ), [products, filter, search])
  const total = cartTotal(cart)
  const cartCount = cart.reduce((n, item) => n + item.quantity, 0)
  function go(next: View) { setView(next); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  async function choose(product: Product) {
    if (!product.available) return
    setSelected(product); setExtras([]); setAmounts({}); setQuantity(1); setExtrasBusy(true)
    try { setExtras(await restaurant.additions(product.id)) }
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
    const itemName = selected.name
    const addedQuantity = quantity
    setSelected(null)

    setCartToast(previous => ({
      message: addedQuantity + '× ' + itemName + ' adicionado ao carrinho!',
      id: (previous?.id ?? 0) + 1,
    }))
  }
  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!cart.length || sending) return
    setSending(true); setError('')
    try {
      await restaurant.createOrder(toOrderPayload(customerName, customerPhone, cart), {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        createdAt: new Date().toISOString(),
        items: cart.map(item => ({
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          additions: item.additions.map(extra => ({
            additionName: extra.addition.name,
            quantity: extra.quantity,
            unitPrice: extra.addition.price,
          })),
        })),
      })
      setOrders(restaurant.recentOrders())
      setCart([]); go('tracking')
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível concluir o pedido') }
    finally { setSending(false) }
  }
  // Consulta apenas enquanto o cliente acompanha o pedido com a aba visível.
  // Ao sair da tela ou colocar o navegador em segundo plano, cancela requests e timers.
  useEffect(() => {
    if (view !== 'tracking' || orders.length === 0) return

    let active = true
    let pageHidden = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let controller: AbortController | null = null

    const stop = () => {
      if (timer !== undefined) clearTimeout(timer)
      timer = undefined
      controller?.abort()
      controller = null
    }

    const refresh = async () => {
      if (!active || pageHidden || document.visibilityState !== 'visible' || controller) return

      const request = new AbortController()
      controller = request

      try {
        const responses = await Promise.allSettled(
          orders.map(order => trackOrder(order.trackingToken, request.signal))
        )
        if (!active || pageHidden || request.signal.aborted || document.visibilityState !== 'visible') return

        const next: Record<string, string> = {}
        responses.forEach((response, index) => {
          if (response.status === 'fulfilled') next[orders[index].trackingToken] = response.value.status
        })
        setStatuses(previous => ({ ...previous, ...next }))
      } finally {
        if (controller !== request) return
        controller = null
        if (active && !pageHidden && document.visibilityState === 'visible') {
          timer = setTimeout(() => { void refresh() }, 5000)
        }
      }
    }

    const resume = () => {
      if (!active || pageHidden || document.visibilityState !== 'visible') return
      if (timer !== undefined) clearTimeout(timer)
      timer = undefined
      if (!controller) void refresh()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') stop()
      else resume()
    }
    const onPageHide = () => { pageHidden = true; stop() }
    const onPageShow = () => { pageHidden = false; resume() }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('focus', resume)
    resume()

    return () => {
      active = false
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('focus', resume)
    }
  }, [view, orders])

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setAdminBusy(true); setAdminError('')
    try {
      const logged = await api<{ name: string; accessToken: string }>('/login', {
        method: 'POST', body: JSON.stringify({ name: adminName, password: adminPassword })
      })
      saveAdminSession(logged.accessToken)
      setAdminToken(logged.accessToken); setAdminPassword('')
      setAdminBusy(false)
    } catch (err) { setAdminError(err instanceof Error ? err.message : 'Não foi possível entrar'); setAdminBusy(false) }
  }
  return <div className="restaurant-app min-h-screen overflow-x-hidden">
    <SiteHeader view={view} count={cartCount} navigate={go} />
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
              <span className="hero-kicker">★ Recheios caprichados<br/>★ Variedade de sabores</span>
            </div>
          </div>
          <div className="hero-illustration spongebob-stage" aria-label="Bob Esponja em destaque no cardápio">
            <div className="spongebob-backdrop" aria-hidden="true"><span>✿</span><span>✿</span><span>○</span></div>
            <img className="spongebob-character" src="https://commons.wikimedia.org/wiki/Special:FilePath/SpongeBob_SquarePants_character.png" alt="Bob Esponja sorrindo" />
            <div className="hero-sticker">PASTÉIS<br/><strong>DO FUNDO DO MAR!</strong></div>
          </div>
        </div>
      </section>
      <main id="menu" className="menu-section mx-auto max-w-6xl px-4 py-10 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black tracking-widest text-[#008b9e]">NOSSO CARDÁPIO</p><h2 className="mt-2 text-4xl font-black">Nosso <span className="italic text-[#008b9e]">cardápio</span></h2><p className="mt-2 text-[#557383]">Escolha seu favorito e adicione aquele recheio extra.</p></div><span className="rounded-full bg-[#ffe39a] px-4 py-2 text-sm font-semibold text-[#16435b]">{products.length} produtos</span></div>
        <div className="my-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="category-filters flex max-w-full gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible"><button onClick={() => setFilter('all')} className={'shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold ' + (filter === 'all' ? 'bg-[#ffc629] text-[#113548]' : 'bg-white text-[#416476]')}>Todos</button>{categories.map(c => <button key={c.id} onClick={() => setFilter(c.id)} className={'rounded-full px-5 py-2 text-sm font-bold ' + (filter === c.id ? 'bg-[#ffc629] text-[#113548]' : 'bg-white text-[#416476]')}>{c.name}</button>)}</div><input aria-label="Buscar produto" placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-full border border-cyan-100 bg-white px-5 py-3 outline-cyan-400 sm:w-64"/></div>
        {error && <div role="alert" className="mb-5 rounded-2xl bg-red-50 p-4 text-red-700">{error} <button onClick={() => void loadCatalog()} className="underline">Tentar novamente</button></div>}
        {loading ? <div className="py-20 text-center">Carregando o cardápio...</div> : visible.length === 0 ? <div className="py-20 text-center">Nenhum produto encontrado.</div> :
        <div className="product-grid grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visible.map(p => <ProductCard key={p.id} product={p} category={categories.find(c => c.id === p.categoryId)?.name || 'Especial'} select={choose} />)}</div>}
      </main>
    </>}
    {view === 'cart' && <main className="inner-page mx-auto max-w-5xl px-4 py-12"><button className="mb-6 text-sm font-bold text-[#008b9e]" onClick={() => go('menu')}>← Voltar ao cardápio</button><h1 className="mb-8 text-4xl font-black">Seu carrinho</h1>
      {cart.length === 0 ? <div className="rounded-3xl bg-white p-12 text-center"><p className="mb-5">Seu carrinho está vazio.</p><button className="rounded-full bg-[#ffc629] px-6 py-3 font-bold text-[#113548]" onClick={() => go('menu')}>Escolher pastéis</button></div> :
      <div className="grid gap-8 md:grid-cols-[1.3fr_1fr]"><div className="space-y-3">{cart.map(item => <div key={item.key} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex justify-between gap-3"><div><h3 className="text-lg font-extrabold">{item.product.name}</h3>{item.additions.map(a => <p key={a.addition.id} className="text-sm text-[#557383]">+ {a.quantity}× {a.addition.name}</p>)}</div><strong>{brl(item.quantity * (Number(item.product.price) + item.additions.reduce((n,a) => n + Number(a.addition.price)*a.quantity,0)))}</strong></div><div className="mt-4 flex items-center gap-4"><button aria-label="Diminuir quantidade" className="rounded-lg bg-[#e8faff] px-3 py-1" onClick={() => setCart(c => c.map(x => x.key === item.key ? {...x,quantity: x.quantity-1}:x).filter(x => x.quantity > 0))}>−</button><b>{item.quantity}</b><button aria-label="Aumentar quantidade" className="rounded-lg bg-[#e8faff] px-3 py-1" onClick={() => setCart(c => c.map(x => x.key === item.key ? {...x,quantity:x.quantity+1}:x))}>+</button><button className="ml-auto text-sm text-red-600" onClick={() => setCart(c => c.filter(x => x.key !== item.key))}>Remover</button></div></div>)}</div>
        <form onSubmit={e => void checkout(e)} className="h-fit space-y-4 rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Finalizar pedido</h2><label className="block text-sm font-semibold">Seu nome<input required value={customerName} onChange={e => setCustomerName(e.target.value)} className="mt-2 w-full rounded-xl border border-cyan-100 p-3 outline-cyan-400" placeholder="Como podemos chamar você?"/></label><label className="block text-sm font-semibold">Telefone<input required type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="mt-2 w-full rounded-xl border border-cyan-100 p-3 outline-cyan-400" placeholder="(99) 99999-9999"/></label><div className="flex justify-between border-t border-cyan-100 pt-4 text-lg"><span>Total estimado</span><strong>{brl(total)}</strong></div><p className="text-xs text-[#557383]">O preço final será validado pela pastelaria no servidor.</p>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<button disabled={sending} className="w-full rounded-full bg-[#ffc629] py-4 font-black text-[#113548] disabled:opacity-60">{sending ? 'Enviando pedido...' : 'Confirmar pedido →'}</button></form></div>}
    </main>}
    {view === 'tracking' && <>
      {trackingError && <p role="alert" className="mx-auto max-w-3xl px-4 pt-4 text-red-200">{trackingError}</p>}
      <CustomerOrders
        orders={orders}
        statuses={statuses}
        onRemove={token => {
          setOrders(restaurant.removeSavedOrder(token))
          setStatuses(previous => {
            const next = { ...previous }
            delete next[token]
            return next
          })
        }}
        onRefresh={token => {
          void trackOrder(token)
            .then(result => {
              setStatuses(previous => ({ ...previous, [token]: result.status }))
              setTrackingError('')
            })
            .catch(error => setTrackingError(error instanceof Error ? error.message : 'Falha ao consultar status'))
        }}
      />
    </>}
    {view === 'admin' && <main className="inner-page mx-auto max-w-5xl px-4 py-14"><p className="font-bold tracking-widest text-[#008b9e]">GESTÃO DA PASTELARIA</p><h1 className="mt-3 text-4xl font-black">Painel administrativo</h1>{!adminToken ? <form onSubmit={e => void login(e)} className="mx-auto mt-8 max-w-md space-y-4 rounded-3xl bg-white p-7 shadow-sm"><h2 className="text-xl font-black">Entrar</h2><input required autoComplete="username" value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Usuário" className="w-full rounded-xl border border-cyan-100 p-3"/><input required type="password" autoComplete="current-password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Senha" className="w-full rounded-xl border border-cyan-100 p-3"/>{adminError && <p role="alert" className="text-sm text-red-600">{adminError}</p>}<button disabled={adminBusy} className="w-full rounded-full bg-[#ffc629] py-3 font-bold text-[#113548]">Entrar</button></form> :
      <div className="admin-layout mt-8 grid min-w-0 gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="md:hidden">
          <button type="button" aria-label={adminMenuOpen ? 'Fechar menu administrativo' : 'Abrir menu administrativo'}
            aria-expanded={adminMenuOpen} aria-controls="admin-navigation" onClick={() => setAdminMenuOpen(open => !open)}
            className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-cyan-200 bg-white px-4 py-3 font-bold text-[#143b50] shadow-sm">
            <span className="flex items-center gap-3"><span aria-hidden="true" className="text-xl">{adminMenuOpen ? '✕' : '☰'}</span> Menu administrativo</span>
            <span className="text-xs text-[#557383]">{adminSection === 'orders' ? 'Pedidos' : adminSection === 'product' ? 'Produtos' : adminSection === 'addition' ? 'Adicionais' : adminSection === 'user' ? 'Usuários' : 'Cadastros'}</span>
          </button>
        </div>
        <aside id="admin-navigation" aria-label="Menu administrativo" className={(adminMenuOpen ? 'block ' : 'hidden ') + 'admin-sidebar h-fit rounded-3xl border border-cyan-100 bg-white p-3 shadow-sm md:sticky md:top-24 md:block'}>
          <p className="px-3 pb-3 pt-2 text-xs font-black uppercase tracking-widest text-[#557383]">Gerenciamento</p>
          <nav className="grid grid-cols-1 gap-2" aria-label="Seções do painel">
            {([['orders', '📋', 'Pedidos'], ['product', '🥟', 'Produtos'], ['addition', '🧀', 'Adicionais'], ['user', '👤', 'Usuários'], ['category', '🗂️', 'Nova categoria'], ['manage-products', '✏️', 'Gerenciar produtos'], ['manage-additions', '⚙️', 'Gerenciar adicionais'], ['manage-categories', '🗃️', 'Gerenciar categorias']] as const).map(([key, icon, label]) =>
              <button key={key} type="button" aria-current={adminSection === key ? 'page' : undefined} onClick={() => { setAdminSection(key); setAdminError(''); setAdminMenuOpen(false) }}
                className={'flex min-h-12 items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-bold transition ' + (adminSection === key ? 'bg-[#ffc629] text-[#143b50] shadow-sm' : 'text-[#416476] hover:bg-cyan-50')}>
                <span aria-hidden="true">{icon}</span><span>{label}</span>
              </button>)}
          </nav>
          <button type="button" className="mt-3 w-full rounded-xl border border-cyan-200 px-3 py-3 text-sm font-bold text-[#143b50] hover:bg-cyan-50"
            onClick={() => {saveAdminSession(''); setAdminToken(''); setAdminSection('orders'); setAdminMenuOpen(false)}}>Sair do painel</button>
        </aside>
        <section className="min-w-0">
          {adminSection === 'orders' ? <AdminOrders token={adminToken} /> : adminSection.startsWith('manage-') ? <AdminManage key={adminSection} kind={adminSection === 'manage-products' ? 'product' : adminSection === 'manage-additions' ? 'addition' : 'category'} token={adminToken} refreshCatalog={loadCatalog} /> : <AdminRegisters key={adminSection} section={adminSection as 'product' | 'addition' | 'category' | 'user'} token={adminToken} onProductCreated={loadCatalog} />}
        </section>
      </div>}
    </main>}
    {selected && (
      <div
        role="presentation"
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-4"
        onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null) }}
      >
        <section role="dialog" aria-modal="true" aria-label={'Personalizar ' + selected.name}
          className="product-customizer-modal flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-[#608ba0] bg-[#102c40] text-white shadow-2xl sm:max-h-[90dvh] sm:rounded-3xl">
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[#41687c] px-5 py-5 sm:px-7">
            <div className="min-w-0">
              <p className="text-xs font-black tracking-wider text-[#8be9fb]">MONTE DO SEU JEITO</p>
              <h2 className="mt-2 break-words text-2xl font-black leading-tight text-white sm:text-3xl">{selected.name}</h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[#d4e8f2]">{selected.description}</p>
            </div>
            <button type="button" onClick={() => setSelected(null)} aria-label="Fechar"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#648ca0] bg-[#28546b] text-lg font-bold text-white">✕</button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
            <h3 className="mb-3 text-base font-black text-white">Adicionais</h3>
            {extrasBusy ? (
              <p className="text-sm text-[#e1eef5]">Carregando adicionais...</p>
            ) : extras.filter(extra => extra.available).length === 0 ? (
              <p className="rounded-xl bg-[#20475d] p-4 text-sm font-semibold text-white">Sem adicionais para este produto.</p>
            ) : extras.filter(extra => extra.available).map(extra => (
              <div key={extra.id} className="flex items-center justify-between gap-3 border-b border-[#48758b] py-3">
                <div className="min-w-0">
                  <strong className="break-words text-sm text-white sm:text-base">{extra.name}</strong>
                  <p className="mt-1 text-sm font-semibold text-[#c8e7f4]">+ {brl(extra.price)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" aria-label={'Remover ' + extra.name}
                    onClick={() => setAmounts(previous => ({ ...previous, [extra.id]: Math.max(0, (previous[extra.id] || 0) - 1) }))}
                    className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffdc86] text-xl font-black text-[#102b40]">−</button>
                  <span className="min-w-6 text-center font-black text-white">{amounts[extra.id] || 0}</span>
                  <button type="button" aria-label={'Adicionar ' + extra.name}
                    onClick={() => setAmounts(previous => ({ ...previous, [extra.id]: (previous[extra.id] || 0) + 1 }))}
                    className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffdc86] text-xl font-black text-[#102b40]">+</button>
                </div>
              </div>
            ))}
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="font-black text-white">Quantidade</span>
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Diminuir quantidade" onClick={() => setQuantity(value => Math.max(1, value - 1))}
                  className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffdc86] text-xl font-black text-[#102b40]">−</button>
                <strong className="min-w-7 text-center text-white">{quantity}</strong>
                <button type="button" aria-label="Aumentar quantidade" onClick={() => setQuantity(value => value + 1)}
                  className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffdc86] text-xl font-black text-[#102b40]">+</button>
              </div>
            </div>
          </div>
          <footer className="shrink-0 border-t border-[#41687c] bg-[#102c40] px-5 py-4 sm:px-7">
            <button type="button" disabled={extrasBusy} onClick={addItem}
              className="min-h-12 w-full rounded-xl bg-[#ffca28] px-4 py-3 text-base font-black text-[#0c2a3c] disabled:opacity-60">
              Adicionar • {brl(quantity * (Number(selected.price) + extras.reduce((total, extra) => total + Number(extra.price) * (amounts[extra.id] || 0), 0)))}
            </button>
          </footer>
        </section>
      </div>
    )}
    {cartToast && (
      <div
        key={cartToast.id}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-24 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-[#6caa82] bg-[#153f2e] px-5 py-4 text-center text-sm font-extrabold text-white shadow-2xl sm:bottom-6"
      >
        ✓ {cartToast.message}
      </div>
    )}
    <SiteFooter navigate={go} />
  </div>
}
