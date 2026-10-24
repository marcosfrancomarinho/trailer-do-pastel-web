import { brl } from '../../api'
import type { ClosedComanda } from '../../domain/models'

const escapeHtml = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char] ?? char))

const dateTime = (value: string) => new Date(value).toLocaleString('pt-BR', {
  timeZone: 'America/Fortaleza', dateStyle: 'short', timeStyle: 'short',
})

export function printComandaReport(comandas: ClosedComanda[], date: string): void {
  const reportWindow = window.open('', '_blank')
  if (!reportWindow) {
    window.alert('Não foi possível abrir a impressão. Autorize janelas pop-up neste site e tente novamente.')
    return
  }

  const finished = comandas.map(({ tableNumber, origin, session }) => ({
    tableNumber, origin, session, orders: session.orders.filter(order => order.status === 'COMPLETED'),
  })).filter(entry => entry.orders.length > 0)
  const orderCount = finished.reduce((sum, entry) => sum + entry.orders.length, 0)
  const total = finished.reduce((sum, entry) =>
    sum + entry.orders.reduce((subtotal, order) => subtotal + Number(order.total), 0), 0)

  const rows = finished.map(({ tableNumber, origin, session, orders }) => {
    const subtotal = orders.reduce((sum, order) => sum + Number(order.total), 0)
    const orderHtml = orders.map(order => `
      <div class="order">
        <div class="line"><strong>Pedido #${escapeHtml(order.id.slice(0, 8).toUpperCase())}</strong><strong>${escapeHtml(brl(order.total))}</strong></div>
        ${order.items.map(item => `
          <p>${escapeHtml(item.quantity)}× ${escapeHtml(item.productName)}</p>
          ${item.additions.map(addition => `<p class="addition">+ ${escapeHtml(addition.quantity)}× ${escapeHtml(addition.additionName)}</p>`).join('')}
        `).join('')}
        ${order.observation ? `<p>Obs.: ${escapeHtml(order.observation)}</p>` : ''}
      </div>
    `).join('')
    return `
      <section class="comanda">
        <header class="line comanda-header">
          <strong>${origin === 'ONLINE' || tableNumber == null ? 'Pedido online' : `Mesa ${escapeHtml(tableNumber)}`} · Comanda ${escapeHtml(session.id.slice(0, 8).toUpperCase())}</strong>
          <span>Finalizado: ${session.closedAt ? escapeHtml(dateTime(session.closedAt)) : '—'}</span>
        </header>
        ${orderHtml}
        <p class="subtotal">Subtotal realizado da comanda: ${escapeHtml(brl(subtotal))}</p>
      </section>
    `
  }).join('')

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Relatório de realizados - ${escapeHtml(date)}</title>
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
  .subtotal { text-align: right; font-weight: bold; margin: 8px 0 0; }
  footer { font-size: 9pt; text-align: center; margin-top: 18px; }
  .actions { padding: 12px 0; text-align: right; }
  .actions button { border: none; background: #113147; color: #fff; border-radius: 6px; padding: 10px 18px; cursor: pointer; }
  @media print { main { padding: 0; } .actions { display: none !important; } }
</style>
</head>
<body>
<main>
  <div class="actions"><button onclick="window.print()">Imprimir relatório</button></div>
  <header class="report-header">
    <h1>TRAILER DO PASTEL</h1>
    <h2>RELATÓRIO DE PEDIDOS REALIZADOS</h2>
    <p>Data de finalização: ${escapeHtml(date.split('-').reverse().join('/'))}</p>
    <p>Emitido em: ${escapeHtml(dateTime(new Date().toISOString()))}</p>
  </header>
  <section class="summary">
    <p>Comandas com pedidos realizados: ${finished.length}</p>
    <p>Pedidos realizados: ${orderCount}</p>
    <strong>Total realizado: ${escapeHtml(brl(total))}</strong>
  </section>
  ${rows}
  <footer>Somente pedidos concluídos. Pedidos cancelados não integram este relatório.</footer>
</main>
</body>
</html>`

  reportWindow.document.open()
  reportWindow.document.write(html)
  reportWindow.document.close()
  reportWindow.focus()
}
