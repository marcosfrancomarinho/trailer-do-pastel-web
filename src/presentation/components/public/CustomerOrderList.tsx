import { useEffect, useState } from 'react';
import type { SavedCustomerOrder } from '../../../application/dtos/orders';
import { brl } from '../../../shared/formatters/currency';
import { useActionDialog } from '../shared/ActionDialog';

type Props = {
  orders: SavedCustomerOrder[];
  statuses: Record<string, string>;
  onRemove: (token: string) => void;
  notificationPermission: NotificationPermission | 'unsupported';
  pushError: string;
  justOrdered: boolean;
  onEnableNotifications: () => Promise<void>;
};

const labels: Record<string, string> = {
  PENDING: 'Aguardando confirmação',
  CONFIRMED: 'Pedido aceito',
  PREPARING: 'Em preparo',
  COMPLETED: 'Pronto para retirada',
  CANCELED: 'Cancelado',
};

const statusClasses: Record<
  string,
  {
    dialog: string;
    details: string;
    card: string;
    badge: string;
  }
> = {
  COMPLETED: {
    dialog: 'customer-dialog-ready',
    details: 'customer-detail-ready',
    card: 'customer-order-ready',
    badge: 'customer-status-ready',
  },
  CANCELED: {
    dialog: 'customer-dialog-canceled',
    details: 'customer-detail-canceled',
    card: 'customer-order-canceled',
    badge: 'customer-status-canceled',
  },
  PREPARING: {
    dialog: 'customer-dialog-preparing',
    details: 'customer-detail-preparing',
    card: 'customer-order-preparing',
    badge: 'customer-status-preparing',
  },
};

function CustomerOrderDetails({
  order,
  status,
  onClose,
  onRemove,
}: {
  order: SavedCustomerOrder;
  status: string;
  onClose: () => void;
  onRemove: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const details = order.details;

  return (
    <div
      className='customer-dialog-backdrop'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role='dialog'
        aria-modal='true'
        aria-labelledby='customer-order-title'
        className={'customer-dialog ' + (statusClasses[status]?.dialog ?? '')}
      >
        <header className='customer-dialog-heading'>
          <div>
            <span className='customer-caption'>Detalhes do pedido</span>
            <h2 id='customer-order-title'>#{order.id.slice(0, 8)}</h2>
          </div>
          <button type='button' autoFocus onClick={onClose} aria-label='Fechar detalhes' className='customer-close'>
            ✕
          </button>
        </header>

        <div className={'customer-detail-status ' + (statusClasses[status]?.details ?? '')}>
          <span>Situação atual</span>
          <strong>{labels[status] ?? status}</strong>
        </div>
        <div className='customer-pickup-notice customer-pickup-detail' role='note'>
          <strong>📍 Retirada no Trailer do Pastel</strong>
          <p>
            {status === 'COMPLETED'
              ? 'Seu pedido está concluído. Dirija-se ao Trailer do Pastel para retirá-lo.'
              : status === 'CANCELED'
                ? 'Este pedido foi cancelado e não está disponível para retirada.'
                : 'Não fazemos entrega. Aguarde a conclusão do pedido antes de ir ao local para retirá-lo.'}
          </p>
        </div>

        {details ? (
          <>
            <div className='customer-details-section'>
              <p className='customer-caption'>Cliente</p>
              <strong>{details.customerName}</strong>
              <p>{details.customerPhone}</p>
              <p>Feito em {new Date(details.createdAt).toLocaleString('pt-BR')}</p>
              {details.observation && (
                <p className='mt-2 rounded-lg bg-[#254960] p-3 text-sm font-semibold text-white'>
                  Observação: {details.observation}
                </p>
              )}
            </div>
            <div className='customer-details-section'>
              <h3>Itens do pedido</h3>
              {details.items.map((item, index) => (
                <div key={index} className='customer-detail-item'>
                  <div className='customer-detail-line'>
                    <strong>
                      {item.quantity}× {item.productName}
                    </strong>
                    <span>{brl(Number(item.unitPrice) * item.quantity)}</span>
                  </div>
                  {item.additions.map((extra, extraIndex) => (
                    <div key={extraIndex} className='customer-detail-line customer-detail-extra'>
                      <span>
                        + {extra.quantity}× {extra.additionName}
                      </span>
                      <span>{brl(Number(extra.unitPrice) * extra.quantity * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className='customer-legacy-note'>
            Este pedido foi salvo antes do novo histórico detalhado. O status e o total continuam disponíveis.
          </p>
        )}

        <div className='customer-detail-total'>
          <span>Total</span>
          <strong>{brl(order.total)}</strong>
        </div>
        <details className='customer-tracking-code'>
          <summary>Código de acompanhamento</summary>
          <code>{order.trackingToken}</code>
        </details>
        <button type='button' className='customer-remove-button' onClick={onRemove}>
          Excluir deste dispositivo
        </button>
        <p className='customer-delete-hint'>Isso não cancela o pedido na pastelaria.</p>
      </section>
    </div>
  );
}

export default function CustomerOrderList({ orders, statuses, onRemove, notificationPermission, onEnableNotifications, pushError, justOrdered }: Props) {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const { confirm, notify, dialog } = useActionDialog();
  const selected = orders.find((order) => order.trackingToken === selectedToken);

  async function remove(order: SavedCustomerOrder) {
    const approved = await confirm({
      title: 'Excluir pedido salvo?',
      message: 'Este pedido será removido somente deste dispositivo. Ele continuará registrado na pastelaria.',
      confirmLabel: 'Excluir do dispositivo',
    });
    if (!approved) return;
    onRemove(order.trackingToken);
    setSelectedToken(null);
    notify({ title: 'Pedido removido', message: 'O pedido foi removido deste dispositivo.', tone: 'success' });
  }

  return (
    <main className='customer-orders-page mx-auto max-w-3xl px-4 py-8 sm:py-12'>
      <p className='customer-eyebrow'>ACOMPANHAMENTO</p>
      <h1>Meus pedidos</h1>
      <p className='customer-orders-subtitle'>O status é atualizado automaticamente quando o pedido muda.</p>
      {orders.some((order) => !['COMPLETED', 'CANCELED'].includes(statuses[order.trackingToken] ?? order.status)) &&
        notificationPermission !== 'unsupported' && (
        <div role='status' className='mb-5 rounded-2xl border border-[#e6b848] bg-[#183e4a] p-4 text-white shadow-sm sm:p-5'>
          <div className='flex items-start gap-3'>
            <span aria-hidden='true' className='text-2xl'>🔔</span>
            <div className='min-w-0 flex-1'>
              <strong className='block text-base font-black'>
                {notificationPermission === 'granted' && !pushError
                  ? 'Notificações autorizadas'
                  : notificationPermission === 'denied'
                    ? 'Notificações bloqueadas'
                    : 'Receba um aviso quando seu pedido ficar pronto'}
              </strong>
              <p className='mt-1 text-sm text-slate-100'>
                {notificationPermission === 'denied'
                  ? 'Permita notificações nas configurações do site para receber avisos.'
                  : notificationPermission === 'granted' && !pushError
                    ? 'Seu navegador está autorizado a receber notificações de pedidos.'
                    : justOrdered
                      ? 'Pedido enviado! Ative os avisos para saber quando pode retirar, mesmo depois de fechar a página.'
                      : 'Ative os avisos de pedido pronto, mesmo quando a página estiver fechada.'}
              </p>
            </div>
          </div>
          {(notificationPermission === 'default' || (notificationPermission === 'granted' && pushError)) && (
            <button type='button' onClick={() => void onEnableNotifications()}
              className='mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#ffca28] px-4 py-3 text-base font-black text-[#102b40] hover:bg-[#ffdb66] sm:w-auto'>
              {notificationPermission === 'granted' ? 'Tentar ativar novamente' : '🔔 Ativar notificações'}
            </button>
          )}
          {pushError && <p role='alert' className='mt-3 text-sm text-rose-200'>{pushError}</p>}
        </div>
      )}

      {orders.length === 0 ? (
        <div className='customer-empty'>Nenhum pedido salvo neste dispositivo.</div>
      ) : (
        <div className='customer-orders-grid'>
          {orders.map((order) => {
            const status = statuses[order.trackingToken] ?? order.status;
            const quantity = order.details?.items.reduce((sum, item) => sum + item.quantity, 0);
            return (
              <article key={order.trackingToken} className={'customer-order-card ' + (statusClasses[status]?.card ?? '')}>
                <button
                  type='button'
                  onClick={() => setSelectedToken(order.trackingToken)}
                  className='customer-card-open'
                  aria-label={'Abrir detalhes do pedido ' + order.id.slice(0, 8)}
                >
                  <div className='customer-card-top'>
                    <span className='customer-order-number'>Pedido #{order.id.slice(0, 8)}</span>
                    <span className='customer-card-chevron' aria-hidden='true'>
                      ›
                    </span>
                  </div>
                  <span className={'customer-order-status ' + (statusClasses[status]?.badge ?? '')}>
                    {status === 'COMPLETED'
                      ? '✓ Pronto para retirada'
                      : status === 'CANCELED'
                        ? '✕ Pedido cancelado'
                        : (labels[status] ?? status)}
                  </span>
                  {status === 'COMPLETED' && (
                    <span className='customer-ready-hint'>Seu pedido está pronto! Vá ao Trailer do Pastel retirar.</span>
                  )}
                  {status === 'CANCELED' && (
                    <span className='customer-canceled-hint'>
                      Este pedido foi cancelado e não estará disponível para retirada.
                    </span>
                  )}
                  <div className='customer-card-bottom'>
                    <strong>{brl(order.total)}</strong>
                    <span>{quantity === undefined ? 'Ver detalhes' : quantity + (quantity === 1 ? ' item' : ' itens')}</span>
                  </div>
                </button>
                <div className='customer-card-footer'>
                  <button
                    type='button'
                    onClick={() => {
                      void remove(order);
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selected && (
        <CustomerOrderDetails
          order={selected}
          status={statuses[selected.trackingToken] ?? selected.status}
          onClose={() => setSelectedToken(null)}
          onRemove={() => {
            void remove(selected);
          }}
        />
      )}
      {dialog}
    </main>
  );
}
