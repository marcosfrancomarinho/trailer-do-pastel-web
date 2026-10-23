import type { CartItem } from '../../domain/cart'

const KEY = 'trailer-pastel-cart-v1'

function positiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && typeof value === 'number' && value > 0
}

function validPrice(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<CartItem>
  if (typeof item.key !== 'string' || !item.key || !positiveInteger(item.quantity)) return false

  const product = item.product
  if (!product || typeof product.id !== 'string' || !product.id ||
      typeof product.name !== 'string' || !validPrice(product.price)) return false

  return Array.isArray(item.additions) && item.additions.every(extra =>
    extra !== null &&
    typeof extra === 'object' &&
    positiveInteger(extra.quantity) &&
    extra.addition !== null &&
    typeof extra.addition === 'object' &&
    typeof extra.addition.id === 'string' &&
    extra.addition.id.length > 0 &&
    typeof extra.addition.name === 'string' &&
    validPrice(extra.addition.price)
  )
}

/** Recupera o carrinho do próprio navegador após atualizar ou reabrir a página. */
export function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : []
  } catch {
    return []
  }
}

/** Remove os itens armazenados somente quando o carrinho ficar vazio. */
export function saveCart(items: CartItem[]): void {
  try {
    if (items.length === 0) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    // O carrinho continua disponível em memória se o armazenamento estiver bloqueado.
  }
}
