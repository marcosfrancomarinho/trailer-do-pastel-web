import { useEffect, useState } from 'react';
import { brl } from '../../../shared/formatters/currency';
import type { TableOrders } from '../../../application/dtos/tables';

/** Conta da sessão atual, sem encerrar a mesa nem alterar os pedidos. */
export default function TableReceipt({ table, onClose }: { table: TableOrders; onClose: () => void }) {
  const [paperWidth, setPaperWidth] = useState<'58' | '80'>('80');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className='receipt-preview-overlay'
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        role='dialog'
        aria-modal='true'
        aria-label={'Imprimir conta da mesa ' + table.number}
        className='receipt-preview-dialog'
      >
        <header className='receipt-preview-toolbar'>
          <h2>Conta da mesa {table.number}</h2>
          <button type='button' aria-label='Fechar prévia' onClick={onClose}>
            ✕
          </button>
        </header>
        <div className='receipt-preview-options'>
          <span>Largura da bobina</span>
          <div role='group' aria-label='Largura do papel'>
            <button type='button' aria-pressed={paperWidth === '58'} onClick={() => setPaperWidth('58')}>
              58 mm
            </button>
            <button type='button' aria-pressed={paperWidth === '80'} onClick={() => setPaperWidth('80')}>
              80 mm
            </button>
          </div>
        </div>
        <div className='receipt-preview-scroll'>
          <article className={'receipt-print receipt-width-' + paperWidth} aria-label={'Conta da mesa ' + table.number}>
            <header className='receipt-center'>
              <h3>TRAILER DO PASTEL</h3>
              <strong>CONTA DA MESA {table.number}</strong>
              <p className='break-all'>
                <strong>ID DA COMANDA:</strong> {table.sessionId?.slice(0, 8).toUpperCase() ?? 'SEM COMANDA ABERTA'}
              </p>
              <p>{new Date().toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' })}</p>
            </header>
            <div className='receipt-separator' />
            {table.orders.length === 0 && <p>Nenhum pedido nesta comanda.</p>}
            {table.orders.map((order, index) => (
              <div key={order.id} className='receipt-item'>
                <h4>
                  PEDIDO {index + 1} · #{order.id.slice(0, 8)}
                </h4>
                {order.items.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    <div className='receipt-line'>
                      <strong>
                        {item.quantity}x {item.productName}
                      </strong>
                      <span>{brl(item.quantity * Number(item.unitPrice))}</span>
                    </div>
                    {item.additions.map((addition, additionIndex) => (
                      <div key={additionIndex} className='receipt-line receipt-extra'>
                        <span>
                          + {addition.quantity}x {addition.additionName}
                        </span>
                        <span>{brl(item.quantity * addition.quantity * Number(addition.unitPrice))}</span>
                      </div>
                    ))}
                  </div>
                ))}
                {order.observation && (
                  <p>
                    <strong>Obs.:</strong> {order.observation}
                  </p>
                )}
                <div className='receipt-line'>
                  <strong>Subtotal</strong>
                  <strong>{brl(order.total)}</strong>
                </div>
                <div className='receipt-separator' />
              </div>
            ))}
            <div className='receipt-line receipt-total'>
              <strong>TOTAL DA MESA</strong>
              <strong>{brl(table.totalSpent)}</strong>
            </div>
            <div className='receipt-separator' />
            <p className='receipt-center'>Conta para conferência</p>
            <p className='receipt-center'>Obrigado pela preferência!</p>
          </article>
        </div>
        <footer className='receipt-preview-actions'>
          <button type='button' onClick={onClose}>
            Voltar
          </button>
          <button type='button' onClick={() => window.print()}>
            Imprimir conta
          </button>
        </footer>
      </section>
    </div>
  );
}
