import { brl } from '../../shared/formatters/currency';
import type { ClosedComanda } from '../../application/dtos/tables';

export class PrintComandaReport {
  private static escapeHtml(value: unknown): string {
    return String(value ?? '').replace(
      /[&<>"']/g,
      (char) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[char] ?? char,
    );
  }

  private static dateTime(value: string): string {
    return new Date(value).toLocaleString('pt-BR', {
      timeZone: 'America/Fortaleza',
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  public static execute(comandas: ClosedComanda[], date: string): void {
    const finished = comandas
      .map(({ tableNumber, origin, session }) => ({
        tableNumber,
        origin,
        session,
        orders: session.orders.filter((order) => order.status === 'COMPLETED'),
      }))
      .filter((entry) => entry.orders.length > 0);
    const orderCount = finished.reduce((sum, entry) => sum + entry.orders.length, 0);
    const total = finished.reduce(
      (sum, entry) => sum + entry.orders.reduce((subtotal, order) => subtotal + Number(order.total), 0),
      0,
    );

    const rows = finished
      .map(({ tableNumber, origin, session, orders }) => {
        const subtotal = orders.reduce((sum, order) => sum + Number(order.total), 0);
        const orderHtml = orders
          .map(
            (order) => `
        <div class="order">
          <div class="line"><strong>Pedido #${this.escapeHtml(order.id.slice(0, 8).toUpperCase())}</strong><strong>${this.escapeHtml(brl(order.total))}</strong></div>
          ${origin === 'ONLINE' || tableNumber == null ? `<p class="customer"><strong>Cliente:</strong> ${this.escapeHtml(order.customerName)}</p>` : ''}
          ${order.items
            .map(
              (item) => `
            <p>${this.escapeHtml(item.quantity)}× ${this.escapeHtml(item.productName)}</p>
            ${item.additions.map((addition) => `<p class="addition">+ ${this.escapeHtml(addition.quantity)}× ${this.escapeHtml(addition.additionName)}</p>`).join('')}
          `,
            )
            .join('')}
          ${order.observation ? `<p>Obs.: ${this.escapeHtml(order.observation)}</p>` : ''}
        </div>
      `,
          )
          .join('');
        return `
        <section class="comanda">
          <header class="line comanda-header">
            <strong>${origin === 'ONLINE' || tableNumber == null ? 'Pedido online' : `Mesa ${this.escapeHtml(tableNumber)}`} · Comanda ${this.escapeHtml(session.id.slice(0, 8).toUpperCase())}</strong>
            <span>Finalizado: ${session.closedAt ? this.escapeHtml(this.dateTime(session.closedAt)) : '—'}</span>
          </header>
          ${orderHtml}
          <p class="subtotal">Subtotal realizado da comanda: ${this.escapeHtml(brl(subtotal))}</p>
        </section>
      `;
      })
      .join('');

    const html = `<!doctype html>
  <html lang="pt-BR">
  <head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Relatório de realizados - ${this.escapeHtml(date)}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; color: #111; font: 11pt/1.4 Arial, sans-serif; }
    main { max-width: 190mm; margin: auto; padding: 10px 0; }
    .report-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 12px; }
    h1 { font-size: 18pt; margin: 0; }
    h2 { font-size: 12pt; margin: 5px 0; }
    .report-header p, .summary p { margin: 3px 0; }
    .summary { border-bottom: 1px solid #777; margin-bottom: 14px; padding-bottom: 10px; }
    .summary strong { display: block; font-size: 13pt; margin-top: 6px; }
    .comanda { border: 1px solid #999; margin-bottom: 12px; padding: 10px; break-inside: avoid; page-break-inside: avoid; }
    .line { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
    .comanda-header { border-bottom: 1px solid #aaa; padding-bottom: 6px; flex-wrap: wrap; }
    .comanda-header span { font-size: 9pt; }
    .order { padding: 7px 0; border-bottom: 1px dashed #bbb; }
    .order p { margin: 2px 0; overflow-wrap: anywhere; }
    .addition { padding-left: 15px; font-size: 9pt; }
    .customer { margin: 4px 0; overflow-wrap: anywhere; }
    .subtotal { text-align: right; font-weight: bold; margin: 8px 0 0; }
    footer { font-size: 9pt; text-align: center; margin-top: 18px; }
    @media print { main { padding: 0; } }
  </style>
  </head>
  <body>
  <main>
    <header class="report-header">
      <h1>TRAILER DO PASTEL</h1>
      <h2>RELATÓRIO DE PEDIDOS REALIZADOS</h2>
      <p>Data de finalização: ${this.escapeHtml(date.split('-').reverse().join('/'))}</p>
      <p>Emitido em: ${this.escapeHtml(this.dateTime(new Date().toISOString()))}</p>
    </header>
    <section class="summary">
      <p>Comandas com pedidos realizados: ${finished.length}</p>
      <p>Pedidos realizados: ${orderCount}</p>
      <strong>Total realizado: ${this.escapeHtml(brl(total))}</strong>
    </section>
    ${rows}
    <footer>Somente pedidos concluídos. Pedidos cancelados não integram este relatório.</footer>
  </main>
  </body>
  </html>`;

    // O iframe precisa ter dimensões reais para o motor de impressão paginar o HTML.
    // Definir srcdoc antes de inseri-lo evita imprimir o about:blank inicial.
    const iframe = document.createElement('iframe');
    iframe.title = 'Relatório para impressão';
    iframe.setAttribute('aria-hidden', 'true');
    Object.assign(iframe.style, {
      position: 'fixed',
      left: '-10000px',
      top: '0',
      width: '794px',
      height: '1123px',
      border: '0',
      opacity: '0',
      pointerEvents: 'none',
    });

    let started = false;
    let cleanupTimer: ReturnType<typeof setTimeout> | undefined;
    const cleanup = () => {
      if (cleanupTimer) clearTimeout(cleanupTimer);
      iframe.remove();
    };

    iframe.onload = async () => {
      const printWindow = iframe.contentWindow;
      const doc = iframe.contentDocument;
      // Ignora o carregamento inicial de about:blank e documentos sem o relatório.
      if (started || !printWindow || !doc?.querySelector('.report-header')) return;
      started = true;
      try {
        await doc.fonts?.ready;
        // Espera duas etapas de renderização para o layout estar pronto no Chrome.
        await new Promise<void>((resolve) =>
          printWindow.requestAnimationFrame(() => printWindow.requestAnimationFrame(() => resolve())),
        );
        printWindow.addEventListener('afterprint', () => setTimeout(cleanup, 1000), { once: true });
        cleanupTimer = setTimeout(cleanup, 120_000);
        printWindow.focus();
        printWindow.print();
      } catch {
        cleanup();
        window.alert('Não foi possível imprimir o relatório. Tente novamente.');
      }
    };

    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  }
}
