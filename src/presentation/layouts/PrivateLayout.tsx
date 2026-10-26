import { useLayoutEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import type { AdminSession } from '../../application/dtos/auth';
import { useApplicationServices } from '../hooks/global/useApplicationServices';
import { usePrivateNotifications } from '../hooks/admin/usePrivateNotifications';
import { PrivateContextProvider } from '../hooks/global/usePrivateContext';
import BrandMark from '../components/shared/BrandMark';
import { orderAlert } from '../../infrastructure/audio/order-alert';

export default function PrivateLayout() {
  const useCases = useApplicationServices();
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<AdminSession | null>(() => useCases.auth.getSession.execute());
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const view = path === '/mesas' ? 'tables' : path === '/comandas' ? 'comandas' : 'admin';
  const activeNavigationPath = view === 'tables' ? '/mesas' : '/admin';
  const headerClassName =
    'site-header private-header fixed inset-x-0 top-0 z-30 border-b border-[#365f74] bg-[#112e43] text-white' +
    (session ? ' private-header-authenticated' : '');
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

  function toggleNotifications() {
    if (alerts.notificationsOn) {
      useCases.notifications.setSoundPreference.execute(false);
      orderAlert.close();
      return;
    }
    useCases.notifications.setSoundPreference.execute(true);
  }

  function reloadCurrentView() {
    setRefreshing(true);
    window.location.reload();
  }

  function go(pathname: string) {
    navigate(pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (!session && view !== 'admin') return <Navigate to='/admin' replace />;
  if (session && view === 'comandas' && session.role !== 'ADMIN') return <Navigate to='/admin' replace />;

  return (
    <PrivateContextProvider.Provider value={{ session, setSession, alerts }}>
    <div className='restaurant-app min-h-screen overflow-x-hidden'>
      <header
        ref={headerRef}
        className={headerClassName}
      >
        <div className='mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2 sm:px-4 sm:py-3'>
          <BrandMark />
          {session && (
            <nav
              aria-label='Navegação administrativa'
              className='inline-flex shrink-0 gap-1 rounded-xl border border-[#41687c] bg-[#0b2537] p-1'
            >
              {[
                { path: '/mesas', label: 'Mesas' },
                { path: '/admin', label: 'Painel' },
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
          {session && (
            <div className='flex shrink-0 items-center gap-1.5'>
              <button
                type='button'
                onClick={toggleNotifications}
                aria-pressed={alerts.notificationsOn}
                aria-label={alerts.notificationsOn ? 'Desativar som e notificações' : 'Ativar som e notificações'}
                title={alerts.notificationsOn ? 'Desativar notificações' : 'Ativar notificações'}
                className={'relative grid h-10 w-10 shrink-0 place-items-center rounded-lg border sm:h-11 sm:w-11 ' +
                  (alerts.notificationsOn ? 'border-[#ffca28] bg-[#ffca28] text-[#102b40]' : 'border-[#56879d] bg-[#194258] text-white')}
              >
                <svg aria-hidden='true' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.9'
                  strokeLinecap='round' strokeLinejoin='round' className='h-5 w-5'>
                  {alerts.notificationsOn ? (
                    <path d='M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4' />
                  ) : (
                    <>
                      <path d='M9.17 4.17A6 6 0 0 1 18 9c0 1.42.12 2.49.35 3.33M6.26 6.26A6 6 0 0 0 6 8c0 7-3 7-3 9h14M10 21h4' />
                      <path d='M3 3 21 21' />
                    </>
                  )}
                </svg>
                {alerts.pendingCount > 0 && (
                  <span className='absolute -right-1 -top-1 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-4 text-white'>
                    {alerts.pendingCount > 99 ? '99+' : alerts.pendingCount}
                  </span>
                )}
              </button>
              <button
                type='button'
                onClick={reloadCurrentView}
                disabled={refreshing}
                aria-label='Atualizar página'
                title='Atualizar página'
                className='grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#56879d] bg-[#194258] text-white hover:bg-[#24556c] disabled:opacity-60 sm:h-11 sm:w-11'
              >
                <svg aria-hidden='true' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'
                  strokeLinecap='round' strokeLinejoin='round' className={'h-5 w-5 ' + (refreshing ? 'animate-spin' : '')}>
                  <path d='M20 11a8 8 0 1 0-2.35 5.65' />
                  <path d='M20 4v7h-7' />
                </svg>
              </button>
            </div>
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
      <Outlet />
    </div>
    </PrivateContextProvider.Provider>
  );
}
