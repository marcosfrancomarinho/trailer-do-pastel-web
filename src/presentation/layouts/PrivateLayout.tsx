import { useLayoutEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import type { AdminSession } from '../../application/dtos/auth';
import { useApplicationServices } from '../hooks/global/useApplicationServices';
import { usePrivateNotifications } from '../hooks/admin/usePrivateNotifications';
import { PrivateContextProvider } from '../hooks/global/usePrivateContext';
import BrandMark from '../components/shared/BrandMark';

export default function PrivateLayout() {
  const useCases = useApplicationServices();
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<AdminSession | null>(() => useCases.auth.getSession.execute());
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const view = path === '/mesas' ? 'tables' : path === '/comandas' ? 'comandas' : 'admin';
  const alerts = usePrivateNotifications(session?.token ?? '', view);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateHeight = () => setHeaderHeight(header.getBoundingClientRect().height);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, [view, session]);

  function go(pathname: string) {
    navigate(pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (!session && view !== 'admin') return <Navigate to='/admin' replace />;
  if (session && view === 'comandas' && session.role !== 'ADMIN') return <Navigate to='/admin' replace />;

  return (
    <PrivateContextProvider.Provider value={{ session, setSession, alerts }}>
    <div className='restaurant-app min-h-screen overflow-x-hidden'>
      <header ref={headerRef} className='site-header fixed inset-x-0 top-0 z-30 border-b-4 border-[#ffca28] bg-[#112e43] text-white'>
        <div className='mx-auto grid max-w-6xl grid-cols-1 gap-2 px-4 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center'>
          <BrandMark />
          {session && (
            <nav
              aria-label='Navegação administrativa'
              className='grid grid-cols-2 gap-2 sm:flex sm:justify-end'
            >
              {[
                { path: '/mesas', label: 'Mesas' },
                { path: '/admin', label: 'Painel' },
              ].map((link) => (
                <button
                  key={link.path}
                  type='button'
                  onClick={() => go(link.path)}
                  aria-current={path === link.path ? 'page' : undefined}
                  className={
                    'min-h-11 min-w-0 rounded-xl px-3 py-2 text-center text-sm font-bold leading-tight ' +
                    (path === link.path ? 'bg-[#ffca28] text-[#102b40]' : 'bg-[#244b61] text-white')
                  }
                >
                  {link.label}
                </button>
              ))}
            </nav>
          )}
          {!session && (
            <button
              type='button'
              onClick={() => go('/')}
              className='min-h-11 w-full rounded-xl border border-[#81a4b6] px-4 py-2 text-center text-sm font-bold text-white sm:w-auto'
            >
              Voltar ao cardápio
            </button>
          )}
        </div>
      </header>
      <div aria-hidden='true' style={{ height: headerHeight }} />
      <Outlet />
    </div>
    </PrivateContextProvider.Provider>
  );
}
