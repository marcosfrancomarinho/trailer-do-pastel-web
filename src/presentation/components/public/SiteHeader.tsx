import BrandMark from '../shared/BrandMark';
import { useLocation, useNavigate } from 'react-router';
import { usePublicContext } from '../../hooks/global/usePublicContext';

type Page = 'menu' | 'cart' | 'tracking';

const navigationItems: { page: Page; label: string }[] = [
  { page: 'menu', label: 'Cardápio' },
  { page: 'cart', label: 'Carrinho' },
  { page: 'tracking', label: 'Meus pedidos' },
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
    <header className='restaurant-header site-header public-header sticky top-0 z-30'>
      <div className='mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-4 sm:py-3'>
        <BrandMark />
        <nav
          className='inline-flex shrink-0 gap-1 rounded-xl border border-[#41687c] bg-[#0b2537] p-1'
          aria-label='Navegação principal'
        >
          {navigationItems.map((item) => (
            <button
              key={item.page}
              type='button'
              onClick={() => go(item.page)}
              aria-current={view === item.page ? 'page' : undefined}
              aria-label={item.page === 'cart' ? `Carrinho com ${count} itens` : undefined}
              className={
                'relative min-h-10 rounded-lg px-2 py-2 text-center text-xs font-bold leading-tight whitespace-nowrap transition-colors sm:min-h-11 sm:px-4 sm:text-sm ' +
                (view === item.page
                  ? 'bg-[#ffca28] text-[#102b40] shadow-sm'
                  : 'text-slate-100 hover:bg-[#244b61]')
              }
            >
              {item.label}
              {item.page === 'cart' && count > 0 && (
                <span
                  aria-hidden='true'
                  className='absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-0.5 text-[10px] font-black leading-none text-white'
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
