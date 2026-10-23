import type { Addition, Product, OrderPayload } from './models'
export type CartItem = { key: string; product: Product; quantity: number; additions: { addition: Addition; quantity: number }[] }
export function cartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity * (Number(item.product.price) + item.additions.reduce((price, extra) => price + Number(extra.addition.price) * extra.quantity, 0)), 0)
}
export function toOrderPayload(name: string, phone: string, cart: CartItem[]): OrderPayload {
  const customerName = name.trim()
  const customerPhone = phone.replace(/[\s()-]/g, '')
  if (!customerName) throw new Error('Informe seu nome.')
  if (!/^\d{10,11}$/.test(customerPhone)) throw new Error('Informe um telefone com DDD válido.')
  if (!cart.length) throw new Error('Adicione pelo menos um produto.')
  return { customerName, customerPhone, items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity, additions: item.additions.map(a => ({ additionId: a.addition.id, quantity: a.quantity })) })) }
}
