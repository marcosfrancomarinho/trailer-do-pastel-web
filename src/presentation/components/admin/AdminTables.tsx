import { CartTotal } from '../../../application/utils/cart-total.ts';
import { brl } from '../../../shared/formatters/currency';
import { useAdminTables } from '../../hooks/admin/useAdminTables';
import TableReceipt from './TableReceipt';

const orderStatusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em preparo',
  COMPLETED: 'Pronto',
  CANCELED: 'Cancelado',
};
const field = 'min-h-11 w-full rounded-xl border border-[#63899a] bg-[#edf8fc] px-3 py-2 text-[#102c40]';
const button = 'min-h-11 rounded-xl bg-[#ffca28] px-4 py-2 font-bold text-[#09283b] disabled:opacity-50';

function tableAppearance(status: string, hasReadyOrders: boolean) {
  if (status === 'FREE') {
    return { color: 'border-[#60dcaa] bg-[#164734]', label: 'Livre' };
  }
  if (hasReadyOrders) {
    return { color: 'border-[#61c7fa] bg-[#174b73]', label: 'Pedidos prontos' };
  }
  return { color: 'border-[#ffce56] bg-[#544221]', label: 'Em andamento' };
}

export default function AdminTables() {
  const {
    categories,
    catalogError,
    loadCatalog,
    tables,
    readyTables,
    selected,
    tableView,
    setTableView,
    cartPanelRef,
    draftCount,
    details,
    printTable,
    setPrintTable,
    number,
    setNumber,
    showCreateTable,
    setShowCreateTable,
    observation,
    setObservation,
    product,
    setProduct,
    additionsBusy,
    amounts,
    quantity,
    setQuantity,
    cart,
    search,
    updateSearch,
    category,
    updateCategory,
    filteredProducts,
    visibleProducts,
    hasMoreProducts,
    busy,
    error,
    dialog,
    availableAdditions,
    customProductPrice,
    closeTable,
    openTable,
    createTable,
    chooseProduct,
    addProduct,
    loadMoreProducts,
    createOrder,
    release,
    archiveTable,
    removeOrder,
    changeItemQuantity,
    removeItem,
    changeAdditionAmount,
  } = useAdminTables();

  const sortedTables = [...tables].sort((first, second) => first.number - second.number);

  return (
    <section
      aria-labelledby='tables-heading'
      className='min-w-0 space-y-5 rounded-2xl border border-[#426b80] bg-[#112e43] p-3 text-white shadow-sm sm:p-5'
    >
      <div className='flex flex-col gap-4 border-b border-[#426b80] pb-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 id='tables-heading' className='text-xl font-black'>
            Mapa de mesas
          </h2>
          <p className='mt-1 text-sm text-slate-300'>Selecione uma mesa para ver a comanda e gerenciar pedidos.</p>
        </div>
        <div className='shrink-0'>
          <button
            type='button'
            aria-expanded={showCreateTable}
            aria-controls='new-table-form'
            onClick={() => setShowCreateTable((value) => !value)}
            className='min-h-11 w-full rounded-xl bg-[#ffca28] px-4 text-sm font-bold text-[#102c40] sm:w-auto'
          >
            {showCreateTable ? '✕ Fechar' : '+ Nova mesa'}
          </button>
        </div>
      </div>
      {catalogError && (
        <p role='alert' className='rounded-xl border border-red-400 bg-[#562932] p-3 text-white'>
          {catalogError}{' '}
          <button type='button' onClick={() => void loadCatalog()} className='underline'>
            Tentar novamente
          </button>
        </p>
      )}
      {showCreateTable && (
        <form
          id='new-table-form'
          onSubmit={(event) => void createTable(event)}
          className='flex w-full min-w-0 flex-col gap-3 rounded-xl border border-[#63899a] bg-[#14374d] p-3 sm:flex-row sm:items-end'
        >
          <label className='min-w-0 flex-1 text-sm font-bold'>
            Número da nova mesa
            <input
              type='number'
              min='1'
              step='1'
              required
              autoFocus
              className={field + ' mt-1'}
              value={number}
              onChange={(event) => setNumber(event.target.value)}
            />
          </label>
          <button disabled={busy} type='submit' className={button + ' w-full sm:w-auto'}>
            {busy ? 'Cadastrando...' : 'Cadastrar mesa'}
          </button>
        </form>
      )}
      {error && (
        <p role='alert' className='rounded-xl border border-red-400 bg-[#562932] p-3 text-white'>
          {error}
        </p>
      )}
      {sortedTables.length > 0 && (
        <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
          {sortedTables.map((table) => {
            const appearance = tableAppearance(table.status, readyTables.has(table.id));

            return (
              <button
                key={table.id}
                type='button'
                onClick={() => void openTable(table.id)}
                aria-expanded={selected === table.id}
                aria-haspopup='dialog'
                className={
                  'flex min-h-20 flex-col justify-center gap-1 rounded-xl border px-4 py-3 text-left text-white transition-all duration-200 ' +
                  appearance.color +
                  (selected === table.id ? ' ring-2 ring-[#ffca28] shadow-lg' : ' hover:-translate-y-0.5')
                }
              >
                <span className='flex w-full items-center justify-between gap-1'>
                  <strong className='text-base'>Mesa {table.number}</strong>
                  <span className='text-xs' aria-hidden='true'>
                    ↗
                  </span>
                </span>
                <span className='text-xs font-semibold'>
                  {appearance.label} · {brl(table.totalSpent)}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {tables.length === 0 && (
        <p className='rounded-xl bg-[#193e53] p-5 text-center text-sm text-slate-200'>
          Nenhuma mesa cadastrada. Use “Nova mesa” para começar.
        </p>
      )}
      {selected && (
        <div
          className='fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-3 sm:p-4'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !product && !printTable) closeTable();
          }}
        >
          <section
            role='dialog'
            aria-modal='true'
            aria-label={details ? 'Mesa ' + details.number : 'Detalhes da mesa'}
            className={
              'flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[1500px] flex-col overflow-hidden rounded-2xl border border-[#537d90] bg-[#112e43] shadow-2xl sm:rounded-2xl ' +
              (tableView === 'new'
                ? 'h-[calc(100dvh-1.5rem)] sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)]'
                : 'sm:max-h-[90dvh]')
            }
          >
            <header className='flex shrink-0 items-center justify-between gap-3 border-b border-[#537d90] px-4 py-2 sm:px-5'>
              <div className='min-w-0'>
                <h3 className='text-lg font-black'>{details ? 'Mesa ' + details.number : 'Abrindo mesa...'}</h3>
                {details && (
                  <p className='text-sm text-slate-200'>
                    {details.status === 'FREE' ? 'Livre' : 'Ocupada'} · {brl(details.totalSpent)}
                  </p>
                )}
              </div>
              <button
                type='button'
                onClick={closeTable}
                aria-label='Fechar detalhes da mesa'
                className='grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#63899a] text-xl font-bold'
              >
                ✕
              </button>
            </header>
            <div
              className={
                'min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-5 ' +
                (tableView === 'new' ? 'lg:flex lg:flex-col lg:gap-3 lg:space-y-0 lg:overflow-hidden' : '')
              }
            >
              {!details ? (
                <p>Carregando detalhes...</p>
              ) : (
                <>
                  <div className='grid w-full grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-1.5 rounded-xl bg-[#0b2536] p-1.5 sm:w-fit sm:grid-cols-[auto_auto_auto] lg:shrink-0'>
                    <button
                      type='button'
                      disabled={busy || details.orders.length === 0}
                      onClick={() => setPrintTable(details)}
                      aria-label='Imprimir conta'
                      title='Imprimir conta'
                      className='grid h-10 w-10 place-items-center rounded-lg border border-[#63899a] bg-[#1a4055] text-lg text-white disabled:opacity-40'
                    >
                      <span aria-hidden='true'>🖨</span>
                    </button>
                    {details.status === 'OCCUPIED' ? (
                      <button
                        disabled={busy}
                        type='button'
                        className='min-h-10 whitespace-nowrap rounded-lg bg-[#ffca28] px-2 text-[11px] font-bold text-[#09283b] disabled:opacity-50 sm:text-xs'
                        onClick={() => void release()}
                      >
                        <span className='sm:hidden'>Liberar</span>
                        <span className='hidden sm:inline'>Liberar mesa</span>
                      </button>
                    ) : (
                      <button
                        disabled={busy}
                        type='button'
                        onClick={() => void archiveTable()}
                        className='min-h-10 whitespace-nowrap rounded-lg border border-[#a66c75] bg-[#442b36] px-2 text-[11px] font-bold text-white disabled:opacity-50 sm:text-xs'
                      >
                        <span className='sm:hidden'>Retirar</span>
                        <span className='hidden sm:inline'>Retirar de uso</span>
                      </button>
                    )}
                    <div
                      className='grid min-w-0 grid-cols-2 gap-1.5 sm:w-max sm:grid-cols-[auto_auto]'
                      role='tablist'
                      aria-label={'Visualização da mesa ' + details.number}
                    >
                      <button
                        type='button'
                        role='tab'
                        aria-selected={tableView === 'orders'}
                        onClick={() => setTableView('orders')}
                        className={
                          'min-h-10 min-w-0 rounded-lg px-1 text-[11px] font-black transition sm:px-3 sm:text-xs ' +
                          (tableView === 'orders' ? 'bg-[#ffca28] text-[#09283b]' : 'text-slate-200 hover:bg-[#23485d]')
                        }
                      >
                        <span className='sm:hidden'>Pedidos</span>
                        <span className='hidden sm:inline'>Pedidos ({details.orders.length})</span>
                      </button>
                      <button
                        type='button'
                        role='tab'
                        aria-selected={tableView === 'new'}
                        onClick={() => setTableView('new')}
                        className={
                          'min-h-10 min-w-0 rounded-lg px-1 text-[11px] font-black transition sm:px-3 sm:text-xs ' +
                          (tableView === 'new' ? 'bg-[#ffca28] text-[#09283b]' : 'text-slate-200 hover:bg-[#23485d]')
                        }
                      >
                        Novo pedido
                      </button>
                    </div>
                  </div>
                  {tableView === 'orders' && (
                    <div role='tabpanel' className='space-y-3'>
                      <div className='flex items-center justify-between gap-2'>
                        <h4 className='text-base font-black'>Pedidos já enviados</h4>
                        <span className='text-xs text-slate-300'>Consumo da mesa: {brl(details.totalSpent)}</span>
                      </div>
                      {details.orders.length === 0 && (
                        <p className='rounded-lg bg-[#193e53] px-3 py-2 text-sm text-slate-300'>Nenhum pedido nesta comanda.</p>
                      )}
                      {details.orders.map((order, index) => (
                        <details
                          key={order.id}
                          className={
                            'group rounded-xl border ' +
                            (order.status === 'COMPLETED' ? 'border-[#52dd91] bg-[#164e37]' : 'border-[#466b7f] bg-[#193e53]')
                          }
                        >
                          <summary className='flex cursor-pointer list-none items-center gap-2 p-3 marker:hidden'>
                            <span className='grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#2a5267] text-xs font-black'>
                              {index + 1}
                            </span>
                            <span className='min-w-0 flex-1'>
                              <strong className='block text-sm'>
                                {order.status === 'COMPLETED' ? '✓ Pronto · ' : ''}Pedido #{order.id.slice(0, 8)}
                              </strong>
                              <span className='block truncate text-xs text-slate-200'>
                                {order.items.reduce((sum, item) => sum + item.quantity, 0)} itens ·{' '}
                                {orderStatusLabels[order.status] ?? order.status}
                              </span>
                            </span>
                            <strong className='shrink-0 text-sm text-amber-200'>{brl(order.total)}</strong>
                            <span className='text-xs text-cyan-100 group-open:rotate-180' aria-hidden='true'>
                              ▼
                            </span>
                          </summary>
                          <div className='space-y-2 border-t border-[#466b7f] px-3 py-3'>
                            {order.createdBy && (
                              <div
                                className='mb-2 flex min-w-0 items-center gap-1.5 text-xs text-slate-300'
                                aria-label={'Pedido lançado por ' + order.createdBy.name}
                              >
                                <span
                                  className='grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#31576b] text-[10px] font-bold text-white'
                                  aria-hidden='true'
                                >
                                  {order.createdBy.name.trim().charAt(0).toUpperCase()}
                                </span>
                                <span className='min-w-0 truncate text-slate-100' title={order.createdBy.name}>
                                  {order.createdBy.name}
                                </span>
                                <span className='shrink-0 text-[11px] text-slate-400'>
                                  · {order.createdBy.role === 'ADMIN' ? 'Admin' : 'Funcionário'}
                                </span>
                              </div>
                            )}
                            {order.items.map((item, itemIndex) => (
                              <div key={itemIndex} className='text-sm text-white'>
                                <p className='font-bold'>
                                  {item.quantity}× {item.productName}
                                </p>
                                {item.additions.map((extra, extraIndex) => (
                                  <p key={extraIndex} className='pl-3 text-xs text-slate-200'>
                                    + {extra.quantity}× {extra.additionName}
                                  </p>
                                ))}
                              </div>
                            ))}
                            {order.observation && (
                              <p className='rounded-lg bg-[#433922] p-2 text-xs text-amber-100'>Obs.: {order.observation}</p>
                            )}
                            {['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status) && (
                              <button
                                type='button'
                                disabled={busy}
                                onClick={() => void removeOrder(order.id)}
                                className='min-h-10 rounded-lg border border-red-300 px-3 text-xs font-bold text-red-100 disabled:opacity-40'
                              >
                                Cancelar pedido
                              </button>
                            )}
                          </div>
                        </details>
                      ))}
                    </div>
                  )}
                  {tableView === 'new' && (
                    <div role='tabpanel' className='lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-hidden'>
                      <div className='grid items-start gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_260px] lg:grid-rows-[minmax(0,1fr)] lg:items-stretch'>
                        <aside
                          id='table-cart-summary'
                          ref={cartPanelRef}
                          className='order-table-cart-panel order-2 min-w-0 scroll-mt-3 lg:order-none lg:col-start-2 lg:row-start-1 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain'
                        >
                          <form
                            onSubmit={(event) => void createOrder(event)}
                            className='grid gap-3 rounded-xl border border-[#527b8e] bg-[#193e53] p-3 sm:grid-cols-2 lg:grid-cols-1'
                          >
                            <div className='flex items-center justify-between gap-2 sm:col-span-2 lg:col-span-1'>
                              <h4 className='text-base font-black text-white'>Pedido em montagem</h4>
                              <span className='rounded-md bg-[#ffca28] px-2 py-1 text-xs font-black text-[#102c40]'>
                                {draftCount} itens
                              </span>
                            </div>
                            <div className='space-y-2 sm:col-span-2'>
                              {cart.map((item, index) => (
                                <div key={item.key} className='rounded-lg border border-[#4f7286] bg-[#102c40] p-3'>
                                  <div className='flex items-start justify-between gap-3'>
                                    <div className='min-w-0 flex-1'>
                                      <span className='mb-1 block text-[11px] font-bold text-slate-300'>Item {index + 1}</span>
                                      <strong className='block break-words text-sm leading-snug text-white'>
                                        {item.product.name}
                                      </strong>
                                    </div>
                                    <strong className='shrink-0 text-sm text-amber-200'>
                                      {brl(CartTotal.calculate([item]))}
                                    </strong>
                                  </div>
                                  {item.additions.map((extra) => (
                                    <p key={extra.addition.id} className='text-sm text-slate-200'>
                                      + {extra.quantity}× {extra.addition.name}
                                    </p>
                                  ))}
                                  <div className='mt-3 flex items-center gap-2 border-t border-[#345a70] pt-2'>
                                    <button
                                      type='button'
                                      aria-label='Diminuir quantidade'
                                      onClick={() => changeItemQuantity(item.key, -1)}
                                      className='grid h-9 w-9 place-items-center rounded-lg bg-[#ffca28] font-bold text-[#102c40]'
                                    >
                                      −
                                    </button>
                                    <span className='min-w-6 text-center text-sm font-black'>{item.quantity}</span>
                                    <button
                                      type='button'
                                      aria-label='Aumentar quantidade'
                                      onClick={() => changeItemQuantity(item.key, 1)}
                                      className='grid h-9 w-9 place-items-center rounded-lg bg-[#ffca28] font-bold text-[#102c40]'
                                    >
                                      +
                                    </button>
                                    <button
                                      type='button'
                                      onClick={() => removeItem(item.key)}
                                      className='ml-auto text-xs font-bold text-red-200 underline'
                                    >
                                      Remover
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {cart.length === 0 && <p className='text-sm text-slate-200'>Nenhum produto adicionado.</p>}
                            </div>
                            <label className='text-sm font-bold sm:col-span-2'>
                              Observações
                              <textarea
                                maxLength={500}
                                rows={2}
                                className={field + ' mt-1'}
                                value={observation}
                                onChange={(event) => setObservation(event.target.value)}
                              />
                            </label>
                            <div className='flex items-center justify-between gap-3 rounded-lg border-t border-[#547b8e] pt-3 sm:col-span-2'>
                              <span className='font-black'>Total do pedido</span>
                              <strong className='text-lg text-amber-200'>{brl(CartTotal.calculate(cart))}</strong>
                            </div>
                            <button disabled={busy || cart.length === 0} className={button + ' sm:col-span-2'} type='submit'>
                              {busy ? 'Salvando...' : 'Enviar pedido à mesa ' + details.number}
                            </button>
                          </form>
                        </aside>
                        <div className='order-1 min-w-0 space-y-3 lg:order-none lg:col-start-1 lg:row-start-1 lg:flex lg:min-h-0 lg:flex-col lg:space-y-0 lg:gap-3'>
                          <div className='space-y-2 lg:shrink-0'>
                            <label htmlFor='table-product-search' className='sr-only'>
                              Buscar produtos
                            </label>
                            <input
                              id='table-product-search'
                              className={field + ' text-sm'}
                              placeholder='Buscar pelo nome do produto...'
                              value={search}
                              onChange={(event) => updateSearch(event.target.value)}
                            />
                            <div
                              className='flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain pb-2'
                              role='group'
                              aria-label='Filtrar produtos por categoria'
                            >
                              <button
                                type='button'
                                aria-pressed={category === 'all'}
                                onClick={() => updateCategory('all')}
                                className={
                                  'min-h-10 shrink-0 whitespace-nowrap rounded-lg px-3 text-xs font-bold sm:min-h-9 ' +
                                  (category === 'all'
                                    ? 'bg-[#ffca28] text-[#09283b]'
                                    : 'border border-[#63899a] bg-[#1b4055] text-white')
                                }
                              >
                                Todos
                              </button>
                              {categories.map((item) => (
                                <button
                                  key={item.id}
                                  type='button'
                                  aria-pressed={category === item.id}
                                  onClick={() => updateCategory(item.id)}
                                  className={
                                    'min-h-10 shrink-0 whitespace-nowrap rounded-lg px-3 text-xs font-bold sm:min-h-9 ' +
                                    (category === item.id
                                      ? 'bg-[#ffca28] text-[#09283b]'
                                      : 'border border-[#63899a] bg-[#1b4055] text-white')
                                  }
                                >
                                  {item.name}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div
                            role='region'
                            aria-label='Produtos disponíveis para a mesa'
                            tabIndex={0}
                            className='min-h-[65dvh] max-h-[75dvh] min-w-0 overflow-y-auto overscroll-contain rounded-xl border-2 border-[#ffca28] bg-[#0b2536] p-2 lg:min-h-0 lg:max-h-none lg:flex-1'
                          >
                            <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
                              {visibleProducts.map((item) => (
                                <article
                                  key={item.id}
                                  className='flex min-w-0 items-center gap-2 rounded-xl border border-[#49758b] bg-[#193b50] p-2'
                                >
                                  <div className='grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#26546a]'>
                                    {item.imageUrl ? (
                                      <img src={item.imageUrl} alt='' loading='lazy' className='h-full w-full object-cover' />
                                    ) : (
                                      <span className='text-3xl' aria-hidden='true'>
                                        🥟
                                      </span>
                                    )}
                                  </div>
                                  <div className='min-w-0 flex-1'>
                                    <h5 className='line-clamp-2 text-sm font-extrabold leading-tight text-white'>{item.name}</h5>
                                    <p className='mt-1 text-base font-black text-amber-200'>{brl(item.price)}</p>
                                    {!item.available && <span className='text-xs font-bold text-red-200'>Indisponível</span>}
                                  </div>
                                  <button
                                    type='button'
                                    disabled={!item.available}
                                    aria-label={'Adicionar ' + item.name}
                                    onClick={() => void chooseProduct(item)}
                                    className='grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#ffca28] text-2xl font-black text-[#102c40] disabled:opacity-40 sm:h-10 sm:w-10'
                                  >
                                    +
                                  </button>
                                </article>
                              ))}
                            </div>
                            {filteredProducts.length === 0 && (
                              <p className='p-2 text-sm text-white'>Nenhum produto encontrado.</p>
                            )}
                            {hasMoreProducts && (
                              <button
                                type='button'
                                onClick={loadMoreProducts}
                                className='mt-3 min-h-11 w-full rounded-xl border border-[#ffca28] bg-[#17384b] px-4 py-2 text-sm font-bold text-amber-100'
                              >
                                Carregar mais produtos
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      )}
      {product && (
        <div
          className='fixed inset-0 z-[90] flex items-end justify-center bg-black/80 sm:items-center sm:p-4'
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setProduct(null);
          }}
        >
          <section
            role='dialog'
            aria-modal='true'
            aria-label={'Personalizar ' + product.name}
            className='product-customizer-modal flex max-h-[93dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-[#608ba0] bg-[#102c40] text-white shadow-2xl sm:rounded-3xl'
          >
            <header className='flex shrink-0 items-start justify-between gap-3 border-b border-[#41687c] p-5'>
              <div>
                <p className='text-xs font-black tracking-wider text-[#8be9fb]'>MONTE DO SEU JEITO · MESA {details?.number}</p>
                <h3 className='mt-2 text-2xl font-black text-white'>{product.name}</h3>
                <p className='mt-2 text-sm text-[#d4e8f2]'>{product.description}</p>
              </div>
              <button
                type='button'
                aria-label='Fechar'
                onClick={() => setProduct(null)}
                className='grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#28546b] text-white'
              >
                ✕
              </button>
            </header>
            <div className='min-h-0 flex-1 space-y-3 overflow-y-auto p-5'>
              <h4 className='font-black text-white'>Adicionais</h4>
              {additionsBusy ? (
                <p>Carregando adicionais...</p>
              ) : availableAdditions.length === 0 ? (
                <p className='rounded-xl bg-[#20475d] p-3 text-white'>Sem adicionais para este produto.</p>
              ) : (
                availableAdditions.map((item) => (
                  <div key={item.id} className='flex items-center justify-between gap-3 border-b border-[#48758b] py-3'>
                    <div>
                      <strong className='text-white'>{item.name}</strong>
                      <p className='text-sm text-[#c8e7f4]'>+ {brl(item.price)}</p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <button
                        type='button'
                        aria-label={'Remover ' + item.name}
                        onClick={() => changeAdditionAmount(item.id, -1)}
                        className='grid h-11 w-11 place-items-center rounded-xl bg-[#ffdc86] text-lg font-bold text-[#102b40]'
                      >
                        −
                      </button>
                      <span className='w-6 text-center font-bold text-white'>{amounts[item.id] || 0}</span>
                      <button
                        type='button'
                        aria-label={'Adicionar ' + item.name}
                        onClick={() => changeAdditionAmount(item.id, 1)}
                        className='grid h-11 w-11 place-items-center rounded-xl bg-[#ffdc86] text-lg font-bold text-[#102b40]'
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
              <div className='flex items-center justify-between gap-3 pt-3'>
                <strong className='text-white'>Quantidade</strong>
                <div className='flex items-center gap-3'>
                  <button
                    type='button'
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    className='grid h-11 w-11 place-items-center rounded-xl bg-[#ffdc86] font-bold text-[#102b40]'
                  >
                    −
                  </button>
                  <strong className='text-white'>{quantity}</strong>
                  <button
                    type='button'
                    onClick={() => setQuantity((value) => value + 1)}
                    className='grid h-11 w-11 place-items-center rounded-xl bg-[#ffdc86] font-bold text-[#102b40]'
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <footer className='shrink-0 border-t border-[#41687c] bg-[#102c40] p-5'>
              <button
                type='button'
                disabled={additionsBusy}
                onClick={addProduct}
                className='min-h-12 w-full rounded-xl bg-[#ffca28] p-3 font-black text-[#102b40]'
              >
                Adicionar · {brl(customProductPrice)}
              </button>
            </footer>
          </section>
        </div>
      )}
      {printTable && <TableReceipt table={printTable} onClose={() => setPrintTable(null)} />}
      {dialog}
    </section>
  );
}
