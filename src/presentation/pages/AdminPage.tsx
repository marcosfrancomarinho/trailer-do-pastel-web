import AdminOrders from '../components/admin/AdminOrders';
import PrivateAlerts from '../components/admin/PrivateAlerts';
import AdminStore from '../components/admin/AdminStore';
import AdminUsers from '../components/admin/AdminUsers';
import AdminManage from '../components/admin/AdminManage';
import AdminRegisters from '../components/admin/AdminRegisters';
import AdminComandaHistory from '../components/admin/AdminComandaHistory';
import { useAdminPage } from '../hooks/admin/useAdminPage';

export default function AdminPage() {
  const {
    adminToken,
    adminRole,
    adminDisplayName,
    adminName,
    setAdminName,
    adminPassword,
    setAdminPassword,
    adminSection,
    adminMenuOpen,
    menuButtonRef,
    adminBusy,
    adminError,
    navigationItems,
    profileInitials,
    currentSectionLabel,
    selectSection,
    toggleMenu,
    closeMenu,
    logout,
    notificationsOn,
    pendingCount,
    login,
    onSeeOrders,
  } = useAdminPage();

  return (
    <main className='inner-page mx-auto max-w-5xl px-4 py-5 sm:py-7'>
      <h1 className='sr-only'>Painel administrativo</h1>
      {!adminToken ? (
        <form onSubmit={(e) => void login(e)} className='mx-auto mt-4 max-w-md space-y-4 rounded-3xl bg-white p-7 shadow-sm sm:mt-8'>
          <h2 className='text-xl font-black'>Entrar</h2>
          <input
            required
            autoComplete='username'
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            placeholder='Usuário'
            className='w-full rounded-xl border border-cyan-100 p-3'
          />
          <input
            required
            type='password'
            autoComplete='current-password'
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder='Senha'
            className='w-full rounded-xl border border-cyan-100 p-3'
          />
          {adminError && (
            <p role='alert' className='text-sm text-red-600'>
              {adminError}
            </p>
          )}
          <button
            type='submit'
            disabled={adminBusy}
            aria-busy={adminBusy}
            className='flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ffc629] px-4 py-3 font-bold text-[#113548] disabled:cursor-wait disabled:opacity-75'
          >
            {adminBusy ? (
              <>
                <span
                  aria-hidden='true'
                  className='h-5 w-5 animate-spin rounded-full border-[3px] border-[#113548]/25 border-t-[#113548]'
                />
                <span>Entrando...</span>
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      ) : (
        <>
          <PrivateAlerts
            showNewPending={adminSection !== 'orders'}
            onSeeOrders={onSeeOrders}
          />
          <div className='admin-layout mt-4 min-w-0'>
            {adminMenuOpen && (
              <button
                type='button'
                tabIndex={-1}
                aria-label='Fechar menu administrativo'
                onClick={closeMenu}
                className='fixed inset-0 z-40 cursor-default bg-black/60'
              />
            )}
            <button
              ref={menuButtonRef}
              type='button'
              aria-label={adminMenuOpen ? 'Fechar menu administrativo' : 'Abrir menu administrativo'}
              aria-expanded={adminMenuOpen}
              aria-controls='admin-navigation'
              onClick={toggleMenu}
              className='admin-mobile-menu-trigger fixed bottom-4 left-4 z-[60] flex min-h-12 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold shadow-xl sm:bottom-6 sm:left-6'
            >
              <span aria-hidden='true' className='text-lg'>{adminMenuOpen ? '✕' : '☰'}</span>
              Menu
              <span className='max-w-28 truncate border-l pl-2 text-xs sm:max-w-40'>{currentSectionLabel}</span>
            </button>
            <aside
              id='admin-navigation'
              aria-label='Menu administrativo'
              hidden={!adminMenuOpen}
              className='admin-sidebar fixed bottom-20 left-4 z-50 max-h-[calc(100dvh-6rem)] w-[calc(100vw-2rem)] max-w-80 overflow-y-auto overscroll-contain rounded-2xl border border-cyan-100 bg-white p-3 shadow-xl sm:bottom-24 sm:left-6'
            >
              {adminDisplayName && (
                <div
                  className='mb-2 flex min-w-0 items-center gap-2 rounded-lg bg-[#f3f8fa] px-2 py-2'
                  aria-label='Perfil do usuário conectado'
                >
                  <span
                    className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#23495e] text-xs font-bold leading-none text-white'
                    aria-hidden='true'
                  >
                    {profileInitials}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <strong
                      title={adminDisplayName}
                      className='block max-w-full truncate whitespace-nowrap text-xs font-semibold text-[#17384b]'
                    >
                      {adminDisplayName}
                    </strong>
                    <span className='block truncate text-[11px] text-[#567484]'>
                      {adminRole === 'ADMIN' ? 'Administrador' : 'Funcionário'}
                    </span>
                  </div>
                </div>
              )}
              <p className='px-3 pb-3 pt-2 text-xs font-black uppercase tracking-widest text-[#557383]'>Gerenciamento</p>
              <nav className='grid grid-cols-1 gap-2' aria-label='Seções do painel'>
                {navigationItems.map(({ key, icon, label }) => (
                  <button
                    key={key}
                    type='button'
                    aria-current={adminSection === key ? 'page' : undefined}
                    onClick={() => selectSection(key)}
                    className={
                      'flex min-h-12 items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-bold transition ' +
                      (adminSection === key ? 'bg-[#ffc629] text-[#143b50] shadow-sm' : 'text-[#416476] hover:bg-cyan-50')
                    }
                  >
                    <span aria-hidden='true'>{icon}</span>
                    <span>{label}</span>
                    {key === 'orders' && notificationsOn && pendingCount > 0 && (
                      <span
                        className='ml-auto rounded-full bg-[#b91c1c] px-2 py-0.5 text-xs font-black text-white'
                        aria-label={pendingCount + ' pedidos pendentes'}
                      >
                        {pendingCount}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
              <div className='mt-3 border-t border-cyan-100 pt-3'>
                <button
                  type='button'
                  onClick={logout}
                  className='flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-[#416476] hover:bg-cyan-50'
                >
                  <span aria-hidden='true'>↪</span>
                  Sair
                </button>
              </div>
            </aside>
            <section className='min-w-0 pb-20'>
              {adminRole !== 'ADMIN' || adminSection === 'orders' ? (
                <AdminOrders />
              ) : adminSection === 'comandas' ? (
                <AdminComandaHistory />
              ) : adminSection === 'store' ? (
                <AdminStore />
              ) : adminSection === 'users-list' ? (
                <AdminUsers />
              ) : adminSection.startsWith('manage-') ? (
                <AdminManage
                  key={adminSection}
                  kind={
                    adminSection === 'manage-products' ? 'product' : adminSection === 'manage-additions' ? 'addition' : 'category'
                  }
                />
              ) : (
                <AdminRegisters key={adminSection} section={adminSection as 'product' | 'addition' | 'category' | 'user'} />
              )}
            </section>
          </div>
        </>
      )}
    </main>
  );
}
