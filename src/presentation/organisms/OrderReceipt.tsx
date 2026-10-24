import { useEffect, useState } from 'react'
import type { PendingOrder, PreparingOrder, OrderHistoryItem } from '../../domain/models'
import { brl } from '../../api'
import { restaurantAdapter } from '../../infrastructure/http/restaurant-adapter'

type Order = PendingOrder | PreparingOrder | OrderHistoryItem

/** Comanda simples para impressão térmica pelo diálogo do navegador. */
export default function OrderReceipt({ order, token, onClose }: { order: Order; token: string; onClose: () => void }) {
  const [comandaId, setComandaId] = useState<string | null>(null)
  const [loadingComanda, setLoadingComanda] = useState(Boolean(order.tableId))
  const [paperWidth, setPaperWidth] = useState<'58' | '80'>('80')

  useEffect(() => {
    if (!order.tableId) return
    let active = true
    void restaurantAdapter.tableSessions(token, order.tableId).then(result => {
      if (active) setComandaId(result.sessions.find(session => session.orders.some(item => item.id === order.id))?.id ?? null)
    }).catch(() => {
      if (active) setComandaId(null)
    }).finally(() => {
      if (active) setLoadingComanda(false)
    })
    return () => { active = false }
  }, [order.id, order.tableId, token])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="receipt-preview-overlay" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section role="dialog" aria-modal="true" aria-label="Imprimir comanda" className="receipt-preview-dialog">
        <header className="receipt-preview-toolbar">
          <h2>Imprimir pedido</h2>
          <button type="button" onClick={onClose} aria-label="Fechar prévia">✕</button>
        </header>
        <div className="receipt-preview-options">
          <span>Largura da bobina</span>
          <div role="group" aria-label="Largura do papel">
            <button type="button" aria-pressed={paperWidth === '58'} onClick={() => setPaperWidth('58')}>58 mm</button>
            <button type="button" aria-pressed={paperWidth === '80'} onClick={() => setPaperWidth('80')}>80 mm</button>
          </div>
        </div>
        <div className="receipt-preview-scroll">
          <article className={'receipt-print receipt-width-' + paperWidth} aria-label="Comanda do pedido">
            <header className="receipt-center">
              <h3>TRAILER DO PASTEL</h3>
              {order.tableId != null ? (
                <>
                  <strong>COMANDA DA MESA {order.tableNumber ?? ''}</strong>
                  <p className="break-all"><strong>ID DA COMANDA:</strong> {loadingComanda ? 'CARREGANDO...' : comandaId ?? 'NÃO DISPONÍVEL'}</p>
                  <p>ID DO PEDIDO: {order.id.slice(0, 8).toUpperCase()}</p>
                </>
              ) : <strong>PEDIDO #{order.id.slice(0, 8)}</strong>}
              <p>{new Date(order.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' })}</p>
            </header>
            <div className="receipt-separator" />
            <p><strong>CLIENTE:</strong> {order.customerName}</p>
            <p><strong>TELEFONE:</strong> {order.customerPhone}</p>
            {order.tableNumber != null && <p><strong>MESA: {order.tableNumber}</strong></p>}
            {order.observation && <p><strong>OBSERVAÇÃO:</strong> {order.observation}</p>}
            <div className="receipt-separator" />
            <h4>ITENS</h4>
            {order.items.map((item, index) => (
              <div className="receipt-item" key={index}>
                <div className="receipt-line">
                  <strong>{item.quantity}x {item.productName}</strong>
                  <span>{brl(Number(item.unitPrice) * item.quantity)}</span>
                </div>
                {item.additions.map((extra, extraIndex) => (
                  <div className="receipt-line receipt-extra" key={extraIndex}>
                    <span>+ {extra.quantity}x {extra.additionName}</span>
                    <span>{brl(Number(extra.unitPrice) * extra.quantity * item.quantity)}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="receipt-separator" />
            <div className="receipt-line receipt-total"><strong>TOTAL</strong><strong>{brl(order.total)}</strong></div>
            <div className="receipt-separator" />
            <p className="receipt-center">Pedido para retirada</p>
            <p className="receipt-center">Obrigado pela preferência!</p>
          </article>
        </div>
        <footer className="receipt-preview-actions">
          <button type="button" onClick={onClose}>Voltar</button>
          <button type="button" disabled={loadingComanda} onClick={() => window.print()}>{loadingComanda ? 'Carregando comanda...' : 'Imprimir'}</button>
        </footer>
      </section>
    </div>
  )
}
