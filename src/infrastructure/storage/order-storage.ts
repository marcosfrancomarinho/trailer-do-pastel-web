import type { CreatedOrder } from '../../domain/models'
const KEY = 'pastel-orders'
export function readOrders(): CreatedOrder[] {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '[]') as unknown
    if (Array.isArray(stored) && stored.length) return stored.filter((x): x is CreatedOrder => Boolean(x && typeof x === 'object' && 'trackingToken' in x))
    const legacy = localStorage.getItem('pastel-order')
    return legacy ? [JSON.parse(legacy) as CreatedOrder] : []
  } catch { return [] }
}
export function saveOrder(order: CreatedOrder): CreatedOrder[] {
  const all = [order, ...readOrders().filter(p => p.trackingToken !== order.trackingToken)]
  localStorage.setItem(KEY, JSON.stringify(all))
  return all
}
