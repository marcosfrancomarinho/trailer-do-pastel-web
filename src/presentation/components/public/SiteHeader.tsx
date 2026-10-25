import BrandMark from '../shared/BrandMark';
import { useLocation, useNavigate } from 'react-router';
import { usePublicContext } from '../../hooks/global/usePublicContext';

type Page = 'menu' | 'cart' | 'tracking';

const mobileLinks: { page: Page; label: string; icon: string }[] = [
  { page: 'menu', label: 'Cardápio', icon: '☰' },
  { page: 'tracking', label: 'Meus pedidos', icon: '◷' },
  { page: 'cart', label: 'Carrinho', icon: '🛒' },
];

export default function SiteHeader() {
  const navigate = useNavigate();
  const path = useLocation().pathname.replace(/\/+$/, '') || '/';
  const view: Page = path === '/carrinho' ? 'cart' : path === '/pedidos' ? 'tracking' : 'menu';
  const { cart } = usePublicContext();
  const count = cart.reduce((total, item) => total + item.quantity, 0);

  function go(page: Page) {
    navigate({ menu: '/', cart: '/carrinho', tracking: '/pedidos' }[page]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <header className='restaurant-header site-header sticky top-0 z-30'>
        <div className='mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2.5 md:py-3'>
          <BrandMark />
          <nav className='hidden gap-2 text-sm font-bold sm:flex' aria-label='Navegação principal'>
            <button type='button' onClick={() => go('menu')} className={view === 'menu' ? 'nav-active' : ''}>
              Cardápio
            </button>
            <button type='button' onClick={() => go('tracking')} className={view === 'tracking' ? 'nav-active' : ''}>
              Meus pedidos
            </button>
          </nav>
          <button
            type='button'
            onClick={() => go('cart')}
            className='cart-header-button hidden sm:flex'
            aria-label={'Abrir carrinho com ' + count + ' itens'}
          >
            🛒 <span className='hidden sm:inline'>Carrinho</span>
            {count > 0 && <b>{count}</b>}
          </button>
        </div>
      </header>
      <nav className='mobile-shop-nav sm:hidden' aria-label='Navegação do cliente'>
        {mobileLinks.map((link) => (
          <button
            key={link.page}
            type='button'
            onClick={() => go(link.page)}
            className={view === link.page ? 'mobile-shop-active' : ''}
            aria-current={view === link.page ? 'page' : undefined}
          >
            <span aria-hidden='true' className='mobile-shop-icon'>
              {link.icon}
            </span>
            <span>{link.label}</span>
            {link.page === 'cart' && count > 0 && <strong className='mobile-cart-count'>{count}</strong>}
          </button>
        ))}
      </nav>
    </>
  );
}
