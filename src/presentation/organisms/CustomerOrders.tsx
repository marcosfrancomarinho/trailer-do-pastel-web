import { useEffect, useState } from 'react'
import type { SavedCustomerOrder } from '../../domain/models'
import { brl } from '../../api'
import { useActionDialog } from '../molecules/ActionDialog'

type Props = {
  orders: SavedCustomerOrder[]
  statuses: Record<string, string>
  onRemove: (token: string) => void
  onRefresh: (token: string) => void
}

const labels: Record<string, string> = {
  PENDING: 'Aguardando confirmação',
  CONFIRMED: 'Pedido aceito',
  PREPARING: 'Em preparo',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
}

function CustomerOrderDetails({
  order,
  status,
  onClose,
  onRemove,
}: {
  order: SavedCustomerOrder
  status: string
  onClose: () => void
  onRemove: () => void
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const details = order.details

  return (
    <div
      className="customer-dialog-backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-order-title"
        className="customer-dialog"
      >
        <header className="customer-dialog-heading">
          <div>
            <span className="customer-caption">Detalhes do pedido</span>
            <h2 id="customer-order-title">#{order.id.slice(0, 8)}</h2>
          </div>
          <button type="button" autoFocus onClick={onClose} aria-label="Fechar detalhes" className="customer-close">✕</button>
        </header>

        <div className="customer-detail-status">
          <span>Situação atual</span>
          <strong>{labels[status] ?? status}</strong>
        </div>
        <div className="customer-pickup-notice customer-pickup-detail" role="note">
          <strong>📍 Retirada no Trailer do Pastel</strong>
          <p>{status === 'COMPLETED'
            ? 'Seu pedido está concluído. Dirija-se ao Trailer do Pastel para retirá-lo.'
            : status === 'CANCELED'
              ? 'Este pedido foi cancelado e não está disponível para retirada.'
              : 'Não fazemos entrega. Aguarde a conclusão do pedido antes de ir ao local para retirá-lo.'}</p>
        </div>

        {details ? (
          <>
            <div className="customer-details-section">
              <p className="customer-caption">Cliente</p>
              <strong>{details.customerName}</strong>
              <p>{details.customerPhone}</p>
              <p>Feito em {new Date(details.createdAt).toLocaleString('pt-BR')}</p>
            </div>
            <div className="customer-details-section">
              <h3>Itens do pedido</h3>
              {details.items.map((item, index) => (
                <div key={index} className="customer-detail-item">
                  <div className="customer-detail-line">
                    <strong>{item.quantity}× {item.productName}</strong>
                    <span>{brl(Number(item.unitPrice) * item.quantity)}</span>
                  </div>
                  {item.additions.map((extra, extraIndex) => (
                    <div key={extraIndex} className="customer-detail-line customer-detail-extra">
                      <span>+ {extra.quantity}× {extra.additionName}</span>
                      <span>{brl(Number(extra.unitPrice) * extra.quantity * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="customer-legacy-note">
            Este pedido foi salvo antes do novo histórico detalhado.
            O status e o total continuam disponíveis.
          </p>
        )}

        <div className="customer-detail-total">
          <span>Total</span>
          <strong>{brl(order.total)}</strong>
        </div>
        <details className="customer-tracking-code">
          <summary>Código de acompanhamento</summary>
          <code>{order.trackingToken}</code>
        </details>
        <button type="button" className="customer-remove-button" onClick={onRemove}>
          Excluir deste dispositivo
        </button>
        <p className="customer-delete-hint">Isso não cancela o pedido na pastelaria.</p>
      </section>
    </div>
  )
}

export default function CustomerOrders({ orders, statuses, onRemove, onRefresh }: Props) {
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const { confirm, notify, dialog } = useActionDialog()
  const selected = orders.find(order => order.trackingToken === selectedToken)

  async function remove(order: SavedCustomerOrder) {
    const approved = await confirm({
      title: 'Excluir pedido salvo?',
      message: 'Este pedido será removido somente deste dispositivo. Ele continuará registrado na pastelaria.',
      confirmLabel: 'Excluir do dispositivo',
    })
    if (!approved) return
    onRemove(order.trackingToken)
    setSelectedToken(null)
    notify({ title: 'Pedido removido', message: 'O pedido foi removido deste dispositivo.', tone: 'success' })
  }

  return (
    <main className="customer-orders-page mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <p className="customer-eyebrow">ACOMPANHAMENTO</p>
      <h1>Meus pedidos</h1>
      <p className="customer-orders-subtitle">O status é consultado automaticamente a cada 5 segundos.</p>
      

      {orders.length === 0 ? (
        <div className="customer-empty">Nenhum pedido salvo neste dispositivo.</div>
      ) : (
        <div className="customer-orders-grid">
          {orders.map(order => {
            const status = statuses[order.trackingToken] ?? order.status
            const quantity = order.details?.items.reduce((sum, item) => sum + item.quantity, 0)
            return (
              <article key={order.trackingToken} className="customer-order-card">
                <button
                  type="button"
                  onClick={() => setSelectedToken(order.trackingToken)}
                  className="customer-card-open"
                  aria-label={'Abrir detalhes do pedido ' + order.id.slice(0, 8)}
                >
                  <div className="customer-card-top">
                    <span className="customer-order-number">Pedido #{order.id.slice(0, 8)}</span>
                    <span className="customer-card-chevron" aria-hidden="true">›</span>
                  </div>
                  <span className="customer-order-status">{labels[status] ?? status}</span>
                  <div className="customer-card-bottom">
                    <strong>{brl(order.total)}</strong>
                    <span>{quantity === undefined ? 'Ver detalhes' : quantity + (quantity === 1 ? ' item' : ' itens')}</span>
                  </div>
                </button>
                <div className="customer-card-footer">
                  <button type="button" onClick={() => onRefresh(order.trackingToken)}>Atualizar status</button>
                  <button type="button" onClick={() => { void remove(order) }}>Excluir</button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {selected && (
        <CustomerOrderDetails
          order={selected}
          status={statuses[selected.trackingToken] ?? selected.status}
          onClose={() => setSelectedToken(null)}
          onRemove={() => { void remove(selected) }}
        />
      )}
      {dialog}
    </main>
  )
}
