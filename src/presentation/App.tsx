import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import { api, brl } from '../api'
import { restaurant } from '../application/container'
import type { PendingOrder, PreparingOrder } from '../domain/models'
import { orderAlert } from './audio/order-alert'
import { cartTotal, toOrderPayload, type CartItem } from '../domain/cart'
import { readCart, saveCart } from '../infrastructure/storage/cart-storage'
import { trackOrder } from '../application/order-service'
import AdminOrders from './organisms/AdminOrders'
import AdminTables from './organisms/AdminTables'
import AdminComandaHistory from './organisms/AdminComandaHistory'
import AdminStore from './organisms/AdminStore'
import AdminUsers from './organisms/AdminUsers'
import { restaurantAdapter } from '../infrastructure/http/restaurant-adapter'
import type { StoreState } from '../domain/models'
import CustomerOrders from './organisms/CustomerOrders'
import SiteHeader from './components/SiteHeader'
import SiteFooter from './components/SiteFooter'
import ProductCard from './components/ProductCard'
import AdminManage from './components/AdminManage'
import AdminRegisters from './components/organisms/AdminRegisters'
import type { Addition, Category, Product } from '../api'
import type { SavedCustomerOrder } from '../domain/models'

const ADMIN_SESSION_KEY = 'trailer-pastel-admin-session'
const CUSTOMER_INFO_KEY = 'trailer-pastel-customer-info'

function readCustomerInfo(): { name: string; phone: string } {
  try {
    const stored = window.localStorage.getItem(CUSTOMER_INFO_KEY)
    if (!stored) return { name: '', phone: '' }
    const parsed: unknown = JSON.parse(stored)
    if (typeof parsed !== 'object' || parsed === null) return { name: '', phone: '' }
    const info = parsed as Record<string, unknown>
    return {
      name: typeof info.name === 'string' ? info.name : '',
      phone: typeof info.phone === 'string' ? info.phone : '',
    }
  } catch {
    return { name: '', phone: '' }
  }
}

function saveCustomerInfo(name: string, phone: string): void {
  try {
    window.localStorage.setItem(CUSTOMER_INFO_KEY, JSON.stringify({ name, phone }))
  } catch {
    // O pedido continua funcionando se o navegador bloquear o armazenamento.
  }
}

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

type View = 'menu' | 'cart' | 'tracking' | 'admin' | 'tables'
const pagePaths: Record<View, string> = {
  menu: '/',
  cart: '/carrinho',
  tracking: '/pedidos',
  admin: '/admin',
  tables: '/mesas',
}
const pathViews: Record<string, View> = {
  '/': 'menu',
  '/carrinho': 'cart',
  '/pedidos': 'tracking',
  '/admin': 'admin',
  '/mesas': 'tables',
}
type AdminSection = 'orders' | 'comanda-history' | 'store' | 'users-list' | 'product' | 'addition' | 'user' | 'category' | 'manage-products' | 'manage-additions' | 'manage-categories'
export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const view = pathViews[location.pathname] ?? 'menu'
  const [adminToken, setAdminToken] = useState(readAdminSession)
  const [adminRole, setAdminRole] = useState<'ADMIN' | 'EMPLOYEE'>(() => sessionStorage.getItem('trailer-admin-role') === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE')
  const [storeState, setStoreState] = useState<StoreState | null>(null)
  const [observation, setObservation] = useState('')
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
  const [cart, setCart] = useState<CartItem[]>(readCart)
  const [savedCustomerInfo] = useState(readCustomerInfo)
  const [customerName, setCustomerName] = useState(savedCustomerInfo.name)
  const [customerPhone, setCustomerPhone] = useState(savedCustomerInfo.phone)
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
  const [notificationsOn, setNotificationsOn] = useState(() => window.localStorage.getItem('admin-order-sound') !== 'off')
  const switchNotifications = () => {
    const next = !notificationsOn
    setNotificationsOn(next)
    window.localStorage.setItem('admin-order-sound', next ? 'on' : 'off')
    if (!next) {
      orderAlert.close()
      setNewPendingCount(0)
      setCancelAlerts([])
    } else {
      void orderAlert.enable().catch(() => {})
    }
    window.dispatchEvent(new Event('admin-notification-preference'))
  }
  useEffect(() => {
    const sync = () => {
      const enabled = window.localStorage.getItem('admin-order-sound') !== 'off'
      setNotificationsOn(enabled)
      if (!enabled) { setNewPendingCount(0); setCancelAlerts([]) }
    }
    window.addEventListener('admin-notification-preference', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('admin-notification-preference', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  const [cancelAlerts, setCancelAlerts] = useState<(PendingOrder | PreparingOrder)[]>([])
  const acknowledgedCancellationIds = useRef(new Set<string>())
  const preparationSnapshot = useRef<Map<string, PendingOrder | PreparingOrder> | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [newPendingCount, setNewPendingCount] = useState(0)
  const pendingSeenRef = useRef<Set<string> | null>(null)
  const sectionRef = useRef(adminSection)
  sectionRef.current = adminSection

  // Permanece ativo ao navegar entre todas as seções administrativas.
  useEffect(() => {
    if (!adminToken || view !== 'admin') {
      pendingSeenRef.current = null
      setPendingCount(0)
      setNewPendingCount(0)
      return
    }
    let active = true
    let timeout: ReturnType<typeof setTimeout> | undefined
    const check = async () => {
      try {
        const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
        const results = await restaurant.pendingOrders(adminToken, today)
        if (!active) return
        const ids = new Set(results.map(order => order.id))
        const seen = pendingSeenRef.current
        if (seen) {
          const arrivals = results.filter(order => !seen.has(order.id))
          if (arrivals.length && sectionRef.current !== 'orders' && window.localStorage.getItem('admin-order-sound') !== 'off') {
            setNewPendingCount(count => count + arrivals.length)
            if (window.localStorage.getItem('admin-order-sound') !== 'off') orderAlert.play()
          }
          results.forEach(order => seen.add(order.id))
        } else {
          pendingSeenRef.current = ids
        }
        setPendingCount(results.length)
      } catch {
        // Falhas transitórias não devem disparar alertas falsos.
      } finally {
        if (active) timeout = setTimeout(() => { void check() }, 5000)
      }
    }
    void check()
    return () => { active = false; if (timeout) clearTimeout(timeout) }
  }, [adminToken, view])

  // Acompanha cancelamentos mesmo fora da seção Pedidos.
  // O primeiro resultado é apenas uma referência, não gera alarmes antigos.
  useEffect(() => {
    if (!adminToken || view !== 'admin') {
      preparationSnapshot.current = null
      setCancelAlerts([])
      return
    }
    let active = true
    let timeout: ReturnType<typeof setTimeout> | undefined
    let daySnapshot = ''
    const check = async () => {
      try {
        const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
        const [pending, ongoing, history] = await Promise.all([
          restaurant.pendingOrders(adminToken, day),
          restaurant.preparingOrders(adminToken, day),
          restaurant.orderHistory(adminToken, day),
        ])
        if (!active) return
        const current = new Map([...pending, ...ongoing].map(order => [order.id, order] as const))
        if (daySnapshot === day && preparationSnapshot.current) {
          const canceled = new Set(history.filter(order => order.status === 'CANCELED').map(order => order.id))
          const matches = [...preparationSnapshot.current.values()].filter(order =>
            order.tableNumber != null && !current.has(order.id) &&
            canceled.has(order.id) && !acknowledgedCancellationIds.current.has(order.id))
          if (matches.length && window.localStorage.getItem('admin-order-sound') !== 'off') {
            setCancelAlerts(previous => {
              const already = new Set(previous.map(order => order.id))
              return [...previous, ...matches.filter(order => !already.has(order.id))]
            })
            orderAlert.playCancellation()
          }
        }
        preparationSnapshot.current = current
        daySnapshot = day
      } catch {
        // Falha de consulta não redefine a referência, evitando falsos alertas.
      } finally {
        if (active) timeout = setTimeout(() => { void check() }, 5000)
      }
    }
    void check()
    return () => { active = false; if (timeout) clearTimeout(timeout) }
  }, [adminToken, view])

  useEffect(() => {
    if (!adminToken || view !== 'admin') return
    const unlock = () => {
      if (window.localStorage.getItem('admin-order-sound') === 'off') return
      void orderAlert.enable().catch(() => {})
    }
    document.addEventListener('pointerdown', unlock)
    document.addEventListener('keydown', unlock)
    return () => {
      document.removeEventListener('pointerdown', unlock)
      document.removeEventListener('keydown', unlock)
    }
  }, [adminToken, view])


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
    let active = true
    const updateStatus = () => {
      if (document.visibilityState === 'hidden') return
      void restaurantAdapter.storeStatus()
        .then(value => { if (active) setStoreState(value) })
        .catch(() => {})
    }
    updateStatus()
    const timer = window.setInterval(updateStatus, 30_000)
    window.addEventListener('focus', updateStatus)
    return () => {
      active = false
      clearInterval(timer)
      window.removeEventListener('focus', updateStatus)
    }
  }, [])

  useEffect(() => { saveCart(cart) }, [cart])

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
  function go(next: View) { navigate(pagePaths[next]); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
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
      if (storeState?.status === 'CLOSED') throw new Error('A loja está fechada para novos pedidos.')
      await restaurant.createOrder({ ...toOrderPayload(customerName, customerPhone, cart), observation: observation.trim() || null }, {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        observation: observation.trim() || null,
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
      saveCustomerInfo(customerName.trim(), customerPhone.trim())
      setOrders(restaurant.recentOrders())
      setCart([]); setObservation(''); go('tracking')
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
    event.preventDefault()
    if (adminBusy) return
    setAdminBusy(true); setAdminError('')
    try {
      const logged = await api<{ name: string; role: 'ADMIN' | 'EMPLOYEE'; accessToken: string }>('/login', {
        method: 'POST', body: JSON.stringify({ name: adminName, password: adminPassword })
      })
      saveAdminSession(logged.accessToken)
      sessionStorage.setItem('trailer-admin-role', logged.role)
      setAdminRole(logged.role)
      setAdminToken(logged.accessToken); setAdminPassword('')
      navigate('/mesas')
      setAdminBusy(false)
    } catch (err) { setAdminError(err instanceof Error ? err.message : 'Não foi possível entrar'); setAdminBusy(false) }
  }
  return <div className="restaurant-app min-h-screen overflow-x-hidden">
    <SiteHeader view={view} count={cartCount} navigate={go} />
    <Routes>
      <Route path="/" element={<>
      <section className="restaurant-hero">
        <span className="sea-flower sea-flower-left" aria-hidden="true">✿</span><span className="sea-flower sea-flower-right" aria-hidden="true">✿</span>
        <div className="hero-inner mx-auto grid max-w-6xl items-center gap-8 px-5 py-10 md:grid-cols-[1fr_0.95fr] md:py-20">
          <div className="relative z-10">
            <span className="hero-eyebrow">⚓ BEM-VINDO AO TRAILER DO PASTEL</span>
            <h1 className="hero-headline">UM MAR DE <span>SABORES!</span></h1>
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
        {storeState?.status === 'CLOSED' && <div role="status" className="mb-5 rounded-2xl border-2 border-amber-400 bg-[#4d3921] p-5 text-white"><strong className="text-lg text-amber-200">🔴 Loja fechada</strong><p className="mt-1 text-sm font-semibold">No momento, não estamos recebendo novos pedidos. Você pode consultar o cardápio e acompanhar pedidos anteriores.</p></div>}
        {error && <div role="alert" className="mb-5 rounded-2xl bg-red-50 p-4 text-red-700">{error} <button onClick={() => void loadCatalog()} className="underline">Tentar novamente</button></div>}
        {loading ? <div className="py-20 text-center">Carregando o cardápio...</div> : visible.length === 0 ? <div className="py-20 text-center">Nenhum produto encontrado.</div> :
        <div className="product-grid grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visible.map(p => <ProductCard key={p.id} product={p} category={categories.find(c => c.id === p.categoryId)?.name || 'Especial'} select={choose} />)}</div>}
      </main>
    </>} />
      <Route path="/carrinho" element={<main className="inner-page mx-auto max-w-5xl px-4 py-12"><button className="mb-6 text-sm font-bold text-[#008b9e]" onClick={() => go('menu')}>← Voltar ao cardápio</button><h1 className="mb-8 text-4xl font-black">Seu carrinho</h1>
      {cart.length === 0 ? <div className="rounded-3xl bg-white p-12 text-center"><p className="mb-5">Seu carrinho está vazio.</p><button className="rounded-full bg-[#ffc629] px-6 py-3 font-bold text-[#113548]" onClick={() => go('menu')}>Escolher pastéis</button></div> :
      <div className="grid gap-8 md:grid-cols-[1.3fr_1fr]"><div className="space-y-3">{cart.map(item => <div key={item.key} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex justify-between gap-3"><div><h3 className="text-lg font-extrabold">{item.product.name}</h3>{item.additions.map(a => <p key={a.addition.id} className="text-sm text-[#557383]">+ {a.quantity}× {a.addition.name}</p>)}</div><strong>{brl(item.quantity * (Number(item.product.price) + item.additions.reduce((n,a) => n + Number(a.addition.price)*a.quantity,0)))}</strong></div><div className="mt-4 flex items-center gap-4"><button aria-label="Diminuir quantidade" className="rounded-lg bg-[#e8faff] px-3 py-1" onClick={() => setCart(c => c.map(x => x.key === item.key ? {...x,quantity: x.quantity-1}:x).filter(x => x.quantity > 0))}>−</button><b>{item.quantity}</b><button aria-label="Aumentar quantidade" className="rounded-lg bg-[#e8faff] px-3 py-1" onClick={() => setCart(c => c.map(x => x.key === item.key ? {...x,quantity:x.quantity+1}:x))}>+</button><button className="ml-auto text-sm text-red-600" onClick={() => setCart(c => c.filter(x => x.key !== item.key))}>Remover</button></div></div>)}</div>
        <form onSubmit={e => void checkout(e)} className="h-fit space-y-4 rounded-3xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Finalizar pedido</h2><label className="block text-sm font-semibold">Seu nome<input required value={customerName} onChange={e => setCustomerName(e.target.value)} className="mt-2 w-full rounded-xl border border-cyan-100 p-3 outline-cyan-400" placeholder="Como podemos chamar você?"/></label><label className="block text-sm font-semibold">Telefone<input required type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="mt-2 w-full rounded-xl border border-cyan-100 p-3 outline-cyan-400" placeholder="(99) 99999-9999"/></label><label className="block text-sm font-semibold">Observações do pedido (opcional)<textarea rows={3} maxLength={500} value={observation} onChange={event => setObservation(event.target.value)} className="mt-2 w-full rounded-xl border border-cyan-100 bg-white p-3 text-[#102c40]" placeholder="Ex.: Sem cebola, pouco sal..." /></label>{storeState?.status === 'CLOSED' && <p role="alert" className="checkout-closed-notice rounded-xl p-4 text-sm font-bold">A loja está fechada e não está aceitando pedidos no momento.</p>}<div className="flex justify-between border-t border-cyan-100 pt-4 text-lg"><span>Total estimado</span><strong>{brl(total)}</strong></div><p className="text-xs text-[#557383]">O preço final será validado pela pastelaria no servidor.</p>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<button disabled={sending || storeState?.status === 'CLOSED'} className="w-full rounded-full bg-[#ffc629] py-4 font-black text-[#113548] disabled:opacity-60">{sending ? 'Enviando pedido...' : 'Confirmar pedido →'}</button></form></div>}
    </main>} />
      <Route path="/pedidos" element={<>
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
    </>} />
      <Route path="/mesas" element={adminToken ? (
        <main className="inner-page mx-auto max-w-6xl space-y-5 px-4 py-7 sm:py-10">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#507f94] bg-[#112e43] p-4 text-white">
            <div><p className="text-xs font-bold text-[#a2dbf3]">ÁREA DO FUNCIONÁRIO</p><h1 className="text-2xl font-black">Mesas e comandas</h1></div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => navigate('/admin')} className="min-h-11 rounded-xl bg-[#ffca28] px-4 font-extrabold text-[#102b40]">Painel administrativo</button>
              <button type="button" onClick={() => { saveAdminSession(''); sessionStorage.removeItem('trailer-admin-role'); setAdminToken(''); navigate('/admin') }} className="min-h-11 rounded-xl border border-[#81a4b6] px-4 font-bold text-white">Sair</button>
            </div>
          </div>
          <AdminTables token={adminToken} products={products} categories={categories} />
        </main>
      ) : <Navigate to="/admin" replace />} />
      <Route path="/admin" element={<main className="inner-page mx-auto max-w-5xl px-4 py-5 sm:py-9">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#507f94] bg-[#112e43] p-4 text-white">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wide text-[#a2dbf3]">GESTÃO DA PASTELARIA</p>
            <h1 className="mt-1 text-xl font-black leading-tight sm:text-2xl">Painel administrativo</h1>
          </div>
          {adminToken && <button type="button" onClick={() => navigate('/mesas')}
            className="min-h-11 rounded-xl bg-[#ffca28] px-4 text-sm font-extrabold text-[#102b40] sm:text-base">🪑 Mesas e comandas</button>}
        </div>
        {!adminToken ? <form onSubmit={e => void login(e)} className="mx-auto mt-8 max-w-md space-y-4 rounded-3xl bg-white p-7 shadow-sm"><h2 className="text-xl font-black">Entrar</h2><input required autoComplete="username" value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Usuário" className="w-full rounded-xl border border-cyan-100 p-3"/><input required type="password" autoComplete="current-password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Senha" className="w-full rounded-xl border border-cyan-100 p-3"/>{adminError && <p role="alert" className="text-sm text-red-600">{adminError}</p>}<button type="submit" disabled={adminBusy} aria-busy={adminBusy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ffc629] px-4 py-3 font-bold text-[#113548] disabled:cursor-wait disabled:opacity-75">{adminBusy ? <><span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-[3px] border-[#113548]/25 border-t-[#113548]" /><span>Entrando...</span></> : 'Entrar'}</button></form> :
      <>
      {notificationsOn && cancelAlerts.length > 0 && <section role="alert" aria-label="Pedidos de mesa cancelados" className="mt-4 space-y-3">
        {cancelAlerts.map(order => <div key={order.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border-2 border-red-400 bg-[#50232d] p-4 text-white shadow-lg">
          <div className="min-w-0 space-y-1">
            <strong className="block text-lg">🚨 Pedido de mesa cancelado!</strong>
            <p className="font-bold">Mesa {order.tableNumber} · #{order.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-sm text-red-100">Interrompa o preparo deste pedido.</p>
            <p className="break-words text-sm text-red-100">{order.items.map(item => item.quantity + '× ' + item.productName).join(', ')}</p>
          </div>
          <button type="button" onClick={() => {
            acknowledgedCancellationIds.current.add(order.id)
            setCancelAlerts(previous => previous.filter(item => item.id !== order.id))
          }} className="min-h-11 rounded-lg bg-white px-5 py-2 font-black text-[#50232d]">Ciente</button>
        </div>)}
      </section>}
      {notificationsOn && newPendingCount > 0 && adminSection !== 'orders' && <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-[#fcd34d] bg-[#57431f] p-4 text-[#fef3c7] shadow-lg">
        <div><strong className="block text-lg">🔔 {newPendingCount} {newPendingCount === 1 ? 'novo pedido recebido!' : 'novos pedidos recebidos!'}</strong><span className="text-sm">Há pedidos aguardando confirmação.</span></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setAdminSection('orders'); setAdminMenuOpen(false); setNewPendingCount(0) }} className="min-h-11 rounded-lg bg-[#ffca28] px-4 py-2 font-black text-[#102c40]">Ver pedidos</button>
          <button type="button" onClick={() => setNewPendingCount(0)} className="min-h-11 rounded-lg border border-[#fcd34d] px-3 py-2 font-bold">Dispensar</button>
        </div>
      </div>}
      <div className="admin-layout mt-4 grid min-w-0 gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="md:hidden">
          <button type="button" aria-label={adminMenuOpen ? 'Fechar menu administrativo' : 'Abrir menu administrativo'}
            aria-expanded={adminMenuOpen} aria-controls="admin-navigation" onClick={() => setAdminMenuOpen(open => !open)}
            className="admin-mobile-menu-trigger flex min-h-11 w-full items-center justify-between rounded-xl border px-3 py-2 text-sm font-bold shadow-sm">
            <span className="flex items-center gap-2"><span aria-hidden="true" className="text-lg">{adminMenuOpen ? '✕' : '☰'}</span> Menu</span>
            <span className="text-xs text-[#557383]">{adminSection === 'orders' ? 'Pedidos' : adminSection === 'comanda-history' ? 'Histórico de comandas' : adminSection === 'product' ? 'Produtos' : adminSection === 'addition' ? 'Adicionais' : adminSection === 'user' ? 'Usuários' : 'Cadastros'}</span>
          </button>
        </div>
        <aside id="admin-navigation" aria-label="Menu administrativo" className={(adminMenuOpen ? 'block ' : 'hidden ') + 'admin-sidebar h-fit rounded-3xl border border-cyan-100 bg-white p-3 shadow-sm md:sticky md:top-24 md:block'}>
          <p className="px-3 pb-3 pt-2 text-xs font-black uppercase tracking-widest text-[#557383]">Gerenciamento</p>
          <button type="button" aria-pressed={notificationsOn} onClick={switchNotifications}
            className={'mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-extrabold ' +
              (notificationsOn ? 'border-[#dfac29] bg-[#ffca28] text-[#102c40]' : 'border-[#54778b] bg-[#25475b] text-white')}>
            {notificationsOn ? '🔔 Som / notificações ligados' : '🔕 Som / notificações desligados'}
          </button>
          <nav className="grid grid-cols-1 gap-2" aria-label="Seções do painel">
            {([['orders', '📋', 'Pedidos'], ['comanda-history', '🧾', 'Histórico de comandas'], ['store', '🏪', 'Abrir / fechar loja'], ['product', '🥟', 'Produtos'], ['addition', '🧀', 'Adicionais'], ...(adminRole === 'ADMIN' ? [['user', '👤', 'Cadastrar usuário'], ['users-list', '👥', 'Gerenciar usuários']] as const : []), ['category', '🗂️', 'Nova categoria'], ['manage-products', '✏️', 'Gerenciar produtos'], ['manage-additions', '⚙️', 'Gerenciar adicionais'], ['manage-categories', '🗃️', 'Gerenciar categorias']] as const).map(([key, icon, label]) =>
              <button key={key} type="button" aria-current={adminSection === key ? 'page' : undefined} onClick={() => { setAdminSection(key); setAdminError(''); setAdminMenuOpen(false) }}
                className={'flex min-h-12 items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-bold transition ' + (adminSection === key ? 'bg-[#ffc629] text-[#143b50] shadow-sm' : 'text-[#416476] hover:bg-cyan-50')}>
                <span aria-hidden="true">{icon}</span><span>{label}</span>{key === 'orders' && notificationsOn && pendingCount > 0 && <span className="ml-auto rounded-full bg-[#b91c1c] px-2 py-0.5 text-xs font-black text-white" aria-label={pendingCount + ' pedidos pendentes'}>{pendingCount}</span>}
              </button>)}
          </nav>
          <button type="button" className="mt-3 min-h-11 w-full rounded-xl border border-[#315970] bg-[#153c53] px-3 py-3 text-sm font-extrabold text-white hover:bg-[#24556c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffca28]"
            onClick={() => {saveAdminSession(''); setAdminToken(''); sessionStorage.removeItem('trailer-admin-role'); setAdminRole('EMPLOYEE'); setAdminSection('orders'); setAdminMenuOpen(false)}}>Sair do painel</button>
        </aside>
        <section className="min-w-0">
          {adminSection === 'orders' ? <AdminOrders token={adminToken} /> : adminSection === 'comanda-history' ? <AdminComandaHistory token={adminToken} /> : adminSection === 'store' ? <AdminStore token={adminToken} /> : adminSection === 'users-list' && adminRole === 'ADMIN' ? <AdminUsers token={adminToken} /> : adminSection.startsWith('manage-') ? <AdminManage key={adminSection} kind={adminSection === 'manage-products' ? 'product' : adminSection === 'manage-additions' ? 'addition' : 'category'} token={adminToken} refreshCatalog={loadCatalog} /> : <AdminRegisters key={adminSection} section={adminSection as 'product' | 'addition' | 'category' | 'user'} token={adminToken} onProductCreated={loadCatalog} />}
        </section>
      </div></>}
    </main>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
