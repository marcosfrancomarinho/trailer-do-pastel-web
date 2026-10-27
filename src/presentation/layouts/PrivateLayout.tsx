import { useLayoutEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import type { AdminSession } from '../../application/dtos/auth';
import { useApplicationServices } from '../hooks/global/useApplicationServices';
import { usePrivateNotifications } from '../hooks/admin/usePrivateNotifications';
import { PrivateContextProvider } from '../hooks/global/usePrivateContext';
import BrandMark from '../components/shared/BrandMark';
import { useEffect } from 'react';
import { connectOrderEvents } from '../../infrastructure/http/order-event-stream';

export default function PrivateLayout() {
  const useCases = useApplicationServices();
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<AdminSession | null>(() => useCases.auth.getSession.execute());
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const view = path === '/mesas' ? 'tables' : 'panel';
  const activeNavigationPath = view === 'tables' ? '/mesas' : '/painel';
  const headerClassName =
    'site-header private-header fixed inset-x-0 top-0 z-30 border-b border-[#365f74] bg-[#112e43] text-white' +
    (session ? ' private-header-authenticated' : '');
  const alerts = usePrivateNotifications(session?.token ?? '', view);

  useEffect(() => connectOrderEvents(session?.token ?? ''), [session?.token]);

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
  if (!session && view !== 'panel') return <Navigate to='/painel' replace />;

  return (
    <PrivateContextProvider.Provider value={{ session, setSession, alerts }}>
      <div className='restaurant-app min-h-screen overflow-x-hidden'>
        <header ref={headerRef} className={headerClassName}>
          <div className='mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2 sm:px-4 sm:py-3'>
            <BrandMark />
            {session && (
              <nav
                aria-label='Navegação administrativa'
                className='inline-flex shrink-0 gap-1 rounded-xl border border-[#41687c] bg-[#0b2537] p-1'
              >
                {[
                  { path: '/mesas', label: 'Mesas' },
                  { path: '/painel', label: 'Painel' },
                ].map((link) => (
                  <button
                    key={link.path}
                    type='button'
                    onClick={() => go(link.path)}
                    aria-current={activeNavigationPath === link.path ? 'page' : undefined}
                    className={
                      'min-h-10 rounded-lg px-3 py-2 text-center text-sm font-bold leading-tight transition-colors sm:min-h-11 sm:px-4 ' +
                      (activeNavigationPath === link.path
                        ? 'bg-[#ffca28] text-[#102b40] shadow-sm'
                        : 'text-slate-100 hover:bg-[#244b61]')
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
                aria-label='Voltar ao cardápio'
                className='grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#81a4b6] text-lg font-bold text-white hover:bg-[#244b61] sm:flex sm:h-11 sm:w-auto sm:gap-2 sm:px-4 sm:text-sm'
              >
                <span aria-hidden='true'>←</span>
                <span className='hidden sm:inline'>Voltar ao cardápio</span>
              </button>
            )}
          </div>
        </header>
        <div aria-hidden='true' style={{ height: headerHeight }} />
        {session && notificationPermission !== 'granted' && (
          <div role='status' className='mx-auto mt-3 flex max-w-6xl flex-wrap items-center gap-3 rounded-xl border border-amber-400/50 bg-[#433723] px-4 py-3 text-sm text-amber-50'>
            <span className='min-w-0 flex-1'>
              <strong className='block'>Notificações do navegador desativadas</strong>
              {notificationPermission === 'default'
                ? 'Autorize para receber avisos do navegador sobre novos pedidos.'
                : notificationPermission === 'denied'
                  ? 'Permissão bloqueada. Abra as configurações do site no navegador e permita as notificações.'
                  : 'Este navegador não oferece suporte às notificações do sistema.'}
            </span>
            {notificationPermission === 'default' && (
              <button type='button' onClick={() => void authorizeNotifications()}
                className='min-h-10 rounded-lg bg-amber-300 px-4 font-bold text-[#302714]'>
                Permitir notificações
              </button>
            )}
          </div>
        )}
        <Outlet />
      </div>
    </PrivateContextProvider.Provider>
  );
}
