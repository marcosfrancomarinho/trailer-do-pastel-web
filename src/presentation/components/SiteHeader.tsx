import AnchorLogo from '../atoms/AnchorLogo'

type Page = 'menu' | 'cart' | 'tracking' | 'admin' | 'tables'
type Props = { view: string; count: number; navigate: (page: Page) => void }

const mobileLinks: { page: Page; label: string; icon: string }[] = [
  { page: 'menu', label: 'Cardápio', icon: '☰' },
  { page: 'tracking', label: 'Meus pedidos', icon: '◷' },
  { page: 'cart', label: 'Carrinho', icon: '🛒' },
]

export default function SiteHeader({ view, count, navigate }: Props) {
  return (
    <>
      <header className="restaurant-header sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2.5 md:py-3">
          <button
            type="button"
            className="brand-mark flex items-center gap-3 text-left"
            onClick={() => navigate('menu')}
            aria-label="Trailer do Pastel - ir ao cardápio"
          >
            <span className="brand-symbol anchor-brand" aria-hidden="true">
              <AnchorLogo className="anchor-logo" />
            </span>
            <span className="brand-letters">
              TRAILER DO PASTEL
              <small className="brand-tagline">PASTÉIS • UM MAR DE SABORES</small>
            </span>
          </button>
          {view !== 'admin' && view !== 'tables' && <nav className="hidden gap-2 text-sm font-bold sm:flex" aria-label="Navegação principal">
            <button type="button" onClick={() => navigate('menu')} className={view === 'menu' ? 'nav-active' : ''}>Cardápio</button>
            <button type="button" onClick={() => navigate('tracking')} className={view === 'tracking' ? 'nav-active' : ''}>Meus pedidos</button>
          </nav>}
          {view !== 'admin' && view !== 'tables' && <button
            type="button"
            onClick={() => navigate('cart')}
            className="cart-header-button"
            aria-label={'Abrir carrinho com ' + count + ' itens'}
          >
            🛒 <span className="hidden sm:inline">Carrinho</span>
            {count > 0 && <b>{count}</b>}
          </button>}
        </div>
      </header>
      {view !== 'admin' && view !== 'tables' && <nav className="mobile-shop-nav sm:hidden" aria-label="Navegação do cliente">
        {mobileLinks.map(link => (
          <button
            key={link.page}
            type="button"
            onClick={() => navigate(link.page)}
            className={view === link.page ? 'mobile-shop-active' : ''}
            aria-current={view === link.page ? 'page' : undefined}
          >
            <span aria-hidden="true" className="mobile-shop-icon">{link.icon}</span>
            <span>{link.label}</span>
            {link.page === 'cart' && count > 0 && <strong className="mobile-cart-count">{count}</strong>}
          </button>
        ))}
      </nav>}
    </>
  )
}
