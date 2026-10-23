import type { SavedCustomerOrder } from '../../domain/models'

const KEY = 'pastel-orders'
const LEGACY_KEY = 'pastel-order'

export function readOrders(): SavedCustomerOrder[] {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || 'null') as unknown
    if (Array.isArray(stored)) {
      return stored.filter((value): value is SavedCustomerOrder =>
        Boolean(value && typeof value === 'object' && 'trackingToken' in value))
    }

    // Migração única: não resgata o pedido legado depois que o usuário o excluiu.
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (!legacy) return []
    const parsed = JSON.parse(legacy) as SavedCustomerOrder
    const migrated = parsed?.trackingToken ? [parsed] : []
    localStorage.setItem(KEY, JSON.stringify(migrated))
    localStorage.removeItem(LEGACY_KEY)
    return migrated
  } catch {
    return []
  }
}

export function saveOrder(order: SavedCustomerOrder): SavedCustomerOrder[] {
  const all = [order, ...readOrders().filter(saved => saved.trackingToken !== order.trackingToken)]
  localStorage.setItem(KEY, JSON.stringify(all))
  return all
}

/** Apaga apenas o histórico deste navegador, nunca o pedido do servidor. */
export function removeOrder(trackingToken: string): SavedCustomerOrder[] {
  const remaining = readOrders().filter(order => order.trackingToken !== trackingToken)
  localStorage.setItem(KEY, JSON.stringify(remaining))
  localStorage.removeItem(LEGACY_KEY)
  return remaining
}
