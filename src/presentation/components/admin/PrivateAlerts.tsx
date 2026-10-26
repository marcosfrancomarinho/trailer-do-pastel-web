import { usePrivateContext } from '../../hooks/global/usePrivateContext';

type Props = {
  showNewPending?: boolean;
  onSeeOrders: () => void;
};

export default function PrivateAlerts({ showNewPending = true, onSeeOrders }: Props) {
  const {
    alerts: { notificationsOn, cancelAlerts, newPendingCount, acknowledgeCancellation, dismissNew },
  } = usePrivateContext();
  if (!notificationsOn) return null;

  return (
    <>
      {cancelAlerts.length > 0 && (
        <section role='alert' aria-label='Pedidos de mesa cancelados' className='mt-4 space-y-3'>
          {cancelAlerts.map((order) => (
            <div
              key={order.id}
              className='flex flex-wrap items-start justify-between gap-3 rounded-xl border-2 border-red-400 bg-[#50232d] p-4 text-white shadow-lg'
            >
              <div className='min-w-0 space-y-1'>
                <strong className='block text-lg'>🚨 Pedido de mesa cancelado!</strong>
                <p className='font-bold'>
                  Mesa {order.tableNumber} · #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <p className='text-sm text-red-100'>Interrompa o preparo deste pedido.</p>
                <p className='break-words text-sm text-red-100'>
                  {order.items.map((item) => item.quantity + '× ' + item.productName).join(', ')}
                </p>
              </div>
              <button
                type='button'
                onClick={() => acknowledgeCancellation(order.id)}
                className='min-h-11 rounded-lg bg-white px-5 py-2 font-black text-[#50232d]'
              >
                Ciente
              </button>
            </div>
          ))}
        </section>
      )}
      {showNewPending && newPendingCount > 0 && (
        <div
          role='alert'
          className='mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-[#fcd34d] bg-[#57431f] p-4 text-[#fef3c7] shadow-lg'
        >
          <div>
            <strong className='block text-lg'>
              🔔 {newPendingCount} {newPendingCount === 1 ? 'novo pedido recebido!' : 'novos pedidos recebidos!'}
            </strong>
            <span className='text-sm'>Há pedidos aguardando confirmação.</span>
          </div>
          <div className='flex flex-wrap gap-2'>
            <button
              type='button'
              onClick={onSeeOrders}
              className='min-h-11 rounded-lg bg-[#ffca28] px-4 py-2 font-black text-[#102c40]'
            >
              Ver pedidos
            </button>
            <button
              type='button'
              onClick={dismissNew}
              className='min-h-11 rounded-lg border border-[#fcd34d] px-3 py-2 font-bold'
            >
              Dispensar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
